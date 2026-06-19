/**
 * Invoice flow API. Lives in its own collection (`invoices`) on the backend
 * (`/api/invoices`) and uses an `INVC-######` reference series so it never
 * collides with sales (`INV-######`).
 */

import type {
 CreateSalePayload,
 CreateSaleResponse,
 SaleRecord,
} from "../../sales-dashboard/service/salesApi";

const API_BASE_URL =
 (typeof window !== "undefined" && (window as Window & { __API_BASE_URL__?: string }).__API_BASE_URL__) ||
 `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
}

export type InvoiceRecord = SaleRecord & {
 /** Business invoice date chosen at create; when absent, UI uses createdAt. */
 occurredAt?: string;
 taxId?: string | null;
 taxName?: string;
 taxRate?: number;
 taxType?: "percentage" | "flat" | "";
 status?: "active" | "voided" | string;
};

/** Date to show in lists, PDFs, and detail (selected invoice date or record created time). */
export function invoiceDisplayDate(inv: Pick<InvoiceRecord, "occurredAt" | "createdAt">): string {
 return inv.occurredAt || inv.createdAt;
}

/** Primary payment type for list display (cash, card, bank, credit). */
export function invoicePaymentTypeLabel(
 inv: Pick<InvoiceRecord, "paymentMethod" | "payments">,
): string {
 const pm = String(inv.paymentMethod || "")
  .trim()
  .toLowerCase();
 if (pm === "cash" || pm === "card" || pm === "bank" || pm === "credit") {
  return pm.charAt(0).toUpperCase() + pm.slice(1);
 }
 const p = inv.payments;
 if (!p) return "—";
 const parts: { label: string; amount: number }[] = [
  { label: "Cash", amount: Number(p.cash) || 0 },
  { label: "Card", amount: Number(p.card) || 0 },
  { label: "Bank", amount: Number(p.bank) || 0 },
  { label: "Credit", amount: Number(p.credit) || 0 },
 ];
 const active = parts.filter((x) => x.amount > 0.001);
 if (active.length === 0) return "—";
 if (active.length === 1) return active[0].label;
 return active.map((x) => x.label).join(" + ");
}

export interface GetInvoicesResponse {
 success: boolean;
 data: InvoiceRecord[];
 meta?: { page: number; limit: number; total: number };
}

export type CreateInvoicePayload = CreateSalePayload & {
 /** Tax category ObjectId from `/api/settings/taxes/active`. Backend resolves rate/type. */
 taxId?: string | null;
};

export const invoicesApi = {
 getInvoices: async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  status?: string;
 }): Promise<GetInvoicesResponse> => {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.type) sp.set("type", params.type);
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  const response = await fetch(`${API_BASE_URL}/invoices?${sp}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch invoices");
  }
  return response.json();
 },

 updateInvoice: async (
  id: string,
  payload: Partial<CreateInvoicePayload> & Record<string, unknown>,
 ): Promise<{ success: boolean; message?: string; data?: InvoiceRecord }> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
   throw new Error((data as { message?: string }).message || "Failed to update invoice");
  }
  return data as { success: boolean; message?: string; data?: InvoiceRecord };
 },

 getInvoiceById: async (id: string): Promise<{ success: boolean; data: InvoiceRecord }> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch invoice");
  }
  return response.json();
 },

 createInvoice: async (payload: CreateInvoicePayload): Promise<CreateSaleResponse> => {
  try {
   const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
   });
   const data = await response.json().catch(() => ({}));
   if (!response.ok) {
    if (response.status === 409 || data?.code === "REFERENCE_TAKEN") {
     return { success: false, message: data?.message || "Invoice number is already in use." };
    }
    return { success: false, message: data?.message || "Failed to save invoice" };
   }
   return data as CreateSaleResponse;
  } catch (e) {
   return { success: false, message: e instanceof Error ? e.message : "Failed to save invoice" };
  }
 },

 voidInvoice: async (
  id: string,
  reason?: string,
 ): Promise<{ success: boolean; message?: string; data?: { _id: string; reference: string } }> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
   body: JSON.stringify(reason ? { reason } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { message?: string }).message || "Failed to void invoice");
  return data;
 },

 sendInvoiceEmail: async (
  id: string,
  payload: { to: string; pdfBase64: string; filename: string }
 ): Promise<{ success: boolean; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}/send-email`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
   throw new Error((data as { message?: string }).message || "Failed to send invoice email");
  }
  return data as { success: boolean; message?: string };
 },

 checkReference: async (
  reference: string,
  signal?: AbortSignal,
  excludeId?: string,
 ): Promise<{
  success: boolean;
  data: {
   reference: string;
   exists: boolean;
   valid: boolean;
   reason?: string;
   nextAvailable?: string;
  };
 }> => {
  const params = new URLSearchParams();
  params.set("reference", reference || "");
  if (excludeId) params.set("excludeId", excludeId);
  const response = await fetch(`${API_BASE_URL}/invoices/check-reference?${params}`, {
   method: "GET",
   headers: getAuthHeaders(),
   signal,
  });
  if (!response.ok) {
   return { success: false, data: { reference, exists: false, valid: false, reason: "request_failed" } };
  }
  return response.json();
 },
};

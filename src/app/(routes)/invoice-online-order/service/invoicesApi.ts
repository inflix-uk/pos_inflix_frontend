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
 taxId?: string | null;
 taxName?: string;
 taxRate?: number;
 taxType?: "percentage" | "flat" | "";
};

export interface GetInvoicesResponse {
 success: boolean;
 data: InvoiceRecord[];
 meta?: { page: number; limit: number; total: number };
}

export interface CreateInvoicePayload extends CreateSalePayload {
 /** Tax category ObjectId from `/api/settings/taxes/active`. Backend resolves rate/type. */
 taxId?: string | null;
}

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

 checkReference: async (
  reference: string,
  signal?: AbortSignal,
 ): Promise<{ success: boolean; data: { reference: string; exists: boolean; valid: boolean; reason?: string } }> => {
  const q = encodeURIComponent(reference || "");
  const response = await fetch(`${API_BASE_URL}/invoices/check-reference?reference=${q}`, {
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

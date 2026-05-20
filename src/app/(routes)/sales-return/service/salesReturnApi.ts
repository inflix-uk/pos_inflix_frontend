import type { SalesReturn, SalesReturnFilters, SalesReturnListResponse } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

function toPayload(data: Partial<SalesReturn>): Record<string, unknown> {
 return {
  customerName: data.customer?.name ?? "",
  date: data.date ?? new Date().toISOString().slice(0, 10),
  reference: data.reference ?? "",
  linkedInvoiceRef: data.linkedInvoiceRef ?? "",
  status: data.status ?? "Pending",
  paymentStatus: data.paymentStatus ?? "Unpaid",
  items: (data.items ?? []).map((it) => ({
   product: it.product,
   sku: it.sku ?? "",
   netUnitPrice: it.netUnitPrice,
   stock: it.stock,
   quantity: it.quantity,
   discount: it.discount,
   taxPercent: it.taxPercent,
   subtotal: it.subtotal,
   serialNumbers: Array.isArray(it.serialNumbers) ? it.serialNumbers : [],
   returnDestination: it.returnDestination ?? "restock",
  })),
  orderTax: data.orderTax ?? 0,
  discount: data.discount ?? 0,
  shipping: data.shipping ?? 0,
  paid: data.paid ?? 0,
 };
}

export const salesReturnApi = {
 getList: async (filters?: SalesReturnFilters): Promise<SalesReturnListResponse> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.status && filters.status !== "All") params.append("status", filters.status);
  if (filters?.customer && filters.customer !== "All") params.append("customer", filters.customer);
  if (filters?.paymentStatus && filters.paymentStatus !== "All") params.append("paymentStatus", filters.paymentStatus);
  if (filters?.page != null) params.append("page", String(filters.page));
  if (filters?.limit != null) params.append("limit", String(filters.limit));

  const res = await fetch(`${API_URL}/api/sales-returns?${params}`, {
   method: "GET",
   headers: getAuthHeaders(),
   credentials: "include",
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch sales returns");
  }
  return res.json();
 },

 getById: async (id: string): Promise<{ success: boolean; data: SalesReturn }> => {
  const res = await fetch(`${API_URL}/api/sales-returns/${id}`, {
   method: "GET",
   headers: getAuthHeaders(),
   credentials: "include",
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch sales return");
  }
  return res.json();
 },

 create: async (
  data: Partial<SalesReturn> & { returnType?: "store_credit" | "refund"; customerId?: string; refundMethod?: string; refundAccountId?: string }
 ): Promise<{ success: boolean; data: SalesReturn; message?: string }> => {
  const body: Record<string, unknown> = { ...toPayload(data) };
  if (data.returnType) body.returnType = data.returnType;
  if (data.customerId) body.customerId = data.customerId;
  if (data.refundMethod) body.refundMethod = data.refundMethod;
  if (data.refundAccountId) body.refundAccountId = data.refundAccountId;
  const res = await fetch(`${API_URL}/api/sales-returns`, {
   method: "POST",
   headers: getAuthHeaders(),
   credentials: "include",
   body: JSON.stringify(body),
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error(err.message || "Failed to create sales return");
  }
  return res.json();
 },

 update: async (id: string, data: Partial<SalesReturn>): Promise<{ success: boolean; data: SalesReturn; message?: string }> => {
  const res = await fetch(`${API_URL}/api/sales-returns/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   credentials: "include",
   body: JSON.stringify(toPayload(data)),
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error(err.message || "Failed to update sales return");
  }
  return res.json();
 },

 delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
  const res = await fetch(`${API_URL}/api/sales-returns/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
   credentials: "include",
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error(err.message || "Failed to delete sales return");
  }
  return res.json();
 },
};

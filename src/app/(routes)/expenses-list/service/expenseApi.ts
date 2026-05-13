import type { Expense, ExpenseFormData, ExpenseFilters } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface ListResponse {
 data: Expense[];
 pagination: { page: number; limit: number; total: number; pages: number };
}

export const expenseApi = {
 list: async (filters: ExpenseFilters = {}): Promise<ListResponse> => {
  const params = new URLSearchParams();
  if (filters.fromUtc) params.set("fromUtc", filters.fromUtc);
  if (filters.toUtc) params.set("toUtc", filters.toUtc);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.search) params.set("search", filters.search);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  const res = await fetch(`${API_URL}/api/expenses?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch expenses");
  }
  return res.json().then((json) => json as { success: boolean; data: Expense[]; pagination: ListResponse["pagination"] }).then((j) => ({ data: j.data, pagination: j.pagination }));
 },

 getById: async (id: string): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   if (res.status === 404) throw new Error("Expense not found");
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch expense");
  }
  const json = await res.json();
  return json.data;
 },

 create: async (data: ExpenseFormData): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to create expense");
  return json.data;
 },

 update: async (id: string, data: Partial<ExpenseFormData>): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to update expense");
  return json.data;
 },

 submit: async (id: string): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}/submit`, { method: "POST", headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to submit");
  return json.data;
 },

 approve: async (id: string): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}/approve`, { method: "POST", headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to approve");
  return json.data;
 },

 reject: async (id: string, reason?: string): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}/reject`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ reason: reason ?? "" }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to reject");
  return json.data;
 },

 markPaid: async (id: string): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}/mark-paid`, { method: "POST", headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to mark paid");
  return json.data;
 },

 void: async (id: string, voidReason: string): Promise<Expense> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}/void`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ voidReason }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to void");
  return json.data;
 },

 delete: async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/api/expenses/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to delete expense");
 },
};

import type { ExpenseCategory, ExpenseCategoryFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export const expenseCategoryApi = {
 getAll: async (includeInactive = false): Promise<ExpenseCategory[]> => {
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");
  const res = await fetch(`${API_URL}/api/expense-categories?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch categories");
  }
  const json = await res.json();
  return json.data ?? [];
 },

 getById: async (id: string): Promise<ExpenseCategory> => {
  const res = await fetch(`${API_URL}/api/expense-categories/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   if (res.status === 404) throw new Error("Category not found");
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch category");
  }
  const json = await res.json();
  return json.data;
 },

 create: async (data: ExpenseCategoryFormData): Promise<ExpenseCategory> => {
  const res = await fetch(`${API_URL}/api/expense-categories`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to create category");
  return json.data;
 },

 update: async (id: string, data: Partial<ExpenseCategoryFormData>): Promise<ExpenseCategory> => {
  const res = await fetch(`${API_URL}/api/expense-categories/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to update category");
  return json.data;
 },

 setInactive: async (id: string): Promise<ExpenseCategory> => {
  const res = await fetch(`${API_URL}/api/expense-categories/${id}/set-inactive`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to set inactive");
  return json.data;
 },

 archive: async (id: string): Promise<ExpenseCategory> => {
  const res = await fetch(`${API_URL}/api/expense-categories/${id}/archive`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to archive");
  return json.data;
 },
};

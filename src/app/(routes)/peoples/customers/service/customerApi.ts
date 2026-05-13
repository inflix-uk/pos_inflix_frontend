import { Customer, CustomerFormData, CustomerFilters, CustomerResponse } from "../types";

/**
 * Single source for all customer data in the system.
 * Used by: Customers page, POS/wholesale (create-sales), repairs, sales return, account statement, purchases.
 * Backend: one Customer model, one /api/customers — same database everywhere.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const customerApi = {
 getAll: async (filters?: CustomerFilters): Promise<CustomerResponse> => {
  try {
   const params = new URLSearchParams();
   if (filters?.search) params.append("search", filters.search);
   if (filters?.status === "active") params.append("isActive", "true");
   if (filters?.status === "inactive") params.append("isActive", "false");
   if (filters?.sortBy) params.append("sortBy", filters.sortBy);
   if (filters?.page != null) params.append("page", String(filters.page));
   if (filters?.limit != null) params.append("limit", String(filters.limit));
   if (filters?.useInRepairs === true) params.append("useInRepairs", "true");
   if (filters?.pricingGroupId != null && filters.pricingGroupId !== "") params.append("pricingGroupId", String(filters.pricingGroupId));

   const response = await fetch(`${API_URL}/api/customers?${params}`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
   });
   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch customers");
   }
   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to fetch customers");
  }
 },

 getById: async (id: string): Promise<{ success: boolean; data: Customer }> => {
  try {
   const response = await fetch(`${API_URL}/api/customers/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return response.json();
  } catch {
   throw new Error("Failed to fetch customer");
  }
 },

 /** Get or create the Walk-in customer (for Retail mode on Create Sales). */
 getWalkIn: async (): Promise<{ success: boolean; data: Customer }> => {
  const response = await fetch(`${API_URL}/api/customers/walk-in`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  return response.json();
 },

 create: async (data: CustomerFormData): Promise<{ success: boolean; data: Customer }> => {
  try {
   const response = await fetch(`${API_URL}/api/customers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return response.json();
  } catch {
   throw new Error("Failed to create customer");
  }
 },

 update: async (id: string, data: Partial<CustomerFormData>): Promise<{ success: boolean; data: Customer }> => {
  try {
   const response = await fetch(`${API_URL}/api/customers/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return response.json();
  } catch {
   throw new Error("Failed to update customer");
  }
 },

 delete: async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
   const response = await fetch(`${API_URL}/api/customers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return response.json();
  } catch {
   throw new Error("Failed to delete customer");
  }
 },

 /** Delete the most recently created customer(s). Use after import to undo. */
 deleteRecent: async (limit = 1): Promise<{ success: boolean; message: string; deleted: number }> => {
  const response = await fetch(
   `${API_URL}/api/customers/recent?limit=${Math.min(Math.max(limit, 1), 100)}`,
   { method: "DELETE", headers: getAuthHeaders() }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete");
  return data;
 },
};

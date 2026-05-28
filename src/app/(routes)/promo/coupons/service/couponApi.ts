import { Coupon } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

// Helper to get auth token
const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const couponApi = {
 getAll: async (): Promise<Coupon[]> => {
  const response = await fetch(`${API_URL}/api/coupons`, {
   headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch coupons");
  const result = await response.json();
  return result.data || result;
 },

 getById: async (id: string): Promise<Coupon> => {
  const response = await fetch(`${API_URL}/api/coupons/${id}`, {
   headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch coupon");
  const result = await response.json();
  return result.data || result;
 },

 create: async (data: Omit<Coupon, "id">): Promise<Coupon> => {
  const response = await fetch(`${API_URL}/api/coupons`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create coupon");
  const result = await response.json();
  return result.data || result;
 },

 update: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
  const response = await fetch(`${API_URL}/api/coupons/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update coupon");
  const result = await response.json();
  return result.data || result;
 },

 delete: async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/coupons/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete coupon");
 },

 validate: async (code: string, orderAmount?: number): Promise<{ coupon: Coupon; discountAmount: number }> => {
  const response = await fetch(`${API_URL}/api/coupons/validate`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ code, orderAmount }),
  });
  if (!response.ok) {
   const error = await response.json();
   throw new Error(error.message || "Failed to validate coupon");
  }
  const result = await response.json();
  return result.data;
 },
};

import { ExpiredProduct, ApiResponse } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const expiredProductApi = {
 // Get expired products
 getExpired: async (): Promise<ApiResponse<ExpiredProduct[]>> => {
  try {
   const response = await fetch(`${API_URL}/api/products/expired`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   if (!response.ok) {
    throw new Error("Failed to fetch expired products");
   }

   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to fetch expired products");
  }
 },

 // Get expiring soon products
 getExpiringSoon: async (): Promise<ApiResponse<ExpiredProduct[]>> => {
  try {
   const response = await fetch(`${API_URL}/api/products/expiring-soon`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   if (!response.ok) {
    throw new Error("Failed to fetch expiring soon products");
   }

   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to fetch expiring soon products");
  }
 },

 // Get categories for filter
 getCategories: async (): Promise<{ value: string; label: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/categories`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((cat: { _id: string; name: string }) => ({
    value: cat._id,
    label: cat.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Get warehouses for filter
 getWarehouses: async (): Promise<{ value: string; label: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/warehouses/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((warehouse: { _id: string; name: string }) => ({
    value: warehouse._id,
    label: warehouse.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Get stores for filter
 getStores: async (): Promise<{ value: string; label: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/stores/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((store: { _id: string; name: string }) => ({
    value: store._id,
    label: store.name,
   })) || [];
  } catch {
   return [];
  }
 },
};

export default expiredProductApi;

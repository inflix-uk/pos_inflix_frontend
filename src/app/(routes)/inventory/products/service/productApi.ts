import { Product, ProductFilters, ProductResponse, ProductApiResponse } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const productApi = {
 // Get all products with filters
 getAll: async (filters?: ProductFilters): Promise<ProductResponse> => {
  try {
   const params = new URLSearchParams();
   if (filters?.search) params.append("search", filters.search);
   if (filters?.category) params.append("category", filters.category);
   if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));
   if (filters?.lowStock) params.append("lowStock", String(filters.lowStock));
   if (filters?.page) params.append("page", String(filters.page));
   if (filters?.limit) params.append("limit", String(filters.limit));
   if (filters?.productType) params.append("productType", filters.productType);

   const response = await fetch(`${API_URL}/api/products?${params}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch products");
   }

   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to fetch products");
  }
 },

 // Get single product by ID
 getById: async (id: string): Promise<ProductApiResponse<Product>> => {
  try {
   const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch product");
   }

   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to fetch product");
  }
 },

 // Delete product
 delete: async (id: string): Promise<ProductApiResponse<null>> => {
  try {
   const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete product");
   }

   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to delete product");
  }
 },

 // Get sales history for a serial number
 getSerialHistory: async (serialNumber: string): Promise<{
  success: boolean;
  serialNumber: string;
  count: number;
  data: Array<{
   _id: string;
   reference: string;
   type: string;
   customerName?: string;
   total: number;
   createdAt: string;
   items: Array<{ sku: string; name: string; quantity: number; price: number; serialNumbers?: string[] }>;
  }>;
 }> => {
  const encoded = encodeURIComponent(serialNumber.trim());
  const response = await fetch(`${API_URL}/api/products/serial-history/${encoded}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch serial history");
  }
  return response.json();
 },

 // Get categories for filter dropdown
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
};

export default productApi;

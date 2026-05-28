import { ApiResponse, SelectOption } from "../types";
import { ProductApiData, UpdateProductPayload } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const editProductApi = {
 // Get product by ID
 getById: async (id: string): Promise<ProductApiData> => {
  try {
   const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch product");
   }

   const data = await response.json();
   return data.data;
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to fetch product");
  }
 },

 // Get group prices for this product
 getGroupPrices: async (id: string): Promise<{ success: boolean; data: Array<{ pricingGroupId: string; pricingGroupName?: string; price: number }> }> => {
  const response = await fetch(`${API_URL}/api/products/${id}/group-prices`, { method: "GET", headers: getAuthHeaders() });
  return response.json();
 },

 // Set group prices for this product
 putGroupPrices: async (id: string, groupPrices: Array<{ pricingGroupId: string; price: number }>): Promise<{ success: boolean; data: Array<{ pricingGroupId: string; pricingGroupName?: string; price: number }> }> => {
  const response = await fetch(`${API_URL}/api/products/${id}/group-prices`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify({ groupPrices }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to save group prices");
  }
  return response.json();
 },

 // Update product
 update: async (id: string, data: UpdateProductPayload): Promise<ApiResponse<ProductApiData>> => {
  try {
   const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update product");
   }

   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to update product");
  }
 },

 // Fetch categories for dropdown
 getCategories: async (): Promise<SelectOption[]> => {
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

 // Fetch sub-categories for dropdown
 getSubCategories: async (categoryId?: string): Promise<SelectOption[]> => {
  try {
   const url = categoryId
    ? `${API_URL}/api/subcategories?category=${categoryId}`
    : `${API_URL}/api/subcategories`;
   const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((sub: { _id: string; name: string }) => ({
    value: sub._id,
    label: sub.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch brands for dropdown
 getBrands: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/brands/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((brand: { _id: string; name: string }) => ({
    value: brand._id,
    label: brand.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch stores for dropdown
 getStores: async (): Promise<SelectOption[]> => {
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

 // Fetch warehouses for dropdown
 getWarehouses: async (): Promise<SelectOption[]> => {
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

 // Fetch warranties for dropdown
 getWarranties: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/warranties/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((warranty: { _id: string; name: string }) => ({
    value: warranty._id,
    label: warranty.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch units for dropdown
 getUnits: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/units`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((unit: { _id: string; name: string }) => ({
    value: unit._id,
    label: unit.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Create Store
 createStore: async (data: {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/stores`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create store");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Warehouse
 createWarehouse: async (data: {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/warehouses`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create warehouse");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Category
 createCategory: async (data: {
  name: string;
  slug: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/categories`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create category");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Sub-Category
 createSubCategory: async (data: {
  name: string;
  slug: string;
  category: string;
  code: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/subcategories`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create sub-category");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Unit
 createUnit: async (data: {
  name: string;
  shortName: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/units`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create unit");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Brand
 createBrand: async (data: {
  name: string;
  slug: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/brands`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create brand");
  }
  const result = await response.json();
  return result.data;
 },

 // Upload multiple images
 uploadImages: async (files: File[]): Promise<{ url: string; filename: string }[]> => {
  try {
   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
   const formData = new FormData();
   files.forEach((file) => {
    formData.append("images", file);
   });

   const response = await fetch(`${API_URL}/api/upload/images`, {
    method: "POST",
    headers: {
     Authorization: `Bearer ${token}`,
    },
    body: formData,
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload images");
   }

   const data = await response.json();
   return data.data.map((img: { url: string; filename: string }) => ({
    url: `${API_URL}${img.url}`,
    filename: img.filename,
   }));
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to upload images");
  }
 },
};

export default editProductApi;

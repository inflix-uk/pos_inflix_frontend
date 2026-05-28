import type {
 LowStockProduct,
 LowStockResponse,
 LowStockRow,
 LowStocksApiParams,
 LowStocksApiResponse,
 InventorySettingsData,
} from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const lowStockApi = {
 /** New: GET /api/inventory/low-stocks (available qty from StockBalance + SerialLocation, threshold-aware) */
 getLowStocks: async (params: LowStocksApiParams = {}): Promise<LowStocksApiResponse> => {
  const searchParams = new URLSearchParams();
  if (params.locationId) searchParams.set("locationId", params.locationId);
  if (params.threshold != null) searchParams.set("threshold", String(params.threshold));
  if (params.q) searchParams.set("q", params.q);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.supplierId) searchParams.set("supplierId", params.supplierId);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  const res = await fetch(`${API_URL}/api/inventory/low-stocks?${searchParams}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch low stocks");
  }
  return res.json();
 },

 /** GET /api/settings/inventory - includes defaultLowStockThreshold */
 getInventorySettings: async (): Promise<{ success: boolean; data: InventorySettingsData }> => {
  const res = await fetch(`${API_URL}/api/settings/inventory`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch inventory settings");
  return res.json();
 },

 /** PUT /api/settings/inventory - update defaultLowStockThreshold (requires inventory.settings.manage or settings.edit) */
 updateInventorySettings: async (body: { defaultLowStockThreshold?: number }): Promise<{ success: boolean; data: InventorySettingsData }> => {
  const res = await fetch(`${API_URL}/api/settings/inventory`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(body),
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to update settings");
  }
  return res.json();
 },

 /** PUT /api/products/:id/low-stock-threshold - per-product override; pass null to reset to default */
 updateProductLowStockThreshold: async (
  productId: string,
  lowStockThreshold: number | null
 ): Promise<{ success: boolean; data: { _id: string; lowStockThreshold: number | null } }> => {
  const res = await fetch(`${API_URL}/api/products/${productId}/low-stock-threshold`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify({ lowStockThreshold }),
  });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to update threshold");
  }
  return res.json();
 },

 // Legacy: Get low stock products (quantity <= minStockLevel)
 getLowStock: async (): Promise<LowStockResponse> => {
  const response = await fetch(`${API_URL}/api/products/low-stock`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error((error as { message?: string }).message || "Failed to fetch low stock products");
  }
  return response.json();
 },

 getOutOfStock: async (): Promise<LowStockResponse> => {
  const response = await fetch(`${API_URL}/api/products?lowStock=true`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error((error as { message?: string }).message || "Failed to fetch out of stock products");
  }
  const data = await response.json();
  const outOfStock = (data.data || []).filter((p: LowStockProduct) => p.quantity === 0);
  return { success: true, count: outOfStock.length, data: outOfStock };
 },

 updateStock: async (
  id: string,
  data: { quantity: number; type: "in" | "out" | "adjustment"; reason?: string; locationId?: string }
 ): Promise<{ success: boolean; data: LowStockProduct }> => {
  const response = await fetch(`${API_URL}/api/products/${id}/stock`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error((error as { message?: string }).message || "Failed to update stock");
  }
  return response.json();
 },

 getCategories: async (): Promise<{ value: string; label: string }[]> => {
  const response = await fetch(`${API_URL}/api/categories`, { method: "GET", headers: getAuthHeaders() });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.data || []).map((cat: { _id: string; name: string }) => ({
   value: cat._id,
   label: cat.name,
  }));
 },

 getLocations: async (): Promise<{ value: string; label: string }[]> => {
  const response = await fetch(`${API_URL}/api/locations?limit=500`, { method: "GET", headers: getAuthHeaders() });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.data || []).map((loc: { _id: string; name: string; type?: string }) => ({
   value: loc._id,
   label: `${loc.name}${loc.type ? ` (${loc.type})` : ""}`,
  }));
 },
};

export default lowStockApi;

import { Purchase, PurchaseFormData } from "../types";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

interface ApiResponse<T> {
 success: boolean;
 data?: T;
 message?: string;
 pages?: number;
 total?: number;
}

interface GetPurchasesParams {
 search?: string;
 status?: string;
 paymentStatus?: string;
 completionStatus?: string;
 page?: number;
 limit?: number;
 sort?: string;
}

export const purchaseApi = {
 getPurchases: async (params: GetPurchasesParams = {}): Promise<ApiResponse<Purchase[]>> => {
  try {
   const queryParams = new URLSearchParams();
   if (params.search) queryParams.append("search", params.search);
   if (params.status) queryParams.append("status", params.status);
   if (params.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);
   if (params.completionStatus) queryParams.append("completionStatus", params.completionStatus);
   if (params.page) queryParams.append("page", params.page.toString());
   if (params.limit) queryParams.append("limit", params.limit.toString());
   if (params.sort) queryParams.append("sort", params.sort);

   const response = await fetch(`${API_BASE_URL}/purchases?${queryParams.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   const data = await response.json();
   return data;
  } catch (error) {
   console.error("Error fetching purchases:", error);
   return { success: false, message: "Failed to fetch purchases" };
  }
 },

 getPurchaseById: async (id: string): Promise<ApiResponse<Purchase>> => {
  try {
   const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });

   const data = await response.json();
   return data;
  } catch (error) {
   console.error("Error fetching purchase:", error);
   return { success: false, message: "Failed to fetch purchase" };
  }
 },

 createPurchase: async (purchaseData: PurchaseFormData): Promise<ApiResponse<Purchase>> => {
  try {
   const response = await fetch(`${API_BASE_URL}/purchases`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(purchaseData),
   });

   const data = await response.json();
   if (!response.ok) {
    return { success: false, message: (data && data.message) || response.statusText || "Failed to create purchase" };
   }
   if (!data.success && data.message) {
    return { success: false, message: data.message };
   }
   return data;
  } catch (error) {
   console.error("Error creating purchase:", error);
   return { success: false, message: error instanceof Error ? error.message : "Failed to create purchase" };
  }
 },

 updatePurchase: async (id: string, purchaseData: Partial<PurchaseFormData>): Promise<ApiResponse<Purchase>> => {
  try {
   const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(purchaseData),
   });

   const data = await response.json();
   return data;
  } catch (error) {
   console.error("Error updating purchase:", error);
   return { success: false, message: "Failed to update purchase" };
  }
 },

 deletePurchase: async (id: string): Promise<ApiResponse<null>> => {
  try {
   const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });

   const data = await response.json();
   return data;
  } catch (error) {
   console.error("Error deleting purchase:", error);
   return { success: false, message: "Failed to delete purchase" };
  }
 },

 /** Find in-stock item by serial/IMEI. Returns purchaseId & purchaseItemId for return flow. */
 findInStockBySerial: async (
  serial: string
 ): Promise<
  ApiResponse<{ sku: string; name: string; price: number; category: string; brand: string; serial: string; purchaseId?: string; purchaseItemId?: string }>
 > => {
  try {
   const response = await fetch(
    `${API_BASE_URL}/purchases/find-in-stock-serial/${encodeURIComponent(serial.trim())}`,
    { method: "GET", headers: getAuthHeaders() }
   );
   const data = await response.json();
   return data;
  } catch (error) {
   console.error("Error finding serial:", error);
   return { success: false, message: "Failed to find serial" };
  }
 },
};

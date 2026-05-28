import { Tax, TaxFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
 success: boolean;
 message?: string;
 data?: T;
 count?: number;
}

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const taxApi = {
 /**
  * Get all taxes
  */
 getTaxes: async (): Promise<ApiResponse<Tax[]>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch taxes");
  }
 },

 /**
  * Get single tax
  */
 getTax: async (id: string): Promise<ApiResponse<Tax>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch tax");
  }
 },

 /**
  * Get active taxes
  */
 getActiveTaxes: async (): Promise<ApiResponse<Tax[]>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch active taxes");
  }
 },

 /**
  * Create tax
  */
 createTax: async (data: TaxFormData): Promise<ApiResponse<Tax>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
     ...data,
     rate: parseFloat(data.rate),
    }),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create tax");
  }
 },

 /**
  * Update tax
  */
 updateTax: async (id: string, data: Partial<TaxFormData>): Promise<ApiResponse<Tax>> => {
  try {
   const payload: Record<string, unknown> = { ...data };
   if (data.rate) {
    payload.rate = parseFloat(data.rate);
   }

   const response = await fetch(`${API_URL}/api/settings/taxes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update tax");
  }
 },

 /**
  * Delete tax
  */
 deleteTax: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete tax");
  }
 },

 /**
  * Set tax as default
  */
 setDefault: async (id: string): Promise<ApiResponse<Tax>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes/${id}/set-default`, {
    method: "PUT",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to set default tax");
  }
 },
};

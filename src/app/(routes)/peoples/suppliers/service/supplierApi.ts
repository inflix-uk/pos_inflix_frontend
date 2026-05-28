import { SupplierFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
 success: boolean;
 message?: string;
 data?: T;
 count?: number;
 total?: number;
 page?: number;
 pages?: number;
}

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const supplierApi = {
 getSuppliers: async (params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
 }): Promise<ApiResponse> => {
  try {
   const queryParams = new URLSearchParams();
   if (params?.search) queryParams.append("search", params.search);
   if (params?.isActive !== undefined)
    queryParams.append("isActive", String(params.isActive));
   if (params?.page) queryParams.append("page", String(params.page));
   if (params?.limit) queryParams.append("limit", String(params.limit));
   if (params?.sort) queryParams.append("sort", params.sort);

   const response = await fetch(
    `${API_URL}/api/suppliers?${queryParams.toString()}`,
    {
     method: "GET",
     headers: getAuthHeaders(),
    }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to fetch suppliers");
  }
 },

 getSupplier: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/suppliers/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch supplier");
  }
 },

 createSupplier: async (data: SupplierFormData): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/suppliers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create supplier");
  }
 },

 updateSupplier: async (
  id: string,
  data: Partial<SupplierFormData>
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/suppliers/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update supplier");
  }
 },

 deleteSupplier: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/suppliers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete supplier");
  }
 },
};

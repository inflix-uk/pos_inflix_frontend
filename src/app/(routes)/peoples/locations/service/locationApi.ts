import { LocationFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export const locationApi = {
 getLocations: async (params?: {
  search?: string;
  isActive?: boolean;
  type?: string;
  page?: number;
  limit?: number;
  sort?: string;
 }): Promise<ApiResponse> => {
  try {
   const queryParams = new URLSearchParams();
   if (params?.search) queryParams.append("search", params.search);
   if (params?.isActive !== undefined)
    queryParams.append("isActive", String(params.isActive));
   if (params?.type) queryParams.append("type", params.type);
   if (params?.page) queryParams.append("page", String(params.page));
   if (params?.limit) queryParams.append("limit", String(params.limit));
   if (params?.sort) queryParams.append("sort", params.sort);

   const response = await fetch(
    `${API_URL}/api/locations?${queryParams.toString()}`,
    {
     method: "GET",
     headers: getAuthHeaders(),
    }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to fetch locations");
  }
 },

 getLocation: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/locations/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch location");
  }
 },

 createLocation: async (data: LocationFormData): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/locations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create location");
  }
 },

 updateLocation: async (
  id: string,
  data: Partial<LocationFormData>
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/locations/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update location");
  }
 },

 deleteLocation: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/locations/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete location");
  }
 },
};

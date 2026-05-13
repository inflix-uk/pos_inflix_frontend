import { VariantAttributeFormData } from "../types";

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

export const variantAttributeApi = {
 /**
  * Get all variant attributes with optional filters
  */
 getVariantAttributes: async (params?: {
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
    `${API_URL}/api/variant-attributes?${queryParams.toString()}`,
    {
     method: "GET",
     headers: getAuthHeaders(),
    }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to fetch variant attributes");
  }
 },

 /**
  * Get single variant attribute by ID
  */
 getVariantAttribute: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch variant attribute");
  }
 },

 /**
  * Get single variant attribute by slug
  */
 getVariantAttributeBySlug: async (slug: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/slug/${slug}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch variant attribute");
  }
 },

 /**
  * Get active variant attributes (for dropdown)
  */
 getActiveVariantAttributes: async (): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch active variant attributes");
  }
 },

 /**
  * Create new variant attribute
  */
 createVariantAttribute: async (data: VariantAttributeFormData): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create variant attribute");
  }
 },

 /**
  * Update variant attribute
  */
 updateVariantAttribute: async (
  id: string,
  data: Partial<VariantAttributeFormData>
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update variant attribute");
  }
 },

 /**
  * Delete variant attribute
  */
 deleteVariantAttribute: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete variant attribute");
  }
 },

 /**
  * Check if a variant value is in use (purchase items)
  */
 checkVariantValueUsage: async (
  attributeSlug: string,
  value: string
 ): Promise<ApiResponse & { inUse?: boolean; count?: number }> => {
  try {
   const params = new URLSearchParams({
    attributeSlug,
    value: value.trim(),
   });
   const response = await fetch(
    `${API_URL}/api/variant-attributes/check-value-usage?${params}`,
    { method: "GET", headers: getAuthHeaders() }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to check variant value usage");
  }
 },

 /**
  * Replace a variant value in purchases then remove it from the attribute.
  * When value is in use, replacementValueName is required.
  */
 replaceAndRemoveVariantValue: async (
  attributeId: string,
  valueNameToRemove: string,
  replacementValueName?: string
 ): Promise<ApiResponse & { inUse?: boolean; count?: number; replacementOptions?: Array<{ _id: string; name: string; slug?: string }> }> => {
  try {
   const response = await fetch(
    `${API_URL}/api/variant-attributes/${attributeId}/values/replace-and-remove`,
    {
     method: "POST",
     headers: getAuthHeaders(),
     body: JSON.stringify({
      valueNameToRemove: valueNameToRemove.trim(),
      replacementValueName: replacementValueName?.trim() || undefined,
     }),
    }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to replace and remove variant value");
  }
 },
};

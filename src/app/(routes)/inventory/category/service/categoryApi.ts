import { CategoryFormData } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

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
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const categoryApi = {
 /**
  * Get all categories
  */
 getCategories: async (params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  /** slim=true: return only _id, name, icon, variantAttributes (excludes the large variantAttributeValues tree) */
  slim?: boolean;
 }): Promise<ApiResponse> => {
  try {
   const queryParams = new URLSearchParams();
   if (params?.search) queryParams.append("search", params.search);
   if (params?.isActive !== undefined)
    queryParams.append("isActive", String(params.isActive));
   if (params?.page) queryParams.append("page", String(params.page));
   if (params?.limit) queryParams.append("limit", String(params.limit));
   if (params?.slim) queryParams.set("slim", "1");

   const response = await fetch(
    `${API_URL}/api/categories?${queryParams.toString()}`,
    {
     method: "GET",
     headers: getAuthHeaders(),
    }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to fetch categories");
  }
 },

 /**
  * Get single category (with variant attributes populated)
  */
 getCategory: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch category");
  }
 },

 /**
  * Get variant attributes assigned to a category
  */
 getCategoryVariantAttributes: async (categoryId: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(
    `${API_URL}/api/categories/${categoryId}/variant-attributes`,
    { method: "GET", headers: getAuthHeaders() }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to fetch category variant attributes");
  }
 },

 /**
  * Get category by slug
  */
 getCategoryBySlug: async (slug: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/categories/slug/${slug}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch category");
  }
 },

 /**
  * Create new category
  */
 createCategory: async (data: CategoryFormData): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create category");
  }
 },

 /**
  * Update category
  */
 updateCategory: async (
  id: string,
  data: Partial<CategoryFormData>
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update category");
  }
 },

 /**
  * Delete category
  */
 deleteCategory: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete category");
  }
 },

 /**
  * Delete variant value at path (category tree).
  * If value is in use, pass replacementValueName to replace then delete.
  * Returns success or { success: false, inUse: true, count, replacementOptions }.
  */
 deleteCategoryVariantValueAtPath: async (
  categoryId: string,
  attributeId: string,
  path: string[],
  replacementValueName?: string
 ): Promise<
  ApiResponse & {
   inUse?: boolean;
   count?: number;
   replacementOptions?: Array<{ _id: string; name: string; slug?: string }>;
  }
 > => {
  const response = await fetch(
   `${API_URL}/api/categories/${categoryId}/variant-attributes/${attributeId}/values/delete-at-path`,
   {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({
     path,
     ...(replacementValueName != null && replacementValueName !== ""
      ? { replacementValueName: replacementValueName.trim() }
      : {}),
    }),
   }
  );
  return await response.json();
 },
};

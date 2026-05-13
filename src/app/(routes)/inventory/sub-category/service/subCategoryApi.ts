import { SubCategoryFormData } from "../types";

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
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const subCategoryApi = {
 /**
  * Get all sub-categories
  */
 getSubCategories: async (params?: {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
 }): Promise<ApiResponse> => {
  try {
   const queryParams = new URLSearchParams();
   if (params?.search) queryParams.append("search", params.search);
   if (params?.category) queryParams.append("category", params.category);
   if (params?.isActive !== undefined)
    queryParams.append("isActive", String(params.isActive));
   if (params?.page) queryParams.append("page", String(params.page));
   if (params?.limit) queryParams.append("limit", String(params.limit));

   const response = await fetch(
    `${API_URL}/api/subcategories?${queryParams.toString()}`,
    {
     method: "GET",
     headers: getAuthHeaders(),
    }
   );
   return await response.json();
  } catch {
   throw new Error("Failed to fetch sub-categories");
  }
 },

 /**
  * Get single sub-category
  */
 getSubCategory: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/subcategories/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch sub-category");
  }
 },

 /**
  * Create new sub-category
  */
 createSubCategory: async (data: SubCategoryFormData): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/subcategories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create sub-category");
  }
 },

 /**
  * Update sub-category
  */
 updateSubCategory: async (
  id: string,
  data: Partial<SubCategoryFormData>
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/subcategories/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update sub-category");
  }
 },

 /**
  * Delete sub-category
  */
 deleteSubCategory: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/subcategories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete sub-category");
  }
 },

 /**
  * Get categories for dropdown
  */
 getCategories: async (): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/categories?isActive=true`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch categories");
  }
 },
};

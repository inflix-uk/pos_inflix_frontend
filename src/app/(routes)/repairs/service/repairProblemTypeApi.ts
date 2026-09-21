const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export type RepairProblemType = {
 _id: string;
 name: string;
 isDefault?: boolean;
 sortOrder?: number;
};

type ApiResponse<T> = { success: boolean; data?: T; message?: string; existed?: boolean };

export const repairProblemTypeApi = {
 list: async (): Promise<ApiResponse<RepairProblemType[]>> => {
  const response = await fetch(`${API_URL}/api/repair-problem-types`, {
   method: "GET",
   headers: getAuthHeaders(),
   credentials: "include",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
   throw new Error((json as { message?: string }).message || "Failed to load problem types");
  }
  return json;
 },

 create: async (name: string): Promise<ApiResponse<RepairProblemType>> => {
  const response = await fetch(`${API_URL}/api/repair-problem-types`, {
   method: "POST",
   headers: getAuthHeaders(),
   credentials: "include",
   body: JSON.stringify({ name }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
   throw new Error((json as { message?: string }).message || "Failed to save problem type");
  }
  return json;
 },

 remove: async (id: string): Promise<ApiResponse<{ _id: string; name: string }>> => {
  const response = await fetch(`${API_URL}/api/repair-problem-types/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
   credentials: "include",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
   throw new Error((json as { message?: string }).message || "Failed to delete problem type");
  }
  return json;
 },
};

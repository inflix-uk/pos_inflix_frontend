import { ProfileFormData } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

interface ApiResponse<T = unknown> {
 success: boolean;
 message?: string;
 data?: T;
 token?: string;
}

const getAuthHeaders = (): HeadersInit => {
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const profileApi = {
 /**
  * Get current user profile
  */
 getProfile: async (): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch profile");
  }
 },

 /**
  * Update user profile
  */
 updateProfile: async (
  userId: string,
  data: ProfileFormData
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update profile");
  }
 },

 /**
  * Update user password
  */
 updatePassword: async (
  currentPassword: string,
  newPassword: string
 ): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/auth/updatepassword`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update password");
  }
 },

 /**
  * Upload profile avatar
  */
 uploadAvatar: async (file: File): Promise<ApiResponse> => {
  try {
   const token = localStorage.getItem("token");
   const formData = new FormData();
   formData.append("avatar", file);

   const response = await fetch(`${API_URL}/api/auth/avatar`, {
    method: "POST",
    headers: {
     Authorization: `Bearer ${token}`,
    },
    body: formData,
   });
   return await response.json();
  } catch {
   throw new Error("Failed to upload avatar");
  }
 },
};

import { NotesTermsSettings, NotesTermsFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse<T = unknown> {
 success: boolean;
 message?: string;
 data?: T;
}

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const notesTermsApi = {
 /**
  * Get notes & terms settings
  */
 getSettings: async (): Promise<ApiResponse<NotesTermsSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/notes-terms`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch settings");
  }
 },

 /**
  * Save (create or update) notes & terms settings
  */
 saveSettings: async (data: NotesTermsFormData): Promise<ApiResponse<NotesTermsSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/notes-terms`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to save settings");
  }
 },

 /**
  * Update notes & terms settings
  */
 updateSettings: async (data: Partial<NotesTermsFormData>): Promise<ApiResponse<NotesTermsSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/notes-terms`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update settings");
  }
 },

 /**
  * Delete (reset) notes & terms settings
  */
 deleteSettings: async (): Promise<ApiResponse<NotesTermsSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/notes-terms`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete settings");
  }
 },
};

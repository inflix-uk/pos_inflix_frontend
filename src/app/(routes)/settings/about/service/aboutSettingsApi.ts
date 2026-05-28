import { AboutSettings, AboutFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

const getAuthHeadersMultipart = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  Authorization: `Bearer ${token}`,
 };
};

export const aboutSettingsApi = {
 /**
  * Get about settings
  */
 getSettings: async (): Promise<ApiResponse<AboutSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/about`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch settings");
  }
 },

 /**
  * Save (create or update) about settings
  */
 saveSettings: async (data: Partial<AboutFormData>): Promise<ApiResponse<AboutSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/about`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
     appTitle: data.appTitle,
     appName: data.appName,
     logo: data.logoPreview,
     loginPageTitle: data.loginPageTitle,
     companyAddress: data.companyAddress,
     companyNumber: data.companyNumber ?? "",
     vatNumber: data.vatNumber ?? "",
     orderPdfTitle: data.orderPdfTitle,
     invoicePdfTitle: data.invoicePdfTitle,
    }),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to save settings");
  }
 },

 /**
  * Update about settings
  */
 updateSettings: async (data: Partial<AboutFormData>): Promise<ApiResponse<AboutSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/about`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
     appTitle: data.appTitle,
     appName: data.appName,
     logo: data.logoPreview,
     loginPageTitle: data.loginPageTitle,
     companyAddress: data.companyAddress,
     companyNumber: data.companyNumber ?? "",
     vatNumber: data.vatNumber ?? "",
     orderPdfTitle: data.orderPdfTitle,
     invoicePdfTitle: data.invoicePdfTitle,
    }),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update settings");
  }
 },

 /**
  * Delete (reset) about settings
  */
 deleteSettings: async (): Promise<ApiResponse<AboutSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/about`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete settings");
  }
 },

 /**
  * Upload logo
  */
 uploadLogo: async (file: File): Promise<ApiResponse<{ logo: string; settings: AboutSettings }>> => {
  try {
   const formData = new FormData();
   formData.append("logo", file);

   const response = await fetch(`${API_URL}/api/settings/about/logo`, {
    method: "POST",
    headers: getAuthHeadersMultipart(),
    body: formData,
   });
   return await response.json();
  } catch {
   throw new Error("Failed to upload logo");
  }
 },

 /**
  * Remove logo
  */
 removeLogo: async (): Promise<ApiResponse<AboutSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/about/logo`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to remove logo");
  }
 },
};

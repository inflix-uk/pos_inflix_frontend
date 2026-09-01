import { EmailSettings, EmailFormData } from "../types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

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

export const emailSettingsApi = {
 /**
  * Get email settings
  */
 getSettings: async (): Promise<ApiResponse<EmailSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/email`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch email settings");
  }
 },

 /**
  * Save (create or update) email settings
  */
 saveSettings: async (data: EmailFormData): Promise<ApiResponse<EmailSettings>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/email`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
     ...data,
     smtpPort: parseInt(data.smtpPort, 10),
    }),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to save email settings");
  }
 },

 /**
  * Update email settings
  */
 updateSettings: async (data: Partial<EmailFormData>): Promise<ApiResponse<EmailSettings>> => {
  try {
   const payload: Record<string, unknown> = { ...data };
   if (data.smtpPort) {
    payload.smtpPort = parseInt(data.smtpPort, 10);
   }

   const response = await fetch(`${API_URL}/api/settings/email`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update email settings");
  }
 },

 /**
  * Delete email settings
  */
 deleteSettings: async (): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/email`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete email settings");
  }
 },

 /**
  * Test email settings
  */
 testEmail: async (testEmail: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/email/test`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ testEmail }),
   });
   const data = await response.json().catch(() => ({}));
   if (!response.ok) {
    return {
     success: false,
     message: (data as { message?: string }).message || "Failed to send test email",
    };
   }
   return data as ApiResponse;
  } catch (e) {
   const raw = e instanceof Error ? e.message : "Network error";
   if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    throw new Error(
     "Could not reach the API to send a test email. Redeploy the backend, then try again. If this persists, SMTP may be blocked from your server."
    );
   }
   throw e instanceof Error ? e : new Error("Failed to test email settings");
  }
 },
};

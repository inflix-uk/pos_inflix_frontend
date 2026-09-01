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
 testEmail: async (
  testEmailAddress: string,
  form?: Partial<EmailFormData>
 ): Promise<ApiResponse> => {
  try {
   const payload: Record<string, unknown> = { testEmail: testEmailAddress };
   if (form) {
    payload.smtpHost = form.smtpHost;
    payload.smtpPort = form.smtpPort ? parseInt(form.smtpPort, 10) : undefined;
    payload.smtpSecure = form.smtpSecure;
    payload.smtpUsername = form.smtpUsername;
    payload.smtpPassword = form.smtpPassword;
    payload.fromEmail = form.fromEmail;
    payload.fromName = form.fromName;
    payload.replyToEmail = form.replyToEmail;
    payload.replyToName = form.replyToName;
   }
   const response = await fetch("/api/settings/email/test", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
   });
   const raw = await response.text();
   let data: ApiResponse = { success: false };
   try {
    data = raw ? JSON.parse(raw) : { success: false };
   } catch {
    const isHtml = /<!doctype|<html/i.test(raw);
    return {
     success: false,
     message: isHtml
      ? `Email test failed (HTTP ${response.status}). The mail server may be unreachable from your server — try 587 + TLS, re-save your password, or use an email relay.`
      : raw.replace(/\s+/g, " ").trim().slice(0, 200) ||
        `Failed to send test email (HTTP ${response.status}).`,
    };
   }
   if (!response.ok && !data.message) {
    return {
     success: false,
     message: `Failed to send test email (HTTP ${response.status})`,
    };
   }
   if (!data.success) {
    return {
     success: false,
     message: data.message || "Failed to send test email",
    };
   }
   return data;
  } catch (e) {
   const raw = e instanceof Error ? e.message : "Network error";
   if (e instanceof Error && e.name === "TimeoutError") {
    throw new Error(
     "The test email request timed out. Check SMTP host/port and encryption (587 + TLS or 465 + SSL). Your server may also block outbound SMTP."
    );
   }
   if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    throw new Error(
     "Could not reach the server (connection dropped or timed out). Redeploy the backend if you have not yet, then try 587 + TLS or 465 + SSL. Outbound SMTP may be blocked on your hosting server."
    );
   }
   throw e instanceof Error ? e : new Error("Failed to test email settings");
  }
 },
};

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

function authHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export type WhatsappStatus = "disconnected" | "connecting" | "qr" | "connected";

export interface WhatsappStatePayload {
 status: WhatsappStatus;
 qrDataUrl: string | null;
 jid: string | null;
 lastError?: string | null;
}

export interface WhatsappSafetySettings {
 messageDelayMinSeconds: number;
 messageDelayMaxSeconds: number;
 hourlyLimit: number;
 dailyLimit: number;
 dailyCapPerRecipient: number;
 duplicateWindowMinutes: number;
}

export type WhatsappSafetyBounds = Record<keyof WhatsappSafetySettings, { min: number; max: number; label: string }>;

export interface WhatsappUsage {
 hourly: { used: number; limit: number; resetInSeconds: number };
 daily: { used: number; limit: number; resetInSeconds: number };
 cooldown: { active: boolean; remainingSeconds: number; nextSendAt: string | null };
 queue: { pending: number; sending: number; blocked: number; failed: number };
}

export interface WhatsappSettingsPayload {
 settings: WhatsappSafetySettings;
 defaults: WhatsappSafetySettings;
 bounds: WhatsappSafetyBounds;
 usage: WhatsappUsage;
}

export type WhatsappMessageStatus = "pending" | "sending" | "sent" | "failed" | "blocked" | "cancelled";

export interface WhatsappQueueMessage {
 _id: string;
 recipientPhone: string;
 recipientName?: string;
 text: string;
 attachment?: { filename: string; mimetype: string; size: number };
 source: "invoice" | "test";
 sourceRef?: { invoiceId?: string; reference?: string };
 status: WhatsappMessageStatus;
 scheduledAt: string;
 attempts: number;
 sentAt?: string;
 error?: string;
 blockedByRule?: string;
 createdAt: string;
}

export interface WhatsappEnqueueResult {
 message: WhatsappQueueMessage;
 queuedAhead: number;
 nextSendAt: string;
}

async function asJson<T>(res: Response): Promise<T> {
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
  const msg = (data as { message?: string }).message || `Request failed (${res.status})`;
  throw new Error(msg);
 }
 return data as T;
}

/** Human-readable minutes/seconds, e.g. "4m 10s", "45s". */
export function formatDuration(totalSeconds: number): string {
 const s = Math.max(0, Math.round(totalSeconds));
 if (s < 60) return `${s}s`;
 if (s < 3600) {
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m}m ${rest}s` : `${m}m`;
 }
 const h = Math.floor(s / 3600);
 const m = Math.floor((s % 3600) / 60);
 return m ? `${h}h ${m}m` : `${h}h`;
}

/** Explains when a just-queued message will go out. */
export function describeQueuePosition(result: WhatsappEnqueueResult): string {
 if (result.queuedAhead > 0) {
  return `${result.queuedAhead} message${result.queuedAhead === 1 ? "" : "s"} ahead of it — sending is paced by your WhatsApp safety limits.`;
 }
 const waitSeconds = (new Date(result.nextSendAt).getTime() - Date.now()) / 1000;
 if (waitSeconds <= 5) return "It will be sent in a few seconds.";
 return `It will be sent in about ${formatDuration(waitSeconds)} (safety delay between messages).`;
}

export const whatsappApi = {
 getStatus: async (): Promise<WhatsappStatePayload> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/status`, { headers: authHeaders() });
  const json = await asJson<{ success: boolean; data: WhatsappStatePayload }>(res);
  return json.data;
 },
 start: async (): Promise<WhatsappStatePayload> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/start`, { method: "POST", headers: authHeaders() });
  const json = await asJson<{ success: boolean; data: WhatsappStatePayload }>(res);
  return json.data;
 },
 logout: async (): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/logout`, { method: "POST", headers: authHeaders() });
  await asJson(res);
 },
 /** Queues a text message; delivery follows the safety limits. */
 send: async (phone: string, text?: string): Promise<WhatsappEnqueueResult> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/send`, {
   method: "POST",
   headers: authHeaders(),
   body: JSON.stringify({ phone, text }),
  });
  const json = await asJson<{ success: boolean; data: WhatsappEnqueueResult }>(res);
  return json.data;
 },
 getSettings: async (): Promise<WhatsappSettingsPayload> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/settings`, { headers: authHeaders() });
  const json = await asJson<{ success: boolean; data: WhatsappSettingsPayload }>(res);
  return json.data;
 },
 updateSettings: async (settings: Partial<WhatsappSafetySettings>): Promise<WhatsappSettingsPayload> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/settings`, {
   method: "PUT",
   headers: authHeaders(),
   body: JSON.stringify(settings),
  });
  const json = await asJson<{ success: boolean; data: WhatsappSettingsPayload }>(res);
  return json.data;
 },
 getQueue: async (params?: { status?: WhatsappMessageStatus; limit?: number }): Promise<WhatsappQueueMessage[]> => {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const res = await fetch(`${API_BASE_URL}/whatsapp/queue?${sp}`, { headers: authHeaders() });
  const json = await asJson<{ success: boolean; data: WhatsappQueueMessage[] }>(res);
  return json.data;
 },
 cancelMessage: async (id: string): Promise<WhatsappQueueMessage> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/queue/${id}/cancel`, { method: "POST", headers: authHeaders() });
  const json = await asJson<{ success: boolean; data: WhatsappQueueMessage }>(res);
  return json.data;
 },
 retryMessage: async (id: string): Promise<WhatsappQueueMessage> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/queue/${id}/retry`, { method: "POST", headers: authHeaders() });
  const json = await asJson<{ success: boolean; data: WhatsappQueueMessage }>(res);
  return json.data;
 },
};

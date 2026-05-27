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

async function asJson<T>(res: Response): Promise<T> {
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
  const msg = (data as { message?: string }).message || `Request failed (${res.status})`;
  throw new Error(msg);
 }
 return data as T;
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
 send: async (phone: string, text?: string): Promise<{ sentTo: string }> => {
  const res = await fetch(`${API_BASE_URL}/whatsapp/send`, {
   method: "POST",
   headers: authHeaders(),
   body: JSON.stringify({ phone, text }),
  });
  const json = await asJson<{ success: boolean; data: { sentTo: string } }>(res);
  return json.data;
 },
};

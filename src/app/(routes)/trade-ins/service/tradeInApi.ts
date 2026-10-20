import { API_BASE_URL as API_URL } from "@/lib/apiBase";
import type {
 CompleteTradeInPayload,
 TradeIn,
 TradeInFileKind,
 TradeInFileMeta,
 TradeInFileWithData,
 TradeInMeta,
} from "../types";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

/** Error carrying the HTTP status, so callers can react to 404 (draft expired) / 409 (already done). */
export class TradeInApiError extends Error {
 status: number;
 data: unknown;
 constructor(message: string, status: number, data?: unknown) {
  super(message);
  this.status = status;
  this.data = data;
 }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
 let res: Response;
 try {
  res = await fetch(`${API_URL}/api/trade-ins${path}`, {
   method,
   headers: getAuthHeaders(),
   body: body === undefined ? undefined : JSON.stringify(body),
  });
 } catch {
  throw new TradeInApiError("Could not reach the server. Check your connection and try again.", 0);
 }
 const json = await res.json().catch(() => ({}));
 if (!res.ok || json?.success === false) {
  throw new TradeInApiError(json?.message || `Request failed (${res.status})`, res.status, json?.data);
 }
 return json as T;
}

export interface TradeInListParams {
 search?: string;
 status?: "completed" | "draft" | "all";
 page?: number;
 limit?: number;
}

export const tradeInApi = {
 list: async (params: TradeInListParams = {}) => {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  q.set("page", String(params.page || 1));
  q.set("limit", String(params.limit || 20));
  return request<{ data: TradeIn[]; total: number; page: number; pages: number }>("GET", `?${q.toString()}`);
 },

 meta: async (): Promise<TradeInMeta> => (await request<{ data: TradeInMeta }>("GET", "/meta")).data,

 createDraft: async (): Promise<TradeIn> => (await request<{ data: TradeIn }>("POST", "/drafts")).data,

 get: async (id: string): Promise<TradeIn> => (await request<{ data: TradeIn }>("GET", `/${id}`)).data,

 getFiles: async (id: string, kinds?: TradeInFileKind[]): Promise<TradeInFileWithData[]> => {
  const qs = kinds && kinds.length ? `?kinds=${kinds.join(",")}` : "";
  return (await request<{ data: TradeInFileWithData[] }>("GET", `/${id}/files${qs}`)).data;
 },

 putFile: async (id: string, kind: TradeInFileKind, dataUrl: string): Promise<TradeInFileMeta> =>
  (await request<{ data: TradeInFileMeta }>("PUT", `/${id}/files/${kind}`, { dataUrl })).data,

 deleteFile: async (id: string, kind: TradeInFileKind): Promise<void> => {
  await request("DELETE", `/${id}/files/${kind}`);
 },

 setTermsAccepted: async (id: string, accepted: boolean) =>
  (await request<{ data: { termsAccepted: boolean; termsAcceptedVia: string | null } }>("PUT", `/${id}/terms`, { accepted })).data,

 createUploadLink: async (id: string) =>
  (await request<{ data: { token: string; expiresAt: string; tenantId: string } }>("POST", `/${id}/upload-link`)).data,

 complete: async (id: string, payload: CompleteTradeInPayload): Promise<TradeIn> =>
  (await request<{ data: TradeIn }>("POST", `/${id}/complete`, payload)).data,

 deleteDraft: async (id: string): Promise<void> => {
  await request("DELETE", `/${id}`);
 },
};

import type { StockTransfer, StockTransferFilters, StockTransferLine, StockMove } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface ListResponse {
 data: StockTransfer[];
 pagination: { page: number; limit: number; total: number; pages: number };
}

export interface GetByIdResponse {
 data: StockTransfer;
 stockMoves?: StockMove[];
}

export const stockTransferApi = {
 list: async (filters: StockTransferFilters = {}): Promise<ListResponse> => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.fromLocationId) params.set("fromLocationId", filters.fromLocationId);
  if (filters.toLocationId) params.set("toLocationId", filters.toLocationId);
  if (filters.fromUtc) params.set("fromUtc", filters.fromUtc);
  if (filters.toUtc) params.set("toUtc", filters.toUtc);
  if (filters.search) params.set("search", filters.search);
  if (filters.imei) params.set("imei", filters.imei);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  const res = await fetch(`${API_URL}/api/stock-transfers?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch transfers");
  }
  const json = await res.json();
  return { data: json.data, pagination: json.pagination };
 },

 getById: async (id: string): Promise<GetByIdResponse> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   if (res.status === 404) throw new Error("Transfer not found");
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch transfer");
  }
  const json = await res.json();
  return { data: json.data, stockMoves: json.stockMoves };
 },

 create: async (payload: { fromLocationId: string; toLocationId: string; notes?: string }): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to create transfer");
  return json.data;
 },

 update: async (id: string, payload: { fromLocationId?: string; toLocationId?: string; notes?: string }): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to update transfer");
  return json.data;
 },

 addLine: async (
  id: string,
  line: { productId?: string; purchaseId?: string; purchaseItemId?: string; qty: number; unitCost?: number }
 ): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/lines`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(line),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to add line");
  return json.data;
 },

 removeLine: async (id: string, lineId: string): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/lines/${encodeURIComponent(lineId)}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to remove line");
  return json.data;
 },

 addSerial: async (id: string, serialOrImei: string): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/serials`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ serialOrImei }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to add serial");
  return json.data;
 },

 removeSerial: async (id: string, serialOrImei: string): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/serials/${encodeURIComponent(serialOrImei)}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to remove serial");
  return json.data;
 },

 dispatch: async (id: string): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/dispatch`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to dispatch");
  return json.data;
 },

 receive: async (id: string): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/receive`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to receive");
  return json.data;
 },

 cancel: async (id: string): Promise<StockTransfer> => {
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/cancel`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to cancel");
  return json.data;
 },

 validateSerial: async (id: string, serial: string): Promise<{ valid: boolean; reason?: string; productId?: string }> => {
  const params = new URLSearchParams({ serial });
  const res = await fetch(`${API_URL}/api/stock-transfers/${id}/validate-serial?${params}`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { valid: false, reason: (json as { message?: string }).message || "Invalid" };
  return { valid: json.valid, reason: json.reason, productId: json.productId };
 },

 getQuantityLineOptions: async (fromLocationId?: string | null): Promise<{ id: string; label: string; productId?: string | null; purchaseId?: string; itemId?: string; source: string }[]> => {
  const params = new URLSearchParams();
  if (fromLocationId) params.set("fromLocationId", fromLocationId);
  const url = `${API_URL}/api/stock-transfers/quantity-line-options${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to load options");
  return Array.isArray((json as { data?: unknown[] }).data) ? (json as { data: { id: string; label: string; productId?: string | null; purchaseId?: string; itemId?: string; source: string }[] }).data : [];
 },
};

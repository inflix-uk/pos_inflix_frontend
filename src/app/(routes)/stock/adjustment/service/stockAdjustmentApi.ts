import type { StockAdjustment, StockAdjustmentFilters, StockMove } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface ListResponse {
 data: StockAdjustment[];
 pagination: { page: number; limit: number; total: number; pages: number };
}

export interface GetByIdResponse {
 data: StockAdjustment;
 stockMoves?: StockMove[];
}

export const stockAdjustmentApi = {
 list: async (filters: StockAdjustmentFilters = {}): Promise<ListResponse> => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.locationId) params.set("locationId", filters.locationId);
  if (filters.reasonCode) params.set("reasonCode", filters.reasonCode);
  if (filters.fromUtc) params.set("fromUtc", filters.fromUtc);
  if (filters.toUtc) params.set("toUtc", filters.toUtc);
  if (filters.search) params.set("search", filters.search);
  if (filters.imei) params.set("imei", filters.imei);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  const res = await fetch(`${API_URL}/api/stock-adjustments?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch adjustments");
  }
  const json = await res.json();
  return { data: json.data, pagination: json.pagination };
 },

 getById: async (id: string): Promise<GetByIdResponse> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
   if (res.status === 404) throw new Error("Adjustment not found");
   const err = await res.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch adjustment");
  }
  const json = await res.json();
  return { data: json.data, stockMoves: json.stockMoves };
 },

 getReasonCodes: async (): Promise<string[]> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/reason-codes`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray((json as { data?: string[] }).data) ? (json as { data: string[] }).data : [];
 },

 create: async (payload: {
  locationId: string;
  reasonCode: string;
  notes?: string;
 }): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to create adjustment");
  return json.data;
 },

 update: async (
  id: string,
  payload: { locationId?: string; reasonCode?: string; notes?: string }
 ): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to update adjustment");
  return json.data;
 },

 addLine: async (id: string, payload: { productId: string; deltaQty: number }): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}/lines`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to add line");
  return json.data;
 },

 removeLine: async (id: string, lineId: string): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}/lines/${encodeURIComponent(lineId)}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to remove line");
  return json.data;
 },

 addSerial: async (
  id: string,
  payload: { serialOrImei: string; direction: "IN" | "OUT" }
 ): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}/serials`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to add serial");
  return json.data;
 },

 removeSerial: async (id: string, serialOrImei: string): Promise<StockAdjustment> => {
  const res = await fetch(
   `${API_URL}/api/stock-adjustments/${id}/serials/${encodeURIComponent(serialOrImei)}`,
   { method: "DELETE", headers: getAuthHeaders() }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to remove serial");
  return json.data;
 },

 validateSerial: async (
  id: string,
  params: { serial: string; direction: "IN" | "OUT" }
 ): Promise<{ valid: boolean; reason?: string; productId?: string }> => {
  const q = new URLSearchParams({ serial: params.serial, direction: params.direction });
  const res = await fetch(
   `${API_URL}/api/stock-adjustments/${id}/validate-serial?${q}`,
   { headers: getAuthHeaders() }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { valid: false, reason: (json as { message?: string }).message };
  return {
   valid: (json as { valid?: boolean }).valid ?? false,
   reason: (json as { reason?: string }).reason,
   productId: (json as { productId?: string }).productId,
  };
 },

 post: async (id: string): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}/post`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to post adjustment");
  return json.data;
 },

 cancel: async (id: string): Promise<StockAdjustment> => {
  const res = await fetch(`${API_URL}/api/stock-adjustments/${id}/cancel`, {
   method: "POST",
   headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Failed to cancel adjustment");
  return json.data;
 },
};

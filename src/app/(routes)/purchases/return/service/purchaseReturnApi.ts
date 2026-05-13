const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

function getAuthHeaders(): HeadersInit {
 if (typeof window === "undefined") return { "Content-Type": "application/json" };
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
}

export interface ApiListResponse<T> {
 success: boolean;
 data?: T[];
 total?: number;
 page?: number;
 pages?: number;
 message?: string;
}

export interface ApiOneResponse<T> {
 success: boolean;
 data?: T;
 message?: string;
}

export const purchaseReturnApi = {
 getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ApiListResponse<import("../types").PurchaseReturn>> => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  const res = await fetch(`${API_BASE}/purchase-returns?${q.toString()}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch purchase returns");
  return json;
 },

 getById: async (id: string): Promise<ApiOneResponse<import("../types").PurchaseReturn>> => {
  const res = await fetch(`${API_BASE}/purchase-returns/${id}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch purchase return");
  return json;
 },

 create: async (payload: import("../types").CreatePurchaseReturnPayload): Promise<ApiOneResponse<import("../types").PurchaseReturn>> => {
  const res = await fetch(`${API_BASE}/purchase-returns`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create purchase return");
  return json;
 },

 update: async (id: string, data: { status?: string; note?: string }): Promise<ApiOneResponse<import("../types").PurchaseReturn>> => {
  const res = await fetch(`${API_BASE}/purchase-returns/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update purchase return");
  return json;
 },

 delete: async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/purchase-returns/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete purchase return");
 },

 /** Receive serials back from supplier after repair; they are put back in stock. */
 receiveRepair: async (id: string, imeis: string[]): Promise<ApiOneResponse<import("../types").PurchaseReturn>> => {
  const res = await fetch(`${API_BASE}/purchase-returns/${id}/receive-repair`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ imeis }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to receive repair");
  return json;
 },
};

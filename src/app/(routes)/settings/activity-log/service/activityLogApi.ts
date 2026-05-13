const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
}

export interface ActivityLogEvent {
 id: string;
 occurredAtUtc: string;
 actorUserId: string | null;
 actorName: string;
 actorRole: string;
 action: string;
 entityType: string;
 entityId: string | null;
 success: boolean;
 message: string;
 customerId: string | null;
 saleId: string | null;
 invoiceNo: string;
 productId: string | null;
 imei: string;
 amount: number | null;
 paymentMethod: string | null;
 source: string;
 ipAddress: string;
 diffJson?: unknown;
 beforeJson?: unknown;
 afterJson?: unknown;
 metaJson?: unknown;
 hash?: string | null;
}

export interface ActivityLogFilters {
 fromUtc?: string;
 toUtc?: string;
 imei?: string;
 customerId?: string;
 userId?: string;
 invoiceNo?: string;
 saleId?: string;
 productId?: string;
 action?: string;
 entityType?: string;
 success?: boolean;
 source?: string;
 search?: string;
 page?: number;
 limit?: number;
 sort?: "asc" | "desc";
}

export interface ActivityLogResponse {
 success: boolean;
 data: ActivityLogEvent[];
 total: number;
 page: number;
 pages: number;
 limit: number;
}

export interface ActivityLogOptions {
 actions: string[];
 entityTypes: string[];
 sources: string[];
}

export const activityLogApi = {
 async getList(params: ActivityLogFilters = {}): Promise<ActivityLogResponse> {
  const q = new URLSearchParams();
  if (params.fromUtc) q.set("fromUtc", params.fromUtc);
  if (params.toUtc) q.set("toUtc", params.toUtc);
  if (params.imei) q.set("imei", params.imei);
  if (params.customerId) q.set("customerId", params.customerId);
  if (params.userId) q.set("userId", params.userId);
  if (params.invoiceNo) q.set("invoiceNo", params.invoiceNo);
  if (params.saleId) q.set("saleId", params.saleId);
  if (params.productId) q.set("productId", params.productId);
  if (params.action) q.set("action", params.action);
  if (params.entityType) q.set("entityType", params.entityType);
  if (params.success !== undefined) q.set("success", String(params.success));
  if (params.source) q.set("source", params.source);
  if (params.search) q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.sort) q.set("sort", params.sort);
  const res = await fetch(`${API_BASE}/activity-log?${q.toString()}`, {
   headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load activity log");
  return json;
 },

 async getById(id: string): Promise<{ success: boolean; data: ActivityLogEvent }> {
  const res = await fetch(`${API_BASE}/activity-log/${id}`, {
   headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load event");
  return json;
 },

 async getOptions(): Promise<{ success: boolean; data: ActivityLogOptions }> {
  const res = await fetch(`${API_BASE}/activity-log/options`, {
   headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load options");
  return json;
 },
};

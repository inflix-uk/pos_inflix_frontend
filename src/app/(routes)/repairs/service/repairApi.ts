import type { Repair, RepairFormData, RepairFilters, RepairResponse } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const repairApi = {
 getAll: async (filters?: RepairFilters): Promise<RepairResponse> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.page != null) params.append("page", String(filters.page));
  if (filters?.limit != null) params.append("limit", String(filters.limit));

  const response = await fetch(`${API_URL}/api/repairs?${params}`, {
   method: "GET",
   headers: getAuthHeaders(),
   credentials: "include",
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch repairs");
  }
  return response.json();
 },

 getById: async (id: string): Promise<{ success: boolean; data: Repair }> => {
  const response = await fetch(`${API_URL}/api/repairs/${id}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error((err as { message?: string }).message || "Failed to fetch repair");
  }
  return response.json();
 },

 create: async (data: RepairFormData): Promise<{ success: boolean; data: Repair }> => {
  const body: Record<string, unknown> = {
   customerName: data.customerName,
   contactPhone: data.contactPhone ?? "",
   contactEmail: data.contactEmail ?? "",
   deviceDescription: data.deviceDescription,
   serialNumber: data.serialNumber ?? "",
   status: data.status ?? "pending",
   notes: data.notes ?? "",
   internalNotes: data.internalNotes ?? "",
   devicePassword: data.devicePassword ?? "",
  };
  if (data.receivedAt) body.receivedAt = data.receivedAt;
  if (data.completedAt != null) body.completedAt = data.completedAt || null;
  if (data.collectedAt != null) body.collectedAt = data.collectedAt || null;
  if (data.estimatedCost != null) body.estimatedCost = data.estimatedCost;
  if (data.actualCost != null) body.actualCost = data.actualCost;
  if (data.problemType != null) body.problemType = data.problemType;
  if (data.notifyViaEmail != null) body.notifyViaEmail = data.notifyViaEmail;
  if (data.repairItems && data.repairItems.length > 0) body.repairItems = data.repairItems;
  if (data.devices && data.devices.length > 0) body.devices = data.devices;
  if (data.locationId) body.locationId = data.locationId;

  const response = await fetch(`${API_URL}/api/repairs`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as { message?: string }).message || "Failed to create repair");
  return json;
 },

 update: async (id: string, data: Partial<RepairFormData> & { customerId?: string | null }): Promise<{ success: boolean; data: Repair }> => {
  const response = await fetch(`${API_URL}/api/repairs/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
   const err = json as { message?: string; errors?: Array<{ field: string; message: string }> };
   const detail = err.errors?.length ? err.errors.map((e) => `${e.field}: ${e.message}`).join("; ") : "";
   throw new Error(detail || err.message || "Failed to update repair");
  }
  return json;
 },

 delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await fetch(`${API_URL}/api/repairs/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as { message?: string }).message || "Failed to delete repair");
  return json;
 },

 /** Typeahead for repair item description: reuses the non-serial products catalogue so technicians
  *  pick from real parts/services (Screen, Battery, etc.) and the sale price auto-fills the amount. */
 searchItems: async (
  query: string,
  limit = 10
 ): Promise<{ success: boolean; data: Array<{ description: string; amount: number; lastUsedAt?: string }> }> => {
  const q = (query || "").trim();
  if (!q) return { success: true, data: [] };
  const response = await fetch(
   `${API_URL}/api/purchases/non-serial/search?q=${encodeURIComponent(q)}&limit=${limit}`,
   { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) return { success: false, data: [] };
  const json = await response.json().catch(() => ({ success: false, data: [] }));
  // Map non-serial result rows → { description, amount } for the repair item picker.
  // Description: prefer the product name, then brand+model, then category, then variants.
  // Amount: prefer salePrice (what customer pays); fall back to purchasePrice.
  const rows = Array.isArray(json?.data) ? json.data : [];
  const data = rows.map((r: {
   name?: string;
   brand?: string;
   brandModel?: string;
   categoryName?: string;
   variantValues?: Array<{ value?: string }>;
   salePrice?: number;
   purchasePrice?: number;
  }) => {
   const variantPart = (r.variantValues || []).map((v) => v?.value).filter(Boolean).join(" / ");
   const brandModel = [r.brand, r.brandModel].filter((s) => s && String(s).trim()).join(" ");
   const description = (r.name && r.name.trim())
    || brandModel
    || (r.categoryName && r.categoryName.trim())
    || variantPart
    || "Item";
   const price = Number(r.salePrice);
   const fallback = Number(r.purchasePrice);
   const amount = Number.isFinite(price) && price > 0
    ? price
    : (Number.isFinite(fallback) ? fallback : 0);
   return { description, amount };
  });
  return { success: true, data };
 },

 /** Take payment or deposit for repair: creates a sale and links to repair (does not set collected) */
 takePayment: async (
  repairId: string,
  payload: { amount: number; paymentMethod: "cash" | "card" | "credit" | "bank"; isDeposit?: boolean }
 ): Promise<{ success: boolean; data?: { sale: { _id: string; reference: string; total: number; paymentKind?: string }; amountDue: number }; message?: string }> => {
  const response = await fetch(`${API_URL}/api/repairs/${repairId}/take-payment`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as { message?: string }).message || "Failed to take payment");
  return json;
 },
};

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const labelsApi = {
 getProducts: async (q: string, full?: boolean) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (full) params.set("full", "1");
  const res = await fetch(`${API_URL}/api/labels/products?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch products");
  const json = await res.json();
  return json.data || [];
 },

 resolveSerials: async (serials: string[]) => {
  const res = await fetch(`${API_URL}/api/labels/serials/resolve`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ serials }),
  });
  if (!res.ok) throw new Error("Failed to resolve serials");
  const json = await res.json();
  return json.data || [];
 },

 getLocations: async () => {
  const res = await fetch(`${API_URL}/api/labels/locations`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch locations");
  const json = await res.json();
  return json.data || [];
 },

 logPrint: async (payload: { type: string; counts: Record<string, number>; template?: string }) => {
  const res = await fetch(`${API_URL}/api/labels/log-print`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to log print");
  return res.json();
 },
};

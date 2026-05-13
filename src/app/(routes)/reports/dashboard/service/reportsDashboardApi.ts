const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface ByLocationRow {
 locationId: string | null;
 locationName: string;
 value: number;
}

export interface ByLocationData {
 top: ByLocationRow[];
 bottom: ByLocationRow[];
 metric: string;
}

export async function getByLocation(
 from: string,
 to: string,
 metric: string
): Promise<ByLocationData> {
 const params = new URLSearchParams({ from, to, metric });
 const res = await fetch(
  `${API_URL}/api/reports/dashboard/by-location?${params}`,
  { headers: getAuthHeaders() }
 );
 if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error((err as { message?: string }).message || "Failed to load by-location");
 }
 const json = await res.json();
 return json.data as ByLocationData;
}

export interface LegacyCount {
 sales: number;
 repairs: number;
}

export async function getLegacyCount(): Promise<LegacyCount> {
 const res = await fetch(`${API_URL}/api/reports/dashboard/legacy-count`, {
  headers: getAuthHeaders(),
 });
 if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error((err as { message?: string }).message || "Failed to load legacy count");
 }
 const json = await res.json();
 return json.data as LegacyCount;
}

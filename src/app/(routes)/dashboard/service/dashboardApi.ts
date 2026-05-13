const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface DashboardKpis {
 salesToday?: number;
 ordersToday?: number;
 returnsToday?: number;
 returnsCount?: number;
 outstandingCredit?: number;
 lowStockCount?: number;
 outOfStockCount?: number;
 imeiExceptionsCount?: number;
 openRepairs?: number;
 dueTodayOverdue?: number;
 readyForPickup?: number;
 awaitingParts?: number;
}

export interface DashboardAlerts {
 overdueRepairs?: number;
 overdueBalancesCount?: number;
 lowStockCount?: number;
 negativeStockCount?: number;
}

export interface RepairsPipeline {
 pending: number;
 in_progress: number;
 waiting_parts: number;
 completed: number;
 collected: number;
 cancelled: number;
 redo: number;
}

export interface RecentInvoice {
 _id: string;
 reference: string;
 total: number;
 type: string;
 customerName?: string;
 createdAt: string;
}

export interface LowStockItem {
 _id: string;
 name: string;
 sku: string;
 quantity: number;
 minStockLevel: number;
 supplierName?: string;
}

export interface TopSellingProduct {
 sku: string;
 name: string;
 totalQuantity: number;
 totalRevenue: number;
}

export interface SalesTimeSeriesPoint {
 date: string; // YYYY-MM-DD (Europe/London)
 total: number;
 count: number;
}

export interface ActivityPreviewItem {
 id: string;
 occurredAtUtc: string;
 action: string;
 entityType: string;
 message: string;
 actorName: string;
 invoiceNo?: string;
 imei?: string;
}

export interface DashboardData {
 kpis: DashboardKpis;
 alerts: DashboardAlerts;
 repairsPipeline: RepairsPipeline | null;
 recentInvoices: RecentInvoice[];
 lowStock: LowStockItem[];
 activityPreview: ActivityPreviewItem[];
 topCustomers: Array<{ _id: string; name: string; balance: number }>;
 topProducts: TopSellingProduct[];
 salesTimeSeries: SalesTimeSeriesPoint[];
 parcelSummary: { parcelsCreatedToday: number; pendingDispatch: number } | null;
}

export interface GlobalSearchResult {
 type: string;
 id: string;
 label: string;
 url: string;
}

export async function fetchDashboard(
 fromUtc: Date,
 toUtc: Date,
 options?: { locationId?: string | null; locationIds?: string[] | null }
): Promise<DashboardData> {
 const params = new URLSearchParams({
  fromUtc: fromUtc.toISOString(),
  toUtc: toUtc.toISOString(),
 });
 if (options?.locationId) params.set("locationId", options.locationId);
 if (options?.locationIds?.length) params.set("locationIds", options.locationIds.join(","));
 const res = await fetch(`${API_URL}/api/dashboard?${params}`, { headers: getAuthHeaders() });
 if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error((err as { message?: string }).message || "Failed to load dashboard");
 }
 const json = await res.json();
 return json.data as DashboardData;
}

export async function globalSearch(q: string): Promise<GlobalSearchResult[]> {
 if (!q || q.length < 2) return [];
 const res = await fetch(`${API_URL}/api/dashboard/search?q=${encodeURIComponent(q)}`, {
  headers: getAuthHeaders(),
 });
 if (!res.ok) return [];
 const json = await res.json();
 return (json.data?.results ?? []) as GlobalSearchResult[];
}

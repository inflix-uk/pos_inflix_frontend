const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface TakingsRange {
 from: string;
 to: string;
 timezone: string;
 /** Present for shift (UTC window) Z-Read. */
 fromUtc?: string;
 toUtc?: string;
}

export interface TakingsLocation {
 locationId: string;
 name: string;
}

export interface PaymentMethodRow {
 in: number;
 out: number;
 net: number;
}

export interface TakingsPaymentBreakdown {
 cash: PaymentMethodRow;
 card: PaymentMethodRow;
 bank: PaymentMethodRow;
 credit: PaymentMethodRow;
}

export interface TakingsData {
 salesCount: number;
 refundsCount: number;
 voidsCount: number;
 grossSales: number;
 refundsGross: number;
 netRevenue: number;
 paymentBreakdown: TakingsPaymentBreakdown;
 accountBreakdown?: Array<{
  accountId: string;
  accountName: string;
  type: string;
  in: number;
  out: number;
  net: number;
 }>;
}

export interface ExpenseCategoryRow {
 categoryId: string | null;
 categoryName: string;
 totalGross: number;
 count: number;
}

export interface ProfitAndLossData {
 revenue: number;
 cogs: number;
 grossProfit: number;
 operatingExpenses: number;
 netProfit: number;
 expensesByCategory?: ExpenseCategoryRow[];
}

export interface TakingsDashboardData {
 range: TakingsRange;
 location: TakingsLocation;
 takings: TakingsData;
 profitAndLoss: ProfitAndLossData;
}

export interface TakingsDashboardResponse {
 success: boolean;
 data: TakingsDashboardData;
 cached?: boolean;
}

export async function getTakingsDashboard(params: {
 from: string;
 to: string;
 locationId?: string;
 fromUtc?: string;
 toUtc?: string;
}): Promise<TakingsDashboardData> {
 const q = new URLSearchParams({
  from: params.from,
  to: params.to,
  locationId: params.locationId ?? "all",
 });
 if (params.fromUtc) q.set("fromUtc", params.fromUtc);
 if (params.toUtc) q.set("toUtc", params.toUtc);
 const res = await fetch(`${API_URL}/api/reports/takings-dashboard?${q}`, {
  headers: getAuthHeaders(),
 });
 if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(
   (err as { message?: string }).message || "Failed to load takings dashboard"
  );
 }
 const json: TakingsDashboardResponse = await res.json();
 return json.data;
}

/** Today's date in Europe/London (YYYY-MM-DD) */
export function getTodayLondon(): string {
 return new Date().toLocaleDateString("en-CA", {
  timeZone: "Europe/London",
 });
}

/** Format date for display (e.g. 13 Mar 2025) */
export function formatDateLabel(from: string, to: string): string {
 if (from === to) return formatSingleDate(from);
 return `${formatSingleDate(from)} – ${formatSingleDate(to)}`;
}

function formatSingleDate(d: string): string {
 const [y, m, day] = d.split("-").map(Number);
 const date = new Date(y, (m ?? 1) - 1, day ?? 1);
 return date.toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
 });
}

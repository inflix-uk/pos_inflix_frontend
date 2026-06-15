"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDashboard } from "@/app/(routes)/dashboard/hooks/useDashboard";
import {
 DashboardKpiTiles,
 DashboardAlerts,
 DashboardDateRange,
 RepairsPipelineWidget,
 RecentInvoicesTable,
 LowStockTable,
 TopSellingProductsTable,
 SalesOverTimeChart,
 ActivityPreview,
} from "@/app/(routes)/dashboard/components";
import { ChevronLeft, MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import { getByLocation, getLegacyCount, type ByLocationData } from "./service/reportsDashboardApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

function toLondonDateKey(d: Date): string {
 return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

const STORAGE_KEY = "reports-dashboard-locationId";
export const UNKNOWN_LOCATION_VALUE = "unknown";

/**
 * Reports Dashboard — same data and UI as main /dashboard, with location filter.
 * Uses GET /api/dashboard (Sale/Repair-based). Supports "Unknown location" for legacy records with locationId=null.
 */
export default function ReportsDashboardPage() {
 const searchParams = useSearchParams();
 const { user, can } = usePermissionsContext();
 const canViewHistorical = can("report.view");
 const [allLocations, setAllLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [legacyCount, setLegacyCount] = useState<{ sales: number; repairs: number } | null>(null);
 const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() => {
 if (typeof window === "undefined") return null;
 try {
 const stored = localStorage.getItem(STORAGE_KEY);
 return stored || null;
 } catch {
 return null;
 }
 });

 const allowedLocationIds = useMemo(() => (user?.assignedLocationIds?.length ? new Set(user.assignedLocationIds) : null), [user?.assignedLocationIds]);
 const locations = useMemo(() => {
 if (!allowedLocationIds) return allLocations;
 return allLocations.filter((l) => allowedLocationIds.has(l._id));
 }, [allLocations, allowedLocationIds]);

 useEffect(() => {
 const q = searchParams.get("locationId");
 if (q && q.trim()) {
 setSelectedLocationId(q.trim());
 try {
 localStorage.setItem(STORAGE_KEY, q.trim());
 } catch { /* ignore */ }
 }
 }, [searchParams]);

 useEffect(() => {
 if (!user?.defaultLocationId) return;
 try {
 const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
 if (!stored) {
 setSelectedLocationId(user.defaultLocationId);
 localStorage.setItem(STORAGE_KEY, user.defaultLocationId);
 }
 } catch { /* ignore */ }
 }, [user?.defaultLocationId]);

 useEffect(() => {
 let cancelled = false;
 locationApi.getLocations({ isActive: true, limit: 500 }).then((res) => {
 if (cancelled || !res.success || !Array.isArray(res.data)) return;
 setAllLocations((res.data as Array<{ _id: string; name: string }>).map((l) => ({ _id: l._id, name: l.name })));
 }).catch(() => {});
 return () => { cancelled = true; };
 }, []);

 useEffect(() => {
 let cancelled = false;
 getLegacyCount()
 .then((data) => { if (!cancelled) setLegacyCount(data); })
 .catch(() => { if (!cancelled) setLegacyCount(null); });
 return () => { cancelled = true; };
 }, []);

 const handleLocationChange = useCallback((value: string) => {
 const id = value === "" ? null : value;
 setSelectedLocationId(id);
 try {
 if (id) localStorage.setItem(STORAGE_KEY, id);
 else localStorage.removeItem(STORAGE_KEY);
 } catch { /* ignore */ }
 }, []);

 const { data, loading, error, range, setRange, dateRange, refresh } = useDashboard({
 locationId: selectedLocationId ?? undefined,
 canViewHistorical,
 });

 const [topBySales, setTopBySales] = useState<ByLocationData | null>(null);
 const [worstByOverdue, setWorstByOverdue] = useState<ByLocationData | null>(null);
 const [locationWidgetsLoading, setLocationWidgetsLoading] = useState(false);

 useEffect(() => {
 if (selectedLocationId != null) {
 setTopBySales(null);
 setWorstByOverdue(null);
 return;
 }
 const from = toLondonDateKey(dateRange.fromUtc);
 const to = toLondonDateKey(dateRange.toUtc);
 let cancelled = false;
 setLocationWidgetsLoading(true);
 Promise.all([
 getByLocation(from, to, "salesRevenueGross"),
 getByLocation(from, to, "repairsOverdue"),
 ])
 .then(([sales, overdue]) => {
 if (!cancelled) {
  setTopBySales(sales);
  setWorstByOverdue(overdue);
 }
 })
 .catch(() => {
 if (!cancelled) {
  setTopBySales(null);
  setWorstByOverdue(null);
 }
 })
 .finally(() => {
 if (!cancelled) setLocationWidgetsLoading(false);
 });
 return () => { cancelled = true; };
 }, [selectedLocationId, dateRange.fromUtc, dateRange.toUtc]);

 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 <div className="mb-3 @[640px]:mb-4">
 <Link
  href="/reports"
  className="inline-flex items-center gap-1 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-600 hover:text-gray-900"
 >
  <ChevronLeft className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4" /> Back to Reports
 </Link>
 </div>

 <div className="mb-3 @[640px]:mb-4 @[768px]:mb-6 flex flex-col gap-2 @[640px]:gap-3 @[768px]:gap-4 @[1024px]:flex-row @[1024px]:items-center @[1024px]:justify-between">
 <div>
  <h1 className="text-base @[640px]:text-lg @[768px]:text-xl @[1024px]:text-2xl font-bold text-gray-900">Reports — Dashboard</h1>
  <p className="text-[10px] @[640px]:text-xs @[768px]:text-sm text-gray-500 mt-0.5">
  Overview of sales, repairs, stock and activity. Data in Europe/London time.
  </p>
 </div>
 <div className="flex flex-col gap-2 @[640px]:gap-3 @[768px]:flex-row @[768px]:items-center">
  <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <MapPin className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 text-gray-500 shrink-0" />
  <label htmlFor="reports-location" className="sr-only">Location</label>
  <select
  id="reports-location"
  value={selectedLocationId ?? ""}
  onChange={(e) => handleLocationChange(e.target.value)}
  className="rounded-lg border border-gray-300 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
  >
  <option value="">All locations</option>
  <option value={UNKNOWN_LOCATION_VALUE}>Unknown location</option>
  {locations.map((loc) => (
  <option key={loc._id} value={loc._id}>{loc.name}</option>
  ))}
  </select>
  </div>
  <DashboardDateRange
  range={range}
  setRange={setRange}
  label={dateRange.label}
  onRefresh={refresh}
  loading={loading}
  historicalAllowed={canViewHistorical}
  />
 </div>
 </div>

 {legacyCount && (legacyCount.sales > 0 || legacyCount.repairs > 0) && (
 <div className="mb-3 @[640px]:mb-4 @[768px]:mb-6 rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 text-neutral-800 text-[11px] @[640px]:text-xs @[768px]:text-sm flex items-center gap-2">
  <AlertTriangle className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 shrink-0" />
  <span>
  {legacyCount.sales + legacyCount.repairs} legacy record{legacyCount.sales + legacyCount.repairs === 1 ? "" : "s"} have no location set
  {legacyCount.sales > 0 && ` (${legacyCount.sales} sale${legacyCount.sales === 1 ? "" : "s"})`}
  {legacyCount.repairs > 0 && ` (${legacyCount.repairs} repair${legacyCount.repairs === 1 ? "" : "s"})`}.
  Select &quot;Unknown location&quot; to view them.
  </span>
 </div>
 )}

 {error && (
 <div className="mb-3 @[640px]:mb-4 @[768px]:mb-6 rounded-lg bg-red-50 border border-red-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 text-red-700 text-[11px] @[640px]:text-xs @[768px]:text-sm">
  {error}
 </div>
 )}

 {loading && !data ? (
 <div className="space-y-4 @[640px]:space-y-6 @[768px]:space-y-8">
  {/* KPI tiles skeleton */}
  <div className="grid grid-cols-2 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[1024px]:grid-cols-4">
  {[1, 2, 3, 4].map((i) => (
  <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 @[640px]:p-4 @[768px]:p-5 shadow-sm">
  <div className="animate-pulse bg-gray-200 rounded h-3 w-20 mb-3" />
  <div className="animate-pulse bg-gray-200 rounded h-7 w-28 mb-2" />
  <div className="animate-pulse bg-gray-200 rounded h-3 w-16" />
  </div>
  ))}
  </div>
  {/* Alerts skeleton */}
  <div className="rounded-xl border border-gray-200 bg-white p-3 @[640px]:p-4 @[768px]:p-5 shadow-sm">
  <div className="animate-pulse bg-gray-200 rounded h-4 w-32 mb-3" />
  <div className="space-y-2">
  {[1, 2].map((i) => (
  <div key={i} className="animate-pulse bg-gray-100 rounded h-10 w-full" />
  ))}
  </div>
  </div>
  {/* Table skeleton */}
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200">
  <div className="animate-pulse bg-gray-200 rounded h-5 w-40" />
  </div>
  <div className="p-3 @[768px]:p-4 space-y-3">
  {[1, 2, 3, 4, 5].map((i) => (
  <div key={i} className="flex gap-4">
   <div className="animate-pulse bg-gray-200 rounded h-4 w-24" />
   <div className="animate-pulse bg-gray-200 rounded h-4 flex-1" />
   <div className="animate-pulse bg-gray-200 rounded h-4 w-16" />
   <div className="animate-pulse bg-gray-200 rounded h-4 w-20" />
  </div>
  ))}
  </div>
  </div>
 </div>
 ) : data ? (
 <>
  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <DashboardKpiTiles kpis={data.kpis} />
  </div>

  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <DashboardAlerts alerts={data.alerts} />
  </div>

  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <SalesOverTimeChart series={data.salesTimeSeries ?? []} periodLabel={dateRange.label} />
  </div>

  {!selectedLocationId && (
  <div className="grid grid-cols-1 @[1024px]:grid-cols-2 gap-3 @[640px]:gap-4 @[768px]:gap-6 @[1024px]:gap-8 mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
   <div className="flex items-center gap-2">
   <TrendingUp className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-green-600" />
   <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Top locations by Sales</h2>
   </div>
   <Link
   href={`/reports/dashboard/locations?metric=salesRevenueGross&from=${toLondonDateKey(dateRange.fromUtc)}&to=${toLondonDateKey(dateRange.toUtc)}`}
   className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800"
   >
   View all
   </Link>
  </div>
  {locationWidgetsLoading ? (
   <div className="divide-y divide-gray-100">
   {[1, 2, 3].map((i) => (
   <div key={i} className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex justify-between items-center">
   <div className="animate-pulse bg-gray-200 rounded h-4 w-28" />
   <div className="animate-pulse bg-gray-200 rounded h-4 w-16" />
   </div>
   ))}
   </div>
  ) : topBySales?.top?.length ? (
   <ul className="divide-y divide-gray-100">
   {topBySales.top.map((row, i) => (
   <li
   key={row.locationId || i}
   role="button"
   tabIndex={0}
   onClick={() => row.locationId && handleLocationChange(row.locationId)}
   onKeyDown={(e) => e.key === "Enter" && row.locationId && handleLocationChange(row.locationId)}
   className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors rounded-md"
   >
   <span className="font-medium text-gray-900 text-xs @[640px]:text-sm @[768px]:text-base">{row.locationName}</span>
   <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold text-green-600">
    {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(row.value)}
   </span>
   </li>
   ))}
   </ul>
  ) : (
   <p className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No location data for this period.</p>
  )}
  </div>
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
   <div className="flex items-center gap-2">
   <AlertTriangle className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-neutral-600" />
   <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Worst locations by Overdue Repairs</h2>
   </div>
   <Link
   href={`/reports/dashboard/locations?metric=repairsOverdue&from=${toLondonDateKey(dateRange.fromUtc)}&to=${toLondonDateKey(dateRange.toUtc)}`}
   className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800"
   >
   View all
   </Link>
  </div>
  {locationWidgetsLoading ? (
   <div className="divide-y divide-gray-100">
   {[1, 2, 3].map((i) => (
   <div key={i} className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex justify-between items-center">
   <div className="animate-pulse bg-gray-200 rounded h-4 w-28" />
   <div className="animate-pulse bg-gray-200 rounded h-4 w-16" />
   </div>
   ))}
   </div>
  ) : worstByOverdue?.top?.length ? (
   <ul className="divide-y divide-gray-100">
   {worstByOverdue.top.filter((r) => r.value > 0).slice(0, 10).map((row, i) => (
   <li
   key={row.locationId || i}
   role="button"
   tabIndex={0}
   onClick={() => row.locationId && handleLocationChange(row.locationId)}
   onKeyDown={(e) => e.key === "Enter" && row.locationId && handleLocationChange(row.locationId)}
   className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors rounded-md"
   >
   <span className="font-medium text-gray-900 text-xs @[640px]:text-sm @[768px]:text-base">{row.locationName}</span>
   <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold text-neutral-600">{row.value}</span>
   </li>
   ))}
   </ul>
  ) : (
   <p className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No overdue repairs by location for this period.</p>
  )}
  </div>
  </div>
  )}

  <div className="grid grid-cols-1 @[1024px]:grid-cols-2 gap-3 @[640px]:gap-4 @[768px]:gap-6 @[1024px]:gap-8 mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <RepairsPipelineWidget pipeline={data.repairsPipeline} />
  <div className="min-w-0">
  {data.parcelSummary != null && (
  <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4 @[768px]:p-6 shadow-sm mb-3 @[640px]:mb-4 @[768px]:mb-6">
   <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900 mb-1.5 @[640px]:mb-2">Purchases</h2>
   <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">
   Created today: <strong>{data.parcelSummary.parcelsCreatedToday}</strong> · Pending:{" "}
   <strong>{data.parcelSummary.pendingDispatch}</strong>
   </p>
   <a
   href="/purchases"
   className="mt-1.5 @[640px]:mt-2 inline-block text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800"
   >
   View purchases →
   </a>
  </div>
  )}
  </div>
  </div>

  <div className="grid grid-cols-1 @[1280px]:grid-cols-2 gap-3 @[640px]:gap-4 @[768px]:gap-6 @[1024px]:gap-8 mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <RecentInvoicesTable invoices={data.recentInvoices} />
  <LowStockTable items={data.lowStock} />
  </div>

  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <TopSellingProductsTable items={data.topProducts ?? []} />
  </div>

  {data.topCustomers.length > 0 && (
  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
  <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Top outstanding balances</h2>
  <a href="/account-statement" className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800">
   Account statement
  </a>
  </div>
  <ul className="divide-y divide-gray-200">
  {data.topCustomers.map((c) => (
   <li key={c._id} className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex flex-wrap justify-between items-center gap-2">
   <span className="font-medium text-gray-900 text-xs @[640px]:text-sm @[768px]:text-base break-all">{c.name}</span>
   <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold text-neutral-600">
   {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(c.balance)}
   </span>
   </li>
  ))}
  </ul>
  </div>
  )}

  <ActivityPreview items={data.activityPreview} />
 </>
 ) : null}
 </div>
 );
}

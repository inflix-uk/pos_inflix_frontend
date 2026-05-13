"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import { getByLocation, type ByLocationRow } from "../service/reportsDashboardApi";

function toLondonDateKey(d: Date): string {
 return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

const METRIC_LABELS: Record<string, string> = {
 salesRevenueGross: "Sales revenue",
 salesCount: "Sales count",
 returnsGross: "Returns value",
 returnsCount: "Returns count",
 repairsOpen: "Open repairs",
 repairsOverdue: "Overdue repairs",
 repairsReady: "Ready repairs",
 repairsCompleted: "Completed repairs",
 lowStockCount: "Low stock",
 outOfStockCount: "Out of stock",
};

/**
 * View all locations by metric — table with optional search.
 * Query: metric=..., from=YYYY-MM-DD (optional), to=YYYY-MM-DD (optional).
 */
export default function ReportsDashboardLocationsPage() {
 const searchParams = useSearchParams();
 const metricParam = searchParams.get("metric") || "salesRevenueGross";
 const fromParam = searchParams.get("from");
 const toParam = searchParams.get("to");

 const from = fromParam || toLondonDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
 const to = toParam || toLondonDateKey(new Date());
 const [data, setData] = useState<{ top: ByLocationRow[]; bottom: ByLocationRow[]; metric: string } | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");

 useEffect(() => {
 let cancelled = false;
 setLoading(true);
 setError(null);
 getByLocation(from, to, metricParam)
 .then((res) => {
 if (!cancelled) setData(res);
 })
 .catch((err) => {
 if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
 })
 .finally(() => {
 if (!cancelled) setLoading(false);
 });
 return () => { cancelled = true; };
 }, [from, to, metricParam]);

 const allRows: ByLocationRow[] = useMemo(() => {
 if (!data) return [];
 const combined = [...data.top, ...data.bottom];
 const seen = new Set<string>();
 return combined.filter((r) => {
 const id = r.locationId || r.locationName;
 if (seen.has(id)) return false;
 seen.add(id);
 return true;
 });
 }, [data]);

 const filteredRows = useMemo(() => {
 if (!search.trim()) return allRows;
 const q = search.trim().toLowerCase();
 return allRows.filter((r) => r.locationName.toLowerCase().includes(q));
 }, [allRows, search]);

 const isCurrency = metricParam === "salesRevenueGross" || metricParam === "returnsGross";
 const label = METRIC_LABELS[metricParam] || metricParam;

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="mb-4">
 <Link
  href="/reports/dashboard"
  className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
 >
  <ChevronLeft className="h-4 w-4" /> Back to Dashboard
 </Link>
 </div>

 <div className="mb-6">
 <h1 className="text-2xl font-bold text-gray-900">Locations by {label}</h1>
 <p className="text-sm text-gray-500 mt-0.5">
  {from} – {to}
 </p>
 </div>

 {error && (
 <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
  {error}
 </div>
 )}

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <h2 className="text-lg font-semibold text-gray-900">All locations</h2>
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
  type="text"
  placeholder="Search by location name..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full sm:w-64"
  />
  </div>
 </div>

 {loading ? (
  <div className="p-12 flex justify-center">
  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-orange-500" />
  </div>
 ) : (
  <div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
  <tr>
   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Location
   </th>
   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
   {label}
   </th>
   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Actions
   </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
  {filteredRows.length === 0 ? (
   <tr>
   <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
   {search.trim() ? "No locations match your search." : "No location data for this period."}
   </td>
   </tr>
  ) : (
   filteredRows.map((row, i) => (
   <tr key={row.locationId || row.locationName || i}>
   <td className="px-6 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
   {row.locationName}
   </td>
   <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
   {isCurrency
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(row.value)
    : row.value}
   </td>
   <td className="px-6 py-3 text-sm whitespace-nowrap">
   {row.locationId && (
    <Link
    href={`/reports/dashboard?locationId=${encodeURIComponent(row.locationId)}`}
    className="text-blue-600 hover:text-blue-800 font-medium"
    >
    View dashboard
    </Link>
   )}
   </td>
   </tr>
   ))
  )}
  </tbody>
  </table>
  </div>
 )}
 </div>
 </div>
 );
}

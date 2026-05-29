"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Calendar, RefreshCw, ChevronDown, ChevronUp, X, Eye, Loader2, ArrowLeft, Package } from "lucide-react";
import { useTakingsDashboard } from "./hooks/useTakingsDashboard";
import {
 formatDateLabel,
 type TakingsPaymentBreakdown,
} from "./service/takingsDashboardApi";
import { salesApi, type SaleRecord } from "@/app/(routes)/sales-dashboard/service/salesApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ItemsBreakdownModal } from "@/components/ItemsBreakdownModal";
import type { DashboardRange } from "@/lib/dateUtils";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
 style: "currency",
 currency: "GBP",
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(n);
}

const STORAGE_KEY = "takings-dashboard-locationId";

export default function TakingsDashboardPage() {
 const { user } = usePermissionsContext();
 const [allLocations, setAllLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

 useEffect(() => {
 if (typeof window !== "undefined") {
 const stored = localStorage.getItem(STORAGE_KEY);
 if (stored) setSelectedLocationId(stored);
 }
 }, []);

 const allowedLocationIds = useMemo(
 () => (user?.assignedLocationIds?.length ? new Set(user.assignedLocationIds) : null),
 [user?.assignedLocationIds]
 );
 const locations = useMemo(() => {
 if (!allowedLocationIds) return allLocations;
 return allLocations.filter((l) => allowedLocationIds.has(l._id));
 }, [allLocations, allowedLocationIds]);

 useEffect(() => {
 let cancelled = false;
 locationApi
 .getLocations({ isActive: true, limit: 500 })
 .then((res) => {
 if (cancelled || !res.success || !Array.isArray(res.data)) return;
 setAllLocations(
  (res.data as Array<{ _id: string; name: string }>).map((l) => ({
  _id: l._id,
  name: l.name,
  }))
 );
 })
 .catch(() => {});
 return () => {
 cancelled = true;
 };
 }, []);

 const handleLocationChange = (value: string) => {
 setSelectedLocationId(value);
 try {
 if (value && value !== "all") localStorage.setItem(STORAGE_KEY, value);
 else localStorage.removeItem(STORAGE_KEY);
 } catch {}
 };

 const {
 data,
 loading,
 error,
 from,
 to,
 range,
 setRange,
 customFrom,
 setCustomFrom,
 customTo,
 setCustomTo,
 refresh,
 } = useTakingsDashboard({
 locationId: selectedLocationId === "all" ? "all" : selectedLocationId,
 });

 const dateRangeLabel =
 range === "today"
 ? "Today"
 : range === "yesterday"
 ? "Yesterday"
 : range === "7d"
 ? "7 days"
 : range === "30d"
  ? "30 days"
  : "Custom";

 const drilldownParams = useMemo(
 () => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&locationId=${encodeURIComponent(selectedLocationId)}`,
 [from, to, selectedLocationId]
 );

 const [salesModalOpen, setSalesModalOpen] = useState(false);
 const [itemsModalOpen, setItemsModalOpen] = useState(false);

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

 <header className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col gap-2 @[640px]:gap-3 @[768px]:gap-4">
 <div>
  <h1 className="text-base @[480px]:text-lg @[640px]:text-xl @[1024px]:text-2xl font-bold text-gray-900">
  Takings Dashboard
  </h1>
  <p className="mt-0.5 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">
  Sales, refunds, payment breakdown, and P&amp;L for the selected period. Times in Europe/London.
  </p>
 </div>

 <div className="flex flex-col gap-2 @[640px]:gap-3 @[768px]:flex-row @[768px]:flex-wrap @[768px]:items-center">
  <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <Calendar className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0 text-gray-500" />
  <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1">
  {(["today", "yesterday", "7d", "30d", "custom"] as const).map((r) => (
  <button
   key={r}
   type="button"
   onClick={() => setRange(r)}
   disabled={loading}
   className={`rounded-md px-2 @[640px]:px-2.5 @[768px]:px-3 py-1 @[768px]:py-1.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium transition-colors disabled:opacity-50 ${
   range === r
   ? "bg-gray-900 text-white"
   : "text-gray-600 hover:bg-gray-100"
   }`}
  >
   {r === "today"
    ? "Today"
    : r === "yesterday"
    ? "Yesterday"
    : r === "7d"
    ? "7 days"
    : r === "30d"
    ? "30 days"
    : "Custom"}
  </button>
  ))}
  </div>
  {range === "custom" && (
  <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2">
  <label className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">From</label>
  <input
   type="date"
   value={customFrom}
   onChange={(e) => setCustomFrom(e.target.value)}
   className="rounded-lg border border-gray-300 px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm"
  />
  <label className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">To</label>
  <input
   type="date"
   value={customTo}
   onChange={(e) => setCustomTo(e.target.value)}
   className="rounded-lg border border-gray-300 px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm"
  />
  </div>
  )}
  </div>
  <div className="flex items-center gap-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">
  <span>{dateRangeLabel}</span>
  <span aria-hidden>·</span>
  <span>{formatDateLabel(from, to)}</span>
  </div>
  <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <MapPin className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0 text-gray-500" />
  <label htmlFor="takings-location" className="sr-only">
  Location
  </label>
  <select
  id="takings-location"
  value={selectedLocationId}
  onChange={(e) => handleLocationChange(e.target.value)}
  disabled={loading}
  className="rounded-lg border border-gray-300 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
  >
  <option value="all">All locations</option>
  {locations.map((loc) => (
  <option key={loc._id} value={loc._id}>
   {loc.name}
  </option>
  ))}
  </select>
  </div>
  <button
  type="button"
  onClick={refresh}
  disabled={loading}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 rounded-lg border border-gray-200 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
  title="Refresh"
  >
  <RefreshCw className={`h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 ${loading ? "animate-spin" : ""}`} />
  Refresh
  </button>
  <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2 w-full @[768px]:w-auto @[768px]:ml-auto">
  <Link
  href={`/sales-item-wise-orders?${drilldownParams}`}
  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-orange-700 hover:bg-orange-100"
  >
  <Package className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0" />
  View by Items
  </Link>
  <Link
  href={`/sales-online-orders?${drilldownParams}`}
  className="rounded-lg border border-gray-200 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
  View Sales
  </Link>
  <Link
  href={`/sales-return?${drilldownParams}`}
  className="rounded-lg border border-gray-200 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
  View Returns
  </Link>
  <Link
  href={`/expenses?${drilldownParams}`}
  className="rounded-lg border border-gray-200 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
  View Expenses
  </Link>
  <Link
  href={`/profit-and-loss?${drilldownParams}`}
  className="rounded-lg border border-gray-200 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
  View P&amp;L Statement
  </Link>
  </div>
 </div>
 </header>

 {error && (
 <div className="mb-3 @[640px]:mb-4 @[768px]:mb-6 rounded-lg border border-red-200 bg-red-50 px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-red-700">
  {error}
 </div>
 )}

 {loading && !data ? (
 <TakingsSkeleton />
 ) : data ? (
 <>
  <section className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <h2 className="mb-2.5 @[640px]:mb-3 @[768px]:mb-4 text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold uppercase tracking-wide text-gray-500">
  KPIs
  </h2>
  <div className="grid grid-cols-1 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
  <KpiCard
  label="Sales"
  value={data.takings.salesCount}
  sub={formatCurrency(data.takings.grossSales)}
  action={
   <div className="flex items-center gap-1">
   <button
    type="button"
    onClick={() => setSalesModalOpen(true)}
    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] @[640px]:text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
   >
    <Eye className="h-3 w-3" />
    View
   </button>
   <button
    type="button"
    onClick={() => setItemsModalOpen(true)}
    className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-[10px] @[640px]:text-xs font-medium text-orange-700 hover:bg-orange-200 transition-colors"
    title="View sold items aggregated"
   >
    <Package className="h-3 w-3" />
    Items
   </button>
   </div>
  }
  />
  <KpiCard label="Refunds" value={data.takings.refundsCount} sub={formatCurrency(data.takings.refundsGross)} negative />
  <KpiCard label="Voids" value={data.takings.voidsCount} negative />
  <KpiCard label="Net Revenue" value={formatCurrency(data.takings.netRevenue)} highlight />
  </div>
  </section>

  <section className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <h2 className="mb-2.5 @[640px]:mb-3 @[768px]:mb-4 text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold uppercase tracking-wide text-gray-500">
  Payment breakdown
  </h2>
  <div className="grid grid-cols-1 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
  {(["cash", "card", "bank", "credit"] as const).map((method) => (
  <PaymentCard
   key={method}
   method={method}
   row={data.takings.paymentBreakdown[method]}
  />
  ))}
  </div>
  {data.takings.accountBreakdown && data.takings.accountBreakdown.length > 0 && (
  <ByAccountSection accountBreakdown={data.takings.accountBreakdown} />
  )}
  </section>

  <section className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <h2 className="mb-2.5 @[640px]:mb-3 @[768px]:mb-4 text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold uppercase tracking-wide text-gray-500">
  Profit &amp; Loss (same period)
  </h2>
  <div className="grid grid-cols-1 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
  <KpiCard label="Revenue" value={formatCurrency(data.profitAndLoss.revenue)} />
  <KpiCard label="COGS" value={formatCurrency(data.profitAndLoss.cogs)} />
  <KpiCard label="Gross Profit" value={formatCurrency(data.profitAndLoss.grossProfit)} highlight />
  <KpiCard label="Operating Expenses" value={formatCurrency(data.profitAndLoss.operatingExpenses)} />
  <KpiCard
  label="Net Profit"
  value={formatCurrency(data.profitAndLoss.netProfit)}
  highlight
  negative={data.profitAndLoss.netProfit < 0}
  />
  </div>
  {data.profitAndLoss.expensesByCategory &&
  data.profitAndLoss.expensesByCategory.length > 0 && (
  <div className="mt-3 @[640px]:mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
   <table className="min-w-full divide-y divide-gray-200 text-[11px] @[640px]:text-xs @[768px]:text-sm">
   <thead>
   <tr>
   <th className="px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 text-left font-medium text-gray-500">
    Category
   </th>
   <th className="px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 text-right font-medium text-gray-500">
    Amount
   </th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-100">
   {data.profitAndLoss.expensesByCategory.map((row) => (
   <tr key={row.categoryId ?? "uncat"}>
    <td className="px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 text-gray-900">
    {row.categoryName}
    </td>
    <td className="px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 text-right text-gray-700">
    {formatCurrency(row.totalGross)}
    </td>
   </tr>
   ))}
   </tbody>
   </table>
  </div>
  )}
  </section>
 </>
 ) : null}

 {salesModalOpen && (
 <SalesTransactionsModal
  from={from}
  to={to}
  locationId={selectedLocationId}
  onClose={() => setSalesModalOpen(false)}
 />
 )}

 {itemsModalOpen && (
 <ItemsBreakdownModal
  from={from}
  to={to}
  locationId={selectedLocationId}
  dateLabel={formatDateLabel(from, to)}
  onClose={() => setItemsModalOpen(false)}
 />
 )}
 </div>
 );
}

function KpiCard({
 label,
 value,
 sub,
 negative,
 highlight,
 action,
}: {
 label: string;
 value: string | number;
 sub?: string;
 negative?: boolean;
 highlight?: boolean;
 action?: React.ReactNode;
}) {
 return (
 <div
 className={`rounded-xl border bg-white p-3 @[640px]:p-3.5 @[768px]:p-4 shadow-sm ${
 highlight ? "border-orange-200 bg-orange-50/30" : "border-gray-200"
 }`}
 >
 <div className="flex items-start justify-between">
 <p className="text-[10px] @[640px]:text-xs font-medium uppercase tracking-wide text-gray-500">
  {label}
 </p>
 {action}
 </div>
 <p
 className={`mt-1 text-base @[480px]:text-lg @[768px]:text-xl font-semibold ${
  negative ? "text-red-600" : highlight ? "text-orange-700" : "text-gray-900"
 }`}
 >
 {value}
 </p>
 {sub != null && (
 <p className="mt-0.5 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">{sub}</p>
 )}
 </div>
 );
}

function ByAccountSection({
 accountBreakdown,
}: {
 accountBreakdown: Array<{ accountId: string; accountName: string; type: string; in: number; out: number; net: number }>;
}) {
 const [open, setOpen] = useState(false);
 return (
 <div className="mt-3 @[640px]:mt-4 rounded-xl border border-gray-200 bg-white">
 <button
 type="button"
 onClick={() => setOpen((o) => !o)}
 className="flex w-full items-center justify-between px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 text-left text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-700 hover:bg-gray-50"
 >
 <span>By account (pots)</span>
 {open ? <ChevronUp className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4" /> : <ChevronDown className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4" />}
 </button>
 {open && (
 <div className="border-t border-gray-100 px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3">
  <div className="overflow-x-auto">
  <table className="min-w-full text-[11px] @[640px]:text-xs @[768px]:text-sm">
  <thead>
  <tr>
   <th className="pb-2 pr-4 text-left font-medium text-gray-500">Account</th>
   <th className="pb-2 pr-4 text-left font-medium text-gray-500">Type</th>
   <th className="pb-2 pr-4 text-right font-medium text-gray-500">In</th>
   <th className="pb-2 pr-4 text-right font-medium text-gray-500">Out</th>
   <th className="pb-2 text-right font-medium text-gray-500">Net</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
  {accountBreakdown.map((row) => (
   <tr key={row.accountId}>
   <td className="py-2 pr-4 text-gray-900">{row.accountName}</td>
   <td className="py-2 pr-4 text-gray-600">{row.type.replace("_", " ")}</td>
   <td className="py-2 pr-4 text-right text-gray-700">{formatCurrency(row.in)}</td>
   <td className="py-2 pr-4 text-right text-gray-700">{formatCurrency(row.out)}</td>
   <td className={`py-2 text-right font-medium ${row.net < 0 ? "text-red-600" : "text-gray-900"}`}>
   {formatCurrency(row.net)}
   </td>
   </tr>
  ))}
  </tbody>
  </table>
  </div>
 </div>
 )}
 </div>
 );
}

function PaymentCard({
 method,
 row,
}: {
 method: keyof TakingsPaymentBreakdown;
 row: { in: number; out: number; net: number };
}) {
 const label =
 method === "cash"
 ? "Cash"
 : method === "card"
 ? "Card"
 : method === "bank"
  ? "Bank"
  : "Credit";
 return (
 <div className="rounded-xl border border-gray-200 bg-white p-3 @[640px]:p-3.5 @[768px]:p-4 shadow-sm">
 <p className="text-[10px] @[640px]:text-xs font-medium uppercase tracking-wide text-gray-500">
 {label}
 </p>
 <div className="mt-1.5 @[640px]:mt-2 space-y-1 text-[11px] @[640px]:text-xs @[768px]:text-sm">
 <p className="flex justify-between">
  <span className="text-gray-500">In</span>
  <span className="text-gray-900">{formatCurrency(row.in)}</span>
 </p>
 <p className="flex justify-between">
  <span className="text-gray-500">Out</span>
  <span className="text-gray-900">{formatCurrency(row.out)}</span>
 </p>
 <p className="flex justify-between border-t border-gray-100 pt-2 font-medium">
  <span className="text-gray-600">Net</span>
  <span
  className={
  row.net < 0 ? "text-red-600" : "text-gray-900"
  }
  >
  {formatCurrency(row.net)}
  </span>
 </p>
 </div>
 </div>
 );
}

function SalesTransactionsModal({
 from,
 to,
 locationId,
 onClose,
}: {
 from: string;
 to: string;
 locationId: string;
 onClose: () => void;
}) {
 const [sales, setSales] = useState<SaleRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [total, setTotal] = useState(0);
 const limit = 20;

 // Detail view state
 const [viewingSale, setViewingSale] = useState<SaleRecord | null>(null);
 const [detailLoading, setDetailLoading] = useState(false);
 const [detailError, setDetailError] = useState("");

 const fetchPage = useCallback(
 async (p: number) => {
 setLoading(true);
 setError("");
 try {
 const res = await salesApi.getSales({
  from,
  to,
  locationId: locationId !== "all" ? locationId : undefined,
  page: p,
  limit,
  order: "desc",
 });
 setSales(res.data);
 setTotalPages(res.pages);
 setTotal(res.total);
 setPage(p);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message : "Failed to load sales");
 } finally {
 setLoading(false);
 }
 },
 [from, to, locationId]
 );

 const openDetail = useCallback(async (saleId: string) => {
 setDetailLoading(true);
 setDetailError("");
 try {
 const res = await salesApi.getSaleById(saleId);
 setViewingSale(res.data);
 } catch (err: unknown) {
 setDetailError(err instanceof Error ? err.message : "Failed to load sale details");
 } finally {
 setDetailLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchPage(1);
 }, [fetchPage]);

 // Close on Escape
 useEffect(() => {
 const handler = (e: KeyboardEvent) => {
 if (e.key === "Escape") {
 if (viewingSale) setViewingSale(null);
 else onClose();
 }
 };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [onClose, viewingSale]);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
 <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
  <div className="flex items-center gap-3">
  {viewingSale && (
  <button
  type="button"
  onClick={() => setViewingSale(null)}
  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
  >
  <ArrowLeft className="h-5 w-5" />
  </button>
  )}
  <div>
  <h3 className="text-lg font-semibold text-gray-900">
  {viewingSale ? viewingSale.reference : "Sales Transactions"}
  </h3>
  <p className="text-sm text-gray-500">
  {viewingSale
   ? `${viewingSale.type.charAt(0).toUpperCase() + viewingSale.type.slice(1)} sale`
   : `${formatDateLabel(from, to)} \u00b7 ${total} transaction${total !== 1 ? "s" : ""}`}
  </p>
  </div>
  </div>
  <button
  type="button"
  onClick={onClose}
  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-auto px-6 py-4">
  {/* --- Detail view --- */}
  {(viewingSale || detailLoading) ? (
  detailLoading ? (
  <div className="flex items-center justify-center py-12">
  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
  ) : detailError ? (
  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
  {detailError}
  </div>
  ) : viewingSale ? (
  <SaleDetailView sale={viewingSale} />
  ) : null
  ) : (
  <>
  {/* --- List view --- */}
  {error && (
  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
   {error}
  </div>
  )}

  {loading ? (
  <div className="flex items-center justify-center py-12">
   <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
  ) : sales.length === 0 ? (
  <p className="py-12 text-center text-sm text-gray-500">
   No sales found for this period.
  </p>
  ) : (
  <div className="overflow-x-auto">
   <table className="min-w-full divide-y divide-gray-200 text-sm">
   <thead>
   <tr>
   <th className="px-3 py-2 text-left font-medium text-gray-500">
    Ref
   </th>
   <th className="px-3 py-2 text-left font-medium text-gray-500">
    Customer
   </th>
   <th className="px-3 py-2 text-left font-medium text-gray-500">
    Type
   </th>
   <th className="px-3 py-2 text-left font-medium text-gray-500">
    Payment
   </th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">
    Total
   </th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">
    Date
   </th>
   <th className="px-3 py-2 text-center font-medium text-gray-500">
    Action
   </th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-100">
   {sales.map((sale) => {
   const customer =
    typeof sale.customerId === "object" && sale.customerId
    ? sale.customerId.name
    : sale.customerName || "\u2014";
   return (
    <tr key={sale._id} className="hover:bg-gray-50">
    <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
    {sale.reference}
    </td>
    <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate">
    {customer}
    </td>
    <td className="px-3 py-2 capitalize text-gray-600">
    {sale.type}
    </td>
    <td className="px-3 py-2 capitalize text-gray-600">
    {sale.paymentMethod ||
    (() => {
     const p = sale.payments;
     if (!p) return "split";
     const modes = (
     ["cash", "card", "bank", "credit"] as const
     ).filter((m) => p[m] && p[m]! > 0);
     return modes.length === 1 ? modes[0] : "split";
    })()}
    </td>
    <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-900">
    {formatCurrency(sale.total)}
    </td>
    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-500">
    {new Date(sale.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
    })}
    </td>
    <td className="px-3 py-2 text-center">
    <button
    type="button"
    onClick={() => openDetail(sale._id)}
    className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
    title="View details"
    >
    <Eye className="h-4 w-4" />
    </button>
    </td>
    </tr>
   );
   })}
   </tbody>
   </table>
  </div>
  )}
  </>
  )}
 </div>

 {/* Footer / Pagination — only in list view */}
 {!viewingSale && !detailLoading && totalPages > 1 && (
  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
  <p className="text-sm text-gray-500">
  Page {page} of {totalPages}
  </p>
  <div className="flex gap-2">
  <button
  type="button"
  onClick={() => fetchPage(page - 1)}
  disabled={page <= 1 || loading}
  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
  >
  Previous
  </button>
  <button
  type="button"
  onClick={() => fetchPage(page + 1)}
  disabled={page >= totalPages || loading}
  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
  >
  Next
  </button>
  </div>
  </div>
 )}
 </div>
 </div>
 );
}

/** Detail view for a single sale, shown inside the modal */
function SaleDetailView({ sale }: { sale: SaleRecord }) {
 const customer =
 typeof sale.customerId === "object" && sale.customerId
 ? sale.customerId
 : null;
 const customerName = customer?.name || sale.customerName || "\u2014";
 const location =
 typeof sale.locationId === "object" && sale.locationId
 ? sale.locationId
 : null;

 return (
 <div className="space-y-6">
 {/* Summary cards */}
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
 <div>
  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer</p>
  <p className="mt-1 text-sm font-medium text-gray-900">{customerName}</p>
  {customer?.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
 </div>
 <div>
  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment</p>
  {sale.payments && (sale.payments.cash || sale.payments.card || sale.payments.bank || sale.payments.credit) ? (
  <div className="mt-1 flex flex-wrap gap-1.5">
  {sale.payments.cash ? (
  <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">Cash — £{sale.payments.cash.toFixed(2)}</span>
  ) : null}
  {sale.payments.card ? (
  <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">Card — £{sale.payments.card.toFixed(2)}</span>
  ) : null}
  {sale.payments.bank ? (
  <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">Bank — £{sale.payments.bank.toFixed(2)}</span>
  ) : null}
  {sale.payments.credit ? (
  <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">Balance to pay — £{sale.payments.credit.toFixed(2)}</span>
  ) : null}
  </div>
  ) : (
  <p className="mt-1 text-sm font-medium capitalize text-gray-900">
  {sale.paymentMethod ||
  (() => {
   const p = sale.payments;
   if (!p) return "split";
   const modes = (
   ["cash", "card", "bank", "credit"] as const
   ).filter((m) => p[m] && p[m]! > 0);
   return modes.length === 1 ? modes[0] : "split";
  })()}
  </p>
  )}
 </div>
 <div>
  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Date</p>
  <p className="mt-1 text-sm font-medium text-gray-900">
  {new Date(sale.createdAt).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
  })}
  </p>
 </div>
 {location && (
  <div>
  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Location</p>
  <p className="mt-1 text-sm font-medium text-gray-900">{location.name}</p>
  </div>
 )}
 </div>

 {/* Items table */}
 {sale.items && sale.items.length > 0 && (
 <div>
  <h4 className="mb-2 text-sm font-semibold text-gray-700">Items summary</h4>
  <div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
  <thead className="bg-gray-50">
  <tr>
   <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
   <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">Qty</th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">Unit price</th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">Amount</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
  {sale.items.map((item, idx) => (
   <tr key={item._id || idx}>
   <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
   <td className="px-3 py-2 text-gray-900">
   {item.name}
   {item.grade && (
   <span className="ml-1.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
    {item.grade}
   </span>
   )}
   {item.serialNumbers && item.serialNumbers.length > 0 && (
   <p className="mt-0.5 text-xs text-gray-400">
    S/N: {item.serialNumbers.join(", ")}
   </p>
   )}
   </td>
   <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
   {item.quantity}
   </td>
   <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
   {formatCurrency(item.price)}
   </td>
   <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-900">
   {formatCurrency(item.price * item.quantity)}
   </td>
   </tr>
  ))}
  </tbody>
  </table>
  </div>
 </div>
 )}

 {/* Totals */}
 <div className="flex justify-end">
 <div className="w-64 space-y-1 text-sm">
  <div className="flex justify-between">
  <span className="text-gray-500">Subtotal</span>
  <span className="text-gray-900">{formatCurrency(sale.subtotal)}</span>
  </div>
  {(sale.discount ?? 0) > 0 && (
  <div className="flex justify-between">
  <span className="text-gray-500">Discount</span>
  <span className="text-red-600">-{formatCurrency(sale.discount)}</span>
  </div>
  )}
  <div className="flex justify-between">
  <span className="text-gray-500">Tax</span>
  <span className="text-gray-900">{formatCurrency(sale.tax)}</span>
  </div>
  <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
  <span className="text-gray-700">Total</span>
  <span className="text-gray-900">{formatCurrency(sale.total)}</span>
  </div>
  {sale.payments && (sale.payments.cash || sale.payments.card || sale.payments.bank || sale.payments.credit) && (
  <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payments</span>
  {sale.payments.cash ? (
  <div className="flex justify-between text-xs">
   <span className="text-gray-500">Cash</span>
   <span className="text-gray-700">{formatCurrency(sale.payments.cash)}</span>
  </div>
  ) : null}
  {sale.payments.card ? (
  <div className="flex justify-between text-xs">
   <span className="text-gray-500">Card</span>
   <span className="text-gray-700">{formatCurrency(sale.payments.card)}</span>
  </div>
  ) : null}
  {sale.payments.bank ? (
  <div className="flex justify-between text-xs">
   <span className="text-gray-500">Bank</span>
   <span className="text-gray-700">{formatCurrency(sale.payments.bank)}</span>
  </div>
  ) : null}
  {sale.payments.credit ? (
  <div className="flex justify-between text-xs">
   <span className="text-gray-500">Balance to pay</span>
   <span className="text-gray-700">{formatCurrency(sale.payments.credit)}</span>
  </div>
  ) : null}
  </div>
  )}
  {sale.type === "wholesale" && (
  <>
  {(sale.previousBalance ?? 0) !== 0 && (
  <div className="flex justify-between text-xs">
   <span className="text-gray-500">Previous balance</span>
   <span className="text-gray-700">{formatCurrency(sale.previousBalance ?? 0)}</span>
  </div>
  )}
  {(sale.amountDue ?? 0) !== 0 && (
  <div className="flex justify-between text-xs">
   <span className="text-gray-500">Amount due</span>
   <span className="text-gray-700">{formatCurrency(sale.amountDue ?? 0)}</span>
  </div>
  )}
  </>
  )}
 </div>
 </div>
 </div>
 );
}

function TakingsSkeleton() {
 return (
 <div className="space-y-4 @[640px]:space-y-6 @[768px]:space-y-8">
 <div className="grid grid-cols-1 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
 {[1, 2, 3, 4].map((i) => (
  <div
  key={i}
  className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
  />
 ))}
 </div>
 <div className="grid grid-cols-1 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
 {[1, 2, 3, 4].map((i) => (
  <div
  key={i}
  className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
  />
 ))}
 </div>
 <div className="grid grid-cols-1 gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
 {[1, 2, 3, 4, 5].map((i) => (
  <div
  key={i}
  className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
  />
 ))}
 </div>
 </div>
 );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 ChevronLeft,
 MapPin,
 Calendar,
 RefreshCw,
 Receipt,
 Printer,
} from "lucide-react";
import { useTakingsDashboard } from "../takings/hooks/useTakingsDashboard";
import {
 formatDateLabel,
 type TakingsDashboardData,
} from "../takings/service/takingsDashboardApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const STORAGE_KEY = "z-read-dashboard-locationId";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(n);
}

export default function ZReadDashboardPage() {
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
   : range === "7d"
   ? "7 days"
   : range === "30d"
   ? "30 days"
   : "Custom";

 const locationName = useMemo(() => {
  if (selectedLocationId === "all") return "All locations";
  const loc = allLocations.find((l) => l._id === selectedLocationId);
  return loc?.name ?? "—";
 }, [selectedLocationId, allLocations]);

 return (
  <div className="@container min-h-screen bg-gray-50 p-3 @[768px]:p-6 print:bg-white print:p-0">
   <div className="mb-3 print:hidden">
    <Link
     href="/dashboard"
     className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
    >
     <ChevronLeft className="h-4 w-4" /> Back to Dashboard
    </Link>
   </div>

   <header className="mb-4 flex flex-col gap-3 print:hidden">
    <div>
     <h1 className="text-lg @[768px]:text-2xl font-bold text-gray-900">
      Daily Closing Till Reading <span className="text-gray-400 font-normal">(Z-Read)</span>
     </h1>
     <p className="mt-1 text-xs @[768px]:text-sm text-gray-500">
      End-of-day cash-up summary. Sales, refunds, voids and payment method totals for the selected period.
     </p>
    </div>

    <div className="flex flex-col gap-2 @[768px]:flex-row @[768px]:flex-wrap @[768px]:items-center">
     <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
      <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1">
       {(["today", "7d", "30d", "custom"] as const).map((r) => (
        <button
         key={r}
         type="button"
         onClick={() => setRange(r)}
         disabled={loading}
         className={`rounded-md px-2.5 py-1.5 text-xs @[768px]:text-sm font-medium transition-colors disabled:opacity-50 ${
          range === r
           ? "bg-gray-900 text-white"
           : "text-gray-600 hover:bg-gray-100"
         }`}
        >
         {r === "today" ? "Today" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "Custom"}
        </button>
       ))}
      </div>
      {range === "custom" && (
       <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-gray-600">From</label>
        <input
         type="date"
         value={customFrom}
         onChange={(e) => setCustomFrom(e.target.value)}
         className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs @[768px]:text-sm"
        />
        <label className="text-xs text-gray-600">To</label>
        <input
         type="date"
         value={customTo}
         onChange={(e) => setCustomTo(e.target.value)}
         className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs @[768px]:text-sm"
        />
       </div>
      )}
     </div>
     <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>{dateRangeLabel}</span>
      <span aria-hidden>·</span>
      <span>{formatDateLabel(from, to)}</span>
     </div>
     <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
      <select
       value={selectedLocationId}
       onChange={(e) => handleLocationChange(e.target.value)}
       disabled={loading}
       className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs @[768px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
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
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs @[768px]:text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      title="Refresh"
     >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Refresh
     </button>
     <button
      type="button"
      onClick={() => window.print()}
      disabled={loading || !data}
      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 text-white px-3 py-1.5 text-xs @[768px]:text-sm hover:bg-orange-600 disabled:opacity-50"
      title="Print Z-Read"
     >
      <Printer className="h-4 w-4" />
      Print Z-Read
     </button>
    </div>
   </header>

   {error && (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 print:hidden">
     {error}
    </div>
   )}

   {loading && !data ? (
    <ZReadSkeleton />
   ) : data ? (
    <ZReadReceipt
     data={data}
     locationName={locationName}
     dateRangeLabel={dateRangeLabel}
     from={from}
     to={to}
    />
   ) : null}
  </div>
 );
}

function ZReadReceipt({
 data,
 locationName,
 dateRangeLabel,
 from,
 to,
}: {
 data: TakingsDashboardData;
 locationName: string;
 dateRangeLabel: string;
 from: string;
 to: string;
}) {
 const { takings } = data;
 const pb = takings.paymentBreakdown;
 const totalIn = pb.cash.in + pb.card.in + pb.bank.in + pb.credit.in;
 const totalOut = pb.cash.out + pb.card.out + pb.bank.out + pb.credit.out;
 const totalNet = pb.cash.net + pb.card.net + pb.bank.net + pb.credit.net;

 const printedAt = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
 });

 return (
  <section className="mx-auto max-w-3xl rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 @[768px]:p-6 shadow-sm print:border-0 print:shadow-none print:p-0">
   <header className="border-b border-dashed border-gray-300 pb-3 mb-4 text-center">
    <h2 className="text-lg @[768px]:text-xl font-bold tracking-wide text-gray-900 flex items-center justify-center gap-2">
     <Receipt className="h-5 w-5" />
     DAILY CLOSING TILL READING
    </h2>
    <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">Z-Read</p>
    <div className="mt-3 grid grid-cols-2 gap-2 text-left text-[11px] @[768px]:text-xs">
     <div>
      <span className="font-medium text-gray-500">Location:</span>{" "}
      <span className="text-gray-900">{locationName}</span>
     </div>
     <div className="text-right">
      <span className="font-medium text-gray-500">Period:</span>{" "}
      <span className="text-gray-900">{dateRangeLabel}</span>
     </div>
     <div>
      <span className="font-medium text-gray-500">Range:</span>{" "}
      <span className="text-gray-900">{formatDateLabel(from, to)}</span>
     </div>
     <div className="text-right">
      <span className="font-medium text-gray-500">Printed:</span>{" "}
      <span className="text-gray-900">{printedAt}</span>
     </div>
    </div>
   </header>

   <div className="grid grid-cols-2 @[640px]:grid-cols-3 gap-3 mb-4 pb-4 border-b border-dashed border-gray-200">
    <ZStat label="Sales #" value={String(takings.salesCount)} />
    <ZStat label="Refunds #" value={String(takings.refundsCount)} negative />
    <ZStat label="Voids #" value={String(takings.voidsCount)} negative />
    <ZStat label="Gross sales" value={formatCurrency(takings.grossSales)} />
    <ZStat label="Refunds" value={formatCurrency(takings.refundsGross)} negative />
    <ZStat label="Net revenue" value={formatCurrency(takings.netRevenue)} highlight />
   </div>

   <div className="overflow-x-auto">
    <table className="min-w-full text-xs @[768px]:text-sm">
     <thead>
      <tr className="text-gray-500">
       <th className="px-2 py-1.5 text-left font-medium">Method</th>
       <th className="px-2 py-1.5 text-right font-medium">In</th>
       <th className="px-2 py-1.5 text-right font-medium">Out</th>
       <th className="px-2 py-1.5 text-right font-medium">Net</th>
      </tr>
     </thead>
     <tbody>
      {(["cash", "card", "bank", "credit"] as const).map((m) => (
       <tr key={m} className="border-t border-gray-100">
        <td className="px-2 py-2 capitalize font-medium text-gray-900">{m}</td>
        <td className="px-2 py-2 text-right text-gray-700 tabular-nums">{formatCurrency(pb[m].in)}</td>
        <td className="px-2 py-2 text-right text-gray-700 tabular-nums">{formatCurrency(pb[m].out)}</td>
        <td
         className={`px-2 py-2 text-right font-medium tabular-nums ${
          pb[m].net < 0 ? "text-red-600" : "text-gray-900"
         }`}
        >
         {formatCurrency(pb[m].net)}
        </td>
       </tr>
      ))}
      <tr className="border-t-2 border-gray-400 bg-orange-50/40 print:bg-transparent">
       <td className="px-2 py-2 font-bold uppercase text-orange-700 print:text-gray-900">Total</td>
       <td className="px-2 py-2 text-right font-bold text-orange-700 print:text-gray-900 tabular-nums">{formatCurrency(totalIn)}</td>
       <td className="px-2 py-2 text-right font-bold text-orange-700 print:text-gray-900 tabular-nums">{formatCurrency(totalOut)}</td>
       <td className="px-2 py-2 text-right font-bold text-orange-700 print:text-gray-900 tabular-nums">{formatCurrency(totalNet)}</td>
      </tr>
     </tbody>
    </table>
   </div>

   {data.takings.accountBreakdown && data.takings.accountBreakdown.length > 0 && (
    <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
     <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">By account (pots)</h3>
     <div className="overflow-x-auto">
      <table className="min-w-full text-xs @[768px]:text-sm">
       <thead>
        <tr className="text-gray-500">
         <th className="px-2 py-1 text-left font-medium">Account</th>
         <th className="px-2 py-1 text-left font-medium">Type</th>
         <th className="px-2 py-1 text-right font-medium">In</th>
         <th className="px-2 py-1 text-right font-medium">Out</th>
         <th className="px-2 py-1 text-right font-medium">Net</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {data.takings.accountBreakdown.map((row) => (
         <tr key={row.accountId}>
          <td className="px-2 py-1.5 text-gray-900">{row.accountName}</td>
          <td className="px-2 py-1.5 text-gray-600">{row.type.replace("_", " ")}</td>
          <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums">{formatCurrency(row.in)}</td>
          <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums">{formatCurrency(row.out)}</td>
          <td className={`px-2 py-1.5 text-right font-medium tabular-nums ${row.net < 0 ? "text-red-600" : "text-gray-900"}`}>
           {formatCurrency(row.net)}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   )}

   <footer className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center">
    <p className="text-[10px] @[768px]:text-xs uppercase tracking-widest text-gray-500">
     — End of Z-Read —
    </p>
    <div className="mt-6 grid grid-cols-2 gap-4 print:gap-12">
     <div className="text-left">
      <div className="border-t border-gray-400 pt-1 text-[10px] @[768px]:text-xs text-gray-600">Cashier signature</div>
     </div>
     <div className="text-left">
      <div className="border-t border-gray-400 pt-1 text-[10px] @[768px]:text-xs text-gray-600">Manager signature</div>
     </div>
    </div>
   </footer>
  </section>
 );
}

function ZStat({
 label,
 value,
 negative,
 highlight,
}: {
 label: string;
 value: string;
 negative?: boolean;
 highlight?: boolean;
}) {
 return (
  <div>
   <p className="text-[10px] @[768px]:text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
   <p
    className={`mt-0.5 text-sm @[768px]:text-base font-bold tabular-nums ${
     negative ? "text-red-600" : highlight ? "text-orange-700 print:text-gray-900" : "text-gray-900"
    }`}
   >
    {value}
   </p>
  </div>
 );
}

function ZReadSkeleton() {
 return (
  <div className="mx-auto max-w-3xl rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 shadow-sm">
   <div className="h-6 w-2/3 mx-auto bg-gray-100 animate-pulse rounded mb-4" />
   <div className="grid grid-cols-3 gap-3 mb-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
     <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
    ))}
   </div>
   <div className="h-40 bg-gray-100 animate-pulse rounded" />
  </div>
 );
}

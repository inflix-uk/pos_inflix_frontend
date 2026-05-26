"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 ChevronLeft,
 MapPin,
 Calendar,
 RefreshCw,
 Search,
 ArrowUpDown,
 Loader2,
 Package,
 Filter,
} from "lucide-react";
import { salesApi, type SaleRecord } from "@/app/(routes)/sales-dashboard/service/salesApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import {
 getDashboardRangeUtc,
 type DashboardRange,
} from "@/lib/dateUtils";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(n);
}

function toLondonDateKey(d: Date): string {
 return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

function formatLondonDateTime(iso: string): string {
 if (!iso) return "";
 const d = new Date(iso);
 if (Number.isNaN(d.getTime())) return "";
 return d.toLocaleString("en-GB", {
  timeZone: "Europe/London",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
 });
}

const STORAGE_KEY = "sales-item-wise-locationId";

interface LineRow {
 saleId: string;
 reference: string;
 createdAt: string;
 sku: string;
 name: string;
 price: number;
 quantity: number;
 amount: number;
 brand?: string;
 colour?: string;
 grade?: string;
 brandModel?: string;
 capacity?: string;
}

type SortKey = "createdAt" | "name" | "quantity" | "amount" | "reference";
type SaleTypeFilter = "all" | "retail" | "wholesale" | "repair";

export default function SalesItemWiseOrdersPage() {
 const { user } = usePermissionsContext();
 const [allLocations, setAllLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

 const [range, setRange] = useState<DashboardRange>("today");
 const [customFrom, setCustomFrom] = useState("");
 const [customTo, setCustomTo] = useState("");
 const [from, setFrom] = useState(() => toLondonDateKey(new Date()));
 const [to, setTo] = useState(() => toLondonDateKey(new Date()));

 const [saleType, setSaleType] = useState<SaleTypeFilter>("all");
 const [salesCount, setSalesCount] = useState(0);
 const [items, setItems] = useState<LineRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const [search, setSearch] = useState("");
 const [sortKey, setSortKey] = useState<SortKey>("createdAt");
 const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

 useEffect(() => {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  const qpFrom = sp.get("from");
  const qpTo = sp.get("to");
  const qpLoc = sp.get("locationId");
  if (qpFrom && qpTo) {
   setRange("custom");
   setCustomFrom(qpFrom);
   setCustomTo(qpTo);
  }
  if (qpLoc) {
   setSelectedLocationId(qpLoc);
   return;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) setSelectedLocationId(stored);
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

 const flatten = useCallback((sales: SaleRecord[]) => {
  const rows: LineRow[] = [];
  for (const sale of sales) {
   if (!sale.items || sale.items.length === 0) continue;
   for (const item of sale.items) {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    rows.push({
     saleId: sale._id,
     reference: sale.reference,
     createdAt: sale.createdAt,
     sku: item.sku || "—",
     name: item.name,
     price,
     quantity: qty,
     amount: price * qty,
     brand: item.brand,
     colour: item.colour,
     grade: item.grade,
     brandModel: item.brandModel,
     capacity: item.capacity,
    });
   }
  }
  return rows;
 }, []);

 const load = useCallback(async () => {
  setLoading(true);
  setError("");
  try {
   const dateRange = getDashboardRangeUtc(range, customFrom, customTo);
   const fromStr = toLondonDateKey(dateRange.fromUtc);
   const toStr = toLondonDateKey(dateRange.toUtc);
   setFrom(fromStr);
   setTo(toStr);

   const limit = 200;
   const all: SaleRecord[] = [];
   let page = 1;
   const maxPages = 50;
   while (page <= maxPages) {
    const res = await salesApi.getSales({
     from: fromStr,
     to: toStr,
     locationId: selectedLocationId !== "all" ? selectedLocationId : undefined,
     type: saleType !== "all" ? saleType : undefined,
     page,
     limit,
     order: "desc",
     includeItems: true,
    });
    all.push(...res.data);
    if (page >= res.pages || res.data.length === 0) break;
    page += 1;
   }
   setSalesCount(all.length);
   setItems(flatten(all));
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load items");
  } finally {
   setLoading(false);
  }
 }, [range, customFrom, customTo, selectedLocationId, saleType, flatten]);

 useEffect(() => {
  load();
 }, [load]);

 const filteredSorted = useMemo(() => {
  const term = search.trim().toLowerCase();
  const filtered = term
   ? items.filter(
      (i) =>
       i.name.toLowerCase().includes(term) ||
       i.sku.toLowerCase().includes(term) ||
       i.reference.toLowerCase().includes(term) ||
       (i.brand || "").toLowerCase().includes(term) ||
       (i.brandModel || "").toLowerCase().includes(term)
     )
   : items;
  const sorted = [...filtered].sort((a, b) => {
   let cmp = 0;
   if (sortKey === "name") cmp = a.name.localeCompare(b.name);
   else if (sortKey === "reference") cmp = a.reference.localeCompare(b.reference);
   else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
   else if (sortKey === "amount") cmp = a.amount - b.amount;
   else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
   return sortDir === "asc" ? cmp : -cmp;
  });
  return sorted;
 }, [items, search, sortKey, sortDir]);

 const totalQty = useMemo(
  () => filteredSorted.reduce((s, i) => s + i.quantity, 0),
  [filteredSorted]
 );
 const totalAmount = useMemo(
  () => filteredSorted.reduce((s, i) => s + i.amount, 0),
  [filteredSorted]
 );

 const toggleSort = (key: SortKey) => {
  if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  else {
   setSortKey(key);
   setSortDir(key === "name" || key === "reference" ? "asc" : "desc");
  }
 };

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

 const exportCsv = () => {
  const header = ["Created", "Invoice", "SKU", "Item", "Brand", "Model", "Colour", "Grade", "Qty", "Unit Price (GBP)", "Line Total (GBP)"];
  const rows = filteredSorted.map((i) => [
   formatLondonDateTime(i.createdAt),
   i.reference,
   i.sku,
   i.name,
   i.brand || "",
   i.brandModel || "",
   i.colour || "",
   i.grade || "",
   String(i.quantity),
   i.price.toFixed(2),
   i.amount.toFixed(2),
  ]);
  const csv = [header, ...rows]
   .map((r) =>
    r
     .map((cell) => {
      const s = String(cell ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
       return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
     })
     .join(",")
   )
   .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-items-${from}_to_${to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
 };

 return (
  <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
   <div className="mb-3 @[640px]:mb-4">
    <Link
     href="/sales-online-orders"
     className="inline-flex items-center gap-1 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-600 hover:text-gray-900"
    >
     <ChevronLeft className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4" /> Back to Sales
    </Link>
   </div>

   <header className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col gap-2 @[640px]:gap-3 @[768px]:gap-4">
    <div>
     <h1 className="text-base @[480px]:text-lg @[640px]:text-xl @[1024px]:text-2xl font-bold text-gray-900 flex items-center gap-2">
      <Package className="h-5 w-5 @[768px]:h-6 @[768px]:w-6 text-orange-600" />
      Sales — Item-wise
     </h1>
     <p className="mt-0.5 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">
      All items sold in the selected period, aggregated by SKU. Times in Europe/London.
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

     <div className="flex items-center gap-1.5 @[640px]:gap-2">
      <MapPin className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0 text-gray-500" />
      <select
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

     <div className="flex items-center gap-1.5 @[640px]:gap-2">
      <Filter className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0 text-gray-500" />
      <select
       value={saleType}
       onChange={(e) => setSaleType(e.target.value as SaleTypeFilter)}
       disabled={loading}
       className="rounded-lg border border-gray-300 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
      >
       <option value="all">All types</option>
       <option value="retail">Retail</option>
       <option value="wholesale">Wholesale</option>
       <option value="repair">Repair</option>
      </select>
     </div>

     <button
      type="button"
      onClick={load}
      disabled={loading}
      className="inline-flex items-center gap-1.5 @[640px]:gap-2 rounded-lg border border-gray-200 bg-white px-2 @[640px]:px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      title="Refresh"
     >
      <RefreshCw className={`h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 ${loading ? "animate-spin" : ""}`} />
      Refresh
     </button>

     <button
      type="button"
      onClick={exportCsv}
      disabled={loading || filteredSorted.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 @[768px]:px-3 py-1.5 @[768px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
     >
      Export CSV
     </button>
    </div>

    <div className="flex items-center gap-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">
     <span>{dateRangeLabel}</span>
     <span aria-hidden>·</span>
     <span>
      {from} → {to}
     </span>
    </div>
   </header>

   {error && (
    <div className="mb-3 @[640px]:mb-4 rounded-lg border border-red-200 bg-red-50 px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-red-700">
     {error}
    </div>
   )}

   <section className="mb-3 grid grid-cols-2 @[640px]:grid-cols-4 gap-2 @[768px]:gap-3">
    <StatCard label="Sales" value={String(salesCount)} />
    <StatCard label="Line items" value={String(items.length)} />
    <StatCard label="Total qty sold" value={String(totalQty)} highlight />
    <StatCard label="Total amount" value={formatCurrency(totalAmount)} highlight />
   </section>

   <div className="mb-3 rounded-xl border border-gray-200 bg-white p-2.5 @[640px]:p-3 shadow-sm">
    <div className="relative">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
     <input
      type="text"
      placeholder="Search by name, SKU, brand, or model…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
     />
    </div>
   </div>

   <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
    {loading ? (
     <div className="flex items-center justify-center py-16">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
     </div>
    ) : filteredSorted.length === 0 ? (
     <p className="py-16 text-center text-sm text-gray-500">
      {items.length === 0
       ? "No items found for this period."
       : "No items match your search."}
     </p>
    ) : (
     <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-[11px] @[640px]:text-xs @[768px]:text-sm">
       <thead className="bg-gray-50">
        <tr>
         <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
         <th className="px-3 py-2 text-left font-medium text-gray-500">
          <button
           type="button"
           onClick={() => toggleSort("createdAt")}
           className="inline-flex items-center gap-1 hover:text-gray-700"
          >
           Created
           <ArrowUpDown className="h-3 w-3" />
          </button>
         </th>
         <th className="px-3 py-2 text-left font-medium text-gray-500">
          <button
           type="button"
           onClick={() => toggleSort("reference")}
           className="inline-flex items-center gap-1 hover:text-gray-700"
          >
           Invoice
           <ArrowUpDown className="h-3 w-3" />
          </button>
         </th>
         <th className="px-3 py-2 text-left font-medium text-gray-500">
          <button
           type="button"
           onClick={() => toggleSort("name")}
           className="inline-flex items-center gap-1 hover:text-gray-700"
          >
           Item
           <ArrowUpDown className="h-3 w-3" />
          </button>
         </th>
         <th className="px-3 py-2 text-right font-medium text-gray-500">
          <button
           type="button"
           onClick={() => toggleSort("quantity")}
           className="inline-flex items-center gap-1 hover:text-gray-700"
          >
           Qty
           <ArrowUpDown className="h-3 w-3" />
          </button>
         </th>
         <th className="px-3 py-2 text-right font-medium text-gray-500">
          Unit price
         </th>
         <th className="px-3 py-2 text-right font-medium text-gray-500">
          <button
           type="button"
           onClick={() => toggleSort("amount")}
           className="inline-flex items-center gap-1 hover:text-gray-700"
          >
           Total
           <ArrowUpDown className="h-3 w-3" />
          </button>
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {filteredSorted.map((row, idx) => (
         <tr key={row.saleId + ":" + idx} className="hover:bg-gray-50">
          <td className="px-3 py-2 text-gray-400 align-top">{idx + 1}</td>
          <td className="whitespace-nowrap px-3 py-2 text-gray-500 align-top tabular-nums text-[10px] @[640px]:text-xs">
           {formatLondonDateTime(row.createdAt)}
          </td>
          <td className="whitespace-nowrap px-3 py-2 align-top">
           <Link
            href={`/sales-online-orders/edit/${row.saleId}`}
            className="font-mono font-medium text-gray-700 hover:text-orange-700"
           >
            {row.reference}
           </Link>
          </td>
          <td className="px-3 py-2 text-gray-900 align-top">
           <div className="font-medium">{row.name}</div>
           {(row.brand || row.brandModel || row.colour || row.grade || row.capacity) && (
            <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] @[640px]:text-xs text-gray-500">
             {row.brand && <span>{row.brand}</span>}
             {row.brandModel && <span>· {row.brandModel}</span>}
             {row.capacity && <span>· {row.capacity}</span>}
             {row.colour && <span>· {row.colour}</span>}
             {row.grade && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5">
               {row.grade}
              </span>
             )}
            </div>
           )}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-700 align-top">
           {row.quantity}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-700 align-top">
           {formatCurrency(row.price)}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-gray-900 align-top">
           {formatCurrency(row.amount)}
          </td>
         </tr>
        ))}
       </tbody>
       <tfoot>
        <tr className="border-t-2 border-gray-300 bg-orange-50/30">
         <td className="px-3 py-2"></td>
         <td className="px-3 py-2"></td>
         <td className="px-3 py-2"></td>
         <td className="px-3 py-2 font-bold uppercase text-orange-700">Total</td>
         <td className="px-3 py-2 text-right font-bold tabular-nums text-orange-700">
          {totalQty}
         </td>
         <td className="px-3 py-2"></td>
         <td className="px-3 py-2 text-right font-bold tabular-nums text-orange-700">
          {formatCurrency(totalAmount)}
         </td>
        </tr>
       </tfoot>
      </table>
     </div>
    )}
   </div>
  </div>
 );
}

function StatCard({
 label,
 value,
 highlight,
}: {
 label: string;
 value: string;
 highlight?: boolean;
}) {
 return (
  <div
   className={`rounded-xl border bg-white p-3 shadow-sm ${
    highlight ? "border-orange-200 bg-orange-50/30" : "border-gray-200"
   }`}
  >
   <p className="text-[10px] @[640px]:text-xs font-medium uppercase tracking-wide text-gray-500">
    {label}
   </p>
   <p
    className={`mt-1 text-sm @[640px]:text-base @[1024px]:text-lg font-bold tabular-nums ${
     highlight ? "text-orange-700" : "text-gray-900"
    }`}
   >
    {value}
   </p>
  </div>
 );
}

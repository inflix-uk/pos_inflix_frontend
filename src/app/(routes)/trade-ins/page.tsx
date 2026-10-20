"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Plus, Printer, Search, Smartphone } from "lucide-react";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { openTradeInPdf } from "@/lib/tradeInPdf";
import { usePermissions } from "@/hooks/usePermissions";
import { tradeInApi } from "./service/tradeInApi";
import { PAYOUT_LABELS, type TradeIn } from "./types";

const money = (n: number) => `£${(Number(n) || 0).toFixed(2)}`;
const PAGE_SIZE = 20;

function itemsSummary(t: TradeIn): string {
 const names = (t.items || []).map((it) => it.description).filter(Boolean);
 if (names.length === 0) return "—";
 return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2} more` : names.join(", ");
}

export default function TradeInsListPage() {
 const router = useRouter();
 const { can } = usePermissions();
 const [rows, setRows] = useState<TradeIn[]>([]);
 const [search, setSearch] = useState("");
 const [debounced, setDebounced] = useState("");
 const [page, setPage] = useState(1);
 const [pages, setPages] = useState(1);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [printingId, setPrintingId] = useState<string | null>(null);

 useEffect(() => {
  const h = setTimeout(() => setDebounced(search.trim()), 300);
  return () => clearTimeout(h);
 }, [search]);
 useEffect(() => setPage(1), [debounced]);

 const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
   const res = await tradeInApi.list({ search: debounced, status: "completed", page, limit: PAGE_SIZE });
   setRows(res.data);
   setPages(res.pages);
   setTotal(res.total);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Could not load trade-ins.");
  } finally {
   setLoading(false);
  }
 }, [debounced, page]);

 useEffect(() => {
  load();
 }, [load]);

 const printRow = async (t: TradeIn) => {
  setPrintingId(t._id);
  try {
   const [full, files, meta] = await Promise.all([
    tradeInApi.get(t._id),
    tradeInApi.getFiles(t._id),
    tradeInApi.meta().catch(() => null),
   ]);
   openTradeInPdf({ tradeIn: full, files, meta, location: full.location ?? null });
  } catch (e) {
   setError(e instanceof Error ? e.message : "Could not build the PDF.");
  } finally {
   setPrintingId(null);
  }
 };

 return (
  <div className="min-h-screen bg-gray-50 p-6">
   <div className="mx-auto max-w-6xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div>
      <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
       <Smartphone className="h-5 w-5 text-lime-700" /> Trade-ins
      </h1>
      <p className="text-sm text-gray-500">Devices bought from customers. Each one is also a purchase under the Trade-in account.</p>
     </div>
     {can("tradein.create") && (
      <Link
       href="/trade-ins/new"
       className="inline-flex items-center gap-2 rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-800"
      >
       <Plus className="h-4 w-4" /> New trade-in
      </Link>
     )}
    </div>

    <div className="relative max-w-md">
     <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
     <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search name, mobile, IMEI or TI- number"
      className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-lime-500 focus:ring-2 focus:ring-lime-500/40"
     />
    </div>

    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}

    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
     <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
       <tr>
        <th className="px-4 py-2">Ref</th>
        <th className="px-4 py-2">Date</th>
        <th className="px-4 py-2">Customer</th>
        <th className="px-4 py-2">Devices</th>
        <th className="px-4 py-2 text-right">Paid</th>
        <th className="px-4 py-2">By</th>
        <th className="px-4 py-2" />
       </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
       {loading ? (
        <tr>
         <td colSpan={7} className="px-4 py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
         </td>
        </tr>
       ) : rows.length === 0 ? (
        <tr>
         <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
          {debounced ? "No trade-ins match your search." : "No trade-ins yet."}
         </td>
        </tr>
       ) : (
        rows.map((t) => (
         <tr key={t._id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/trade-ins/${t._id}`)}>
          <td className="px-4 py-2 font-medium text-gray-900">{t.reference}</td>
          <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDateTimeLondon(t.completedAt)}</td>
          <td className="px-4 py-2">
           <div className="text-gray-900">{t.customer?.name}</div>
           <div className="text-xs text-gray-500">{t.customer?.phone}</div>
          </td>
          <td className="max-w-xs px-4 py-2 text-gray-700">
           <div className="truncate" title={itemsSummary(t)}>{itemsSummary(t)}</div>
           <div className="text-xs text-gray-500">
            {t.totalUnits} item{t.totalUnits === 1 ? "" : "s"} · {t.purchaseNumber}
           </div>
          </td>
          <td className="whitespace-nowrap px-4 py-2 text-right">
           <div className="font-medium text-gray-900">{money(t.totalAmount)}</div>
           <div className="text-xs text-gray-500">{PAYOUT_LABELS[t.payoutMethod] || t.payoutMethod}</div>
          </td>
          <td className="px-4 py-2 text-gray-700">
           {t.completedBy && typeof t.completedBy === "object" ? t.completedBy.name : "—"}
          </td>
          <td className="px-4 py-2 text-right">
           <button
            type="button"
            onClick={(e) => {
             e.stopPropagation();
             printRow(t);
            }}
            disabled={printingId === t._id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            aria-label={`Print ${t.reference}`}
           >
            {printingId === t._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            PDF
           </button>
          </td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>

    {pages > 1 && (
     <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
       {total} trade-in{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
       <button
        type="button"
        onClick={() => setPage((x) => Math.max(1, x - 1))}
        disabled={page <= 1}
        className="rounded-lg border border-gray-300 bg-white p-1.5 disabled:opacity-40"
        aria-label="Previous page"
       >
        <ChevronLeft className="h-4 w-4" />
       </button>
       <span>
        Page {page} of {pages}
       </span>
       <button
        type="button"
        onClick={() => setPage((x) => Math.min(pages, x + 1))}
        disabled={page >= pages}
        className="rounded-lg border border-gray-300 bg-white p-1.5 disabled:opacity-40"
        aria-label="Next page"
       >
        <ChevronRight className="h-4 w-4" />
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

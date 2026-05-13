"use client";

import React from "react";
import Link from "next/link";
import { useStockTransfersList } from "./hooks/useStockTransfersList";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { Plus, Eye } from "lucide-react";
import type { StockTransfer } from "./types";

const STATUSES: Array<"Draft" | "Dispatched" | "Received" | "Cancelled"> = ["Draft", "Dispatched", "Received", "Cancelled"];

function fromTo(t: StockTransfer): string {
 const from = typeof t.fromLocationId === "object" && t.fromLocationId ? t.fromLocationId.name : "—";
 const to = typeof t.toLocationId === "object" && t.toLocationId ? t.toLocationId.name : "—";
 return `${from} → ${to}`;
}

function createdBy(t: StockTransfer): string {
 const u = t.createdByUserId;
 return typeof u === "object" && u && "name" in u ? (u as { name?: string }).name ?? "—" : "—";
}

export default function StockTransfersListPage() {
 const { can } = usePermissions();
 const canView = can("stock_transfer.view");
 const canCreate = can("stock_transfer.create");

 const {
 transfers,
 locations,
 pagination,
 loading,
 message,
 setMessage,
 filters,
 setFilter,
 setPage,
 refresh,
 } = useStockTransfersList();

 if (!canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to view stock transfers.</p>
 </div>
 );
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col gap-3 @[640px]:gap-4 @[640px]:flex-row @[640px]:items-center @[640px]:justify-between">
 <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900">Stock Transfers</h1>
  <p className="text-xs @[640px]:text-sm text-gray-500 mt-0.5">Move stock between locations. Draft → Dispatched → Received.</p>
 </div>
 {canCreate && (
  <Link
  href="/stock-transfers/add"
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 rounded-xl bg-blue-600 text-white text-xs @[640px]:text-sm font-medium hover:bg-blue-700"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  New transfer
  </Link>
 )}
 </div>

 {message && (
 <div
  className={`mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-lg text-xs @[640px]:text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
 >
  {message.text}
  <button type="button" onClick={() => setMessage(null)} className="ml-2 underline">Dismiss</button>
 </div>
 )}

 <div className="mb-3 @[640px]:mb-4 flex flex-wrap gap-2 @[640px]:gap-3 items-center">
 <input
  type="text"
  placeholder="Transfer no"
  value={filters.search ?? ""}
  onChange={(e) => setFilter("search", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm w-28 @[640px]:w-32"
 />
 <input
  type="text"
  placeholder="IMEI search"
  value={filters.imei ?? ""}
  onChange={(e) => setFilter("imei", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm w-32 @[640px]:w-36"
 />
 <select
  value={filters.status ?? ""}
  onChange={(e) => setFilter("status", (e.target.value || undefined) as StockTransfer["status"] | undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All statuses</option>
  {STATUSES.map((s) => (
  <option key={s} value={s}>{s}</option>
  ))}
 </select>
 <select
  value={filters.fromLocationId ?? ""}
  onChange={(e) => setFilter("fromLocationId", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">From: any</option>
  {locations.map((loc) => (
  <option key={loc._id} value={loc._id}>{loc.name}</option>
  ))}
 </select>
 <select
  value={filters.toLocationId ?? ""}
  onChange={(e) => setFilter("toLocationId", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">To: any</option>
  {locations.map((loc) => (
  <option key={loc._id} value={loc._id}>{loc.name}</option>
  ))}
 </select>
 <input
  type="datetime-local"
  value={filters.fromUtc ? new Date(filters.fromUtc).toISOString().slice(0, 16) : ""}
  onChange={(e) => setFilter("fromUtc", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 />
 <input
  type="datetime-local"
  value={filters.toUtc ? new Date(filters.toUtc).toISOString().slice(0, 16) : ""}
  onChange={(e) => setFilter("toUtc", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 />
 <button type="button" onClick={refresh} className="px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 rounded-lg border border-gray-300 bg-white text-xs @[640px]:text-sm hover:bg-gray-50">
  Refresh
 </button>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Transfer no</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Created (London)</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">From → To</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Status</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Created by</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {loading ? (
  <tr><td colSpan={6} className="px-3 @[640px]:px-4 py-6 @[640px]:py-8 text-center text-gray-500 text-xs @[640px]:text-sm">Loading…</td></tr>
  ) : (
  transfers.map((t) => (
   <tr key={t._id} className="hover:bg-gray-50">
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-mono text-gray-900">{t.transferNo}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700 whitespace-nowrap">{formatDateTimeLondon(t.createdAt)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700">{fromTo(t)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3">
   <span className={`inline-flex px-2 py-0.5 text-[10px] @[640px]:text-xs font-medium rounded-full ${
   t.status === "Received" ? "bg-green-100 text-green-800" :
   t.status === "Dispatched" ? "bg-blue-100 text-blue-800" :
   t.status === "Cancelled" ? "bg-red-100 text-red-800" :
   "bg-gray-100 text-gray-800"
   }`}>
   {t.status}
   </span>
   </td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{createdBy(t)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right">
   <Link
   href={`/stock-transfers/${t._id}`}
   className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs @[640px]:text-sm"
   >
   <Eye className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
   View
   </Link>
   </td>
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>
 {pagination.pages > 1 && (
  <div className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 border-t border-gray-200 flex items-center justify-between">
  <span className="text-xs @[640px]:text-sm text-gray-600">
  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
  </span>
  <div className="flex gap-1.5 @[640px]:gap-2">
  <button
  type="button"
  disabled={pagination.page <= 1}
  onClick={() => setPage(pagination.page - 1)}
  className="px-2.5 @[640px]:px-3 py-1 rounded border border-gray-300 text-xs @[640px]:text-sm disabled:opacity-50"
  >
  Previous
  </button>
  <button
  type="button"
  disabled={pagination.page >= pagination.pages}
  onClick={() => setPage(pagination.page + 1)}
  className="px-2.5 @[640px]:px-3 py-1 rounded border border-gray-300 text-xs @[640px]:text-sm disabled:opacity-50"
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

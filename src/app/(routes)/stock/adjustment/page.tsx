"use client";

import React from "react";
import Link from "next/link";
import { useStockAdjustmentsList } from "./hooks/useStockAdjustmentsList";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { Plus, Eye } from "lucide-react";
import type { StockAdjustment, StockAdjustmentStatus, StockAdjustmentReasonCode } from "./types";

const STATUSES: StockAdjustmentStatus[] = ["Draft", "Posted", "Cancelled"];
const REASON_LABELS: Record<string, string> = {
 COUNT_CORRECTION: "Count correction",
 DAMAGED: "Damaged",
 LOST_STOLEN: "Lost/Stolen",
 SUPPLIER_DISCREPANCY: "Supplier discrepancy",
 DATA_FIX: "Data fix",
 OTHER: "Other",
};

function locationName(adj: StockAdjustment): string {
 const loc = adj.locationId;
 return typeof loc === "object" && loc && "name" in loc ? (loc as { name?: string }).name ?? "—" : "—";
}

function createdBy(adj: StockAdjustment): string {
 const u = adj.createdByUserId;
 return typeof u === "object" && u && "name" in u ? (u as { name?: string }).name ?? "—" : "—";
}

export default function StockAdjustmentListPage() {
 const { can } = usePermissions();
 const canView = can("stock_adjustment.view");
 const canCreate = can("stock_adjustment.create");

 const {
 adjustments,
 locations,
 reasonCodes,
 pagination,
 loading,
 message,
 setMessage,
 filters,
 setFilter,
 setPage,
 refresh,
 } = useStockAdjustmentsList();

 if (!canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to view stock adjustments.</p>
 </div>
 );
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col gap-3 @[640px]:gap-4 @[640px]:flex-row @[640px]:items-center @[640px]:justify-between">
 <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900">Stock Adjustment</h1>
  <p className="text-xs @[640px]:text-sm text-gray-500 mt-0.5">
  Correct stock when physical ≠ system. All changes create ledger entries (auditable).
  </p>
 </div>
 {canCreate && (
  <Link
  href="/stock/adjustment/add"
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 rounded-xl bg-orange-500 text-white text-xs @[640px]:text-sm font-medium hover:bg-orange-600"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  New adjustment
  </Link>
 )}
 </div>

 {message && (
 <div
  className={`mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-lg text-xs @[640px]:text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
 >
  {message.text}
  <button type="button" onClick={() => setMessage(null)} className="ml-2 underline">
  Dismiss
  </button>
 </div>
 )}

 <div className="mb-3 @[640px]:mb-4 flex flex-wrap gap-2 @[640px]:gap-3 items-center">
 <input
  type="text"
  placeholder="Adjustment no"
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
  onChange={(e) => setFilter("status", (e.target.value || undefined) as StockAdjustmentStatus | undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All statuses</option>
  {STATUSES.map((s) => (
  <option key={s} value={s}>{s}</option>
  ))}
 </select>
 <select
  value={filters.locationId ?? ""}
  onChange={(e) => setFilter("locationId", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All locations</option>
  {locations.map((loc) => (
  <option key={loc._id} value={loc._id}>{loc.name}</option>
  ))}
 </select>
 <select
  value={filters.reasonCode ?? ""}
  onChange={(e) => setFilter("reasonCode", (e.target.value || undefined) as StockAdjustmentReasonCode | undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All reasons</option>
  {reasonCodes.map((r) => (
  <option key={r} value={r}>{REASON_LABELS[r] ?? r}</option>
  ))}
 </select>
 <button type="button" onClick={refresh} className="px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 rounded-lg border border-gray-300 bg-white text-xs @[640px]:text-sm hover:bg-gray-50">
  Refresh
 </button>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Adjustment no</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Created (London)</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Location</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Reason</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Status</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Created by</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {loading ? (
  <tr><td colSpan={7} className="px-3 @[640px]:px-4 py-6 @[640px]:py-8 text-center text-gray-500 text-xs @[640px]:text-sm">Loading…</td></tr>
  ) : (
  adjustments.map((a) => (
   <tr key={a._id} className="hover:bg-gray-50">
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-mono text-gray-900">{a.adjustmentNo}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700 whitespace-nowrap">{formatDateTimeLondon(a.createdAt)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700">{locationName(a)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{REASON_LABELS[a.reasonCode] ?? a.reasonCode}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3">
   <span className={`inline-flex px-2 py-0.5 text-[10px] @[640px]:text-xs font-medium rounded-full ${
   a.status === "Posted" ? "bg-green-100 text-green-800" :
   a.status === "Cancelled" ? "bg-red-100 text-red-800" :
   "bg-gray-100 text-gray-800"
   }`}>
   {a.status}
   </span>
   </td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{createdBy(a)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right">
   <Link
   href={`/stock/adjustment/${a._id}`}
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

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStockAdjustmentForm } from "../hooks/useStockAdjustmentForm";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { productApi } from "@/app/(routes)/inventory/products/service/productApi";
import type { StockAdjustmentLine, StockAdjustmentSerial } from "../types";
import { ArrowLeft, Trash2 } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
 COUNT_CORRECTION: "Count correction",
 DAMAGED: "Damaged",
 LOST_STOLEN: "Lost/Stolen",
 SUPPLIER_DISCREPANCY: "Supplier discrepancy",
 DATA_FIX: "Data fix",
 OTHER: "Other",
};

function productDisplay(p: StockAdjustmentLine["productId"] | StockAdjustmentSerial["productId"]): string {
 if (!p) return "—";
 if (typeof p === "object" && p && "name" in p) return (p as { name?: string }).name ?? (p as { sku?: string }).sku ?? "—";
 return "—";
}

export default function StockAdjustmentDetailPage() {
 const params = useParams();
 const router = useRouter();
 const id = typeof params.id === "string" ? params.id : null;
 const { can } = usePermissions();
 const canView = can("stock_adjustment.view");
 const canEditDraft = can("stock_adjustment.edit_draft") || can("stock_adjustment.create");
 const canPost = can("stock_adjustment.post");
 const canCancel = can("stock_adjustment.cancel");

 const {
 adjustment,
 stockMoves,
 loading,
 message,
 setMessage,
 refresh,
 updateAdjustment,
 addLine,
 removeLine,
 addSerial,
 removeSerial,
 post,
 cancel,
 } = useStockAdjustmentForm(id);

 const [products, setProducts] = useState<{ _id: string; name?: string; sku?: string }[]>([]);
 const [selectedProductId, setSelectedProductId] = useState("");
 const [deltaQty, setDeltaQty] = useState("");
 const [serialInput, setSerialInput] = useState("");
 const [serialDirection, setSerialDirection] = useState<"IN" | "OUT">("OUT");
 const scanRef = useRef<HTMLInputElement>(null);
 const isDraft = adjustment?.status === "Draft";

 useEffect(() => {
 productApi.getAll({ limit: 500, isActive: true }).then((res) => {
 const data = (res as { data?: { _id: string; name?: string; sku?: string }[] }).data;
 if (Array.isArray(data)) setProducts(data);
 }).catch(() => {});
 }, []);

 useEffect(() => {
 if (isDraft && scanRef.current) scanRef.current.focus();
 }, [isDraft]);

 const handleAddLine = useCallback(
 async (e: React.FormEvent) => {
 e.preventDefault();
 if (!id || !selectedProductId || !deltaQty) return;
 const qty = parseFloat(deltaQty);
 if (!Number.isFinite(qty) || qty === 0) return;
 await addLine({ productId: selectedProductId, deltaQty: qty });
 setDeltaQty("");
 },
 [id, selectedProductId, deltaQty, addLine]
 );

 const handleAddSerial = useCallback(
 async (e: React.FormEvent) => {
 e.preventDefault();
 const s = serialInput.trim();
 if (!id || !s) return;
 await addSerial({ serialOrImei: s, direction: serialDirection });
 setSerialInput("");
 },
 [id, serialInput, serialDirection, addSerial]
 );

 if (!canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to view this adjustment.</p>
 </div>
 );
 }

 if (loading || !adjustment) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <p className="text-gray-600">{loading ? "Loading…" : "Adjustment not found."}</p>
 </div>
 );
 }

 const loc = adjustment.locationId;
 const locationName = typeof loc === "object" && loc && "name" in loc ? (loc as { name?: string }).name ?? "—" : "—";
 const hasCostMissing = [...(adjustment.lines || []), ...(adjustment.serials || [])].some((x) => x.costMissing);
 const canPostThis = isDraft && canPost && (adjustment.lines?.length || adjustment.serials?.length) && !hasCostMissing;

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <Link
 href="/stock/adjustment"
 className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm mb-4"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to list
 </Link>

 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
 <h1 className="text-2xl font-bold text-gray-900">
  {adjustment.adjustmentNo} — {adjustment.status}
 </h1>
 <div className="flex gap-2">
  {isDraft && canPost && (
  <button
  type="button"
  disabled={!canPostThis}
  onClick={() => post()}
  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  Post adjustment
  </button>
  )}
  {isDraft && canCancel && (
  <button
  type="button"
  onClick={() => cancel()}
  className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
  >
  Cancel draft
  </button>
  )}
 </div>
 </div>

 {message && (
 <div
  className={`mb-4 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
 >
  {message.text}
  <button type="button" onClick={() => setMessage(null)} className="ml-2 underline">
  Dismiss
  </button>
 </div>
 )}

 {hasCostMissing && isDraft && (
 <div className="mb-4 p-4 rounded-lg bg-neutral-100 text-neutral-800 text-sm">
  Some lines have missing cost. Resolve cost or use manager override to post.
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
  <h2 className="text-sm font-semibold text-gray-700 mb-2">Details</h2>
  <dl className="space-y-1 text-sm">
  <div><dt className="text-gray-500">Created</dt><dd>{formatDateTimeLondon(adjustment.createdAt)}</dd></div>
  <div><dt className="text-gray-500">Location</dt><dd>{locationName}</dd></div>
  <div><dt className="text-gray-500">Reason</dt><dd>{REASON_LABELS[adjustment.reasonCode] ?? adjustment.reasonCode}</dd></div>
  {adjustment.notes && (
  <div><dt className="text-gray-500">Notes</dt><dd className="whitespace-pre-wrap">{adjustment.notes}</dd></div>
  )}
  {adjustment.postedAtUtc && (
  <div><dt className="text-gray-500">Posted</dt><dd>{formatDateTimeLondon(adjustment.postedAtUtc)}</dd></div>
  )}
  </dl>
 </div>

 {isDraft && canEditDraft && (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
  <h2 className="text-sm font-semibold text-gray-700 mb-2">Scan IMEI / Serial</h2>
  <form onSubmit={handleAddSerial} className="flex flex-wrap gap-2 items-end">
  <input
  ref={scanRef}
  type="text"
  value={serialInput}
  onChange={(e) => setSerialInput(e.target.value)}
  placeholder="Scan or type serial"
  className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
  />
  <select
  value={serialDirection}
  onChange={(e) => setSerialDirection(e.target.value as "IN" | "OUT")}
  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
  >
  <option value="IN">IN</option>
  <option value="OUT">OUT</option>
  </select>
  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
  Add
  </button>
  </form>
  <p className="text-xs text-gray-500 mt-1">Paste multiple IMEIs (one per line) and add one by one, or scan each.</p>
  </div>
 )}
 </div>

 {isDraft && canEditDraft && (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
  <h2 className="text-sm font-semibold text-gray-700 mb-2">Add quantity line</h2>
  <form onSubmit={handleAddLine} className="flex flex-wrap gap-3 items-end">
  <div className="min-w-[200px]">
  <label className="block text-xs text-gray-500 mb-0.5">Product</label>
  <select
  value={selectedProductId}
  onChange={(e) => setSelectedProductId(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  >
  <option value="">Select product</option>
  {products.map((p) => (
   <option key={p._id} value={p._id}>{p.name ?? p.sku ?? p._id}</option>
  ))}
  </select>
  </div>
  <div className="w-24">
  <label className="block text-xs text-gray-500 mb-0.5">Delta qty (+ / −)</label>
  <input
  type="number"
  step="any"
  value={deltaQty}
  onChange={(e) => setDeltaQty(e.target.value)}
  placeholder="e.g. 5 or -3"
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  />
  </div>
  <button type="submit" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600">
  Add line
  </button>
  </form>
 </div>
 )}

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
 <h2 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">Quantity lines</h2>
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delta</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit cost</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
  {isDraft && canEditDraft && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {!adjustment.lines?.length ? (
  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">No quantity lines. Add above.</td></tr>
  ) : (
  adjustment.lines.map((line) => (
   <tr key={line._id}>
   <td className="px-4 py-2 text-sm">{productDisplay(line.productId)} {line.costMissing && <span className="text-neutral-600">(cost missing)</span>}</td>
   <td className="px-4 py-2 text-sm font-mono">{line.deltaQty > 0 ? `+${line.deltaQty}` : line.deltaQty}</td>
   <td className="px-4 py-2 text-sm">{line.unitCostSnapshot}</td>
   <td className="px-4 py-2 text-sm">{line.valueSnapshot}</td>
   {isDraft && canEditDraft && (
   <td className="px-4 py-2 text-right">
   <button
    type="button"
    onClick={() => removeLine(line._id)}
    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
   >
    <Trash2 className="h-4 w-4" />
   </button>
   </td>
   )}
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
 <h2 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">Serials / IMEIs ({adjustment.serials?.length ?? 0})</h2>
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial / IMEI</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
  {isDraft && canEditDraft && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {!adjustment.serials?.length ? (
  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">No serials. Scan above to add.</td></tr>
  ) : (
  adjustment.serials.map((s) => (
   <tr key={s._id}>
   <td className="px-4 py-2 text-sm font-mono">{s.serialOrImei}</td>
   <td className="px-4 py-2 text-sm">{productDisplay(s.productId)}</td>
   <td className="px-4 py-2 text-sm">{s.direction}</td>
   <td className="px-4 py-2 text-sm">{s.valueSnapshot}</td>
   {isDraft && canEditDraft && (
   <td className="px-4 py-2 text-right">
   <button
    type="button"
    onClick={() => removeSerial(s.serialOrImei)}
    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
   >
    <Trash2 className="h-4 w-4" />
   </button>
   </td>
   )}
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>
 </div>

 {(adjustment.totalQtyIn !== undefined || adjustment.totalQtyOut !== undefined) && (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
  <h2 className="text-sm font-semibold text-gray-700 mb-2">Totals</h2>
  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
  <div><dt className="text-gray-500">Qty in</dt><dd className="font-medium">{adjustment.totalQtyIn ?? 0}</dd></div>
  <div><dt className="text-gray-500">Qty out</dt><dd className="font-medium">{adjustment.totalQtyOut ?? 0}</dd></div>
  <div><dt className="text-gray-500">Value in</dt><dd className="font-medium">{adjustment.totalValueIn ?? 0}</dd></div>
  <div><dt className="text-gray-500">Value out</dt><dd className="font-medium">{adjustment.totalValueOut ?? 0}</dd></div>
  </dl>
 </div>
 )}

 {stockMoves.length > 0 && (
 <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <h2 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">Stock moves (ledger)</h2>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty / Serial</th>
   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {stockMoves.map((m) => (
   <tr key={m._id}>
   <td className="px-4 py-2 text-sm">{m.type}</td>
   <td className="px-4 py-2 text-sm font-mono">{m.quantity ?? m.serialNumber ?? "—"}</td>
   <td className="px-4 py-2 text-sm text-gray-600">{formatDateTimeLondon(m.createdAt)}</td>
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

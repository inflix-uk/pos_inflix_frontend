"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStockTransferForm } from "../hooks/useStockTransferForm";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { ArrowLeft, Truck, PackageCheck, XCircle, Trash2 } from "lucide-react";
import { stockTransferApi } from "../service/stockTransferApi";
import type { StockTransfer, StockTransferLine, StockTransferSerial } from "../types";

function productName(line: StockTransferLine): string {
 const p = line.productId;
 if (typeof p === "object" && p && "name" in p) return (p as { name?: string }).name ?? (p as { sku?: string }).sku ?? "—";
 return "—";
}

function productSku(line: StockTransferLine): string {
 const p = line.productId;
 if (typeof p === "object" && p && "sku" in p) return (p as { sku?: string }).sku ?? "—";
 return "—";
}

interface QuantityLineOption {
 id: string;
 label: string;
 productId?: string | null;
 purchaseId?: string;
 itemId?: string;
 source: string;
}

export default function StockTransferDetailPage() {
 const params = useParams();
 const id = typeof params.id === "string" ? params.id : "";
 const { can } = usePermissions();
 const [lineOptions, setLineOptions] = useState<QuantityLineOption[]>([]);
 const [selectedOptionId, setSelectedOptionId] = useState("");
 const [addQty, setAddQty] = useState("1");
 const canView = can("stock_transfer.view");
 const canCreate = can("stock_transfer.create");
 const canDispatch = can("stock_transfer.dispatch");
 const canReceive = can("stock_transfer.receive");
 const canCancel = can("stock_transfer.cancel");

 const {
 transfer,
 locations,
 loading,
 message,
 setMessage,
 scanInput,
 setScanInput,
 actionLoading,
 loadTransfer,
 updateTransfer,
 addLine,
 removeLine,
 addSerial,
 removeSerial,
 dispatch,
 receive,
 cancel,
 } = useStockTransferForm(id);

 const scanRef = useRef<HTMLInputElement>(null);
 const isDraft = transfer?.status === "Draft";

 useEffect(() => {
 if (isDraft && scanRef.current) scanRef.current.focus();
 }, [isDraft]);

 useEffect(() => {
 if (!transfer) return;
 const fromId = typeof transfer.fromLocationId === "object" ? (transfer.fromLocationId as { _id?: string })._id : transfer.fromLocationId;
 stockTransferApi.getQuantityLineOptions(fromId ?? undefined).then(setLineOptions).catch(() => {});
 }, [transfer]);

 const handleAddLine = useCallback(
 async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedOptionId || !addQty) return;
 const qty = parseFloat(addQty);
 if (!Number.isFinite(qty) || qty <= 0) return;
 const option = lineOptions.find((o) => o.id === selectedOptionId);
 if (!option) return;
 const payload =
 option.productId != null
  ? { productId: option.productId, qty }
  : option.purchaseId && option.itemId
  ? { purchaseId: option.purchaseId, purchaseItemId: option.itemId, qty }
  : null;
 if (!payload) return;
 await addLine(payload);
 setAddQty("1");
 },
 [selectedOptionId, addQty, lineOptions, addLine]
 );

 const handleScanSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const s = scanInput.trim();
 if (s) addSerial(s);
 };

 if (!canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to view this transfer.</p>
 </div>
 );
 }

 if (loading || !transfer) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <p className="text-gray-600">{loading ? "Loading…" : "Transfer not found."}</p>
 </div>
 );
 }

 const fromName = typeof transfer.fromLocationId === "object" && transfer.fromLocationId ? transfer.fromLocationId.name : "—";
 const toName = typeof transfer.toLocationId === "object" && transfer.toLocationId ? transfer.toLocationId.name : "—";

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <Link href="/stock-transfers" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm mb-4">
 <ArrowLeft className="h-4 w-4" />
 Back to list
 </Link>

 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
 <div>
  <h1 className="text-2xl font-bold text-gray-900">{transfer.transferNo}</h1>
  <p className="text-sm text-gray-500 mt-0.5">
  {fromName} → {toName} · {transfer.status}
  </p>
  {transfer.notes && <p className="text-sm text-gray-600 mt-1">{transfer.notes}</p>}
 </div>
 <div className="flex flex-wrap gap-2">
  {isDraft && canDispatch && (transfer.lines?.length || 0) + (transfer.serials?.length || 0) > 0 && (
  <button
  type="button"
  disabled={actionLoading}
  onClick={() => dispatch()}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
  >
  <Truck className="h-4 w-4" />
  Dispatch
  </button>
  )}
  {transfer.status === "Dispatched" && canReceive && (
  <button
  type="button"
  disabled={actionLoading}
  onClick={() => receive()}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
  >
  <PackageCheck className="h-4 w-4" />
  Receive
  </button>
  )}
  {isDraft && canCancel && (
  <button
  type="button"
  disabled={actionLoading}
  onClick={() => confirm("Cancel this transfer?") && cancel()}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
  >
  <XCircle className="h-4 w-4" />
  Cancel
  </button>
  )}
 </div>
 </div>

 {message && (
 <div
  className={`mb-4 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
 >
  {message.text}
  <button type="button" onClick={() => setMessage(null)} className="ml-2 underline">Dismiss</button>
 </div>
 )}

 <div className="grid gap-6 md:grid-cols-2">
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
  <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
  <dl className="space-y-2 text-sm">
  <div><dt className="text-gray-500">Created</dt><dd>{formatDateTimeLondon(transfer.createdAt)}</dd></div>
  {transfer.dispatchedAtUtc && (
  <div><dt className="text-gray-500">Dispatched</dt><dd>{formatDateTimeLondon(transfer.dispatchedAtUtc)}</dd></div>
  )}
  {transfer.receivedAtUtc && (
  <div><dt className="text-gray-500">Received</dt><dd>{formatDateTimeLondon(transfer.receivedAtUtc)}</dd></div>
  )}
  </dl>
  {isDraft && canCreate && (
  <div className="mt-4 space-y-2">
  <label className="block text-sm font-medium text-gray-700">From location</label>
  <select
  value={typeof transfer.fromLocationId === "object" ? transfer.fromLocationId?._id : transfer.fromLocationId}
  onChange={(e) => updateTransfer({ fromLocationId: e.target.value })}
  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
  >
  {locations.map((loc) => (
   <option key={loc._id} value={loc._id}>{loc.name}</option>
  ))}
  </select>
  <label className="block text-sm font-medium text-gray-700 mt-2">To location</label>
  <select
  value={typeof transfer.toLocationId === "object" ? transfer.toLocationId?._id : transfer.toLocationId}
  onChange={(e) => updateTransfer({ toLocationId: e.target.value })}
  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
  >
  {locations.map((loc) => (
   <option key={loc._id} value={loc._id}>{loc.name}</option>
  ))}
  </select>
  </div>
  )}
 </div>

 {isDraft && canCreate && (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
  <h2 className="text-lg font-semibold text-gray-900 mb-3">Scan IMEI / Serial</h2>
  <form onSubmit={handleScanSubmit} className="flex gap-2">
  <input
  ref={scanRef}
  type="text"
  value={scanInput}
  onChange={(e) => setScanInput(e.target.value)}
  placeholder="Scan or type serial"
  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
  autoFocus
  />
  <button
  type="submit"
  disabled={actionLoading || !scanInput.trim()}
  className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
  >
  Add
  </button>
  </form>
  <p className="text-xs text-gray-500 mt-2">Paste multiple IMEIs (one per line) in a text area and add one by one, or scan each.</p>
  </div>
 )}
 </div>

 <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <h2 className="text-lg font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">Quantity lines</h2>
 {isDraft && canCreate && (
  <form onSubmit={handleAddLine} className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3 items-end">
  <div>
  <label className="block text-xs font-medium text-gray-500 mb-1">Product / inventory item</label>
  <select
  value={selectedOptionId}
  onChange={(e) => setSelectedOptionId(e.target.value)}
  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm min-w-[240px]"
  required
  >
  <option value="">Select product or inventory item</option>
  {lineOptions.map((o) => (
   <option key={o.id} value={o.id}>{o.label}</option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
  <input
  type="number"
  min="0.001"
  step="any"
  value={addQty}
  onChange={(e) => setAddQty(e.target.value)}
  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-24"
  />
  </div>
  <button type="submit" disabled={actionLoading || !selectedOptionId} className="px-4 py-1.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
  Add line
  </button>
  </form>
 )}
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
  {isDraft && canCreate && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {(transfer.lines && transfer.lines.length > 0) ? (
  transfer.lines.map((line) => (
   <tr key={line._id}>
   <td className="px-4 py-2 text-sm text-gray-900">{productName(line)}</td>
   <td className="px-4 py-2 text-sm text-gray-600 font-mono">{productSku(line)}</td>
   <td className="px-4 py-2 text-sm text-right">{line.qty}</td>
   {isDraft && canCreate && (
   <td className="px-4 py-2 text-right">
   <button
    type="button"
    onClick={() => line._id && removeLine(line._id)}
    className="text-red-600 hover:underline text-sm"
   >
    <Trash2 className="h-4 w-4 inline" />
   </button>
   </td>
   )}
   </tr>
  ))
  ) : (
  <tr><td colSpan={isDraft && canCreate ? 4 : 3} className="px-4 py-4 text-center text-gray-500 text-sm">No quantity lines. Use the form above to add.</td></tr>
  )}
  </tbody>
  </table>
 </div>
 </div>

 <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <h2 className="text-lg font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">Serials / IMEIs ({transfer.serials?.length ?? 0})</h2>
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial / IMEI</th>
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
  {isDraft && canCreate && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {(transfer.serials && transfer.serials.length > 0) ? (
  transfer.serials.map((ser) => (
   <tr key={ser.serialOrImei}>
   <td className="px-4 py-2 text-sm font-mono text-gray-900">{ser.serialOrImei}</td>
   <td className="px-4 py-2 text-sm text-gray-600">
   {typeof ser.productId === "object" && ser.productId && "name" in ser.productId
   ? (ser.productId as { name?: string }).name ?? (ser.productId as { sku?: string }).sku ?? "—"
   : "—"}
   </td>
   {isDraft && canCreate && (
   <td className="px-4 py-2 text-right">
   <button
    type="button"
    onClick={() => removeSerial(ser.serialOrImei)}
    className="text-red-600 hover:underline text-sm"
   >
    <Trash2 className="h-4 w-4 inline" />
   </button>
   </td>
   )}
   </tr>
  ))
  ) : (
  <tr><td colSpan={isDraft && canCreate ? 3 : 2} className="px-4 py-4 text-center text-gray-500 text-sm">No serials. Scan IMEI above to add.</td></tr>
  )}
  </tbody>
  </table>
 </div>
 </div>

 {false && isDraft && canCreate && (
 <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
  <p className="text-sm text-neutral-800">To add quantity lines: use the API or a future “Add line” form (product + qty). For now you can add serials by scanning.</p>
 </div>
 )}
 </div>
 );
}

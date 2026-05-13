"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
 Search,
 Package,
 Loader2,
 History,
 Truck,
 ShoppingCart,
 FileText,
 ArrowRight,
 X,
 Undo2,
 RotateCcw,
 Trash2,
 Pencil,
 PackageX,
 PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { productHistoryApi, type ProductHistoryResponse } from "./service/productHistoryApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

const formatDate = (d: string) => (d ? formatDateTimeLondon(d) : "—");

const formatMoney = (amount: number, currency = "GBP") =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

interface ProductHistoryModalProps {
 isOpen: boolean;
 onClose: () => void;
 initialSerial?: string;
}

export function ProductHistoryModal({
 isOpen,
 onClose,
 initialSerial = "",
}: ProductHistoryModalProps) {
 const [serial, setSerial] = useState(initialSerial);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [history, setHistory] = useState<ProductHistoryResponse | null>(null);

 const runSearch = useCallback(async (s: string) => {
 const trimmed = s.trim();
 if (!trimmed) return;
 setLoading(true);
 setError(null);
 setHistory(null);
 try {
 const data = await productHistoryApi.getBySerial(trimmed);
 setHistory(data);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to load history");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 if (!isOpen) return;
 setSerial(initialSerial);
 setError(null);
 setHistory(null);
 if (initialSerial.trim()) {
 runSearch(initialSerial);
 }
 }, [isOpen, initialSerial, runSearch]);

 const handleSearch = async (e: React.FormEvent) => {
 e.preventDefault();
 await runSearch(serial);
 };

 const o = history?.origin;
 const productName =
 o?.item?.name && String(o.item.name).trim()
 ? String(o.item.name).trim()
 : o?.item
 ? [o.item.brand, o.item.brandModel, o.item.capacity, o.item.colour, o.item.grade].filter(Boolean).join(" · ") || "—"
 : "—";

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
 <div
 className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-lg shadow-xl"
 role="dialog"
 aria-labelledby="product-history-title"
 >
 <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-gray-200">
  <h2 id="product-history-title" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
  <History className="h-5 w-5 text-orange-500" />
  Product History
  </h2>
  <button
  type="button"
  onClick={onClose}
  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
  aria-label="Close"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
  <form onSubmit={handleSearch} className="mb-6">
  <div className="flex gap-2">
  <div className="relative flex-1">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
   type="text"
   value={serial}
   onChange={(e) => setSerial(e.target.value)}
   placeholder="IMEI or serial number..."
   className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  <button
  type="submit"
  disabled={loading || !serial.trim()}
  className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
  Search
  </button>
  </div>
  </form>

  {error && (
  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
  {error}
  </div>
  )}

  {history && !error && (
  <div className="space-y-4">
  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div>
   <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Serial / IMEI</p>
   <p className="text-lg font-mono font-bold text-gray-900 mt-0.5">{history.serialNumber}</p>
   <p className="text-sm text-gray-600 mt-1">{productName}</p>
   </div>
   <div className="flex items-center gap-2">
   {o?.purchaseId && (
   <Link
   href={`/purchases/edit/${o.purchaseId}`}
   onClick={onClose}
   className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
   >
   <Pencil className="h-4 w-4" />
   Edit product
   </Link>
   )}
   <span
   className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
   history.status === "sold"
    ? "bg-neutral-100 text-neutral-800"
    : history.status === "returned"
    ? "bg-blue-100 text-blue-800"
    : history.status === "not_in_stock"
    ? "bg-red-100 text-red-800"
    : "bg-emerald-100 text-emerald-800"
   }`}
   >
   {history.status === "sold" ? "Sold" : history.status === "returned" ? "Returned" : history.status === "not_in_stock" ? "Not in stock" : "In stock"}
   </span>
   </div>
  </div>
  {o?.item && (
   <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
   {o.item.purchasePrice != null && (
   <div>
   <p className="text-xs text-gray-500">Purchase</p>
   <p className="font-semibold text-gray-900">{formatMoney(o.item.purchasePrice, o.currency)}</p>
   </div>
   )}
   {o.item.salePrice != null && (
   <div>
   <p className="text-xs text-gray-500">Sale price</p>
   <p className="font-semibold text-orange-600">{formatMoney(o.item.salePrice, o.currency)}</p>
   </div>
   )}
   {o.item.grade && (
   <div>
   <p className="text-xs text-gray-500">Condition</p>
   <p className="font-semibold text-gray-900">{o.item.grade}</p>
   </div>
   )}
   </div>
  )}
  </div>

  {o && (
  <div className="rounded-xl border border-gray-200 overflow-hidden">
   <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
   <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
   <Truck className="h-4 w-4 text-orange-500" />
   Origin
   </h3>
   </div>
   <div className="p-4">
   <dl className="grid grid-cols-2 gap-3 text-sm">
   <div>
   <dt className="text-gray-500">Purchase ref</dt>
   <dd className="font-medium text-gray-900">{o.purchaseNumber}</dd>
   </div>
   {o.parcelNumber && (
   <div>
    <dt className="text-gray-500">Purchase</dt>
    <dd className="font-medium text-gray-900">{o.parcelNumber}</dd>
   </div>
   )}
   <div>
   <dt className="text-gray-500">Date</dt>
   <dd className="font-medium text-gray-900">{formatDate(o.createdAt || o.date || "")}</dd>
   </div>
   <div>
   <dt className="text-gray-500">Supplier</dt>
   <dd className="font-medium text-gray-900">{o.supplier || "—"}</dd>
   </div>
   {o.purchaseNote ? (
   <div className="col-span-2">
    <dt className="text-gray-500">Intake note</dt>
    <dd className="font-medium text-gray-900 mt-0.5 whitespace-pre-wrap">{o.purchaseNote}</dd>
   </div>
   ) : null}
   </dl>
   </div>
  </div>
  )}

  <div className="rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
   <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
   <ShoppingCart className="h-4 w-4 text-orange-500" />
   Sales ({history.sales.length})
   </h3>
  </div>
  <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
   {history.sales.length === 0 ? (
   <div className="p-6 text-center text-gray-500 text-sm">
   <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
   No sales for this serial.
   </div>
   ) : (
   history.sales.map((sale) => (
   <div key={`${sale._id}-${sale.createdAt}`} className="p-4">
   <div className="flex justify-between items-start gap-2">
    <div>
    {sale._id ? (
    <Link
    href={`/sales-online-orders/edit/${sale._id}`}
    className="font-medium text-orange-600 hover:text-orange-700 hover:underline"
    >
    {sale.reference}
    </Link>
    ) : (
    <p className="font-medium text-gray-900">{sale.reference}</p>
    )}
    <p className="text-xs text-gray-500">
    {sale.customerName || "Walk-in"} · {formatDate(sale.createdAt)}
    </p>
    </div>
    {sale.total != null && (
    <p className="font-semibold text-gray-900">{formatMoney(sale.total)}</p>
    )}
   </div>
   </div>
   ))
   )}
  </div>
  </div>

  <div className="rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
   <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
   <ArrowRight className="h-4 w-4 text-orange-500" />
   Movement
   </h3>
  </div>
  <div className="p-4">
   {history.movements.length === 0 ? (
   <p className="text-gray-500 text-sm text-center py-2">No movement records.</p>
   ) : (
   <ul className="space-y-3">
   {history.movements.map((m, i) => {
   const isSale = m.type === "sale";
   const isReceived = m.type === "received";
   const isRemoved = m.type === "removed_from_invoice";
   const isReturned = m.type === "returned";
   const isSaleDeleted = m.type === "sale_deleted";
   const isReturnedToSupplier = m.type === "returned_to_supplier";
   const isReceivedFromRepair = m.type === "received_from_repair";
   const iconBg =
    isSale
    ? "bg-neutral-100 text-neutral-600"
    : isReturned
    ? "bg-blue-100 text-blue-600"
    : isRemoved || isSaleDeleted
    ? "bg-gray-100 text-gray-600"
    : isReturnedToSupplier
     ? "bg-rose-100 text-rose-600"
     : isReceivedFromRepair
     ? "bg-emerald-100 text-emerald-600"
     : "bg-emerald-100 text-emerald-600";
   const label = isSale
    ? `Sold${m.to ? ` · To ${m.to}` : ""}`
    : isReceived
    ? `Received · From ${m.from || "Supplier"}`
    : isRemoved
    ? `Removed from invoice${m.reference ? ` · ${m.reference}` : ""}`
    : isReturned
    ? `Returned${m.reference ? ` · ${m.reference}` : ""}${m.returnDestination ? ` (${m.returnDestination.replace(/_/g, " ")})` : ""}`
    : isSaleDeleted
     ? `Sale deleted${m.reference ? ` · ${m.reference}` : ""}`
     : isReturnedToSupplier
     ? `Returned to supplier${m.returnTo ? ` · To ${m.returnTo}` : ""}`
     : isReceivedFromRepair
     ? `Received from repair${m.returnTo ? ` · From ${m.returnTo}` : ""}`
     : "";
   return (
    <li key={i} className="flex gap-3">
    <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${iconBg}`}>
    {isSale ? (
    <ShoppingCart className="h-3.5 w-3.5" />
    ) : isReturned ? (
    <RotateCcw className="h-3.5 w-3.5" />
    ) : isRemoved ? (
    <Undo2 className="h-3.5 w-3.5" />
    ) : isSaleDeleted ? (
    <Trash2 className="h-3.5 w-3.5" />
    ) : isReturnedToSupplier ? (
    <PackageX className="h-3.5 w-3.5" />
    ) : isReceivedFromRepair ? (
    <PackageCheck className="h-3.5 w-3.5" />
    ) : (
    <Truck className="h-3.5 w-3.5" />
    )}
    </div>
    <div className="min-w-0 flex-1">
    <p className="text-sm font-medium text-gray-900">{label}</p>
    {(isReturnedToSupplier || isReceivedFromRepair) && (m.productName || m.returnReason || m.performedBy) ? (
    <dl className="mt-1 text-xs text-gray-600 space-y-0.5">
     {m.productName && (
     <div>
     <span className="text-gray-500">Product: </span>
     <span className="font-medium text-gray-700">{m.productName}</span>
     </div>
     )}
     {m.returnReason && (
     <div>
     <span className="text-gray-500">Reason: </span>
     <span className="text-gray-700">{m.returnReason}</span>
     </div>
     )}
     {m.returnTo && (
     <div>
     <span className="text-gray-500">Return to: </span>
     <span className="text-gray-700">{m.returnTo}</span>
     </div>
     )}
     {m.performedBy && (
     <div>
     <span className="text-gray-500">By: </span>
     <span className="text-gray-700">{m.performedBy}</span>
     </div>
     )}
    </dl>
    ) : null}
    {isReceived && m.purchaseNote ? (
    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap border-l-2 border-neutral-200 pl-2">
     <span className="font-medium text-gray-700">Note: </span>
     {m.purchaseNote}
    </p>
    ) : null}
    <p className="text-xs text-gray-500 mt-0.5">{formatDate(m.date)}</p>
    {isSale && m.amount != null && (
    <p className="text-xs font-semibold text-gray-700">{formatMoney(m.amount)}</p>
    )}
    {isSale && m.saleId && (
    <Link
     href={`/sales-online-orders/edit/${m.saleId}`}
     className="text-xs text-orange-600 hover:underline"
    >
     View invoice
    </Link>
    )}
    {isRemoved && m.saleId && (
    <Link
     href={`/sales-online-orders/edit/${m.saleId}`}
     className="text-xs text-orange-600 hover:underline"
    >
     View invoice
    </Link>
    )}
    {isReturned && m.salesReturnId && (
    <Link
     href={`/sales-return`}
     className="text-xs text-orange-600 hover:underline"
    >
     View returns
    </Link>
    )}
    {(isReturnedToSupplier || isReceivedFromRepair) && m.purchaseReturnId && (
    <Link
     href="/purchases/return"
     className="text-xs text-orange-600 hover:underline"
    >
     View purchase returns
    </Link>
    )}
    </div>
    </li>
   );
   })}
   </ul>
   )}
  </div>
  </div>
  </div>
  )}

  {!history && !loading && !error && (
  <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
  <p className="text-sm text-gray-500">Enter IMEI or serial to view product history.</p>
  </div>
  )}
 </div>
 </div>
 </div>
 );
}

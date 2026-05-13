"use client";

import React, { useState } from "react";
import {
 Search,
 Package,
 Loader2,
 History,
 ArrowRight,
 Truck,
 ShoppingCart,
 Calendar,
 User,
 FileText,
 ChevronRight,
} from "lucide-react";
import { productHistoryApi, type ProductHistoryResponse } from "./service/productHistoryApi";

const formatDate = (d: string) => {
 if (!d) return "—";
 try {
 return new Date(d).toLocaleDateString("en-GB", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
 } catch {
 return d;
 }
};

const formatMoney = (amount: number, currency = "GBP") =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

export default function ProductHistoryPage() {
 const [serial, setSerial] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [history, setHistory] = useState<ProductHistoryResponse | null>(null);

 const handleSearch = async (e: React.FormEvent) => {
 e.preventDefault();
 const s = serial.trim();
 if (!s) return;
 setLoading(true);
 setError(null);
 setHistory(null);
 try {
 const data = await productHistoryApi.getBySerial(s);
 setHistory(data);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to load history");
 } finally {
 setLoading(false);
 }
 };

 const o = history?.origin;
 const itemLabel = o?.item
 ? [o.item.brand, o.item.brandModel, o.item.capacity, o.item.colour, o.item.grade].filter(Boolean).join(" · ") || "—"
 : "—";

 return (
 <div className="@container min-h-screen bg-gray-50/80 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="max-w-4xl mx-auto">
 <div className="mb-5 @[640px]:mb-6 @[768px]:mb-8 flex items-center gap-3 @[640px]:gap-4">
  <div className="p-2 @[640px]:p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <History className="h-6 w-6 @[640px]:h-7 @[640px]:w-7 @[768px]:h-8 @[768px]:w-8 text-orange-500" />
  </div>
  <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900 tracking-tight">Product History</h1>
  <p className="text-gray-500 text-xs @[640px]:text-sm mt-0.5">Search by IMEI or serial number to see full history, origin, and sales.</p>
  </div>
 </div>

 <form onSubmit={handleSearch} className="mb-5 @[640px]:mb-6 @[768px]:mb-8">
  <div className="flex gap-2 @[640px]:gap-3">
  <div className="relative flex-1">
  <Search className="absolute left-3 @[640px]:left-4 top-1/2 -translate-y-1/2 h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  <input
  type="text"
  value={serial}
  onChange={(e) => setSerial(e.target.value)}
  placeholder="Enter IMEI or serial number..."
  className="w-full pl-9 @[640px]:pl-12 pr-3 @[640px]:pr-4 py-2.5 @[640px]:py-3.5 rounded-lg border border-gray-200 bg-white text-sm @[640px]:text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-sm"
  />
  </div>
  <button
  type="submit"
  disabled={loading || !serial.trim()}
  className="px-4 @[640px]:px-6 py-2.5 @[640px]:py-3.5 rounded-lg bg-orange-500 text-white text-sm @[640px]:text-base font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 @[640px]:gap-2 shadow-sm transition-colors"
  >
  {loading ? <Loader2 className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 animate-spin" /> : <Search className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />}
  Search
  </button>
  </div>
 </form>

 {error && (
  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6 p-3 @[640px]:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs @[640px]:text-sm flex items-center gap-2">
  <span>{error}</span>
  </div>
 )}

 {history && !error && (
  <div className="space-y-4 @[640px]:mb-5 @[768px]:space-y-6">
  {/* Header card: Serial + Status + Product summary */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="p-4 @[640px]:p-6 @[768px]:p-8">
  <div className="flex flex-wrap items-start justify-between gap-3 @[640px]:gap-4">
   <div>
   <p className="text-xs @[640px]:text-sm font-medium text-gray-500 uppercase tracking-wider">Serial / IMEI</p>
   <p className="text-base @[640px]:text-lg @[768px]:text-xl font-mono font-bold text-gray-900 mt-1">{history.serialNumber}</p>
   <p className="text-xs @[640px]:text-sm text-gray-600 mt-1.5 @[640px]:mt-2">{itemLabel}</p>
   </div>
   <span
   className={`inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 rounded-full text-xs @[640px]:text-sm font-semibold ${
   history.status === "sold"
   ? "bg-neutral-100 text-neutral-800"
   : "bg-emerald-100 text-emerald-800"
   }`}
   >
   {history.status === "sold" ? "Sold" : "In stock"}
   </span>
  </div>
  {o?.item && (
   <div className="mt-4 @[640px]:mt-5 @[768px]:mt-6 pt-4 @[640px]:pt-5 @[768px]:pt-6 border-t border-gray-100 grid grid-cols-2 @[768px]:grid-cols-4 gap-3 @[640px]:gap-4">
   {o.item.purchasePrice != null && (
   <div>
   <p className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Purchase price</p>
   <p className="text-base @[640px]:text-lg font-semibold text-gray-900">
    {formatMoney(o.item.purchasePrice, o.currency)}
   </p>
   </div>
   )}
   {o.item.salePrice != null && (
   <div>
   <p className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Sale price</p>
   <p className="text-base @[640px]:text-lg font-semibold text-orange-600">
    {formatMoney(o.item.salePrice, o.currency)}
   </p>
   </div>
   )}
   {o.item.grade && (
   <div>
   <p className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Condition</p>
   <p className="text-base @[640px]:text-lg font-semibold text-gray-900">{o.item.grade}</p>
   </div>
   )}
   {o.currency && (
   <div>
   <p className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Currency</p>
   <p className="text-base @[640px]:text-lg font-semibold text-gray-900">{o.currency}</p>
   </div>
   )}
   </div>
  )}
  </div>
  </div>

  {/* Origin (purchase) */}
  {o && (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-4 @[640px]:px-5 @[768px]:px-6 py-3 @[640px]:py-4 border-b border-gray-100 bg-gray-50/80">
   <h2 className="text-sm @[640px]:text-base font-semibold text-gray-900 flex items-center gap-2">
   <Truck className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-orange-500" />
   Origin (Purchase)
   </h2>
  </div>
  <div className="p-4 @[640px]:p-5 @[768px]:p-6">
   <dl className="grid grid-cols-1 @[640px]:grid-cols-2 @[1024px]:grid-cols-3 gap-3 @[640px]:gap-4">
   <div>
   <dt className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Purchase ref</dt>
   <dd className="mt-1 text-sm @[640px]:text-base font-semibold text-gray-900">{o.purchaseNumber}</dd>
   </div>
   {o.parcelNumber && (
   <div>
   <dt className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Purchase</dt>
   <dd className="mt-1 text-sm @[640px]:text-base font-semibold text-gray-900">{o.parcelNumber}</dd>
   </div>
   )}
   <div>
   <dt className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Date received</dt>
   <dd className="mt-1 text-sm @[640px]:text-base font-semibold text-gray-900">{formatDate(o.date || o.createdAt || "")}</dd>
   </div>
   <div>
   <dt className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Supplier</dt>
   <dd className="mt-1 text-sm @[640px]:text-base font-semibold text-gray-900">{o.supplier || "—"}</dd>
   </div>
   {o.purchaseNote ? (
   <div className="@[640px]:col-span-2 @[1024px]:col-span-3">
   <dt className="text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Intake note</dt>
   <dd className="mt-1 text-sm @[640px]:text-base font-semibold text-gray-900 whitespace-pre-wrap">{o.purchaseNote}</dd>
   </div>
   ) : null}
   </dl>
  </div>
  </div>
  )}

  {/* Sales history */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-4 @[640px]:px-5 @[768px]:px-6 py-3 @[640px]:py-4 border-b border-gray-100 bg-gray-50/80">
  <h2 className="text-sm @[640px]:text-base font-semibold text-gray-900 flex items-center gap-2">
   <ShoppingCart className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-orange-500" />
   Sales history
   {history.sales.length > 0 && (
   <span className="text-xs @[640px]:text-sm font-normal text-gray-500">({history.sales.length})</span>
   )}
  </h2>
  </div>
  <div className="divide-y divide-gray-100">
  {history.sales.length === 0 ? (
   <div className="p-6 @[640px]:p-8 text-center text-gray-500 text-xs @[640px]:text-sm">
   <FileText className="h-8 w-8 @[640px]:h-10 @[640px]:w-10 mx-auto mb-2 opacity-50" />
   <p>No sales recorded for this serial.</p>
   </div>
  ) : (
   history.sales.map((sale) => (
   <div key={sale._id} className="p-4 @[640px]:p-5 @[768px]:p-6 hover:bg-gray-50/50 transition-colors">
   <div className="flex flex-wrap items-start justify-between gap-3 @[640px]:gap-4">
   <div className="flex items-start gap-2.5 @[640px]:gap-3">
    <div className="p-1.5 @[640px]:p-2 rounded-lg bg-emerald-100">
    <ShoppingCart className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-emerald-600" />
    </div>
    <div>
    <p className="text-sm @[640px]:text-base font-semibold text-gray-900">{sale.reference}</p>
    <p className="text-xs @[640px]:text-sm text-gray-500 mt-0.5">
    {sale.customerName || "Walk-in"} · {sale.type}
    </p>
    <p className="text-[10px] @[640px]:text-xs text-gray-400 mt-1">{formatDate(sale.createdAt)}</p>
    </div>
   </div>
   <p className="text-base @[640px]:text-lg font-bold text-gray-900">{formatMoney(sale.total ?? 0)}</p>
   </div>
   {sale.items && sale.items.length > 0 && (
   <ul className="mt-3 pl-9 @[640px]:pl-11 space-y-1 text-xs @[640px]:text-sm text-gray-600">
    {sale.items.map((i, idx) => (
    <li key={idx}>
    {i.name} × {i.quantity} @ {formatMoney(i.price)}
    </li>
    ))}
   </ul>
   )}
   </div>
   ))
  )}
  </div>
  </div>

  {/* Movement timeline */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-4 @[640px]:px-5 @[768px]:px-6 py-3 @[640px]:py-4 border-b border-gray-100 bg-gray-50/80">
  <h2 className="text-sm @[640px]:text-base font-semibold text-gray-900 flex items-center gap-2">
   <ArrowRight className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-orange-500" />
   Movement timeline
  </h2>
  </div>
  <div className="p-4 @[640px]:p-5 @[768px]:p-6">
  {history.movements.length === 0 ? (
   <p className="text-gray-500 text-center py-4 text-xs @[640px]:text-sm">No movement records.</p>
  ) : (
   <ul className="relative space-y-0">
   {history.movements.map((m, i) => (
   <li key={i} className="relative flex gap-3 @[640px]:gap-4 pb-5 @[640px]:pb-6 last:pb-0">
   {i < history.movements.length - 1 && (
    <span className="absolute left-3.5 @[640px]:left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
   )}
   <div
    className={`relative z-10 flex h-7 w-7 @[640px]:h-8 @[640px]:w-8 shrink-0 items-center justify-center rounded-full ${
    m.type === "sale" ? "bg-neutral-100 text-neutral-600" : "bg-blue-100 text-blue-600"
    }`}
   >
    {m.type === "sale" ? (
    <ShoppingCart className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
    ) : (
    <Truck className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
    )}
   </div>
   <div className="min-w-0 flex-1 pt-0.5">
    <p className="text-sm @[640px]:text-base font-medium text-gray-900">
    {m.type === "sale" ? "Sold" : "Received into stock"}
    </p>
    <p className="text-xs @[640px]:text-sm text-gray-500 mt-0.5">
    {m.type === "sale" ? (
    <>To {m.to} {m.reference && ` · ${m.reference}`}</>
    ) : (
    <>From {m.from} {m.note && ` · ${m.note}`}</>
    )}
    </p>
    {m.type !== "sale" && m.purchaseNote ? (
    <p className="text-xs @[640px]:text-sm text-gray-700 mt-1.5 @[640px]:mt-2 whitespace-pre-wrap border-l-2 border-blue-200 pl-2.5 @[640px]:pl-3">
    <span className="font-medium">Note: </span>
    {m.purchaseNote}
    </p>
    ) : null}
    <p className="text-[10px] @[640px]:text-xs text-gray-400 mt-1">{formatDate(m.date)}</p>
    {m.type === "sale" && m.amount != null && (
    <p className="text-xs @[640px]:text-sm font-semibold text-gray-700 mt-1">{formatMoney(m.amount)}</p>
    )}
   </div>
   </li>
   ))}
   </ul>
  )}
  </div>
  </div>
  </div>
 )}

 {!history && !loading && !error && (
  <div className="text-center py-12 @[640px]:py-16 @[768px]:py-20 bg-white rounded-lg border border-gray-200/80 shadow-sm">
  <div className="p-3 @[640px]:p-4 rounded-lg bg-gray-100 inline-flex mb-3 @[640px]:mb-4">
  <Package className="h-10 w-10 @[640px]:h-12 @[640px]:w-12 @[768px]:h-14 @[768px]:w-14 text-gray-400" />
  </div>
  <p className="text-sm @[640px]:text-base text-gray-600 font-medium">Enter an IMEI or serial number to view product history.</p>
  <p className="text-xs @[640px]:text-sm text-gray-400 mt-1">You’ll see origin, sales, and movement timeline.</p>
  </div>
 )}
 </div>
 </div>
 );
}

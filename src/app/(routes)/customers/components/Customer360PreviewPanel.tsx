"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Loader2, DollarSign, ExternalLink, ShoppingBag } from "lucide-react";
import { customerApi } from "../../peoples/customers/service/customerApi";
import { salesApi, type SaleRecord } from "../../sales-dashboard/service/salesApi";
import type { CustomerSummary } from "../../peoples/customers/types";
import { useEntitlements } from "@/hooks/useEntitlements";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

interface Customer360PreviewPanelProps {
 customerId: string | null;
 open: boolean;
 onClose: () => void;
 onRecordPayment?: (customerId: string) => void;
}

export function Customer360PreviewPanel({
 customerId,
 open,
 onClose,
 onRecordPayment,
}: Customer360PreviewPanelProps) {
 const router = useRouter();
 const { data: entitlements } = useEntitlements();
 const isInvoicingEnabled = entitlements?.enabledFeatures?.["customer invoicing"] === true;

 const [summary, setSummary] = useState<CustomerSummary | null>(null);
 const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
  if (!customerId) return;
  setLoading(true);
  setError(null);
  try {
   const [summaryRes, salesRes] = await Promise.all([
    customerApi.getSummary(customerId),
    salesApi.getSales({ customerId, limit: 3, order: "desc" }),
   ]);
   if (summaryRes.success && summaryRes.data) {
    setSummary(summaryRes.data);
   } else {
    setError("Failed to load customer");
   }
   setRecentSales(salesRes.success && Array.isArray(salesRes.data) ? salesRes.data : []);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load customer");
   setSummary(null);
   setRecentSales([]);
  } finally {
   setLoading(false);
  }
 }, [customerId]);

 useEffect(() => {
  if (!open || !customerId) {
   setSummary(null);
   setRecentSales([]);
   return;
  }
  load();
 }, [open, customerId, load]);

 useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
 }, [open, onClose]);

 if (!open || !customerId) return null;

 const customer = summary?.customer;
 const balance = summary?.stats.openBalance ?? customer?.balance ?? 0;
 const isStoreCredit = balance < 0;

 return (
  <>
   <div
    className="fixed inset-0 z-40 bg-black/30"
    onClick={onClose}
    aria-hidden
   />
   <aside
    className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
    role="dialog"
    aria-labelledby="customer-360-preview-title"
    aria-modal="true"
   >
    <div className="flex items-center justify-between shrink-0 px-5 py-4 border-b border-gray-200">
     <h2 id="customer-360-preview-title" className="text-lg font-semibold text-gray-900 truncate pr-2">
      {loading && !customer ? "Loading…" : customer?.name ?? "Customer"}
     </h2>
     <button
      type="button"
      onClick={onClose}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      aria-label="Close"
     >
      <X className="h-5 w-5" />
     </button>
    </div>

    <div className="flex-1 overflow-y-auto p-5 space-y-5">
     {error && (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
     )}

     {loading && !summary ? (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
       <Loader2 className="h-5 w-5 animate-spin" />
       Loading…
      </div>
     ) : customer ? (
      <>
       {customer.isWalkIn ? (
        <p className="text-sm text-gray-500">Walk-in customer — limited history available.</p>
       ) : null}

       <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 p-3 bg-gray-50">
         <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
         <p className={`text-lg font-bold mt-1 ${isStoreCredit ? "text-blue-700" : "text-emerald-700"}`}>
          {formatMoney(Math.abs(balance))}
          {isStoreCredit ? " cr" : ""}
         </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-3 bg-gray-50">
         <p className="text-xs text-gray-500 uppercase tracking-wide">Total sales</p>
         <p className="text-lg font-bold mt-1 text-gray-900">{summary?.stats.saleCount ?? 0}</p>
        </div>
       </div>

       <div className="space-y-2 text-sm text-gray-600">
        {customer.contactName && customer.contactName !== customer.name && (
         <p>
          <span className="text-gray-500">Contact:</span> {customer.contactName}
         </p>
        )}
        {customer.phone && (
         <p>
          <span className="text-gray-500">Phone:</span> {customer.phone}
         </p>
        )}
        {customer.email && (
         <p>
          <span className="text-gray-500">Email:</span> {customer.email}
         </p>
        )}
        {summary?.pricingGroup && (
         <p>
          <span className="text-gray-500">Pricing group:</span> {summary.pricingGroup.name}
         </p>
        )}
        {isInvoicingEnabled && (
         <p>
          <span className="text-gray-500">Portal:</span>{" "}
          {customer.portalEnabled ? (
           <span className="text-emerald-700 font-medium">Enabled</span>
          ) : (
           <span className="text-gray-400">Not enabled</span>
          )}
         </p>
        )}
        {summary?.stats.lastSaleAt && (
         <p>
          <span className="text-gray-500">Last sale:</span> {formatDate(summary.stats.lastSaleAt)}
          {summary.stats.lastSaleReference ? ` · ${summary.stats.lastSaleReference}` : ""}
         </p>
        )}
       </div>

       {recentSales.length > 0 && (
        <div>
         <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent sales</h3>
         <ul className="space-y-2">
          {recentSales.map((sale) => (
           <li
            key={sale._id}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
           >
            <div className="min-w-0">
             <p className="font-medium text-gray-900 truncate">{sale.reference || "—"}</p>
             <p className="text-xs text-gray-500">{sale.createdAt ? formatDate(sale.createdAt) : ""}</p>
            </div>
            <span className="font-semibold text-gray-900 shrink-0">
             {formatMoney(Number(sale.total) || 0)}
            </span>
           </li>
          ))}
         </ul>
        </div>
       )}
      </>
     ) : null}
    </div>

    <div className="shrink-0 flex flex-col gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
     <Link
      href={`/customers/${customerId}`}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
      onClick={onClose}
     >
      <ExternalLink className="h-4 w-4" />
      View full profile
     </Link>
     <div className="flex gap-2">
      {balance > 0 && onRecordPayment && (
       <button
        type="button"
        onClick={() => {
         onRecordPayment(customerId);
         onClose();
        }}
        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
       >
        <DollarSign className="h-4 w-4" />
        Record payment
       </button>
      )}
      <button
       type="button"
       onClick={() => {
        router.push(`/create-sales?customerId=${encodeURIComponent(customerId)}`);
        onClose();
       }}
       className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
       <ShoppingBag className="h-4 w-4" />
       New sale
      </button>
     </div>
    </div>
   </aside>
  </>
 );
}

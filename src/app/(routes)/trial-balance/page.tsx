"use client";

import React, { useState, useEffect } from "react";
import { Scale, Loader2, RefreshCw, User, Truck } from "lucide-react";
import { accountsApi, type TrialBalanceData } from "../accounts/service/accountsApi";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function TrialBalancePage() {
 const [data, setData] = useState<TrialBalanceData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));

 const fetchData = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await accountsApi.getTrialBalance(asOf);
 setData(res.data);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load trial balance");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [asOf]);

 return (
 <div className="@container min-h-screen bg-gray-50/80 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 <div className="max-w-4xl mx-auto">
 <div className="flex flex-wrap items-center justify-between gap-2 @[640px]:gap-3 @[768px]:gap-4 mb-4 @[640px]:mb-6 @[768px]:mb-8">
  <div className="flex items-center gap-2 @[640px]:gap-3 @[768px]:gap-4">
  <div className="p-2 @[640px]:p-2.5 @[768px]:p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <Scale className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 @[768px]:h-8 @[768px]:w-8 text-orange-500" />
  </div>
  <div>
  <h1 className="text-base @[640px]:text-lg @[768px]:text-xl @[1024px]:text-2xl font-bold text-gray-900 tracking-tight">Trial Balance</h1>
  <p className="text-gray-500 text-[11px] @[640px]:text-xs @[768px]:text-sm mt-0.5">Customers and suppliers with non-zero balances</p>
  </div>
  </div>
  <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <input
  type="date"
  value={asOf}
  onChange={(e) => setAsOf(e.target.value)}
  className="rounded-xl border border-gray-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  />
  <button
  onClick={fetchData}
  disabled={loading}
  className="p-1.5 @[640px]:p-2 @[768px]:p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
  title="Refresh"
  >
  <RefreshCw className={`h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
  </button>
  </div>
 </div>

 {error && (
  <div className="mb-3 @[640px]:mb-4 p-2.5 @[640px]:p-3 @[768px]:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] @[640px]:text-xs @[768px]:text-sm">
  {error}
  </div>
 )}

 {loading && !data ? (
  <div className="flex items-center justify-center py-10 @[640px]:py-12 @[768px]:py-16">
  <Loader2 className="h-6 w-6 @[640px]:h-7 @[640px]:w-7 @[768px]:h-8 @[768px]:w-8 animate-spin text-orange-500" />
  </div>
 ) : data ? (
  <div className="space-y-3 @[640px]:space-y-4 @[768px]:space-y-6">
  <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">As at {data.asOf ? formatDate(data.asOf) : "—"}</p>

  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-3 @[640px]:gap-4 @[768px]:gap-6">
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-100 bg-neutral-50">
   <h2 className="text-sm @[640px]:text-[15px] @[768px]:text-base font-semibold text-gray-900 flex items-center gap-1.5 @[640px]:gap-2">
   <User className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-emerald-600" />
   Customers (receivables)
   </h2>
  </div>
  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
   {data.customers.length === 0 ? (
   <div className="p-3 @[640px]:p-4 @[768px]:p-6 text-center text-gray-500 text-[11px] @[640px]:text-xs @[768px]:text-sm">No outstanding balances</div>
   ) : (
   data.customers.map((c) => (
   <div
   key={c.accountId}
   className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex justify-between items-center"
   >
   <span className="font-medium text-gray-900 truncate flex-1 mr-2 text-xs @[640px]:text-sm @[768px]:text-base">
    {c.name || c.accountId}
   </span>
   <span className="text-emerald-700 font-semibold shrink-0 text-xs @[640px]:text-sm @[768px]:text-base">
    {formatMoney(c.balance)}
   </span>
   </div>
   ))
   )}
  </div>
  </div>

  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-100 bg-neutral-50">
   <h2 className="text-sm @[640px]:text-[15px] @[768px]:text-base font-semibold text-gray-900 flex items-center gap-1.5 @[640px]:gap-2">
   <Truck className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-neutral-600" />
   Suppliers (payables)
   </h2>
  </div>
  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
   {data.suppliers.length === 0 ? (
   <div className="p-3 @[640px]:p-4 @[768px]:p-6 text-center text-gray-500 text-[11px] @[640px]:text-xs @[768px]:text-sm">No outstanding balances</div>
   ) : (
   data.suppliers.map((s) => (
   <div
   key={s.accountId}
   className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex justify-between items-center"
   >
   <span className="font-medium text-gray-900 truncate flex-1 mr-2 text-xs @[640px]:text-sm @[768px]:text-base">
    {s.name || s.accountId}
   </span>
   <span className="text-neutral-700 font-semibold shrink-0 text-xs @[640px]:text-sm @[768px]:text-base">
    {formatMoney(s.balance)}
   </span>
   </div>
   ))
   )}
  </div>
  </div>
  </div>
  </div>
 ) : null}
 </div>
 </div>
 );
}

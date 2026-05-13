"use client";

import React, { useState, useEffect } from "react";
import {
 FileText,
 Loader2,
 RefreshCw,
 TrendingUp,
 TrendingDown,
 DollarSign,
 FolderTree,
 Package,
} from "lucide-react";
import { accountsApi, type ProfitAndLossData } from "../accounts/service/accountsApi";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ProfitAndLossPage() {
 const [data, setData] = useState<ProfitAndLossData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [from, setFrom] = useState(() => {
 const d = new Date();
 d.setMonth(0);
 d.setDate(1);
 return d.toISOString().slice(0, 10);
 });
 const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

 const fetchData = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await accountsApi.getProfitAndLoss({ from, to });
 setData(res.data);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load profit and loss");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [from, to]);

 return (
 <div className="@container min-h-screen bg-gray-50/80 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 <div className="max-w-5xl mx-auto">
 <div className="flex flex-wrap items-center justify-between gap-2 @[640px]:gap-3 @[768px]:gap-4 mb-4 @[640px]:mb-6 @[768px]:mb-8">
  <div className="flex items-center gap-2 @[640px]:gap-3 @[768px]:gap-4">
  <div className="p-2 @[640px]:p-2.5 @[768px]:p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <FileText className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 @[768px]:h-8 @[768px]:w-8 text-orange-500" />
  </div>
  <div>
  <h1 className="text-base @[640px]:text-lg @[768px]:text-xl @[1024px]:text-2xl font-bold text-gray-900 tracking-tight">
  Profit and Loss Statement
  </h1>
  <p className="text-gray-500 text-[11px] @[640px]:text-xs @[768px]:text-sm mt-0.5">
  Revenue, COGS, gross profit, operating expenses and net profit for the period
  </p>
  </div>
  </div>
  <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2">
  <input
  type="date"
  value={from}
  onChange={(e) => setFrom(e.target.value)}
  className="rounded-xl border border-gray-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  />
  <span className="text-gray-400 text-[11px] @[640px]:text-xs @[768px]:text-sm">to</span>
  <input
  type="date"
  value={to}
  onChange={(e) => setTo(e.target.value)}
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

 {data && (data.missingCostLineCount ?? 0) > 0 && (
  <div className="mb-3 @[640px]:mb-4 p-2.5 @[640px]:p-3 @[768px]:p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] @[640px]:text-xs @[768px]:text-sm">
  <strong>COGS data quality:</strong> COGS may be understated. {(data.missingCostLineCount ?? 0)} sold item(s) in this period have no cost snapshot.
  {(data.missingCostSaleCount ?? 0) > 0 && ` ${data.missingCostSaleCount} sale(s) affected.`} Run the backfill script or ensure inventory costs are set on purchases.
  </div>
 )}

 {loading && !data ? (
  <div className="flex items-center justify-center py-10 @[640px]:py-12 @[768px]:py-16">
  <Loader2 className="h-6 w-6 @[640px]:h-7 @[640px]:w-7 @[768px]:h-8 @[768px]:w-8 animate-spin text-orange-500" />
  </div>
 ) : data ? (
  <div className="space-y-3 @[640px]:space-y-4 @[768px]:space-y-6">
  <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">
  Period: {formatDate(data.from)} to {formatDate(data.to)}
  </p>

  {/* Main P&L: Revenue, COGS, Gross Profit, Expenses, Net Profit */}
  <div className="grid grid-cols-1 @[640px]:grid-cols-2 @[1024px]:grid-cols-5 gap-2.5 @[640px]:gap-3 @[768px]:gap-4">
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-3.5 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 border-b border-gray-100 bg-neutral-50">
   <h2 className="text-xs @[640px]:text-[13px] @[768px]:text-sm font-semibold text-gray-900 flex items-center gap-1 @[640px]:gap-1.5">
   <TrendingUp className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 text-emerald-600" />
   Revenue
   </h2>
  </div>
  <div className="p-3 @[640px]:p-3.5 @[768px]:p-4">
   <p className="text-base @[640px]:text-lg @[768px]:text-xl font-bold text-emerald-700">{formatMoney(data.revenue)}</p>
   {data.returnRevenue != null && data.returnRevenue > 0 && (
   <p className="text-[10px] @[640px]:text-[11px] @[768px]:text-xs text-gray-500 mt-0.5">
   Sales {formatMoney(data.salesRevenue ?? data.revenue + data.returnRevenue)} − Returns {formatMoney(data.returnRevenue)}
   </p>
   )}
  </div>
  </div>

  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-3.5 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 border-b border-gray-100 bg-neutral-50">
   <h2 className="text-xs @[640px]:text-[13px] @[768px]:text-sm font-semibold text-gray-900 flex items-center gap-1 @[640px]:gap-1.5">
   <Package className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 text-neutral-600" />
   COGS
   </h2>
  </div>
  <div className="p-3 @[640px]:p-3.5 @[768px]:p-4">
   <p className="text-base @[640px]:text-lg @[768px]:text-xl font-bold text-neutral-700">{formatMoney(data.cogs)}</p>
   <p className="text-[10px] @[640px]:text-[11px] @[768px]:text-xs text-gray-500 mt-0.5">Cost of goods sold</p>
  </div>
  </div>

  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-3.5 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 border-b border-gray-100 bg-blue-50">
   <h2 className="text-xs @[640px]:text-[13px] @[768px]:text-sm font-semibold text-gray-900 flex items-center gap-1 @[640px]:gap-1.5">
   <DollarSign className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 text-blue-600" />
   Gross Profit
   </h2>
  </div>
  <div className="p-3 @[640px]:p-3.5 @[768px]:p-4">
   <p
   className={`text-base @[640px]:text-lg @[768px]:text-xl font-bold ${
   (data.grossProfit ?? 0) >= 0 ? "text-blue-700" : "text-red-700"
   }`}
   >
   {formatMoney(data.grossProfit ?? 0)}
   </p>
   <p className="text-[10px] @[640px]:text-[11px] @[768px]:text-xs text-gray-500 mt-0.5">Revenue − COGS</p>
  </div>
  </div>

  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-3.5 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 border-b border-gray-100 bg-slate-50">
   <h2 className="text-xs @[640px]:text-[13px] @[768px]:text-sm font-semibold text-gray-900 flex items-center gap-1 @[640px]:gap-1.5">
   <TrendingDown className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 text-slate-600" />
   Operating Expenses
   </h2>
  </div>
  <div className="p-3 @[640px]:p-3.5 @[768px]:p-4">
   <p className="text-base @[640px]:text-lg @[768px]:text-xl font-bold text-slate-700">{formatMoney(data.totalExpenses)}</p>
  </div>
  </div>

  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-3.5 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 border-b border-gray-100 bg-neutral-50">
   <h2 className="text-xs @[640px]:text-[13px] @[768px]:text-sm font-semibold text-gray-900 flex items-center gap-1 @[640px]:gap-1.5">
   <DollarSign className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 text-neutral-600" />
   Net Profit
   </h2>
  </div>
  <div className="p-3 @[640px]:p-3.5 @[768px]:p-4">
   <p
   className={`text-base @[640px]:text-lg @[768px]:text-xl font-bold ${
   data.netProfit >= 0 ? "text-neutral-700" : "text-red-700"
   }`}
   >
   {formatMoney(data.netProfit)}
   </p>
   <p className="text-[10px] @[640px]:text-[11px] @[768px]:text-xs text-gray-500 mt-0.5">Gross profit − Expenses</p>
  </div>
  </div>
  </div>

  {/* Top products by gross profit */}
  {data.topProductsByGrossProfit && data.topProductsByGrossProfit.length > 0 && (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-100 bg-gray-50">
   <h2 className="text-sm @[640px]:text-[15px] @[768px]:text-base font-semibold text-gray-900 flex items-center gap-1.5 @[640px]:gap-2">
   <Package className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-gray-600" />
   Top products by gross profit
   </h2>
  </div>
  <div className="overflow-x-auto">
   <table className="w-full">
   <thead className="bg-gray-50">
   <tr>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-left text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">Product</th>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-right text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">Revenue</th>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-right text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">COGS</th>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-right text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">Gross profit</th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-200">
   {data.topProductsByGrossProfit.map((row, idx) => (
   <tr key={row.sku || idx} className="hover:bg-gray-50">
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-900">
    {row.name || row.sku || "—"}
    </td>
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-emerald-700">{formatMoney(row.revenue)}</td>
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-neutral-700">{formatMoney(row.cogs)}</td>
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right font-medium text-blue-700">
    {formatMoney(row.grossProfit)}
    </td>
   </tr>
   ))}
   </tbody>
   </table>
  </div>
  </div>
  )}

  {/* Expenses by category */}
  {data.expensesByCategory && data.expensesByCategory.length > 0 && (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-100 bg-gray-50">
   <h2 className="text-sm @[640px]:text-[15px] @[768px]:text-base font-semibold text-gray-900 flex items-center gap-1.5 @[640px]:gap-2">
   <FolderTree className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-gray-600" />
   Expenses by category
   </h2>
  </div>
  <div className="overflow-x-auto">
   <table className="w-full">
   <thead className="bg-gray-50">
   <tr>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-left text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">Category</th>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-right text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">Amount</th>
   <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-right text-[10px] @[640px]:text-[11px] @[768px]:text-xs font-medium text-gray-500 uppercase">Count</th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-200">
   {data.expensesByCategory.map((row) => (
   <tr key={row.categoryId || row.categoryName} className="hover:bg-gray-50">
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-900">{row.categoryName}</td>
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-neutral-700 font-medium">
    {formatMoney(row.totalGross)}
    </td>
    <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-gray-500">{row.count}</td>
   </tr>
   ))}
   </tbody>
   </table>
  </div>
  </div>
  )}

  <div className="bg-gray-100 rounded-xl p-2.5 @[640px]:p-3 @[768px]:p-4 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">
  <strong>Summary:</strong> Revenue is sales in the period minus returns. COGS is cost of goods sold (unit
  cost at sale time × quantity). Gross profit = Revenue − COGS. Net profit = Gross profit − Operating
  expenses. Returns in the period reduce revenue and reverse COGS for correct P&amp;L.
  </div>
  </div>
 ) : null}
 </div>
 </div>
 );
}

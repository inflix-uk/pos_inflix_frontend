"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Loader2, RefreshCw, FileDown, Search } from "lucide-react";
import { accountsApi, type DebtorsCreditorsData, type DebtorsCreditorsRow } from "../accounts/service/accountsApi";

const formatMoney = (n: number) =>
 n === 0 ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type Tab = "debtors" | "creditors";

function AccountTable({
 rows,
 loading,
}: {
 rows: DebtorsCreditorsRow[];
 loading: boolean;
}) {
 if (loading) return null;
 return (
 <div className="overflow-x-auto -mx-3 @[640px]:mx-0">
 <table className="w-full min-w-[640px] text-[11px] @[640px]:text-xs @[768px]:text-sm">
 <thead>
  <tr className="border-b border-gray-200 bg-gray-50/80">
  <th className="text-left py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-semibold text-gray-700 w-10">#</th>
  <th className="text-left py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-semibold text-gray-700">Account</th>
  <th className="text-left py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-semibold text-gray-700 hidden @[640px]:table-cell">Phone</th>
  <th className="text-left py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-semibold text-gray-700 hidden @[768px]:table-cell">Email</th>
  <th className="text-right py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-semibold text-gray-700">Debit</th>
  <th className="text-right py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-semibold text-gray-700">Credit</th>
  </tr>
 </thead>
 <tbody>
  {rows.length === 0 ? (
  <tr>
  <td colSpan={6} className="py-6 @[640px]:py-8 @[768px]:py-10 text-center text-gray-500">
  No accounts
  </td>
  </tr>
  ) : (
  rows.map((row, i) => (
  <tr
  key={row.accountId}
  className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
  >
  <td className="py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 text-gray-500 tabular-nums">{i + 1}</td>
  <td className="py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 font-medium text-gray-900">{row.name || "—"}</td>
  <td className="py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 text-gray-600 hidden @[640px]:table-cell">{row.phone || "—"}</td>
  <td className="py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 text-gray-600 hidden @[768px]:table-cell truncate max-w-[200px]" title={row.email || undefined}>
   {row.email || "—"}
  </td>
  <td className="py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 text-right tabular-nums font-medium">
   {row.debit > 0 ? (
   <span className="text-rose-600">{formatMoney(row.debit)}</span>
   ) : (
   <span className="text-gray-400">—</span>
   )}
  </td>
  <td className="py-2 @[640px]:py-2.5 @[768px]:py-3 px-2.5 @[640px]:px-3 @[768px]:px-4 text-right tabular-nums font-medium">
   {row.credit > 0 ? (
   <span className="text-neutral-600">{formatMoney(row.credit)}</span>
   ) : (
   <span className="text-gray-400">—</span>
   )}
  </td>
  </tr>
  ))
  )}
 </tbody>
 </table>
 </div>
 );
}

export default function DebtorsCreditorsPage() {
 const [data, setData] = useState<DebtorsCreditorsData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
 const [tab, setTab] = useState<Tab>("debtors");
 const [searchQuery, setSearchQuery] = useState("");
 const [withBalanceOnly, setWithBalanceOnly] = useState(false);

 const fetchData = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await accountsApi.getDebtorsCreditors(asOf);
 setData(res.data);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [asOf]);

 const rows = useMemo(() => {
 if (!data) return [];
 let list = tab === "debtors" ? [...data.debtors] : [...data.creditors];
 if (withBalanceOnly) {
 list = list.filter((r) => r.debit > 0 || r.credit > 0);
 }
 const term = (searchQuery || "").trim().toLowerCase();
 if (term) {
 list = list.filter(
 (r) =>
  (r.name || "").toLowerCase().includes(term) ||
  (r.phone || "").toLowerCase().includes(term) ||
  (r.email || "").toLowerCase().includes(term)
 );
 }
 list.sort((a, b) => {
 if (b.debit !== a.debit) return b.debit - a.debit;
 if (b.credit !== a.credit) return b.credit - a.credit;
 return (a.name || "").localeCompare(b.name || "");
 });
 return list;
 }, [data, tab, searchQuery, withBalanceOnly]);

 const handlePrint = () => {
 window.print();
 };

 return (
 <div className="@container min-h-screen bg-gray-50/80 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6 print:bg-white print:p-0">
 <div className="max-w-5xl mx-auto">
 <div className="flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-2 @[640px]:gap-3 @[768px]:gap-4 mb-3 @[640px]:mb-4 @[768px]:mb-6">
  <div className="flex items-center gap-2 @[640px]:gap-3 @[768px]:gap-4">
  <div className="p-2 @[640px]:p-2.5 @[768px]:p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <Users className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 @[768px]:h-8 @[768px]:w-8 text-neutral-500" />
  </div>
  <div>
  <h1 className="text-base @[640px]:text-lg @[768px]:text-xl @[1024px]:text-2xl font-bold text-gray-900 tracking-tight">
  Debtors & Creditors
  </h1>
  <p className="text-gray-500 text-[11px] @[640px]:text-xs @[768px]:text-sm mt-0.5">
  All customer and supplier account balances
  </p>
  </div>
  </div>
  <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2">
  <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">As at</span>
  <input
  type="date"
  value={asOf}
  onChange={(e) => setAsOf(e.target.value)}
  className="rounded-xl border border-gray-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
  />
  <button
  onClick={fetchData}
  disabled={loading}
  className="p-1.5 @[640px]:p-2 @[768px]:p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
  title="Refresh"
  >
  <RefreshCw className={`h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
  </button>
  <button
  onClick={handlePrint}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium transition-colors print:hidden"
  >
  <FileDown className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4" />
  Download PDF
  </button>
  </div>
 </div>

 <div className="mb-3 @[640px]:mb-4 flex flex-wrap items-center gap-2 @[640px]:gap-3 @[768px]:gap-4 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">
  <span className="flex items-center gap-1.5">
  <span className="w-2 h-2 @[640px]:w-2.5 @[640px]:h-2.5 rounded-full bg-rose-400" />
  Debit = they owe you
  </span>
  <span className="flex items-center gap-1.5">
  <span className="w-2 h-2 @[640px]:w-2.5 @[640px]:h-2.5 rounded-full bg-neutral-400" />
  Credit = overpaid / you owe
  </span>
 </div>

 <div className="mb-3 @[640px]:mb-4 flex flex-col @[640px]:flex-row @[640px]:items-center gap-2 @[640px]:gap-3 print:hidden">
  <div className="relative flex-1 max-w-xs">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder={`Search ${tab} by name, phone or email...`}
  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 @[768px]:pr-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
  />
  </div>
  <label className="flex items-center gap-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-700 cursor-pointer">
  <input
  type="checkbox"
  checked={withBalanceOnly}
  onChange={(e) => setWithBalanceOnly(e.target.checked)}
  className="rounded border-gray-300 text-neutral-600 focus:ring-indigo-500"
  />
  With balance only
  </label>
  {(searchQuery || withBalanceOnly) && (
  <button
  type="button"
  onClick={() => {
  setSearchQuery("");
  setWithBalanceOnly(false);
  }}
  className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-neutral-600 hover:text-neutral-800"
  >
  Clear filters
  </button>
  )}
 </div>

 {error && (
  <div className="mb-3 @[640px]:mb-4 p-2.5 @[640px]:p-3 @[768px]:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] @[640px]:text-xs @[768px]:text-sm">
  {error}
  </div>
 )}

 <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="flex border-b border-gray-200">
  <button
  type="button"
  onClick={() => setTab("debtors")}
  className={`flex-1 py-2.5 @[640px]:py-3 @[768px]:py-3.5 px-2.5 @[640px]:px-3 @[768px]:px-4 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium transition-colors ${
  tab === "debtors"
   ? "bg-neutral-50 text-neutral-700 border-b-2 border-orange-500"
   : "text-gray-600 hover:bg-gray-50"
  }`}
  >
  Debtors
  {data && (
  <span className="ml-2 text-gray-500 font-normal">
   ({data.debtors.length})
  </span>
  )}
  </button>
  <button
  type="button"
  onClick={() => setTab("creditors")}
  className={`flex-1 py-2.5 @[640px]:py-3 @[768px]:py-3.5 px-2.5 @[640px]:px-3 @[768px]:px-4 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium transition-colors ${
  tab === "creditors"
   ? "bg-neutral-50 text-neutral-700 border-b-2 border-orange-500"
   : "text-gray-600 hover:bg-gray-50"
  }`}
  >
  Creditors
  {data && (
  <span className="ml-2 text-gray-500 font-normal">
   ({data.creditors.length})
  </span>
  )}
  </button>
  </div>

  <div className="p-3 @[640px]:p-4 @[768px]:p-6">
  {data && (
  <p className="text-[10px] @[640px]:text-[11px] @[768px]:text-xs text-gray-500 mb-3 @[640px]:mb-4">
  Period: {formatDate(data.asOf)}
  </p>
  )}
  {loading && !data ? (
  <div className="flex items-center justify-center py-10 @[640px]:py-12 @[768px]:py-16">
  <Loader2 className="h-6 w-6 @[640px]:h-7 @[640px]:w-7 @[768px]:h-8 @[768px]:w-8 animate-spin text-neutral-500" />
  </div>
  ) : (
  <AccountTable rows={rows} loading={loading} />
  )}
  </div>
 </div>
 </div>
 </div>
 );
}

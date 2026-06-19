"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import { salesApi, type SaleRecord } from "../../sales-dashboard/service/salesApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });

interface CustomerSalesTabProps {
 customerId: string;
}

export function CustomerSalesTab({ customerId }: CustomerSalesTabProps) {
 const { can } = usePermissionsContext();
 const canViewHistorical = can("report.view");

 const [sales, setSales] = useState<SaleRecord[]>([]);
 const [page, setPage] = useState(1);
 const [pages, setPages] = useState(1);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [filterFrom, setFilterFrom] = useState("");
 const [filterTo, setFilterTo] = useState("");

 const limit = 15;

 const loadSales = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
   const res = await salesApi.getSales({
    customerId,
    page,
    limit,
    order: "desc",
    from: filterFrom || undefined,
    to: filterTo || undefined,
   });
   setSales(res.success && Array.isArray(res.data) ? res.data : []);
   setPages(res.pages ?? 1);
   setTotal(res.total ?? 0);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load sales");
   setSales([]);
  } finally {
   setLoading(false);
  }
 }, [customerId, page, limit, filterFrom, filterTo]);

 useEffect(() => {
  setPage(1);
 }, [filterFrom, filterTo]);

 useEffect(() => {
  loadSales();
 }, [loadSales]);

 const getLocationName = (sale: SaleRecord) => {
  if (!sale.locationId) return "—";
  if (typeof sale.locationId === "object" && sale.locationId.name) return sale.locationId.name;
  return "—";
 };

 const getPaidLabel = (sale: SaleRecord) => {
  const totalAmt = Number(sale.total ?? 0);
  const due = sale.amountDue != null ? Number(sale.amountDue) : totalAmt;
  if (totalAmt <= 0) return "—";
  if (due <= 0) return "Paid";
  if (due < totalAmt) return "Partial";
  return "Unpaid";
 };

 return (
  <div className="space-y-4">
   {!canViewHistorical && (
    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
     Showing today&apos;s sales only. Users with report access can view full history.
    </p>
   )}

   <div className="flex flex-wrap gap-3 items-end bg-white rounded-xl border border-gray-200 p-4">
    <div>
     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From</label>
     <input
      type="date"
      value={filterFrom}
      onChange={(e) => setFilterFrom(e.target.value)}
      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
     />
    </div>
    <div>
     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To</label>
     <input
      type="date"
      value={filterTo}
      onChange={(e) => setFilterTo(e.target.value)}
      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
     />
    </div>
    {(filterFrom || filterTo) && (
     <button
      type="button"
      onClick={() => {
       setFilterFrom("");
       setFilterTo("");
      }}
      className="py-2 text-sm text-gray-600 hover:text-orange-600"
     >
      Clear dates
     </button>
    )}
   </div>

   {error && (
    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
   )}

   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    {loading && sales.length === 0 ? (
     <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading sales…
     </div>
    ) : (
     <>
      <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
       {total} sale{total !== 1 ? "s" : ""} found
      </div>
      <div className="overflow-x-auto relative">
       {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
         <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        </div>
       )}
       <table className="w-full text-sm">
        <thead>
         <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-2.5 px-4 font-medium text-gray-700">Reference</th>
          <th className="text-left py-2.5 px-4 font-medium text-gray-700">Date</th>
          <th className="text-left py-2.5 px-4 font-medium text-gray-700">Location</th>
          <th className="text-left py-2.5 px-4 font-medium text-gray-700">Type</th>
          <th className="text-left py-2.5 px-4 font-medium text-gray-700">Payment</th>
          <th className="text-right py-2.5 px-4 font-medium text-gray-700">Total</th>
          <th className="text-right py-2.5 px-4 font-medium text-gray-700 w-16" />
         </tr>
        </thead>
        <tbody>
         {sales.length === 0 ? (
          <tr>
           <td colSpan={7} className="py-10 text-center text-gray-500">
            No sales for this customer.
           </td>
          </tr>
         ) : (
          sales.map((sale) => (
           <tr key={sale._id} className="border-b border-gray-100 hover:bg-gray-50/50">
            <td className="py-2.5 px-4 font-medium text-gray-900">{sale.reference || "—"}</td>
            <td className="py-2.5 px-4 text-gray-600">
             {sale.createdAt ? formatDate(sale.createdAt) : "—"}
            </td>
            <td className="py-2.5 px-4 text-gray-600">{getLocationName(sale)}</td>
            <td className="py-2.5 px-4 text-gray-600 capitalize">{sale.type || "—"}</td>
            <td className="py-2.5 px-4">
             <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
               getPaidLabel(sale) === "Paid"
                ? "bg-green-100 text-green-800"
                : getPaidLabel(sale) === "Partial"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-600"
              }`}
             >
              {getPaidLabel(sale)}
             </span>
            </td>
            <td className="py-2.5 px-4 text-right font-semibold text-gray-900">
             {formatMoney(Number(sale.total) || 0)}
            </td>
            <td className="py-2.5 px-4 text-right">
             {can("sale.edit") || can("sale.view") ? (
              <Link
               href={`/sales-online-orders/edit/${sale._id}`}
               className="inline-flex p-1.5 rounded text-orange-600 hover:bg-orange-50"
               title="View sale"
              >
               <ExternalLink className="h-4 w-4" />
              </Link>
             ) : null}
            </td>
           </tr>
          ))
         )}
        </tbody>
       </table>
      </div>
      {pages > 1 && (
       <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
         type="button"
         disabled={page <= 1 || loading}
         onClick={() => setPage((p) => Math.max(1, p - 1))}
         className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
        >
         Previous
        </button>
        <span className="text-sm text-gray-500">
         Page {page} of {pages}
        </span>
        <button
         type="button"
         disabled={page >= pages || loading}
         onClick={() => setPage((p) => p + 1)}
         className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
        >
         Next
        </button>
       </div>
      )}
     </>
    )}
   </div>
  </div>
 );
}

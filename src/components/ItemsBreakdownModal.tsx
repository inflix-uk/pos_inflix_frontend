"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X, Search, ArrowUpDown } from "lucide-react";
import { salesApi, type SaleRecord } from "@/app/(routes)/sales-dashboard/service/salesApi";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(n);
}

interface AggregatedItem {
 sku: string;
 name: string;
 quantity: number;
 amount: number;
 unitPrice: number;
 orders: number;
 brand?: string;
 colour?: string;
 grade?: string;
}

type SortKey = "name" | "quantity" | "amount";

export interface ItemsBreakdownModalProps {
 from: string;
 to: string;
 /** "all" or a specific location id */
 locationId?: string;
 /** Optional sale type filter passed to the sales API */
 saleType?: "retail" | "wholesale" | "repair";
 dateLabel?: string;
 onClose: () => void;
}

/** Modal that aggregates and displays line-item totals for a date range. */
export function ItemsBreakdownModal({
 from,
 to,
 locationId,
 saleType,
 dateLabel,
 onClose,
}: ItemsBreakdownModalProps) {
 const [items, setItems] = useState<AggregatedItem[]>([]);
 const [salesCount, setSalesCount] = useState(0);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [search, setSearch] = useState("");
 const [sortKey, setSortKey] = useState<SortKey>("quantity");
 const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

 const aggregate = useCallback((sales: SaleRecord[]) => {
  const map = new Map<string, AggregatedItem>();
  for (const sale of sales) {
   if (!sale.items || sale.items.length === 0) continue;
   for (const item of sale.items) {
    const key = item.sku || item.name;
    if (!key) continue;
    const existing = map.get(key);
    const qty = Number(item.quantity) || 0;
    const lineAmount = (Number(item.price) || 0) * qty;
    if (existing) {
     existing.quantity += qty;
     existing.amount += lineAmount;
     existing.orders += 1;
    } else {
     map.set(key, {
      sku: item.sku || "—",
      name: item.name,
      quantity: qty,
      amount: lineAmount,
      unitPrice: Number(item.price) || 0,
      orders: 1,
      brand: item.brand,
      colour: item.colour,
      grade: item.grade,
     });
    }
   }
  }
  return Array.from(map.values());
 }, []);

 useEffect(() => {
  let cancelled = false;
  (async () => {
   setLoading(true);
   setError("");
   try {
    const limit = 200;
    const all: SaleRecord[] = [];
    let page = 1;
    const maxPages = 50;
    while (page <= maxPages) {
     const res = await salesApi.getSales({
      from,
      to,
      locationId: locationId && locationId !== "all" ? locationId : undefined,
      type: saleType,
      page,
      limit,
      order: "desc",
     });
     if (cancelled) return;
     all.push(...res.data);
     if (page >= res.pages || res.data.length === 0) break;
     page += 1;
    }
    if (cancelled) return;
    setSalesCount(all.length);
    setItems(aggregate(all));
   } catch (err: unknown) {
    if (!cancelled) {
     setError(err instanceof Error ? err.message : "Failed to load items");
    }
   } finally {
    if (!cancelled) setLoading(false);
   }
  })();
  return () => {
   cancelled = true;
  };
 }, [from, to, locationId, saleType, aggregate]);

 useEffect(() => {
  const handler = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
 }, [onClose]);

 const filteredSorted = useMemo(() => {
  const term = search.trim().toLowerCase();
  const filtered = term
   ? items.filter(
      (i) =>
       i.name.toLowerCase().includes(term) ||
       i.sku.toLowerCase().includes(term) ||
       (i.brand || "").toLowerCase().includes(term)
     )
   : items;
  const sorted = [...filtered].sort((a, b) => {
   let cmp = 0;
   if (sortKey === "name") cmp = a.name.localeCompare(b.name);
   else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
   else cmp = a.amount - b.amount;
   return sortDir === "asc" ? cmp : -cmp;
  });
  return sorted;
 }, [items, search, sortKey, sortDir]);

 const totalQty = useMemo(
  () => filteredSorted.reduce((s, i) => s + i.quantity, 0),
  [filteredSorted]
 );
 const totalAmount = useMemo(
  () => filteredSorted.reduce((s, i) => s + i.amount, 0),
  [filteredSorted]
 );

 const toggleSort = (key: SortKey) => {
  if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  else {
   setSortKey(key);
   setSortDir(key === "name" ? "asc" : "desc");
  }
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
     <div>
      <h3 className="text-lg font-semibold text-gray-900">Items Sold</h3>
      <p className="text-sm text-gray-500">
       {dateLabel ? `${dateLabel} · ` : ""}
       {salesCount} sale{salesCount !== 1 ? "s" : ""} · {items.length} unique
       item{items.length !== 1 ? "s" : ""}
      </p>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
     >
      <X className="h-5 w-5" />
     </button>
    </div>

    <div className="border-b border-gray-200 px-6 py-3">
     <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
       type="text"
       placeholder="Search by name, SKU, or brand…"
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
      />
     </div>
    </div>

    <div className="flex-1 overflow-auto px-6 py-4">
     {error && (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
       {error}
      </div>
     )}

     {loading ? (
      <div className="flex items-center justify-center py-12">
       <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
     ) : filteredSorted.length === 0 ? (
      <p className="py-12 text-center text-sm text-gray-500">
       {items.length === 0
        ? "No items found for this period."
        : "No items match your search."}
      </p>
     ) : (
      <div className="overflow-x-auto">
       <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
         <tr>
          <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
          <th className="px-3 py-2 text-left font-medium text-gray-500">
           <button
            type="button"
            onClick={() => toggleSort("name")}
            className="inline-flex items-center gap-1 hover:text-gray-700"
           >
            Item
            <ArrowUpDown className="h-3 w-3" />
           </button>
          </th>
          <th className="px-3 py-2 text-right font-medium text-gray-500">
           <button
            type="button"
            onClick={() => toggleSort("quantity")}
            className="inline-flex items-center gap-1 hover:text-gray-700"
           >
            Qty
            <ArrowUpDown className="h-3 w-3" />
           </button>
          </th>
          <th className="px-3 py-2 text-right font-medium text-gray-500">
           Avg price
          </th>
          <th className="px-3 py-2 text-right font-medium text-gray-500">
           <button
            type="button"
            onClick={() => toggleSort("amount")}
            className="inline-flex items-center gap-1 hover:text-gray-700"
           >
            Total
            <ArrowUpDown className="h-3 w-3" />
           </button>
          </th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
         {filteredSorted.map((item) => {
          const avgPrice = item.quantity > 0 ? item.amount / item.quantity : 0;
          return (
           <tr key={item.sku + "::" + item.name} className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-500">
             {item.sku}
            </td>
            <td className="px-3 py-2 text-gray-900">
             <div className="font-medium">{item.name}</div>
             {(item.brand || item.colour || item.grade) && (
              <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-gray-500">
               {item.brand && <span>{item.brand}</span>}
               {item.colour && <span>· {item.colour}</span>}
               {item.grade && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5">
                 {item.grade}
                </span>
               )}
              </div>
             )}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-700">
             {item.quantity}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-700">
             {formatCurrency(avgPrice)}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-gray-900">
             {formatCurrency(item.amount)}
            </td>
           </tr>
          );
         })}
        </tbody>
        <tfoot>
         <tr className="border-t-2 border-gray-300 bg-orange-50/30">
          <td className="px-3 py-2"></td>
          <td className="px-3 py-2 font-bold uppercase text-orange-700">
           Total
          </td>
          <td className="px-3 py-2 text-right font-bold tabular-nums text-orange-700">
           {totalQty}
          </td>
          <td className="px-3 py-2"></td>
          <td className="px-3 py-2 text-right font-bold tabular-nums text-orange-700">
           {formatCurrency(totalAmount)}
          </td>
         </tr>
        </tfoot>
       </table>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}

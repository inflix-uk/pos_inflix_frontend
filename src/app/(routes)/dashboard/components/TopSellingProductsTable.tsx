"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import type { TopSellingProduct } from "../service/dashboardApi";
import { usePermissions } from "@/hooks/usePermissions";

interface TopSellingProductsTableProps {
 items: TopSellingProduct[];
}

export function TopSellingProductsTable({ items }: TopSellingProductsTableProps) {
 const { can } = usePermissions();
 if (!can("sale.view")) return null;

 return (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <TrendingUp className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-green-600" />
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Top selling products</h2>
 </div>
 </div>
 {items.length === 0 ? (
 <p className="px-3 @[640px]:px-4 @[768px]:px-6 py-3 @[640px]:py-4 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No sales for this period.</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[420px] @[640px]:min-w-[520px]">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Product</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SKU</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-right text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Qty sold</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-right text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Revenue</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {items.map((p, i) => (
  <tr key={`${p.sku}-${i}`} className="hover:bg-gray-50">
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-900">{p.name || "—"}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600 font-mono whitespace-nowrap">{p.sku || "—"}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right font-semibold text-green-700 whitespace-nowrap">{p.totalQuantity}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-gray-700 whitespace-nowrap">
   {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p.totalRevenue)}
  </td>
  </tr>
  ))}
  </tbody>
 </table>
 </div>
 )}
 </div>
 );
}

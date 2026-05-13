"use client";

import React from "react";
import Link from "next/link";
import type { LowStockItem } from "../service/dashboardApi";
import { usePermissions } from "@/hooks/usePermissions";

interface LowStockTableProps {
 items: LowStockItem[];
}

export function LowStockTable({ items }: LowStockTableProps) {
 const { can } = usePermissions();
 if (!can("product.view") && !can("stock.view")) return null;
 if (items.length === 0) {
 return (
 <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4 @[768px]:p-6 shadow-sm">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900 mb-2 @[640px]:mb-3 @[768px]:mb-4">Low stock</h2>
 <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No items below reorder level.</p>
 </div>
 );
 }

 return (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Low stock</h2>
 <Link href="/inventory/low-stocks" className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800">
  View all
 </Link>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full min-w-[480px] @[640px]:min-w-[560px] @[768px]:min-w-[640px]">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Product</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SKU</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-right text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Available</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-right text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Reorder at</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Supplier</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {items.map((p) => (
  <tr key={p._id} className="hover:bg-gray-50">
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-900">{p.name}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600 font-mono whitespace-nowrap">{p.sku}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-neutral-600 font-medium whitespace-nowrap">{p.quantity}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right text-gray-600 whitespace-nowrap">{p.minStockLevel}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">{p.supplierName ?? "—"}</td>
  </tr>
  ))}
  </tbody>
 </table>
 </div>
 </div>
 );
}

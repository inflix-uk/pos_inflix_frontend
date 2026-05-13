"use client";

import React from "react";
import Link from "next/link";
import type { RecentInvoice } from "../service/dashboardApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { usePermissions } from "@/hooks/usePermissions";

interface RecentInvoicesTableProps {
 invoices: RecentInvoice[];
}

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function RecentInvoicesTable({ invoices }: RecentInvoicesTableProps) {
 const { can } = usePermissions();
 if (!can("sale.view")) return null;
 if (invoices.length === 0) {
 return (
 <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4 @[768px]:p-6 shadow-sm">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900 mb-2 @[640px]:mb-3 @[768px]:mb-4">Recent invoices</h2>
 <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No invoices yet.</p>
 </div>
 );
 }

 return (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Recent invoices</h2>
 <Link href="/sales-online-orders" className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800">
  View all
 </Link>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full min-w-[480px] @[640px]:min-w-[560px] @[768px]:min-w-[640px]">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Reference</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Customer</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Type</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-right text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Total</th>
  <th className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-left text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Created</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {invoices.map((inv) => (
  <tr key={inv._id} className="hover:bg-gray-50">
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-gray-900 whitespace-nowrap">
   <Link href={`/sales-online-orders?ref=${inv.reference}`} className="text-blue-600 hover:underline">
   {inv.reference}
   </Link>
  </td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">{inv.customerName ?? "—"}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600 capitalize">{inv.type}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-right font-medium text-gray-900 whitespace-nowrap">{formatCurrency(inv.total)}</td>
  <td className="px-2 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500 whitespace-nowrap">{formatDateTimeLondon(inv.createdAt)}</td>
  </tr>
  ))}
  </tbody>
 </table>
 </div>
 </div>
 );
}

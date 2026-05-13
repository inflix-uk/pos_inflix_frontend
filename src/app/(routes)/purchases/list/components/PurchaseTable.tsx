"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit, Trash2, ChevronDown } from "lucide-react";
import { Purchase } from "../types";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { formatPurchasePartyDisplay } from "@/lib/formatSupplierDisplay";

interface PurchaseTableProps {
 purchases: Purchase[];
 selectedPurchases: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectPurchase: (id: string) => void;
 onEdit: (purchase: Purchase) => void;
 onDelete: (purchase: Purchase) => void;
 onCompletionStatusChange?: (purchaseId: string, completionStatus: "In Process" | "Completed") => void;
}

export const PurchaseTable: React.FC<PurchaseTableProps> = ({
 purchases,
 selectedPurchases,
 selectAll,
 onSelectAll,
 onSelectPurchase,
 onEdit,
 onDelete,
 onCompletionStatusChange,
}) => {
 const router = useRouter();
 const [openStatusId, setOpenStatusId] = useState<string | null>(null);

 /** Completed when entered IMEI qty and other qty match expected; else In Process. Use stored completionStatus if set. */
 const getCompletionStatus = (p: Purchase): "In Process" | "Completed" => {
 if (p.completionStatus === "Completed" || p.completionStatus === "In Process") return p.completionStatus;
 const imeiOk = (p.totalIMEIs ?? 0) >= (p.imeiQuantity ?? 0);
 const otherOk = (p.totalOtherQuantity ?? 0) >= (p.otherQuantity ?? 0);
 return imeiOk && otherOk ? "Completed" : "In Process";
 };

 const getCompletionStatusBadge = (status: string) => {
 return status === "Completed" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-800";
 };

 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="w-12 px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Supplier Name
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Reference
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Date
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  imeiQuantity
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  otherQuantity
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Total
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {purchases.map((purchase) => {
  const pid = purchase._id || purchase.id;
  return (
  <tr key={pid} className="hover:bg-gray-50">
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   <input
   type="checkbox"
   checked={selectedPurchases.includes(pid!)}
   onChange={() => onSelectPurchase(pid!)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
   />
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm font-medium text-gray-900 uppercase">
   {formatPurchasePartyDisplay(purchase.supplier, purchase.account)}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {purchase.purchaseNumber}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {formatDateTimeLondon(purchase.createdAt ?? purchase.date)}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {purchase.imeiQuantity ?? "—"}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {purchase.otherQuantity ?? "—"}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {purchase.currency} {(purchase.grandTotal ?? 0).toFixed(2)}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   {onCompletionStatusChange ? (
   <div className="relative">
   <button
   type="button"
   onClick={() => setOpenStatusId(openStatusId === pid ? null : pid!)}
   className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] @[640px]:text-xs font-semibold rounded-full ${getCompletionStatusBadge(
    getCompletionStatus(purchase),
   )}`}
   >
   {getCompletionStatus(purchase)}
   <ChevronDown size={12} />
   </button>
   {openStatusId === pid && (
   <>
    <div
    className="fixed inset-0 z-10"
    aria-hidden
    onClick={() => setOpenStatusId(null)}
    />
    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
    {(["In Process", "Completed"] as const).map((status) => (
    <button
    key={status}
    type="button"
    onClick={() => {
     onCompletionStatusChange(pid!, status);
     setOpenStatusId(null);
    }}
    className={`w-full text-left px-3 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
     getCompletionStatus(purchase) === status ? "bg-orange-50 text-orange-700" : ""
    }`}
    >
    {status}
    </button>
    ))}
    </div>
   </>
   )}
   </div>
   ) : (
   <span
   className={`inline-flex px-2 py-1 text-[10px] @[640px]:text-xs font-semibold rounded-full ${getCompletionStatusBadge(
   getCompletionStatus(purchase),
   )}`}
   >
   {getCompletionStatus(purchase)}
   </span>
   )}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   <div className="flex items-center gap-1.5 @[640px]:gap-2">
   <button
   onClick={() =>
   window.open(`/purchases/view/${pid}`, "_blank")
   }
   className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
   >
   <Eye size={16} />
   </button>
   <button
   onClick={() =>
   window.open(`/purchases/edit/${pid}`, "_blank")
   }
   className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
   >
   <Edit size={16} />
   </button>
   <button
   onClick={() => onDelete(purchase)}
   className="p-1 text-gray-400 hover:text-red-600 transition-colors"
   >
   <Trash2 size={16} />
   </button>
   </div>
  </td>
  </tr>
  );
  })}
  {purchases.length === 0 && (
  <tr>
  <td colSpan={9} className="px-3 @[640px]:px-4 @[1024px]:px-6 py-8 @[640px]:py-10 @[1024px]:py-12 text-center text-xs @[640px]:text-sm text-gray-500">
  No purchases found
  </td>
  </tr>
  )}
 </tbody>
 </table>
 </div>
 );
};

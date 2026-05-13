"use client";

import React from "react";
import { Edit, Trash2, PackageCheck } from "lucide-react";
import { PurchaseReturn } from "../types";

interface ReturnTableProps {
 purchaseReturns: PurchaseReturn[];
 selectedPurchaseReturns: string[];
 onSelectAll: (checked: boolean) => void;
 onSelectPurchaseReturn: (id: string, checked: boolean) => void;
 onEdit: (purchaseReturn: PurchaseReturn) => void;
 onDelete: (purchaseReturn: PurchaseReturn) => void;
 onReceiveRepair?: (purchaseReturn: PurchaseReturn) => void;
 getStatusBadge: (status: string) => string;
 getProductIcon: (index: number) => { icon: string; color: string };
}

export const ReturnTable: React.FC<ReturnTableProps> = ({
 purchaseReturns,
 selectedPurchaseReturns,
 onSelectAll,
 onSelectPurchaseReturn,
 onEdit,
 onDelete,
 onReceiveRepair,
 getStatusBadge,
 getProductIcon,
}) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="w-12 px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3">
  <input
  type="checkbox"
  checked={
   selectedPurchaseReturns.length === purchaseReturns.length &&
   purchaseReturns.length > 0
  }
  onChange={(e) => onSelectAll(e.target.checked)}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Return #
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Date
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Supplier
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Purchase #
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="text-right px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Total
  </th>
  <th className="text-left px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {purchaseReturns.map((purchaseReturn, index) => {
  const id = purchaseReturn._id ?? (purchaseReturn as unknown as { id?: string }).id ?? "";
  const { icon, color } = getProductIcon(index);
  const dateStr =
  typeof purchaseReturn.date === "string"
  ? purchaseReturn.date
  : purchaseReturn.date
   ? new Date(purchaseReturn.date).toISOString().slice(0, 10)
   : "";
  return (
  <tr key={id} className="hover:bg-gray-50">
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   <input
   type="checkbox"
   checked={selectedPurchaseReturns.includes(id)}
   onChange={(e) => onSelectPurchaseReturn(id, e.target.checked)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
   />
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   <div className="flex items-center gap-1.5 @[640px]:gap-2">
   <div className={`w-7 h-7 @[640px]:w-8 @[640px]:h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
   <span className="text-xs @[640px]:text-sm">{icon}</span>
   </div>
   <span className="font-medium text-gray-900 text-xs @[640px]:text-sm">
   {purchaseReturn.returnNumber}
   </span>
   </div>
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {dateStr
   ? new Date(dateStr).toLocaleDateString("en-GB", {
   day: "2-digit",
   month: "short",
   year: "numeric",
   })
   : "—"}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-900">
   {purchaseReturn.supplierName ?? "—"}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-gray-600">
   {purchaseReturn.purchaseNumber ?? "—"}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   <span
   className={`inline-flex px-2 py-1 text-[10px] @[640px]:text-xs font-semibold rounded-full ${getStatusBadge(
   purchaseReturn.status
   )}`}
   >
   {purchaseReturn.status}
   </span>
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4 text-xs @[640px]:text-sm text-right text-gray-900">
   £{(purchaseReturn.totalAmount ?? 0).toFixed(2)}
  </td>
  <td className="px-3 @[640px]:px-4 @[1024px]:px-6 py-2 @[640px]:py-3 @[1024px]:py-4">
   <div className="flex items-center gap-1.5 @[640px]:gap-2">
   {onReceiveRepair && (
   <button
   type="button"
   onClick={() => onReceiveRepair(purchaseReturn)}
   className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100"
   title="Receive back from repair"
   >
   <PackageCheck size={16} />
   </button>
   )}
   <button
   type="button"
   onClick={() => onEdit(purchaseReturn)}
   className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
   title="Edit status"
   >
   <Edit size={16} />
   </button>
   <button
   type="button"
   onClick={() => onDelete(purchaseReturn)}
   className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
   title="Delete"
   >
   <Trash2 size={16} />
   </button>
   </div>
  </td>
  </tr>
  );
  })}
 </tbody>
 </table>
 </div>
 );
};

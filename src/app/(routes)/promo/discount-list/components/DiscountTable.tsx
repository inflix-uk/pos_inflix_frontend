"use client";

import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Discount } from "../types";

interface DiscountTableProps {
 discounts: Discount[];
 selectedDiscounts: string[];
 onSelectAll: (checked: boolean) => void;
 onSelectDiscount: (id: string, checked: boolean) => void;
 onEdit: (discount: Discount) => void;
 onDelete: (discount: Discount) => void;
}

export const DiscountTable: React.FC<DiscountTableProps> = ({
 discounts,
 selectedDiscounts,
 onSelectAll,
 onSelectDiscount,
 onEdit,
 onDelete,
}) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="w-12 px-6 py-3">
  <input
  type="checkbox"
  checked={selectedDiscounts.length === discounts.length && discounts.length > 0}
  onChange={(e) => onSelectAll(e.target.checked)}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Name
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Value
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Discount Plan
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Validity
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Days
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Products
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {discounts.map((discount) => (
  <tr key={discount.id} className="hover:bg-gray-50">
  <td className="px-6 py-4">
  <input
   type="checkbox"
   checked={selectedDiscounts.includes(discount.id)}
   onChange={(e) => onSelectDiscount(discount.id, e.target.checked)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </td>
  <td className="px-6 py-4 text-sm font-medium text-gray-900">
  {discount.name}
  </td>
  <td className="px-6 py-4 text-sm text-gray-900">
  {discount.value}
  </td>
  <td className="px-6 py-4 text-sm text-blue-600">
  {discount.discountPlan}
  </td>
  <td className="px-6 py-4 text-sm text-gray-900">
  {discount.validity}
  </td>
  <td className="px-6 py-4 text-sm text-gray-900">
  {discount.days.join(", ")}
  </td>
  <td className="px-6 py-4 text-sm text-gray-900">
  {discount.products}
  </td>
  <td className="px-6 py-4">
  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
   discount.status === "Active"
   ? "bg-green-100 text-green-800"
   : "bg-gray-100 text-gray-800"
  }`}>
   {discount.status}
  </span>
  </td>
  <td className="px-6 py-4">
  <div className="flex items-center gap-2">
   <button
   onClick={() => onEdit(discount)}
   className="p-1 text-gray-400 hover:text-blue-600"
   >
   <Edit size={16} />
   </button>
   <button
   onClick={() => onDelete(discount)}
   className="p-1 text-gray-400 hover:text-red-600"
   >
   <Trash2 size={16} />
   </button>
  </div>
  </td>
  </tr>
  ))}
 </tbody>
 </table>
 </div>
 );
};

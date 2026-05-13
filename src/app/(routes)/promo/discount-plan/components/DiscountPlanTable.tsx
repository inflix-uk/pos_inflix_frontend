"use client";

import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { DiscountPlan } from "../types";

interface DiscountPlanTableProps {
 discountPlans: DiscountPlan[];
 selectedItems: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectItem: (id: string) => void;
 onEdit: (discountPlan: DiscountPlan) => void;
 onDelete: (discountPlan: DiscountPlan) => void;
 getStatusBadgeColor: (status: string) => string;
}

export const DiscountPlanTable: React.FC<DiscountPlanTableProps> = ({
 discountPlans,
 selectedItems,
 selectAll,
 onSelectAll,
 onSelectItem,
 onEdit,
 onDelete,
 getStatusBadgeColor,
}) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-3 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Plan Name
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Customers
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {discountPlans.map((plan) => (
  <tr key={plan.id} className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap">
  <input
   type="checkbox"
   checked={selectedItems.includes(plan.id)}
   onChange={() => onSelectItem(plan.id)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {plan.planName}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {plan.customers}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(plan.status)}`}>
   {plan.status}
  </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <div className="flex items-center gap-2">
   <button
   onClick={() => onEdit(plan)}
   className="p-1 text-gray-400 hover:text-gray-600"
   >
   <Edit size={16} />
   </button>
   <button
   onClick={() => onDelete(plan)}
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

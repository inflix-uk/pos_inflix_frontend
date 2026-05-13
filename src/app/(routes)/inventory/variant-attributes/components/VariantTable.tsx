"use client";

import React from "react";
import { Edit, List } from "lucide-react";
import { VariantAttribute } from "../types";

interface VariantTableProps {
 variants: VariantAttribute[];
 selectedVariants: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectVariant: (id: string) => void;
 onEdit: (variant: VariantAttribute) => void;
 onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export const VariantTable: React.FC<VariantTableProps> = ({
 variants,
 selectedVariants,
 selectAll,
 onSelectAll,
 onSelectVariant,
 onEdit,
 onToggleStatus,
}) => {
 const formatDate = (dateString?: string) => {
 if (!dateString) return "-";
 return new Date(dateString).toLocaleDateString("en-US", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 });
 };

 const handleManageValues = (variantSlug: string) => {
 window.open(`/inventory/variant-attributes/${variantSlug}/values`, '_blank');
 };

 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
  />
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Name
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Slug
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Values
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Created Date
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Status
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {variants.length === 0 ? (
  <tr>
  <td colSpan={7} className="px-3 @[640px]:px-6 py-6 @[640px]:py-8 text-center text-xs @[640px]:text-sm text-gray-500">
  No variant attributes found
  </td>
  </tr>
  ) : (
  variants.map((variant) => (
  <tr key={variant._id || variant.name} className="hover:bg-gray-50">
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <input
   type="checkbox"
   checked={selectedVariants.includes(variant._id || variant.name)}
   onChange={() => onSelectVariant(variant._id || variant.name)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
   />
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm font-medium text-gray-900">
   {variant.name}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-500">
   {variant.slug || "-"}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4">
   <span className="text-xs @[640px]:text-sm text-gray-600">
   {variant.values?.length || 0} values
   </span>
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
   {formatDate(variant.createdAt)}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <button
   onClick={() => onToggleStatus(variant._id || "", variant.isActive)}
   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
   variant.isActive ? "bg-green-500" : "bg-gray-300"
   }`}
   >
   <span
   className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
   variant.isActive ? "translate-x-6" : "translate-x-1"
   }`}
   />
   </button>
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <button
   className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
   onClick={() => handleManageValues(variant.slug || "")}
   title="Manage Values"
   >
   <List size={16} />
   </button>
   <button
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   onClick={() => onEdit(variant)}
   title="Edit"
   >
   <Edit size={16} />
   </button>
   </div>
  </td>
  </tr>
  ))
  )}
 </tbody>
 </table>
 </div>
 );
};

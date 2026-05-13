"use client";

import React from "react";
import { Edit2, Trash2, Star, Receipt } from "lucide-react";
import { TaxListProps } from "../types";

export const TaxList: React.FC<TaxListProps> = ({
 taxes,
 onEdit,
 onDelete,
 onSetDefault,
}) => {
 if (taxes.length === 0) {
 return (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
 <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-medium text-gray-800 mb-2">No Taxes</h3>
 <p className="text-gray-500">Add your first tax rate to get started.</p>
 </div>
 );
 }

 const formatRate = (tax: { type: string; rate: number }) => {
 if (tax.type === "percentage") {
 return `${tax.rate}%`;
 }
 return `£${tax.rate.toFixed(2)} (Flat)`;
 };

 return (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Tax Name</th>
  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Rate</th>
  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Code</th>
  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Status</th>
  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {taxes.map((tax) => (
  <tr key={tax._id} className="hover:bg-gray-50">
  <td className="px-6 py-4">
   <div className="flex items-center gap-2">
   <span className="font-medium text-gray-800">{tax.name}</span>
   {tax.isDefault && (
   <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded-full">
   <Star className="w-3 h-3 mr-1 fill-current" />
   Default
   </span>
   )}
   {tax.isCompound && (
   <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
   Compound
   </span>
   )}
   </div>
   {tax.description && (
   <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">{tax.description}</p>
   )}
  </td>
  <td className="px-6 py-4">
   <span className="text-lg font-semibold text-gray-800">{formatRate(tax)}</span>
  </td>
  <td className="px-6 py-4">
   <span className="text-gray-600">{tax.code || "-"}</span>
  </td>
  <td className="px-6 py-4">
   {tax.isActive ? (
   <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
   Active
   </span>
   ) : (
   <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
   Inactive
   </span>
   )}
  </td>
  <td className="px-6 py-4">
   <div className="flex items-center justify-end gap-2">
   {!tax.isDefault && (
   <button
   onClick={() => onSetDefault(tax)}
   className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
   title="Set as default"
   >
   <Star className="w-5 h-5" />
   </button>
   )}
   <button
   onClick={() => onEdit(tax)}
   className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
   title="Edit"
   >
   <Edit2 className="w-5 h-5" />
   </button>
   <button
   onClick={() => onDelete(tax)}
   className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
   title="Delete"
   >
   <Trash2 className="w-5 h-5" />
   </button>
   </div>
  </td>
  </tr>
  ))}
  </tbody>
 </table>
 </div>
 </div>
 );
};

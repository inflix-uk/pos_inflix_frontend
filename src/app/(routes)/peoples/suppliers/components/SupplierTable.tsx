"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Supplier } from "../types";
import { formatSupplierDisplay } from "@/lib/formatSupplierDisplay";

interface SupplierTableProps {
 suppliers: Supplier[];
 selectedSuppliers: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectSupplier: (id: string) => void;
 onEdit: (supplier: Supplier) => void;
 onDelete: (supplier: Supplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
 suppliers,
 selectedSuppliers,
 selectAll,
 onSelectAll,
 onSelectSupplier,
 onEdit,
 onDelete,
}) => {
 const formatDate = (dateString?: string) => {
 if (!dateString) return "-";
 return new Date(dateString).toLocaleDateString("en-US", {
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 };

 const formatAddress = (supplier: Supplier) => {
 const parts = [];
 if (supplier.address?.city) parts.push(supplier.address.city);
 if (supplier.address?.country) parts.push(supplier.address.country);
 return parts.length > 0 ? parts.join(", ") : "-";
 };

 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-y border-gray-200">
  <tr>
  <th className="px-6 py-4 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Supplier
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Phone
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Email
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Location
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Status
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Created
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
  {suppliers.length === 0 ? (
  <tr>
  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
  No suppliers found
  </td>
  </tr>
  ) : (
  suppliers.map((supplier) => (
  <tr key={supplier._id || supplier.name} className="hover:bg-gray-50">
  <td className="px-6 py-4">
   <input
   type="checkbox"
   checked={selectedSuppliers.includes(supplier._id || supplier.name)}
   onChange={() => onSelectSupplier(supplier._id || supplier.name)}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
  </td>
  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
   {formatSupplierDisplay(supplier)}
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {supplier.phone}
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {supplier.email || "-"}
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {formatAddress(supplier)}
  </td>
  <td className="px-6 py-4">
   <span
   className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
   supplier.isActive
   ? "bg-green-100 text-green-800"
   : "bg-red-100 text-red-800"
   }`}
   >
   {supplier.isActive ? "Active" : "Inactive"}
   </span>
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {formatDate(supplier.createdAt)}
  </td>
  <td className="px-6 py-4">
   <div className="flex items-center gap-2">
   <button
   onClick={() => onEdit(supplier)}
   className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
   >
   <Edit2 size={16} />
   </button>
   <button
   onClick={() => onDelete(supplier)}
   className="p-1.5 text-red-600 hover:bg-red-50 rounded"
   >
   <Trash2 size={16} />
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

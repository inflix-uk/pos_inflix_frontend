"use client";

import React from "react";
import { Edit2, Trash2, KeyRound } from "lucide-react";
import type { AccountRow } from "../types";
import type { Supplier } from "../../peoples/suppliers/types";
import { formatSupplierDisplay } from "@/lib/formatSupplierDisplay";
import { useEntitlements } from "@/hooks/useEntitlements";

interface AccountTableProps {
 rows: AccountRow[];
 isLoading: boolean;
 onEdit: (row: AccountRow) => void;
 onDelete: (row: AccountRow) => void;
 onSetPassword?: (row: AccountRow) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
 rows,
 isLoading,
 onEdit,
 onDelete,
 onSetPassword,
}) => {
 const { data: entitlements } = useEntitlements();
 const isInvoicingEnabled = entitlements?.enabledFeatures?.["customer invoicing"] === true;

 const getCompanyName = (row: AccountRow) =>
 row.kind === "supplier" ? formatSupplierDisplay(row.data as Supplier) : row.data.name;
 const getContactName = (row: AccountRow) => {
 if (row.kind === "supplier") {
 return (row.data as { contactPerson?: string }).contactPerson || "-";
 }
 return (row.data as { contactName?: string }).contactName || "-";
 };
 const getEmail = (row: AccountRow) =>
 "email" in row.data ? (row.data.email || "-") : (row.data as { email?: string }).email || "-";
 const getPhone = (row: AccountRow) => row.data.phone;
 const getLocation = (row: AccountRow) => {
 const addr = "address" in row.data ? row.data.address : undefined;
 if (!addr) return "-";
 const parts = [];
 if (addr.city) parts.push(addr.city);
 if (addr.country) parts.push(addr.country);
 return parts.length > 0 ? parts.join(", ") : "-";
 };
 const getIsActive = (row: AccountRow) => row.data.isActive;

 if (isLoading) {
 return (
 <div className="p-8 flex items-center justify-center gap-2">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" aria-hidden />
 <span className="text-sm text-gray-500">Loading accounts…</span>
 </div>
 );
 }

 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-y border-gray-200">
  <tr>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Company Name
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Contact name
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Phone
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Email
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Location
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Type
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Status
  </th>
  <th className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-600">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
  {rows.length === 0 ? (
  <tr>
  <td colSpan={8} className="px-3 @[640px]:px-4 @[768px]:px-6 py-6 @[640px]:py-8 text-center text-xs @[640px]:text-sm text-gray-500">
  No accounts found. Create a customer or supplier to get started.
  </td>
  </tr>
  ) : (
  rows.map((row) => (
  <tr key={`${row.kind}-${row.id}`} className="hover:bg-gray-50">
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-xs @[640px]:text-sm font-medium text-gray-900">
   {getCompanyName(row)}
  </td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-xs @[640px]:text-sm text-gray-600">{getContactName(row)}</td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-xs @[640px]:text-sm text-gray-600">{getPhone(row)}</td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-xs @[640px]:text-sm text-gray-600">{getEmail(row)}</td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-xs @[640px]:text-sm text-gray-600">{getLocation(row)}</td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 text-xs @[640px]:text-sm text-gray-600">
   {row.kind === "supplier" ? "Supplier" : "Customer"}
  </td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4">
   <span
   className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
   getIsActive(row)
   ? "bg-green-100 text-green-800"
   : "bg-red-100 text-red-800"
   }`}
   >
   {getIsActive(row) ? "Active" : "Inactive"}
   </span>
  </td>
  <td className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4">
   <div className="flex items-center gap-1.5 @[640px]:gap-2">
   {row.kind === "customer" && row.data.email && (
   <button
   onClick={() => isInvoicingEnabled && onSetPassword?.(row)}
   disabled={!isInvoicingEnabled}
   className={`p-1.5 rounded ${
    isInvoicingEnabled
    ? "text-orange-600 hover:bg-orange-50 cursor-pointer"
    : "text-gray-300 cursor-not-allowed"
   }`}
   title={isInvoicingEnabled ? "Set Portal Password" : "Customer Invoicing feature is not enabled"}
   >
   <KeyRound size={16} />
   </button>
   )}
   <button
   onClick={() => onEdit(row)}
   className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
   title="Edit"
   >
   <Edit2 size={16} />
   </button>
   <button
   onClick={() => onDelete(row)}
   className="p-1.5 text-red-600 hover:bg-red-50 rounded"
   title="Delete"
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

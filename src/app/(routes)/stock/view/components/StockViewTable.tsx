"use client";

import React from "react";
import type { StockViewRow } from "../types";
import { empty } from "../hooks/useStockView";

interface StockViewTableProps {
 rows: StockViewRow[];
}

export const StockViewTable: React.FC<StockViewTableProps> = ({ rows }) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Ref #
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Purchase #
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Date
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Supplier
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Payment
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Category
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Brand
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Model
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Condition
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Capacity
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Colour
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  IMEI
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Cost
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Sale Price
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {rows.length === 0 ? (
  <tr>
  <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
  No stock found
  </td>
  </tr>
  ) : (
  rows.map((row) => (
  <tr key={row.rowKey} className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.purchaseNumber)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.parcelNumber)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.date)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.supplier)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.status)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.paymentStatus)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.category)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.brand)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.brandModel)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.grade)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.capacity)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.colour)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.imei)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.purchasePrice) === "-"
   ? "-"
   : `${row.currency ? `${row.currency} ` : ""}${row.purchasePrice}`}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {empty(row.salePrice) === "-"
   ? "-"
   : `${row.currency ? `${row.currency} ` : ""}${row.salePrice}`}
  </td>
  </tr>
  ))
  )}
 </tbody>
 </table>
 </div>
 );
};

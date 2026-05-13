"use client";

import React from "react";
import type { RecentSale } from "../types";

interface RecentSalesProps {
 sales: RecentSale[];
 onViewAll?: () => void;
}

const statusStyles: Record<RecentSale["status"], string> = {
 paid: "bg-green-100 text-green-700",
 pending: "bg-neutral-100 text-neutral-700",
 refunded: "bg-gray-100 text-gray-600",
};

export const RecentSales: React.FC<RecentSalesProps> = ({
 sales,
 onViewAll,
}) => {
 return (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
 <div className="p-4 sm:p-6 border-b border-gray-200">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <h2 className="text-base sm:text-lg font-semibold text-gray-800">
  Recent Sales
  </h2>
  {onViewAll && (
  <button
  onClick={onViewAll}
  className="text-sm text-orange-500 hover:text-orange-600 font-medium min-h-[44px] touch-manipulation"
  >
  View All
  </button>
  )}
 </div>
 </div>

 {/* Desktop/tablet: table */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Invoice
  </th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Customer
  </th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Amount
  </th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Date
  </th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {sales.map((sale) => (
  <tr key={sale.id} className="hover:bg-gray-50">
  <td className="px-4 py-3 text-sm font-medium text-gray-900">
   {sale.invoiceNo}
  </td>
  <td className="px-4 py-3 text-sm text-gray-600">
   {sale.customer}
  </td>
  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
   {sale.amount}
  </td>
  <td className="px-4 py-3 text-sm text-gray-500">{sale.date}</td>
  <td className="px-4 py-3">
   <span
   className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${statusStyles[sale.status]}`}
   >
   {sale.status}
   </span>
  </td>
  </tr>
  ))}
  </tbody>
 </table>
 </div>

 {/* Mobile: cards */}
 <div className="md:hidden divide-y divide-gray-200">
 {sales.map((sale) => (
  <div
  key={sale.id}
  className="p-4 flex flex-col gap-2 active:bg-gray-50 touch-manipulation"
  >
  <div className="flex justify-between items-start">
  <span className="text-sm font-medium text-gray-900">
  {sale.invoiceNo}
  </span>
  <span
  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusStyles[sale.status]}`}
  >
  {sale.status}
  </span>
  </div>
  <div className="text-sm text-gray-600">{sale.customer}</div>
  <div className="flex justify-between items-center">
  <span className="text-sm text-gray-500">{sale.date}</span>
  <span className="text-sm font-semibold text-gray-900">
  {sale.amount}
  </span>
  </div>
  </div>
 ))}
 </div>

 {sales.length === 0 && (
 <div className="px-4 py-8 text-center text-gray-500 text-sm">
  No recent sales
 </div>
 )}
 </div>
 );
};

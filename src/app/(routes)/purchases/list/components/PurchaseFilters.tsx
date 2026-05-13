"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

interface PurchaseFiltersProps {
 onSearch: (term: string) => void;
 statusFilter: string;
 onStatusFilter: (status: string) => void;
 paymentStatusFilter: string;
 onPaymentStatusFilter: (status: string) => void;
 completionStatusFilter: string;
 onCompletionStatusFilter: (status: string) => void;
 sortBy: string;
 onSortChange: (sort: string) => void;
}

export const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
 onSearch,
 statusFilter,
 onStatusFilter,
 paymentStatusFilter,
 onPaymentStatusFilter,
 completionStatusFilter,
 onCompletionStatusFilter,
 sortBy,
 onSortChange,
}) => {
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
 const [showCompletionDropdown, setShowCompletionDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);

 const statuses = ["all", "Received", "Pending", "Ordered"];
 const paymentStatuses = ["all", "Paid", "Unpaid", "Partial"];
 const completionStatuses = ["all", "In Process", "Completed"];
 const sortOptions = [
 { value: "latest", label: "Latest" },
 { value: "oldest", label: "Oldest" },
 { value: "highest", label: "Highest Amount" },
 { value: "lowest", label: "Lowest Amount" },
 ];

 return (
 <div className="p-3 @[480px]:p-4 @[1024px]:p-6 border-b border-gray-200">
 <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3 @[1024px]:gap-4">
 {/* Search */}
 <div className="relative flex-1 min-w-[160px] @[640px]:min-w-[200px] max-w-md">
  <Search size={18} className="absolute left-2.5 @[640px]:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
  <input
  type="text"
  placeholder="Search by supplier or reference..."
  onChange={(e) => onSearch(e.target.value)}
  className="w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
 </div>

 {/* Status Filter */}
 <div className="relative">
  <button
  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs @[640px]:text-sm"
  >
  <span className="text-gray-700">
  Status: {statusFilter === "all" ? "All" : statusFilter}
  </span>
  <ChevronDown size={14} className="text-gray-400" />
  </button>
  {showStatusDropdown && (
  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {statuses.map((status) => (
  <button
   key={status}
   onClick={() => {
   onStatusFilter(status);
   setShowStatusDropdown(false);
   }}
   className={`w-full text-left px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
   statusFilter === status ? "bg-orange-50 text-orange-600" : ""
   }`}
  >
   {status === "all" ? "All" : status}
  </button>
  ))}
  </div>
  )}
 </div>

 {/* Payment Status Filter */}
 <div className="relative">
  <button
  onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs @[640px]:text-sm"
  >
  <span className="text-gray-700">
  Payment: {paymentStatusFilter === "all" ? "All" : paymentStatusFilter}
  </span>
  <ChevronDown size={14} className="text-gray-400" />
  </button>
  {showPaymentDropdown && (
  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {paymentStatuses.map((status) => (
  <button
   key={status}
   onClick={() => {
   onPaymentStatusFilter(status);
   setShowPaymentDropdown(false);
   }}
   className={`w-full text-left px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
   paymentStatusFilter === status ? "bg-orange-50 text-orange-600" : ""
   }`}
  >
   {status === "all" ? "All" : status}
  </button>
  ))}
  </div>
  )}
 </div>

 {/* Completion Status Filter (In Process / Completed) */}
 <div className="relative">
  <button
  onClick={() => setShowCompletionDropdown(!showCompletionDropdown)}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs @[640px]:text-sm"
  >
  <span className="text-gray-700">
  Completion: {completionStatusFilter === "all" ? "All" : completionStatusFilter}
  </span>
  <ChevronDown size={14} className="text-gray-400" />
  </button>
  {showCompletionDropdown && (
  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {completionStatuses.map((status) => (
  <button
   key={status}
   onClick={() => {
   onCompletionStatusFilter(status);
   setShowCompletionDropdown(false);
   }}
   className={`w-full text-left px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
   completionStatusFilter === status ? "bg-orange-50 text-orange-600" : ""
   }`}
  >
   {status === "all" ? "All" : status}
  </button>
  ))}
  </div>
  )}
 </div>

 {/* Sort By */}
 <div className="relative">
  <button
  onClick={() => setShowSortDropdown(!showSortDropdown)}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs @[640px]:text-sm"
  >
  <span className="text-gray-700">
  Sort: {sortOptions.find((o) => o.value === sortBy)?.label || "Latest"}
  </span>
  <ChevronDown size={14} className="text-gray-400" />
  </button>
  {showSortDropdown && (
  <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {sortOptions.map((option) => (
  <button
   key={option.value}
   onClick={() => {
   onSortChange(option.value);
   setShowSortDropdown(false);
   }}
   className={`w-full text-left px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
   sortBy === option.value ? "bg-orange-50 text-orange-600" : ""
   }`}
  >
   {option.label}
  </button>
  ))}
  </div>
  )}
 </div>
 </div>
 </div>
 );
};

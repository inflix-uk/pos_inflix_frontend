"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

interface CategoryFiltersProps {
 onSearch: (term: string) => void;
 onStatusFilter: (status: "all" | "active" | "inactive") => void;
 statusFilter: "all" | "active" | "inactive";
}

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
 onSearch,
 onStatusFilter,
 statusFilter,
}) => {
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);

 const statusOptions = [
 { value: "all", label: "All" },
 { value: "active", label: "Active" },
 { value: "inactive", label: "Inactive" },
 ];

 return (
 <div className="flex flex-wrap items-center justify-between gap-2 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="relative flex-1 min-w-[160px] @[640px]:min-w-0 @[640px]:flex-initial">
 <Search
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 @[640px]:h-5 @[640px]:w-5"
 />
 <input
  type="text"
  placeholder="Search"
  className="pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full @[640px]:w-64"
  onChange={(e) => onSearch(e.target.value)}
 />
 </div>
 <div className="relative shrink-0">
 <button
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
 >
  Status: {statusOptions.find((s) => s.value === statusFilter)?.label}
  <ChevronDown size={14} />
 </button>
 {showStatusDropdown && (
  <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
  {statusOptions.map((option) => (
  <button
   key={option.value}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
   onStatusFilter(option.value as "all" | "active" | "inactive");
   setShowStatusDropdown(false);
   }}
  >
   {option.label}
  </button>
  ))}
  </div>
  </div>
 )}
 </div>
 </div>
 );
};

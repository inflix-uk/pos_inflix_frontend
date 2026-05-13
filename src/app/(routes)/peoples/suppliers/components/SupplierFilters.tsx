"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

interface SupplierFiltersProps {
 onSearch: (term: string) => void;
 onStatusFilter: (status: "all" | "active" | "inactive") => void;
 onSortChange: (sort: string) => void;
 statusFilter: "all" | "active" | "inactive";
 sortBy: string;
}

const statusOptions = [
 { value: "all", label: "All" },
 { value: "active", label: "Active" },
 { value: "inactive", label: "Inactive" },
];

const sortOptions = [
 { value: "latest", label: "Latest" },
 { value: "oldest", label: "Oldest" },
 { value: "a-z", label: "A-Z" },
 { value: "z-a", label: "Z-A" },
];

export const SupplierFilters: React.FC<SupplierFiltersProps> = ({
 onSearch,
 onStatusFilter,
 onSortChange,
 statusFilter,
 sortBy,
}) => {
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);

 const currentStatusLabel = statusOptions.find(s => s.value === statusFilter)?.label || "All";
 const currentSortLabel = sortOptions.find(s => s.value === sortBy)?.label || "Latest";

 return (
 <div className="flex items-center justify-between p-6">
 <div className="relative">
 <Search
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
  size={20}
 />
 <input
  type="text"
  placeholder="Search suppliers..."
  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
  onChange={(e) => onSearch(e.target.value)}
 />
 </div>
 <div className="flex items-center gap-3">
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
  >
  Status: {currentStatusLabel}
  <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
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

 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={() => setShowSortDropdown(!showSortDropdown)}
  >
  Sort By: {currentSortLabel}
  <ChevronDown size={16} />
  </button>
  {showSortDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
  {sortOptions.map((option) => (
   <button
   key={option.value}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
   onSortChange(option.value);
   setShowSortDropdown(false);
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
 </div>
 );
};

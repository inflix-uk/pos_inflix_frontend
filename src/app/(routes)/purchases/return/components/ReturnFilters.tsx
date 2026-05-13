"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface ReturnFiltersProps {
 searchTerm: string;
 statusFilter: string;
 sortBy: string;
 showStatusDropdown: boolean;
 showSortDropdown: boolean;
 statuses: string[];
 sortOptions: string[];
 onSearchChange: (value: string) => void;
 onStatusFilterChange: (value: string) => void;
 onSortChange: (value: string) => void;
 onToggleStatusDropdown: () => void;
 onToggleSortDropdown: () => void;
}

export const ReturnFilters: React.FC<ReturnFiltersProps> = ({
 searchTerm,
 statusFilter,
 sortBy,
 showStatusDropdown,
 showSortDropdown,
 statuses,
 sortOptions,
 onSearchChange,
 onStatusFilterChange,
 onSortChange,
 onToggleStatusDropdown,
 onToggleSortDropdown,
}) => {
 return (
 <div className="flex flex-col @[768px]:flex-row @[768px]:items-center @[768px]:justify-between gap-2 @[640px]:gap-3 mt-3 @[640px]:mt-4 @[1024px]:mt-6">
 <div className="relative">
 <Search size={18} className="absolute left-2.5 @[640px]:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
 <input
  type="text"
  placeholder="Search"
  value={searchTerm}
  onChange={(e) => onSearchChange(e.target.value)}
  className="w-full @[640px]:w-72 @[1024px]:w-80 pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
 />
 </div>

 <div className="flex items-center gap-2 @[640px]:gap-3 @[1024px]:gap-4 flex-wrap">
 {/* Status Filter */}
 <div className="relative">
  <button
  onClick={onToggleStatusDropdown}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs @[640px]:text-sm"
  >
  <span className="text-gray-700">{statusFilter}</span>
  <ChevronDown size={14} className="text-gray-400" />
  </button>
  {showStatusDropdown && (
  <div className="absolute top-full left-0 mt-1 w-44 @[640px]:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {statuses.map((status) => (
  <button
   key={status}
   onClick={() => onStatusFilterChange(status)}
   className="w-full text-left px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
  >
   {status}
  </button>
  ))}
  </div>
  )}
 </div>

 {/* Sort By Filter */}
 <div className="relative">
  <button
  onClick={onToggleSortDropdown}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs @[640px]:text-sm"
  >
  <span className="text-gray-700">Sort By: {sortBy}</span>
  <ChevronDown size={14} className="text-gray-400" />
  </button>
  {showSortDropdown && (
  <div className="absolute top-full right-0 mt-1 w-44 @[640px]:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {sortOptions.map((option) => (
  <button
   key={option}
   onClick={() => onSortChange(option)}
   className="w-full text-left px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
  >
   {option}
  </button>
  ))}
  </div>
  )}
 </div>
 </div>
 </div>
 );
};

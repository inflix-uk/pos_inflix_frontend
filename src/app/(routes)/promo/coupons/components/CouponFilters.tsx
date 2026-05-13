"use client";

import React from "react";
import { Search, ChevronDown, Download } from "lucide-react";

interface CouponFiltersProps {
 searchTerm: string;
 selectedType: string;
 selectedStatus: string;
 showTypeDropdown: boolean;
 showStatusDropdown: boolean;
 showSortDropdown: boolean;
 types: string[];
 statuses: string[];
 onSearchChange: (value: string) => void;
 onTypeChange: (value: string) => void;
 onStatusChange: (value: string) => void;
 onToggleTypeDropdown: () => void;
 onToggleStatusDropdown: () => void;
 onToggleSortDropdown: () => void;
}

export const CouponFilters: React.FC<CouponFiltersProps> = ({
 searchTerm,
 selectedType,
 selectedStatus,
 showTypeDropdown,
 showStatusDropdown,
 showSortDropdown,
 types,
 statuses,
 onSearchChange,
 onTypeChange,
 onStatusChange,
 onToggleTypeDropdown,
 onToggleStatusDropdown,
 onToggleSortDropdown,
}) => {
 return (
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 {/* Search */}
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
 <input
  type="text"
  placeholder="Search..."
  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  value={searchTerm}
  onChange={(e) => onSearchChange(e.target.value)}
 />
 </div>

 {/* Filters */}
 <div className="flex items-center gap-4">
 {/* Type Filter */}
 <div className="relative">
  <button
  onClick={onToggleTypeDropdown}
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <span>Type: {selectedType}</span>
  <ChevronDown size={16} />
  </button>
  {showTypeDropdown && (
  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {types.map((type) => (
  <button
   key={type}
   onClick={() => onTypeChange(type)}
   className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
  >
   {type}
  </button>
  ))}
  </div>
  )}
 </div>

 {/* Status Filter */}
 <div className="relative">
  <button
  onClick={onToggleStatusDropdown}
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <span>Status: {selectedStatus}</span>
  <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {statuses.map((status) => (
  <button
   key={status}
   onClick={() => onStatusChange(status)}
   className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
  >
   {status}
  </button>
  ))}
  </div>
  )}
 </div>

 {/* Sort By */}
 <div className="relative">
  <button
  onClick={onToggleSortDropdown}
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <span>Sort By: Last 7 Days</span>
  <ChevronDown size={16} />
  </button>
  {showSortDropdown && (
  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg">Last 7 Days</button>
  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Last 30 Days</button>
  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg">Last 90 Days</button>
  </div>
  )}
 </div>

 {/* Export Button */}
 <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
  <Download size={16} />
  Export
 </button>
 </div>
 </div>
 );
};

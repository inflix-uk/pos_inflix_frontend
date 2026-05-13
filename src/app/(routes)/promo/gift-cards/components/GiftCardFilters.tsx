"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface GiftCardFiltersProps {
 searchTerm: string;
 selectedStatus: string;
 showStatusDropdown: boolean;
 statuses: string[];
 onSearchChange: (value: string) => void;
 onStatusChange: (value: string) => void;
 onToggleStatusDropdown: () => void;
}

export const GiftCardFilters: React.FC<GiftCardFiltersProps> = ({
 searchTerm,
 selectedStatus,
 showStatusDropdown,
 statuses,
 onSearchChange,
 onStatusChange,
 onToggleStatusDropdown,
}) => {
 return (
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
  <input
  type="text"
  placeholder="Search"
  value={searchTerm}
  onChange={(e) => onSearchChange(e.target.value)}
  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
  />
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={onToggleStatusDropdown}
  >
  {selectedStatus}
  <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
  <div className="absolute z-10 mt-2 w-28 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
  {statuses.map((status) => (
   <button
   key={status}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => onStatusChange(status)}
   >
   {status}
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

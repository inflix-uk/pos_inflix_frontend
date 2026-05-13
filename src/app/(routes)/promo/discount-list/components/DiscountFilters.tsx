"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface DiscountFiltersProps {
 searchTerm: string;
 customerFilter: string;
 statusFilter: string;
 showCustomerDropdown: boolean;
 showStatusDropdown: boolean;
 customers: string[];
 statuses: string[];
 onSearchChange: (value: string) => void;
 onCustomerFilterChange: (value: string) => void;
 onStatusFilterChange: (value: string) => void;
 onToggleCustomerDropdown: () => void;
 onToggleStatusDropdown: () => void;
}

export const DiscountFilters: React.FC<DiscountFiltersProps> = ({
 searchTerm,
 customerFilter,
 statusFilter,
 showCustomerDropdown,
 showStatusDropdown,
 customers,
 statuses,
 onSearchChange,
 onCustomerFilterChange,
 onStatusFilterChange,
 onToggleCustomerDropdown,
 onToggleStatusDropdown,
}) => {
 return (
 <div className="flex items-center gap-4">
 <div className="relative flex-1 max-w-md">
 <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
 <input
  type="text"
  placeholder="Search"
  value={searchTerm}
  onChange={(e) => onSearchChange(e.target.value)}
  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
 />
 </div>

 <div className="relative">
 <button
  onClick={onToggleCustomerDropdown}
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
 >
  <span className="text-gray-700">{customerFilter}</span>
  <ChevronDown size={16} className="text-gray-400" />
 </button>
 {showCustomerDropdown && (
  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {customers.map((customer) => (
  <button
  key={customer}
  onClick={() => onCustomerFilterChange(customer)}
  className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
  >
  {customer}
  </button>
  ))}
  </div>
 )}
 </div>

 <div className="relative">
 <button
  onClick={onToggleStatusDropdown}
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
 >
  <span className="text-gray-700">{statusFilter}</span>
  <ChevronDown size={16} className="text-gray-400" />
 </button>
 {showStatusDropdown && (
  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
  {statuses.map((status) => (
  <button
  key={status}
  onClick={() => onStatusFilterChange(status)}
  className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
  >
  {status}
  </button>
  ))}
  </div>
 )}
 </div>
 </div>
 );
};

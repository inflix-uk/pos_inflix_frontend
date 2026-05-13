"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface DiscountPlanFiltersProps {
 searchTerm: string;
 selectedCustomer: string;
 selectedStatus: string;
 showCustomerDropdown: boolean;
 showStatusDropdown: boolean;
 customers: string[];
 statuses: string[];
 onSearchChange: (value: string) => void;
 onCustomerChange: (value: string) => void;
 onStatusChange: (value: string) => void;
 onToggleCustomerDropdown: () => void;
 onToggleStatusDropdown: () => void;
}

export const DiscountPlanFilters: React.FC<DiscountPlanFiltersProps> = ({
 searchTerm,
 selectedCustomer,
 selectedStatus,
 showCustomerDropdown,
 showStatusDropdown,
 customers,
 statuses,
 onSearchChange,
 onCustomerChange,
 onStatusChange,
 onToggleCustomerDropdown,
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
  onClick={onToggleCustomerDropdown}
  >
  {selectedCustomer}
  <ChevronDown size={16} />
  </button>
  {showCustomerDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
  {customers.map((customer) => (
   <button
   key={customer}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => onCustomerChange(customer)}
   >
   {customer}
   </button>
  ))}
  </div>
  </div>
  )}
 </div>

 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={onToggleStatusDropdown}
  >
  {selectedStatus}
  <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
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

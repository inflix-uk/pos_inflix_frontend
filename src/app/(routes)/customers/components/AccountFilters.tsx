"use client";

import React from "react";
import { Search } from "lucide-react";

interface AccountFiltersProps {
 searchTerm: string;
 onSearch: (value: string) => void;
 statusFilter: "all" | "active" | "inactive";
 onStatusFilter: (value: "all" | "active" | "inactive") => void;
 kindFilter: "all" | "customer" | "supplier";
 onKindFilter: (value: "all" | "customer" | "supplier") => void;
}

export const AccountFilters: React.FC<AccountFiltersProps> = ({
 searchTerm,
 onSearch,
 statusFilter,
 onStatusFilter,
 kindFilter,
 onKindFilter,
}) => {
 return (
 <div className="p-3 @[640px]:p-4 border-b border-gray-200 flex flex-wrap items-center gap-2 @[640px]:gap-3 @[768px]:gap-4">
 <div className="relative flex-1 min-w-[180px] @[640px]:min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
 <input
  type="text"
  placeholder="Search by name, email, phone, contact name..."
  value={searchTerm}
  onChange={(e) => onSearch(e.target.value)}
  className="w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 />
 </div>
 <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3">
 <label className="text-xs @[640px]:text-sm font-medium text-gray-700">Type</label>
 <select
  value={kindFilter}
  onChange={(e) => onKindFilter(e.target.value as "all" | "customer" | "supplier")}
  className="px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
  <option value="all">All</option>
  <option value="customer">Customer</option>
  <option value="supplier">Supplier</option>
 </select>
 </div>
 <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3">
 <label className="text-xs @[640px]:text-sm font-medium text-gray-700">Status</label>
 <select
  value={statusFilter}
  onChange={(e) => onStatusFilter(e.target.value as "all" | "active" | "inactive")}
  className="px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
  <option value="all">All</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
 </select>
 </div>
 </div>
 );
};

"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

interface CustomerFiltersProps { onSearch: (term: string) => void; statusFilter: string; onStatusFilter: (status: string) => void; sortBy: string; onSortChange: (sort: string) => void; }

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({ onSearch, statusFilter, onStatusFilter, sortBy, onSortChange }) => {
 const [searchTerm, setSearchTerm] = useState("");

 const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
 setSearchTerm(e.target.value);
 onSearch(e.target.value);
 };

 return (
 <div className="p-3 @[640px]:p-4 border-b border-gray-200">
 <div className="flex flex-col @[640px]:flex-row gap-2 @[640px]:gap-4">
 <div className="relative flex-1">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
  <input type="text" placeholder="Search customers..." value={searchTerm} onChange={handleSearch} className="w-full pl-10 pr-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
 </div>
 <select value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)} className="px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
  <option value="all">All Status</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
 </select>
 <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="name">Name A-Z</option>
  <option value="name-desc">Name Z-A</option>
 </select>
 </div>
 </div>
 );
};

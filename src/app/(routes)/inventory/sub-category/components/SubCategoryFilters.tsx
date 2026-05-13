"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { CategoryOption } from "../types";

interface SubCategoryFiltersProps {
 onSearch: (term: string) => void;
 onStatusFilter: (status: "all" | "active" | "inactive") => void;
 onCategoryFilter: (category: string) => void;
 statusFilter: "all" | "active" | "inactive";
 categoryFilter: string;
 categories: CategoryOption[];
}

export const SubCategoryFilters: React.FC<SubCategoryFiltersProps> = ({
 onSearch,
 onStatusFilter,
 onCategoryFilter,
 statusFilter,
 categoryFilter,
 categories,
}) => {
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

 const statusOptions = [
 { value: "all", label: "All" },
 { value: "active", label: "Active" },
 { value: "inactive", label: "Inactive" },
 ];

 const getCategoryLabel = () => {
 if (categoryFilter === "all") return "All Categories";
 const category = categories.find((c) => c._id === categoryFilter);
 return category?.name || "All Categories";
 };

 return (
 <div className="flex items-center justify-between p-6">
 <div className="relative">
 <Search
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
  size={20}
 />
 <input
  type="text"
  placeholder="Search"
  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
  onChange={(e) => onSearch(e.target.value)}
 />
 </div>
 <div className="flex items-center gap-3">
 {/* Category Filter */}
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
  >
  Category: {getCategoryLabel()}
  <ChevronDown size={16} />
  </button>
  {showCategoryDropdown && (
  <div className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1 max-h-60 overflow-y-auto">
  <button
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
   onCategoryFilter("all");
   setShowCategoryDropdown(false);
   }}
  >
   All Categories
  </button>
  {categories.map((category) => (
   <button
   key={category._id}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
   onCategoryFilter(category._id);
   setShowCategoryDropdown(false);
   }}
   >
   {category.name}
   </button>
  ))}
  </div>
  </div>
  )}
 </div>

 {/* Status Filter */}
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
  >
  Status: {statusOptions.find((s) => s.value === statusFilter)?.label}
  <ChevronDown size={16} />
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
 </div>
 );
};

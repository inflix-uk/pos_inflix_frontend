"use client";
import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { SelectOption } from "../types";

interface FilterBarProps {
 searchTerm: string;
 categoryFilter: string;
 categories: SelectOption[];
 onSearch: (term: string) => void;
 onCategoryFilter: (category: string) => void;
}

export default function FilterBar({
 searchTerm,
 categoryFilter,
 categories,
 onSearch,
 onCategoryFilter,
}: FilterBarProps) {
 const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

 return (
 <div className="p-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
  <div className="relative">
  <Search
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
  size={20}
  />
  <input
  type="text"
  placeholder="Search products..."
  value={searchTerm}
  onChange={(e) => onSearch(e.target.value)}
  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
  />
  </div>
 </div>

 <div className="flex items-center gap-3">
  {/* Category Filter */}
  <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
  >
  {categoryFilter
  ? categories.find((c) => c.value === categoryFilter)?.label || "Category"
  : "All Categories"}
  <ChevronDown size={16} />
  </button>
  {showCategoryDropdown && (
  <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
   <button
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
   onCategoryFilter("");
   setShowCategoryDropdown(false);
   }}
   >
   All Categories
   </button>
   {categories.map((category) => (
   <button
   key={category.value}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
   onCategoryFilter(category.value);
   setShowCategoryDropdown(false);
   }}
   >
   {category.label}
   </button>
   ))}
  </div>
  </div>
  )}
  </div>
 </div>
 </div>
 </div>
 );
}

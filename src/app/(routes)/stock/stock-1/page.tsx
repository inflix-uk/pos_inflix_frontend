"use client";

import React, { useState } from "react";
import { useStockList } from "./hooks/useStockList";
import { StockListTree } from "./components/StockListTree";
import { StockListSidebar } from "./components/StockListSidebar";
import { Search, RefreshCw } from "lucide-react";

export default function Stock1Page() {
 const [imeiSearch, setImeiSearch] = useState("");

 const {
 visibleRows,
 isLoading,
 error,
 refetch,
 expanded,
 toggle,
 filters,
 setFilter,
 clearFilters,
 filterOptions,
 } = useStockList();

 return (
 <div className="min-h-screen bg-gray-50 flex flex-col">
 {/* Top search bar */}
 <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
 {/* <div className="flex items-center gap-2 max-w-md">
  <input
  type="text"
  placeholder="Enter imei to search..."
  value={imeiSearch}
  onChange={(e) => setImeiSearch(e.target.value)}
  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
  />
  <button
  type="button"
  className="flex-shrink-0 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"
  aria-label="Search"
  >
  <Search className="w-5 h-5" />
  </button>
 </div> */}
 </div>

 {/* Main: sidebar + content */}
 <div className="flex-1 flex min-h-0">
 <StockListSidebar
  filters={filters}
  filterOptions={filterOptions}
  onFilterChange={setFilter}
  onClearFilters={clearFilters}
 />

 <div className="flex-1 flex flex-col min-w-0 bg-white">
  {error && (
  <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
  {error}
  </div>
  )}

  {/* Title + status pill tabs */}
  <div className="flex-shrink-0 flex flex-wrap w-full items-center justify-between gap-4 px-4 py-4 border-b border-gray-200">
  <h1 className="text-xl font-bold text-gray-900">Stock List</h1>
  <div className="flex items-center gap-2">
  <span className="rounded-full bg-neutral-500 px-4 py-1.5 text-sm font-medium text-white">
  AvailableStock
  </span>
  <button
  type="button"
  onClick={refetch}
  disabled={isLoading}
  className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  aria-label="Refresh stock list"
  >
  <RefreshCw
   className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
  />
  </button>
  
  </div>
  </div>

  {/* Tree content */}
  <div className="flex-1 overflow-auto">
  {isLoading ? (
  <div className="py-16 flex items-center justify-center text-gray-500">
  <RefreshCw className="w-8 h-8 animate-spin mr-2" />
  Loading stock list…
  </div>
  ) : (
  <StockListTree
  rows={visibleRows}
  expanded={expanded}
  onToggle={toggle}
  />
  )}
  </div>
 </div>
 </div>
 </div>
 );
}

"use client";

import React from "react";
import { Search, Download } from "lucide-react";

export interface StockViewHeaderProps {
 search: string;
 onSearchChange: (value: string) => void;
 brand: string;
 onBrandChange: (value: string) => void;
 capacity: string;
 onCapacityChange: (value: string) => void;
 colour: string;
 onColourChange: (value: string) => void;
 imei: string;
 onImeiChange: (value: string) => void;
 brandOptions: string[];
 capacityOptions: string[];
 colourOptions: string[];
 onExportCsv?: () => void;
}

export const StockViewHeader: React.FC<StockViewHeaderProps> = ({
 search,
 onSearchChange,
 brand,
 onBrandChange,
 capacity,
 onCapacityChange,
 colour,
 onColourChange,
 imei,
 onImeiChange,
 brandOptions,
 capacityOptions,
 colourOptions,
 onExportCsv,
}) => {
 return (
 <div className="mb-8">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
 <div>
  <h1 className="text-2xl font-semibold text-gray-900">Stock</h1>
  <p className="text-gray-600 mt-1">
  View your stock levels and inventory
  </p>
 </div>
 {onExportCsv && (
  <button
  type="button"
  onClick={onExportCsv}
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-colors shrink-0"
  >
  <Download className="w-4 h-4" />
  Export as CSV
  </button>
 )}
 </div>

 <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
 <div className="w-full sm:max-w-xs">
  <label htmlFor="stock-search" className="block text-sm font-medium text-gray-700 mb-1">
  Search
  </label>
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
  id="stock-search"
  type="text"
  placeholder="Search..."
  value={search}
  onChange={(e) => onSearchChange(e.target.value)}
  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
 </div>

 <div className="flex flex-wrap items-end gap-3">
  <div>
  <label htmlFor="filter-brand" className="block text-sm font-medium text-gray-700 mb-1">
  Brand
  </label>
  <select
  id="filter-brand"
  value={brand}
  onChange={(e) => onBrandChange(e.target.value)}
  className="min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">All</option>
  {brandOptions.map((b) => (
  <option key={b} value={b}>
   {b}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label htmlFor="filter-capacity" className="block text-sm font-medium text-gray-700 mb-1">
  Capacity
  </label>
  <select
  id="filter-capacity"
  value={capacity}
  onChange={(e) => onCapacityChange(e.target.value)}
  className="min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">All</option>
  {capacityOptions.map((c) => (
  <option key={c} value={c}>
   {c}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label htmlFor="filter-colour" className="block text-sm font-medium text-gray-700 mb-1">
  Colour
  </label>
  <select
  id="filter-colour"
  value={colour}
  onChange={(e) => onColourChange(e.target.value)}
  className="min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">All</option>
  {colourOptions.map((c) => (
  <option key={c} value={c}>
   {c}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label htmlFor="filter-imei" className="block text-sm font-medium text-gray-700 mb-1">
  IMEI
  </label>
  <input
  id="filter-imei"
  type="text"
  placeholder="Filter by IMEI..."
  value={imei}
  onChange={(e) => onImeiChange(e.target.value)}
  className="min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
 </div>
 </div>
 </div>
 );
};

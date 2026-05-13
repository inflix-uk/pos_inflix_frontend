"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Download, Plus, Package, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

export type InventoryStatusFilter = "available" | "sold" | "all";
export type ProductTypeFilter = "all" | "serial" | "non-serial";

export interface ProductsPageHeaderProps {
 search: string;
 onSearchChange: (value: string) => void;
 category?: string;
 onCategoryChange?: (value: string) => void;
 categoryOptions?: string[];
 brand: string;
 onBrandChange: (value: string) => void;
 brandModel?: string;
 onBrandModelChange?: (value: string) => void;
 capacity: string;
 onCapacityChange: (value: string) => void;
 colour: string;
 onColourChange: (value: string) => void;
 imei: string;
 onImeiChange: (value: string) => void;
 brandOptions: string[];
 brandModelOptions?: string[];
 capacityOptions: string[];
 colourOptions: string[];
 statusFilter?: InventoryStatusFilter;
 onStatusFilterChange?: (value: InventoryStatusFilter) => void;
 productTypeFilter?: ProductTypeFilter;
 onProductTypeFilterChange?: (value: ProductTypeFilter) => void;
 locationId?: string;
 onLocationChange?: (value: string) => void;
 locationOptions?: { _id: string; name: string }[];
 onExportCsv?: () => void;
 onExportExcel?: () => void;
 onExportPdf?: () => void;
 isExporting?: boolean;
 totalCount?: number;
}

export function ProductsPageHeader(props: ProductsPageHeaderProps) {
 const {
 search,
 onSearchChange,
 category = "",
 onCategoryChange,
 categoryOptions = [],
 brand,
 onBrandChange,
 brandModel = "",
 onBrandModelChange,
 capacity,
 onCapacityChange,
 colour,
 onColourChange,
 imei,
 onImeiChange,
 brandOptions,
 brandModelOptions = [],
 capacityOptions,
 colourOptions,
 statusFilter = "available",
 onStatusFilterChange,
 productTypeFilter = "all",
 onProductTypeFilterChange,
 locationId = "",
 onLocationChange,
 locationOptions = [],
 onExportCsv,
 onExportExcel,
 onExportPdf,
 isExporting = false,
 totalCount = 0,
 } = props;

 const [exportOpen, setExportOpen] = useState(false);
 const exportRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClick = (e: MouseEvent) => {
 if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
 setExportOpen(false);
 }
 };
 document.addEventListener("mousedown", handleClick);
 return () => document.removeEventListener("mousedown", handleClick);
 }, []);

 const hasExport = onExportCsv || onExportExcel || onExportPdf;

 return (
 <div className="mb-4 @[640px]:mb-6">
 <div className="flex flex-col gap-3 @[640px]:gap-4 @[640px]:flex-row @[640px]:items-center @[640px]:justify-between">
 <div className="flex items-center gap-2 @[640px]:gap-3">
  <div className="p-2 @[640px]:p-2.5 bg-orange-100 rounded-lg">
  <Package className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 text-orange-500" />
  </div>
  <div className="min-w-0">
  <h1 className="text-base @[640px]:text-xl font-semibold text-gray-800">Products</h1>
  <p className="text-[11px] @[640px]:text-sm text-gray-500 mt-0.5">
  View stock and inventory {totalCount > 0 && `(${totalCount} items)`}
  </p>
  </div>
 </div>
 <div className="flex items-center gap-2 @[640px]:gap-3 flex-wrap">
  <Link
  href="/inventory/create-product"
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs @[640px]:text-sm font-medium rounded-lg transition-colors"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  <span className="hidden @[420px]:inline">Add product</span>
  <span className="@[420px]:hidden">Add</span>
  </Link>
  {hasExport && (
  <div className="relative" ref={exportRef}>
  <button
  type="button"
  onClick={() => setExportOpen((p) => !p)}
  disabled={isExporting}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs @[640px]:text-sm font-medium text-gray-700 transition-colors"
  >
  <Download className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  {isExporting ? "Exporting…" : "Export"}
  <ChevronDown className="h-3 w-3 @[640px]:h-3.5 @[640px]:w-3.5 ml-0.5" />
  </button>
  {exportOpen && !isExporting && (
  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
   {onExportCsv && (
   <button
   type="button"
   onClick={() => { setExportOpen(false); onExportCsv(); }}
   className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
   >
   <Download className="h-4 w-4 text-gray-400" />
   Export as CSV
   </button>
   )}
   {onExportExcel && (
   <button
   type="button"
   onClick={() => { setExportOpen(false); onExportExcel(); }}
   className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
   >
   <FileSpreadsheet className="h-4 w-4 text-green-600" />
   Export as Excel
   </button>
   )}
   {onExportPdf && (
   <button
   type="button"
   onClick={() => { setExportOpen(false); onExportPdf(); }}
   className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
   >
   <FileText className="h-4 w-4 text-red-500" />
   Export as PDF
   </button>
   )}
  </div>
  )}
  </div>
  )}
 </div>
 </div>

 <div className="mt-3 @[640px]:mt-4 p-3 @[640px]:p-4 bg-white rounded-lg border border-gray-200">
 <div className="flex flex-col gap-3 @[640px]:gap-4 @[640px]:flex-row @[640px]:items-end @[640px]:flex-wrap">
  <div className="flex-1 min-w-[160px] @[640px]:min-w-[200px] max-w-full @[640px]:max-w-md">
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
  Search
  </label>
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-gray-400" />
  <input
  type="text"
  placeholder={productTypeFilter === "non-serial" ? "Name, barcode, Ref #…" : "Name, barcode, SKU, Ref #, IMEI…"}
  value={search}
  onChange={(e) => onSearchChange(e.target.value)}
  className="w-full pl-9 @[640px]:pl-10 pr-3 py-2 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  </div>
  <div className="grid grid-cols-2 @[480px]:grid-cols-3 @[768px]:grid-cols-5 gap-2 @[640px]:gap-3">
  {onCategoryChange && categoryOptions.length > 0 && (
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
   Category
  </label>
  <select
   value={category}
   onChange={(e) => onCategoryChange(e.target.value)}
   className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
   <option value="">All</option>
   {categoryOptions.map((c) => (
   <option key={c} value={c}>{c}</option>
   ))}
  </select>
  </div>
  )}
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
  Brand
  </label>
  <select
  value={brand}
  onChange={(e) => onBrandChange(e.target.value)}
  className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
  <option value="">All</option>
  {brandOptions.map((b) => (
   <option key={b} value={b}>{b}</option>
  ))}
  </select>
  </div>
  {onBrandModelChange && (
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
   Model
  </label>
  <select
   value={brandModel}
   onChange={(e) => onBrandModelChange(e.target.value)}
   className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
   <option value="">All</option>
   {brandModelOptions.map((m) => (
   <option key={m} value={m}>{m}</option>
   ))}
  </select>
  </div>
  )}
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
  Capacity
  </label>
  <select
  value={capacity}
  onChange={(e) => onCapacityChange(e.target.value)}
  className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
  <option value="">All</option>
  {capacityOptions.map((c) => (
   <option key={c} value={c}>{c}</option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
  Colour
  </label>
  <select
  value={colour}
  onChange={(e) => onColourChange(e.target.value)}
  className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
  <option value="">All</option>
  {colourOptions.map((c) => (
   <option key={c} value={c}>{c}</option>
  ))}
  </select>
  </div>
  {productTypeFilter !== "non-serial" && (
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
   IMEI
  </label>
  <input
   type="text"
   placeholder="Filter IMEI..."
   value={imei}
   onChange={(e) => onImeiChange(e.target.value)}
   className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  )}
  {onProductTypeFilterChange && productTypeFilter === "all" && (
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
   Product type
  </label>
  <select
   value={productTypeFilter}
   onChange={(e) => onProductTypeFilterChange(e.target.value as ProductTypeFilter)}
   className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
   <option value="all">All products</option>
   <option value="serial">Serial (IMEI) only</option>
   <option value="non-serial">Non-serial only</option>
  </select>
  </div>
  )}
  {onLocationChange && locationOptions.length > 0 && (
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
   Location
  </label>
  <select
   value={locationId}
   onChange={(e) => onLocationChange(e.target.value)}
   className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
   <option value="">All locations</option>
   {locationOptions.map((loc) => (
   <option key={loc._id} value={loc._id}>{loc.name}</option>
   ))}
  </select>
  </div>
  )}
  {onStatusFilterChange && (
  <div>
  <label className="block text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 @[640px]:mb-1.5">
   Status
  </label>
  <select
   value={statusFilter}
   onChange={(e) => onStatusFilterChange(e.target.value as InventoryStatusFilter)}
   className="w-full px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2.5 border border-gray-200 rounded-lg text-xs @[640px]:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
  >
   <option value="available">Available only</option>
   <option value="sold">Sold only</option>
   <option value="all">All</option>
  </select>
  </div>
  )}
  </div>
 </div>
 </div>
 </div>
 );
}

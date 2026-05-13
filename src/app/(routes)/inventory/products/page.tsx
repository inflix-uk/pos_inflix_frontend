"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Package, List, ShoppingBag, DollarSign, FileSpreadsheet, FileText } from "lucide-react";
import { useStockView } from "../../stock/view/hooks/useStockView";
import { stockViewApi } from "../../stock/view/services/stockViewApi";
import { useStockList } from "../../stock/stock-1/hooks/useStockList";
import { StockListTree } from "../../stock/stock-1/components/StockListTree";
import { StockListSidebar } from "../../stock/stock-1/components/StockListSidebar";
import { ProductsPageHeader } from "./components/ProductsPageHeader";
import { ProductsStockTable, ProductsRateTable, groupRowsByVariant } from "./components";
import { downloadRateListExcel, downloadRateListPdf } from "@/lib/productsExport";
import type { RateListExportItem } from "@/lib/productsExport";
import { ProductHistoryModal } from "../product-history/ProductHistoryModal";
import { Pagination } from "../../stock/view/components/Pagination";
import { RefreshCw } from "lucide-react";

type TabId = "products" | "sold" | "stock-list" | "rate-list";

const VALID_TABS: ReadonlyArray<TabId> = ["products", "sold", "stock-list", "rate-list"];

export default function ProductsPage() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();
 const initialTab = (() => {
 const t = (searchParams.get("tab") || "").toLowerCase();
 return (VALID_TABS as ReadonlyArray<string>).includes(t) ? (t as TabId) : "products";
 })();
 const [activeTab, setActiveTabState] = useState<TabId>(initialTab);

 const setActiveTab = useCallback(
 (tab: TabId) => {
 setActiveTabState(tab);
 const params = new URLSearchParams(Array.from(searchParams.entries()));
 if (tab === "products") params.delete("tab");
 else params.set("tab", tab);
 const qs = params.toString();
 router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
 },
 [searchParams, router, pathname]
 );
 const [productHistoryOpen, setProductHistoryOpen] = useState(false);
 const [productHistorySerial, setProductHistorySerial] = useState("");

 const handleViewHistory = useCallback((serial: string) => {
 setProductHistorySerial(serial);
 setProductHistoryOpen(true);
 }, []);

 const tableScrollRef = useRef<HTMLDivElement | null>(null);

 const setTypeInUrl = useCallback(
 (type: "all" | "serial" | "non-serial") => {
 const params = new URLSearchParams(Array.from(searchParams.entries()));
 if (type === "all") params.delete("type");
 else params.set("type", type);
 const qs = params.toString();
 router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
 },
 [router, pathname, searchParams]
 );

 const stockView = useStockView();
 const {
 filteredRows,
 totalRows,
 soldInfoMap,
 statusFilter,
 setStatusFilter,
 productTypeFilter,
 setProductTypeFilter,
 error: stockViewError,
 currentPage,
 rowsPerPage,
 totalPages,
 handlePageChange,
 handleRowsPerPageChange,
 search,
 setSearch,
 category,
 setCategory,
 brand,
 setBrand,
 brandModel,
 setBrandModel,
 capacity,
 setCapacity,
 colour,
 setColour,
 imei,
 setImei,
 locationId,
 setLocationId,
 categoryOptions,
 brandOptions,
 brandModelOptions,
 capacityOptions,
 colourOptions,
 locationOptions,
 exportAsCsv,
 exportAllAsCsv,
 exportAllAsExcel,
 exportAllAsPdf,
 isExporting: isExportingStock,
 refetch: refetchStockView,
 isLoading: stockViewLoading,
 isFetching: stockViewFetching,
 } = stockView;

 const [rateListRows, setRateListRows] = useState<typeof filteredRows>([]);
 const [rateListLoading, setRateListLoading] = useState(false);
 const fetchRateListRows = useCallback(async () => {
 setRateListLoading(true);
 try {
 const res = await stockViewApi.getStockViewRows({
 page: 1,
 limit: 10000,
 excludeSold: statusFilter === "available",
 statusFilter,
 productType: "serial",
 });
 if (res.success && Array.isArray(res.data)) {
 setRateListRows(res.data);
 } else {
 setRateListRows([]);
 }
 } catch {
 setRateListRows([]);
 } finally {
 setRateListLoading(false);
 }
 }, [statusFilter]);
 useEffect(() => {
 if (activeTab === "rate-list") fetchRateListRows();
 }, [activeTab, fetchRateListRows]);

 const handleQuantityChange = useCallback(
 async (purchaseId: string, itemId: string, quantity: number) => {
 const res = await stockViewApi.updateItemQuantity(purchaseId, itemId, quantity);
 if (!res.success) throw new Error(res.message || "Failed to update quantity");
 await refetchStockView();
 },
 [refetchStockView]
 );

 const handleDeleteNonSerialItem = useCallback(
 async (purchaseId: string, itemId: string) => {
 const res = await stockViewApi.deletePurchaseItem(purchaseId, itemId);
 if (!res.success) throw new Error(res.message || "Failed to delete item");
 await refetchStockView();
 },
 [refetchStockView]
 );

 const nonSerialByCategory = useMemo(() => {
 const rows = filteredRows.filter((r) => !r.isSerialProduct);
 const map: Record<string, typeof rows> = {};
 rows.forEach((r) => {
 const cat = (r.category && String(r.category).trim()) || "Uncategorized";
 if (!map[cat]) map[cat] = [];
 map[cat].push(r);
 });
 return Object.keys(map)
 .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
 .map((category) => ({ category, rows: map[category] }));
 }, [filteredRows]);

 const serialRowsWithVariants = useMemo(
 () =>
 filteredRows.filter(
 (r) => r.isSerialProduct && Array.isArray(r.variantValues) && r.variantValues.length > 0
 ),
 [filteredRows]
 );

 const serialByCategory = useMemo(() => {
 const rows = serialRowsWithVariants;
 const map: Record<string, typeof rows> = {};
 rows.forEach((r) => {
 const cat = (r.category && String(r.category).trim()) || "Uncategorized";
 if (!map[cat]) map[cat] = [];
 map[cat].push(r);
 });
 return Object.keys(map)
 .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
 .map((category) => ({ category, rows: map[category] }));
 }, [serialRowsWithVariants]);

 const stockList = useStockList({ enabled: activeTab === "stock-list" });
 const {
 visibleRows,
 isLoading: stockListLoading,
 error: stockListError,
 refetch,
 expanded,
 toggle,
 filters,
 setFilter,
 clearFilters,
 filterOptions,
 } = stockList;

 const error = activeTab === "products" || activeTab === "rate-list" ? stockViewError : activeTab === "stock-list" ? stockListError : stockViewError;

 // Sync URL ?type=serial|non-serial with product type filter (e.g. when opening from sidebar)
 useEffect(() => {
 const type = searchParams.get("type");
 if (type === "serial") setProductTypeFilter("serial");
 else if (type === "non-serial") setProductTypeFilter("non-serial");
 else setProductTypeFilter("all");
 }, [searchParams, setProductTypeFilter]);

 // On non-serial view, Stock list and Rate list tabs are hidden (serial-only); switch to Products if needed
 useEffect(() => {
 if (productTypeFilter === "non-serial" && (activeTab === "stock-list" || activeTab === "rate-list")) {
 setActiveTab("products");
 }
 }, [productTypeFilter, activeTab, setActiveTab]);

 // When landing with ?tab=sold (or switching to it), keep stock status filter aligned with the active tab
 useEffect(() => {
 if (activeTab === "sold") setStatusFilter("sold");
 else if (activeTab === "products") setStatusFilter("available");
 }, [activeTab, setStatusFilter]);

 const rateListItems = useMemo(() => groupRowsByVariant(rateListRows), [rateListRows]);

 const [isExportingRateList, setIsExportingRateList] = useState(false);
 const exportRateListAsExcel = useCallback(() => {
 setIsExportingRateList(true);
 try {
 downloadRateListExcel(rateListItems as RateListExportItem[]);
 } finally {
 setIsExportingRateList(false);
 }
 }, [rateListItems]);

 const exportRateListAsPdf = useCallback(() => {
 setIsExportingRateList(true);
 try {
 downloadRateListPdf(rateListItems as RateListExportItem[]);
 } finally {
 setIsExportingRateList(false);
 }
 }, [rateListItems]);

 // Updates one purchase item sale price (no refetch here — Rate list refetches once after all itemRefs are updated).
 const handleRateListSalePriceChange = useCallback(
 async (purchaseId: string, itemId: string, salePrice: number) => {
 const res = await stockViewApi.updateItemSalePrice(purchaseId, itemId, salePrice);
 if (!res.success) throw new Error(res.message || "Failed to update sale price");
 },
 []
 );

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 {error && (
 <div className="mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs @[640px]:text-sm">
  {error}
 </div>
 )}

 {/* Main tabs: Products | Sold | Stock list */}
 <div className="flex flex-wrap items-center gap-2 mb-3 @[640px]:mb-4">
 <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <button
  type="button"
  onClick={() => { setActiveTab("products"); setStatusFilter("available"); }}
  className={`inline-flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2.5 rounded-lg text-xs @[640px]:text-sm font-medium transition-colors ${
  activeTab === "products"
  ? "bg-orange-500 text-white"
  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
  }`}
  >
  <Package className="h-4 w-4" />
  Products
  </button>
  <button
  type="button"
  onClick={() => { setActiveTab("sold"); setStatusFilter("sold"); }}
  className={`inline-flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2.5 rounded-lg text-xs @[640px]:text-sm font-medium transition-colors ${
  activeTab === "sold"
  ? "bg-orange-500 text-white"
  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
  }`}
  >
  <ShoppingBag className="h-4 w-4" />
  Sold
  </button>
  {productTypeFilter !== "non-serial" && (
  <>
  <button
  type="button"
  onClick={() => setActiveTab("stock-list")}
  className={`inline-flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2.5 rounded-lg text-xs @[640px]:text-sm font-medium transition-colors ${
   activeTab === "stock-list"
   ? "bg-orange-500 text-white"
   : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
  }`}
  >
  <List className="h-4 w-4" />
  Stock list
  </button>
  <button
  type="button"
  onClick={() => setActiveTab("rate-list")}
  className={`inline-flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2.5 rounded-lg text-xs @[640px]:text-sm font-medium transition-colors ${
   activeTab === "rate-list"
   ? "bg-orange-500 text-white"
   : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
  }`}
  >
  <DollarSign className="h-4 w-4" />
  Rate list
  </button>
  </>
  )}
 </div>
 {/* View: All | Serial | Non-serial — only when on generic products page (no ?type= in URL) */}
 {(activeTab === "products" || activeTab === "sold") && productTypeFilter === "all" && (
  <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
  <span className="text-xs text-gray-500 mr-1 hidden @[640px]:inline">View:</span>
  <button
  type="button"
  onClick={() => { setProductTypeFilter("all"); setTypeInUrl("all"); }}
  className="bg-orange-500 text-white px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 rounded-lg text-xs @[640px]:text-sm font-medium whitespace-nowrap"
  >
  All
  </button>
  <button
  type="button"
  onClick={() => { setProductTypeFilter("serial"); setTypeInUrl("serial"); }}
  className="px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 rounded-lg text-xs @[640px]:text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
  >
  Serial items
  </button>
  <button
  type="button"
  onClick={() => { setProductTypeFilter("non-serial"); setTypeInUrl("non-serial"); }}
  className="px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 rounded-lg text-xs @[640px]:text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
  >
  Non-serial items
  </button>
  </div>
 )}
 </div>

 {(activeTab === "products" || activeTab === "sold") && (
 <>
  <ProductsPageHeader
  search={search}
  onSearchChange={setSearch}
  category={category}
  onCategoryChange={setCategory}
  categoryOptions={categoryOptions}
  brand={brand}
  onBrandChange={setBrand}
  brandModel={brandModel}
  onBrandModelChange={setBrandModel}
  brandModelOptions={brandModelOptions}
  capacity={capacity}
  onCapacityChange={setCapacity}
  colour={colour}
  onColourChange={setColour}
  imei={imei}
  onImeiChange={setImei}
  brandOptions={brandOptions}
  capacityOptions={capacityOptions}
  colourOptions={colourOptions}
  locationId={locationId}
  onLocationChange={setLocationId}
  locationOptions={locationOptions}
  statusFilter={statusFilter}
  onStatusFilterChange={setStatusFilter}
  productTypeFilter={productTypeFilter}
  onProductTypeFilterChange={setProductTypeFilter}
  onExportCsv={exportAllAsCsv}
  onExportExcel={exportAllAsExcel}
  onExportPdf={exportAllAsPdf}
  isExporting={isExportingStock}
  totalCount={totalRows}
  />

  <div ref={tableScrollRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  {activeTab === "sold" && (
  <div className="px-5 py-3 border-b border-gray-200 bg-neutral-50/80">
  <p className="text-sm text-neutral-800 font-medium">Sold items — items that have been sold and are no longer in inventory.</p>
  </div>
  )}
  <div className="relative p-5">
  {stockViewFetching && !stockViewLoading && (
  <div className="pointer-events-none absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 transition-opacity" />
  )}
  {productTypeFilter === "all" ? (
  <>
   {serialByCategory.map(({ category: cat, rows: catRows }) => (
   <ProductsStockTable
   key={`serial-${cat}`}
   rows={catRows}
   soldInfoMap={soldInfoMap}
   isLoading={stockViewLoading}
   onQuantityChange={handleQuantityChange}
   variant="serial"
   title={`Serial products — ${cat}`}
   onViewHistory={handleViewHistory}
   />
   ))}
   {nonSerialByCategory.map(({ category: cat, rows: catRows }) => (
   <ProductsStockTable
   key={`non-serial-${cat}`}
   rows={catRows}
   soldInfoMap={soldInfoMap}
   isLoading={stockViewLoading}
   onQuantityChange={handleQuantityChange}
   variant="non-serial"
   title={`Non-serial products — ${cat}`}
   onViewHistory={handleViewHistory}
   onDeleteNonSerialItem={handleDeleteNonSerialItem}
   />
   ))}
  </>
  ) : productTypeFilter === "serial" ? (
  serialByCategory.length > 0 ? (
   serialByCategory.map(({ category, rows }) => (
   <ProductsStockTable
   key={category}
   rows={rows}
   soldInfoMap={soldInfoMap}
   isLoading={stockViewLoading}
   onQuantityChange={handleQuantityChange}
   variant="serial"
   title={category}
   onViewHistory={handleViewHistory}
   />
   ))
  ) : (
   <ProductsStockTable
   rows={[]}
   soldInfoMap={soldInfoMap}
   isLoading={stockViewLoading}
   onQuantityChange={handleQuantityChange}
   variant="serial"
   onViewHistory={handleViewHistory}
   />
  )
  ) : nonSerialByCategory.length > 0 ? (
  nonSerialByCategory.map(({ category, rows }) => (
   <ProductsStockTable
   key={category}
   rows={rows}
   soldInfoMap={soldInfoMap}
   isLoading={stockViewLoading}
   onQuantityChange={handleQuantityChange}
   variant="non-serial"
   title={category}
   onViewHistory={handleViewHistory}
   onDeleteNonSerialItem={handleDeleteNonSerialItem}
   />
  ))
  ) : (
  <ProductsStockTable
   rows={[]}
   soldInfoMap={soldInfoMap}
   isLoading={stockViewLoading}
   onQuantityChange={handleQuantityChange}
   variant="non-serial"
   onViewHistory={handleViewHistory}
   onDeleteNonSerialItem={handleDeleteNonSerialItem}
  />
  )}
  </div>
  <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  totalRows={totalRows}
  displayedCount={filteredRows.length}
  isFetching={stockViewFetching}
  onPageChange={(p) => {
  handlePageChange(p);
  if (tableScrollRef.current) {
   tableScrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  }}
  onRowsPerPageChange={handleRowsPerPageChange}
  />
  </div>
 </>
 )}

 {activeTab === "stock-list" && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[560px] flex flex-col">
  <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 bg-gray-50/50">
  <div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-orange-100">
  <List className="h-5 w-5 text-orange-600" />
  </div>
  <div>
  <h2 className="text-lg font-semibold text-gray-900">Stock list</h2>
  <p className="text-xs text-gray-500 mt-0.5">Serial (IMEI) items only — browse by category, brand, model and variant</p>
  </div>
  </div>
  <div className="flex items-center gap-2">
  <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700">
  Available
  </span>
  <button
  type="button"
  onClick={() => refetch()}
  disabled={stockListLoading}
  className="p-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-white hover:border-orange-200 hover:text-orange-600 disabled:opacity-50 transition-colors"
  aria-label="Refresh"
  >
  <RefreshCw className={`h-4 w-4 ${stockListLoading ? "animate-spin" : ""}`} />
  </button>
  </div>
  </div>
  <div className="flex-1 flex min-h-0">
  <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50/30 p-4 overflow-y-auto">
  <StockListSidebar
  filters={filters}
  filterOptions={filterOptions}
  onFilterChange={setFilter}
  onClearFilters={clearFilters}
  embed
  />
  </div>
  <div className="flex-1 flex flex-col min-w-0 overflow-auto">
  <div className="p-5">
  {stockListLoading ? (
   <div className="py-20 flex flex-col items-center justify-center text-gray-500">
   <RefreshCw className="w-10 h-10 animate-spin text-orange-500 mb-3" />
   <p className="text-sm font-medium">Loading stock list…</p>
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
 )}

 {activeTab === "rate-list" && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[560px] flex flex-col">
  <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 bg-gray-50/50">
  <div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-orange-100">
  <DollarSign className="h-5 w-5 text-orange-600" />
  </div>
  <div>
  <h2 className="text-lg font-semibold text-gray-900">Rate list</h2>
  <p className="text-xs text-gray-500 mt-0.5">Update sale prices by SKU — serial items grouped by purchase line</p>
  </div>
  </div>
  <div className="flex items-center gap-2">
  <button
  type="button"
  onClick={exportRateListAsExcel}
  disabled={isExportingRateList || rateListLoading}
  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
  title="Export as Excel"
  >
  <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
  Excel
  </button>
  <button
  type="button"
  onClick={exportRateListAsPdf}
  disabled={isExportingRateList || rateListLoading}
  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
  title="Export as PDF"
  >
  <FileText className="h-3.5 w-3.5 text-red-500" />
  PDF
  </button>
  <button
  type="button"
  onClick={() => {
   refetchStockView();
   fetchRateListRows();
  }}
  disabled={rateListLoading}
  className="p-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-white hover:border-orange-200 hover:text-orange-600 disabled:opacity-50 transition-colors"
  aria-label="Refresh"
  >
  <RefreshCw className={`h-4 w-4 ${rateListLoading ? "animate-spin" : ""}`} />
  </button>
  </div>
  </div>
  <div className="flex-1 overflow-auto p-5">
  <ProductsRateTable
  rows={rateListRows}
  isLoading={rateListLoading}
  onSalePriceChange={handleRateListSalePriceChange}
  refetch={async () => {
  await refetchStockView();
  await fetchRateListRows();
  }}
  />
  </div>
 </div>
 )}

 <ProductHistoryModal
 isOpen={productHistoryOpen}
 onClose={() => setProductHistoryOpen(false)}
 initialSerial={productHistorySerial}
 />
 </div>
 );
}

"use client";

import React, { useState } from "react";
import {
 Search,
 ChevronLeft,
 ChevronRight,
 ChevronDown,
 Package,
 AlertTriangle,
 Plus,
 Settings,
} from "lucide-react";
import { useLowStocks } from "./hooks";
import { usePermissions } from "@/hooks/usePermissions";
import type { LowStockRow } from "./types";

export default function LowStocksPage() {
 const { can } = usePermissions();
 const canEditProduct = can("product.edit");
 const canAdjustStock = can("stock.adjust");
 const canManageInventorySettings =
 can("inventory.settings.manage") || can("settings.edit") || can("product.edit");

 const {
 rows,
 pagination,
 defaultThreshold,
 locations,
 categories,
 filters,
 setFilter,
 isLoading,
 message,
 lowStockCount,
 outOfStockCount,
 updateDefaultThreshold,
 updateProductThreshold,
 refresh,
 editModalOpen,
 productToEdit,
 openEditModal,
 setProductToEdit,
 closeEditModal,
 selectedProducts,
 selectAll,
 handleSelectAll,
 handleSelectProduct,
 updateStock,
 } = useLowStocks();

 const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
 const [showLocationDropdown, setShowLocationDropdown] = useState(false);
 const [editingDefaultThreshold, setEditingDefaultThreshold] = useState(false);
 const [defaultThresholdInput, setDefaultThresholdInput] = useState(String(defaultThreshold));
 const [editingProductId, setEditingProductId] = useState<string | null>(null);
 const [inlineThresholdValue, setInlineThresholdValue] = useState("");
 const [stockQuantity, setStockQuantity] = useState("");
 const [stockType, setStockType] = useState<"in" | "adjustment">("in");

 React.useEffect(() => {
 setDefaultThresholdInput(String(defaultThreshold));
 }, [defaultThreshold]);

 const handleSaveDefaultThreshold = () => {
 const v = parseInt(defaultThresholdInput, 10);
 if (!Number.isNaN(v) && v >= 0) {
 updateDefaultThreshold(v);
 setEditingDefaultThreshold(false);
 }
 };

 const handleSetProductThreshold = (row: LowStockRow) => {
 const v = parseInt(inlineThresholdValue, 10);
 if (!Number.isNaN(v) && v >= 0) {
 updateProductThreshold(row.productId, v);
 setEditingProductId(null);
 setInlineThresholdValue("");
 }
 };

 const handleResetProductThreshold = (row: LowStockRow) => {
 updateProductThreshold(row.productId, null);
 setEditingProductId(null);
 setInlineThresholdValue("");
 };

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 {message.text && (
 <div
  className={`fixed top-4 right-4 z-50 px-3 @[640px]:px-4 py-2 @[640px]:py-3 rounded-lg shadow-lg text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-green-100 text-green-700 border border-green-400"
  : "bg-red-100 text-red-700 border border-red-400"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="mb-4 @[640px]:mb-6">
 <h1 className="text-lg @[640px]:text-2xl font-semibold text-gray-900">Low Stocks</h1>
 <p className="text-[11px] @[640px]:text-base text-gray-600 mt-0.5 @[640px]:mt-1">
  {lowStockCount} low, {outOfStockCount} out of stock. Available stock from StockBalance and serial counts.
 </p>

 {/* Default threshold control */}
 <div className="mt-3 @[640px]:mt-4 flex flex-wrap items-center gap-2 @[640px]:gap-3">
  <span className="text-xs @[640px]:text-sm font-medium text-gray-700">Threshold:</span>
  {canManageInventorySettings && editingDefaultThreshold ? (
  <span className="flex items-center gap-2">
  <input
  type="number"
  min={0}
  value={defaultThresholdInput}
  onChange={(e) => setDefaultThresholdInput(e.target.value)}
  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
  />
  <button
  onClick={handleSaveDefaultThreshold}
  className="rounded bg-orange-500 px-3 py-1 text-sm text-white hover:bg-orange-600"
  >
  Save
  </button>
  <button
  onClick={() => setEditingDefaultThreshold(false)}
  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
  >
  Cancel
  </button>
  </span>
  ) : (
  <>
  <span className="rounded bg-gray-100 px-3 py-1 text-sm font-mono">{defaultThreshold}</span>
  {canManageInventorySettings && (
  <button
   onClick={() => setEditingDefaultThreshold(true)}
   className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
  >
   <Settings className="h-4 w-4" />
   Edit
  </button>
  )}
  </>
  )}
  <button
  onClick={refresh}
  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
  >
  Refresh
  </button>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 @[640px]:mb-6 p-3 @[640px]:p-4">
 <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3">
  <div className="relative flex-1 min-w-[160px] @[640px]:min-w-0 @[640px]:flex-initial">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 @[640px]:h-[18px] @[640px]:w-[18px]" />
  <input
  type="text"
  placeholder="Search name or SKU…"
  value={filters.q}
  onChange={(e) => setFilter("q", e.target.value)}
  className="pl-9 pr-3 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg text-xs @[640px]:text-sm w-full @[640px]:w-56 focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div className="relative">
  <button
  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg text-xs @[640px]:text-sm hover:bg-gray-50 whitespace-nowrap"
  >
  {filters.locationId
  ? locations.find((l) => l.value === filters.locationId)?.label ?? "Location"
  : "All locations"}
  <ChevronDown size={14} />
  </button>
  {showLocationDropdown && (
  <div className="absolute left-0 z-10 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 py-1">
  <button
   className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
   onClick={() => {
   setFilter("locationId", "");
   setShowLocationDropdown(false);
   }}
  >
   All locations
  </button>
  {locations.map((loc) => (
   <button
   key={loc.value}
   className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
   onClick={() => {
   setFilter("locationId", loc.value);
   setShowLocationDropdown(false);
   }}
   >
   {loc.label}
   </button>
  ))}
  </div>
  )}
  </div>
  <div className="relative">
  <button
  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 border border-gray-300 rounded-lg text-xs @[640px]:text-sm hover:bg-gray-50 whitespace-nowrap"
  >
  {filters.categoryId
  ? categories.find((c) => c.value === filters.categoryId)?.label ?? "Category"
  : "All categories"}
  <ChevronDown size={14} />
  </button>
  {showCategoryDropdown && (
  <div className="absolute left-0 z-10 mt-1 w-48 rounded-md bg-white shadow-lg border border-gray-200 py-1">
  <button
   className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
   onClick={() => {
   setFilter("categoryId", "");
   setShowCategoryDropdown(false);
   }}
  >
   All categories
  </button>
  {categories.map((cat) => (
   <button
   key={cat.value}
   className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
   onClick={() => {
   setFilter("categoryId", cat.value);
   setShowCategoryDropdown(false);
   }}
   >
   {cat.label}
   </button>
  ))}
  </div>
  )}
  </div>
  <input
  type="number"
  min={0}
  placeholder="Threshold override"
  value={filters.thresholdOverride ?? ""}
  onChange={(e) =>
  setFilter("thresholdOverride", e.target.value === "" ? null : parseInt(e.target.value, 10))
  }
  className="w-24 @[640px]:w-28 rounded border border-gray-300 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm"
  />
 </div>
 </div>

 {/* Table */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left">
   <input
   type="checkbox"
   checked={selectAll}
   onChange={handleSelectAll}
   className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
   />
  </th>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Product / SKU</th>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Available Qty</th>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Threshold</th>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Location</th>
  <th className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {isLoading ? (
  <tr>
   <td colSpan={7} className="px-3 @[640px]:px-4 py-8 @[640px]:py-12 text-center text-xs @[640px]:text-sm text-gray-500">
   <div className="flex items-center justify-center gap-2">
   <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
   Loading...
   </div>
   </td>
  </tr>
  ) : rows.length === 0 ? (
  <tr>
   <td colSpan={7} className="px-3 @[640px]:px-4 py-8 @[640px]:py-12 text-center text-xs @[640px]:text-sm text-gray-500">
   <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />
   <p>No low stock products found</p>
   </td>
  </tr>
  ) : (
  rows.map((row) => (
   <tr key={row.productId} className="hover:bg-gray-50">
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3">
   <input
   type="checkbox"
   checked={selectedProducts.includes(row.productId)}
   onChange={() => handleSelectProduct(row.productId)}
   className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
   />
   </td>
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3">
   <div>
   <p className="text-sm font-medium text-gray-900">{row.name}</p>
   <p className="text-xs text-gray-500">{row.sku}</p>
   {row.isSerialized && (
    <span className="text-xs text-blue-600">Serialized</span>
   )}
   </div>
   </td>
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm font-medium">
   <span className={row.availableQty === 0 ? "text-red-600" : "text-orange-600"}>
   {row.availableQty}
   </span>
   </td>
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700">
   {editingProductId === row.productId ? (
   <span className="flex items-center gap-1">
    <input
    type="number"
    min={0}
    value={inlineThresholdValue}
    onChange={(e) => setInlineThresholdValue(e.target.value)}
    className="w-16 rounded border border-gray-300 px-1 py-0.5 text-sm"
    />
    <button
    onClick={() => handleSetProductThreshold(row)}
    className="rounded bg-orange-500 px-2 py-0.5 text-xs text-white hover:bg-orange-600"
    >
    Set
    </button>
    <button
    onClick={() => handleResetProductThreshold(row)}
    className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-100"
    >
    Reset
    </button>
    <button
    onClick={() => {
    setEditingProductId(null);
    setInlineThresholdValue("");
    }}
    className="text-xs text-gray-500 hover:underline"
    >
    Cancel
    </button>
   </span>
   ) : (
   <span>
    {row.thresholdUsed}
    {row.lowStockThreshold != null && (
    <span className="text-xs text-gray-500 ml-1">(override)</span>
    )}
    {canEditProduct && (
    <button
    onClick={() => {
    setEditingProductId(row.productId);
    setInlineThresholdValue(String(row.effectiveThreshold));
    }}
    className="ml-1 text-xs text-blue-600 hover:underline"
    >
    Set
    </button>
    )}
   </span>
   )}
   </td>
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3">
   <span
   className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
    row.status === "out_of_stock"
    ? "bg-red-100 text-red-700"
    : "bg-orange-100 text-orange-700"
   }`}
   >
   {row.status === "out_of_stock" ? "Out of stock" : "Low"}
   </span>
   </td>
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">
   {filters.locationId
   ? locations.find((l) => l.value === filters.locationId)?.label ?? "—"
   : "All"}
   </td>
   <td className="px-2.5 @[640px]:px-4 py-2 @[640px]:py-3">
   {!row.isSerialized && canAdjustStock && (
   <button
    onClick={() => {
    const defaultLocationId =
    row.locationId ?? (filters.locationId || (locations[0]?.value ?? ""));
    setProductToEdit({
    _id: row.productId,
    name: row.name,
    sku: row.sku,
    quantity: row.availableQty,
    minStockLevel: row.thresholdUsed,
    locationId: defaultLocationId,
    } as any);
    openEditModal();
    }}
    className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
    title="Add stock"
   >
    <Plus className="h-4 w-4" />
   </button>
   )}
   </td>
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>

 {pagination.pages > 1 && (
  <div className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
  <span className="text-sm text-gray-600">
  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
  </span>
  <div className="flex gap-2">
  <button
  onClick={() => setFilter("page", pagination.page - 1)}
  disabled={pagination.page <= 1}
  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
  >
  <ChevronLeft className="h-4 w-4" />
  </button>
  <button
  onClick={() => setFilter("page", pagination.page + 1)}
  disabled={pagination.page >= pagination.pages}
  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
  >
  <ChevronRight className="h-4 w-4" />
  </button>
  </div>
  </div>
 )}
 </div>

 {/* Add stock modal (simplified: productToEdit may be partial) */}
 {editModalOpen && productToEdit && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Add stock</h3>
  <p className="text-sm text-gray-600 mb-2">
  Product: <span className="font-medium">{productToEdit.name}</span>
  </p>
  <p className="text-sm text-gray-600 mb-4">
  Current: <span className="font-medium text-orange-600">{productToEdit.quantity}</span> / Threshold:{" "}
  <span className="font-medium">{productToEdit.minStockLevel}</span>
  </p>
  <div className="mb-4 flex gap-4">
  <label className="flex items-center gap-2">
  <input
   type="radio"
   name="stockType"
   checked={stockType === "in"}
   onChange={() => setStockType("in")}
   className="text-orange-500"
  />
  <span className="text-sm">Add</span>
  </label>
  <label className="flex items-center gap-2">
  <input
   type="radio"
   name="stockType"
   checked={stockType === "adjustment"}
   onChange={() => setStockType("adjustment")}
   className="text-orange-500"
  />
  <span className="text-sm">Set exact</span>
  </label>
  </div>
  <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
  <select
  value={productToEdit.locationId ?? ""}
  onChange={(e) =>
   setProductToEdit((prev) => (prev ? { ...prev, locationId: e.target.value } : null))
  }
  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
  >
  <option value="">Select location</option>
  {locations.map((loc) => (
   <option key={loc.value} value={loc.value}>
   {loc.label}
   </option>
  ))}
  </select>
  {!productToEdit.locationId && (
  <p className="text-xs text-neutral-600 mt-1">Select a location so stock is updated correctly.</p>
  )}
  </div>
  <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">
  {stockType === "in" ? "Qty to add" : "New qty"}
  </label>
  <input
  type="number"
  min={0}
  value={stockQuantity}
  onChange={(e) => setStockQuantity(e.target.value)}
  className="w-full rounded border border-gray-300 px-3 py-2"
  />
  </div>
  <div className="flex justify-end gap-2">
  <button
  onClick={closeEditModal}
  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
  >
  Cancel
  </button>
  <button
  onClick={() => {
   const qty = parseInt(stockQuantity, 10);
   const locId = productToEdit.locationId;
   if (!Number.isNaN(qty) && qty >= 0 && locId) {
   updateStock(productToEdit._id, qty, stockType, locId);
   setStockQuantity("");
   }
  }}
  disabled={!stockQuantity || !productToEdit.locationId}
  className="rounded bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
  >
  Update
  </button>
  </div>
  </div>
 </div>
 )}
 </div>
 );
}

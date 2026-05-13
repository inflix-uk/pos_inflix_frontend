"use client";
import React, { useState } from "react";
import {
 Search,
 Edit,
 ChevronLeft,
 ChevronRight,
 FileText,
 RotateCcw,
 ChevronDown,
 Package,
 AlertTriangle,
 Calendar,
 Clock,
} from "lucide-react";
import Link from "next/link";
import { useExpiredProducts } from "./hooks";

export default function ExpiredProductsPage() {
 const {
 products,
 totalProducts,
 expiredCount,
 expiringSoonCount,
 categories,
 warehouses,
 stores,
 activeTab,
 handleTabChange,
 searchTerm,
 categoryFilter,
 warehouseFilter,
 storeFilter,
 handleSearch,
 handleCategoryFilter,
 handleWarehouseFilter,
 handleStoreFilter,
 currentPage,
 rowsPerPage,
 totalPages,
 handlePageChange,
 handleRowsPerPageChange,
 selectedProducts,
 selectAll,
 handleSelectAll,
 handleSelectProduct,
 isLoading,
 message,
 getDaysFromExpiry,
 } = useExpiredProducts();

 const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
 const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
 const [showStoreDropdown, setShowStoreDropdown] = useState(false);

 const formatPrice = (price: number) => {
 return new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: "GBP",
 }).format(price);
 };

 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleDateString("en-US", {
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 };

 const getExpiryStatus = (expiryDate: string) => {
 const days = getDaysFromExpiry(expiryDate);
 if (days < 0) {
 return {
 label: `Expired ${Math.abs(days)} days ago`,
 className: "bg-red-100 text-red-700",
 };
 } else if (days === 0) {
 return {
 label: "Expires today",
 className: "bg-red-100 text-red-700",
 };
 } else if (days <= 7) {
 return {
 label: `Expires in ${days} days`,
 className: "bg-orange-100 text-orange-700",
 };
 } else {
 return {
 label: `Expires in ${days} days`,
 className: "bg-yellow-100 text-yellow-700",
 };
 }
 };

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {/* Message Alert */}
 {message.text && (
 <div
  className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
  message.type === "success"
  ? "bg-green-100 text-green-700 border border-green-400"
  : "bg-red-100 text-red-700 border border-red-400"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center justify-between">
  <div>
  <h1 className="text-2xl font-semibold text-gray-900">Expired Products</h1>
  <p className="text-gray-600 mt-1">
  Products past or approaching expiry date ({expiredCount} expired, {expiringSoonCount} expiring soon)
  </p>
  </div>
  <div className="flex items-center gap-3">
  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
  <RotateCcw size={20} />
  </button>
  </div>
 </div>

 {/* Tabs */}
 <div className="mt-4 flex gap-2">
  <button
  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
  activeTab === "expired"
  ? "bg-red-500 text-white"
  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
  }`}
  onClick={() => handleTabChange("expired")}
  >
  <AlertTriangle size={16} />
  Expired ({expiredCount})
  </button>
  <button
  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
  activeTab === "expiringSoon"
  ? "bg-orange-500 text-white"
  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
  }`}
  onClick={() => handleTabChange("expiringSoon")}
  >
  <Clock size={16} />
  Expiring Soon ({expiringSoonCount})
  </button>
 </div>
 </div>

 {/* Filters and Search */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
 <div className="p-6">
  <div className="flex items-center justify-between">
  <div className="relative">
  <Search
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
  size={20}
  />
  <input
  type="text"
  placeholder="Search products..."
  value={searchTerm}
  onChange={(e) => handleSearch(e.target.value)}
  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
  />
  </div>

  <div className="flex items-center gap-3">
  {/* Category Filter */}
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
  >
   {categoryFilter
   ? categories.find((c) => c.value === categoryFilter)?.label
   : "All Categories"}
   <ChevronDown size={16} />
  </button>
  {showCategoryDropdown && (
   <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
   <div className="py-1">
   <button
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
    handleCategoryFilter("");
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
    handleCategoryFilter(category.value);
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

  {/* Warehouse Filter */}
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
  >
   {warehouseFilter
   ? warehouses.find((w) => w.value === warehouseFilter)?.label
   : "All Warehouses"}
   <ChevronDown size={16} />
  </button>
  {showWarehouseDropdown && (
   <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
   <div className="py-1">
   <button
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
    handleWarehouseFilter("");
    setShowWarehouseDropdown(false);
   }}
   >
   All Warehouses
   </button>
   {warehouses.map((warehouse) => (
   <button
    key={warehouse.value}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    onClick={() => {
    handleWarehouseFilter(warehouse.value);
    setShowWarehouseDropdown(false);
    }}
   >
    {warehouse.label}
   </button>
   ))}
   </div>
   </div>
  )}
  </div>

  {/* Store Filter */}
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowStoreDropdown(!showStoreDropdown)}
  >
   {storeFilter
   ? stores.find((s) => s.value === storeFilter)?.label
   : "All Stores"}
   <ChevronDown size={16} />
  </button>
  {showStoreDropdown && (
   <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
   <div className="py-1">
   <button
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => {
    handleStoreFilter("");
    setShowStoreDropdown(false);
   }}
   >
   All Stores
   </button>
   {stores.map((store) => (
   <button
    key={store.value}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
    onClick={() => {
    handleStoreFilter(store.value);
    setShowStoreDropdown(false);
    }}
   >
    {store.label}
   </button>
   ))}
   </div>
   </div>
  )}
  </div>
  </div>
  </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-3 text-left">
   <input
   type="checkbox"
   checked={selectAll}
   onChange={handleSelectAll}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
   />
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Product
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   SKU
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Category
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Warehouse
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Quantity
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Expiry Date
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Actions
  </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
  {isLoading ? (
  <tr>
   <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
   <div className="flex items-center justify-center gap-2">
   <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
   Loading products...
   </div>
   </td>
  </tr>
  ) : products.length === 0 ? (
  <tr>
   <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
   <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
   <p>No {activeTab === "expired" ? "expired" : "expiring soon"} products found</p>
   </td>
  </tr>
  ) : (
  products.map((product) => {
   const expiryStatus = getExpiryStatus(product.expiryDate);
   return (
   <tr key={product._id} className="hover:bg-gray-50">
   <td className="px-6 py-4 whitespace-nowrap">
   <input
    type="checkbox"
    checked={selectedProducts.includes(product._id)}
    onChange={() => handleSelectProduct(product._id)}
    className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
   />
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
    {product.image ? (
    <img
    src={product.image}
    alt={product.name}
    className="w-full h-full object-cover"
    />
    ) : (
    <Package size={20} className="text-gray-400" />
    )}
    </div>
    <div>
    <p className="text-sm font-medium text-gray-900">{product.name}</p>
    <p className="text-xs text-gray-500">{formatPrice(product.sellingPrice)}</p>
    </div>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {product.sku}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
   {product.category?.name || "-"}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
   {product.warehouse?.name || "-"}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
   {product.quantity}
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
    <Calendar size={14} className="text-gray-400" />
    <span className="text-sm text-gray-900">{formatDate(product.expiryDate)}</span>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${expiryStatus.className}`}
   >
    {expiryStatus.label}
   </span>
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
    <Link
    href={`/edit-product/${product._id}`}
    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
    title="Edit Product"
    >
    <Edit size={16} />
    </Link>
   </div>
   </td>
   </tr>
   );
  })
  )}
  </tbody>
  </table>
 </div>

 {/* Pagination */}
 <div className="px-6 py-4 border-t border-gray-200">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
  <span className="text-sm text-gray-700">Rows per page</span>
  <select
  value={rowsPerPage}
  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-300 rounded px-3 py-1 text-sm"
  >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={20}>20</option>
  <option value={50}>50</option>
  </select>
  <span className="text-sm text-gray-500 ml-4">
  Showing {products.length} of {totalProducts}
  </span>
  </div>

  <div className="flex items-center gap-2">
  <button
  onClick={() => handlePageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronLeft size={16} />
  </button>

  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
  const pageNumber = index + 1;
  return (
   <button
   key={pageNumber}
   onClick={() => handlePageChange(pageNumber)}
   className={`w-8 h-8 rounded-lg text-sm font-medium ${
   currentPage === pageNumber
   ? "bg-orange-500 text-white"
   : "text-gray-600 hover:bg-gray-100"
   }`}
   >
   {pageNumber}
   </button>
  );
  })}

  {totalPages > 5 && <span className="text-gray-400">...</span>}

  <button
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages || totalPages === 0}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronRight size={16} />
  </button>
  </div>
  </div>
 </div>
 </div>
 </div>
 );
}

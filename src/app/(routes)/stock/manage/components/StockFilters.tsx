"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface StockFiltersProps {
 searchTerm: string;
 selectedWarehouse: string;
 selectedStore: string;
 selectedProduct: string;
 showWarehouseDropdown: boolean;
 showStoreDropdown: boolean;
 showProductDropdown: boolean;
 warehouses: string[];
 stores: string[];
 products: string[];
 onSearchChange: (value: string) => void;
 onWarehouseChange: (value: string) => void;
 onStoreChange: (value: string) => void;
 onProductChange: (value: string) => void;
 onToggleWarehouseDropdown: () => void;
 onToggleStoreDropdown: () => void;
 onToggleProductDropdown: () => void;
}

export const StockFilters: React.FC<StockFiltersProps> = ({
 searchTerm,
 selectedWarehouse,
 selectedStore,
 selectedProduct,
 showWarehouseDropdown,
 showStoreDropdown,
 showProductDropdown,
 warehouses,
 stores,
 products,
 onSearchChange,
 onWarehouseChange,
 onStoreChange,
 onProductChange,
 onToggleWarehouseDropdown,
 onToggleStoreDropdown,
 onToggleProductDropdown,
}) => {
 return (
 <div className="flex items-center justify-between">
 <div className="relative">
 <Search
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
  size={20}
 />
 <input
  type="text"
  placeholder="Search"
  value={searchTerm}
  onChange={(e) => onSearchChange(e.target.value)}
  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
 />
 </div>
 <div className="flex items-center gap-3">
 {/* Warehouse Dropdown */}
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={onToggleWarehouseDropdown}
  >
  {selectedWarehouse === "All" ? "Warehouse" : selectedWarehouse}
  <ChevronDown size={16} />
  </button>
  {showWarehouseDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
  {warehouses.map((warehouse) => (
   <button
   key={warehouse}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => onWarehouseChange(warehouse)}
   >
   {warehouse}
   </button>
  ))}
  </div>
  </div>
  )}
 </div>

 {/* Store Dropdown */}
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={onToggleStoreDropdown}
  >
  {selectedStore === "All" ? "Store" : selectedStore}
  <ChevronDown size={16} />
  </button>
  {showStoreDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
  <div className="py-1">
  {stores.map((store) => (
   <button
   key={store}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => onStoreChange(store)}
   >
   {store}
   </button>
  ))}
  </div>
  </div>
  )}
 </div>

 {/* Product Dropdown */}
 <div className="relative">
  <button
  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  onClick={onToggleProductDropdown}
  >
  {selectedProduct === "All" ? "Product" : selectedProduct}
  <ChevronDown size={16} />
  </button>
  {showProductDropdown && (
  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto">
  <div className="py-1">
  {products.map((product) => (
   <button
   key={product}
   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
   onClick={() => onProductChange(product)}
   >
   {product}
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

"use client";

import React from "react";
import { Tag, Hash, Barcode, FileText, FolderTree, Building2, Warehouse, Package, ChevronDown } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import DescriptionEditor from "./DescriptionEditor";
import { ProductFormData, SelectOption } from "../types";

const inputClass =
 "block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const gridClass = "grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-3 gap-6";

interface ProductInformationProps {
 formData: ProductFormData;
 updateFormData: (data: Partial<ProductFormData>) => void;
 generateSlug: (name: string) => void;
 generateSku: () => void;
 generateBarcode: () => void;
 categories: SelectOption[];
 subCategories: SelectOption[];
 brands: SelectOption[];
 stores: SelectOption[];
 warehouses: SelectOption[];
 units: SelectOption[];
 onAddStore: () => void;
 onAddWarehouse: () => void;
 onAddCategory: () => void;
 onAddSubCategory: () => void;
 onAddUnit: () => void;
 onAddBrand: () => void;
 onRefreshStores: () => void;
 onRefreshWarehouses: () => void;
 onRefreshCategories: () => void;
 onRefreshSubCategories: (categoryId?: string) => void;
 onRefreshUnits: () => void;
 onRefreshBrands: () => void;
 isExpanded?: boolean;
 onToggle?: () => void;
}

export default function ProductInformation({
 formData,
 updateFormData,
 generateSlug,
 generateSku,
 generateBarcode,
 categories,
 subCategories,
 brands,
 stores,
 warehouses,
 units,
 onAddStore,
 onAddWarehouse,
 onAddCategory,
 onAddSubCategory,
 onAddUnit,
 onAddBrand,
 onRefreshStores,
 onRefreshWarehouses,
 onRefreshCategories,
 onRefreshSubCategories,
 onRefreshUnits,
 onRefreshBrands,
}: ProductInformationProps) {
 return (
 <>
 <div className={gridClass}>
 <div>
  <label className={labelClass}>PRODUCT NAME <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Tag className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  value={formData.productName}
  onChange={(e) => generateSlug(e.target.value)}
  placeholder="Enter product name"
  className={inputClass}
  />
  </div>
 </div>

 <div>
  <label className={labelClass}>SKU <span className="text-red-500">*</span></label>
  <div className="flex gap-2">
  <div className="relative flex-1">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Hash className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  value={formData.sku}
  onChange={(e) => updateFormData({ sku: e.target.value })}
  placeholder="SKU"
  className={inputClass}
  />
  </div>
  <button
  type="button"
  onClick={generateSku}
  className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
  >
  Generate
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>BARCODE <span className="text-red-500">*</span></label>
  <div className="flex gap-2">
  <div className="relative flex-1">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Barcode className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  value={formData.itemBarcode}
  onChange={(e) => updateFormData({ itemBarcode: e.target.value })}
  placeholder="Barcode"
  className={inputClass}
  />
  </div>
  <button
  type="button"
  onClick={generateBarcode}
  className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
  >
  Generate
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>SLUG</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <FileText className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  value={formData.slug}
  onChange={(e) => updateFormData({ slug: e.target.value })}
  placeholder="url-slug"
  className={inputClass}
  />
  </div>
 </div>

 <div>
  <label className={labelClass}>CATEGORY <span className="text-red-500">*</span></label>
  <div className="flex gap-2 items-center">
  <div className="flex-1">
  <SearchableSelect
  value={formData.category}
  onChange={(value) => updateFormData({ category: value, subCategory: "" })}
  options={categories}
  placeholder="Select category"
  onFocus={onRefreshCategories}
  icon={<Tag className="h-5 w-5 text-gray-400" />}
  />
  </div>
  <button
  type="button"
  onClick={onAddCategory}
  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
  title="Add category"
  >
  <FolderTree className="h-5 w-5" />
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>SUB CATEGORY <span className="text-red-500">*</span></label>
  <div className="flex gap-2 items-center">
  <div className="flex-1">
  <SearchableSelect
  value={formData.subCategory}
  onChange={(value) => updateFormData({ subCategory: value })}
  options={subCategories}
  placeholder="Select sub category"
  onFocus={() => onRefreshSubCategories(formData.category)}
  icon={<FolderTree className="h-5 w-5 text-gray-400" />}
  />
  </div>
  <button
  type="button"
  onClick={onAddSubCategory}
  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
  title="Add sub category"
  >
  <FolderTree className="h-5 w-5" />
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>BRAND <span className="text-red-500">*</span></label>
  <div className="flex gap-2 items-center">
  <div className="flex-1">
  <SearchableSelect
  value={formData.brand}
  onChange={(value) => updateFormData({ brand: value })}
  options={brands}
  placeholder="Select brand"
  onFocus={onRefreshBrands}
  icon={<Package className="h-5 w-5 text-gray-400" />}
  />
  </div>
  <button
  type="button"
  onClick={onAddBrand}
  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
  title="Add brand"
  >
  <Package className="h-5 w-5" />
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>STORE <span className="text-red-500">*</span></label>
  <div className="flex gap-2 items-center">
  <div className="flex-1">
  <SearchableSelect
  value={formData.store}
  onChange={(value) => updateFormData({ store: value })}
  options={stores}
  placeholder="Select store"
  onFocus={onRefreshStores}
  icon={<Building2 className="h-5 w-5 text-gray-400" />}
  />
  </div>
  <button
  type="button"
  onClick={onAddStore}
  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
  title="Add store"
  >
  <Building2 className="h-5 w-5" />
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>WAREHOUSE <span className="text-red-500">*</span></label>
  <div className="flex gap-2 items-center">
  <div className="flex-1">
  <SearchableSelect
  value={formData.warehouse}
  onChange={(value) => updateFormData({ warehouse: value })}
  options={warehouses}
  placeholder="Select warehouse"
  onFocus={onRefreshWarehouses}
  icon={<Warehouse className="h-5 w-5 text-gray-400" />}
  />
  </div>
  <button
  type="button"
  onClick={onAddWarehouse}
  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
  title="Add warehouse"
  >
  <Warehouse className="h-5 w-5" />
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>UNIT <span className="text-red-500">*</span></label>
  <div className="flex gap-2 items-center">
  <div className="flex-1">
  <SearchableSelect
  value={formData.unit}
  onChange={(value) => updateFormData({ unit: value })}
  options={units}
  placeholder="Select unit"
  onFocus={onRefreshUnits}
  icon={<Package className="h-5 w-5 text-gray-400" />}
  />
  </div>
  <button
  type="button"
  onClick={onAddUnit}
  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
  title="Add unit"
  >
  <Package className="h-5 w-5" />
  </button>
  </div>
 </div>

 <div>
  <label className={labelClass}>SELLING TYPE <span className="text-red-500">*</span></label>
  <div className="relative">
  <select
  value={formData.sellingType}
  onChange={(e) => updateFormData({ sellingType: e.target.value })}
  className={`${inputClass} appearance-none pr-10`}
  >
  <option value="retail">Retail</option>
  <option value="wholesale">Wholesale</option>
  <option value="both">Both</option>
  </select>
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
  </div>
 </div>

 <div>
  <label className={labelClass}>BARCODE SYMBOLOGY</label>
  <div className="relative">
  <select
  value={formData.barcodeSymbology}
  onChange={(e) => updateFormData({ barcodeSymbology: e.target.value })}
  className={`${inputClass} appearance-none pr-10`}
  >
  <option value="code128">Code 128</option>
  <option value="ean13">EAN-13</option>
  <option value="upc">UPC</option>
  </select>
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
  </div>
 </div>
 </div>

 <div className="mt-6">
 <DescriptionEditor
  value={formData.description}
  onChange={(value) => updateFormData({ description: value })}
 />
 </div>
 </>
 );
}

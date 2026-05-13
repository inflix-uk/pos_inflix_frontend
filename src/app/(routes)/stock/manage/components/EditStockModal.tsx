"use client";
import React, { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

export interface ProductInfo {
 name: string;
 sku: string;
 category: string;
 icon: string;
 qty: number;
}

export interface EditStockForm {
 warehouse: string;
 store: string;
 person: string;
 product: string;
 qty: number;
}

interface EditStockModalProps {
 open: boolean;
 onClose: () => void;
 onSave: (stock: EditStockForm) => void;
 stock: EditStockForm | null;
 warehouses: string[];
 stores: string[];
 people: string[];
 products: ProductInfo[];
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
 open,
 onClose,
 onSave,
 stock,
 warehouses,
 stores,
 people,
 products,
}) => {
 const [form, setForm] = useState<EditStockForm>({
 warehouse: "",
 store: "",
 person: "",
 product: "",
 qty: 1,
 });
 const [productSearch, setProductSearch] = useState("");
 const [filteredProducts, setFilteredProducts] =
 useState<ProductInfo[]>(products);

 useEffect(() => {
 if (open && stock) {
 setForm(stock);
 setProductSearch(stock.product);
 }
 }, [open, stock]);

 useEffect(() => {
 setFilteredProducts(
 products.filter((p) =>
 p.name.toLowerCase().includes(productSearch.toLowerCase())
 )
 );
 }, [productSearch, products]);

 const selectedProduct = products.find((p) => p.name === form.product);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
 <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-2 p-8 relative">
 <button
  className="absolute top-4 right-4 text-red-500 hover:bg-red-100 rounded-full p-1"
  onClick={onClose}
 >
  <span className="sr-only">Close</span>
  <svg
  width={20}
  height={20}
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
  >
  <path
  strokeLinecap="round"
  strokeLinejoin="round"
  strokeWidth={2}
  d="M6 18L18 6M6 6l12 12"
  />
  </svg>
 </button>
 <h2 className="text-2xl font-semibold mb-6">Edit Stock</h2>
 <form
  onSubmit={(e) => {
  e.preventDefault();
  if (!form.warehouse || !form.store || !form.person || !form.product)
  return;
  onSave(form);
  }}
  className="space-y-5"
 >
  <div>
  <label className="block text-base font-medium mb-1">
  Warehouse <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.warehouse}
  onChange={(e) =>
  setForm((f) => ({ ...f, warehouse: e.target.value }))
  }
  required
  >
  <option value="">Select</option>
  {warehouses.map((w) => (
  <option key={w} value={w}>
   {w}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-base font-medium mb-1">
  Store <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.store}
  onChange={(e) =>
  setForm((f) => ({ ...f, store: e.target.value }))
  }
  required
  >
  <option value="">Select</option>
  {stores.map((s) => (
  <option key={s} value={s}>
   {s}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-base font-medium mb-1">
  Responsible Person <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.person}
  onChange={(e) =>
  setForm((f) => ({ ...f, person: e.target.value }))
  }
  required
  >
  <option value="">Select</option>
  {people.map((p) => (
  <option key={p} value={p}>
   {p}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-base font-medium mb-1">
  Product <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <input
  type="text"
  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10"
  placeholder="Search Product"
  value={productSearch}
  onChange={(e) => setProductSearch(e.target.value)}
  autoComplete="off"
  />
  {productSearch && (
  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
   {filteredProducts.length === 0 ? (
   <div className="px-4 py-2 text-gray-500">
   No products found
   </div>
   ) : (
   filteredProducts.map((p) => (
   <button
   type="button"
   key={p.sku}
   className="block w-full text-left px-4 py-2 hover:bg-gray-100"
   onClick={() => {
    setForm((f) => ({
    ...f,
    product: p.name,
    qty: p.qty,
    }));
    setProductSearch(p.name);
   }}
   >
   {p.name}
   </button>
   ))
   )}
  </div>
  )}
  </div>
  <input type="hidden" value={form.product} required readOnly />
  </div>
  {/* Product Table */}
  {selectedProduct && (
  <div className="bg-gray-50 rounded-lg p-4 mt-4">
  <table className="w-full">
  <thead>
   <tr className="bg-gray-100">
   <th className="px-4 py-2 text-left text-gray-700 font-medium">
   Product
   </th>
   <th className="px-4 py-2 text-left text-gray-700 font-medium">
   SKU
   </th>
   <th className="px-4 py-2 text-left text-gray-700 font-medium">
   Category
   </th>
   <th className="px-4 py-2 text-left text-gray-700 font-medium">
   Qty
   </th>
   </tr>
  </thead>
  <tbody>
   <tr>
   <td className="px-4 py-3">
   <div className="flex items-center gap-2">
   <span className="inline-block text-2xl align-middle bg-gray-100 rounded p-1">
    {selectedProduct.icon}
   </span>
   <span className="text-sm font-medium text-gray-900">
    {selectedProduct.name}
   </span>
   </div>
   </td>
   <td className="px-4 py-3 text-sm text-gray-700">
   {selectedProduct.sku}
   </td>
   <td className="px-4 py-3 text-sm text-gray-700">
   {selectedProduct.category}
   </td>
   <td className="px-4 py-3">
   <div className="flex items-center gap-2">
   <button
    type="button"
    className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
    onClick={() =>
    setForm((f) => ({
    ...f,
    qty: Math.max(1, f.qty - 1),
    }))
    }
   >
    <Minus size={16} />
   </button>
   <span className="w-8 text-center text-base font-semibold">
    {form.qty}
   </span>
   <button
    type="button"
    className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
    onClick={() =>
    setForm((f) => ({ ...f, qty: f.qty + 1 }))
    }
   >
    <Plus size={16} />
   </button>
   </div>
   <div className="h-1 bg-orange-200 rounded mt-2">
   <div
    className="h-1 bg-orange-400 rounded"
    style={{
    width: `${Math.min(
    100,
    (form.qty / (selectedProduct.qty || 1)) * 100
    )}%`,
    }}
   />
   </div>
   </td>
   </tr>
  </tbody>
  </table>
  </div>
  )}
  <div className="flex justify-end gap-3 mt-8">
  <button
  type="button"
  className="px-6 py-2 rounded-md bg-[#0a2342] text-white hover:bg-[#16335b] font-medium"
  onClick={onClose}
  >
  Cancel
  </button>
  <button
  type="submit"
  className="px-6 py-2 rounded-md bg-orange-400 text-white hover:bg-orange-500 font-medium"
  >
  Save Changes
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

export default EditStockModal;

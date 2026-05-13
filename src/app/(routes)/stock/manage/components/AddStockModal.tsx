"use client";
import React, { useState, useEffect } from "react";

export interface StockForm {
 warehouse: string;
 store: string;
 person: string;
 product: string;
}

interface AddStockModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (stock: StockForm) => void;
 warehouses: string[];
 stores: string[];
 people: string[];
 products: string[];
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
 open,
 onClose,
 onAdd,
 warehouses,
 stores,
 people,
 products,
}) => {
 const [form, setForm] = useState<StockForm>({
 warehouse: "",
 store: "",
 person: "",
 product: "",
 });
 const [productSearch, setProductSearch] = useState("");
 const [filteredProducts, setFilteredProducts] = useState<string[]>(products);

 useEffect(() => {
 if (open) {
 setForm({ warehouse: "", store: "", person: "", product: "" });
 setProductSearch("");
 setFilteredProducts(products);
 }
 }, [open, products]);

 useEffect(() => {
 setFilteredProducts(
 products.filter((p) =>
 p.toLowerCase().includes(productSearch.toLowerCase())
 )
 );
 }, [productSearch, products]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
 <div className="bg-white rounded-xl shadow-lg w-full max-w-xl mx-2 p-8 relative">
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
 <h2 className="text-2xl font-semibold mb-6">Add Stock</h2>
 <form
  onSubmit={(e) => {
  e.preventDefault();
  if (!form.warehouse || !form.store || !form.person || !form.product)
  return;
  onAdd(form);
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
  onFocus={() => setProductSearch("")}
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
   key={p}
   className="block w-full text-left px-4 py-2 hover:bg-gray-100"
   onClick={() => {
    setForm((f) => ({ ...f, product: p }));
    setProductSearch(p);
   }}
   >
   {p}
   </button>
   ))
   )}
  </div>
  )}
  </div>
  <input type="hidden" value={form.product} required readOnly />
  </div>
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
  Add Stock
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

export default AddStockModal;

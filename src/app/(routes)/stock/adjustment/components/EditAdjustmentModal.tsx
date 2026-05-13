"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Minus, Plus, Search, X } from "lucide-react";

export interface ProductInfo {
 name: string;
 sku: string;
 category: string;
 icon: string;
 qty: number;
}

export interface EditAdjustmentForm {
 product: string;
 warehouse: string;
 reference: string;
 store: string;
 person: string;
 notes: string;
 qty: number;
}

interface EditAdjustmentModalProps {
 open: boolean;
 onClose: () => void;
 onSave: (adj: EditAdjustmentForm) => void;
 adjustment: EditAdjustmentForm | null;
 warehouses: string[];
 stores: string[];
 people: string[];
 products: ProductInfo[];
}

export const EditAdjustmentModal: React.FC<EditAdjustmentModalProps> = ({
 open,
 onClose,
 onSave,
 adjustment,
 warehouses,
 stores,
 people,
 products,
}) => {
 const [form, setForm] = useState<EditAdjustmentForm>({
 product: "",
 warehouse: "",
 reference: "",
 store: "",
 person: "",
 notes: "",
 qty: 1,
 });

 const [productSearch, setProductSearch] = useState("");
 const [filteredProducts, setFilteredProducts] =
 useState<ProductInfo[]>(products);

 useEffect(() => {
 if (open && adjustment) {
 setForm(adjustment);
 setProductSearch(adjustment.product);
 }
 }, [open, adjustment]);

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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
 <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 relative">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">
  Edit Adjustment
  </h2>
  <button
  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
  onClick={onClose}
  >
  <X size={16} />
  </button>
 </div>

 <div className="p-6">
  <form
  onSubmit={(e) => {
  e.preventDefault();
  if (
  !form.product ||
  !form.warehouse ||
  !form.reference ||
  !form.store ||
  !form.person ||
  !form.notes
  )
  return;
  onSave(form);
  }}
  className="space-y-6"
  >
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Product <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Search className="h-4 w-4 text-gray-400" />
  </div>
  <input
   type="text"
   className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
   placeholder="Search Product"
   value={productSearch}
   onChange={(e) => setProductSearch(e.target.value)}
   autoComplete="off"
   required
  />
  {productSearch && (
   <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
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

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   Warehouse <span className="text-red-500">*</span>
  </label>
  <select
   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  <label className="block text-sm font-medium text-gray-700 mb-2">
   Reference Number <span className="text-red-500">*</span>
  </label>
  <input
   type="text"
   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
   value={form.reference}
   onChange={(e) =>
   setForm((f) => ({ ...f, reference: e.target.value }))
   }
   required
  />
  </div>
  </div>

  {selectedProduct && (
  <div className="border border-gray-200 rounded-md overflow-hidden">
  <table className="w-full">
   <thead className="bg-gray-50">
   <tr>
   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Product
   </th>
   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   SKU
   </th>
   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Category
   </th>
   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Qty
   </th>
   </tr>
   </thead>
   <tbody className="bg-white">
   <tr>
   <td className="px-4 py-4">
   <div className="flex items-center">
    <div className="flex-shrink-0 h-8 w-8">
    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-sm">
    {selectedProduct.icon}
    </div>
    </div>
    <div className="ml-3">
    <div className="text-sm font-medium text-gray-900">
    {selectedProduct.name}
    </div>
    </div>
   </div>
   </td>
   <td className="px-4 py-4 text-sm text-gray-500">
   {selectedProduct.sku}
   </td>
   <td className="px-4 py-4 text-sm text-gray-500">
   {selectedProduct.category}
   </td>
   <td className="px-4 py-4">
   <div className="flex items-center space-x-2">
    <button
    type="button"
    className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
    onClick={() =>
    setForm((f) => ({
    ...f,
    qty: Math.max(1, f.qty - 1),
    }))
    }
    >
    <Minus size={12} />
    </button>
    <span className="w-8 text-center text-sm font-medium">
    {form.qty}
    </span>
    <button
    type="button"
    className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
    onClick={() =>
    setForm((f) => ({ ...f, qty: f.qty + 1 }))
    }
    >
    <Plus size={12} />
    </button>
   </div>
   <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
    <div
    className="bg-orange-400 h-1 rounded-full transition-all duration-300"
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

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Store <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Responsible Person <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Notes <span className="text-red-500">*</span>
  </label>
  <textarea
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
  rows={4}
  value={form.notes}
  onChange={(e) =>
   setForm((f) => ({ ...f, notes: e.target.value }))
  }
  placeholder="The Jordan brand is owned by Nike (owned by the Knight family), as, at the time, the company was building its strategy to work with..."
  required
  />
  </div>

  <div className="flex justify-end space-x-3 pt-4">
  <button
  type="button"
  className="px-6 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
  onClick={onClose}
  >
  Cancel
  </button>
  <button
  type="submit"
  className="px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
  >
  Save Changes
  </button>
  </div>
  </form>
 </div>
 </div>
 </div>
 );
};

export default EditAdjustmentModal;

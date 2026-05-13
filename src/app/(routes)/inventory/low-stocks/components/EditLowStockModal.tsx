"use client";
import React, { useState, useEffect } from "react";
import { X, LucideIcon } from "lucide-react";

export interface LowStockProduct {
 warehouse: string;
 store: string;
 name: string;
 icon: LucideIcon;
 iconColor: string;
 category: string;
 sku: string;
 qty: number;
 qtyAlert: number;
}

interface EditLowStockModalProps {
 open: boolean;
 onClose: () => void;
 product: LowStockProduct | null;
 onSave: (updated: LowStockProduct) => void;
 warehouses: string[];
 stores: string[];
 categories: string[];
}

const EditLowStockModal: React.FC<EditLowStockModalProps> = ({
 open,
 onClose,
 product,
 onSave,
 warehouses,
 stores,
 categories,
}) => {
 const [form, setForm] = useState<LowStockProduct | null>(null);

 useEffect(() => {
 setForm(product);
 }, [product]);

 if (!open || !form) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
 <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-2 p-8 relative">
 <button
  className="absolute top-4 right-4 text-red-500 hover:bg-red-100 rounded-full p-1"
  onClick={onClose}
 >
  <span className="sr-only">Close</span>
  <X size={24} />
 </button>
 <h2 className="text-xl font-semibold mb-6 text-center">
  Edit Low Stocks
 </h2>
 <form
  onSubmit={(e) => {
  e.preventDefault();
  if (form) onSave(form);
  }}
 >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
  <label className="block text-sm font-medium mb-1">
  Warehouse <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.warehouse}
  onChange={(e) =>
   setForm((f) => f && { ...f, warehouse: e.target.value })
  }
  required
  >
  {warehouses.map((w) => (
   <option key={w} value={w}>
   {w}
   </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Store <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.store}
  onChange={(e) =>
   setForm((f) => f && { ...f, store: e.target.value })
  }
  required
  >
  {stores.map((s) => (
   <option key={s} value={s}>
   {s}
   </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  SKU <span className="text-red-500">*</span>
  </label>
  <input
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.sku}
  onChange={(e) =>
   setForm((f) => f && { ...f, sku: e.target.value })
  }
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Category <span className="text-red-500">*</span>
  </label>
  <select
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.category}
  onChange={(e) =>
   setForm((f) => f && { ...f, category: e.target.value })
  }
  required
  >
  {categories.map((c) => (
   <option key={c} value={c}>
   {c}
   </option>
  ))}
  </select>
  </div>
  <div className="md:col-span-2">
  <label className="block text-sm font-medium mb-1">
  Product Name <span className="text-red-500">*</span>
  </label>
  <input
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.name}
  onChange={(e) =>
   setForm((f) => f && { ...f, name: e.target.value })
  }
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Qty <span className="text-red-500">*</span>
  </label>
  <input
  type="number"
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.qty}
  onChange={(e) =>
   setForm((f) => f && { ...f, qty: Number(e.target.value) })
  }
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Qty Alert <span className="text-red-500">*</span>
  </label>
  <input
  type="number"
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.qtyAlert}
  onChange={(e) =>
   setForm(
   (f) => f && { ...f, qtyAlert: Number(e.target.value) }
   )
  }
  required
  />
  </div>
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
  Save Changes
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

export default EditLowStockModal;

"use client";
import React, { useState, useEffect } from "react";

export type Product = {
 sku: string;
 name: string;
 manufactured: string;
 expired: string;
};

interface EditExpiredProductModalProps {
 open: boolean;
 onClose: () => void;
 product: Product | null;
 onSave: (updated: Product) => void;
}

const EditExpiredProductModal: React.FC<EditExpiredProductModalProps> = ({
 open,
 onClose,
 product,
 onSave,
}) => {
 const [form, setForm] = useState<Product>({
 sku: "",
 name: "",
 manufactured: "",
 expired: "",
 });

 useEffect(() => {
 if (product) {
 setForm(product);
 }
 }, [product]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
 <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 p-6 relative">
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
 <h2 className="text-xl font-semibold mb-6">Edit Expired Product</h2>
 <form
  onSubmit={(e) => {
  e.preventDefault();
  onSave(form);
  }}
  className="space-y-4"
 >
  <div>
  <label className="block text-sm font-medium mb-1">
  SKU <span className="text-red-500">*</span>
  </label>
  <input
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.sku}
  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Product Name <span className="text-red-500">*</span>
  </label>
  <input
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={form.name}
  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Manufacturer Date <span className="text-red-500">*</span>
  </label>
  <input
  type="date"
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={
  form.manufactured
   ? new Date(form.manufactured).toISOString().slice(0, 10)
   : ""
  }
  onChange={(e) =>
  setForm((f) => ({ ...f, manufactured: e.target.value }))
  }
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium mb-1">
  Expiry Date <span className="text-red-500">*</span>
  </label>
  <input
  type="date"
  className="w-full border border-gray-300 rounded-md px-3 py-2"
  value={
  form.expired
   ? new Date(form.expired).toISOString().slice(0, 10)
   : ""
  }
  onChange={(e) =>
  setForm((f) => ({ ...f, expired: e.target.value }))
  }
  required
  />
  </div>
  <div className="flex justify-end gap-2 mt-6">
  <button
  type="button"
  className="px-5 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"
  onClick={onClose}
  >
  Cancel
  </button>
  <button
  type="submit"
  className="px-5 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600"
  >
  Save Changes
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

export default EditExpiredProductModal;

"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Calendar, ChevronDown } from "lucide-react";
import { PurchaseFormData, PurchaseItem } from "../types";

interface AddPurchaseModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: PurchaseFormData) => void;
 isLoading: boolean;
}

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
}) => {
 const [formData, setFormData] = useState<PurchaseFormData>({
 supplierName: "",
 reference: "",
 date: new Date().toISOString().split("T")[0],
 status: "Pending",
 items: [],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 description: "",
 });

 const [productInput, setProductInput] = useState("");

 const suppliers = [
 "Electro Mart",
 "Quantum Gadgets",
 "Prime Bazaar",
 "Gadget World",
 "Volt Vault",
 ];

 const products = [
 "iPhone 15 Pro",
 "Samsung Galaxy S24",
 "MacBook Pro",
 "Dell XPS 15",
 "Sony Headphones",
 ];

 const handleChange = (field: keyof PurchaseFormData, value: string | number) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 };

 const addItem = () => {
 if (!productInput.trim()) return;
 const newItem: PurchaseItem = {
 id: Date.now().toString(),
 product: productInput,
 qty: 1,
 purchasePrice: 0,
 discount: 0,
 tax: 0,
 taxAmount: 0,
 unitCost: 0,
 totalCost: 0,
 };
 setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
 setProductInput("");
 };

 const updateItem = (id: string, field: keyof PurchaseItem, value: number) => {
 setFormData((prev) => ({
 ...prev,
 items: prev.items.map((item) => {
 if (item.id === id) {
  const updated = { ...item, [field]: value };
  const subtotal = updated.qty * updated.purchasePrice;
  const discountAmount = (subtotal * updated.discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  updated.taxAmount = (afterDiscount * updated.tax) / 100;
  updated.unitCost = updated.purchasePrice;
  updated.totalCost = afterDiscount + updated.taxAmount;
  return updated;
 }
 return item;
 }),
 }));
 };

 const removeItem = (id: string) => {
 setFormData((prev) => ({
 ...prev,
 items: prev.items.filter((item) => item.id !== id),
 }));
 };

 const calculateTotal = () => {
 const subtotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);
 return subtotal + formData.orderTax + formData.shipping - formData.discount;
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 onAdd(formData);
 };

 if (!open) return null;

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-800">Add Purchase</h2>
  <button
  onClick={onClose}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
  <X size={20} className="text-gray-500" />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6">
  {/* Supplier, Date, Reference */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  SUPPLIER NAME <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <select
   value={formData.supplierName}
   onChange={(e) => handleChange("supplierName", e.target.value)}
   className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
   required
  >
   <option value="">Select Supplier</option>
   {suppliers.map((supplier) => (
   <option key={supplier} value={supplier}>
   {supplier}
   </option>
   ))}
  </select>
  <ChevronDown
   size={18}
   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  DATE <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <input
   type="date"
   value={formData.date}
   onChange={(e) => handleChange("date", e.target.value)}
   className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
   required
  />
  <Calendar
   size={18}
   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  REFERENCE <span className="text-red-500">*</span>
  </label>
  <input
  type="text"
  value={formData.reference}
  onChange={(e) => handleChange("reference", e.target.value)}
  placeholder="e.g., PT001"
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  </div>

  {/* Product Search */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  ADD PRODUCT
  </label>
  <div className="flex gap-2">
  <input
  type="text"
  value={productInput}
  onChange={(e) => setProductInput(e.target.value)}
  list="products-list"
  placeholder="Search product..."
  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  <datalist id="products-list">
  {products.map((product) => (
   <option key={product} value={product} />
  ))}
  </datalist>
  <button
  type="button"
  onClick={addItem}
  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
  >
  <Plus size={20} />
  </button>
  </div>
  </div>

  {/* Items Table */}
  {formData.items.length > 0 && (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
  <table className="w-full text-sm">
  <thead className="bg-gray-50">
   <tr>
   <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
   <th className="text-center px-4 py-3 font-medium text-gray-500">Qty</th>
   <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
   <th className="text-left px-4 py-3 font-medium text-gray-500">Discount %</th>
   <th className="text-left px-4 py-3 font-medium text-gray-500">Tax %</th>
   <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
   <th className="w-12"></th>
   </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
   {formData.items.map((item) => (
   <tr key={item.id}>
   <td className="px-4 py-3 font-medium">{item.product}</td>
   <td className="px-4 py-3">
   <div className="flex items-center justify-center gap-2">
    <button
    type="button"
    onClick={() => updateItem(item.id, "qty", Math.max(1, item.qty - 1))}
    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
    >
    <Minus size={14} />
    </button>
    <span className="w-8 text-center">{item.qty}</span>
    <button
    type="button"
    onClick={() => updateItem(item.id, "qty", item.qty + 1)}
    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
    >
    <Plus size={14} />
    </button>
   </div>
   </td>
   <td className="px-4 py-3">
   <input
    type="number"
    value={item.purchasePrice}
    onChange={(e) =>
    updateItem(item.id, "purchasePrice", Number(e.target.value))
    }
    className="w-20 px-2 py-1 border border-gray-200 rounded"
    min="0"
   />
   </td>
   <td className="px-4 py-3">
   <input
    type="number"
    value={item.discount}
    onChange={(e) => updateItem(item.id, "discount", Number(e.target.value))}
    className="w-16 px-2 py-1 border border-gray-200 rounded"
    min="0"
    max="100"
   />
   </td>
   <td className="px-4 py-3">
   <input
    type="number"
    value={item.tax}
    onChange={(e) => updateItem(item.id, "tax", Number(e.target.value))}
    className="w-16 px-2 py-1 border border-gray-200 rounded"
    min="0"
    max="100"
   />
   </td>
   <td className="px-4 py-3 font-medium">${item.totalCost.toFixed(2)}</td>
   <td className="px-4 py-3">
   <button
    type="button"
    onClick={() => removeItem(item.id)}
    className="p-1 text-red-500 hover:bg-red-50 rounded"
   >
    <X size={16} />
   </button>
   </td>
   </tr>
   ))}
  </tbody>
  </table>
  </div>
  )}

  {/* Order Tax, Discount, Shipping, Status */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">ORDER TAX ($)</label>
  <input
  type="number"
  value={formData.orderTax}
  onChange={(e) => handleChange("orderTax", Number(e.target.value))}
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">DISCOUNT ($)</label>
  <input
  type="number"
  value={formData.discount}
  onChange={(e) => handleChange("discount", Number(e.target.value))}
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">SHIPPING ($)</label>
  <input
  type="number"
  value={formData.shipping}
  onChange={(e) => handleChange("shipping", Number(e.target.value))}
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">STATUS</label>
  <div className="relative">
  <select
   value={formData.status}
   onChange={(e) =>
   handleChange("status", e.target.value as "Received" | "Pending" | "Ordered")
   }
   className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
  >
   <option value="Pending">Pending</option>
   <option value="Ordered">Ordered</option>
   <option value="Received">Received</option>
  </select>
  <ChevronDown
   size={18}
   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
  />
  </div>
  </div>
  </div>

  {/* Grand Total */}
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
  <span className="text-sm font-medium text-orange-800">Grand Total</span>
  <span className="text-2xl font-bold text-orange-500">${calculateTotal().toFixed(2)}</span>
  </div>
 </form>

 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
  <button
  type="button"
  onClick={onClose}
  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
  >
  Cancel
  </button>
  <button
  onClick={handleSubmit}
  disabled={isLoading}
  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
  >
  {isLoading ? "Adding..." : "Add Purchase"}
  </button>
 </div>
 </div>
 </div>
 );
};

"use client";

import React, { useState, useEffect } from "react";
import { X, PackagePlus } from "lucide-react";

interface AddManualItemModalProps {
 open: boolean;
 onClose: () => void;
 /** name, price, quantity, optional cost price (empty = no cost) */
 onAdd: (name: string, price: string, quantity: number, costPrice?: string) => boolean;
}

export const AddManualItemModal: React.FC<AddManualItemModalProps> = ({
 open,
 onClose,
 onAdd,
}) => {
 const [name, setName] = useState("");
 const [price, setPrice] = useState("");
 const [quantity, setQuantity] = useState("1");
 const [costPrice, setCostPrice] = useState("");

 useEffect(() => {
 if (open) {
 setName("");
 setPrice("");
 setQuantity("1");
 setCostPrice("");
 }
 }, [open]);

 if (!open) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const qty = Math.max(1, parseInt(quantity, 10) || 1);
 const ok = onAdd(name, price, qty, costPrice.trim() || undefined);
 if (ok) onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
 <div
 className="absolute inset-0 bg-black/50"
 aria-hidden
 />
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="manual-item-title"
 className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-lg shadow-xl p-4 sm:p-6"
 >
 <div className="flex items-center justify-between mb-4">
  <h2
  id="manual-item-title"
  className="text-lg font-semibold text-gray-900 flex items-center gap-2"
  >
  <PackagePlus className="h-5 w-5 text-orange-500" />
  Add manual item
  </h2>
  <button
  onClick={onClose}
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
  aria-label="Close"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <p className="text-sm text-gray-500 mb-4">
  Add an item that’s not in your product list. Enter name and price.
 </p>

 <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label htmlFor="manual-name" className="block text-sm font-medium text-gray-700 mb-1">
  Item name *
  </label>
  <input
  id="manual-name"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="e.g. Custom service, Misc item"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  autoFocus
  />
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label htmlFor="manual-price" className="block text-sm font-medium text-gray-700 mb-1">
  Price (£) *
  </label>
  <div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">£</span>
  <input
   id="manual-price"
   type="text"
   inputMode="decimal"
   value={price}
   onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
   placeholder="0.00"
   className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
   required
  />
  </div>
  </div>
  <div>
  <label htmlFor="manual-qty" className="block text-sm font-medium text-gray-700 mb-1">
  Quantity
  </label>
  <input
  id="manual-qty"
  type="number"
  min={1}
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  </div>
  <div>
  <label htmlFor="manual-cost" className="block text-sm font-medium text-gray-700 mb-1">
  Cost price (£) <span className="text-gray-400 font-normal">(optional)</span>
  </label>
  <div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">£</span>
  <input
  id="manual-cost"
  type="text"
  inputMode="decimal"
  value={costPrice}
  onChange={(e) => setCostPrice(e.target.value.replace(/[^0-9.]/g, ""))}
  placeholder="0.00"
  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  </div>
  <div className="flex gap-3 pt-2">
  <button
  type="button"
  onClick={onClose}
  className="flex-1 min-h-[48px] py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
  >
  Cancel
  </button>
  <button
  type="submit"
  className="flex-1 min-h-[48px] py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 active:bg-orange-700 touch-manipulation"
  >
  Add to cart
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

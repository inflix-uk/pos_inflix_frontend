"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Purchase } from "../types";

interface DeletePurchaseModalProps {
 open: boolean;
 purchase: Purchase | null;
 onClose: () => void;
 onDelete: (id: string) => void;
 isLoading: boolean;
}

export const DeletePurchaseModal: React.FC<DeletePurchaseModalProps> = ({
 open,
 purchase,
 onClose,
 onDelete,
 isLoading,
}) => {
 if (!open || !purchase) return null;

 const handleDelete = () => {
 onDelete(purchase._id);
 };

 const currencySymbol =
 purchase.currency === "USD" ? "$" : purchase.currency === "EUR" ? "€" : "£";

 const getStatusBadge = (status: string) => {
 switch (status) {
 case "Received":
 return "bg-green-100 text-green-800";
 case "Pending":
 return "bg-blue-100 text-blue-800";
 case "Ordered":
 return "bg-yellow-100 text-yellow-800";
 default:
 return "bg-gray-100 text-gray-800";
 }
 };

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg w-full max-w-md">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-800">Remove purchase</h2>
  <button
  onClick={onClose}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
  <X size={20} className="text-gray-500" />
  </button>
 </div>

 <div className="p-6">
  <div className="flex items-center justify-center mb-6">
  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
  <AlertTriangle className="w-8 h-8 text-red-500" />
  </div>
  </div>

  <p className="text-center text-gray-600 mb-6">
  Are you sure you want to remove this purchase from the list? This action cannot be undone.
  </p>

  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
  <div className="flex justify-between">
  <span className="text-sm text-gray-500">Supplier</span>
  <span className="text-sm font-medium text-gray-900">{typeof purchase.supplier === 'string' ? purchase.supplier : purchase.supplier?.name}</span>
  </div>
  <div className="flex justify-between">
  <span className="text-sm text-gray-500">Reference</span>
  <span className="text-sm font-medium text-gray-900">{purchase.purchaseNumber}</span>
  </div>
  <div className="flex justify-between">
  <span className="text-sm text-gray-500">Date</span>
  <span className="text-sm font-medium text-gray-900">
  {new Date(purchase.date).toLocaleDateString("en-US", {
   day: "2-digit",
   month: "short",
   year: "numeric",
  })}
  </span>
  </div>
  <div className="flex justify-between items-center">
  <span className="text-sm text-gray-500">Status</span>
  <span
  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
   purchase.status
  )}`}
  >
  {purchase.status}
  </span>
  </div>
  <div className="flex justify-between">
  <span className="text-sm text-gray-500">Total</span>
  <span className="text-sm font-medium text-gray-900">
  {currencySymbol}
  {purchase.grandTotal.toFixed(2)}
  </span>
  </div>
  </div>
 </div>

 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
  <button
  type="button"
  onClick={onClose}
  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
  >
  Cancel
  </button>
  <button
  onClick={handleDelete}
  disabled={isLoading}
  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
  >
  {isLoading ? "Removing…" : "Remove purchase"}
  </button>
 </div>
 </div>
 </div>
 );
};

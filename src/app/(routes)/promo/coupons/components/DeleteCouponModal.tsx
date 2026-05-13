"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Coupon } from "../types";

interface DeleteCouponModalProps {
 open: boolean;
 onClose: () => void;
 onDelete: () => void;
 coupon: Coupon | null;
}

export const DeleteCouponModal: React.FC<DeleteCouponModalProps> = ({
 open,
 onClose,
 onDelete,
 coupon,
}) => {
 if (!open || !coupon) return null;

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-md">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Delete Coupon</h2>
  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
  <X size={24} />
  </button>
 </div>

 <div className="p-6">
  <div className="flex items-center justify-center mb-4">
  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
  <AlertTriangle className="w-6 h-6 text-red-600" />
  </div>
  </div>
  <p className="text-center text-gray-600 mb-2">
  Are you sure you want to delete this coupon?
  </p>
  <p className="text-center text-sm text-gray-500">
  <span className="font-medium">{coupon.name}</span> - {coupon.code}
  </p>
  <p className="text-center text-xs text-gray-400 mt-2">
  This action cannot be undone.
  </p>
 </div>

 <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
  <button
  onClick={onClose}
  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  onClick={onDelete}
  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
  >
  Delete
  </button>
 </div>
 </div>
 </div>
 );
};

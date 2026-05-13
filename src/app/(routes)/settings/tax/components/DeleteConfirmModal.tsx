"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmModalProps } from "../types";

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
 isOpen,
 tax,
 onClose,
 onConfirm,
 isLoading = false,
}) => {
 if (!isOpen || !tax) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/50" aria-hidden />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
 <div className="flex items-center gap-3 mb-4">
  <div className="p-2 bg-red-100 rounded-full">
  <Trash2 className="h-6 w-6 text-red-500" />
  </div>
  <h3 className="text-lg font-semibold text-gray-800">Delete Tax</h3>
 </div>
 <p className="text-gray-600 mb-2">
  Are you sure you want to delete the tax:
 </p>
 <p className="font-medium text-gray-800 mb-4">
  {tax.name} ({tax.rate}%)
 </p>
 <p className="text-sm text-gray-500 mb-6">
  This action cannot be undone.
 </p>
 <div className="flex justify-end gap-3">
  <button
  type="button"
  onClick={onClose}
  disabled={isLoading}
  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={onConfirm}
  disabled={isLoading}
  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  {isLoading ? "Deleting..." : "Delete"}
  </button>
 </div>
 </div>
 </div>
 );
};

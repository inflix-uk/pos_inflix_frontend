"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Category } from "../types";

interface DeleteCategoryModalProps {
 open: boolean;
 onClose: () => void;
 onDelete: (id: string) => void;
 category: Category | null;
 isLoading?: boolean;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
 open,
 onClose,
 onDelete,
 category,
 isLoading,
}) => {
 if (!open || !category) return null;

 return (
 <div className="fixed inset-0 z-50 overflow-y-auto">
 <div className="flex items-center justify-center min-h-screen px-4">
 <div
  className="fixed inset-0 bg-black/50 transition-opacity"
  aria-hidden
 />
 <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold text-gray-900">
  Delete Category
  </h2>
  <button
  onClick={onClose}
  className="text-gray-400 hover:text-gray-600"
  >
  <X size={24} />
  </button>
  </div>

  <div className="text-center py-4">
  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
  <AlertTriangle className="w-6 h-6 text-red-600" />
  </div>
  <p className="text-gray-600">
  Are you sure you want to delete{" "}
  <span className="font-semibold text-gray-900">
  {category.name}
  </span>
  ?
  </p>
  <p className="text-sm text-gray-500 mt-2">
  This action cannot be undone.
  </p>
  </div>

  <div className="flex gap-3 pt-4">
  <button
  type="button"
  onClick={onClose}
  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={() => category._id && onDelete(category._id)}
  disabled={isLoading}
  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
  >
  {isLoading ? "Deleting..." : "Delete"}
  </button>
  </div>
 </div>
 </div>
 </div>
 );
};

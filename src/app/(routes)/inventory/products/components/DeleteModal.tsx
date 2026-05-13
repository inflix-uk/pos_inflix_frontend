"use client";
import React from "react";
import { Trash2 } from "lucide-react";
import { Product } from "../types";

interface DeleteModalProps {
 isOpen: boolean;
 product: Product | null;
 onClose: () => void;
 onDelete: () => void;
}

export default function DeleteModal({
 isOpen,
 product,
 onClose,
 onDelete,
}: DeleteModalProps) {
 if (!isOpen || !product) return null;

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-md mx-4">
 <div className="p-6 text-center">
  <div className="mb-4">
  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
  <Trash2 className="w-6 h-6 text-red-500" />
  </div>
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Product</h3>
  <p className="text-gray-600 mb-6">
  Are you sure you want to delete "{product.name}"? This action cannot be
  undone.
  </p>
 </div>
 <div className="flex justify-center gap-3 pb-6">
  <button
  onClick={onClose}
  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
  >
  Cancel
  </button>
  <button
  onClick={onDelete}
  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
  >
  Delete
  </button>
 </div>
 </div>
 </div>
 );
}

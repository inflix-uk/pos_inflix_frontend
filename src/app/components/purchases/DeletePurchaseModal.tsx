"use client";
import React from "react";
import { X, Trash2 } from "lucide-react";
import { Purchase } from "./AddPurchaseModal";

interface DeletePurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  purchase: Purchase | null;
}

const DeletePurchaseModal: React.FC<DeletePurchaseModalProps> = ({
  open,
  onClose,
  onDelete,
  purchase,
}) => {
  if (!open || !purchase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Purchase</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this purchase? This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Supplier Name:</span>
              <span className="text-sm text-gray-900">{purchase.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Reference:</span>
              <span className="text-sm text-gray-900">{purchase.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Date:</span>
              <span className="text-sm text-gray-900">{purchase.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-sm text-gray-900">${purchase.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                purchase.status === "Received"
                  ? "bg-green-100 text-green-800"
                  : purchase.status === "Pending"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {purchase.status}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePurchaseModal;

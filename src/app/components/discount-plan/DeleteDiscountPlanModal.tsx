"use client";
import React from "react";
import { X, Trash2 } from "lucide-react";
import { DiscountPlan } from "./AddDiscountPlanModal";

interface DeleteDiscountPlanModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  discountPlan: DiscountPlan | null;
}

const DeleteDiscountPlanModal: React.FC<DeleteDiscountPlanModalProps> = ({
  open,
  onClose,
  onDelete,
  discountPlan,
}) => {
  if (!open || !discountPlan) return null;

  const handleDelete = () => {
    onDelete(discountPlan.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delete Discount Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={32} className="text-red-500" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete this discount plan?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Plan Name:</span> {discountPlan.planName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Customers:</span> {discountPlan.customers}
              </p>
            </div>
            <p className="text-sm text-red-600 mt-3">
              This action cannot be undone.
            </p>
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
            onClick={handleDelete}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDiscountPlanModal;

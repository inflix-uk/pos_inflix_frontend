"use client";
import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteCouponModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  couponName?: string;
  couponCode?: string;
}

const DeleteCouponModal: React.FC<DeleteCouponModalProps> = ({
  open,
  onClose,
  onDelete,
  couponName,
  couponCode,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 p-8 relative text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 size={32} className="text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Delete Coupon
        </h3>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete coupon{" "}
          <span className="font-medium text-gray-900">
            {couponName} ({couponCode})
          </span>?
          <br />
          This action cannot be undone.
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCouponModal;

"use client";
import React from "react";
import { X, Trash2 } from "lucide-react";
import { GiftCard } from "./AddGiftCardModal";

interface DeleteGiftCardModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  giftCard: GiftCard | null;
}

const DeleteGiftCardModal: React.FC<DeleteGiftCardModalProps> = ({
  open,
  onClose,
  onDelete,
  giftCard,
}) => {
  if (!open || !giftCard) return null;

  const handleDelete = () => {
    onDelete(giftCard.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delete Gift Card</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Are you sure you want to delete this gift card?
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            This action cannot be undone. The gift card <strong>{giftCard.giftCard}</strong> for customer <strong>{giftCard.customer.name}</strong> will be permanently removed.
          </p>
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

export default DeleteGiftCardModal;

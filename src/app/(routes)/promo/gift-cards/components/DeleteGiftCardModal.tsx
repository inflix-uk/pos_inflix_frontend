"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { GiftCard } from "../types";

interface DeleteGiftCardModalProps {
 open: boolean;
 onClose: () => void;
 onDelete: (id: string) => void;
 giftCard: GiftCard | null;
}

export const DeleteGiftCardModal: React.FC<DeleteGiftCardModalProps> = ({
 open,
 onClose,
 onDelete,
 giftCard,
}) => {
 if (!open || !giftCard) return null;

 const handleDelete = () => {
 onDelete(giftCard.id);
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-md">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Delete Gift Card</h2>
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
  Are you sure you want to delete this gift card?
  </p>
  <p className="text-center text-sm text-gray-500">
  <span className="font-medium">{giftCard.giftCard}</span> - {giftCard.customer.name}
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
  onClick={handleDelete}
  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
  >
  Delete
  </button>
 </div>
 </div>
 </div>
 );
};

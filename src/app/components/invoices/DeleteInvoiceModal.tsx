"use client";
import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  invoiceNo?: string;
}

const DeleteInvoiceModal: React.FC<DeleteInvoiceModalProps> = ({
  open,
  onClose,
  onDelete,
  invoiceNo,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 p-8 relative text-center">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 rounded-full p-3 mb-3">
            <Trash2 className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Delete Invoice</h2>
          <p className="mb-6 text-gray-700">
            Are you sure you want to delete {invoiceNo ? `invoice ${invoiceNo}` : 'this invoice'}? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button
              className="px-6 py-2 rounded-md bg-[#0a2342] text-white hover:bg-[#16335b] font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded-md bg-orange-400 text-white hover:bg-orange-500 font-medium"
              onClick={onDelete}
            >
              Yes Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteInvoiceModal;

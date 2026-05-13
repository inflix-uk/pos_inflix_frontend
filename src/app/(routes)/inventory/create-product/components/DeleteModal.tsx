"use client";
import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 message: string;
}

export default function DeleteModal({
 isOpen,
 onClose,
 onConfirm,
 title,
 message,
}: DeleteModalProps) {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-md mx-4">
 {/* Modal Content */}
 <div className="p-6 text-center">
  <div className="mb-4">
  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
  <Trash2 className="w-6 h-6 text-red-500" />
  </div>
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
  <p className="text-gray-600 mb-6">{message}</p>
 </div>

 {/* Modal Footer */}
 <div className="flex justify-center gap-3 pb-6">
  <button
  onClick={onClose}
  className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800"
  >
  Cancel
  </button>
  <button
  onClick={onConfirm}
  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
  >
  Yes Delete
  </button>
 </div>
 </div>
 </div>
 );
}

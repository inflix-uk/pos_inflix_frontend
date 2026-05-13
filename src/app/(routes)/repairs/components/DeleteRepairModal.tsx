"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Repair } from "../types";

interface DeleteRepairModalProps {
 open: boolean;
 repair: Repair | null;
 onClose: () => void;
 onConfirm: (id: string) => void;
 isLoading: boolean;
}

export const DeleteRepairModal: React.FC<DeleteRepairModalProps> = ({
 open,
 repair,
 onClose,
 onConfirm,
 isLoading,
}) => {
 if (!open || !repair) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/20" aria-hidden onClick={onClose} />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Delete repair</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} />
  </button>
 </div>
 <div className="p-4">
  <div className="flex gap-4 mb-4">
  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
  <AlertTriangle className="text-red-600" size={24} />
  </div>
  <div>
  <p className="text-gray-900 font-medium">Are you sure you want to delete this repair?</p>
  <p className="text-gray-600 text-sm mt-1">
  {repair.reference} · {repair.customerName} · {repair.deviceDescription}
  </p>
  </div>
  </div>
  <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
  <div className="flex justify-end gap-3">
  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
  Cancel
  </button>
  <button
  type="button"
  onClick={() => repair._id && onConfirm(repair._id)}
  disabled={isLoading}
  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
  >
  {isLoading ? "Deleting..." : "Delete repair"}
  </button>
  </div>
 </div>
 </div>
 </div>
 );
};

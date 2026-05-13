"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmModalProps } from "../types";

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
 isOpen,
 account,
 onClose,
 onConfirm,
 isLoading = false,
}) => {
 if (!isOpen || !account) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/50" aria-hidden />
 <div className="@container relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-4 @[480px]:p-6">
 <div className="flex items-center gap-2 @[480px]:gap-3 mb-3 @[480px]:mb-4">
  <div className="p-1.5 @[480px]:p-2 bg-red-100 rounded-full">
  <Trash2 className="h-5 w-5 @[480px]:h-6 @[480px]:w-6 text-red-500" />
  </div>
  <h3 className="text-base @[480px]:text-lg font-semibold text-gray-800">Delete Bank Account</h3>
 </div>
 <p className="text-xs @[480px]:text-sm text-gray-600 mb-2">
  Are you sure you want to delete the bank account:
 </p>
 <p className="text-sm @[480px]:text-base font-medium text-gray-800 mb-3 @[480px]:mb-4">
  {account.accountName} - {account.bankName}
 </p>
 <p className="text-xs @[480px]:text-sm text-gray-500 mb-4 @[480px]:mb-6">
  This action cannot be undone.
 </p>
 <div className="flex justify-end gap-2 @[480px]:gap-3">
  <button
  type="button"
  onClick={onClose}
  disabled={isLoading}
  className="px-3 @[480px]:px-4 py-1.5 @[480px]:py-2 text-xs @[480px]:text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={onConfirm}
  disabled={isLoading}
  className="px-3 @[480px]:px-4 py-1.5 @[480px]:py-2 text-xs @[480px]:text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  {isLoading ? "Deleting..." : "Delete"}
  </button>
 </div>
 </div>
 </div>
 );
};

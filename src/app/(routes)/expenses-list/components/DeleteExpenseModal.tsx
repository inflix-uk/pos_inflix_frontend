"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Expense } from "../types";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

interface DeleteExpenseModalProps {
 open: boolean;
 expense: Expense | null;
 onClose: () => void;
 onDelete: (id: string) => void;
 isLoading: boolean;
}

export function DeleteExpenseModal({ open, expense, onClose, onDelete, isLoading }: DeleteExpenseModalProps) {
 if (!open || !expense) return null;

 const categoryName =
 typeof expense.categoryId === "object" && expense.categoryId && "name" in expense.categoryId
 ? expense.categoryId.name
 : "—";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/20" aria-hidden />
 <div className="@container relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
 <div className="flex items-center justify-between p-4 @[480px]:p-6 border-b border-gray-200">
  <h2 className="text-lg @[480px]:text-xl font-semibold text-gray-900">Delete Expense</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} />
  </button>
 </div>
 <div className="p-4 @[480px]:p-6">
  <div className="flex items-center gap-3 @[480px]:gap-4 mb-4">
  <div className="flex-shrink-0 w-10 h-10 @[480px]:w-12 @[480px]:h-12 bg-red-100 rounded-full flex items-center justify-center">
  <AlertTriangle className="text-red-600" size={24} />
  </div>
  <div>
  <p className="text-gray-900 font-medium text-sm @[480px]:text-base">Are you sure you want to delete this expense?</p>
  <p className="text-gray-600 text-xs @[480px]:text-sm mt-1">
  {expense.vendorName || "—"} · {categoryName} · {formatCurrency(expense.amountGross)}
  </p>
  <p className="text-gray-500 text-[11px] @[480px]:text-xs mt-0.5">Status: {expense.status}</p>
  </div>
  </div>
  <p className="text-xs @[480px]:text-sm text-gray-500 mb-4 @[480px]:mb-6">This action cannot be undone.</p>
  <div className="flex justify-end gap-2 @[480px]:gap-3">
  <button
  type="button"
  onClick={onClose}
  className="px-3 @[480px]:px-4 py-1.5 @[480px]:py-2 text-xs @[480px]:text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={() => expense._id && onDelete(expense._id)}
  disabled={isLoading}
  className="px-3 @[480px]:px-4 py-1.5 @[480px]:py-2 text-xs @[480px]:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
  >
  {isLoading ? "Deleting…" : "Delete Expense"}
  </button>
  </div>
 </div>
 </div>
 </div>
 );
}

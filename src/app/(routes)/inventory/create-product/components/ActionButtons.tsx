"use client";

import React from "react";
import Link from "next/link";
import { RotateCcw, Plus } from "lucide-react";

interface ActionButtonsProps {
 onSubmit: () => void;
 isSubmitting: boolean;
 onReset?: () => void;
}

export default function ActionButtons({ onSubmit, isSubmitting, onReset }: ActionButtonsProps) {
 return (
 <div className="p-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 {onReset && (
  <button
  type="button"
  onClick={onReset}
  className="inline-flex items-center px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
  >
  <RotateCcw className="w-4 h-4 mr-2" />
  Reset
  </button>
 )}
 <Link
  href="/inventory/products"
  className="inline-flex items-center px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
 >
  Cancel
 </Link>
 </div>
 <button
 type="button"
 onClick={onSubmit}
 disabled={isSubmitting}
 className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Plus className="w-4 h-4 mr-2" />
 {isSubmitting ? "Creating…" : "Add product"}
 </button>
 </div>
 );
}

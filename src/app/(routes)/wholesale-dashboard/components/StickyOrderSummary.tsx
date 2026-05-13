"use client";

import React from "react";
import { formatTimeLondon } from "@/lib/dateUtils";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

interface StickyOrderSummaryProps {
 itemCount: number;
 total: number;
 canComplete: boolean;
 completeDisabledReason: "none" | "no_customer" | "no_items";
 onComplete: () => void;
 draftSavedAt: Date | string | null;
 onSaveDraft?: () => void;
 className?: string;
 /** When false, do not show the Complete order button (cart already has one) */
 showCompleteButton?: boolean;
}

export function StickyOrderSummary({
 itemCount,
 total,
 canComplete,
 completeDisabledReason,
 onComplete,
 draftSavedAt,
 onSaveDraft,
 className = "",
 showCompleteButton = true,
}: StickyOrderSummaryProps) {
 const reasonText =
 completeDisabledReason === "no_customer"
 ? "Select customer to continue"
 : completeDisabledReason === "no_items"
 ? "Add at least 1 item"
 : "";

 return (
 <div className={`flex flex-col gap-3 ${className}`}>
 <div className="flex items-center justify-between text-sm">
 <span className="text-gray-600">
  {itemCount} item{itemCount === 1 ? "" : "s"}
 </span>
 <span className="font-semibold text-gray-900 tabular-nums">{formatMoney(total)}</span>
 </div>
 {showCompleteButton && (
 <button
  type="button"
  onClick={onComplete}
  disabled={!canComplete}
  className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
  aria-disabled={!canComplete}
  title={!canComplete ? reasonText : "Complete order"}
 >
  {canComplete ? "Complete order" : reasonText}
 </button>
 )}
 {onSaveDraft && (
 <div className="flex items-center justify-between text-xs text-gray-500">
  <button
  type="button"
  onClick={onSaveDraft}
  className="text-blue-600 hover:text-blue-700 font-medium"
  >
  Save draft
  </button>
  {draftSavedAt && (
  <span className="tabular-nums" aria-label={`Draft saved at ${formatTimeLondon(draftSavedAt)}`}>
  Saved {formatTimeLondon(draftSavedAt)}
  </span>
  )}
 </div>
 )}
 </div>
 );
}


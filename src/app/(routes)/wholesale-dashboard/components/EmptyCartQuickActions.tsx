"use client";

import React from "react";
import { ScanLine, ClipboardList, Package, Plus, FileText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";

interface EmptyCartQuickActionsProps {
 hasCustomer: boolean;
 /** Retail / walk-in: same as enabling add actions without a wholesale account. */
 retailMode?: boolean;
 onFocusAddInput: () => void;
 onPasteImeis: () => void;
 onShowProducts: () => void;
 onAddManualItem: () => void;
 onLoadDraft: () => void;
 hasDrafts: boolean;
 /** When false, hide “Show products” button. */
 showProductGridAction?: boolean;
}

export function EmptyCartQuickActions({
 hasCustomer,
 retailMode = false,
 onFocusAddInput,
 onPasteImeis,
 onShowProducts,
 onAddManualItem,
 onLoadDraft,
 hasDrafts,
 showProductGridAction = true,
}: EmptyCartQuickActionsProps) {
 const canAct = hasCustomer;
 const hint = canAct
 ? retailMode
 ? "Scan, search, or tap a product card to add lines."
 : "Scan IMEI/barcode, search, or paste bulk IMEIs."
 : retailMode
 ? "Use the search bar or open the product grid."
 : "Select a customer above to add items.";

 return (
 <div className="rounded-xl border border-dashed border-gray-200/90 bg-white px-3 py-4 text-center">
 <div className="flex items-center justify-center gap-2 flex-wrap">
 <p className="text-sm font-semibold text-gray-800">No items yet</p>
 <HelpTip ariaLabel="How to add items" contentClassName="text-left" iconClassName="h-4 w-4">
  {hint}
 </HelpTip>
 </div>
 <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2 @[640px]:flex @[640px]:flex-wrap @[640px]:justify-center">
 <button
  type="button"
  onClick={onFocusAddInput}
  disabled={!canAct}
  className="col-span-2 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 @[640px]:col-span-1 @[640px]:min-h-0"
  title={canAct ? "Focus scan/search (Ctrl+K)" : undefined}
  aria-label="Scan or search to add item"
 >
  <ScanLine className="h-3.5 w-3.5 shrink-0" />
  Scan / search
 </button>
 {showProductGridAction && !retailMode && (
  <button
  type="button"
  onClick={onShowProducts}
  disabled={!canAct}
  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
  aria-label="Show product grid"
  >
  <Package className="h-3.5 w-3.5 shrink-0" />
  Products
  </button>
 )}
 {!retailMode && (
 <button
  type="button"
  onClick={onPasteImeis}
  disabled={!canAct}
  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
  title={canAct ? "Bulk IMEIs" : undefined}
  aria-label="Bulk IMEIs"
 >
  <ClipboardList className="h-3.5 w-3.5 shrink-0" />
  Bulk IMEIs
 </button>
 )}
 <button
  type="button"
  onClick={onAddManualItem}
  disabled={!canAct}
  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-100/90 disabled:cursor-not-allowed disabled:opacity-50"
  aria-label="Add MISC item"
 >
  <Plus className="h-3.5 w-3.5 shrink-0" />
  MISC Item
 </button>
 {hasDrafts && !retailMode && (
  <button
  type="button"
  onClick={onLoadDraft}
  className="col-span-2 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-100 @[640px]:col-span-1"
  aria-label="Load draft"
  >
  <FileText className="h-3.5 w-3.5 shrink-0" />
  Load draft
  </button>
 )}
 </div>
 </div>
 );
}

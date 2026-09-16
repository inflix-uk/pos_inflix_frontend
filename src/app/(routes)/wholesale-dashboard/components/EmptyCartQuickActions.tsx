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
 /** When false, hide “Load draft” in empty cart. */
 showDraftActions?: boolean;
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
 showDraftActions = true,
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

 const actionBtn =
 "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold touch-manipulation transition-colors disabled:cursor-not-allowed disabled:opacity-50 @[640px]:min-h-[42px] @[640px]:text-sm";

 return (
 <div className="flex h-full min-h-[220px] flex-col">
 {!retailMode && (
 <div className="hidden border-b border-slate-100 bg-slate-50/80 px-3 py-2 @[640px]:grid @[640px]:grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem] @[640px]:gap-2">
  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Item</span>
  <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">Qty</span>
  <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">Unit</span>
  <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">Amount</span>
 </div>
 )}

 <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
  <div className="flex flex-col items-center gap-1.5">
  <p className="text-sm font-semibold text-slate-800">No items yet</p>
  <div className="flex items-center gap-1.5 text-xs text-slate-500">
   <span>{hint}</span>
   <HelpTip ariaLabel="How to add items" contentClassName="text-left" iconClassName="h-3.5 w-3.5">
   {hint}
   </HelpTip>
  </div>
  </div>

  <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2">
  <button
   type="button"
   onClick={onFocusAddInput}
   disabled={!canAct}
   className={`${actionBtn} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`}
   title={canAct ? "Focus scan/search (Ctrl+K)" : undefined}
   aria-label="Scan or search to add item"
  >
   <ScanLine className="h-4 w-4 shrink-0" />
   Scan / search
  </button>
  <button
   type="button"
   onClick={onAddManualItem}
   disabled={!canAct}
   className={`${actionBtn} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
   aria-label="Add MISC item"
  >
   <Plus className="h-4 w-4 shrink-0" />
   MISC item
  </button>
  {showProductGridAction && !retailMode && (
   <button
   type="button"
   onClick={onShowProducts}
   disabled={!canAct}
   className={`${actionBtn} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
   aria-label="Show product grid"
   >
   <Package className="h-4 w-4 shrink-0" />
   Products
   </button>
  )}
  {!retailMode && (
   <button
   type="button"
   onClick={onPasteImeis}
   disabled={!canAct}
   className={`${actionBtn} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
   title={canAct ? "Bulk IMEIs" : undefined}
   aria-label="Bulk IMEIs"
   >
   <ClipboardList className="h-4 w-4 shrink-0" />
   Bulk IMEIs
   </button>
  )}
  {showDraftActions && hasDrafts && !retailMode && (
   <button
   type="button"
   onClick={onLoadDraft}
   className={`${actionBtn} border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100`}
   aria-label="Load draft"
   >
   <FileText className="h-4 w-4 shrink-0" />
   Load draft
   </button>
  )}
  </div>
 </div>
 </div>
 );
}

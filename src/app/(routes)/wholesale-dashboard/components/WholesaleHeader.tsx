"use client";

import React from "react";
import { Building2, PanelLeftClose, PanelLeftOpen, PackagePlus, ListOrdered } from "lucide-react";

interface WholesaleHeaderProps {
 /** Default: "Wholesale Orders" */
 title?: string;
 /** Default: "B2B" (e.g. use "Edit" for edit sale page) */
 badge?: string;
 subtitle?: string;
 cartCount?: number;
 onScanAdd?: (sku: string) => boolean | Promise<boolean>;
 /** When provided, shows toggle to collapse/expand the categories & products panel */
 productPanelOpen?: boolean;
 onToggleProductPanel?: () => void;
 /** When provided, shows "Add manual item" button (e.g. opens manual item modal) */
 onAddManualItem?: () => void;
 /** When provided, shows "Bulk IMEIs" button (e.g. opens bulk serials modal) */
 onBulkSerials?: () => void;
 /** When provided, shows back link (e.g. for edit sale page) */
 onBack?: () => void;
 BackIcon?: React.ComponentType<{ size?: number; className?: string }>;
}

export const WholesaleHeader: React.FC<WholesaleHeaderProps> = ({
 title = "Wholesale Orders",
 badge = "B2B",
 subtitle,
 cartCount = 0,
 onScanAdd,
 productPanelOpen = true,
 onToggleProductPanel,
 onAddManualItem,
 onBulkSerials,
 onBack,
 BackIcon,
}) => {
 return (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
 <div className="flex items-center gap-3">
 {onBack && BackIcon ? (
  <button
  type="button"
  onClick={onBack}
  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 hover:bg-blue-700 active:bg-blue-800"
  aria-label="Back"
  >
  <BackIcon className="h-5 w-5 sm:h-6 sm:w-6" />
  </button>
 ) : (
  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
  <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
  </div>
 )}
 <div className="min-w-0">
  <div className="flex items-center gap-2 flex-wrap">
  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
  {title}
  </h1>
  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide">
  {badge}
  </span>
  </div>
  <p className="text-gray-500 text-xs sm:text-sm truncate mt-0.5">
  {subtitle ?? (cartCount > 0 ? `${cartCount} item(s) in order` : "Select customer, then add products")}
  </p>
 </div>
 </div>

 <div className="flex items-center gap-2 sm:gap-3">
 {onToggleProductPanel && (
  <button
  type="button"
  onClick={onToggleProductPanel}
  className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation text-sm font-medium"
  aria-label={productPanelOpen ? "Hide categories and products" : "Show categories and products"}
  title={productPanelOpen ? "Hide products — full cart view" : "Show products"}
  >
  {productPanelOpen ? (
  <>
  <PanelLeftClose className="h-4 w-4" />
  <span className="hidden sm:inline">Hide products</span>
  </>
  ) : (
  <>
  <PanelLeftOpen className="h-4 w-4" />
  <span className="hidden sm:inline">Show products</span>
  </>
  )}
  </button>
 )}
 {onAddManualItem && (
  <button
  type="button"
  onClick={onAddManualItem}
  className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation text-sm font-medium"
  aria-label="Add manual item"
  >
  <PackagePlus className="h-4 w-4" />
  <span className="hidden sm:inline">Add manual item</span>
  </button>
 )}
 {onBulkSerials && (
  <button
  type="button"
  onClick={onBulkSerials}
  className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation text-sm font-medium"
  aria-label="Sell bulk IMEIs"
  title="Add hundreds of serials at once"
  >
  <ListOrdered className="h-4 w-4" />
  <span className="hidden sm:inline">Bulk IMEIs</span>
  </button>
 )}
 {cartCount > 0 && (
  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
  {cartCount}
  </div>
 )}
 </div>
 </div>
 );
};

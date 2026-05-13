"use client";

import React, { useRef, useState } from "react";
import { ShoppingBag, ScanLine } from "lucide-react";

interface SalesDashboardHeaderProps {
 title?: string;
 subtitle?: string;
 cartCount?: number;
 onScanAdd?: (sku: string) => boolean | Promise<boolean>;
}

export const SalesDashboardHeader: React.FC<SalesDashboardHeaderProps> = ({
 title = "Point of Sale",
 subtitle,
 cartCount = 0,
 onScanAdd,
}) => {
 const defaultSubtitle =
 cartCount > 0
 ? `${cartCount} item${cartCount === 1 ? "" : "s"} in cart`
 : "Tap products or scan barcode";
 const [scanValue, setScanValue] = useState("");
 const scanInputRef = useRef<HTMLInputElement>(null);

 const handleScanSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const sku = scanValue.trim();
 if (!sku) return;
 const result = onScanAdd?.(sku);
 const added = result instanceof Promise ? await result : result;
 setScanValue("");
 if (added) scanInputRef.current?.focus();
 };

 return (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
 </div>
 <div className="min-w-0">
  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
  {title}
  </h1>
  <p className="text-gray-500 text-xs sm:text-sm truncate">
  {subtitle ?? defaultSubtitle}
  </p>
 </div>
 </div>

 <div className="flex items-center gap-2 sm:gap-3">
 {onScanAdd && (
  <form
  onSubmit={handleScanSubmit}
  className="flex-1 sm:flex-initial flex items-center gap-2 min-w-0"
  >
  <div className="relative flex-1 sm:w-44">
  <ScanLine className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
  <input
  ref={scanInputRef}
  type="text"
  value={scanValue}
  onChange={(e) => setScanValue(e.target.value)}
  placeholder="Scan or type SKU / Barcode"
  className="w-full pl-8 pr-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  aria-label="Scan barcode or enter SKU"
  />
  </div>
  <button
  type="submit"
  className="flex-shrink-0 px-4 py-2.5 min-h-[44px] bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 active:bg-gray-950 touch-manipulation flex items-center justify-center"
  >
  Add
  </button>
  </form>
 )}
 {cartCount > 0 && (
  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex-shrink-0">
  {cartCount}
  </div>
 )}
 </div>
 </div>
 );
};

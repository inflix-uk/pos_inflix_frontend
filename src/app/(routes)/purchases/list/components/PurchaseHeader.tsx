"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Download, Upload, RefreshCw, ChevronDown, FileSpreadsheet } from "lucide-react";

interface PurchaseHeaderProps {
 onRefresh: () => void;
 onOpenImportFile?: () => void;
 /** Opens import modal for non-serial items (name, quantity, prices). */
 onOpenImportNonSerial?: () => void;
}

export const PurchaseHeader: React.FC<PurchaseHeaderProps> = ({ onRefresh, onOpenImportFile, onOpenImportNonSerial }) => {
 const [importOpen, setImportOpen] = useState(false);
 const importRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const close = (e: MouseEvent) => {
 if (importRef.current && !importRef.current.contains(e.target as Node)) setImportOpen(false);
 };
 document.addEventListener("click", close);
 return () => document.removeEventListener("click", close);
 }, []);

 return (
 <div className="mb-3 @[640px]:mb-4 @[1024px]:mb-6">
 <div className="flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-2 @[640px]:gap-3">
 <div className="min-w-0">
  <h1 className="text-base @[480px]:text-lg @[640px]:text-xl @[1024px]:text-2xl font-bold text-gray-900">Purchases</h1>
  <p className="text-[11px] @[480px]:text-xs @[640px]:text-sm text-gray-600 mt-0.5 @[640px]:mt-1">Purchases added to inventory</p>
 </div>
 <div className="flex items-center gap-1.5 @[640px]:gap-2 @[1024px]:gap-3 flex-wrap">
  <button
  onClick={onRefresh}
  className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
  title="Refresh"
  >
  <RefreshCw className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
  </button>
  <button
  className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
  title="Export"
  >
  <Download className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
  </button>
  <div className="relative" ref={importRef}>
  <button
  type="button"
  onClick={() => setImportOpen((o) => !o)}
  className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
  title="Import"
  >
  <Upload className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
  <ChevronDown size={14} className="text-gray-500" />
  </button>
  {importOpen && (
  <div className="absolute right-0 mt-1 w-72 @[640px]:w-80 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
  <p className="px-3 @[640px]:px-4 py-2 text-[11px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
   Purchase import
  </p>
  {onOpenImportFile && (
   <button
   type="button"
   onClick={() => { setImportOpen(false); onOpenImportFile(); }}
   className="w-full flex items-center gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 text-left"
   >
   <FileSpreadsheet className="h-4 w-4 text-orange-500 flex-shrink-0" />
   Import Serial Items
   </button>
  )}
  {onOpenImportNonSerial && (
   <button
   type="button"
   onClick={() => { setImportOpen(false); onOpenImportNonSerial(); }}
   className="w-full flex items-center gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 text-left"
   >
   <FileSpreadsheet className="h-4 w-4 text-orange-500 flex-shrink-0" />
   Import Non-Serial Items
   </button>
  )}
  <p className="px-3 @[640px]:px-4 py-2 text-[11px] @[640px]:text-xs text-gray-500 border-t border-gray-100 mt-1">
   Upload Excel/CSV and map columns. Serial: IMEI per row. Non-serial: name, quantity, prices.
  </p>
  </div>
  )}
  </div>
  <Link
  href="/purchases/add"
  className="flex items-center gap-1.5 @[640px]:gap-2 bg-orange-500 text-white px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 rounded-lg hover:bg-orange-600 transition-colors text-xs @[640px]:text-sm whitespace-nowrap"
  >
  <Plus className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
  <span className="hidden @[480px]:inline">Add purchase</span>
  </Link>
 </div>
 </div>
 </div>
 );
};

"use client";

import React from "react";
import { Plus, RefreshCw, Download, Upload, Undo2 } from "lucide-react";

interface AccountHeaderProps {
 customerCount?: number;
 supplierCount?: number;
 onAddClick: () => void;
 onRefresh: () => void;
 onImportClick?: () => void;
 onExportClick?: () => void;
 onDeleteLastImported?: () => void;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
 customerCount = 0,
 supplierCount = 0,
 onAddClick,
 onRefresh,
 onImportClick,
 onExportClick,
 onDeleteLastImported,
}) => {
 return (
 <div className="flex flex-col @[768px]:flex-row justify-between items-start @[768px]:items-center gap-3 @[640px]:gap-4 mb-4 @[640px]:mb-5 @[768px]:mb-6">
 <div>
 <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900">
  Customers
  <span className="ml-2 text-gray-500 font-normal">
  {customerCount}
  {supplierCount > 0 && <> · {supplierCount}</>}
  </span>
 </h1>
 <p className="text-xs @[640px]:text-sm text-gray-600 mt-1">Manage customers and suppliers in one place</p>
 </div>
 <div className="flex flex-wrap gap-2 @[640px]:gap-3">
 <button
  onClick={onRefresh}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
 >
  <RefreshCw size={16} className="@[640px]:hidden" />
  <RefreshCw size={18} className="hidden @[640px]:inline" /> Refresh
 </button>
 {onExportClick && (
  <button
  onClick={onExportClick}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <Download size={16} className="@[640px]:hidden" />
  <Download size={18} className="hidden @[640px]:inline" /> Export CSV
  </button>
 )}
 {onImportClick && (
  <button
  onClick={onImportClick}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <Upload size={16} className="@[640px]:hidden" />
  <Upload size={18} className="hidden @[640px]:inline" /> Import from file
  </button>
 )}
 {onDeleteLastImported && (
  <button
  onClick={onDeleteLastImported}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
  title="Delete the most recently created customer (e.g. undo last import)"
  >
  <Undo2 size={16} className="@[640px]:hidden" />
  <Undo2 size={18} className="hidden @[640px]:inline" /> Delete last imported
  </button>
 )}
 <button
  onClick={onAddClick}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
 >
  <Plus size={16} className="@[640px]:hidden" />
  <Plus size={18} className="hidden @[640px]:inline" /> Create New Account
 </button>
 </div>
 </div>
 );
};

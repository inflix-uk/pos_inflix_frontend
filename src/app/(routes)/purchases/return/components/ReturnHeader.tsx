"use client";

import React from "react";
import { Download, Upload, Plus, MoreHorizontal } from "lucide-react";

interface ReturnHeaderProps {
 onAddClick: () => void;
}

export const ReturnHeader: React.FC<ReturnHeaderProps> = ({ onAddClick }) => {
 return (
 <div className="flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-2 @[640px]:gap-3">
 <div className="flex items-center gap-3 @[1024px]:gap-6">
 <div>
  <h1 className="text-base @[480px]:text-lg @[640px]:text-xl @[1024px]:text-2xl font-bold text-gray-900">Purchase Returns</h1>
  <p className="text-gray-600 text-[11px] @[480px]:text-xs @[640px]:text-sm">Return faulty stock to supplier</p>
 </div>
 </div>
 <div className="flex items-center gap-1.5 @[640px]:gap-2 @[1024px]:gap-3 flex-wrap">
 <button className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
  <Download className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
 </button>
 <button className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
  <Upload className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
 </button>
 <button
  onClick={onAddClick}
  className="flex items-center gap-1.5 @[640px]:gap-2 bg-orange-500 text-white px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 rounded-lg hover:bg-orange-600 text-xs @[640px]:text-sm whitespace-nowrap"
 >
  <Plus className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
  <span className="hidden @[480px]:inline">Return to supplier</span>
 </button>
 <button className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
  <MoreHorizontal className="h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
 </button>
 </div>
 </div>
 );
};

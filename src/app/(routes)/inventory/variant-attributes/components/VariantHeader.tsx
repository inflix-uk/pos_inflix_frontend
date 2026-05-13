"use client";

import React from "react";
import { Plus, FileText, RotateCcw, ChevronRight } from "lucide-react";

interface VariantHeaderProps {
 onAddClick: () => void;
 onRefresh: () => void;
}

export const VariantHeader: React.FC<VariantHeaderProps> = ({
 onAddClick,
 onRefresh,
}) => {
 return (
 <div className="mb-4 @[640px]:mb-8">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="min-w-0">
  <h1 className="text-lg @[640px]:text-2xl font-semibold text-gray-900">Variant Attributes</h1>
  <p className="text-[11px] @[640px]:text-base text-gray-600 mt-0.5 @[640px]:mt-1">Manage product variants and their values</p>
 </div>
 <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-3">
  <button className="hidden @[640px]:flex p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 items-center justify-center">
  <FileText size={20} />
  </button>
  <button className="hidden @[640px]:flex p-2 text-green-600 hover:bg-green-50 rounded-lg border border-gray-200 items-center justify-center">
  <FileText size={20} />
  </button>
  <button
  className="p-1.5 @[640px]:p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
  onClick={onRefresh}
  aria-label="Refresh"
  >
  <RotateCcw size={16} className="@[640px]:hidden" />
  <RotateCcw size={20} className="hidden @[640px]:inline" />
  </button>
  <button className="hidden @[640px]:flex p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 items-center justify-center">
  <span className="inline-block rotate-180">
  <ChevronRight size={20} />
  </span>
  </button>
  <button
  className="bg-orange-500 hover:bg-orange-600 text-white px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 rounded-lg flex items-center gap-1.5 @[640px]:gap-2 text-xs @[640px]:text-base"
  onClick={onAddClick}
  >
  <Plus size={16} className="@[640px]:hidden" />
  <Plus size={20} className="hidden @[640px]:inline" />
  <span className="hidden @[420px]:inline">Add Variant</span>
  <span className="@[420px]:hidden">Add</span>
  </button>
 </div>
 </div>
 </div>
 );
};

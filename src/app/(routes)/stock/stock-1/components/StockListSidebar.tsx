"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Search, X } from "lucide-react";
import type { StockListFilters, StockListFilterOptions } from "../hooks/useStockList";
import { DEFAULT_FILTERS } from "../hooks/useStockList";

const ALL = "";

const EMPTY_OPTIONS: StockListFilterOptions = {
 dimensions: [],
 categories: [],
 subCategories: [],
 manufacturers: [],
 models: [],
 grades: [],
 capacities: [],
 colours: [],
};

interface StockListSidebarProps {
 filters?: StockListFilters | null;
 filterOptions?: StockListFilterOptions | null;
 onFilterChange: (key: keyof StockListFilters, value: string) => void;
 onClearFilters: () => void;
 embed?: boolean;
}

function GroupingSection({
 title,
 defaultOpen,
 children,
}: {
 title: string;
 defaultOpen: boolean;
 children: React.ReactNode;
}) {
 const [open, setOpen] = useState(defaultOpen);
 return (
 <div className="border-b border-gray-100 last:border-b-0">
 <button
 type="button"
 onClick={() => setOpen(!open)}
 className="w-full flex items-center justify-between py-3 px-0 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
 >
 {title}
 {open ? (
  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
 ) : (
  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
 )}
 </button>
 {open && <div className="space-y-3 pb-4">{children}</div>}
 </div>
 );
}

function FilterSelect({
 label,
 value,
 options,
 onChange,
}: {
 label: string;
 value: string;
 options: string[];
 onChange: (value: string) => void;
}) {
 return (
 <div>
 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
 <select
 value={value}
 onChange={(e) => onChange(e.target.value)}
 className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
 >
 <option value={ALL}>All</option>
 {options.map((opt) => (
  <option key={opt} value={opt}>
  {opt}
  </option>
 ))}
 </select>
 </div>
 );
}

export function StockListSidebar({
 filters = DEFAULT_FILTERS,
 filterOptions = EMPTY_OPTIONS,
 onFilterChange,
 onClearFilters,
 embed = false,
}: StockListSidebarProps) {
 const f = filters ?? DEFAULT_FILTERS;
 const opts = filterOptions ?? EMPTY_OPTIONS;

 return (
 <aside className="w-full flex flex-col">
 <div>
 <div className="flex items-center justify-between mb-3">
  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
  Filters
  </span>
  <button
  type="button"
  onClick={onClearFilters}
  className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700"
  >
  <RotateCcw className="w-3.5 h-3.5" />
  Clear
  </button>
 </div>
 <div className="mb-4">
  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Search</label>
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
  <input
   type="text"
   value={f.search ?? ""}
   onChange={(e) => onFilterChange("search", e.target.value)}
   placeholder="Search any product…"
   className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
  />
  {f.search && (
   <button
   type="button"
   onClick={() => onFilterChange("search", "")}
   className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
   aria-label="Clear search"
   >
   <X className="h-3.5 w-3.5" />
   </button>
  )}
  </div>
 </div>
 <GroupingSection title="Group by" defaultOpen={true}>
  {(opts.dimensions ?? []).map((dim) => (
  <FilterSelect
  key={dim.key}
  label={dim.label}
  value={f[dim.key] ?? ""}
  options={dim.options}
  onChange={(v) => onFilterChange(dim.key as keyof StockListFilters, v)}
  />
  ))}
 </GroupingSection>
 </div>
 </aside>
 );
}

"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Search, Package, PackagePlus, Plus } from "lucide-react";
import { getLucideIconByName } from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/HelpTip";
import type { POSProduct } from "../types";

const SUGGESTIONS_MAX = 8;

/** Neutral POS card chrome — single accent for active category only. */
const NEUTRAL_THEME = {
 border: "border-slate-200",
 bg: "bg-white",
 hover: "hover:border-slate-300 hover:bg-slate-50",
 iconBg: "bg-slate-100",
 iconFg: "text-slate-600",
 price: "text-slate-900",
 badge: "bg-slate-100 text-slate-600",
 tab: "border-slate-200 text-slate-600 bg-white hover:bg-slate-50",
 tabActive: "bg-slate-900 text-white border-slate-900",
} as const;

/* ── Scrollable single-row category strip with arrow buttons ── */
function CategoryStrip({
 categories,
 categoryFilter,
 onCategoryChange,
 embedded,
 onAddManualItem,
}: {
 categories: string[];
 categoryFilter: string;
 onCategoryChange: (v: string) => void;
 embedded?: boolean;
 onAddManualItem?: () => void;
}) {
 return (
 <div
 className={cn(
 "relative border-b border-slate-100 bg-white",
 embedded ? "px-1.5 py-1.5 sm:px-2" : "px-1.5 py-2 sm:px-2.5"
 )}
 >
 <div className="flex flex-wrap items-center gap-1">
  {categories.map((cat) => {
  const isActive = categoryFilter === cat;
  return (
  <button
  key={cat}
  type="button"
  onClick={() => onCategoryChange(cat)}
  className={cn(
  "touch-manipulation rounded-md font-medium whitespace-nowrap transition-colors border",
  "min-h-[28px] px-2.5 py-1 text-[11px] @[480px]/pg:min-h-[30px] @[480px]/pg:px-3 @[480px]/pg:text-xs @[768px]/pg:min-h-[32px]",
  isActive ? NEUTRAL_THEME.tabActive : NEUTRAL_THEME.tab
  )}
  >
  {cat === "all" ? "All" : cat}
  </button>
  );
  })}

 {/* Add manual item button (non-embedded only) */}
 {onAddManualItem && !embedded && (
  <button
  type="button"
  onClick={onAddManualItem}
  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition @[480px]/pg:text-xs"
  >
  <PackagePlus className="h-3.5 w-3.5 text-slate-500" />
  Manual item
  </button>
 )}
 </div>
 </div>
 );
}

interface ProductGridProps {
 products: POSProduct[];
 categories: string[];
 search: string;
 categoryFilter: string;
 onSearch: (v: string) => void;
 onCategoryChange: (v: string) => void;
 onAddToCart: (product: POSProduct, qty?: number) => void;
 onAddManualItem?: () => void;
 onSearchSuggestionSelect?: (product: POSProduct) => void;
 onSearchSubmit?: (term: string) => void | Promise<void>;
 hideSearch?: boolean;
 categoryIcons?: Record<string, string>;
 /** Show shimmer placeholders instead of "No products" when true */
 loading?: boolean;
 /** "icon" (default): coloured-icon tile. "pos": Eposnow-style dark-blue top + white bottom strip with price. */
 tileStyle?: "icon" | "pos";
 /** Show on-hand inventory (qty) on each product card. Enable when "Block negative stock" is on. */
 showStock?: boolean;
 /** Extra hint when the grid is empty (e.g. location filter, serial-only stock). */
 emptyStateHint?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
 products,
 categories,
 search,
 categoryFilter,
 onSearch,
 onCategoryChange,
 onAddToCart,
 onAddManualItem,
 onSearchSuggestionSelect,
 onSearchSubmit,
 hideSearch = false,
 categoryIcons = {},
 loading = false,
 tileStyle = "icon",
 showStock = false,
 emptyStateHint,
}) => {
 const [showSuggestions, setShowSuggestions] = useState(false);
 const searchContainerRef = useRef<HTMLDivElement>(null);

 const suggestions = useMemo(() => {
 if (!search.trim()) return [];
 return products.slice(0, SUGGESTIONS_MAX);
 }, [products, search]);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
 setShowSuggestions(false);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleSuggestionClick = (product: POSProduct) => {
 if (onSearchSuggestionSelect) {
 onSearchSuggestionSelect(product);
 setShowSuggestions(false);
 } else {
 onAddToCart(product);
 setShowSuggestions(false);
 }
 };

 /** Embedded in retail panel: parent already has chrome — avoid double border; compact chrome. */
 const embedded = hideSearch;

 return (
 <div
 className={cn(
 "@container/pg flex h-full min-h-0 flex-col overflow-hidden",
 embedded
  ? "rounded-lg bg-transparent"
  : "rounded-lg border border-gray-200/80 bg-white"
 )}
 >
 {!hideSearch && (
 <div className="border-b border-neutral-100/80 bg-white p-3 sm:p-4" ref={searchContainerRef}>
  <div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
  <input
  type="search"
  placeholder="Search by name, SKU, barcode or serial number..."
  value={search}
  onChange={(e) => {
  onSearch(e.target.value);
  setShowSuggestions(true);
  }}
  onFocus={() => search.trim() && setShowSuggestions(true)}
  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
  onKeyDown={async (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const term = search.trim();
  if (!term) return;
  if (onSearchSubmit) {
   await onSearchSubmit(term);
   return;
  }
  if (suggestions.length > 0) {
   handleSuggestionClick(suggestions[0]);
  }
  }}
  className="w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 pl-9 pr-4 text-sm shadow-inner transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/35 sm:py-3 sm:text-base"
  aria-label="Search products"
  aria-autocomplete="list"
  aria-expanded={showSuggestions && suggestions.length > 0}
  />
  {showSuggestions && suggestions.length > 0 && (
  <ul
  className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-neutral-200/90 bg-white py-1"
  role="listbox"
  >
  {suggestions.map((product) => (
   <li
   key={product.sku}
   role="option"
   className="flex cursor-pointer flex-col gap-0.5 border-b border-gray-100 px-4 py-2.5 last:border-b-0 hover:bg-neutral-50/80"
   onMouseDown={(e) => {
   e.preventDefault();
   handleSuggestionClick(product);
   }}
   >
   <span className="truncate font-medium text-gray-900">{product.name}</span>
   <span className="flex items-center gap-3 text-xs text-gray-500">
   <span className="font-semibold text-neutral-700">{product.price}</span>
   {(product.barcode || product.serialNumber) && (
   <span className="truncate font-mono">
    {product.barcode ? `Barcode: ${product.barcode}` : `SN: ${product.serialNumber}`}
   </span>
   )}
   </span>
   </li>
  ))}
  </ul>
  )}
  </div>
 </div>
 )}

 <CategoryStrip
 categories={categories}
 categoryFilter={categoryFilter}
 onCategoryChange={onCategoryChange}
 embedded={embedded}
 onAddManualItem={onAddManualItem}
 />

 <div className={cn("flex-1 min-h-0 touch-scroll overflow-y-auto overflow-x-hidden", embedded ? "p-1.5 @[480px]/pg:p-2" : "p-2 @[480px]/pg:p-3")}>
 <div className="grid grid-cols-2 gap-1.5 @[420px]/pg:gap-2 @[640px]/pg:grid-cols-3 @[900px]/pg:grid-cols-4 @[1200px]/pg:grid-cols-5">
  {products.map((product) => {
  if (tileStyle === "pos") {
   return (
   <button
    key={product.sku}
    type="button"
    onClick={() => onAddToCart(product)}
    className="group relative flex h-full min-h-[78px] w-full touch-manipulation flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-colors active:scale-[0.98] hover:border-slate-300 hover:bg-slate-50 @[480px]/pg:min-h-[88px]"
   >
    <div className="flex-1 min-h-0 bg-slate-800 px-2.5 py-2">
    <span className="line-clamp-3 text-[11px] font-semibold leading-snug text-white @[480px]/pg:text-xs">
     {product.name}
    </span>
    </div>
    <div className="bg-white border-t border-slate-100 px-2.5 py-1.5">
    <span className="text-xs font-semibold tabular-nums text-slate-900 @[480px]/pg:text-sm">
     {product.price}
    </span>
    </div>
    {showStock && (
    <span
    className={cn(
     "absolute left-1.5 top-1.5 rounded px-1 py-[1px] text-[9px] font-bold tabular-nums leading-none",
     product.qty <= 0
     ? "bg-red-600 text-white"
     : product.qty <= 5
     ? "bg-amber-100 text-amber-900"
     : "bg-emerald-100 text-emerald-800"
    )}
    title={`In stock: ${product.qty}`}
    >
     {product.qty}
    </span>
    )}
    <span
    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 transition group-hover:opacity-100"
    aria-hidden
    >
    <Plus className="h-3 w-3" strokeWidth={2.5} />
    </span>
   </button>
   );
  }
  return (
  <button
  key={product.sku}
  type="button"
  onClick={() => onAddToCart(product)}
  className={cn(
   "group relative flex h-full min-h-[88px] w-full touch-manipulation flex-col items-stretch rounded-lg border p-2 text-left transition-colors active:scale-[0.98] @[480px]/pg:min-h-[96px] @[480px]/pg:p-2.5",
   NEUTRAL_THEME.bg,
   NEUTRAL_THEME.border,
   NEUTRAL_THEME.hover
  )}
  >
  {showStock && (
   <span
   className={cn(
    "absolute right-1.5 top-1.5 rounded px-1 py-[1px] text-[9px] font-bold tabular-nums leading-none",
    product.qty <= 0
    ? "bg-red-600 text-white"
    : product.qty <= 5
    ? "bg-amber-100 text-amber-900"
    : "bg-emerald-100 text-emerald-800"
   )}
   title={`In stock: ${product.qty}`}
   >
   {product.qty}
   </span>
  )}
  <div className="mb-1.5 flex items-center gap-2">
   <div
   className={cn(
   "flex h-7 w-7 shrink-0 items-center justify-center rounded-md @[480px]/pg:h-8 @[480px]/pg:w-8",
   NEUTRAL_THEME.iconBg
   )}
   >
   {(() => {
   const iconName = product.category ? categoryIcons[product.category] : undefined;
   const CategoryIcon = iconName ? getLucideIconByName(iconName) : null;
   return CategoryIcon ? (
   <CategoryIcon className={cn("h-3.5 w-3.5 @[480px]/pg:h-4 @[480px]/pg:w-4", NEUTRAL_THEME.iconFg)} />
   ) : (
   <Package className={cn("h-3.5 w-3.5 @[480px]/pg:h-4 @[480px]/pg:w-4", NEUTRAL_THEME.iconFg)} />
   );
   })()}
   </div>
   <span className="line-clamp-2 min-w-0 flex-1 text-[11px] font-semibold leading-snug text-slate-900 @[480px]/pg:text-xs">
   {product.name}
   </span>
  </div>
  <div className="mt-auto flex w-full items-end justify-between gap-1 pt-1">
   <span className={cn("text-sm font-semibold tabular-nums @[480px]/pg:text-[15px]", NEUTRAL_THEME.price)}>
   {product.price}
   </span>
   {product.category && (
   <span
   className={cn(
   "max-w-[45%] truncate rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
   NEUTRAL_THEME.badge
   )}
   title={product.category}
   >
   {product.category}
   </span>
   )}
  </div>
  {(product.barcode || product.serialNumber) && (
   <span
   className="mt-0.5 w-full truncate font-mono text-[9px] text-slate-400"
   title={product.barcode ? `Barcode: ${product.barcode}` : `SN: ${product.serialNumber}`}
   >
   {product.barcode || product.serialNumber}
   </span>
  )}
  </button>
  );
  })}
 </div>
 {loading && products.length === 0 && (
  <div className="grid grid-cols-2 gap-2 @[640px]/pg:grid-cols-3 @[900px]/pg:grid-cols-4">
  {Array.from({ length: 12 }).map((_, i) => (
  <div key={i} className="flex min-h-[88px] flex-col rounded-lg border border-slate-200 bg-white p-2.5 animate-pulse">
  <div className="mb-2 flex items-center gap-2">
   <div className="h-8 w-8 rounded-md bg-slate-200" />
   <div className="h-3 flex-1 rounded bg-slate-200" />
  </div>
  <div className="mt-auto h-4 w-16 rounded bg-slate-200" />
  </div>
  ))}
  </div>
 )}
 {!loading && products.length === 0 && (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-14 text-slate-500">
  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
  <Package className="h-6 w-6" />
  </div>
  <div className="flex flex-col items-center gap-2">
  <p className="text-sm font-semibold text-slate-700">No products match</p>
  {emptyStateHint ? (
   <p className="text-xs text-slate-500 max-w-sm text-center mt-1">{emptyStateHint}</p>
  ) : (
   <HelpTip ariaLabel="No results" contentClassName="text-center">
    Try another category or search term.
   </HelpTip>
  )}
  </div>
  </div>
 )}
 </div>
 </div>
 );
};

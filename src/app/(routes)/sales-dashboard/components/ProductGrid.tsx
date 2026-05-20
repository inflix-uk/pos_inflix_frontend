"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Search, Package, PackagePlus, Plus } from "lucide-react";
import { getLucideIconByName } from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/HelpTip";
import type { POSProduct } from "../types";

const SUGGESTIONS_MAX = 8;

/** Stable colorful themes per category name (hash) — matches app accent style. */
const CARD_THEMES = [
 {
 border: "border-blue-300",
 bg: "bg-blue-50/25",
 hover: "hover:bg-blue-100/70 hover:border-blue-400",
 iconBg: "bg-blue-500",
 iconFg: "text-white",
 price: "text-blue-900",
 badge: "bg-blue-100 text-blue-900 ring-1 ring-blue-200",
 tab: "border-blue-300 text-blue-700 bg-blue-50",
 tabActive: "bg-blue-600 text-white border-blue-600",
 },
 {
 border: "border-emerald-300",
 bg: "bg-emerald-50/25",
 hover: "hover:bg-emerald-100/70 hover:border-emerald-400",
 iconBg: "bg-emerald-500",
 iconFg: "text-white",
 price: "text-emerald-900",
 badge: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
 tab: "border-emerald-300 text-emerald-700 bg-emerald-50",
 tabActive: "bg-emerald-600 text-white border-emerald-600",
 },
 {
 border: "border-amber-300",
 bg: "bg-amber-50/25",
 hover: "hover:bg-amber-100/70 hover:border-amber-400",
 iconBg: "bg-amber-500",
 iconFg: "text-white",
 price: "text-amber-900",
 badge: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
 tab: "border-amber-300 text-amber-800 bg-amber-50",
 tabActive: "bg-amber-500 text-white border-amber-500",
 },
 {
 border: "border-rose-300",
 bg: "bg-rose-50/25",
 hover: "hover:bg-rose-100/70 hover:border-rose-400",
 iconBg: "bg-rose-500",
 iconFg: "text-white",
 price: "text-rose-900",
 badge: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
 tab: "border-rose-300 text-rose-700 bg-rose-50",
 tabActive: "bg-rose-600 text-white border-rose-600",
 },
 {
 border: "border-violet-300",
 bg: "bg-violet-50/25",
 hover: "hover:bg-violet-100/70 hover:border-violet-400",
 iconBg: "bg-violet-500",
 iconFg: "text-white",
 price: "text-violet-900",
 badge: "bg-violet-100 text-violet-900 ring-1 ring-violet-200",
 tab: "border-violet-300 text-violet-700 bg-violet-50",
 tabActive: "bg-violet-600 text-white border-violet-600",
 },
 {
 border: "border-cyan-300",
 bg: "bg-cyan-50/25",
 hover: "hover:bg-cyan-100/70 hover:border-cyan-400",
 iconBg: "bg-cyan-500",
 iconFg: "text-white",
 price: "text-cyan-900",
 badge: "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200",
 tab: "border-cyan-300 text-cyan-700 bg-cyan-50",
 tabActive: "bg-cyan-600 text-white border-cyan-600",
 },
 {
 border: "border-fuchsia-300",
 bg: "bg-fuchsia-50/25",
 hover: "hover:bg-fuchsia-100/70 hover:border-fuchsia-400",
 iconBg: "bg-fuchsia-500",
 iconFg: "text-white",
 price: "text-fuchsia-900",
 badge: "bg-fuchsia-100 text-fuchsia-900 ring-1 ring-fuchsia-200",
 tab: "border-fuchsia-300 text-fuchsia-700 bg-fuchsia-50",
 tabActive: "bg-fuchsia-600 text-white border-fuchsia-600",
 },
 {
 border: "border-teal-300",
 bg: "bg-teal-50/25",
 hover: "hover:bg-teal-100/70 hover:border-teal-400",
 iconBg: "bg-teal-500",
 iconFg: "text-white",
 price: "text-teal-900",
 badge: "bg-teal-100 text-teal-900 ring-1 ring-teal-200",
 tab: "border-teal-300 text-teal-700 bg-teal-50",
 tabActive: "bg-teal-600 text-white border-teal-600",
 },
] as const;

function themeForCategory(category: string | undefined): (typeof CARD_THEMES)[number] {
 const key = (category || "General").toLowerCase();
 let idx = 0;
 for (let i = 0; i < key.length; i++) idx = (idx + key.charCodeAt(i)) % CARD_THEMES.length;
 return CARD_THEMES[idx]!;
}

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
 "relative border-b border-gray-100/90 bg-white",
 embedded ? "px-1.5 py-2 sm:px-2" : "px-1.5 py-2.5 sm:px-2.5"
 )}
 >
 <div className="flex flex-wrap items-center gap-1.5">
  {categories.map((cat) => {
  const theme = themeForCategory(cat);
  const isActive = categoryFilter === cat;
  return (
  <button
  key={cat}
  type="button"
  onClick={() => onCategoryChange(cat)}
  className={cn(
  "touch-manipulation rounded-lg font-semibold whitespace-nowrap transition-all border shadow-sm",
  "min-h-[36px] px-3 py-1.5 text-[13px] @[480px]/pg:min-h-[40px] @[480px]/pg:px-3.5 @[480px]/pg:py-2 @[480px]/pg:text-sm @[768px]/pg:min-h-[44px] @[768px]/pg:px-4 @[768px]/pg:py-2 @[768px]/pg:text-[15px]",
  cat === "all"
   ? (isActive ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50")
   : (isActive ? theme.tabActive : theme.tab + " hover:brightness-95")
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
  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 transition sm:text-sm"
  >
  <PackagePlus className="h-3.5 w-3.5 text-neutral-600" />
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

 <div className={cn("flex-1 min-h-0 touch-scroll overflow-y-auto overflow-x-hidden", embedded ? "p-1.5 @[480px]/pg:p-2 @[768px]/pg:p-2.5" : "p-2 @[480px]/pg:p-3 @[768px]/pg:p-4")}>
 <div className="grid grid-cols-2 gap-1.5 @[420px]/pg:gap-2 @[640px]/pg:grid-cols-3 @[640px]/pg:gap-2.5 @[900px]/pg:grid-cols-4 @[1200px]/pg:grid-cols-5">
  {products.map((product) => {
  const theme = themeForCategory(product.category);
  if (tileStyle === "pos") {
   return (
   <button
    key={product.sku}
    type="button"
    onClick={() => onAddToCart(product)}
    className="group relative flex h-full min-h-[78px] w-full touch-manipulation flex-col overflow-hidden rounded-md border border-slate-900/10 bg-white text-left shadow-sm transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md @[480px]/pg:min-h-[92px] @[480px]/pg:rounded-lg @[768px]/pg:min-h-[100px]"
   >
    <div className="flex-1 min-h-0 bg-[#1e2a78] px-2 py-1.5 @[480px]/pg:px-2.5 @[480px]/pg:py-2">
    <span className="line-clamp-3 text-[10px] font-semibold leading-tight text-white @[480px]/pg:text-[11px] @[768px]/pg:text-xs">
     {product.name}
    </span>
    </div>
    <div className="bg-white border-t border-slate-900/10 px-2 py-1 @[480px]/pg:px-2.5 @[480px]/pg:py-1.5">
    <span className="text-[11px] font-semibold tabular-nums text-slate-900 @[480px]/pg:text-xs @[768px]/pg:text-sm">
     {product.price}
    </span>
    </div>
    {showStock && (
    <span
    className={cn(
     "absolute left-1 top-1 rounded px-1 py-[1px] text-[9px] font-bold tabular-nums leading-none ring-1",
     product.qty <= 0
     ? "bg-red-600 text-white ring-red-700"
     : product.qty <= 5
     ? "bg-amber-100 text-amber-900 ring-amber-300"
     : "bg-emerald-100 text-emerald-900 ring-emerald-300"
    )}
    title={`In stock: ${product.qty}`}
    >
     {product.qty}
    </span>
    )}
    <span
    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-700 opacity-0 shadow-sm ring-1 ring-slate-200 transition group-hover:opacity-100"
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
   "group relative flex h-full min-h-[96px] w-full touch-manipulation flex-col items-center rounded-md border p-1.5 pb-1 text-center transition-all active:scale-[0.98] @[480px]/pg:min-h-[110px] @[480px]/pg:rounded-lg @[480px]/pg:border-2 @[480px]/pg:p-2 @[768px]/pg:min-h-[120px]",
   theme.bg,
   theme.border,
   theme.hover,
   "shadow-sm hover:-translate-y-0.5 hover:shadow-lg"
  )}
  >
  {showStock && (
   <span
   className={cn(
    "absolute left-1 top-1 rounded px-1 py-[1px] text-[9px] font-bold tabular-nums leading-none ring-1 @[480px]/pg:left-1.5 @[480px]/pg:top-1.5 @[480px]/pg:text-[10px]",
    product.qty <= 0
    ? "bg-red-600 text-white ring-red-700"
    : product.qty <= 5
    ? "bg-amber-100 text-amber-900 ring-amber-300"
    : "bg-emerald-100 text-emerald-900 ring-emerald-300"
   )}
   title={`In stock: ${product.qty}`}
   >
   {product.qty}
   </span>
  )}
  <span
   className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-600 opacity-0 shadow-sm ring-1 ring-gray-200/80 transition group-hover:opacity-100 sm:right-2 sm:top-2"
   aria-hidden
  >
   <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
  </span>
  <div
   className={cn(
   "mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md @[480px]/pg:mb-1.5 @[480px]/pg:h-8 @[480px]/pg:w-8 @[480px]/pg:rounded-lg",
   theme.iconBg
   )}
  >
   {(() => {
   const iconName = product.category ? categoryIcons[product.category] : undefined;
   const CategoryIcon = iconName ? getLucideIconByName(iconName) : null;
   return CategoryIcon ? (
   <CategoryIcon className={cn("h-3 w-3 @[480px]/pg:h-4 @[480px]/pg:w-4", theme.iconFg)} />
   ) : (
   <Package className={cn("h-3 w-3 @[480px]/pg:h-4 @[480px]/pg:w-4", theme.iconFg)} />
   );
   })()}
  </div>
  <div className="flex min-h-[1.75rem] w-full flex-shrink-0 items-start justify-center px-0.5 @[480px]/pg:min-h-[2.125rem]">
   <span className="line-clamp-2 w-full text-[9px] font-semibold leading-tight text-gray-900 @[480px]/pg:text-[10px] @[768px]/pg:text-[11px]">
   {product.name}
   </span>
  </div>
  <div className="mt-auto flex w-full flex-shrink-0 flex-col items-center gap-0 pt-0.5 @[480px]/pg:gap-0.5">
   <span className={cn("text-[11px] font-bold tabular-nums @[480px]/pg:text-xs @[768px]/pg:text-sm", theme.price)}>
   {product.price}
   </span>
   {product.category && (
   <span
   className={cn(
   "inline-flex max-w-full justify-center truncate rounded px-1 py-0 text-center text-[8px] font-semibold uppercase leading-tight tracking-wide @[480px]/pg:px-1.5 @[480px]/pg:text-[9px]",
   theme.badge
   )}
   title={product.category}
   >
   {product.category}
   </span>
   )}
   {product.barcode && (
   <span
   className="w-full truncate text-center font-mono text-[9px] text-gray-500 sm:text-[10px]"
   title={`Barcode: ${product.barcode}`}
   >
   {product.barcode}
   </span>
   )}
   {!product.barcode && product.serialNumber && (
   <span
   className="w-full truncate text-center font-mono text-[9px] text-gray-400 sm:text-[10px]"
   title={`SN: ${product.serialNumber}`}
   >
   {product.serialNumber}
   </span>
   )}
  </div>
  </button>
  );
  })}
 </div>
 {loading && products.length === 0 && (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {Array.from({ length: 12 }).map((_, i) => (
  <div key={i} className="flex min-h-[158px] flex-col items-center rounded-xl border-2 border-gray-200/60 bg-white p-2.5 sm:min-h-[168px] sm:rounded-lg sm:p-3 animate-pulse">
  <div className="mb-1.5 h-10 w-10 rounded-lg bg-gray-200 sm:mb-2 sm:h-11 sm:w-11" />
  <div className="h-3 w-3/4 rounded bg-gray-200 mt-1" />
  <div className="h-3 w-1/2 rounded bg-gray-200 mt-1.5" />
  <div className="mt-auto flex flex-col items-center gap-1 pt-2 w-full">
   <div className="h-4 w-16 rounded bg-gray-200" />
   <div className="h-3 w-12 rounded bg-gray-100" />
  </div>
  </div>
  ))}
  </div>
 )}
 {!loading && products.length === 0 && (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-14 text-gray-500">
  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500 text-white">
  <Package className="h-7 w-7 opacity-95" />
  </div>
  <div className="flex flex-col items-center gap-2">
  <p className="text-sm font-semibold text-gray-700">No products match</p>
  <HelpTip ariaLabel="No results" contentClassName="text-center">
  Try another category or search term.
  </HelpTip>
  </div>
  </div>
 )}
 </div>
 </div>
 );
};

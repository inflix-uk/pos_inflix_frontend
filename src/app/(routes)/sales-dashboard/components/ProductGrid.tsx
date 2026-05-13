"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Search, Package, PackagePlus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getLucideIconByName } from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/HelpTip";
import type { POSProduct } from "../types";

const SUGGESTIONS_MAX = 8;

/** Stable colorful themes per category name (hash) — matches app accent style. */
const CARD_THEMES = [
 {
 border: "border-neutral-200/90",
 bg: "bg-white",
 hover: "hover:border-neutral-300",
 iconBg: "bg-orange-500",
 iconFg: "text-white",
 price: "text-neutral-800",
 badge: "bg-neutral-100/90 text-neutral-900 ring-1 ring-neutral-200",
 },
 {
 border: "border-neutral-200/90",
 bg: "bg-white",
 hover: "hover:border-neutral-300",
 iconBg: "bg-orange-500",
 iconFg: "text-white",
 price: "text-neutral-800",
 badge: "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200",
 },
 {
 border: "border-neutral-200/90",
 bg: "bg-white",
 hover: "hover:border-neutral-300",
 iconBg: "bg-orange-500",
 iconFg: "text-white",
 price: "text-neutral-900",
 badge: "bg-neutral-100/90 text-amber-950 ring-1 ring-amber-200/80",
 },
 {
 border: "border-neutral-200/90",
 bg: "bg-white",
 hover: "hover:border-neutral-300",
 iconBg: "bg-orange-500",
 iconFg: "text-white",
 price: "text-emerald-900",
 badge: "bg-emerald-100/90 text-emerald-950 ring-1 ring-emerald-200/80",
 },
 {
 border: "border-rose-200/90",
 bg: "bg-white",
 hover: "hover:border-neutral-300",
 iconBg: "bg-orange-500",
 iconFg: "text-white",
 price: "text-rose-900",
 badge: "bg-rose-100/90 text-rose-950 ring-1 ring-rose-200/80",
 },
 {
 border: "border-neutral-200/90",
 bg: "bg-white",
 hover: "hover:border-neutral-300",
 iconBg: "bg-orange-500",
 iconFg: "text-white",
 price: "text-neutral-900",
 badge: "bg-neutral-100/90 text-neutral-900 ring-1 ring-neutral-200",
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
 const scrollRef = useRef<HTMLDivElement>(null);
 const [canScrollLeft, setCanScrollLeft] = useState(false);
 const [canScrollRight, setCanScrollRight] = useState(false);
 const dragState = useRef<{ down: boolean; startX: number; scrollLeft: number; moved: boolean }>({ down: false, startX: 0, scrollLeft: 0, moved: false });

 const checkScroll = () => {
 const el = scrollRef.current;
 if (!el) return;
 setCanScrollLeft(el.scrollLeft > 2);
 setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
 };

 useEffect(() => {
 checkScroll();
 const el = scrollRef.current;
 if (!el) return;
 el.addEventListener("scroll", checkScroll, { passive: true });
 const ro = new ResizeObserver(checkScroll);
 ro.observe(el);
 return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
 }, [categories.length]);

 const scroll = (dir: "left" | "right") => {
 const el = scrollRef.current;
 if (!el) return;
 el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
 };

 // Mouse drag-to-scroll — defer pointer capture until actual drag so button clicks still fire
 const onPointerDown = (e: React.PointerEvent) => {
 const el = scrollRef.current;
 if (!el) return;
 dragState.current = { down: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
 el.style.cursor = "grabbing";
 };
 const onPointerMove = (e: React.PointerEvent) => {
 if (!dragState.current.down) return;
 const dx = e.clientX - dragState.current.startX;
 if (Math.abs(dx) > 3) {
 if (!dragState.current.moved) {
 dragState.current.moved = true;
 scrollRef.current?.setPointerCapture(e.pointerId);
 }
 }
 scrollRef.current!.scrollLeft = dragState.current.scrollLeft - dx;
 };
 const onPointerUp = (e: React.PointerEvent) => {
 if (!dragState.current.down) return;
 dragState.current.down = false;
 const el = scrollRef.current;
 if (el) {
 try { el.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
 el.style.cursor = "";
 }
 };

 return (
 <div
 className={cn(
 "relative border-b border-gray-100/90 bg-white",
 embedded ? "px-1 py-1.5 sm:px-1.5" : "px-1 py-2 sm:px-2"
 )}
 >
 <div className="flex items-center gap-1">
 {/* Left arrow */}
 <button
  type="button"
  onClick={() => scroll("left")}
  className={cn(
  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all",
  !canScrollLeft && "opacity-30 pointer-events-none"
  )}
  aria-label="Scroll categories left"
  tabIndex={-1}
 >
  <ChevronLeft className="h-4 w-4" />
 </button>

 {/* Scrollable category row — drag or touch to scroll */}
 <div
  ref={scrollRef}
  className="flex-1 min-w-0 overflow-x-auto scrollbar-hide flex items-center gap-1.5 cursor-grab select-none touch-scroll"
  onPointerDown={onPointerDown}
  onPointerMove={onPointerMove}
  onPointerUp={onPointerUp}
  onPointerCancel={onPointerUp}
 >
  {categories.map((cat) => (
  <button
  key={cat}
  type="button"
  onClick={(e) => { if (dragState.current.moved) { e.preventDefault(); return; } onCategoryChange(cat); }}
  className={cn(
  "touch-manipulation rounded-lg font-medium whitespace-nowrap transition-all flex-shrink-0",
  "min-h-[32px] px-2.5 py-1 text-xs sm:min-h-[34px] sm:px-3 sm:py-1.5 sm:text-sm",
  categoryFilter === cat
   ? "bg-blue-600 text-white shadow-sm"
   : cat === "all"
   ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
   : cn("border bg-white text-gray-700 hover:bg-gray-50", themeForCategory(cat).border)
  )}
  >
  {cat === "all" ? "All" : cat}
  </button>
  ))}
 </div>

 {/* Right arrow */}
 <button
  type="button"
  onClick={() => scroll("right")}
  className={cn(
  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all",
  !canScrollRight && "opacity-30 pointer-events-none"
  )}
  aria-label="Scroll categories right"
  tabIndex={-1}
 >
  <ChevronRight className="h-4 w-4" />
 </button>

 {/* Add manual item button (non-embedded only) */}
 {onAddManualItem && !embedded && (
  <>
  <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
  <button
  type="button"
  onClick={onAddManualItem}
  className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 transition sm:text-sm"
  >
  <PackagePlus className="h-3.5 w-3.5 text-neutral-600" />
  Manual item
  </button>
  </>
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
 "flex h-full min-h-0 flex-col overflow-hidden",
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

 <div className={cn("flex-1 min-h-0 touch-scroll overflow-y-auto overflow-x-hidden", embedded ? "p-2 sm:p-2.5" : "p-3 sm:p-4")}>
 <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {products.map((product) => {
  const theme = themeForCategory(product.category);
  return (
  <button
  key={product.sku}
  type="button"
  onClick={() => onAddToCart(product)}
  className={cn(
   "group relative flex h-full min-h-[158px] w-full touch-manipulation flex-col items-center rounded-xl border-2 p-2.5 pb-2 text-center transition-all active:scale-[0.98] sm:min-h-[168px] sm:rounded-lg sm:p-3 sm:pb-2.5",
   theme.bg,
   theme.border,
   theme.hover,
   "shadow-sm hover:-translate-y-0.5 hover:shadow-lg"
  )}
  >
  <span
   className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-600 opacity-0 shadow-sm ring-1 ring-gray-200/80 transition group-hover:opacity-100 sm:right-2 sm:top-2"
   aria-hidden
  >
   <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
  </span>
  <div
   className={cn(
   "mb-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:mb-2 sm:h-11 sm:w-11 sm:rounded-xl",
   theme.iconBg
   )}
  >
   {(() => {
   const iconName = product.category ? categoryIcons[product.category] : undefined;
   const CategoryIcon = iconName ? getLucideIconByName(iconName) : null;
   return CategoryIcon ? (
   <CategoryIcon className={cn("h-5 w-5 sm:h-[22px] sm:w-[22px]", theme.iconFg)} />
   ) : (
   <Package className={cn("h-5 w-5 sm:h-[22px] sm:w-[22px]", theme.iconFg)} />
   );
   })()}
  </div>
  {/* Fixed block for two lines so every card aligns; row stretch + h-full matches tallest in row */}
  <div className="flex min-h-[2.625rem] w-full flex-shrink-0 items-start justify-center px-0.5 sm:min-h-[2.875rem]">
   <span className="line-clamp-2 w-full text-[11px] font-semibold leading-tight text-gray-900 sm:text-xs sm:leading-snug">
   {product.name}
   </span>
  </div>
  <div className="mt-auto flex w-full flex-shrink-0 flex-col items-center gap-0.5 pt-1 sm:gap-1 sm:pt-1.5">
   <span className={cn("text-sm font-bold tabular-nums sm:text-base", theme.price)}>
   {product.price}
   </span>
   {product.category && (
   <span
   className={cn(
   "inline-flex max-w-full justify-center truncate rounded px-1.5 py-0.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]",
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

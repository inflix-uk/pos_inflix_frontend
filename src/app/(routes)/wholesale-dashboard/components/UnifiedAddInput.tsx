"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { POSProduct } from "../../sales-dashboard/types";

/** Detect if input looks like IMEI/serial (numeric or alphanumeric, typically 7+ chars) */
export function looksLikeSerial(term: string): boolean {
 const t = term.trim();
 return /^\d{7,}$/.test(t) || (t.length >= 7 && /^[A-Za-z0-9]+$/.test(t));
}

/** Delay (ms) before propagating typed text upward — keeps filter from running on every keystroke */
const SEARCH_DEBOUNCE_MS = 120;

interface UnifiedAddInputProps {
 value: string;
 onChange: (v: string) => void;
 /** On Enter or scan: attempt add. Return true if handled (e.g. added or showed error). */
 onAdd: (term: string) => Promise<boolean>;
 disabled?: boolean;
 placeholder?: string;
 /** Focus this input when disabled becomes false / on mount */
 autoFocus?: boolean;
 /** Product suggestions for typeahead (when term doesn't look like serial) */
 suggestions?: POSProduct[];
 onSuggestionSelect?: (product: POSProduct) => void;
 /** ARIA */
 id?: string;
 "aria-label"?: string;
 /** Optional extra class for the input (e.g. h-11 text-base for prominence) */
 className?: string;
}

export function UnifiedAddInput({
 value,
 onChange,
 onAdd,
 disabled = false,
 placeholder = "Scan IMEI / barcode or search by name or SKU…",
 autoFocus = true,
 suggestions = [],
 onSuggestionSelect,
 id = "wholesale-unified-add",
 "aria-label": ariaLabel = "Add item by scan or search. Press Enter to add.",
 className: inputClassName,
}: UnifiedAddInputProps) {
 const inputRef = useRef<HTMLInputElement>(null);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 // Local "what user typed right now" — separate from debounced value pushed up via onChange
 const [localValue, setLocalValue] = useState(value);
 const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);

 // Keep local value in sync when parent clears/sets value externally
 useEffect(() => {
 setLocalValue(value);
 }, [value]);

 useEffect(() => {
 if (autoFocus && !disabled && inputRef.current) {
 inputRef.current.focus();
 }
 }, [disabled, autoFocus]);

 // Cleanup pending debounce on unmount
 useEffect(() => () => {
 if (debounceRef.current) clearTimeout(debounceRef.current);
 }, []);

 const flushChange = (next: string) => {
 if (debounceRef.current) {
  clearTimeout(debounceRef.current);
  debounceRef.current = null;
 }
 onChange(next);
 };

 const handleSubmit = () => {
 // Use ref value so barcode scanner (fast key events) never misses digits; state can be stale
 const term = (inputRef.current?.value ?? localValue).trim();
 if (!term) return;
 flushChange("");
 setLocalValue("");
 setSuggestionsOpen(false);
 if (inputRef.current) {
 inputRef.current.value = "";
 setTimeout(() => inputRef.current?.focus(), 0);
 }
 // Don't await: clear and refocus immediately so user can scan next serial without waiting
 onAdd(term).catch(() => {});
 };

 const showSuggestions = suggestionsOpen && localValue.trim() && suggestions.length > 0 && !looksLikeSerial(localValue.trim());

 return (
 <div className="relative">
 <label htmlFor={id} className="sr-only">
 {ariaLabel}
 </label>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden />
 <input
  ref={inputRef}
  id={id}
  type="search"
  autoComplete="off"
  value={localValue}
  onChange={(e) => {
  const next = e.target.value;
  setLocalValue(next);
  setSuggestionsOpen(true);
  // If user cleared the field, propagate immediately so cart suggestions hide
  if (!next) {
   flushChange("");
   return;
  }
  // If input looks like a scanned serial/barcode (long alphanumeric), don't fire typeahead at all —
  // wait for Enter (handleSubmit) which uses ref value directly.
  if (looksLikeSerial(next)) {
   if (debounceRef.current) clearTimeout(debounceRef.current);
   debounceRef.current = null;
   return;
  }
  // Debounce typeahead propagation so we don't re-filter on every keystroke
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
   debounceRef.current = null;
   onChange(next);
  }, SEARCH_DEBOUNCE_MS);
  }}
  onFocus={() => localValue.trim() && setSuggestionsOpen(true)}
  onBlur={() => setTimeout(() => setSuggestionsOpen(false), 180)}
  onKeyDown={(e) => {
  if (e.key === "Enter") {
  e.preventDefault();
  handleSubmit();
  }
  }}
  disabled={disabled}
  placeholder={disabled ? "Select customer to load pricing and add items." : placeholder}
  className={`w-full pl-9 pr-4 py-2.5 min-h-[44px] border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
  disabled ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-gray-300"
  } ${inputClassName ?? ""}`}
  aria-label={ariaLabel}
  aria-autocomplete="list"
  aria-expanded={showSuggestions ? true : false}
  aria-controls={showSuggestions ? "unified-add-suggestions" : undefined}
 />
 </div>
 {showSuggestions && (
 <ul
  id="unified-add-suggestions"
  className="absolute z-20 left-0 right-0 mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto"
  role="listbox"
 >
  {suggestions.slice(0, 8).map((product) => (
  <li
  key={product.sku}
  role="option"
  className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex flex-col gap-0.5 border-b border-gray-100 last:border-b-0"
  onMouseDown={(e) => {
  e.preventDefault();
  onSuggestionSelect?.(product);
  flushChange("");
  setLocalValue("");
  setSuggestionsOpen(false);
  inputRef.current?.focus();
  }}
  >
  <span className="font-medium text-gray-900 truncate">{product.name}</span>
  <span className="flex items-center gap-3 text-xs text-gray-500">
  <span className="font-semibold text-blue-600">{product.price}</span>
  {(product.barcode || product.serialNumber) && (
   <span className="font-mono truncate">
   {product.barcode ? `Barcode: ${product.barcode}` : `SN: ${product.serialNumber}`}
   </span>
  )}
  </span>
  </li>
  ))}
 </ul>
 )}
 </div>
 );
}

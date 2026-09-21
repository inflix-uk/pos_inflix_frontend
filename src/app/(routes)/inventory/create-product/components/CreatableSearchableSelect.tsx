"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
 _id: string;
 name: string;
 subtitle?: string;
 searchText?: string;
}

interface CreatableSearchableSelectProps {
 options: Option[];
 value: string;
 onChange: (value: string) => void;
 placeholder?: string;
 icon?: React.ReactNode;
 disabled?: boolean;
 /** When user selects "+ Add", called with the typed name. Should create the option and return the new _id. */
 onCreateNew?: (name: string) => Promise<string | null>;
}

const NEW_OPTION_ID = "__new__";

export const CreatableSearchableSelect: React.FC<CreatableSearchableSelectProps> = ({
 options,
 value,
 onChange,
 placeholder = "Select...",
 icon,
 disabled = false,
 onCreateNew,
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const [search, setSearch] = useState("");
 const [creating, setCreating] = useState(false);
 const [createError, setCreateError] = useState<string | null>(null);
 const [highlight, setHighlight] = useState(0);
 const containerRef = useRef<HTMLDivElement>(null);
 const triggerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const listRef = useRef<HTMLUListElement>(null);
 const suppressOpenOnFocusRef = useRef(false);
 const pointerInteractionRef = useRef(false);

 const focusTriggerQuietly = () => {
 suppressOpenOnFocusRef.current = true;
 triggerRef.current?.focus();
 requestAnimationFrame(() => {
  suppressOpenOnFocusRef.current = false;
 });
 };

 const selectedOption = options.find((o) => o._id === value);

 const filtered = useMemo(
 () =>
 options.filter((o) => {
 const q = search.toLowerCase().trim();
 if (!q) return true;
 const text = (o.searchText ?? o.name).toLowerCase();
 return text.includes(q);
 }),
 [options, search]
 );

 const exactMatch =
 Boolean(search.trim()) &&
 options.some((o) => (o.name || "").toLowerCase() === search.trim().toLowerCase());
 const showNewOption = Boolean(onCreateNew && search.trim() && !exactMatch);
 const createIndex = showNewOption ? filtered.length : -1;
 const itemCount = filtered.length + (showNewOption ? 1 : 0);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setIsOpen(false);
 setSearch("");
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 useEffect(() => {
 if (isOpen && inputRef.current) {
 inputRef.current.focus();
 }
 }, [isOpen]);

 useEffect(() => {
 if (!isOpen) return;
 if (itemCount === 0) {
 setHighlight(-1);
 return;
 }
 if (showNewOption && filtered.length === 0) setHighlight(0);
 else setHighlight(0);
 }, [search, itemCount, showNewOption, filtered.length, isOpen]);

 useEffect(() => {
 if (!isOpen || highlight < 0 || !listRef.current) return;
 const el = listRef.current.querySelector<HTMLElement>(`[data-opt-index="${highlight}"]`);
 el?.scrollIntoView({ block: "nearest" });
 }, [highlight, isOpen]);

 const closeList = () => {
 setIsOpen(false);
 setSearch("");
 setHighlight(-1);
 };

 const focusAdjacentField = (direction: 1 | -1) => {
 const container = containerRef.current;
 if (!container) return;
 const selector =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[data-creatable-trigger]:not([aria-disabled="true"])';
 const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
  if (el.tabIndex < 0) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
 });
 const trigger = triggerRef.current;
 const currentIndex = trigger ? nodes.indexOf(trigger) : -1;
 if (currentIndex < 0) return;
 const next = nodes[currentIndex + direction];
 next?.focus();
 };

 const handleSelect = async (id: string, nameToCreate?: string) => {
 if (id === NEW_OPTION_ID && onCreateNew && (nameToCreate ?? search).trim()) {
 const name = (nameToCreate ?? search).trim();
 setCreateError(null);
 setCreating(true);
 try {
 const newId = await onCreateNew(name);
 if (newId) {
  onChange(newId);
  closeList();
  queueMicrotask(focusTriggerQuietly);
 } else {
  setCreateError("Failed to create. Check console or try again.");
 }
 } catch {
 setCreateError("Failed to create. Try again.");
 } finally {
 setCreating(false);
 }
 return;
 }
 setCreateError(null);
 onChange(id);
 closeList();
 queueMicrotask(focusTriggerQuietly);
 };

 const handleNewOptionMouseDown = (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();
 handleSelect(NEW_OPTION_ID, search.trim());
 };

 const activateHighlight = () => {
 if (creating || highlight < 0 || itemCount === 0) return;
 if (showNewOption && highlight === createIndex) {
 handleSelect(NEW_OPTION_ID, search.trim());
 return;
 }
 const option = filtered[highlight];
 if (option) handleSelect(option._id);
 };

 const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "ArrowDown") {
 e.preventDefault();
 if (itemCount === 0) return;
 setHighlight((i) => Math.min((i < 0 ? -1 : i) + 1, itemCount - 1));
 return;
 }
 if (e.key === "ArrowUp") {
 e.preventDefault();
 if (itemCount === 0) return;
 setHighlight((i) => Math.max((i < 0 ? itemCount : i) - 1, 0));
 return;
 }
 if (e.key === "Enter") {
 e.preventDefault();
 activateHighlight();
 return;
 }
 if (e.key === "Tab") {
 e.preventDefault();
 const dir = e.shiftKey ? -1 : 1;
 closeList();
 queueMicrotask(() => focusAdjacentField(dir));
 return;
 }
 if (e.key === "Escape") {
 e.preventDefault();
 closeList();
 queueMicrotask(focusTriggerQuietly);
 }
 };

 const handleTriggerFocus = () => {
 if (disabled || suppressOpenOnFocusRef.current || isOpen) return;
 if (pointerInteractionRef.current) {
  pointerInteractionRef.current = false;
  return;
 }
 setIsOpen(true);
 };

 const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
 if (disabled) return;
 if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
 e.preventDefault();
 setIsOpen(true);
 return;
 }
 if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
 e.preventDefault();
 setSearch(e.key);
 setCreateError(null);
 setIsOpen(true);
 return;
 }
 if (e.key === "Backspace") {
 e.preventDefault();
 setSearch("");
 setIsOpen(true);
 }
 };

 const handleClear = (e: React.MouseEvent) => {
 e.stopPropagation();
 onChange("");
 setSearch("");
 };

 return (
 <div ref={containerRef} className="relative">
 <div
 ref={triggerRef}
 data-creatable-trigger
 role="combobox"
 aria-expanded={isOpen}
 aria-haspopup="listbox"
 aria-disabled={disabled}
 tabIndex={disabled ? -1 : 0}
 onPointerDown={() => {
  pointerInteractionRef.current = true;
 }}
 onClick={() => !disabled && setIsOpen((open) => !open)}
 onFocus={handleTriggerFocus}
 onKeyDown={handleTriggerKeyDown}
 className={`flex items-center w-full ${icon ? "pl-9" : "pl-3"} pr-9 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${disabled ? "cursor-not-allowed bg-gray-50 opacity-90" : "cursor-pointer"}`}
 >
 {icon && (
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  {icon}
  </div>
 )}
 <span className={selectedOption ? "text-gray-800" : "text-gray-400"}>
  {selectedOption ? (selectedOption.subtitle ? `${selectedOption.name} (${selectedOption.subtitle})` : selectedOption.name) : placeholder}
 </span>
 <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-0.5">
  {value && (
  <button type="button" tabIndex={-1} onClick={handleClear} className="p-0.5 hover:bg-gray-100 rounded">
  <X className="h-3.5 w-3.5 text-gray-400" />
  </button>
  )}
  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
 </div>
 </div>

 {isOpen && (
 <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
  <div className="p-1.5 border-b border-gray-100">
  <div className="relative">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
  <input
  ref={inputRef}
  type="text"
  value={search}
  onChange={(e) => {
  setSearch(e.target.value);
  setCreateError(null);
  }}
  onKeyDown={handleSearchKeyDown}
  placeholder="Search or type to add..."
  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
  aria-autocomplete="list"
  aria-controls="creatable-select-list"
  aria-activedescendant={highlight >= 0 ? `creatable-opt-${highlight}` : undefined}
  />
  </div>
  </div>
  <ul
  id="creatable-select-list"
  ref={listRef}
  className="max-h-52 overflow-y-auto py-0.5"
  role="listbox"
  >
  {createError && (
  <li className="px-3 py-1.5 text-xs text-red-600 bg-red-50">{createError}</li>
  )}
  {creating ? (
  <li className="px-3 py-1.5 text-sm text-gray-500">Creating...</li>
  ) : filtered.length === 0 && !showNewOption ? (
  <li className="px-3 py-1.5 text-sm text-gray-500">No results found</li>
  ) : (
  <>
  {filtered.map((option, index) => (
   <li
   key={option._id}
   id={`creatable-opt-${index}`}
   data-opt-index={index}
   role="option"
   aria-selected={highlight === index}
   onClick={() => handleSelect(option._id)}
   onMouseEnter={() => setHighlight(index)}
   className={`px-3 py-1.5 text-sm cursor-pointer ${
   highlight === index || option._id === value
   ? "bg-orange-50 text-orange-600 font-medium"
   : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
   }`}
   >
   {option.name}{option.subtitle && <span className="text-gray-400 ml-1">({option.subtitle})</span>}
   </li>
  ))}
  {showNewOption && (
   <li
   id={`creatable-opt-${createIndex}`}
   data-opt-index={createIndex}
   role="option"
   aria-selected={highlight === createIndex}
   onMouseDown={handleNewOptionMouseDown}
   onMouseEnter={() => setHighlight(createIndex)}
   className={`px-3 py-1.5 text-sm cursor-pointer font-medium select-none border-t border-gray-100 mt-0.5 pt-1.5 ${
   highlight === createIndex
   ? "bg-blue-50 text-blue-700"
   : "text-blue-600 hover:bg-blue-50 hover:text-blue-600"
   }`}
   >
   <span className="font-medium">+ Add &quot;{search.trim()}&quot;</span>
   <span className="block text-[11px] text-gray-500 mt-0.5">
   {highlight === createIndex ? "Press Enter to create and select" : "Click or press Enter to create and select"}
   </span>
   </li>
  )}
  </>
  )}
  </ul>
 </div>
 )}
 </div>
 );
};

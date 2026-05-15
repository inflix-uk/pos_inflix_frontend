"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Loader2, AlertTriangle, RotateCcw } from "lucide-react";

interface Option {
 _id: string;
 name: string;
 subtitle?: string;
 /** If set, search filters by this string (e.g. name + email + phone) */
 searchText?: string;
}

interface SearchableSelectProps {
 options: Option[];
 value: string;
 onChange: (value: string) => void;
 placeholder?: string;
 icon?: React.ReactNode;
 disabled?: boolean;
 /** Show loading state inside the dropdown instead of "No results found" while options are still being fetched. */
 loading?: boolean;
 /** Show error state with a retry button inside the dropdown when the fetch failed. */
 error?: boolean;
 onRetry?: () => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
 options,
 value,
 onChange,
 placeholder = "Select...",
 icon,
 disabled = false,
 loading = false,
 error = false,
 onRetry,
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const [openUp, setOpenUp] = useState(false);
 const [search, setSearch] = useState("");
 const containerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const selectedOption = options.find((o) => o._id === value);

 const filtered = options.filter((o) => {
 const q = search.toLowerCase();
 const text = (o.searchText ?? o.name).toLowerCase();
 return text.includes(q);
 });

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
 if (isOpen && containerRef.current) {
 const rect = containerRef.current.getBoundingClientRect();
 const spaceBelow = window.innerHeight - rect.bottom;
 const spaceAbove = rect.top;
 const estimatedHeight = 260;
 setOpenUp(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);
 }
 }, [isOpen]);

 const handleSelect = (id: string) => {
 onChange(id);
 setIsOpen(false);
 setSearch("");
 };

 const handleClear = (e: React.MouseEvent) => {
 e.stopPropagation();
 onChange("");
 setSearch("");
 };

 return (
 <div ref={containerRef} className="relative">
 <div
 onClick={() => !disabled && setIsOpen(!isOpen)}
 className={`flex items-center w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${disabled ? "cursor-not-allowed bg-gray-50 opacity-90" : "cursor-pointer"}`}
 >
 {icon && (
  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
  {icon}
  </div>
 )}
 <span className={`truncate ${selectedOption ? "text-gray-800" : "text-gray-400"}`}>
  {selectedOption ? (selectedOption.subtitle ? `${selectedOption.name} (${selectedOption.subtitle})` : selectedOption.name) : placeholder}
 </span>
 <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-0.5">
  {value && (
  <button onClick={handleClear} className="p-0.5 hover:bg-gray-100 rounded">
  <X className="h-3.5 w-3.5 text-gray-400" />
  </button>
  )}
  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
 </div>
 </div>

 {isOpen && (
 <div className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
  <div className="p-2 border-b border-gray-100">
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
  ref={inputRef}
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search..."
  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
  />
  </div>
  </div>
  <ul className="max-h-44 overflow-y-auto py-0.5">
  {loading && options.length === 0 ? (
  <li className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
  Loading options…
  </li>
  ) : error && options.length === 0 ? (
  <li className="px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
  <span className="flex items-center gap-1.5">
  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
  Couldn&apos;t load options
  </span>
  {onRetry && (
  <button
  type="button"
  onClick={(e) => {
   e.stopPropagation();
   onRetry();
  }}
  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium"
  >
  <RotateCcw className="h-3 w-3" />
  Retry
  </button>
  )}
  </li>
  ) : filtered.length === 0 ? (
  <li className="px-3 py-1.5 text-xs text-gray-500">No results found</li>
  ) : (
  filtered.map((option) => (
  <li
   key={option._id}
   onClick={() => handleSelect(option._id)}
   className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 ${
   option._id === value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
   }`}
  >
   {option.name}{option.subtitle && <span className="text-gray-400 ml-1">({option.subtitle})</span>}
  </li>
  ))
  )}
  </ul>
 </div>
 )}
 </div>
 );
};

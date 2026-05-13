"use client";

import React, { useState, useRef, useEffect } from "react";
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
 const containerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const selectedOption = options.find((o) => o._id === value);

 const filtered = options.filter((o) => {
 const q = search.toLowerCase().trim();
 if (!q) return true;
 const text = (o.searchText ?? o.name).toLowerCase();
 return text.includes(q);
 });

 const exactMatch = search.trim() && options.some((o) => (o.name || "").toLowerCase() === search.trim().toLowerCase());
 const showNewOption = onCreateNew && search.trim() && !exactMatch;

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

 const handleSelect = async (id: string, nameToCreate?: string) => {
 if (id === NEW_OPTION_ID && onCreateNew && (nameToCreate ?? search).trim()) {
 const name = (nameToCreate ?? search).trim();
 setCreateError(null);
 setCreating(true);
 try {
 const newId = await onCreateNew(name);
 if (newId) {
  onChange(newId);
  setIsOpen(false);
  setSearch("");
 } else {
  setCreateError("Failed to create. Check console or try again.");
 }
 } catch (err) {
 setCreateError("Failed to create. Try again.");
 } finally {
 setCreating(false);
 }
 return;
 }
 setCreateError(null);
 onChange(id);
 setIsOpen(false);
 setSearch("");
 };

 const handleNewOptionMouseDown = (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();
 handleSelect(NEW_OPTION_ID, search.trim());
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
 className={`flex items-center w-full ${icon ? "pl-9" : "pl-3"} pr-9 py-2 border border-gray-200 rounded-lg bg-white text-sm focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 ${disabled ? "cursor-not-allowed bg-gray-50 opacity-90" : "cursor-pointer"}`}
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
  <button type="button" onClick={handleClear} className="p-0.5 hover:bg-gray-100 rounded">
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
  onChange={(e) => { setSearch(e.target.value); setCreateError(null); }}
  placeholder="Search or type to add..."
  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
  />
  </div>
  </div>
  <ul className="max-h-52 overflow-y-auto py-0.5" role="listbox">
  {createError && (
  <li className="px-3 py-1.5 text-xs text-red-600 bg-red-50">{createError}</li>
  )}
  {creating ? (
  <li className="px-3 py-1.5 text-sm text-gray-500">Creating...</li>
  ) : filtered.length === 0 && !showNewOption ? (
  <li className="px-3 py-1.5 text-sm text-gray-500">No results found</li>
  ) : (
  <>
  {filtered.map((option) => (
   <li
   key={option._id}
   onClick={() => handleSelect(option._id)}
   className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-orange-50 hover:text-orange-600 ${
   option._id === value ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-700"
   }`}
   >
   {option.name}{option.subtitle && <span className="text-gray-400 ml-1">({option.subtitle})</span>}
   </li>
  ))}
  {showNewOption && (
   <li
   role="option"
   onMouseDown={handleNewOptionMouseDown}
   className="px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 text-blue-600 font-medium select-none border-t border-gray-100 mt-0.5 pt-1.5"
   >
   <span className="font-medium">+ Add &quot;{search.trim()}&quot;</span>
   <span className="block text-[11px] text-gray-500 mt-0.5">Click to create and select</span>
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

"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import { SelectOption } from "../types";

interface SearchableSelectProps {
 value: string;
 onChange: (value: string) => void;
 options: SelectOption[];
 placeholder?: string;
 disabled?: boolean;
 onFocus?: () => void;
 icon?: React.ReactNode;
}

export default function SearchableSelect({
 value,
 onChange,
 options,
 placeholder = "Select...",
 disabled = false,
 onFocus,
 icon,
}: SearchableSelectProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");
 const containerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const valueStr = value != null ? String(value) : "";
 const selectedOption = options.find((opt) => String(opt.value) === valueStr);

 const filteredOptions = options.filter((option) =>
 (option.label || "").toLowerCase().includes(searchTerm.toLowerCase())
 );

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 setSearchTerm("");
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

 const handleSelect = (e: React.MouseEvent, optionValue: string) => {
 e.preventDefault();
 e.stopPropagation();
 onChange(optionValue != null ? String(optionValue) : "");
 setIsOpen(false);
 setSearchTerm("");
 };

 const handleClear = (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();
 onChange("");
 setSearchTerm("");
 };

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === "Escape") {
 setIsOpen(false);
 setSearchTerm("");
 } else if (e.key === "Enter" && filteredOptions.length > 0) {
 onChange(filteredOptions[0].value != null ? String(filteredOptions[0].value) : "");
 setIsOpen(false);
 setSearchTerm("");
 }
 };

 return (
 <div ref={containerRef} className="relative">
 {/* Trigger */}
 <div
 onClick={() => {
  if (!disabled) {
  if (!isOpen && onFocus) {
  onFocus();
  }
  setIsOpen(!isOpen);
  }
 }}
 className={`relative w-full ${icon ? "pl-9" : "pl-3"} pr-9 py-2 border border-gray-200 rounded-lg bg-white flex items-center cursor-pointer text-sm text-gray-800 ${
  disabled ? "bg-gray-50 cursor-not-allowed" : "hover:border-gray-300"
 } ${isOpen ? "ring-2 ring-orange-500 border-orange-500" : ""} focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500`}
 >
 {icon && (
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  {icon}
  </div>
 )}
 <span className={`flex-1 truncate ${selectedOption ? "text-gray-900" : "text-gray-500"}`}>
  {selectedOption ? selectedOption.label : placeholder}
 </span>
 <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-0.5">
  {valueStr && !disabled && (
  <button
  type="button"
  onClick={handleClear}
  className="p-0.5 hover:bg-gray-100 rounded"
  >
  <X className="w-3.5 h-3.5 text-gray-400" />
  </button>
  )}
  <ChevronDown
  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
  />
 </div>
 </div>

 {/* Dropdown */}
 {isOpen && (
 <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
  <div className="p-1.5 border-b border-gray-200">
  <div className="relative">
  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
  <input
  ref={inputRef}
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Search..."
  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  </div>

  <div className="max-h-52 overflow-y-auto">
  {filteredOptions.length > 0 ? (
  filteredOptions.map((option) => (
  <div
   key={String(option.value)}
   role="option"
   aria-selected={String(option.value) === valueStr}
   onMouseDown={(e) => {
   e.preventDefault();
   handleSelect(e, option.value);
   }}
   className={`px-3 py-1.5 cursor-pointer text-sm ${
   String(option.value) === valueStr ? "bg-orange-50 text-orange-800" : "text-gray-800 hover:bg-gray-50"
   }`}
  >
   {option.label}
  </div>
  ))
  ) : (
  <div className="px-3 py-3 text-center text-gray-500 text-xs">
  No options found
  </div>
  )}
  </div>
 </div>
 )}
 </div>
 );
}

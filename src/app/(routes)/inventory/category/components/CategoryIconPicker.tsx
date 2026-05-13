"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Package, X } from "lucide-react";
import { LUCIDE_ICON_LIST, getLucideIconByName } from "@/lib/lucide-icons";

interface CategoryIconPickerProps {
 value: string | undefined;
 onChange: (iconName: string | undefined) => void;
 label?: string;
}

const POPULAR_ICONS = ["Package", "Smartphone", "Laptop", "Headphones", "Watch", "Box", "Folder", "Tag", "ShoppingBag", "LayoutGrid"];
const SEARCH_MIN = 2;

export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
 value,
 onChange,
 label = "Category icon",
}) => {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState("");

 const selectedIcon = getLucideIconByName(value);
 const IconComponent = selectedIcon;
 const filteredIcons = useMemo(() => {
 if (!search.trim() || search.length < SEARCH_MIN) {
 const popular = POPULAR_ICONS.map((n) => LUCIDE_ICON_LIST.find((e) => e.name === n)).filter(Boolean) as typeof LUCIDE_ICON_LIST;
 const rest = LUCIDE_ICON_LIST.filter((e) => !POPULAR_ICONS.includes(e.name));
 return [...popular, ...rest].slice(0, 80);
 }
 const q = search.toLowerCase();
 return LUCIDE_ICON_LIST.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 60);
 }, [search]);

 return (
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
 <p className="text-xs text-gray-500 mb-2">Shown on Create Sales above the product name. Browse all at Settings → Icons.</p>
 <div className="relative">
 <button
  type="button"
  onClick={() => setOpen((o) => !o)}
  className="w-full flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-left"
 >
  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
  {IconComponent ? (
  <IconComponent className="h-5 w-5 text-gray-600" />
  ) : (
  <Package className="h-5 w-5 text-gray-400" />
  )}
  </div>
  <span className="flex-1 text-sm text-gray-700 truncate">
  {value ? value : "No icon"}
  </span>
  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
 </button>

 {open && (
  <>
  <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-72 flex flex-col">
  <div className="p-2 border-b border-gray-100">
  <input
   type="text"
   value={search}
   onChange={(e) => setSearch(e.target.value)}
   placeholder="Search icons..."
   className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  <div className="p-2 flex gap-1">
  <button
   type="button"
   onClick={() => { onChange(undefined); setOpen(false); }}
   className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
  >
   <X className="h-3.5 w-3.5" /> Clear
  </button>
  </div>
  <div className="overflow-y-auto p-2 grid grid-cols-5 sm:grid-cols-6 gap-1">
  {filteredIcons.map((item) => {
   const IconComp = item.Icon;
   const isSelected = value === item.name;
   return (
   <button
   key={item.name}
   type="button"
   onClick={() => { onChange(item.name); setOpen(false); }}
   title={item.name}
   className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
   isSelected ? "bg-orange-100 text-orange-700 border border-orange-300" : "hover:bg-gray-100 border border-transparent"
   }`}
   >
   <IconComp className="h-5 w-5" />
   <span className="text-[10px] truncate w-full text-center">{item.name}</span>
   </button>
   );
  })}
  </div>
  </div>
  <div
  className="fixed inset-0 z-10"
  aria-hidden
  onClick={() => setOpen(false)}
  />
  </>
 )}
 </div>
 </div>
 );
};

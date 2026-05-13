"use client";

import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Search, Smile } from "lucide-react";

interface IconEntry {
 name: string;
 Icon: React.ElementType;
}

// Get all unique icon components (skip Lucide-prefixed duplicates and non-components)
const allIcons: IconEntry[] = Object.entries(LucideIcons)
 .filter(([name, component]) => {
 if (name.startsWith("Lucide")) return false;
 if (name === "icons" || name === "default" || name === "createLucideIcon") return false;
 if (typeof component !== "object" && typeof component !== "function") return false;
 if (!/^[A-Z]/.test(name)) return false;
 return true;
 })
 .map(([name, component]) => ({
 name,
 Icon: component as React.ElementType,
 }))
 .sort((a, b) => a.name.localeCompare(b.name));

const ITEMS_PER_PAGE = 120;

const IconsPage = () => {
 const [searchQuery, setSearchQuery] = useState("");
 const [page, setPage] = useState(0);
 const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

 const filteredIcons = useMemo(() => {
 if (!searchQuery.trim()) return allIcons;
 const q = searchQuery.toLowerCase();
 return allIcons.filter((item) => item.name.toLowerCase().includes(q));
 }, [searchQuery]);

 const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE);
 const pagedIcons = filteredIcons.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

 const handleCopyName = (name: string) => {
 navigator.clipboard.writeText(name);
 setCopiedIcon(name);
 setTimeout(() => setCopiedIcon(null), 1500);
 };

 const handleSearch = (val: string) => {
 setSearchQuery(val);
 setPage(0);
 };

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 {/* Header */}
 <div className="mb-4 @[768px]:mb-6">
 <div className="flex items-center gap-3">
  <div className="p-2 bg-orange-100 rounded-lg">
  <Smile className="h-5 w-5 @[768px]:h-6 @[768px]:w-6 text-orange-500" />
  </div>
  <div>
  <h1 className="text-xl @[768px]:text-2xl font-semibold text-gray-800">Icons Library</h1>
  <p className="text-gray-500 text-xs @[768px]:text-sm mt-1">
  {allIcons.length} Lucide icons available. Click any icon to copy its name.
  </p>
  </div>
 </div>
 </div>

 {/* Search */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 @[768px]:p-4 mb-4 @[768px]:mb-6">
 <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input
  type="text"
  value={searchQuery}
  onChange={(e) => handleSearch(e.target.value)}
  placeholder="Search icons... (e.g. arrow, user, chart, mail, phone)"
  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  />
 </div>
 <div className="flex items-center justify-between mt-3">
  <p className="text-sm text-gray-500">
  Showing {pagedIcons.length} of {filteredIcons.length} icons
  {searchQuery && ` matching "${searchQuery}"`}
  </p>
  {filteredIcons.length > ITEMS_PER_PAGE && (
  <div className="flex items-center gap-2">
  <button
  onClick={() => setPage(Math.max(0, page - 1))}
  disabled={page === 0}
  className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
  >
  Prev
  </button>
  <span className="text-sm text-gray-600">
  Page {page + 1} of {totalPages}
  </span>
  <button
  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
  disabled={page >= totalPages - 1}
  className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
  >
  Next
  </button>
  </div>
  )}
 </div>
 </div>

 {/* Icons Grid */}
 <div className="grid grid-cols-2 @[480px]:grid-cols-3 @[640px]:grid-cols-4 @[768px]:grid-cols-6 @[1024px]:grid-cols-8 @[1280px]:grid-cols-10 gap-2 @[768px]:gap-3">
 {pagedIcons.map((item) => {
  const IconComp = item.Icon;
  return (
  <button
  key={item.name}
  onClick={() => handleCopyName(item.name)}
  className={`flex flex-col items-center gap-2 p-3 bg-white rounded-lg border transition-all hover:shadow-md hover:border-orange-300 group ${
  copiedIcon === item.name ? "border-green-400 bg-green-50" : "border-gray-200"
  }`}
  title={item.name}
  >
  <IconComp
  className={`h-5 w-5 transition-colors ${
   copiedIcon === item.name
   ? "text-green-600"
   : "text-gray-600 group-hover:text-orange-500"
  }`}
  />
  <span
  className={`text-[10px] text-center leading-tight truncate w-full ${
   copiedIcon === item.name ? "text-green-600 font-medium" : "text-gray-500"
  }`}
  >
  {copiedIcon === item.name ? "Copied!" : item.name}
  </span>
  </button>
  );
 })}
 </div>

 {pagedIcons.length === 0 && (
 <div className="text-center py-12 text-gray-500">
  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
  <p className="text-lg font-medium">No icons found</p>
  <p className="text-sm mt-1">Try a different search term</p>
 </div>
 )}

 {/* Bottom Pagination */}
 {filteredIcons.length > ITEMS_PER_PAGE && (
 <div className="flex items-center justify-center gap-2 mt-6">
  {Array.from({ length: totalPages }, (_, i) => (
  <button
  key={i}
  onClick={() => setPage(i)}
  className={`w-8 h-8 text-sm rounded-md ${
  page === i
   ? "bg-orange-500 text-white"
   : "border border-gray-200 text-gray-600 hover:bg-gray-50"
  }`}
  >
  {i + 1}
  </button>
  ))}
 </div>
 )}
 </div>
 );
};

export default IconsPage;

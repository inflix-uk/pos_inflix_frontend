"use client";

import React from "react";
import { ChevronRight, ChevronDown, Package } from "lucide-react";
import type { StockListRow } from "../hooks/useStockList";

interface StockListTreeProps {
 rows: StockListRow[];
 expanded: Set<string>;
 onToggle: (pathKey: string) => void;
}

const INDENT_PX = 20;

export function StockListTree({
 rows,
 expanded,
 onToggle,
}: StockListTreeProps) {
 return (
 <div className="overflow-x-auto">
 <div className="min-w-[360px]">
 {rows.length === 0 ? (
  <div className="py-16 px-6 text-center rounded-xl bg-gray-50 border border-gray-100">
  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
  <p className="text-sm font-medium text-gray-600">No stock in this view</p>
  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
  Add purchases with items to see the hierarchy here, or clear filters.
  </p>
  </div>
 ) : (
  <ul className="space-y-0.5">
  {rows.map((row) => (
  <li
  key={row.pathKey}
  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
   row.hasChildren
   ? "hover:bg-orange-50/70 cursor-pointer"
   : "hover:bg-gray-50"
  } ${row.depth > 0 ? "" : ""}`}
  >
  <div
   className="flex items-center gap-2 select-none flex-1 min-w-0"
   style={{ paddingLeft: row.depth * INDENT_PX }}
   onClick={() =>
   row.hasChildren ? onToggle(row.pathKey) : undefined
   }
  >
   {row.hasChildren ? (
   <span className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-500 bg-gray-100">
   {expanded.has(row.pathKey) ? (
   <ChevronDown className="w-3.5 h-3.5" />
   ) : (
   <ChevronRight className="w-3.5 h-3.5" />
   )}
   </span>
   ) : (
   <span className="w-5 flex-shrink-0" />
   )}
   <span
   className={`truncate ${
   row.depth === 0
   ? "font-semibold text-gray-900"
   : "text-gray-700"
   } ${row.hasChildren ? "font-medium" : "text-sm"}`}
   >
   {row.label}
   </span>
  </div>
  <div className="flex items-center flex-shrink-0">
   <span className="min-w-[2rem] text-center rounded-md px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 tabular-nums">
   {row.availableCount}
   </span>
  </div>
  </li>
  ))}
  </ul>
 )}
 </div>
 </div>
 );
}

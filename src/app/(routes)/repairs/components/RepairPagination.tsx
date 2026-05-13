"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RepairPaginationProps {
 currentPage: number;
 totalPages: number;
 total: number;
 rowsPerPage: number;
 onPageChange: (page: number) => void;
 onRowsPerPageChange: (value: number) => void;
}

export const RepairPagination: React.FC<RepairPaginationProps> = ({
 currentPage,
 totalPages,
 total,
 rowsPerPage,
 onPageChange,
 onRowsPerPageChange,
}) => {
 const start = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
 const end = Math.min(currentPage * rowsPerPage, total);

 return (
 <div className="flex flex-wrap items-center justify-between gap-2 @[640px]:gap-4 px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 border-t border-neutral-200 bg-neutral-50">
 <div className="flex flex-wrap items-center gap-2 @[640px]:gap-4">
 <span className="text-xs @[640px]:text-sm text-slate-600">
  {start}–{end} of {total}
 </span>
 <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <label htmlFor="rows-per-page" className="text-xs @[640px]:text-sm text-slate-600">
  Rows:
  </label>
  <select
  id="rows-per-page"
  value={rowsPerPage}
  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
  className="border border-slate-200 rounded-lg px-2 py-1 text-xs @[640px]:text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
  >
  <option value={10}>10</option>
  <option value={20}>20</option>
  <option value={50}>50</option>
  </select>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
  type="button"
  onClick={() => onPageChange(currentPage - 1)}
  disabled={currentPage <= 1}
  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
  <ChevronLeft className="h-4 w-4 text-neutral-600" />
 </button>
 <span className="px-2 @[640px]:px-3 py-1 text-xs @[640px]:text-sm text-slate-700 font-medium whitespace-nowrap">
  Page {currentPage} of {totalPages || 1}
 </span>
 <button
  type="button"
  onClick={() => onPageChange(currentPage + 1)}
  disabled={currentPage >= totalPages}
  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
  <ChevronRight className="h-4 w-4 text-neutral-600" />
 </button>
 </div>
 </div>
 );
};

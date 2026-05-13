"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
 currentPage: number;
 totalPages: number;
 rowsPerPage: number;
 onPageChange: (page: number) => void;
 onRowsPerPageChange: (rows: number) => void;
 /** Optional. When provided, renders "Showing X–Y of Z". */
 totalRows?: number;
 /** Optional. Defaults to currentPage * rowsPerPage capped by totalRows. */
 displayedCount?: number;
 /** Show subtle loading bar above the bar */
 isFetching?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200];

export const Pagination: React.FC<PaginationProps> = ({
 currentPage,
 totalPages,
 rowsPerPage,
 onPageChange,
 onRowsPerPageChange,
 totalRows,
 displayedCount,
 isFetching,
}) => {
 const safeTotalPages = Math.max(1, totalPages);
 const canPrev = currentPage > 1;
 const canNext = currentPage < safeTotalPages;

 const pages = useMemo(() => {
  const out: (number | "…")[] = [];
  const max = 7;
  if (safeTotalPages <= max) {
   for (let i = 1; i <= safeTotalPages; i++) out.push(i);
   return out;
  }
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(safeTotalPages - 1, currentPage + 1);
  out.push(1);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < safeTotalPages - 1) out.push("…");
  out.push(safeTotalPages);
  return out;
 }, [currentPage, safeTotalPages]);

 const fromIdx =
  totalRows && totalRows > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
 const toIdx =
  totalRows && totalRows > 0
   ? Math.min(currentPage * rowsPerPage, totalRows)
   : displayedCount ?? 0;

 const goto = (p: number) => {
  if (p < 1 || p > safeTotalPages || p === currentPage) return;
  onPageChange(p);
 };

 return (
  <div className="relative border-t border-gray-200 bg-white">
   {isFetching && (
    <div className="absolute left-0 right-0 -top-px h-0.5 overflow-hidden">
     <div className="h-full w-1/3 bg-orange-500/70 animate-[paging_1.2s_ease-in-out_infinite]" />
     <style jsx>{`
      @keyframes paging {
       0% { transform: translateX(-100%); }
       100% { transform: translateX(400%); }
      }
     `}</style>
    </div>
   )}
   <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
    <div className="flex items-center gap-3 text-sm text-gray-600">
     <div className="flex items-center gap-2">
      <span className="text-gray-500">Rows:</span>
      <select
       value={rowsPerPage}
       onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
       className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
      >
       {PAGE_SIZE_OPTIONS.map((n) => (
        <option key={n} value={n}>
         {n}
        </option>
       ))}
      </select>
     </div>
     {typeof totalRows === "number" && totalRows > 0 ? (
      <span className="text-gray-500">
       <span className="font-medium text-gray-700">{fromIdx.toLocaleString()}</span>
       <span className="mx-1">–</span>
       <span className="font-medium text-gray-700">{toIdx.toLocaleString()}</span>
       <span className="mx-1">of</span>
       <span className="font-medium text-gray-700">{totalRows.toLocaleString()}</span>
      </span>
     ) : (
      <span className="text-gray-400">No items</span>
     )}
    </div>

    <div className="flex items-center gap-1">
     <button
      type="button"
      onClick={() => goto(1)}
      disabled={!canPrev}
      aria-label="First page"
      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
     >
      <ChevronsLeft size={16} />
     </button>
     <button
      type="button"
      onClick={() => goto(currentPage - 1)}
      disabled={!canPrev}
      aria-label="Previous page"
      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
     >
      <ChevronLeft size={16} />
     </button>

     {pages.map((p, i) =>
      p === "…" ? (
       <span key={`e-${i}`} className="px-1.5 text-gray-400 select-none">
        …
       </span>
      ) : (
       <button
        key={p}
        type="button"
        onClick={() => goto(p)}
        aria-current={currentPage === p ? "page" : undefined}
        className={`min-w-[2rem] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
         currentPage === p
          ? "bg-orange-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
        }`}
       >
        {p}
       </button>
      )
     )}

     <button
      type="button"
      onClick={() => goto(currentPage + 1)}
      disabled={!canNext}
      aria-label="Next page"
      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
     >
      <ChevronRight size={16} />
     </button>
     <button
      type="button"
      onClick={() => goto(safeTotalPages)}
      disabled={!canNext}
      aria-label="Last page"
      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
     >
      <ChevronsRight size={16} />
     </button>
    </div>
   </div>
  </div>
 );
};

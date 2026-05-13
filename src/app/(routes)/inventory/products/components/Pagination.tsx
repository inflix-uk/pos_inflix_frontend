"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
 currentPage: number;
 totalPages: number;
 rowsPerPage: number;
 totalProducts: number;
 displayedCount: number;
 onPageChange: (page: number) => void;
 onRowsPerPageChange: (rows: number) => void;
}

export default function Pagination({
 currentPage,
 totalPages,
 rowsPerPage,
 totalProducts,
 displayedCount,
 onPageChange,
 onRowsPerPageChange,
}: PaginationProps) {
 return (
 <div className="px-3 @[640px]:px-6 py-3 @[640px]:py-4 border-t border-gray-200">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2">
  <span className="text-xs @[640px]:text-sm text-gray-700">Rows</span>
  <select
  value={rowsPerPage}
  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-300 rounded px-2 @[640px]:px-3 py-1 text-xs @[640px]:text-sm"
  >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={20}>20</option>
  <option value={50}>50</option>
  </select>
  <span className="text-xs @[640px]:text-sm text-gray-500 @[640px]:ml-4">
  {displayedCount}/{totalProducts}
  </span>
 </div>

 <div className="flex items-center gap-1 @[640px]:gap-2">
  <button
  onClick={() => onPageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronLeft size={16} />
  </button>

  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
  const pageNumber = index + 1;
  return (
  <button
  key={pageNumber}
  onClick={() => onPageChange(pageNumber)}
  className={`w-7 h-7 @[640px]:w-8 @[640px]:h-8 rounded-lg text-xs @[640px]:text-sm font-medium ${
   currentPage === pageNumber
   ? "bg-orange-500 text-white"
   : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  {pageNumber}
  </button>
  );
  })}

  {totalPages > 5 && <span className="text-gray-400">...</span>}

  <button
  onClick={() => onPageChange(currentPage + 1)}
  disabled={currentPage === totalPages || totalPages === 0}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronRight size={16} />
  </button>
 </div>
 </div>
 </div>
 );
}

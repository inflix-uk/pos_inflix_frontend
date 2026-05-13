"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
 currentPage: number;
 totalPages: number;
 rowsPerPage: number;
 onPageChange: (page: number) => void;
 onRowsPerPageChange: (value: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
 currentPage,
 totalPages,
 rowsPerPage,
 onPageChange,
 onRowsPerPageChange,
}) => {
 return (
 <div className="flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-2 @[640px]:gap-3 px-3 @[480px]:px-4 @[1024px]:px-6 py-2.5 @[640px]:py-3 @[1024px]:py-4 border-t border-gray-200">
 <div className="flex items-center gap-2 @[1024px]:gap-4">
 <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <span className="text-xs @[640px]:text-sm text-gray-700">Row Per Page:</span>
  <select
  value={rowsPerPage}
  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-300 rounded px-1.5 @[640px]:px-2 py-0.5 @[640px]:py-1 text-xs @[640px]:text-sm"
  >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={25}>25</option>
  <option value={50}>50</option>
  </select>
 </div>
 <span className="text-xs @[640px]:text-sm text-gray-700">Entries</span>
 </div>
 <div className="flex items-center gap-1 @[640px]:gap-2 flex-wrap">
 <button
  onClick={() => onPageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <ChevronLeft size={16} />
 </button>

 {[...Array(totalPages)].map((_, index) => {
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

 <button
  onClick={() => onPageChange(currentPage + 1)}
  disabled={currentPage === totalPages}
  className="p-1.5 @[640px]:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <ChevronRight size={16} />
 </button>
 </div>
 </div>
 );
};

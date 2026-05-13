"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
 currentPage: number;
 totalPages: number;
 rowsPerPage: number;
 startIndex: number;
 endIndex: number;
 totalEntries: number;
 onPageChange: (page: number) => void;
 onRowsPerPageChange: (value: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
 currentPage,
 totalPages,
 rowsPerPage,
 startIndex,
 endIndex,
 totalEntries,
 onPageChange,
 onRowsPerPageChange,
}) => {
 return (
 <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
  <span className="text-sm text-gray-700">Rows per page:</span>
  <select
  value={rowsPerPage}
  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-300 rounded px-2 py-1 text-sm"
  >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={25}>25</option>
  <option value={50}>50</option>
  </select>
 </div>
 <span className="text-sm text-gray-700">
  Showing {startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
 </span>
 </div>
 <div className="flex items-center gap-2">
 <button
  onClick={() => onPageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <ChevronLeft size={16} />
 </button>

 {[...Array(totalPages)].map((_, index) => {
  const pageNumber = index + 1;
  return (
  <button
  key={pageNumber}
  onClick={() => onPageChange(pageNumber)}
  className={`w-8 h-8 rounded-lg text-sm font-medium ${
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
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <ChevronRight size={16} />
 </button>
 </div>
 </div>
 );
};

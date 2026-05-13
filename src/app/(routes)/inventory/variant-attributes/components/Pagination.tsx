"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
 currentPage: number;
 totalPages: number;
 rowsPerPage: number;
 onPageChange: (page: number) => void;
 onRowsPerPageChange: (rows: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
 currentPage,
 totalPages,
 rowsPerPage,
 onPageChange,
 onRowsPerPageChange,
}) => {
 const getPageNumbers = () => {
 const pages: (number | string)[] = [];
 const maxVisible = 5;

 if (totalPages <= maxVisible) {
 for (let i = 1; i <= totalPages; i++) {
 pages.push(i);
 }
 } else {
 if (currentPage <= 3) {
 for (let i = 1; i <= 4; i++) pages.push(i);
 pages.push("...");
 pages.push(totalPages);
 } else if (currentPage >= totalPages - 2) {
 pages.push(1);
 pages.push("...");
 for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
 } else {
 pages.push(1);
 pages.push("...");
 for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
 pages.push("...");
 pages.push(totalPages);
 }
 }
 return pages;
 };

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
  <option value={25}>25</option>
  <option value={50}>50</option>
  </select>
 </div>
 <div className="flex items-center gap-1 @[640px]:gap-2">
  <button
  onClick={() => onPageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronLeft size={16} />
  </button>
  {getPageNumbers().map((page, index) => (
  <button
  key={index}
  onClick={() => typeof page === "number" && onPageChange(page)}
  disabled={page === "..."}
  className={`w-7 h-7 @[640px]:w-8 @[640px]:h-8 rounded-lg text-xs @[640px]:text-sm font-medium ${
  currentPage === page
   ? "bg-orange-500 text-white"
   : page === "..."
   ? "text-gray-400 cursor-default"
   : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  {page}
  </button>
  ))}
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
};

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
 const maxVisiblePages = 5;

 if (totalPages <= maxVisiblePages) {
 for (let i = 1; i <= totalPages; i++) {
 pages.push(i);
 }
 } else {
 if (currentPage <= 3) {
 for (let i = 1; i <= 4; i++) {
  pages.push(i);
 }
 pages.push("...");
 pages.push(totalPages);
 } else if (currentPage >= totalPages - 2) {
 pages.push(1);
 pages.push("...");
 for (let i = totalPages - 3; i <= totalPages; i++) {
  pages.push(i);
 }
 } else {
 pages.push(1);
 pages.push("...");
 for (let i = currentPage - 1; i <= currentPage + 1; i++) {
  pages.push(i);
 }
 pages.push("...");
 pages.push(totalPages);
 }
 }

 return pages;
 };

 return (
 <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-600">Rows per page:</span>
 <select
  value={rowsPerPage}
  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={25}>25</option>
  <option value={50}>50</option>
 </select>
 </div>

 <div className="flex items-center gap-1">
 <button
  onClick={() => onPageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <ChevronLeft size={18} />
 </button>

 {getPageNumbers().map((page, index) =>
  typeof page === "string" ? (
  <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
  {page}
  </span>
  ) : (
  <button
  key={page}
  onClick={() => onPageChange(page)}
  className={`px-3 py-1 rounded text-sm ${
  currentPage === page
   ? "bg-orange-500 text-white"
   : "hover:bg-gray-100 text-gray-600"
  }`}
  >
  {page}
  </button>
  )
 )}

 <button
  onClick={() => onPageChange(currentPage + 1)}
  disabled={currentPage === totalPages || totalPages === 0}
  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <ChevronRight size={18} />
 </button>
 </div>
 </div>
 );
};

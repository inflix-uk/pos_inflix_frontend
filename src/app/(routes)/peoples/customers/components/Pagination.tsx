"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps { currentPage: number; totalPages: number; rowsPerPage: number; onPageChange: (page: number) => void; onRowsPerPageChange: (rows: number) => void; }

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
 return (
 <div className="flex flex-col @[640px]:flex-row justify-between items-center gap-3 @[640px]:gap-4 p-3 @[640px]:p-4 border-t border-gray-200">
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-600">Rows per page:</span>
 <select value={rowsPerPage} onChange={(e) => onRowsPerPageChange(Number(e.target.value))} className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500">
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={25}>25</option>
  <option value={50}>50</option>
 </select>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
 <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={18} /></button>
 <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={18} /></button>
 </div>
 </div>
 );
};

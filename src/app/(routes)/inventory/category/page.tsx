"use client";

import React from "react";
import { useCategory } from "./hooks/useCategory";
import {
 CategoryHeader,
 CategoryFilters,
 CategoryTable,
 Pagination,
 DeleteCategoryModal,
} from "./components";

const CategoryPage = () => {
 const {
 categories,
 isLoading,
 message,
 selectedCategory,
 currentPage,
 rowsPerPage,
 totalPages,
 statusFilter,
 selectedCategories,
 selectAll,
 deleteModalOpen,
 fetchCategories,
 handleSearch,
 handleStatusFilter,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectCategory,
 openDeleteModal,
 closeDeleteModal,
 deleteCategory,
 } = useCategory();

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <CategoryHeader onRefresh={fetchCategories} />

 {/* Message Alert */}
 {message.text && (
 <div
  className={`mb-3 @[640px]:mb-4 px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 rounded-lg text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-green-50 border border-green-200 text-green-600"
  : "bg-red-50 border border-red-200 text-red-600"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Table Card */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <CategoryFilters
  onSearch={handleSearch}
  onStatusFilter={handleStatusFilter}
  statusFilter={statusFilter}
 />

 {isLoading ? (
  <div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
 ) : categories.length === 0 ? (
  <div className="text-center py-12 text-gray-500">
  No categories found
  </div>
 ) : (
  <CategoryTable
  categories={categories}
  selectedCategories={selectedCategories}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectCategory={handleSelectCategory}
  onDelete={openDeleteModal}
  />
 )}

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 {/* Delete Modal (kept as modal since it's a confirmation dialog) */}
 <DeleteCategoryModal
 open={deleteModalOpen}
 onClose={closeDeleteModal}
 onDelete={deleteCategory}
 category={selectedCategory}
 isLoading={isLoading}
 />
 </div>
 );
};

export default CategoryPage;

"use client";

import React from "react";
import { useSubCategory } from "./hooks/useSubCategory";
import {
 SubCategoryHeader,
 SubCategoryFilters,
 SubCategoryTable,
 Pagination,
 AddSubCategoryModal,
 EditSubCategoryModal,
 DeleteSubCategoryModal,
} from "./components";

const SubCategoryPage = () => {
 const {
 subCategories,
 categories,
 isLoading,
 message,
 selectedSubCategory,
 currentPage,
 rowsPerPage,
 totalPages,
 categoryFilter,
 statusFilter,
 selectedSubCategories,
 selectAll,
 addModalOpen,
 editModalOpen,
 deleteModalOpen,
 fetchSubCategories,
 handleSearch,
 handleCategoryFilter,
 handleStatusFilter,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectSubCategory,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 createSubCategory,
 updateSubCategory,
 deleteSubCategory,
 } = useSubCategory();

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <SubCategoryHeader onAddClick={openAddModal} onRefresh={fetchSubCategories} />

 {/* Message Alert */}
 {message.text && (
 <div
  className={`mb-4 px-4 py-3 rounded-lg text-sm ${
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
 <SubCategoryFilters
  onSearch={handleSearch}
  onStatusFilter={handleStatusFilter}
  onCategoryFilter={handleCategoryFilter}
  statusFilter={statusFilter}
  categoryFilter={categoryFilter}
  categories={categories}
 />

 {isLoading ? (
  <div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
 ) : subCategories.length === 0 ? (
  <div className="text-center py-12 text-gray-500">
  No sub-categories found
  </div>
 ) : (
  <SubCategoryTable
  subCategories={subCategories}
  selectedSubCategories={selectedSubCategories}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectSubCategory={handleSelectSubCategory}
  onEdit={openEditModal}
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

 {/* Modals */}
 <AddSubCategoryModal
 open={addModalOpen}
 onClose={closeAddModal}
 onAdd={createSubCategory}
 categories={categories}
 isLoading={isLoading}
 />

 <EditSubCategoryModal
 open={editModalOpen}
 onClose={closeEditModal}
 onSave={updateSubCategory}
 subCategory={selectedSubCategory}
 categories={categories}
 isLoading={isLoading}
 />

 <DeleteSubCategoryModal
 open={deleteModalOpen}
 onClose={closeDeleteModal}
 onDelete={deleteSubCategory}
 subCategory={selectedSubCategory}
 isLoading={isLoading}
 />
 </div>
 );
};

export default SubCategoryPage;

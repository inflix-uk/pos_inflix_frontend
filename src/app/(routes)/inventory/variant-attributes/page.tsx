"use client";

import React from "react";
import { useVariantAttribute } from "./hooks/useVariantAttribute";
import {
 VariantHeader,
 VariantFilters,
 VariantTable,
 Pagination,
 AddVariantModal,
 EditVariantModal,
} from "./components";

const VariantAttributesPage = () => {
 const {
 // Data
 variantAttributes,
 isLoading,
 message,

 // Pagination
 currentPage,
 totalPages,
 rowsPerPage,

 // Filters
 statusFilter,
 sortBy,

 // Selection
 selectedVariants,
 selectAll,

 // Modals
 addModalOpen,
 editModalOpen,
 selectedVariant,

 // Actions
 openAddModal,
 closeAddModal,
 closeEditModal,
 handleSearch,
 handleStatusFilter,
 handleSortChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectVariant,
 createVariantAttribute,
 updateVariantAttribute,
 toggleVariantStatus,
 openEditModal,
 fetchVariantAttributes,
 } = useVariantAttribute();

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <VariantHeader onAddClick={openAddModal} onRefresh={fetchVariantAttributes} />

 {/* Message */}
 {message.text && (
 <div
  className={`mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-lg text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-green-100 text-green-700"
  : "bg-red-100 text-red-700"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Loading */}
 {isLoading && (
 <div className="flex justify-center items-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
 </div>
 )}

 {/* Table Card */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <VariantFilters
  onSearch={handleSearch}
  onStatusFilter={handleStatusFilter}
  onSortChange={handleSortChange}
  statusFilter={statusFilter}
  sortBy={sortBy}
 />

 <VariantTable
  variants={variantAttributes}
  selectedVariants={selectedVariants}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectVariant={handleSelectVariant}
  onEdit={openEditModal}
  onToggleStatus={toggleVariantStatus}
 />

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 {/* Modals */}
 <AddVariantModal
 open={addModalOpen}
 onClose={closeAddModal}
 onAdd={createVariantAttribute}
 isLoading={isLoading}
 existingVariants={variantAttributes.map((v) => ({ name: v.name, slug: v.slug }))}
 />

 <EditVariantModal
 open={editModalOpen}
 variant={selectedVariant}
 onClose={closeEditModal}
 onUpdate={updateVariantAttribute}
 isLoading={isLoading}
 />
 </div>
 );
};

export default VariantAttributesPage;

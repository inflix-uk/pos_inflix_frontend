"use client";

import React from "react";
import { useCoupon } from "./hooks/useCoupon";
import {
 CouponHeader,
 CouponFilters,
 CouponTable,
 Pagination,
 AddCouponModal,
 EditCouponModal,
 DeleteCouponModal,
} from "./components";

const CouponsPage = () => {
 const {
 searchTerm,
 selectedType,
 selectedStatus,
 currentPage,
 rowsPerPage,
 selectedCoupons,
 selectAll,
 showTypeDropdown,
 showStatusDropdown,
 showSortDropdown,
 showAddModal,
 showEditModal,
 showDeleteModal,
 selectedCoupon,
 types,
 statuses,
 paginatedCoupons,
 totalPages,
 handleSearchChange,
 handleTypeChange,
 handleStatusChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectCoupon,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 handleAddCoupon,
 handleUpdateCoupon,
 handleDeleteCoupon,
 toggleTypeDropdown,
 toggleStatusDropdown,
 toggleSortDropdown,
 getStatusColor,
 getTypeColor,
 } = useCoupon();

 return (
 <div className="p-6">
 <CouponHeader onAddClick={openAddModal} />

 <div className="bg-white rounded-lg border border-gray-200 mb-6">
 <div className="p-6">
  <CouponFilters
  searchTerm={searchTerm}
  selectedType={selectedType}
  selectedStatus={selectedStatus}
  showTypeDropdown={showTypeDropdown}
  showStatusDropdown={showStatusDropdown}
  showSortDropdown={showSortDropdown}
  types={types}
  statuses={statuses}
  onSearchChange={handleSearchChange}
  onTypeChange={handleTypeChange}
  onStatusChange={handleStatusChange}
  onToggleTypeDropdown={toggleTypeDropdown}
  onToggleStatusDropdown={toggleStatusDropdown}
  onToggleSortDropdown={toggleSortDropdown}
  />
 </div>

 <CouponTable
  coupons={paginatedCoupons}
  selectedCoupons={selectedCoupons}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectCoupon={handleSelectCoupon}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  getStatusColor={getStatusColor}
  getTypeColor={getTypeColor}
 />

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 <AddCouponModal
 open={showAddModal}
 onClose={closeAddModal}
 onAdd={handleAddCoupon}
 />

 <EditCouponModal
 open={showEditModal}
 onClose={closeEditModal}
 onUpdate={handleUpdateCoupon}
 coupon={selectedCoupon}
 />

 <DeleteCouponModal
 open={showDeleteModal}
 onClose={closeDeleteModal}
 onDelete={handleDeleteCoupon}
 coupon={selectedCoupon}
 />
 </div>
 );
};

export default CouponsPage;

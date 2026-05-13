"use client";

import React from "react";
import { useDiscount } from "./hooks/useDiscount";
import {
 DiscountHeader,
 DiscountFilters,
 DiscountTable,
 Pagination,
} from "./components";

const DiscountListPage = () => {
 const {
 searchTerm,
 customerFilter,
 statusFilter,
 currentPage,
 rowsPerPage,
 selectedDiscounts,
 showCustomerDropdown,
 showStatusDropdown,
 customers,
 statuses,
 currentDiscounts,
 filteredDiscounts,
 totalPages,
 startIndex,
 handleSearchChange,
 handleCustomerFilterChange,
 handleStatusFilterChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectDiscount,
 toggleCustomerDropdown,
 toggleStatusDropdown,
 openAddModal,
 openEditModal,
 openDeleteModal,
 } = useDiscount();

 return (
 <div className="p-6 bg-gray-50 min-h-screen">
 <div className="bg-white rounded-lg shadow-sm">
 <div className="p-6 border-b border-gray-200">
  <DiscountHeader onAddClick={openAddModal} />
  <DiscountFilters
  searchTerm={searchTerm}
  customerFilter={customerFilter}
  statusFilter={statusFilter}
  showCustomerDropdown={showCustomerDropdown}
  showStatusDropdown={showStatusDropdown}
  customers={customers}
  statuses={statuses}
  onSearchChange={handleSearchChange}
  onCustomerFilterChange={handleCustomerFilterChange}
  onStatusFilterChange={handleStatusFilterChange}
  onToggleCustomerDropdown={toggleCustomerDropdown}
  onToggleStatusDropdown={toggleStatusDropdown}
  />
 </div>

 <DiscountTable
  discounts={currentDiscounts}
  selectedDiscounts={selectedDiscounts}
  onSelectAll={handleSelectAll}
  onSelectDiscount={handleSelectDiscount}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
 />

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  startIndex={startIndex}
  endIndex={startIndex + rowsPerPage}
  totalEntries={filteredDiscounts.length}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>
 </div>
 );
};

export default DiscountListPage;

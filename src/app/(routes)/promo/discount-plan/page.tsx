"use client";

import React from "react";
import { useDiscountPlan } from "./hooks/useDiscountPlan";
import {
 DiscountPlanHeader,
 DiscountPlanFilters,
 DiscountPlanTable,
 Pagination,
} from "./components";

const DiscountPlanPage = () => {
 const {
 searchTerm,
 selectedCustomer,
 selectedStatus,
 showCustomerDropdown,
 showStatusDropdown,
 currentPage,
 rowsPerPage,
 selectedItems,
 selectAll,
 customers,
 statuses,
 currentDiscountPlans,
 filteredDiscountPlans,
 totalPages,
 handleSearchChange,
 handleCustomerChange,
 handleStatusChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectItem,
 toggleCustomerDropdown,
 toggleStatusDropdown,
 openAddModal,
 openEditModal,
 openDeleteModal,
 getStatusBadgeColor,
 } = useDiscountPlan();

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <DiscountPlanHeader onAddClick={openAddModal} />

 <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
 <div className="p-6">
  <DiscountPlanFilters
  searchTerm={searchTerm}
  selectedCustomer={selectedCustomer}
  selectedStatus={selectedStatus}
  showCustomerDropdown={showCustomerDropdown}
  showStatusDropdown={showStatusDropdown}
  customers={customers}
  statuses={statuses}
  onSearchChange={handleSearchChange}
  onCustomerChange={handleCustomerChange}
  onStatusChange={handleStatusChange}
  onToggleCustomerDropdown={toggleCustomerDropdown}
  onToggleStatusDropdown={toggleStatusDropdown}
  />
 </div>

 <DiscountPlanTable
  discountPlans={currentDiscountPlans}
  selectedItems={selectedItems}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectItem={handleSelectItem}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  getStatusBadgeColor={getStatusBadgeColor}
 />

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  totalEntries={filteredDiscountPlans.length}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>
 </div>
 );
};

export default DiscountPlanPage;

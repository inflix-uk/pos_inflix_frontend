"use client";

import React from "react";
import { usePurchaseReturn } from "./hooks/usePurchaseReturn";
import {
 ReturnHeader,
 ReturnFilters,
 ReturnTable,
 Pagination,
 AddReturnModal,
 EditReturnModal,
 DeleteReturnModal,
 ReceiveRepairModal,
} from "./components";

const PurchaseReturnPage: React.FC = () => {
 const {
 searchTerm,
 statusFilter,
 sortBy,
 currentPage,
 rowsPerPage,
 selectedPurchaseReturns,
 showStatusDropdown,
 showSortDropdown,
 showAddModal,
 showEditModal,
 showDeleteModal,
 selectedPurchaseReturn,
 statuses,
 sortOptions,
 currentPurchaseReturns,
 totalPages,
 handleSearchChange,
 handleStatusFilterChange,
 handleSortChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectPurchaseReturn,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 showReceiveRepairModal,
 openReceiveRepairModal,
 closeReceiveRepairModal,
 handleReceiveRepair,
 handleAddPurchaseReturn,
 handleUpdatePurchaseReturn,
 handleDeletePurchaseReturn,
 toggleStatusDropdown,
 toggleSortDropdown,
 getStatusBadge,
 getProductIcon,
 message,
 } = usePurchaseReturn();

 return (
 <div className="@container p-2 @[480px]:p-3 @[640px]:p-4 @[1024px]:p-6 bg-gray-50 min-h-screen">
 {message && (
 <div
  className={`mb-3 @[640px]:mb-4 px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 rounded-lg text-xs @[640px]:text-sm ${
  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }`}
 >
  {message.text}
 </div>
 )}
 <div className="bg-white rounded-lg shadow-sm">
 {/* Header */}
 <div className="p-3 @[480px]:p-4 @[1024px]:p-6 border-b border-gray-200">
  <ReturnHeader onAddClick={openAddModal} />
  <ReturnFilters
  searchTerm={searchTerm}
  statusFilter={statusFilter}
  sortBy={sortBy}
  showStatusDropdown={showStatusDropdown}
  showSortDropdown={showSortDropdown}
  statuses={statuses}
  sortOptions={sortOptions}
  onSearchChange={handleSearchChange}
  onStatusFilterChange={handleStatusFilterChange}
  onSortChange={handleSortChange}
  onToggleStatusDropdown={toggleStatusDropdown}
  onToggleSortDropdown={toggleSortDropdown}
  />
 </div>

 {/* Table */}
 <ReturnTable
  purchaseReturns={currentPurchaseReturns}
  selectedPurchaseReturns={selectedPurchaseReturns}
  onSelectAll={handleSelectAll}
  onSelectPurchaseReturn={handleSelectPurchaseReturn}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  onReceiveRepair={openReceiveRepairModal}
  getStatusBadge={getStatusBadge}
  getProductIcon={getProductIcon}
 />

 {/* Pagination */}
 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 {/* Modals */}
 <AddReturnModal
 open={showAddModal}
 onClose={closeAddModal}
 onAdd={handleAddPurchaseReturn}
 />

 <EditReturnModal
 open={showEditModal}
 onClose={closeEditModal}
 onUpdate={handleUpdatePurchaseReturn}
 purchaseReturn={selectedPurchaseReturn}
 />

 <DeleteReturnModal
 open={showDeleteModal}
 onClose={closeDeleteModal}
 onDelete={handleDeletePurchaseReturn}
 purchaseReturn={selectedPurchaseReturn}
 />

 <ReceiveRepairModal
 open={showReceiveRepairModal}
 onClose={closeReceiveRepairModal}
 onReceive={handleReceiveRepair}
 purchaseReturn={selectedPurchaseReturn}
 />
 </div>
 );
};

export default PurchaseReturnPage;

"use client";

import React from "react";
import { useGiftCard } from "./hooks/useGiftCard";
import {
 GiftCardHeader,
 GiftCardFilters,
 GiftCardTable,
 Pagination,
 AddGiftCardModal,
 EditGiftCardModal,
 DeleteGiftCardModal,
 ViewGiftCardModal,
} from "./components";

const GiftCardsPage = () => {
 const {
 searchTerm,
 selectedStatus,
 showStatusDropdown,
 currentPage,
 rowsPerPage,
 selectedGiftCards,
 selectAll,
 statuses,
 currentGiftCards,
 totalPages,
 isLoading,
 message,
 showAddModal,
 showEditModal,
 showViewModal,
 showDeleteModal,
 selectedGiftCard,
 handleSearchChange,
 handleStatusChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectGiftCard,
 toggleStatusDropdown,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openViewModal,
 closeViewModal,
 openDeleteModal,
 closeDeleteModal,
 handleAddGiftCard,
 handleUpdateGiftCard,
 handleDeleteGiftCard,
 getStatusBadge,
 setMessage,
 } = useGiftCard();

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <GiftCardHeader onAddClick={openAddModal} />

 {message && (
 <div
  className={`mb-4 p-4 rounded-lg ${
  message.type === "success"
  ? "bg-green-100 text-green-800"
  : "bg-red-100 text-red-800"
  }`}
 >
  <div className="flex justify-between items-center">
  <span>{message.text}</span>
  <button
  onClick={() => setMessage(null)}
  className="text-lg font-bold"
  >
  ×
  </button>
  </div>
 </div>
 )}

 <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
 <div className="p-6">
  <GiftCardFilters
  searchTerm={searchTerm}
  selectedStatus={selectedStatus}
  showStatusDropdown={showStatusDropdown}
  statuses={statuses}
  onSearchChange={handleSearchChange}
  onStatusChange={handleStatusChange}
  onToggleStatusDropdown={toggleStatusDropdown}
  />
 </div>

 {isLoading ? (
  <div className="flex justify-center items-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
 ) : (
  <GiftCardTable
  giftCards={currentGiftCards}
  selectedGiftCards={selectedGiftCards}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectGiftCard={handleSelectGiftCard}
  onView={openViewModal}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  getStatusBadge={getStatusBadge}
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

 <AddGiftCardModal
 open={showAddModal}
 onClose={closeAddModal}
 onAdd={handleAddGiftCard}
 />

 <EditGiftCardModal
 open={showEditModal}
 onClose={closeEditModal}
 onUpdate={handleUpdateGiftCard}
 giftCard={selectedGiftCard}
 />

 <ViewGiftCardModal
 open={showViewModal}
 onClose={closeViewModal}
 giftCard={selectedGiftCard}
 />

 <DeleteGiftCardModal
 open={showDeleteModal}
 onClose={closeDeleteModal}
 onDelete={handleDeleteGiftCard}
 giftCard={selectedGiftCard}
 />
 </div>
 );
};

export default GiftCardsPage;

"use client";

import React from "react";
import { useLocation } from "./hooks/useLocation";
import {
 LocationHeader,
 LocationFilters,
 LocationTable,
 Pagination,
 AddLocationModal,
 EditLocationModal,
 DeleteLocationModal,
} from "./components";

const Page = () => {
 const {
 locations,
 isLoading,
 message,
 selectedLocation,
 currentPage,
 rowsPerPage,
 totalPages,
 statusFilter,
 typeFilter,
 sortBy,
 selectedLocations,
 selectAll,
 addModalOpen,
 editModalOpen,
 deleteModalOpen,
 handleSearch,
 handleStatusFilter,
 handleTypeFilter,
 handleSortChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectLocation,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 createLocation,
 updateLocation,
 deleteLocation,
 fetchLocations,
 } = useLocation();

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 {message.text && (
 <div
  className={`mb-4 p-4 rounded-lg ${
  message.type === "success"
  ? "bg-green-100 text-green-700"
  : "bg-red-100 text-red-700"
  }`}
 >
  {message.text}
 </div>
 )}

 <LocationHeader onAddClick={openAddModal} onRefresh={fetchLocations} />

 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <LocationFilters
  onSearch={handleSearch}
  statusFilter={statusFilter}
  onStatusFilter={handleStatusFilter}
  typeFilter={typeFilter}
  onTypeFilter={handleTypeFilter}
  sortBy={sortBy}
  onSortChange={handleSortChange}
 />

 <LocationTable
  locations={locations}
  selectedLocations={selectedLocations}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectLocation={handleSelectLocation}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
 />

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 <AddLocationModal
 open={addModalOpen}
 onClose={closeAddModal}
 onAdd={createLocation}
 isLoading={isLoading}
 />

 <EditLocationModal
 open={editModalOpen}
 location={selectedLocation}
 onClose={closeEditModal}
 onUpdate={updateLocation}
 isLoading={isLoading}
 />

 <DeleteLocationModal
 open={deleteModalOpen}
 location={selectedLocation}
 onClose={closeDeleteModal}
 onDelete={deleteLocation}
 isLoading={isLoading}
 />
 </div>
 );
};

export default Page;

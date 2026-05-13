"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePurchase } from "./hooks/usePurchase";
import {
 PurchaseHeader,
 PurchaseFilters,
 PurchaseTable,
 Pagination,
 AddPurchaseModal,
 EditPurchaseModal,
 DeletePurchaseModal,
 ImportParcelModal,
} from "./components";

type ImportModalType = "serial" | "non-serial" | null;

const PurchaseListPage = () => {
 const searchParams = useSearchParams();
 const router = useRouter();
 const [importModalOpen, setImportModalOpen] = useState(false);
 const [importModalType, setImportModalType] = useState<ImportModalType>(null);

 // Open import modal when arriving from sidebar (e.g. /purchases/list?import=serial)
 useEffect(() => {
 const importParam = searchParams.get("import");
 if (importParam === "serial" || importParam === "non-serial") {
 setImportModalType(importParam);
 setImportModalOpen(true);
 }
 }, [searchParams]);
 const {
 purchases,
 isLoading,
 message,
 selectedPurchase,
 currentPage,
 rowsPerPage,
 totalPages,
 statusFilter,
 paymentStatusFilter,
 completionStatusFilter,
 sortBy,
 selectedPurchases,
 selectAll,
 addModalOpen,
 editModalOpen,
 deleteModalOpen,
 fetchPurchases,
 handleSearch,
 handleStatusFilter,
 handlePaymentStatusFilter,
 handleCompletionStatusFilter,
 handleCompletionStatusChange,
 handleSortChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectPurchase,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 createPurchase,
 updatePurchase,
 deletePurchase,
 } = usePurchase();

 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[480px]:p-3 @[640px]:p-4 @[1024px]:p-6">
 {message.text && (
 <div
  className={`mb-3 @[640px]:mb-4 p-2.5 @[640px]:p-3 @[1024px]:p-4 rounded-lg text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-green-100 text-green-700"
  : "bg-red-100 text-red-700"
  }`}
 >
  {message.text}
 </div>
 )}

 <PurchaseHeader
 onRefresh={fetchPurchases}
 onOpenImportFile={() => { setImportModalType("serial"); setImportModalOpen(true); }}
 onOpenImportNonSerial={() => { setImportModalType("non-serial"); setImportModalOpen(true); }}
 />

 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <PurchaseFilters
  onSearch={handleSearch}
  statusFilter={statusFilter}
  onStatusFilter={handleStatusFilter}
  paymentStatusFilter={paymentStatusFilter}
  onPaymentStatusFilter={handlePaymentStatusFilter}
  completionStatusFilter={completionStatusFilter}
  onCompletionStatusFilter={handleCompletionStatusFilter}
  sortBy={sortBy}
  onSortChange={handleSortChange}
 />

 <PurchaseTable
  purchases={purchases}
  selectedPurchases={selectedPurchases}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectPurchase={handleSelectPurchase}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  onCompletionStatusChange={handleCompletionStatusChange}
 />

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 <AddPurchaseModal
 open={addModalOpen}
 onClose={closeAddModal}
 onAdd={createPurchase}
 isLoading={isLoading}
 />

 <EditPurchaseModal
 open={editModalOpen}
 purchase={selectedPurchase}
 onClose={closeEditModal}
 onUpdate={updatePurchase}
 isLoading={isLoading}
 />

 <DeletePurchaseModal
 open={deleteModalOpen}
 purchase={selectedPurchase}
 onClose={closeDeleteModal}
 onDelete={deletePurchase}
 isLoading={isLoading}
 />

 <ImportParcelModal
 open={importModalOpen}
 onClose={() => {
  setImportModalOpen(false);
  setImportModalType(null);
  // Clear ?import= from URL when closing modal
  if (searchParams.get("import")) {
  const next = new URLSearchParams(searchParams);
  next.delete("import");
  const q = next.toString();
  router.replace(q ? `/purchases/list?${q}` : "/purchases/list");
  }
 }}
 onSuccess={fetchPurchases}
 initialImportType={importModalType}
 />
 </div>
 );
};

export default PurchaseListPage;

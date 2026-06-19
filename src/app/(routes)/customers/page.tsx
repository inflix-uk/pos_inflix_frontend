"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "./hooks/useAccounts";
import {
 AccountHeader,
 AccountFilters,
 AccountTable,
 AddAccountModal,
 ImportCustomersModal,
 SetPasswordModal,
 Customer360PreviewPanel,
} from "./components";
import type { AccountRow } from "./types";
import { EditCustomerModal } from "../peoples/customers/components/EditCustomerModal";
import { DeleteCustomerModal } from "../peoples/customers/components/DeleteCustomerModal";
import { EditSupplierModal } from "../peoples/suppliers/components/EditSupplierModal";
import { DeleteSupplierModal } from "../peoples/suppliers/components/DeleteSupplierModal";

export default function CustomersPage() {
 const router = useRouter();
 const [importModalOpen, setImportModalOpen] = useState(false);
 const [lastImportedCount, setLastImportedCount] = useState<number | null>(null);
 const [passwordModalOpen, setPasswordModalOpen] = useState(false);
 const [passwordTarget, setPasswordTarget] = useState<{ id: string; name: string; email: string } | null>(null);
 const [previewCustomerId, setPreviewCustomerId] = useState<string | null>(null);
 const {
 rows,
 customers,
 isLoading,
 message,
 searchTerm,
 statusFilter,
 kindFilter,
 setSearchTerm,
 setStatusFilter,
 setKindFilter,
 selectedAccount,
 addModalOpen,
 editModalOpen,
 deleteModalOpen,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 createCustomer,
 createSupplier,
 saveCustomer,
 saveSupplier,
 deleteCustomer,
 deleteSupplier,
 fetchAll,
 exportCustomersAsCsv,
 deleteLastImported,
 } = useAccounts();

 const handleSetPassword = (row: AccountRow) => {
 if (row.kind === "customer" && row.data.email) {
 setPasswordTarget({ id: row.id, name: row.data.name, email: row.data.email });
 setPasswordModalOpen(true);
 }
 };

 const handleCustomerClick = (row: AccountRow) => {
 if (row.kind === "customer") {
 setPreviewCustomerId(row.id);
 }
 };

 const handleRecordPaymentFromPreview = (customerId: string) => {
 router.push(`/customers/${customerId}?tab=statement`);
 };

 const handleUndoImport = () => {
 if (lastImportedCount == null) return;
 deleteLastImported(lastImportedCount);
 setLastImportedCount(null);
 };

 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 {message.text && (
 <div
  className={`mb-3 @[640px]:mb-4 p-2.5 @[640px]:p-3 @[768px]:p-4 rounded-lg text-[11px] @[640px]:text-xs @[768px]:text-sm ${
  message.type === "success"
  ? "bg-green-100 text-green-700"
  : "bg-red-100 text-red-700"
  }`}
 >
  {message.text}
 </div>
 )}

 {lastImportedCount != null && lastImportedCount > 0 && (
 <div className="mb-3 @[640px]:mb-4 p-2.5 @[640px]:p-3 @[768px]:p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800 flex flex-wrap items-center justify-between gap-2 @[640px]:gap-3">
  <span className="font-medium text-[11px] @[640px]:text-xs @[768px]:text-sm">
  Imported {lastImportedCount} customer{lastImportedCount === 1 ? "" : "s"}.
  </span>
  <button
  type="button"
  onClick={handleUndoImport}
  className="px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium"
  >
  Undo – delete all {lastImportedCount} in one go
  </button>
 </div>
 )}

 <AccountHeader
 customerCount={customers.length}
 supplierCount={rows.filter((r) => r.kind === "supplier").length}
 onAddClick={openAddModal}
 onRefresh={fetchAll}
 onImportClick={() => setImportModalOpen(true)}
 onExportClick={exportCustomersAsCsv}
 onDeleteLastImported={() => deleteLastImported(1)}
 />

 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <AccountFilters
  searchTerm={searchTerm}
  onSearch={setSearchTerm}
  statusFilter={statusFilter}
  onStatusFilter={setStatusFilter}
  kindFilter={kindFilter}
  onKindFilter={setKindFilter}
 />
 <AccountTable
  rows={rows}
  isLoading={isLoading}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  onSetPassword={handleSetPassword}
  onCustomerClick={handleCustomerClick}
 />
 </div>

 <AddAccountModal
 open={addModalOpen}
 onClose={closeAddModal}
 onCreateCustomer={createCustomer}
 onCreateSupplier={createSupplier}
 isLoading={isLoading}
 />

 {selectedAccount?.kind === "customer" && (
 <EditCustomerModal
  open={editModalOpen}
  customer={selectedAccount.data}
  onClose={closeEditModal}
  onSave={saveCustomer}
  isLoading={isLoading}
 />
 )}
 {selectedAccount?.kind === "supplier" && (
 <EditSupplierModal
  open={editModalOpen}
  supplier={selectedAccount.data}
  onClose={closeEditModal}
  onSave={saveSupplier}
  isLoading={isLoading}
 />
 )}

 {selectedAccount?.kind === "customer" && (
 <DeleteCustomerModal
  open={deleteModalOpen}
  customer={selectedAccount.data}
  onClose={closeDeleteModal}
  onDelete={deleteCustomer}
  isLoading={isLoading}
 />
 )}
 {selectedAccount?.kind === "supplier" && (
 <DeleteSupplierModal
  open={deleteModalOpen}
  supplier={selectedAccount.data}
  onClose={closeDeleteModal}
  onDelete={deleteSupplier}
  isLoading={isLoading}
 />
 )}

 <ImportCustomersModal
 open={importModalOpen}
 onClose={() => setImportModalOpen(false)}
 onSuccess={(count) => {
  setLastImportedCount(count);
  fetchAll();
 }}
 />

 {passwordTarget && (
 <SetPasswordModal
  open={passwordModalOpen}
  customerId={passwordTarget.id}
  customerName={passwordTarget.name}
  customerEmail={passwordTarget.email}
  onClose={() => {
  setPasswordModalOpen(false);
  setPasswordTarget(null);
  }}
  onSuccess={() => {}}
 />
 )}

 <Customer360PreviewPanel
  customerId={previewCustomerId}
  open={previewCustomerId != null}
  onClose={() => setPreviewCustomerId(null)}
  onRecordPayment={handleRecordPaymentFromPreview}
 />
 </div>
 );
}

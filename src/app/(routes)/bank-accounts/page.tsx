"use client";

import React from "react";
import { useBankAccounts } from "./hooks/useBankAccounts";
import {
 BankAccountForm,
 BankAccountList,
 DeleteConfirmModal,
 PageHeader,
 MessageAlert,
 LoadingSpinner,
} from "./components";

export default function BankAccountsPage() {
 const {
 accounts,
 formData,
 editingAccount,
 deletingAccount,
 isLoading,
 isSaving,
 showForm,
 showDeleteModal,
 message,
 handleChange,
 handleCheckboxChange,
 openAddForm,
 openEditForm,
 closeForm,
 saveAccount,
 openDeleteModal,
 closeDeleteModal,
 deleteAccount,
 setDefaultAccount,
 } = useBankAccounts();

 if (isLoading && accounts.length === 0) {
 return <LoadingSpinner />;
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <PageHeader onAddClick={openAddForm} showAddButton={!showForm} />

 <MessageAlert message={message} />

 {showForm && (
 <BankAccountForm
  formData={formData}
  isEditing={!!editingAccount}
  isSaving={isSaving}
  onChange={handleChange}
  onCheckboxChange={handleCheckboxChange}
  onSubmit={saveAccount}
  onCancel={closeForm}
 />
 )}

 <BankAccountList
 accounts={accounts}
 onEdit={openEditForm}
 onDelete={openDeleteModal}
 onSetDefault={setDefaultAccount}
 />

 <DeleteConfirmModal
 isOpen={showDeleteModal}
 account={deletingAccount}
 onClose={closeDeleteModal}
 onConfirm={deleteAccount}
 isLoading={isLoading}
 />
 </div>
 );
}

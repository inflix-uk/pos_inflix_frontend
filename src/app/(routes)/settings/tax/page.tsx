"use client";

import React from "react";
import { useTaxSettings } from "./hooks/useTaxSettings";
import {
 TaxForm,
 TaxList,
 DeleteConfirmModal,
 PageHeader,
 MessageAlert,
 LoadingSpinner,
} from "./components";

const TaxSettingsPage = () => {
 const {
 taxes,
 formData,
 editingTax,
 deletingTax,
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
 saveTax,
 openDeleteModal,
 closeDeleteModal,
 deleteTax,
 setDefaultTax,
 } = useTaxSettings();

 if (isLoading && taxes.length === 0) {
 return <LoadingSpinner />;
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 <PageHeader onAddClick={openAddForm} showAddButton={!showForm} />

 <MessageAlert message={message} />

 {showForm && (
 <TaxForm
  formData={formData}
  isEditing={!!editingTax}
  isSaving={isSaving}
  onChange={handleChange}
  onCheckboxChange={handleCheckboxChange}
  onSubmit={saveTax}
  onCancel={closeForm}
 />
 )}

 <TaxList
 taxes={taxes}
 onEdit={openEditForm}
 onDelete={openDeleteModal}
 onSetDefault={setDefaultTax}
 />

 <DeleteConfirmModal
 isOpen={showDeleteModal}
 tax={deletingTax}
 onClose={closeDeleteModal}
 onConfirm={deleteTax}
 isLoading={isLoading}
 />
 </div>
 );
};

export default TaxSettingsPage;

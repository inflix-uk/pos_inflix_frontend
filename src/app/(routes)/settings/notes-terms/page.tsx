"use client";

import React, { Suspense, useState } from "react";
import { useNotesTermsSettings } from "./hooks/useNotesTermsSettings";
import {
 NotesTermsForm,
 DeleteConfirmModal,
 MessageAlert,
 PageHeader,
 LoadingSpinner,
} from "./components";

const NotesTermsSettingsPage = () => {
 const {
 formData,
 isLoading,
 isSaving,
 message,
 hasExistingData,
 handleChange,
 reorderSalesReceiptSections,
 reorderRepairTicketSections,
 reorderRepairLabelFields,
 saveSettings,
 resetForm,
 deleteSettings,
 } = useNotesTermsSettings();

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

 const handleDeleteClick = () => {
 setShowDeleteConfirm(true);
 };

 const confirmDelete = async () => {
 await deleteSettings();
 setShowDeleteConfirm(false);
 };

 if (isLoading) {
 return <LoadingSpinner />;
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4">
 <PageHeader />

 <MessageAlert message={message} />

 <Suspense fallback={<LoadingSpinner />}>
  <NotesTermsForm
   formData={formData}
   isSaving={isSaving}
   hasExistingData={hasExistingData}
   onChange={handleChange}
   onReorderSalesReceiptSections={reorderSalesReceiptSections}
   onReorderRepairTicketSections={reorderRepairTicketSections}
   onReorderRepairLabelFields={reorderRepairLabelFields}
   onSubmit={saveSettings}
   onReset={resetForm}
   onDelete={handleDeleteClick}
  />
 </Suspense>

 <DeleteConfirmModal
 isOpen={showDeleteConfirm}
 onClose={() => setShowDeleteConfirm(false)}
 onConfirm={confirmDelete}
 isLoading={isLoading}
 />
 </div>
 );
};

export default NotesTermsSettingsPage;

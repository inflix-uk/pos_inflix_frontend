"use client";

import React, { useState } from "react";
import { useEmailSettings } from "./hooks/useEmailSettings";
import {
 EmailForm,
 TestEmailModal,
 DeleteConfirmModal,
 PageHeader,
 MessageAlert,
 LoadingSpinner,
} from "./components";

const EmailSettingsPage = () => {
 const {
 formData,
 isLoading,
 isSaving,
 isTesting,
 message,
 hasExistingData,
 handleChange,
 handleCheckboxChange,
 saveSettings,
 resetForm,
 deleteSettings,
 testEmail,
 } = useEmailSettings();

 const [showTestModal, setShowTestModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);

 const handleTestClick = () => {
 setShowTestModal(true);
 };

 const handleTestEmail = async (email: string) => {
 await testEmail(email);
 setShowTestModal(false);
 };

 const handleDeleteClick = () => {
 setShowDeleteModal(true);
 };

 const confirmDelete = async () => {
 await deleteSettings();
 setShowDeleteModal(false);
 };

 if (isLoading) {
 return <LoadingSpinner />;
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 <PageHeader />

 <MessageAlert message={message} />

 <EmailForm
 formData={formData}
 isSaving={isSaving}
 isTesting={isTesting}
 hasExistingData={hasExistingData}
 onChange={handleChange}
 onCheckboxChange={handleCheckboxChange}
 onSubmit={saveSettings}
 onReset={resetForm}
 onDelete={handleDeleteClick}
 onTest={handleTestClick}
 />

 <TestEmailModal
 isOpen={showTestModal}
 onClose={() => setShowTestModal(false)}
 onTest={handleTestEmail}
 isTesting={isTesting}
 />

 <DeleteConfirmModal
 isOpen={showDeleteModal}
 onClose={() => setShowDeleteModal(false)}
 onConfirm={confirmDelete}
 isLoading={isLoading}
 />
 </div>
 );
};

export default EmailSettingsPage;

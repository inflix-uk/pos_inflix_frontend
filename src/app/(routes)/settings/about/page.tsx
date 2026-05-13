"use client";

import React, { useState } from "react";
import { useAboutSettings } from "./hooks/useAboutSettings";
import {
 AboutSettingsForm,
 DeleteConfirmModal,
 MessageAlert,
 PageHeader,
 LoadingSpinner,
} from "./components";

const AboutSettingsPage = () => {
 const {
 formData,
 isLoading,
 isSaving,
 message,
 hasExistingData,
 handleChange,
 handleLogoChange,
 removeLogo,
 saveSettings,
 resetForm,
 deleteSettings,
 } = useAboutSettings();

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
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 <PageHeader />

 <MessageAlert message={message} />

 <AboutSettingsForm
 formData={formData}
 isLoading={isLoading}
 isSaving={isSaving}
 hasExistingData={hasExistingData}
 onChange={handleChange}
 onLogoChange={handleLogoChange}
 onRemoveLogo={removeLogo}
 onSubmit={saveSettings}
 onReset={resetForm}
 onDelete={handleDeleteClick}
 />

 <DeleteConfirmModal
 isOpen={showDeleteConfirm}
 onClose={() => setShowDeleteConfirm(false)}
 onConfirm={confirmDelete}
 isLoading={isLoading}
 />
 </div>
 );
};

export default AboutSettingsPage;

"use client";

import React, { useState } from "react";
import {
 ProfileCard,
 EditProfileForm,
 ChangePasswordForm,
 ProfileTabs,
 MessageAlert,
 TabType,
} from "./components";
import { useProfile } from "./hooks/useProfile";

const ProfilePage = () => {
 const [activeTab, setActiveTab] = useState<TabType>("profile");

 const {
 userData,
 profileForm,
 passwordForm,
 isLoading,
 message,
 handleProfileChange,
 handlePasswordChange,
 updateProfile,
 updatePassword,
 } = useProfile();

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {/* Page Header */}
 <div className="mb-6">
 <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>
 <p className="text-gray-500 text-sm mt-1">
  Manage your account settings and preferences
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Profile Card */}
 <div className="lg:col-span-1">
  <ProfileCard userData={userData} />
 </div>

 {/* Settings Card */}
 <div className="lg:col-span-2">
  <div className="bg-white rounded-lg shadow-sm">
  <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

  <MessageAlert message={message} />

  {activeTab === "profile" ? (
  <EditProfileForm
  profileForm={profileForm}
  userData={userData}
  isLoading={isLoading}
  onChange={handleProfileChange}
  onSubmit={updateProfile}
  />
  ) : (
  <ChangePasswordForm
  passwordForm={passwordForm}
  isLoading={isLoading}
  onChange={handlePasswordChange}
  onSubmit={updatePassword}
  />
  )}
  </div>
 </div>
 </div>
 </div>
 );
};

export default ProfilePage;

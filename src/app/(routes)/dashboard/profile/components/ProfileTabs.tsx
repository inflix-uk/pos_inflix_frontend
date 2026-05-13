"use client";

import React from "react";
import { User, Lock } from "lucide-react";

export type TabType = "profile" | "password";

interface ProfileTabsProps {
 activeTab: TabType;
 onTabChange: (tab: TabType) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
 activeTab,
 onTabChange,
}) => {
 return (
 <div className="border-b border-gray-200">
 <div className="flex">
 <button
  onClick={() => onTabChange("profile")}
  className={`px-6 py-4 text-sm font-medium transition-colors ${
  activeTab === "profile"
  ? "text-orange-500 border-b-2 border-orange-500"
  : "text-gray-500 hover:text-gray-700"
  }`}
 >
  <User className="w-4 h-4 inline-block mr-2" />
  Edit Profile
 </button>
 <button
  onClick={() => onTabChange("password")}
  className={`px-6 py-4 text-sm font-medium transition-colors ${
  activeTab === "password"
  ? "text-orange-500 border-b-2 border-orange-500"
  : "text-gray-500 hover:text-gray-700"
  }`}
 >
  <Lock className="w-4 h-4 inline-block mr-2" />
  Change Password
 </button>
 </div>
 </div>
 );
};

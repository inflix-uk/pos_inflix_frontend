"use client";

import React from "react";
import { Camera, Shield, Calendar, Clock } from "lucide-react";
import { UserInitialsAvatar } from "@/lib/userAvatar";
import { UserData } from "../types";

interface ProfileCardProps {
 userData: UserData;
}

const getRoleBadgeColor = (role: string) => {
 switch (role) {
 case "admin":
 return "bg-red-100 text-red-700";
 case "manager":
 return "bg-blue-100 text-blue-700";
 case "cashier":
 return "bg-green-100 text-green-700";
 default:
 return "bg-gray-100 text-gray-700";
 }
};

const formatDate = (dateString?: string) => {
 if (!dateString) return "N/A";
 return new Date(dateString).toLocaleDateString();
};

export const ProfileCard: React.FC<ProfileCardProps> = ({ userData }) => {
 return (
 <div className="bg-white rounded-lg shadow-sm p-6">
 {/* Avatar */}
 <div className="flex flex-col items-center">
 <div className="relative">
  <UserInitialsAvatar name={userData.name || "User"} size="lg" />
  <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
  <Camera className="w-4 h-4" />
  </button>
 </div>

 <h2 className="mt-4 text-xl font-semibold text-gray-800">
  {userData.name}
 </h2>
 <p className="text-gray-500 text-sm">{userData.email}</p>

 <span
  className={`mt-2 px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
  userData.role
  )}`}
 >
  {userData.role}
 </span>
 </div>

 {/* Stats */}
 <div className="mt-6 pt-6 border-t border-gray-200">
 <div className="space-y-4">
  <div className="flex items-center text-sm">
  <Shield className="w-4 h-4 text-gray-400 mr-3" />
  <span className="text-gray-600">Role:</span>
  <span className="ml-auto font-medium text-gray-800 capitalize">
  {userData.role}
  </span>
  </div>
  <div className="flex items-center text-sm">
  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
  <span className="text-gray-600">Joined:</span>
  <span className="ml-auto font-medium text-gray-800">
  {formatDate(userData.createdAt)}
  </span>
  </div>
  <div className="flex items-center text-sm">
  <Clock className="w-4 h-4 text-gray-400 mr-3" />
  <span className="text-gray-600">Last Login:</span>
  <span className="ml-auto font-medium text-gray-800">
  {formatDate(userData.lastLogin)}
  </span>
  </div>
 </div>
 </div>
 </div>
 );
};

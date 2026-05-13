"use client";

import React from "react";
import { User, Mail, Phone, Shield, Save } from "lucide-react";
import { ProfileFormData, UserData } from "../types";

interface EditProfileFormProps {
 profileForm: ProfileFormData;
 userData: UserData;
 isLoading: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 onSubmit: (e: React.FormEvent) => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
 profileForm,
 userData,
 isLoading,
 onChange,
 onSubmit,
}) => {
 return (
 <form onSubmit={onSubmit} className="p-6 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Name */}
 <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Full Name
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <User className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  name="name"
  value={profileForm.name}
  onChange={onChange}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter your name"
  />
  </div>
 </div>

 {/* Email */}
 <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Email Address
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Mail className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="email"
  name="email"
  value={profileForm.email}
  onChange={onChange}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter your email"
  />
  </div>
 </div>

 {/* Phone */}
 <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Phone Number
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Phone className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  name="phone"
  value={profileForm.phone}
  onChange={onChange}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter your phone number"
  />
  </div>
 </div>

 {/* Role (Read-only) */}
 <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Role
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Shield className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  value={userData.role}
  disabled
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 capitalize cursor-not-allowed"
  />
  </div>
 </div>
 </div>

 <div className="flex justify-end">
 <button
  type="submit"
  disabled={isLoading}
  className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
 >
  <Save className="w-4 h-4 mr-2" />
  {isLoading ? "Saving..." : "Save Changes"}
 </button>
 </div>
 </form>
 );
};

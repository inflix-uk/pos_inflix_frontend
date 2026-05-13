"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { PasswordFormData } from "../types";

interface ChangePasswordFormProps {
 passwordForm: PasswordFormData;
 isLoading: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 onSubmit: (e: React.FormEvent) => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
 passwordForm,
 isLoading,
 onChange,
 onSubmit,
}) => {
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 return (
 <form onSubmit={onSubmit} className="p-6 space-y-6">
 {/* Current Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
  Current Password
 </label>
 <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Lock className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type={showCurrentPassword ? "text" : "password"}
  name="currentPassword"
  value={passwordForm.currentPassword}
  onChange={onChange}
  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter current password"
  />
  <button
  type="button"
  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
  className="absolute inset-y-0 right-0 pr-3 flex items-center"
  >
  {showCurrentPassword ? (
  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
  ) : (
  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
  )}
  </button>
 </div>
 </div>

 {/* New Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
  New Password
 </label>
 <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Lock className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type={showNewPassword ? "text" : "password"}
  name="newPassword"
  value={passwordForm.newPassword}
  onChange={onChange}
  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter new password"
  />
  <button
  type="button"
  onClick={() => setShowNewPassword(!showNewPassword)}
  className="absolute inset-y-0 right-0 pr-3 flex items-center"
  >
  {showNewPassword ? (
  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
  ) : (
  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
  )}
  </button>
 </div>
 </div>

 {/* Confirm Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
  Confirm New Password
 </label>
 <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Lock className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type={showConfirmPassword ? "text" : "password"}
  name="confirmPassword"
  value={passwordForm.confirmPassword}
  onChange={onChange}
  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Confirm new password"
  />
  <button
  type="button"
  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  className="absolute inset-y-0 right-0 pr-3 flex items-center"
  >
  {showConfirmPassword ? (
  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
  ) : (
  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
  )}
  </button>
 </div>
 </div>

 <div className="flex justify-end">
 <button
  type="submit"
  disabled={isLoading}
  className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
 >
  <Lock className="w-4 h-4 mr-2" />
  {isLoading ? "Updating..." : "Update Password"}
 </button>
 </div>
 </form>
 );
};

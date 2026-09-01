"use client";

import React from "react";
import {
 Save,
 RotateCcw,
 Trash2,
 Server,
 Lock,
 User,
 Mail,
 Send,
 Shield,
} from "lucide-react";
import { EmailFormProps } from "../types";

export const EmailForm: React.FC<EmailFormProps> = ({
 formData,
 isSaving,
 isTesting,
 hasExistingData,
 onChange,
 onCheckboxChange,
 onSubmit,
 onReset,
 onDelete,
 onTest,
}) => {
 return (
 <form onSubmit={onSubmit}>
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <div className="p-6 border-b border-gray-200">
  <h2 className="text-lg font-medium text-gray-800">SMTP Configuration</h2>
  <p className="text-sm text-gray-500 mt-1">
  Configure your email server settings for sending emails
  </p>
 </div>

 <div className="p-6 space-y-6">
  {/* SMTP Server Settings */}
  <div className="grid grid-cols-1 @[768px]:grid-cols-3 gap-6">
  {/* SMTP Host */}
  <div className="@[768px]:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
  SMTP Host <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Server className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="smtpHost"
   value={formData.smtpHost}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="e.g., smtp.gmail.com, smtp.office365.com"
  />
  </div>
  </div>

  {/* SMTP Port */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  SMTP Port <span className="text-red-500">*</span>
  </label>
  <input
  type="number"
  name="smtpPort"
  value={formData.smtpPort}
  onChange={onChange}
  min="1"
  max="65535"
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="587"
  />
  <p className="text-xs text-gray-500 mt-1">Common: 25, 465, 587, 2525</p>
  </div>
  </div>

  {/* Security & Authentication */}
  <div className="grid grid-cols-1 @[768px]:grid-cols-3 gap-6">
  {/* SMTP Secure */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  <div className="flex items-center gap-2">
   <Shield className="h-4 w-4 text-gray-400" />
   Encryption
  </div>
  </label>
  <select
  name="smtpSecure"
  value={formData.smtpSecure}
  onChange={onChange}
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  >
  <option value="none">None</option>
  <option value="tls">TLS (Recommended)</option>
  <option value="ssl">SSL</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">
  Use port <strong>587 + TLS</strong> or <strong>465 + SSL</strong>. If one fails, try the other.
  </p>
  </div>

  {/* SMTP Username */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  SMTP Username <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <User className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="smtpUsername"
   value={formData.smtpUsername}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="your@email.com"
  />
  </div>
  </div>

  {/* SMTP Password */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  SMTP Password <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Lock className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="password"
   name="smtpPassword"
   value={formData.smtpPassword}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="App password or SMTP password"
  />
  </div>
  <p className="text-xs text-gray-500 mt-1">For Gmail, use App Password</p>
  </div>
  </div>

  {/* Sender Information */}
  <div className="border-t border-gray-200 pt-6">
  <h3 className="text-md font-medium text-gray-800 mb-4">Sender Information</h3>

  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-6">
  {/* From Email */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   From Email <span className="text-red-500">*</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Mail className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="email"
   name="fromEmail"
   value={formData.fromEmail}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="noreply@yourcompany.com"
   />
  </div>
  </div>

  {/* From Name */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   From Name <span className="text-red-500">*</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <User className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="text"
   name="fromName"
   value={formData.fromName}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="Your Company Name"
   />
  </div>
  </div>

  {/* Reply To Email */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   Reply-To Email <span className="text-gray-400">(Optional)</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Mail className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="email"
   name="replyToEmail"
   value={formData.replyToEmail}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="support@yourcompany.com"
   />
  </div>
  </div>

  {/* Reply To Name */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   Reply-To Name <span className="text-gray-400">(Optional)</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <User className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="text"
   name="replyToName"
   value={formData.replyToName}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="Support Team"
   />
  </div>
  </div>
  </div>
  </div>

  {/* Options */}
  <div className="border-t border-gray-200 pt-6">
  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.enableEmailNotifications}
  onChange={(e) => onCheckboxChange("enableEmailNotifications", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <span className="text-sm text-gray-700">Enable email notifications</span>
  </label>
  </div>
 </div>

 {/* Action Buttons */}
 <div className="p-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
  <div className="flex items-center gap-3">
  {hasExistingData && (
  <>
  <button
   type="button"
   onClick={onDelete}
   className="inline-flex items-center px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors"
  >
   <Trash2 className="w-4 h-4 mr-2" />
   Delete
  </button>
  <button
   type="button"
   onClick={onTest}
   disabled={isTesting}
   className="inline-flex items-center px-4 py-2 border border-orange-500 text-orange-500 hover:bg-orange-50 font-medium rounded-lg transition-colors disabled:opacity-70"
  >
   <Send className="w-4 h-4 mr-2" />
   {isTesting ? "Testing..." : "Test Email"}
  </button>
  </>
  )}
  </div>
  <div className="flex items-center gap-3">
  <button
  type="button"
  onClick={onReset}
  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
  >
  <RotateCcw className="w-4 h-4 mr-2" />
  Reset
  </button>
  <button
  type="submit"
  disabled={isSaving}
  className="inline-flex items-center px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  <Save className="w-4 h-4 mr-2" />
  {isSaving ? "Saving..." : "Save Settings"}
  </button>
  </div>
 </div>
 </div>
 </form>
 );
};

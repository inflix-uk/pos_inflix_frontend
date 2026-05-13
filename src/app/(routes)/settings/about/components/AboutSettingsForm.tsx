"use client";

import React from "react";
import {
 Save,
 RotateCcw,
 Trash2,
 Upload,
 X,
 Building2,
 FileText,
 Receipt,
 Type,
 AppWindow,
 LogIn,
} from "lucide-react";
import { AboutSettingsFormProps } from "../types";

export const AboutSettingsForm: React.FC<AboutSettingsFormProps> = ({
 formData,
 isSaving,
 hasExistingData,
 onChange,
 onLogoChange,
 onRemoveLogo,
 onSubmit,
 onReset,
 onDelete,
}) => {
 return (
 <form onSubmit={onSubmit}>
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <div className="p-6 border-b border-gray-200">
  <h2 className="text-lg font-medium text-gray-800">Application Information</h2>
  <p className="text-sm text-gray-500 mt-1">
  Basic information about your application
  </p>
 </div>

 <div className="p-6 space-y-6">
  {/* App Title & App Name Row */}
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-6">
  {/* App Title */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  APP TITLE <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Type className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="appTitle"
   value={formData.appTitle}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="Enter app title"
  />
  </div>
  </div>

  {/* App Name */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  APP NAME <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <AppWindow className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="appName"
   value={formData.appName}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="Enter app name"
  />
  </div>
  </div>
  </div>

  {/* Logo Upload */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Logo
  </label>
  <div className="flex items-start gap-4">
  {formData.logoPreview ? (
  <div className="relative">
   <img
   src={formData.logoPreview}
   alt="Logo preview"
   className="w-32 h-32 object-contain border border-gray-200 rounded-lg bg-gray-50"
   />
   <button
   type="button"
   onClick={onRemoveLogo}
   className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
   >
   <X className="h-4 w-4" />
   </button>
  </div>
  ) : (
  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
   <Upload className="h-8 w-8 text-gray-400" />
  </div>
  )}
  <div className="flex-1">
  <label className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg cursor-pointer transition-colors">
   <Upload className="h-4 w-4 mr-2" />
   Choose file
   <input
   type="file"
   accept="image/*"
   onChange={onLogoChange}
   className="hidden"
   />
  </label>
  <p className="text-xs text-gray-500 mt-2">
   Recommended: PNG or JPG, max 2MB. Size: max 500x200px (will be auto-resized if larger)
  </p>
  </div>
  </div>
  </div>

  {/* Login Page Title */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  LOGIN PAGE TITLE
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <LogIn className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  name="loginPageTitle"
  value={formData.loginPageTitle}
  onChange={onChange}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter login page title"
  />
  </div>
  </div>

  {/* Company Address */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  COMPANY ADDRESS
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Building2 className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  name="companyAddress"
  value={formData.companyAddress}
  onChange={onChange}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="Enter company address"
  />
  </div>
  </div>

  {/* PDF Titles Row */}
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-6">
  {/* Order PDF Title */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  ORDER PDF TITLE
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <FileText className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="orderPdfTitle"
   value={formData.orderPdfTitle}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="Enter order PDF title"
  />
  </div>
  </div>

  {/* Invoice PDF Title */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  INVOICE PDF TITLE
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Receipt className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="invoicePdfTitle"
   value={formData.invoicePdfTitle}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="Enter invoice PDF title"
  />
  </div>
  </div>
  </div>
 </div>

 {/* Action Buttons */}
 <div className="p-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
  <div>
  {hasExistingData && (
  <button
  type="button"
  onClick={onDelete}
  className="inline-flex items-center px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors"
  >
  <Trash2 className="w-4 h-4 mr-2" />
  Reset to Defaults
  </button>
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

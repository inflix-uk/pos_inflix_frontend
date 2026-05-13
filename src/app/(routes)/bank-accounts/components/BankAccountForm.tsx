"use client";

import React from "react";
import {
 Save,
 X,
 User,
 Building2,
 CreditCard,
 Hash,
 Globe,
 MapPin,
} from "lucide-react";
import { BankAccountFormProps } from "../types";

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
 formData,
 isEditing,
 isSaving,
 onChange,
 onCheckboxChange,
 onSubmit,
 onCancel,
}) => {
 return (
 <div className="@container bg-white rounded-lg shadow-sm border border-gray-200 mb-4 @[640px]:mb-5 @[768px]:mb-6">
 <div className="p-4 @[640px]:p-5 @[768px]:p-6 border-b border-gray-200">
 <h2 className="text-base @[640px]:text-lg font-medium text-gray-800">
  {isEditing ? "Edit Bank Account" : "Add New Bank Account"}
 </h2>
 <p className="text-xs @[640px]:text-sm text-gray-500 mt-1">
  Enter UK bank account details
 </p>
 </div>

 <form onSubmit={onSubmit}>
 <div className="p-4 @[640px]:p-5 @[768px]:p-6 space-y-4 @[640px]:space-y-5 @[768px]:space-y-6">
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-4 @[640px]:gap-5 @[768px]:gap-6">
  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  Account Name <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <User className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="accountName"
   value={formData.accountName}
   onChange={onChange}
   className="block w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="e.g., Business Account"
  />
  </div>
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  Bank Name <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Building2 className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="bankName"
   value={formData.bankName}
   onChange={onChange}
   className="block w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="e.g., Barclays, HSBC, Lloyds"
  />
  </div>
  </div>
  </div>

  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-4 @[640px]:gap-5 @[768px]:gap-6">
  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  Account Number <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <CreditCard className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="accountNumber"
   value={formData.accountNumber}
   onChange={onChange}
   maxLength={8}
   className="block w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="8-digit account number"
  />
  </div>
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  Sort Code <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Hash className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="sortCode"
   value={formData.sortCode}
   onChange={onChange}
   className="block w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="XX-XX-XX"
  />
  </div>
  <p className="text-[11px] @[640px]:text-xs text-gray-500 mt-1">Format: XX-XX-XX</p>
  </div>
  </div>

  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-4 @[640px]:gap-5 @[768px]:gap-6">
  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  IBAN <span className="text-gray-400">(Optional)</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Globe className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="iban"
   value={formData.iban}
   onChange={onChange}
   className="block w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="GB00 XXXX 0000 0000 0000 00"
  />
  </div>
  <p className="text-[11px] @[640px]:text-xs text-gray-500 mt-1">For international transfers</p>
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  SWIFT/BIC <span className="text-gray-400">(Optional)</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Globe className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="swiftBic"
   value={formData.swiftBic}
   onChange={onChange}
   maxLength={11}
   className="block w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="e.g., BARCGB22"
  />
  </div>
  <p className="text-[11px] @[640px]:text-xs text-gray-500 mt-1">8 or 11 characters</p>
  </div>
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700 mb-1.5 @[640px]:mb-2">
  <div className="flex items-center gap-2">
  <MapPin className="h-4 w-4 text-gray-400" />
  Branch Address <span className="text-gray-400">(Optional)</span>
  </div>
  </label>
  <textarea
  name="branchAddress"
  value={formData.branchAddress}
  onChange={onChange}
  rows={2}
  className="block w-full px-3 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 resize-none"
  placeholder="Enter branch address..."
  />
  </div>

  <div className="flex flex-wrap gap-4 @[640px]:gap-5 @[768px]:gap-6">
  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.isDefault}
  onChange={(e) => onCheckboxChange("isDefault", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <span className="text-xs @[640px]:text-sm text-gray-700">Set as default account</span>
  </label>

  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.isActive}
  onChange={(e) => onCheckboxChange("isActive", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <span className="text-xs @[640px]:text-sm text-gray-700">Active</span>
  </label>
  </div>
 </div>

 <div className="p-4 @[640px]:p-5 @[768px]:p-6 border-t border-gray-200 flex justify-end gap-2 @[640px]:gap-3">
  <button
  type="button"
  onClick={onCancel}
  className="inline-flex items-center px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
  >
  <X className="w-4 h-4 mr-1.5 @[640px]:mr-2" />
  Cancel
  </button>
  <button
  type="submit"
  disabled={isSaving}
  className="inline-flex items-center px-4 @[640px]:px-6 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  <Save className="w-4 h-4 mr-1.5 @[640px]:mr-2" />
  {isSaving ? "Saving..." : isEditing ? "Update Account" : "Add Account"}
  </button>
 </div>
 </form>
 </div>
 );
};

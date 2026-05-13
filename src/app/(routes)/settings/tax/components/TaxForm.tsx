"use client";

import React from "react";
import {
 Save,
 X,
 Percent,
 Hash,
 FileText,
 Tag,
} from "lucide-react";
import { TaxFormProps } from "../types";

export const TaxForm: React.FC<TaxFormProps> = ({
 formData,
 isEditing,
 isSaving,
 onChange,
 onCheckboxChange,
 onSubmit,
 onCancel,
}) => {
 return (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
 <div className="p-6 border-b border-gray-200">
 <h2 className="text-lg font-medium text-gray-800">
  {isEditing ? "Edit Tax" : "Add New Tax"}
 </h2>
 <p className="text-sm text-gray-500 mt-1">
  Configure tax rate and settings
 </p>
 </div>

 <form onSubmit={onSubmit}>
 <div className="p-6 space-y-6">
  {/* Name & Rate Row */}
  <div className="grid grid-cols-1 @[768px]:grid-cols-3 gap-6">
  <div className="@[768px]:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Tax Name <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Tag className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="name"
   value={formData.name}
   onChange={onChange}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="e.g., VAT, GST, Sales Tax"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Rate <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Percent className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="number"
   name="rate"
   value={formData.rate}
   onChange={onChange}
   step="0.01"
   min="0"
   max="100"
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="0.00"
  />
  </div>
  </div>
  </div>

  {/* Type & Code Row */}
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-6">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Tax Type
  </label>
  <select
  name="type"
  value={formData.type}
  onChange={onChange}
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  >
  <option value="percentage">Percentage</option>
  <option value="fixed">Flat</option>
  </select>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Tax Code <span className="text-gray-400">(Optional)</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Hash className="h-5 w-5 text-gray-400" />
  </div>
  <input
   type="text"
   name="code"
   value={formData.code}
   onChange={onChange}
   maxLength={20}
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   placeholder="e.g., VAT20, GST18"
  />
  </div>
  </div>
  </div>

  {/* Description */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  <div className="flex items-center gap-2">
  <FileText className="h-4 w-4 text-gray-400" />
  Description <span className="text-gray-400">(Optional)</span>
  </div>
  </label>
  <textarea
  name="description"
  value={formData.description}
  onChange={onChange}
  rows={2}
  className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 resize-none"
  placeholder="Enter tax description..."
  />
  </div>

  {/* Checkboxes */}
  <div className="flex flex-wrap gap-6">
  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.isCompound}
  onChange={(e) => onCheckboxChange("isCompound", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <span className="text-sm text-gray-700">Compound tax (calculated on subtotal + other taxes)</span>
  </label>

  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.isDefault}
  onChange={(e) => onCheckboxChange("isDefault", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <span className="text-sm text-gray-700">Set as default tax</span>
  </label>

  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.isActive}
  onChange={(e) => onCheckboxChange("isActive", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <span className="text-sm text-gray-700">Active</span>
  </label>
  </div>
 </div>

 {/* Action Buttons */}
 <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
  <button
  type="button"
  onClick={onCancel}
  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
  >
  <X className="w-4 h-4 mr-2" />
  Cancel
  </button>
  <button
  type="submit"
  disabled={isSaving}
  className="inline-flex items-center px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  <Save className="w-4 h-4 mr-2" />
  {isSaving ? "Saving..." : isEditing ? "Update Tax" : "Add Tax"}
  </button>
 </div>
 </form>
 </div>
 );
};

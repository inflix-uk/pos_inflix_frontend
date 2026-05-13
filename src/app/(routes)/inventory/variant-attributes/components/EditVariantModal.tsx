"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { VariantAttribute, VariantAttributeFormData } from "../types";

interface EditVariantModalProps {
 open: boolean;
 variant: VariantAttribute | null;
 onClose: () => void;
 onUpdate: (id: string, data: Partial<VariantAttributeFormData>) => void;
 isLoading?: boolean;
}

// Helper function to generate slug
const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '_')
 .replace(/(^_|_$)/g, '');
};

export const EditVariantModal: React.FC<EditVariantModalProps> = ({
 open,
 variant,
 onClose,
 onUpdate,
 isLoading,
}) => {
 const [formData, setFormData] = useState<VariantAttributeFormData>({
 name: "",
 values: [],
 description: "",
 isActive: true,
 });
 const [slug, setSlug] = useState("");
 const [errors, setErrors] = useState<Record<string, string>>({});

 useEffect(() => {
 if (variant) {
 setFormData({
 name: variant.name,
 values: variant.values || [],
 description: variant.description || "",
 isActive: variant.isActive,
 });
 setSlug(variant.slug || generateSlug(variant.name));
 }
 }, [variant]);

 if (!open || !variant) return null;

 const handleNameChange = (value: string) => {
 setFormData((prev) => ({ ...prev, name: value }));
 setSlug(generateSlug(value));
 if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
 };

 const handleInputChange = (field: keyof VariantAttributeFormData, value: string | boolean) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
 };

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Name is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm() && variant._id) {
 onUpdate(variant._id, {
 name: formData.name,
 description: formData.description,
 isActive: formData.isActive,
 });
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
 <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Edit Variant Attribute</h2>
  <button
  onClick={onClose}
  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
  >
  <X size={20} />
  </button>
 </div>

 {/* Body */}
 <div className="px-6 py-4 space-y-4">
  {/* Name */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Name <span className="text-red-500">*</span>
  </label>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleNameChange(e.target.value)}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
  errors.name ? "border-red-500" : "border-gray-300"
  }`}
  placeholder="e.g. Size, Color, Brand"
  />
  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
  </div>

  {/* Slug (Read-only) */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Slug
  </label>
  <input
  type="text"
  value={slug}
  readOnly
  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
  placeholder="Auto-generated from name"
  />
  </div>

  {/* Description */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Description
  </label>
  <textarea
  value={formData.description || ""}
  onChange={(e) => handleInputChange("description", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  rows={3}
  placeholder="Enter description (optional)"
  />
  </div>

  {/* Status */}
  <div className="flex items-center gap-2">
  <input
  type="checkbox"
  id="editIsActive"
  checked={formData.isActive}
  onChange={(e) => handleInputChange("isActive", e.target.checked)}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  <label htmlFor="editIsActive" className="text-sm text-gray-700">
  Active
  </label>
  </div>
 </div>

 {/* Footer */}
 <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
  <button
  onClick={onClose}
  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
  >
  Cancel
  </button>
  <button
  onClick={handleSubmit}
  disabled={isLoading}
  className="px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {isLoading ? "Updating..." : "Update"}
  </button>
 </div>
 </div>
 </div>
 );
};

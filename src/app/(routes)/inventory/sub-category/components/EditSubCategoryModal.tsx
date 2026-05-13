"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { SubCategory, SubCategoryFormData, CategoryOption } from "../types";

interface EditSubCategoryModalProps {
 open: boolean;
 onClose: () => void;
 onSave: (id: string, data: Partial<SubCategoryFormData>) => void;
 subCategory: SubCategory | null;
 categories: CategoryOption[];
 isLoading?: boolean;
}

export const EditSubCategoryModal: React.FC<EditSubCategoryModalProps> = ({
 open,
 onClose,
 onSave,
 subCategory,
 categories,
 isLoading,
}) => {
 const [formData, setFormData] = useState<SubCategoryFormData>({
 name: "",
 slug: "",
 category: "",
 code: "",
 description: "",
 image: "",
 isActive: true,
 });

 useEffect(() => {
 if (subCategory) {
 setFormData({
 name: subCategory.name,
 slug: subCategory.slug,
 category: subCategory.categoryId || subCategory.category,
 code: subCategory.code,
 description: subCategory.description || "",
 image: subCategory.image || "",
 isActive: subCategory.isActive,
 });
 }
 }, [subCategory]);

 const handleChange = (
 e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
 ) => {
 const { name, value, type } = e.target;
 setFormData((prev) => ({
 ...prev,
 [name]:
 type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
 }));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (subCategory?._id) {
 onSave(subCategory._id, formData);
 }
 };

 if (!open || !subCategory) return null;

 return (
 <div className="fixed inset-0 z-50 overflow-y-auto">
 <div className="flex items-center justify-center min-h-screen px-4">
 <div
  className="fixed inset-0 bg-black/50 transition-opacity"
  onClick={onClose}
 />
 <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold text-gray-900">
  Edit Sub-Category
  </h2>
  <button
  onClick={onClose}
  className="text-gray-400 hover:text-gray-600"
  >
  <X size={24} />
  </button>
  </div>

  <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Sub-Category Name *
  </label>
  <input
  type="text"
  name="name"
  value={formData.name}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Slug *
  </label>
  <input
  type="text"
  name="slug"
  value={formData.slug}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Category *
  </label>
  <select
  name="category"
  value={formData.category}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  >
  <option value="">Select Category</option>
  {categories.map((category) => (
   <option key={category._id} value={category._id}>
   {category.name}
   </option>
  ))}
  </select>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Code *
  </label>
  <input
  type="text"
  name="code"
  value={formData.code}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Image URL
  </label>
  <input
  type="text"
  name="image"
  value={formData.image}
  onChange={handleChange}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Description
  </label>
  <textarea
  name="description"
  value={formData.description}
  onChange={handleChange}
  rows={3}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
  </div>

  <div className="flex items-center">
  <input
  type="checkbox"
  name="isActive"
  checked={formData.isActive}
  onChange={handleChange}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <label className="ml-2 text-sm text-gray-700">Active</label>
  </div>

  <div className="flex gap-3 pt-4">
  <button
  type="button"
  onClick={onClose}
  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isLoading}
  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {isLoading ? "Saving..." : "Save Changes"}
  </button>
  </div>
  </form>
 </div>
 </div>
 </div>
 );
};

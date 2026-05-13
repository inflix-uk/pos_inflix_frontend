"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { CategoryFormData, CategoryItemType } from "../types";
import { variantAttributeApi } from "../../variant-attributes/service";
import { CategoryIconPicker } from "./CategoryIconPicker";

interface VariantAttributeOption {
 _id: string;
 name: string;
 slug: string;
}

interface AddCategoryModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: CategoryFormData) => void;
 isLoading?: boolean;
 /** Existing categories to prevent duplicate name/slug */
 existingCategories?: { name: string; slug: string }[];
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
 existingCategories = [],
}) => {
 const [formData, setFormData] = useState<CategoryFormData>({
 name: "",
 slug: "",
 description: "",
 isActive: true,
 itemType: "both",
 variantAttributes: [],
 icon: undefined,
 });

 const [variantAttributeOptions, setVariantAttributeOptions] = useState<VariantAttributeOption[]>([]);
 const [duplicateError, setDuplicateError] = useState("");

 useEffect(() => {
 if (!open) return;
 const fetchOptions = async () => {
 const res = await variantAttributeApi.getVariantAttributes({
 limit: 200,
 isActive: true,
 });
 if (res.success && res.data) {
 setVariantAttributeOptions(
  (res.data as { _id: string; name: string; slug: string }[]).map((v) => ({
  _id: v._id,
  name: v.name,
  slug: v.slug,
  }))
 );
 }
 };
 fetchOptions();
 }, [open]);

 const handleChange = (
 e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
 ) => {
 const { name, value, type } = e.target;
 setFormData((prev) => ({
 ...prev,
 [name]:
 type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
 }));

 // Auto-generate slug from name
 if (name === "name") {
 setFormData((prev) => ({
 ...prev,
 slug: value
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9-]/g, ""),
 }));
 }
 };

 const toggleVariantAttribute = (id: string) => {
 setFormData((prev) => {
 const current = prev.variantAttributes || [];
 if (current.includes(id)) {
 return { ...prev, variantAttributes: current.filter((x) => x !== id) };
 }
 return { ...prev, variantAttributes: [...current, id] };
 });
 };

 const moveVariantAttribute = (index: number, direction: "up" | "down") => {
 setFormData((prev) => {
 const list = [...(prev.variantAttributes || [])];
 const target = direction === "up" ? index - 1 : index + 1;
 if (target < 0 || target >= list.length) return prev;
 [list[index], list[target]] = [list[target], list[index]];
 return { ...prev, variantAttributes: list };
 });
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setDuplicateError("");
 const nameTrim = formData.name.trim().toLowerCase();
 const slugTrim = (formData.slug || "").trim().toLowerCase();
 if (existingCategories.some((c) => (c.name || "").toLowerCase() === nameTrim)) {
 setDuplicateError("A category with this name already exists.");
 return;
 }
 if (existingCategories.some((c) => (c.slug || "").toLowerCase() === slugTrim)) {
 setDuplicateError("A category with this slug already exists.");
 return;
 }
 onAdd(formData);
 setFormData({ name: "", slug: "", description: "", isActive: true, itemType: "both", variantAttributes: [], icon: undefined });
 };

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 overflow-y-auto">
 <div className="flex items-center justify-center min-h-screen px-4">
 <div
  className="fixed inset-0 bg-black/50 transition-opacity"
  aria-hidden
 />
 <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold text-gray-900">
  Add Category
  </h2>
  <button
  onClick={onClose}
  className="text-gray-400 hover:text-gray-600"
  >
  <X size={24} />
  </button>
  </div>

  <form onSubmit={handleSubmit} className="space-y-4">
  {duplicateError && (
  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
  {duplicateError}
  </div>
  )}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Category Name *
  </label>
  <input
  type="text"
  name="name"
  value={formData.name}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Enter category name"
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
  placeholder="category-slug"
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
  placeholder="Enter description"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Use for
  </label>
  <select
  name="itemType"
  value={formData.itemType ?? "both"}
  onChange={(e) => setFormData((prev) => ({ ...prev, itemType: e.target.value as CategoryItemType }))}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  >
  <option value="both">Both (Serial &amp; Non-serial)</option>
  <option value="serial">Serial (IMEI) only</option>
  <option value="non-serial">Non-serial only</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">Controls where this category appears: IMEI items tab, Non Serial Numbers tab, or both.</p>
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

  <CategoryIconPicker
  value={formData.icon}
  onChange={(iconName) => setFormData((prev) => ({ ...prev, icon: iconName }))}
  />

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Variant attributes (order = display order on Add Purchase)
  </label>
  <p className="text-xs text-gray-500 mb-2">
  Tick to assign; use ↑↓ to set order (e.g. Brand first, then Make).
  </p>
  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50 mb-3">
  {variantAttributeOptions.length === 0 && (
   <p className="text-sm text-gray-500 flex items-center gap-2">
   <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" aria-hidden />
   Loading…
   </p>
  )}
  {variantAttributeOptions.map((va) => (
   <label key={va._id} className="flex items-center gap-2 cursor-pointer">
   <input
   type="checkbox"
   checked={(formData.variantAttributes || []).includes(va._id)}
   onChange={() => toggleVariantAttribute(va._id)}
   className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
   />
   <span className="text-sm text-gray-800">{va.name}</span>
   </label>
  ))}
  </div>
  {(formData.variantAttributes || []).length > 0 && (
  <div className="border border-gray-200 rounded-lg p-3 bg-white">
   <span className="block text-xs font-medium text-gray-600 mb-2">Display order (top to bottom)</span>
   <ul className="space-y-1">
   {(formData.variantAttributes || []).map((id, index) => {
   const va = variantAttributeOptions.find((o) => o._id === id);
   return (
   <li
    key={id}
    className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50 border border-gray-100"
   >
    <span className="text-sm text-gray-800">{va?.name ?? id}</span>
    <div className="flex items-center gap-0.5">
    <button
    type="button"
    onClick={() => moveVariantAttribute(index, "up")}
    disabled={index === 0}
    className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
    title="Move up"
    >
    <ChevronUp className="h-4 w-4 text-gray-600" />
    </button>
    <button
    type="button"
    onClick={() => moveVariantAttribute(index, "down")}
    disabled={index === (formData.variantAttributes?.length ?? 0) - 1}
    className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
    title="Move down"
    >
    <ChevronDown className="h-4 w-4 text-gray-600" />
    </button>
    </div>
   </li>
   );
   })}
   </ul>
  </div>
  )}
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
  {isLoading ? "Adding..." : "Add Category"}
  </button>
  </div>
  </form>
 </div>
 </div>
 </div>
 );
};

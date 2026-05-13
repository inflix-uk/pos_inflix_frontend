"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
 ArrowLeft,
 ChevronUp,
 ChevronDown,
 FolderPlus,
 Info,
 Layers,
 Palette,
 CheckCircle,
 XCircle,
} from "lucide-react";
import { CategoryFormData, CategoryItemType } from "../types";
import { categoryApi } from "../service/categoryApi";
import { variantAttributeApi } from "../../variant-attributes/service";
import { CategoryIconPicker } from "../components/CategoryIconPicker";

interface VariantAttributeOption {
 _id: string;
 name: string;
 slug: string;
}

const AddCategoryPage = () => {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });

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
 const [existingCategories, setExistingCategories] = useState<{ name: string; slug: string }[]>([]);
 const [duplicateError, setDuplicateError] = useState("");

 useEffect(() => {
 const fetchData = async () => {
 const [vaRes, catRes] = await Promise.all([
 variantAttributeApi.getVariantAttributes({ limit: 200, isActive: true }),
 categoryApi.getCategories({ limit: 1000 }),
 ]);
 if (vaRes.success && vaRes.data) {
 setVariantAttributeOptions(
  (vaRes.data as { _id: string; name: string; slug: string }[]).map((v) => ({
  _id: v._id,
  name: v.name,
  slug: v.slug,
  }))
 );
 }
 if (catRes.success && catRes.data) {
 setExistingCategories(
  (catRes.data as { name: string; slug: string }[]).map((c) => ({ name: c.name, slug: c.slug }))
 );
 }
 };
 fetchData();
 }, []);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
 const { name, value, type } = e.target;
 setFormData((prev) => ({
 ...prev,
 [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
 }));

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

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setDuplicateError("");
 setMessage({ type: "", text: "" });

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

 setIsLoading(true);
 try {
 const response = await categoryApi.createCategory(formData);
 if (response.success) {
 router.push("/inventory/category");
 } else {
 setMessage({ type: "error", text: response.message || "Failed to create category" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to create category" });
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-neutral-50 p-4">
 {/* Header */}
 <div className="mb-4 flex items-center gap-3">
  <button
  onClick={() => router.push("/inventory/category")}
  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
  >
  <ArrowLeft className="h-4 w-4" />
  </button>
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500">
  <FolderPlus className="h-4 w-4 text-white" />
  </div>
  <div>
  <h1 className="text-lg font-semibold text-neutral-900">Add Category</h1>
  <p className="text-xs text-neutral-500">Create a new category with variant attributes and icon</p>
  </div>
 </div>

 {/* Messages */}
 {(message.text || duplicateError) && (
 <div
  className={`mb-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${
  duplicateError || message.type === "error"
  ? "border-red-200/90 bg-red-50 text-red-700 shadow-red-100/40"
  : "border-neutral-200/90 bg-green-50 text-emerald-800"
  }`}
 >
  {duplicateError || message.type === "error" ? (
  <XCircle className="h-5 w-5 flex-shrink-0" />
  ) : (
  <CheckCircle className="h-5 w-5 flex-shrink-0" />
  )}
  {duplicateError || message.text}
 </div>
 )}

 <form onSubmit={handleSubmit}>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Left Section - Category Information */}
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 sm:p-4">
  <div className="mb-4 flex items-center gap-3">
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-500 ring-2 ring-white">
  <Info className="h-4 w-4 text-white" />
  </span>
  <span className="text-sm font-semibold uppercase tracking-wide text-slate-800">Category Information</span>
  </div>
  <div className="space-y-4">
  <div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
   Category Name *
  </label>
  <input
   type="text"
   name="name"
   value={formData.name}
   onChange={handleChange}
   required
   className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
   placeholder="Enter category name"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
   Slug *
  </label>
  <input
   type="text"
   name="slug"
   value={formData.slug}
   onChange={handleChange}
   required
   className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
   placeholder="category-slug"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
   Description
  </label>
  <textarea
   name="description"
   value={formData.description}
   onChange={handleChange}
   rows={3}
   className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
   placeholder="Enter description"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
   Use for
  </label>
  <select
   name="itemType"
   value={formData.itemType ?? "both"}
   onChange={(e) => setFormData((prev) => ({ ...prev, itemType: e.target.value as CategoryItemType }))}
   className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
  >
   <option value="both">Both (Serial &amp; Non-serial)</option>
   <option value="serial">Serial (IMEI) only</option>
   <option value="non-serial">Non-serial only</option>
  </select>
  <p className="text-xs text-slate-500 mt-1">Controls where this category appears: IMEI items tab, Non Serial Numbers tab, or both.</p>
  </div>

  <div className="flex items-center gap-2">
  <input
   type="checkbox"
   name="isActive"
   checked={formData.isActive}
   onChange={handleChange}
   className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
  />
  <label className="text-sm font-medium text-slate-700">Active</label>
  </div>
  </div>
  </div>

  {/* Right Section - Variant Attributes & Icon */}
  <div className="space-y-6">
  {/* Variant Attributes */}
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 sm:p-4">
  <div className="mb-1 flex items-center gap-3">
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-500 ring-2 ring-white">
   <Layers className="h-4 w-4 text-white" />
  </span>
  <span className="text-sm font-semibold uppercase tracking-wide text-slate-800">Variant Attributes</span>
  </div>
  <p className="text-xs text-slate-500 mb-4 ml-12">
  Order = display order on Add Purchase. Tick to assign; use arrows to reorder.
  </p>

  <div className="max-h-52 overflow-y-auto border border-neutral-200/60 rounded-xl p-3 space-y-2 bg-white mb-4">
  {variantAttributeOptions.length === 0 && (
   <p className="text-sm text-slate-500 flex items-center gap-2">
   <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" aria-hidden />
   Loading…
   </p>
  )}
  {variantAttributeOptions.map((va) => (
   <label key={va._id} className="flex items-center gap-2 cursor-pointer">
   <input
   type="checkbox"
   checked={(formData.variantAttributes || []).includes(va._id)}
   onChange={() => toggleVariantAttribute(va._id)}
   className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
   />
   <span className="text-sm text-slate-800">{va.name}</span>
   </label>
  ))}
  </div>

  {(formData.variantAttributes || []).length > 0 && (
  <div className="border border-neutral-200/60 rounded-xl p-3 bg-white">
   <span className="block text-xs font-medium text-slate-600 mb-2">Display order (top to bottom)</span>
   <ul className="space-y-1">
   {(formData.variantAttributes || []).map((id, index) => {
   const va = variantAttributeOptions.find((o) => o._id === id);
   return (
   <li
    key={id}
    className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-neutral-50/60 border border-neutral-100/80"
   >
    <span className="text-sm text-slate-800">{va?.name ?? id}</span>
    <div className="flex items-center gap-0.5">
    <button
    type="button"
    onClick={() => moveVariantAttribute(index, "up")}
    disabled={index === 0}
    className="p-1 rounded hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
    title="Move up"
    >
    <ChevronUp className="h-4 w-4 text-slate-600" />
    </button>
    <button
    type="button"
    onClick={() => moveVariantAttribute(index, "down")}
    disabled={index === (formData.variantAttributes?.length ?? 0) - 1}
    className="p-1 rounded hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
    title="Move down"
    >
    <ChevronDown className="h-4 w-4 text-slate-600" />
    </button>
    </div>
   </li>
   );
   })}
   </ul>
  </div>
  )}
  </div>

  {/* Category Icon */}
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 sm:p-4">
  <div className="mb-4 flex items-center gap-3">
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-500 ring-2 ring-white">
   <Palette className="h-4 w-4 text-white" />
  </span>
  <span className="text-sm font-semibold uppercase tracking-wide text-slate-800">Category Icon</span>
  </div>
  <CategoryIconPicker
  value={formData.icon}
  onChange={(iconName) => setFormData((prev) => ({ ...prev, icon: iconName }))}
  />
  </div>
  </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3 mt-6 max-w-md">
  <button
  type="button"
  onClick={() => router.push("/inventory/category")}
  className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-white hover:border-slate-300 transition-colors"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isLoading}
  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition-all"
  >
  {isLoading ? "Adding..." : "Add Category"}
  </button>
 </div>
 </form>
 </div>
 );
};

export default AddCategoryPage;

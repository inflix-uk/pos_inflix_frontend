"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
 ArrowLeft,
 ChevronUp,
 ChevronDown,
 Pencil,
 Info,
 Layers,
 Palette,
 CheckCircle,
 XCircle,
} from "lucide-react";
import { Category, CategoryFormData, CategoryItemType } from "../../types";
import { categoryApi } from "../../service/categoryApi";
import { variantAttributeApi } from "../../../variant-attributes/service";
import { CategoryIconPicker } from "../../components/CategoryIconPicker";

interface VariantAttributeOption {
 _id: string;
 name: string;
 slug: string;
}

const EditCategoryPage = () => {
 const router = useRouter();
 const params = useParams();
 const categoryId = params.id as string;

 const [isLoading, setIsLoading] = useState(false);
 const [isFetching, setIsFetching] = useState(true);
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

 useEffect(() => {
 if (!categoryId) return;
 const load = async () => {
 setIsFetching(true);
 try {
 const [catRes, vaRes] = await Promise.all([
  categoryApi.getCategory(categoryId),
  variantAttributeApi.getVariantAttributes({ limit: 200, isActive: true }),
 ]);
 if (catRes.success && catRes.data) {
  const c = catRes.data as Category & { variantAttributes?: { _id: string }[] };
  setFormData({
  name: c.name,
  slug: c.slug,
  description: c.description || "",
  isActive: c.isActive,
  itemType: c.itemType ?? "both",
  variantAttributes: (c.variantAttributes || []).map((v: any) =>
  typeof v === "string" ? v : v._id
  ),
  icon: c.icon,
  });
 }
 if (vaRes.success && vaRes.data) {
  setVariantAttributeOptions(
  (vaRes.data as { _id: string; name: string; slug: string }[]).map((v) => ({
  _id: v._id,
  name: v.name,
  slug: v.slug,
  }))
  );
 }
 } catch {
 setMessage({ type: "error", text: "Failed to load category" });
 } finally {
 setIsFetching(false);
 }
 };
 load();
 }, [categoryId]);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
 const { name, value, type } = e.target;
 setFormData((prev) => ({
 ...prev,
 [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
 }));
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
 setMessage({ type: "", text: "" });
 setIsLoading(true);
 try {
 const response = await categoryApi.updateCategory(categoryId, formData);
 if (response.success) {
 router.push("/inventory/category");
 } else {
 setMessage({ type: "error", text: response.message || "Failed to update category" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to update category" });
 } finally {
 setIsLoading(false);
 }
 };

 if (isFetching) {
 return (
 <div className="min-h-screen bg-white p-4 flex items-center justify-center">
 <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-200 border-t-orange-500"></div>
 </div>
 );
 }

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
  <Pencil className="h-4 w-4 text-white" />
 </div>
 <div>
  <h1 className="text-lg font-semibold text-neutral-900">Edit Category</h1>
  <p className="text-xs text-neutral-500">Update details, variant attributes and icon</p>
 </div>
 </div>

 {/* Messages */}
 {message.text && (
 <div
  className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
  message.type === "error"
  ? "border-red-200 bg-red-50 text-red-700"
  : "border-green-200 bg-green-50 text-green-700"
  }`}
 >
  {message.type === "error" ? (
  <XCircle className="h-4 w-4 flex-shrink-0" />
  ) : (
  <CheckCircle className="h-4 w-4 flex-shrink-0" />
  )}
  {message.text}
 </div>
 )}

 <form onSubmit={handleSubmit}>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Left - Category Information */}
  <div className="rounded-lg border border-neutral-200 bg-white p-4">
  <div className="mb-3 flex items-center gap-2">
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500">
  <Info className="h-3.5 w-3.5 text-white" />
  </span>
  <span className="text-sm font-semibold text-neutral-900">Category Information</span>
  </div>
  <div className="space-y-3">
  <div>
  <label className="block text-xs font-medium text-neutral-600 mb-1">
   Category Name *
  </label>
  <input
   type="text"
   name="name"
   value={formData.name}
   onChange={handleChange}
   required
   className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-neutral-600 mb-1">
   Slug *
  </label>
  <input
   type="text"
   name="slug"
   value={formData.slug}
   onChange={handleChange}
   required
   className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-neutral-600 mb-1">
   Description
  </label>
  <textarea
   name="description"
   value={formData.description}
   onChange={handleChange}
   rows={2}
   className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-neutral-600 mb-1">
   Use for
  </label>
  <select
   name="itemType"
   value={formData.itemType ?? "both"}
   onChange={(e) => setFormData((prev) => ({ ...prev, itemType: e.target.value as CategoryItemType }))}
   className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
  >
   <option value="both">Both (Serial &amp; Non-serial)</option>
   <option value="serial">Serial (IMEI) only</option>
   <option value="non-serial">Non-serial only</option>
  </select>
  <p className="text-[11px] text-neutral-400 mt-1">Controls where this category appears: IMEI items tab, Non Serial Numbers tab, or both.</p>
  </div>

  <div className="flex items-center gap-2">
  <input
   type="checkbox"
   name="isActive"
   checked={formData.isActive}
   onChange={handleChange}
   className="w-3.5 h-3.5 text-orange-500 border-neutral-300 rounded focus:ring-orange-500"
  />
  <label className="text-xs font-medium text-neutral-600">Active</label>
  </div>
  </div>
  </div>

  {/* Right - Variant Attributes */}
  <div className="rounded-lg border border-neutral-200 bg-white p-4">
  <div className="mb-1 flex items-center gap-2">
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500">
  <Layers className="h-3.5 w-3.5 text-white" />
  </span>
  <span className="text-sm font-semibold text-neutral-900">Variant Attributes</span>
  </div>
  <p className="text-[11px] text-neutral-400 mb-3 ml-9">
  Tick to assign; use arrows to reorder display order.
  </p>

  <div className="max-h-44 overflow-y-auto border border-neutral-200 rounded-lg p-2.5 space-y-1.5 bg-neutral-50/50 mb-3">
  {variantAttributeOptions.map((va) => (
  <label key={va._id} className="flex items-center gap-2 cursor-pointer">
   <input
   type="checkbox"
   checked={(formData.variantAttributes || []).includes(va._id)}
   onChange={() => toggleVariantAttribute(va._id)}
   className="w-3.5 h-3.5 text-orange-500 border-neutral-300 rounded focus:ring-orange-500"
   />
   <span className="text-xs text-neutral-700">{va.name}</span>
  </label>
  ))}
  </div>

  {(formData.variantAttributes || []).length > 0 && (
  <div className="border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50">
  <span className="block text-[11px] font-medium text-neutral-500 mb-1.5">Display order</span>
  <ul className="space-y-1">
   {(formData.variantAttributes || []).map((id, index) => {
   const va = variantAttributeOptions.find((o) => o._id === id);
   return (
   <li
   key={id}
   className="flex items-center justify-between py-1 px-2 rounded-md bg-white border border-neutral-200"
   >
   <span className="text-xs text-neutral-700">{va?.name ?? id}</span>
   <div className="flex items-center gap-0.5">
    <button
    type="button"
    onClick={() => moveVariantAttribute(index, "up")}
    disabled={index === 0}
    className="p-0.5 rounded hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
    title="Move up"
    >
    <ChevronUp className="h-3.5 w-3.5 text-neutral-600" />
    </button>
    <button
    type="button"
    onClick={() => moveVariantAttribute(index, "down")}
    disabled={index === (formData.variantAttributes?.length ?? 0) - 1}
    className="p-0.5 rounded hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
    title="Move down"
    >
    <ChevronDown className="h-3.5 w-3.5 text-neutral-600" />
    </button>
   </div>
   </li>
   );
   })}
  </ul>
  </div>
  )}
  </div>

  {/* Category Icon - full width below */}
  <div className="lg:col-span-2">
  <div className="overflow-visible rounded-lg border border-neutral-200 bg-white p-4">
  <div className="mb-3 flex items-center gap-2">
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500">
   <Palette className="h-3.5 w-3.5 text-white" />
  </span>
  <span className="text-sm font-semibold text-neutral-900">Category Icon</span>
  </div>
  <CategoryIconPicker
  value={formData.icon}
  onChange={(iconName) => setFormData((prev) => ({ ...prev, icon: iconName }))}
  />
  </div>
  </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3 mt-4 max-w-sm">
  <button
  type="button"
  onClick={() => router.push("/inventory/category")}
  className="flex-1 px-4 py-2 text-sm border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isLoading}
  className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
  >
  {isLoading ? "Saving..." : "Save Changes"}
  </button>
 </div>
 </form>
 </div>
 );
};

export default EditCategoryPage;

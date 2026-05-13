"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, X, Check, Layers, Trash2 } from "lucide-react";
import { variantAttributeApi } from "../../service";
import { VariantAttribute, VariantValue } from "../../types";

// Helper function to generate slug
const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '_')
 .replace(/(^_|_$)/g, '');
};

const ValuesPage = () => {
 const params = useParams();
 const router = useRouter();
 const variantSlug = params.slug as string;

 const [variant, setVariant] = useState<VariantAttribute | null>(null);
 const [values, setValues] = useState<VariantValue[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [newValue, setNewValue] = useState("");
 const [newSlug, setNewSlug] = useState("");
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editValue, setEditValue] = useState("");
 const [editSlug, setEditSlug] = useState("");
 const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
 const [deleteModal, setDeleteModal] = useState<{
 valueName: string;
 replacementOptions: Array<{ _id: string; name: string }>;
 count: number;
 } | null>(null);
 const [replacementSelection, setReplacementSelection] = useState("");

 // Check if this is brands page
 const isBrandsPage = variantSlug === "brands";

 const fetchVariant = useCallback(async () => {
 setIsLoading(true);
 try {
 const response = await variantAttributeApi.getVariantAttributeBySlug(variantSlug);
 if (response.success && response.data) {
 const data = response.data as VariantAttribute;
 setVariant(data);
 setValues(data.values || []);
 }
 } catch {
 setMessage({ type: "error", text: "Failed to fetch variant attribute" });
 } finally {
 setIsLoading(false);
 }
 }, [variantSlug]);

 useEffect(() => {
 if (variantSlug) {
 fetchVariant();
 }
 }, [variantSlug, fetchVariant]);

 const updateValues = async (newValues: VariantValue[]) => {
 if (!variant?._id) return;
 try {
 const response = await variantAttributeApi.updateVariantAttribute(variant._id, { values: newValues });
 if (response.success) {
 const data = response.data as VariantAttribute;
 setValues(data.values || []);
 setMessage({ type: "success", text: "Values updated successfully" });
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 } else {
 setMessage({ type: "error", text: response.message || "Failed to update values" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to update values" });
 }
 };

 const handleNewValueChange = (value: string) => {
 setNewValue(value);
 setNewSlug(generateSlug(value));
 };

 const wouldBeDuplicate = (() => {
 if (!newValue.trim()) return true;
 const nameLower = newValue.trim().toLowerCase();
 const slugToCheck = generateSlug(newValue.trim()).toLowerCase();
 return values.some(
 (v) =>
 (v.name || "").toLowerCase() === nameLower ||
 (v.slug || generateSlug(v.name || "")).toLowerCase() === slugToCheck
 );
 })();

 const handleAddValue = async () => {
 if (!newValue.trim()) return;

 if (wouldBeDuplicate) {
 setMessage({ type: "error", text: "This value already exists. Name or slug must be unique." });
 return;
 }

 const newValueObj: VariantValue = {
 name: newValue.trim(),
 slug: generateSlug(newValue.trim()),
 isActive: true
 };

 const newValues = [...values, newValueObj];
 await updateValues(newValues);
 setNewValue("");
 setNewSlug("");
 };

 const handleKeyPress = (e: React.KeyboardEvent) => {
 if (e.key === "Enter") {
 e.preventDefault();
 handleAddValue();
 }
 };

 const handleEditStart = (value: VariantValue) => {
 setEditingId(value._id || "");
 setEditValue(value.name);
 setEditSlug(value.slug || generateSlug(value.name));
 };

 const handleEditValueChange = (value: string) => {
 setEditValue(value);
 setEditSlug(generateSlug(value));
 };

 const handleEditSave = async () => {
 if (!editingId) return;
 if (!editValue.trim()) return;

 const nameLower = editValue.trim().toLowerCase();
 const slugNew = generateSlug(editValue.trim()).toLowerCase();
 const isDuplicate = values.some((v) => {
 const isCurrent = String(v._id || "") === String(editingId);
 if (isCurrent) return false;
 const existingName = (v.name || "").toLowerCase();
 const existingSlug = (v.slug || generateSlug(v.name || "")).toLowerCase();
 return existingName === nameLower || existingSlug === slugNew;
 });
 if (isDuplicate) {
 setMessage({ type: "error", text: "A value with this name or slug already exists. Choose a different name." });
 return;
 }

 const newValues = values.map((v) => {
 if (String(v._id || "") === String(editingId)) {
 return { ...v, name: editValue.trim(), slug: generateSlug(editValue.trim()) };
 }
 return v;
 });

 await updateValues(newValues);
 setEditingId(null);
 setEditValue("");
 setEditSlug("");
 };

 const handleEditCancel = () => {
 setEditingId(null);
 setEditValue("");
 setEditSlug("");
 };

 const handleToggleStatus = async (valueId: string, currentStatus: boolean) => {
 const newValues = values.map(v => {
 if (v._id === valueId) {
 return { ...v, isActive: !currentStatus };
 }
 return v;
 });
 await updateValues(newValues);
 };

 // Navigate to models page
 const handleOpenModels = (value: VariantValue) => {
 window.open(`/inventory/variant-attributes/${variantSlug}/values/${value.slug}/models`, '_blank');
 };

 const handleDeleteValue = async (value: VariantValue) => {
 if (!variant?._id || !value.name) return;
 if (!window.confirm(`Remove "${value.name}" from this attribute?`)) return;
 try {
 const result = await variantAttributeApi.replaceAndRemoveVariantValue(variant._id, value.name);
 if (result.success) {
 await fetchVariant();
 setMessage({ type: "success", text: "Value removed" });
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 return;
 }
 if (result.inUse && result.replacementOptions?.length) {
 const opts = (result.replacementOptions ?? []).map((o) => ({ _id: o._id, name: o.name }));
 setDeleteModal({
  valueName: value.name,
  replacementOptions: opts,
  count: result.count ?? 0,
 });
 setReplacementSelection(opts[0]?.name ?? "");
 return;
 }
 setMessage({ type: "error", text: result.message || "Failed to remove value" });
 } catch {
 setMessage({ type: "error", text: "Failed to remove value" });
 }
 };

 const handleReplaceAndRemoveConfirm = async () => {
 if (!variant?._id || !deleteModal || !replacementSelection.trim()) return;
 try {
 const result = await variantAttributeApi.replaceAndRemoveVariantValue(
 variant._id,
 deleteModal.valueName,
 replacementSelection.trim()
 );
 if (result.success) {
 setDeleteModal(null);
 setReplacementSelection("");
 await fetchVariant();
 setMessage({ type: "success", text: "Replaced in purchases and value removed" });
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 return;
 }
 if (result.inUse && result.replacementOptions?.length) {
 const opts = (result.replacementOptions ?? []).map((o) => ({ _id: o._id, name: o.name }));
 setDeleteModal((prev) =>
  prev ? { ...prev, count: result.count ?? prev.count, replacementOptions: opts } : null
 );
 setReplacementSelection(opts[0]?.name ?? "");
 return;
 }
 setMessage({ type: "error", text: result.message || "Failed to replace and remove" });
 setDeleteModal(null);
 } catch {
 setMessage({ type: "error", text: "Failed to replace and remove" });
 setDeleteModal(null);
 }
 };

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {/* Header */}
 <div className="mb-8">
 <button
  onClick={() => router.back()}
  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
 >
  <ArrowLeft size={20} />
  Back
 </button>
 <h1 className="text-2xl font-semibold text-gray-900">
  {variant?.name} - Values
 </h1>
 <p className="text-gray-600 mt-1">Manage values for this variant attribute</p>
 </div>

 {/* Message */}
 {message.text && (
 <div
  className={`mb-4 p-4 rounded-lg ${
  message.type === "success"
  ? "bg-green-100 text-green-700"
  : "bg-red-100 text-red-700"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Add Value */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-lg font-medium text-gray-900 mb-4">
  Add New {isBrandsPage ? "Brand" : "Value"}
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
  <input
  type="text"
  value={newValue}
  onChange={(e) => handleNewValueChange(e.target.value)}
  onKeyPress={handleKeyPress}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder={isBrandsPage ? "Enter brand name" : "Enter value name"}
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
  <input
  type="text"
  value={newSlug}
  readOnly
  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
  placeholder="Auto-generated"
  />
  </div>
 </div>
 <button
  onClick={handleAddValue}
  disabled={!newValue.trim() || wouldBeDuplicate}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <Plus size={20} />
  Add {isBrandsPage ? "Brand" : "Value"}
 </button>
 {wouldBeDuplicate && newValue.trim() && (
  <p className="text-sm text-red-600 mt-2">This value already exists. Choose a different name.</p>
 )}
 </div>

 {/* Values List */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <div className="px-6 py-4 border-b border-gray-200">
  <h2 className="text-lg font-medium text-gray-900">
  {isBrandsPage ? "Brands" : "Values"} ({values.length})
  </h2>
 </div>
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Name
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Slug
  </th>
  {isBrandsPage && (
   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Models
   </th>
  )}
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Actions
  </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
  {values.length === 0 ? (
  <tr>
   <td colSpan={isBrandsPage ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
   No {isBrandsPage ? "brands" : "values"} added yet
   </td>
  </tr>
  ) : (
  values.map((value) => (
   <tr key={value._id} className="hover:bg-gray-50">
   {editingId === value._id ? (
   <>
   <td className="px-6 py-4">
    <input
    type="text"
    value={editValue}
    onChange={(e) => handleEditValueChange(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    autoFocus
    />
   </td>
   <td className="px-6 py-4">
    <input
    type="text"
    value={editSlug}
    readOnly
    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
    />
   </td>
   {isBrandsPage && (
    <td className="px-6 py-4">
    <span className="text-sm text-gray-500">
    {value.models?.length || 0} models
    </span>
    </td>
   )}
   <td className="px-6 py-4">
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
    value.isActive !== false
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
    }`}>
    {value.isActive !== false ? "Active" : "Inactive"}
    </span>
   </td>
   <td className="px-6 py-4">
    <div className="flex items-center gap-2">
    <button
    onClick={handleEditSave}
    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
    >
    <Check size={18} />
    </button>
    <button
    onClick={handleEditCancel}
    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
    >
    <X size={18} />
    </button>
    </div>
   </td>
   </>
   ) : (
   <>
   <td className="px-6 py-4 text-sm text-gray-900">
    {value.name}
   </td>
   <td className="px-6 py-4 text-sm text-gray-500">
    {value.slug || "-"}
   </td>
   {isBrandsPage && (
    <td className="px-6 py-4">
    <span className="text-sm text-gray-600">
    {value.models?.length || 0} models
    </span>
    </td>
   )}
   <td className="px-6 py-4">
    <button
    onClick={() => handleToggleStatus(value._id || "", value.isActive !== false)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    value.isActive !== false ? "bg-orange-500" : "bg-gray-300"
    }`}
    >
    <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    value.isActive !== false ? "translate-x-6" : "translate-x-1"
    }`}
    />
    </button>
   </td>
   <td className="px-6 py-4">
    <div className="flex items-center gap-2">
    {isBrandsPage && (
    <button
    onClick={() => handleOpenModels(value)}
    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
    title="Manage Models"
    >
    <Layers size={16} />
    </button>
    )}
    <button
    onClick={() => handleEditStart(value)}
    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
    title="Edit"
    >
    <Edit size={16} />
    </button>
    <button
    onClick={() => handleDeleteValue(value)}
    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
    title="Delete"
    >
    <Trash2 size={16} />
    </button>
    </div>
   </td>
   </>
   )}
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>
 </div>

 {/* Replace and remove modal (when value is in use) */}
 {deleteModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Value in use</h3>
  <p className="text-gray-600 mb-4">
  &quot;{deleteModal.valueName}&quot; is used in {deleteModal.count} purchase item(s). Choose a replacement from the same attribute. Purchase and product data will be updated; sales will not.
  </p>
  <label className="block text-sm font-medium text-gray-700 mb-1">Replacement</label>
  <select
  value={replacementSelection}
  onChange={(e) => setReplacementSelection(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
  >
  {deleteModal.replacementOptions.map((opt) => (
  <option key={opt._id} value={opt.name}>
   {opt.name}
  </option>
  ))}
  </select>
  <div className="flex justify-end gap-2">
  <button
  type="button"
  onClick={() => { setDeleteModal(null); setReplacementSelection(""); }}
  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={handleReplaceAndRemoveConfirm}
  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
  >
  Replace and remove
  </button>
  </div>
  </div>
 </div>
 )}

 </div>
 );
};

export default ValuesPage;

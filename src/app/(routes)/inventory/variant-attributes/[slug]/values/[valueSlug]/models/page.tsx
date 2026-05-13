"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, X, Check } from "lucide-react";
import { variantAttributeApi } from "../../../../service";
import { VariantAttribute, VariantValue, VariantModel } from "../../../../types";

// Helper function to generate slug
const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '_')
 .replace(/(^_|_$)/g, '');
};

const ModelsPage = () => {
 const params = useParams();
 const router = useRouter();
 const variantSlug = params.slug as string;
 const valueSlug = params.valueSlug as string;

 const [variant, setVariant] = useState<VariantAttribute | null>(null);
 const [brandValue, setBrandValue] = useState<VariantValue | null>(null);
 const [models, setModels] = useState<VariantModel[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [newModel, setNewModel] = useState("");
 const [newSlug, setNewSlug] = useState("");
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editModel, setEditModel] = useState("");
 const [editSlug, setEditSlug] = useState("");
 const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });

 const fetchVariant = useCallback(async () => {
 setIsLoading(true);
 try {
 const response = await variantAttributeApi.getVariantAttributeBySlug(variantSlug);
 if (response.success && response.data) {
 const data = response.data as VariantAttribute;
 setVariant(data);

 // Find the brand value by slug
 const foundValue = data.values?.find(v => v.slug === valueSlug);
 if (foundValue) {
  setBrandValue(foundValue);
  setModels(foundValue.models || []);
 }
 }
 } catch {
 setMessage({ type: "error", text: "Failed to fetch data" });
 } finally {
 setIsLoading(false);
 }
 }, [variantSlug, valueSlug]);

 useEffect(() => {
 if (variantSlug && valueSlug) {
 fetchVariant();
 }
 }, [variantSlug, valueSlug, fetchVariant]);

 const updateModels = async (newModels: VariantModel[]) => {
 if (!variant?._id || !brandValue?._id) return;

 try {
 // Update the values array with new models for this brand
 const updatedValues = variant.values?.map(v => {
 if (v._id === brandValue._id) {
  return { ...v, models: newModels };
 }
 return v;
 }) || [];

 const response = await variantAttributeApi.updateVariantAttribute(variant._id, { values: updatedValues });
 if (response.success) {
 const data = response.data as VariantAttribute;
 const updatedBrand = data.values?.find(v => v._id === brandValue._id);
 if (updatedBrand) {
  setModels(updatedBrand.models || []);
 }
 setMessage({ type: "success", text: "Models updated successfully" });
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 } else {
 setMessage({ type: "error", text: response.message || "Failed to update models" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to update models" });
 }
 };

 const handleNewModelChange = (value: string) => {
 setNewModel(value);
 setNewSlug(generateSlug(value));
 };

 const wouldBeDuplicateModel = (() => {
 if (!newModel.trim()) return true;
 const nameLower = newModel.trim().toLowerCase();
 const slugToCheck = generateSlug(newModel.trim()).toLowerCase();
 return models.some(
 (m) =>
 (m.name || "").toLowerCase() === nameLower ||
 (m.slug || generateSlug(m.name || "")).toLowerCase() === slugToCheck
 );
 })();

 const handleAddModel = async () => {
 if (!newModel.trim()) return;

 if (wouldBeDuplicateModel) {
 setMessage({ type: "error", text: "This model already exists. Name or slug must be unique." });
 return;
 }

 const newModelObj: VariantModel = {
 name: newModel.trim(),
 slug: generateSlug(newModel.trim()),
 isActive: true
 };

 const newModels = [...models, newModelObj];
 await updateModels(newModels);
 setNewModel("");
 setNewSlug("");
 };

 const handleKeyPress = (e: React.KeyboardEvent) => {
 if (e.key === "Enter") {
 e.preventDefault();
 handleAddModel();
 }
 };

 const handleEditStart = (model: VariantModel) => {
 setEditingId(model._id || "");
 setEditModel(model.name);
 setEditSlug(model.slug || generateSlug(model.name));
 };

 const handleEditModelChange = (value: string) => {
 setEditModel(value);
 setEditSlug(generateSlug(value));
 };

 const handleEditSave = async () => {
 if (!editingId) return;
 if (!editModel.trim()) return;

 const nameLower = editModel.trim().toLowerCase();
 const slugNew = generateSlug(editModel.trim()).toLowerCase();
 const isDuplicate = models.some((m) => {
 const isCurrent = String(m._id || "") === String(editingId);
 if (isCurrent) return false;
 const existingName = (m.name || "").toLowerCase();
 const existingSlug = (m.slug || generateSlug(m.name || "")).toLowerCase();
 return existingName === nameLower || existingSlug === slugNew;
 });
 if (isDuplicate) {
 setMessage({ type: "error", text: "A model with this name or slug already exists. Choose a different name." });
 return;
 }

 const newModels = models.map((m) => {
 if (String(m._id || "") === String(editingId)) {
 return { ...m, name: editModel.trim(), slug: generateSlug(editModel.trim()) };
 }
 return m;
 });

 await updateModels(newModels);
 setEditingId(null);
 setEditModel("");
 setEditSlug("");
 };

 const handleEditCancel = () => {
 setEditingId(null);
 setEditModel("");
 setEditSlug("");
 };

 const handleToggleStatus = async (modelId: string, currentStatus: boolean) => {
 const newModels = models.map(m => {
 if (m._id === modelId) {
 return { ...m, isActive: !currentStatus };
 }
 return m;
 });
 await updateModels(newModels);
 };

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
 </div>
 );
 }

 if (!brandValue) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="text-center py-12">
  <p className="text-gray-500">Brand not found</p>
  <button
  onClick={() => router.back()}
  className="mt-4 px-4 py-2 text-orange-500 hover:underline"
  >
  Go back
  </button>
 </div>
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
  Back to Brands
 </button>
 <h1 className="text-2xl font-semibold text-gray-900">
  {brandValue.name} - Models
 </h1>
 <p className="text-gray-600 mt-1">Manage models for this brand</p>
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

 {/* Add Model */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Model</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
  <input
  type="text"
  value={newModel}
  onChange={(e) => handleNewModelChange(e.target.value)}
  onKeyPress={handleKeyPress}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="e.g. iPhone 15 Pro, Galaxy S24"
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
  onClick={handleAddModel}
  disabled={!newModel.trim() || wouldBeDuplicateModel}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
  <Plus size={20} />
  Add Model
 </button>
 {wouldBeDuplicateModel && newModel.trim() && (
  <p className="text-sm text-red-600 mt-2">This model already exists. Choose a different name.</p>
 )}
 </div>

 {/* Models List */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <div className="px-6 py-4 border-b border-gray-200">
  <h2 className="text-lg font-medium text-gray-900">
  Models ({models.length})
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
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Actions
  </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
  {models.length === 0 ? (
  <tr>
   <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
   No models added yet
   </td>
  </tr>
  ) : (
  models.map((model) => (
   <tr key={model._id} className="hover:bg-gray-50">
   {editingId === model._id ? (
   <>
   <td className="px-6 py-4">
    <input
    type="text"
    value={editModel}
    onChange={(e) => handleEditModelChange(e.target.value)}
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
   <td className="px-6 py-4">
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
    model.isActive !== false
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
    }`}>
    {model.isActive !== false ? "Active" : "Inactive"}
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
    {model.name}
   </td>
   <td className="px-6 py-4 text-sm text-gray-500">
    {model.slug || "-"}
   </td>
   <td className="px-6 py-4">
    <button
    onClick={() => handleToggleStatus(model._id || "", model.isActive !== false)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    model.isActive !== false ? "bg-orange-500" : "bg-gray-300"
    }`}
    >
    <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    model.isActive !== false ? "translate-x-6" : "translate-x-1"
    }`}
    />
    </button>
   </td>
   <td className="px-6 py-4">
    <button
    onClick={() => handleEditStart(model)}
    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
    title="Edit"
    >
    <Edit size={16} />
    </button>
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
 </div>
 );
};

export default ModelsPage;

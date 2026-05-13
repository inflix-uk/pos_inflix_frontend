"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, X, Check, Trash2 } from "lucide-react";
import { categoryApi } from "../../service/categoryApi";
import { Category } from "../../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SubCategory {
 _id?: string;
 name: string;
 slug: string;
 description?: string;
 isActive: boolean;
 createdAt?: string;
}

// Helper function to generate slug
const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '_')
 .replace(/(^_|_$)/g, '');
};

const getAuthHeaders = (): HeadersInit => {
 const token = localStorage.getItem("token");
 return {
 "Content-Type": "application/json",
 Authorization: `Bearer ${token}`,
 };
};

const SubCategoriesPage = () => {
 const params = useParams();
 const router = useRouter();
 const categorySlug = params.slug as string;

 const [category, setCategory] = useState<Category | null>(null);
 const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [newName, setNewName] = useState("");
 const [newSlug, setNewSlug] = useState("");
 const [newDescription, setNewDescription] = useState("");
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editName, setEditName] = useState("");
 const [editSlug, setEditSlug] = useState("");
 const [editDescription, setEditDescription] = useState("");
 const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });

 const fetchData = useCallback(async () => {
 setIsLoading(true);
 try {
 // Fetch category by slug
 const categoryResponse = await categoryApi.getCategoryBySlug(categorySlug);
 if (categoryResponse.success && categoryResponse.data) {
 const categoryData = categoryResponse.data as Category;
 setCategory(categoryData);

 // Fetch sub-categories for this category
 const subCategoryResponse = await fetch(
  `${API_URL}/api/subcategories?category=${categoryData._id}`,
  {
  method: "GET",
  headers: getAuthHeaders(),
  }
 );
 const subCategoryData = await subCategoryResponse.json();
 if (subCategoryData.success) {
  setSubCategories(subCategoryData.data || []);
 }
 }
 } catch {
 setMessage({ type: "error", text: "Failed to fetch data" });
 } finally {
 setIsLoading(false);
 }
 }, [categorySlug]);

 useEffect(() => {
 if (categorySlug) {
 fetchData();
 }
 }, [categorySlug, fetchData]);

 const handleNewNameChange = (value: string) => {
 setNewName(value);
 setNewSlug(generateSlug(value));
 };

 const handleAddSubCategory = async () => {
 if (!newName.trim() || !category?._id) return;

 // Check for duplicate name
 if (subCategories.some(s => s.name.toLowerCase() === newName.trim().toLowerCase())) {
 setMessage({ type: "error", text: "Sub-category already exists" });
 return;
 }

 try {
 const response = await fetch(`${API_URL}/api/subcategories`, {
 method: "POST",
 headers: getAuthHeaders(),
 body: JSON.stringify({
  name: newName.trim(),
  slug: generateSlug(newName.trim()),
  description: newDescription.trim(),
  category: category._id,
  isActive: true,
 }),
 });
 const data = await response.json();

 if (data.success) {
 setMessage({ type: "success", text: "Sub-category added successfully" });
 setNewName("");
 setNewSlug("");
 setNewDescription("");
 fetchData();
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 } else {
 setMessage({ type: "error", text: data.message || "Failed to add sub-category" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to add sub-category" });
 }
 };

 const handleKeyPress = (e: React.KeyboardEvent) => {
 if (e.key === "Enter") {
 e.preventDefault();
 handleAddSubCategory();
 }
 };

 const handleEditStart = (subCategory: SubCategory) => {
 setEditingId(subCategory._id || "");
 setEditName(subCategory.name);
 setEditSlug(subCategory.slug || generateSlug(subCategory.name));
 setEditDescription(subCategory.description || "");
 };

 const handleEditNameChange = (value: string) => {
 setEditName(value);
 setEditSlug(generateSlug(value));
 };

 const handleEditSave = async () => {
 if (!editingId || !editName.trim()) return;

 // Check for duplicate name (excluding current)
 if (subCategories.some(s => s._id !== editingId && s.name.toLowerCase() === editName.trim().toLowerCase())) {
 setMessage({ type: "error", text: "Sub-category already exists" });
 return;
 }

 try {
 const response = await fetch(`${API_URL}/api/subcategories/${editingId}`, {
 method: "PUT",
 headers: getAuthHeaders(),
 body: JSON.stringify({
  name: editName.trim(),
  slug: generateSlug(editName.trim()),
  description: editDescription.trim(),
 }),
 });
 const data = await response.json();

 if (data.success) {
 setMessage({ type: "success", text: "Sub-category updated successfully" });
 setEditingId(null);
 setEditName("");
 setEditSlug("");
 setEditDescription("");
 fetchData();
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 } else {
 setMessage({ type: "error", text: data.message || "Failed to update sub-category" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to update sub-category" });
 }
 };

 const handleEditCancel = () => {
 setEditingId(null);
 setEditName("");
 setEditSlug("");
 setEditDescription("");
 };

 const handleToggleStatus = async (subCategoryId: string, currentStatus: boolean) => {
 try {
 const response = await fetch(`${API_URL}/api/subcategories/${subCategoryId}`, {
 method: "PUT",
 headers: getAuthHeaders(),
 body: JSON.stringify({ isActive: !currentStatus }),
 });
 const data = await response.json();

 if (data.success) {
 setMessage({ type: "success", text: "Status updated successfully" });
 fetchData();
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 } else {
 setMessage({ type: "error", text: data.message || "Failed to update status" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to update status" });
 }
 };

 const handleDelete = async (subCategoryId: string) => {
 if (!confirm("Are you sure you want to delete this sub-category?")) return;

 try {
 const response = await fetch(`${API_URL}/api/subcategories/${subCategoryId}`, {
 method: "DELETE",
 headers: getAuthHeaders(),
 });
 const data = await response.json();

 if (data.success) {
 setMessage({ type: "success", text: "Sub-category deleted successfully" });
 fetchData();
 setTimeout(() => setMessage({ type: "", text: "" }), 2000);
 } else {
 setMessage({ type: "error", text: data.message || "Failed to delete sub-category" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to delete sub-category" });
 }
 };

 const formatDate = (dateString?: string) => {
 if (!dateString) return "N/A";
 return new Date(dateString).toLocaleDateString("en-GB", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 });
 };

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
 </div>
 );
 }

 if (!category) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="text-center py-12">
  <p className="text-gray-500">Category not found</p>
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
  Back to Categories
 </button>
 <h1 className="text-2xl font-semibold text-gray-900">
  {category.name} - Sub-Categories
 </h1>
 <p className="text-gray-600 mt-1">Manage sub-categories for this category</p>
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

 {/* Add Sub-Category */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Sub-Category</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
  <input
  type="text"
  value={newName}
  onChange={(e) => handleNewNameChange(e.target.value)}
  onKeyPress={handleKeyPress}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Enter sub-category name"
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
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
  <input
  type="text"
  value={newDescription}
  onChange={(e) => setNewDescription(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Optional description"
  />
  </div>
 </div>
 <button
  onClick={handleAddSubCategory}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
 >
  <Plus size={20} />
  Add Sub-Category
 </button>
 </div>

 {/* Sub-Categories List */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <div className="px-6 py-4 border-b border-gray-200">
  <h2 className="text-lg font-medium text-gray-900">
  Sub-Categories ({subCategories.length})
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
   Created On
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
  {subCategories.length === 0 ? (
  <tr>
   <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
   No sub-categories added yet
   </td>
  </tr>
  ) : (
  subCategories.map((subCategory) => (
   <tr key={subCategory._id} className="hover:bg-gray-50">
   {editingId === subCategory._id ? (
   <>
   <td className="px-6 py-4">
    <input
    type="text"
    value={editName}
    onChange={(e) => handleEditNameChange(e.target.value)}
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
   <td className="px-6 py-4 text-sm text-gray-500">
    {formatDate(subCategory.createdAt)}
   </td>
   <td className="px-6 py-4">
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
    subCategory.isActive !== false
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
    }`}>
    {subCategory.isActive !== false ? "Active" : "Inactive"}
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
    {subCategory.name}
   </td>
   <td className="px-6 py-4 text-sm text-gray-500">
    {subCategory.slug || "-"}
   </td>
   <td className="px-6 py-4 text-sm text-gray-500">
    {formatDate(subCategory.createdAt)}
   </td>
   <td className="px-6 py-4">
    <button
    onClick={() => handleToggleStatus(subCategory._id || "", subCategory.isActive !== false)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    subCategory.isActive !== false ? "bg-orange-500" : "bg-gray-300"
    }`}
    >
    <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    subCategory.isActive !== false ? "translate-x-6" : "translate-x-1"
    }`}
    />
    </button>
   </td>
   <td className="px-6 py-4">
    <div className="flex items-center gap-2">
    <button
    onClick={() => handleEditStart(subCategory)}
    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
    title="Edit"
    >
    <Edit size={16} />
    </button>
    <button
    onClick={() => handleDelete(subCategory._id || "")}
    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
 </div>
 );
};

export default SubCategoriesPage;

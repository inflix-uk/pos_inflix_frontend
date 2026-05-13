"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { SelectOption } from "../types";

// Base Modal Wrapper
interface ModalWrapperProps {
 open: boolean;
 onClose: () => void;
 title: string;
 children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ open, onClose, title, children }) => {
 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/40" aria-hidden />
 <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
  <button
  onClick={onClose}
  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
  >
  <X size={20} />
  </button>
 </div>
 {children}
 </div>
 </div>
 );
};

// Form Field Component
interface FormFieldProps {
 label: string;
 required?: boolean;
 error?: string;
 children: React.ReactNode;
}

const FormFieldWrapper: React.FC<FormFieldProps> = ({ label, required, error, children }) => (
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 {children}
 {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
 </div>
);

// ==================== QUICK ADD STORE MODAL ====================
export interface QuickStoreFormData {
 name: string;
 code: string;
 contactPerson: string;
 phone: string;
 email: string;
 address: string;
 city: string;
 country: string;
}

interface QuickAddStoreModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: QuickStoreFormData) => void;
 isLoading?: boolean;
}

export const QuickAddStoreModal: React.FC<QuickAddStoreModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
}) => {
 const [formData, setFormData] = useState<QuickStoreFormData>({
 name: "",
 code: "",
 contactPerson: "",
 phone: "",
 email: "",
 address: "",
 city: "",
 country: "",
 });
 const [errors, setErrors] = useState<Record<string, string>>({});

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Store name is required";
 if (!formData.code.trim()) newErrors.code = "Store code is required";
 if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person is required";
 if (!formData.phone.trim()) newErrors.phone = "Phone is required";
 if (!formData.email.trim()) newErrors.email = "Email is required";
 if (!formData.address.trim()) newErrors.address = "Address is required";
 if (!formData.city.trim()) newErrors.city = "City is required";
 if (!formData.country.trim()) newErrors.country = "Country is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm()) {
 onAdd(formData);
 setFormData({
 name: "",
 code: "",
 contactPerson: "",
 phone: "",
 email: "",
 address: "",
 city: "",
 country: "",
 });
 setErrors({});
 }
 };

 const handleChange = (field: keyof QuickStoreFormData, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: field === "code" ? value.toUpperCase() : value }));
 if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
 };

 const inputClass = (hasError: boolean) =>
 `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
 hasError ? "border-red-500" : "border-gray-300"
 }`;

 return (
 <ModalWrapper open={open} onClose={onClose} title="Quick Add Store">
 <div className="px-6 py-4 space-y-4">
 <div className="grid grid-cols-2 gap-4">
  <FormFieldWrapper label="Name" required error={errors.name}>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleChange("name", e.target.value)}
  className={inputClass(!!errors.name)}
  placeholder="Store name"
  />
  </FormFieldWrapper>
  <FormFieldWrapper label="Code" required error={errors.code}>
  <input
  type="text"
  value={formData.code}
  onChange={(e) => handleChange("code", e.target.value)}
  className={inputClass(!!errors.code)}
  placeholder="STR-001"
  />
  </FormFieldWrapper>
 </div>

 <FormFieldWrapper label="Contact Person" required error={errors.contactPerson}>
  <input
  type="text"
  value={formData.contactPerson}
  onChange={(e) => handleChange("contactPerson", e.target.value)}
  className={inputClass(!!errors.contactPerson)}
  placeholder="Contact person name"
  />
 </FormFieldWrapper>

 <div className="grid grid-cols-2 gap-4">
  <FormFieldWrapper label="Phone" required error={errors.phone}>
  <input
  type="tel"
  value={formData.phone}
  onChange={(e) => handleChange("phone", e.target.value)}
  className={inputClass(!!errors.phone)}
  placeholder="Phone number"
  />
  </FormFieldWrapper>
  <FormFieldWrapper label="Email" required error={errors.email}>
  <input
  type="email"
  value={formData.email}
  onChange={(e) => handleChange("email", e.target.value)}
  className={inputClass(!!errors.email)}
  placeholder="Email address"
  />
  </FormFieldWrapper>
 </div>

 <FormFieldWrapper label="Address" required error={errors.address}>
  <input
  type="text"
  value={formData.address}
  onChange={(e) => handleChange("address", e.target.value)}
  className={inputClass(!!errors.address)}
  placeholder="Full address"
  />
 </FormFieldWrapper>

 <div className="grid grid-cols-2 gap-4">
  <FormFieldWrapper label="City" required error={errors.city}>
  <input
  type="text"
  value={formData.city}
  onChange={(e) => handleChange("city", e.target.value)}
  className={inputClass(!!errors.city)}
  placeholder="City"
  />
  </FormFieldWrapper>
  <FormFieldWrapper label="Country" required error={errors.country}>
  <input
  type="text"
  value={formData.country}
  onChange={(e) => handleChange("country", e.target.value)}
  className={inputClass(!!errors.country)}
  placeholder="Country"
  />
  </FormFieldWrapper>
 </div>
 </div>

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
  {isLoading ? "Adding..." : "Add Store"}
 </button>
 </div>
 </ModalWrapper>
 );
};

// ==================== QUICK ADD WAREHOUSE MODAL ====================
export interface QuickWarehouseFormData {
 name: string;
 contactPerson: string;
 phone: string;
 email: string;
 address: string;
 city: string;
 country: string;
}

interface QuickAddWarehouseModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: QuickWarehouseFormData) => void;
 isLoading?: boolean;
}

export const QuickAddWarehouseModal: React.FC<QuickAddWarehouseModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
}) => {
 const [formData, setFormData] = useState<QuickWarehouseFormData>({
 name: "",
 contactPerson: "",
 phone: "",
 email: "",
 address: "",
 city: "",
 country: "",
 });
 const [errors, setErrors] = useState<Record<string, string>>({});

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Warehouse name is required";
 if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person is required";
 if (!formData.phone.trim()) newErrors.phone = "Phone is required";
 if (!formData.email.trim()) newErrors.email = "Email is required";
 if (!formData.address.trim()) newErrors.address = "Address is required";
 if (!formData.city.trim()) newErrors.city = "City is required";
 if (!formData.country.trim()) newErrors.country = "Country is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm()) {
 onAdd(formData);
 setFormData({
 name: "",
 contactPerson: "",
 phone: "",
 email: "",
 address: "",
 city: "",
 country: "",
 });
 setErrors({});
 }
 };

 const handleChange = (field: keyof QuickWarehouseFormData, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
 };

 const inputClass = (hasError: boolean) =>
 `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
 hasError ? "border-red-500" : "border-gray-300"
 }`;

 return (
 <ModalWrapper open={open} onClose={onClose} title="Quick Add Warehouse">
 <div className="px-6 py-4 space-y-4">
 <FormFieldWrapper label="Name" required error={errors.name}>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleChange("name", e.target.value)}
  className={inputClass(!!errors.name)}
  placeholder="Warehouse name"
  />
 </FormFieldWrapper>

 <FormFieldWrapper label="Contact Person" required error={errors.contactPerson}>
  <input
  type="text"
  value={formData.contactPerson}
  onChange={(e) => handleChange("contactPerson", e.target.value)}
  className={inputClass(!!errors.contactPerson)}
  placeholder="Contact person name"
  />
 </FormFieldWrapper>

 <div className="grid grid-cols-2 gap-4">
  <FormFieldWrapper label="Phone" required error={errors.phone}>
  <input
  type="tel"
  value={formData.phone}
  onChange={(e) => handleChange("phone", e.target.value)}
  className={inputClass(!!errors.phone)}
  placeholder="Phone number"
  />
  </FormFieldWrapper>
  <FormFieldWrapper label="Email" required error={errors.email}>
  <input
  type="email"
  value={formData.email}
  onChange={(e) => handleChange("email", e.target.value)}
  className={inputClass(!!errors.email)}
  placeholder="Email address"
  />
  </FormFieldWrapper>
 </div>

 <FormFieldWrapper label="Address" required error={errors.address}>
  <input
  type="text"
  value={formData.address}
  onChange={(e) => handleChange("address", e.target.value)}
  className={inputClass(!!errors.address)}
  placeholder="Full address"
  />
 </FormFieldWrapper>

 <div className="grid grid-cols-2 gap-4">
  <FormFieldWrapper label="City" required error={errors.city}>
  <input
  type="text"
  value={formData.city}
  onChange={(e) => handleChange("city", e.target.value)}
  className={inputClass(!!errors.city)}
  placeholder="City"
  />
  </FormFieldWrapper>
  <FormFieldWrapper label="Country" required error={errors.country}>
  <input
  type="text"
  value={formData.country}
  onChange={(e) => handleChange("country", e.target.value)}
  className={inputClass(!!errors.country)}
  placeholder="Country"
  />
  </FormFieldWrapper>
 </div>
 </div>

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
  {isLoading ? "Adding..." : "Add Warehouse"}
 </button>
 </div>
 </ModalWrapper>
 );
};

// ==================== QUICK ADD CATEGORY MODAL ====================
export interface QuickCategoryFormData {
 name: string;
 slug: string;
}

interface QuickAddCategoryModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: QuickCategoryFormData) => void;
 isLoading?: boolean;
}

export const QuickAddCategoryModal: React.FC<QuickAddCategoryModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
}) => {
 const [formData, setFormData] = useState<QuickCategoryFormData>({
 name: "",
 slug: "",
 });
 const [errors, setErrors] = useState<Record<string, string>>({});

 const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/(^-|-$)/g, "");
 };

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Category name is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm()) {
 onAdd(formData);
 setFormData({ name: "", slug: "" });
 setErrors({});
 }
 };

 const handleNameChange = (value: string) => {
 setFormData({ name: value, slug: generateSlug(value) });
 if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
 };

 const inputClass = (hasError: boolean) =>
 `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
 hasError ? "border-red-500" : "border-gray-300"
 }`;

 return (
 <ModalWrapper open={open} onClose={onClose} title="Quick Add Category">
 <div className="px-6 py-4 space-y-4">
 <FormFieldWrapper label="Category Name" required error={errors.name}>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleNameChange(e.target.value)}
  className={inputClass(!!errors.name)}
  placeholder="Enter category name"
  />
 </FormFieldWrapper>

 <FormFieldWrapper label="Slug">
  <input
  type="text"
  value={formData.slug}
  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
  className={inputClass(false)}
  placeholder="auto-generated-slug"
  />
  <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
 </FormFieldWrapper>
 </div>

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
  {isLoading ? "Adding..." : "Add Category"}
 </button>
 </div>
 </ModalWrapper>
 );
};

// ==================== QUICK ADD SUB-CATEGORY MODAL ====================
export interface QuickSubCategoryFormData {
 name: string;
 slug: string;
 category: string;
 code: string;
}

interface QuickAddSubCategoryModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: QuickSubCategoryFormData) => void;
 categories: SelectOption[];
 selectedCategory?: string;
 isLoading?: boolean;
}

export const QuickAddSubCategoryModal: React.FC<QuickAddSubCategoryModalProps> = ({
 open,
 onClose,
 onAdd,
 categories,
 selectedCategory,
 isLoading,
}) => {
 const [formData, setFormData] = useState<QuickSubCategoryFormData>({
 name: "",
 slug: "",
 category: selectedCategory || "",
 code: "",
 });
 const [errors, setErrors] = useState<Record<string, string>>({});

 // Update category when selectedCategory changes
 React.useEffect(() => {
 if (selectedCategory) {
 setFormData((prev) => ({ ...prev, category: selectedCategory }));
 }
 }, [selectedCategory]);

 const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/(^-|-$)/g, "");
 };

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Sub-category name is required";
 if (!formData.category) newErrors.category = "Category is required";
 if (!formData.code.trim()) newErrors.code = "Code is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm()) {
 onAdd(formData);
 setFormData({ name: "", slug: "", category: selectedCategory || "", code: "" });
 setErrors({});
 }
 };

 const handleNameChange = (value: string) => {
 setFormData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
 if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
 };

 const handleChange = (field: keyof QuickSubCategoryFormData, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: field === "code" ? value.toUpperCase() : value }));
 if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
 };

 const inputClass = (hasError: boolean) =>
 `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
 hasError ? "border-red-500" : "border-gray-300"
 }`;

 return (
 <ModalWrapper open={open} onClose={onClose} title="Quick Add Sub-Category">
 <div className="px-6 py-4 space-y-4">
 <FormFieldWrapper label="Sub-Category Name" required error={errors.name}>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleNameChange(e.target.value)}
  className={inputClass(!!errors.name)}
  placeholder="Enter sub-category name"
  />
 </FormFieldWrapper>

 <FormFieldWrapper label="Slug">
  <input
  type="text"
  value={formData.slug}
  onChange={(e) => handleChange("slug", e.target.value)}
  className={inputClass(false)}
  placeholder="auto-generated-slug"
  />
  <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
 </FormFieldWrapper>

 <FormFieldWrapper label="Category" required error={errors.category}>
  <select
  value={formData.category}
  onChange={(e) => handleChange("category", e.target.value)}
  className={inputClass(!!errors.category)}
  >
  <option value="">Select Category</option>
  {categories.map((cat) => (
  <option key={cat.value} value={cat.value}>
  {cat.label}
  </option>
  ))}
  </select>
 </FormFieldWrapper>

 <FormFieldWrapper label="Code" required error={errors.code}>
  <input
  type="text"
  value={formData.code}
  onChange={(e) => handleChange("code", e.target.value)}
  className={inputClass(!!errors.code)}
  placeholder="SUB001"
  />
 </FormFieldWrapper>
 </div>

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
  {isLoading ? "Adding..." : "Add Sub-Category"}
 </button>
 </div>
 </ModalWrapper>
 );
};

// ==================== QUICK ADD UNIT MODAL ====================
export interface QuickUnitFormData {
 name: string;
 shortName: string;
}

interface QuickAddUnitModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: QuickUnitFormData) => void;
 isLoading?: boolean;
}

export const QuickAddUnitModal: React.FC<QuickAddUnitModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
}) => {
 const [formData, setFormData] = useState<QuickUnitFormData>({
 name: "",
 shortName: "",
 });
 const [errors, setErrors] = useState<Record<string, string>>({});

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Unit name is required";
 if (!formData.shortName.trim()) newErrors.shortName = "Short name is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm()) {
 onAdd(formData);
 setFormData({ name: "", shortName: "" });
 setErrors({});
 }
 };

 const handleChange = (field: keyof QuickUnitFormData, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
 };

 const inputClass = (hasError: boolean) =>
 `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
 hasError ? "border-red-500" : "border-gray-300"
 }`;

 return (
 <ModalWrapper open={open} onClose={onClose} title="Quick Add Unit">
 <div className="px-6 py-4 space-y-4">
 <FormFieldWrapper label="Unit Name" required error={errors.name}>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleChange("name", e.target.value)}
  className={inputClass(!!errors.name)}
  placeholder="e.g. Kilograms"
  />
 </FormFieldWrapper>

 <FormFieldWrapper label="Short Name" required error={errors.shortName}>
  <input
  type="text"
  value={formData.shortName}
  onChange={(e) => handleChange("shortName", e.target.value)}
  className={inputClass(!!errors.shortName)}
  placeholder="e.g. kg"
  />
 </FormFieldWrapper>
 </div>

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
  {isLoading ? "Adding..." : "Add Unit"}
 </button>
 </div>
 </ModalWrapper>
 );
};

// ==================== QUICK ADD BRAND MODAL ====================
export interface QuickBrandFormData {
 name: string;
 slug: string;
}

interface QuickAddBrandModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (data: QuickBrandFormData) => void;
 isLoading?: boolean;
}

export const QuickAddBrandModal: React.FC<QuickAddBrandModalProps> = ({
 open,
 onClose,
 onAdd,
 isLoading,
}) => {
 const [formData, setFormData] = useState<QuickBrandFormData>({
 name: "",
 slug: "",
 });
 const [errors, setErrors] = useState<Record<string, string>>({});

 const generateSlug = (name: string) => {
 return name
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/(^-|-$)/g, "");
 };

 const validateForm = () => {
 const newErrors: Record<string, string> = {};
 if (!formData.name.trim()) newErrors.name = "Brand name is required";
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = () => {
 if (validateForm()) {
 onAdd(formData);
 setFormData({ name: "", slug: "" });
 setErrors({});
 }
 };

 const handleNameChange = (value: string) => {
 setFormData({ name: value, slug: generateSlug(value) });
 if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
 };

 const inputClass = (hasError: boolean) =>
 `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
 hasError ? "border-red-500" : "border-gray-300"
 }`;

 return (
 <ModalWrapper open={open} onClose={onClose} title="Quick Add Brand">
 <div className="px-6 py-4 space-y-4">
 <FormFieldWrapper label="Brand Name" required error={errors.name}>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleNameChange(e.target.value)}
  className={inputClass(!!errors.name)}
  placeholder="Enter brand name"
  />
 </FormFieldWrapper>

 <FormFieldWrapper label="Slug">
  <input
  type="text"
  value={formData.slug}
  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
  className={inputClass(false)}
  placeholder="auto-generated-slug"
  />
  <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
 </FormFieldWrapper>
 </div>

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
  {isLoading ? "Adding..." : "Add Brand"}
 </button>
 </div>
 </ModalWrapper>
 );
};

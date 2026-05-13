"use client";

import { useState, useEffect, useCallback } from "react";
import { Tax, TaxFormData, Message } from "../types";
import { taxApi } from "../service";

const initialFormData: TaxFormData = {
 name: "",
 rate: "",
 type: "percentage",
 code: "",
 description: "",
 isCompound: false,
 isDefault: false,
 isActive: true,
};

export const useTaxSettings = () => {
 const [taxes, setTaxes] = useState<Tax[]>([]);
 const [formData, setFormData] = useState<TaxFormData>(initialFormData);
 const [editingTax, setEditingTax] = useState<Tax | null>(null);
 const [deletingTax, setDeletingTax] = useState<Tax | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Fetch taxes
 const fetchTaxes = useCallback(async () => {
  setIsLoading(true);
  try {
   const response = await taxApi.getTaxes();
   if (response.success && response.data) {
    setTaxes(response.data);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to load taxes" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchTaxes();
 }, [fetchTaxes]);

 // Clear message after 5 seconds
 useEffect(() => {
  if (message.text) {
   const timer = setTimeout(() => {
    setMessage({ type: "", text: "" });
   }, 5000);
   return () => clearTimeout(timer);
  }
 }, [message]);

 // Handle input changes
 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
 };

 // Handle checkbox changes
 const handleCheckboxChange = (name: string, checked: boolean) => {
  setFormData((prev) => ({ ...prev, [name]: checked }));
 };

 // Open add form
 const openAddForm = () => {
  setEditingTax(null);
  setFormData(initialFormData);
  setShowForm(true);
 };

 // Open edit form
 const openEditForm = (tax: Tax) => {
  setEditingTax(tax);
  setFormData({
   name: tax.name,
   rate: tax.rate.toString(),
   type: tax.type,
   code: tax.code || "",
   description: tax.description || "",
   isCompound: tax.isCompound,
   isDefault: tax.isDefault,
   isActive: tax.isActive,
  });
  setShowForm(true);
 };

 // Close form
 const closeForm = () => {
  setShowForm(false);
  setEditingTax(null);
  setFormData(initialFormData);
 };

 // Save tax (create or update)
 const saveTax = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setMessage({ type: "", text: "" });

  try {
   // Validate required fields
   if (!formData.name.trim()) {
    setMessage({ type: "error", text: "Tax name is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.rate.trim()) {
    setMessage({ type: "error", text: "Tax rate is required" });
    setIsSaving(false);
    return;
   }

   const rate = parseFloat(formData.rate);
   if (isNaN(rate) || rate < 0 || rate > 100) {
    setMessage({ type: "error", text: "Tax rate must be between 0 and 100" });
    setIsSaving(false);
    return;
   }

   let response;
   if (editingTax) {
    response = await taxApi.updateTax(editingTax._id!, formData);
   } else {
    response = await taxApi.createTax(formData);
   }

   if (response.success) {
    setMessage({
     type: "success",
     text: editingTax ? "Tax updated successfully" : "Tax created successfully"
    });
    closeForm();
    fetchTaxes();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to save tax" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to save tax" });
  } finally {
   setIsSaving(false);
  }
 };

 // Open delete confirmation
 const openDeleteModal = (tax: Tax) => {
  setDeletingTax(tax);
  setShowDeleteModal(true);
 };

 // Close delete modal
 const closeDeleteModal = () => {
  setShowDeleteModal(false);
  setDeletingTax(null);
 };

 // Delete tax
 const deleteTax = async () => {
  if (!deletingTax) return;

  setIsLoading(true);
  try {
   const response = await taxApi.deleteTax(deletingTax._id!);
   if (response.success) {
    setMessage({ type: "success", text: "Tax deleted successfully" });
    closeDeleteModal();
    fetchTaxes();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete tax" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete tax" });
  } finally {
   setIsLoading(false);
  }
 };

 // Set tax as default
 const setDefaultTax = async (tax: Tax) => {
  try {
   const response = await taxApi.setDefault(tax._id!);
   if (response.success) {
    setMessage({ type: "success", text: "Default tax updated" });
    fetchTaxes();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to set default tax" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to set default tax" });
  }
 };

 return {
  taxes,
  formData,
  editingTax,
  deletingTax,
  isLoading,
  isSaving,
  showForm,
  showDeleteModal,
  message,
  handleChange,
  handleCheckboxChange,
  openAddForm,
  openEditForm,
  closeForm,
  saveTax,
  openDeleteModal,
  closeDeleteModal,
  deleteTax,
  setDefaultTax,
  fetchTaxes,
 };
};

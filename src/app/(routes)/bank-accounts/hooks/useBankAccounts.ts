"use client";

import { useState, useEffect, useCallback } from "react";
import { BankAccount, BankAccountFormData, Message } from "../types";
import { bankAccountApi } from "../service";

const initialFormData: BankAccountFormData = {
 accountName: "",
 bankName: "",
 accountNumber: "",
 sortCode: "",
 iban: "",
 swiftBic: "",
 branchAddress: "",
 isDefault: false,
 isActive: true,
};

export const useBankAccounts = () => {
 const [accounts, setAccounts] = useState<BankAccount[]>([]);
 const [formData, setFormData] = useState<BankAccountFormData>(initialFormData);
 const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
 const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Fetch accounts
 const fetchAccounts = useCallback(async () => {
  setIsLoading(true);
  try {
   const response = await bankAccountApi.getAccounts();
   if (response.success && response.data) {
    setAccounts(response.data);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to load bank accounts" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchAccounts();
 }, [fetchAccounts]);

 // Clear message after 5 seconds
 useEffect(() => {
  if (message.text) {
   const timer = setTimeout(() => {
    setMessage({ type: "", text: "" });
   }, 5000);
   return () => clearTimeout(timer);
  }
 }, [message]);

 // Format sort code as user types
 const formatSortCode = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
 };

 // Handle input changes
 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  if (name === "sortCode") {
   setFormData((prev) => ({ ...prev, [name]: formatSortCode(value) }));
  } else {
   setFormData((prev) => ({ ...prev, [name]: value }));
  }
 };

 // Handle checkbox changes
 const handleCheckboxChange = (name: string, checked: boolean) => {
  setFormData((prev) => ({ ...prev, [name]: checked }));
 };

 // Open add form
 const openAddForm = () => {
  setEditingAccount(null);
  setFormData(initialFormData);
  setShowForm(true);
 };

 // Open edit form
 const openEditForm = (account: BankAccount) => {
  setEditingAccount(account);
  setFormData({
   accountName: account.accountName,
   bankName: account.bankName,
   accountNumber: account.accountNumber,
   sortCode: account.sortCode,
   iban: account.iban || "",
   swiftBic: account.swiftBic || "",
   branchAddress: account.branchAddress || "",
   isDefault: account.isDefault,
   isActive: account.isActive,
  });
  setShowForm(true);
 };

 // Close form
 const closeForm = () => {
  setShowForm(false);
  setEditingAccount(null);
  setFormData(initialFormData);
 };

 // Save account (create or update)
 const saveAccount = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setMessage({ type: "", text: "" });

  try {
   // Validate required fields
   if (!formData.accountName.trim()) {
    setMessage({ type: "error", text: "Account name is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.bankName.trim()) {
    setMessage({ type: "error", text: "Bank name is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.accountNumber.trim()) {
    setMessage({ type: "error", text: "Account number is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.sortCode.trim()) {
    setMessage({ type: "error", text: "Sort code is required" });
    setIsSaving(false);
    return;
   }

   let response;
   if (editingAccount) {
    response = await bankAccountApi.updateAccount(editingAccount._id!, formData);
   } else {
    response = await bankAccountApi.createAccount(formData);
   }

   if (response.success) {
    setMessage({
     type: "success",
     text: editingAccount ? "Bank account updated successfully" : "Bank account created successfully"
    });
    closeForm();
    fetchAccounts();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to save bank account" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to save bank account" });
  } finally {
   setIsSaving(false);
  }
 };

 // Open delete confirmation
 const openDeleteModal = (account: BankAccount) => {
  setDeletingAccount(account);
  setShowDeleteModal(true);
 };

 // Close delete modal
 const closeDeleteModal = () => {
  setShowDeleteModal(false);
  setDeletingAccount(null);
 };

 // Delete account
 const deleteAccount = async () => {
  if (!deletingAccount) return;

  setIsLoading(true);
  try {
   const response = await bankAccountApi.deleteAccount(deletingAccount._id!);
   if (response.success) {
    setMessage({ type: "success", text: "Bank account deleted successfully" });
    closeDeleteModal();
    fetchAccounts();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete bank account" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete bank account" });
  } finally {
   setIsLoading(false);
  }
 };

 // Set account as default
 const setDefaultAccount = async (account: BankAccount) => {
  try {
   const response = await bankAccountApi.setDefault(account._id!);
   if (response.success) {
    setMessage({ type: "success", text: "Default bank account updated" });
    fetchAccounts();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to set default account" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to set default account" });
  }
 };

 return {
  accounts,
  formData,
  editingAccount,
  deletingAccount,
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
  saveAccount,
  openDeleteModal,
  closeDeleteModal,
  deleteAccount,
  setDefaultAccount,
  fetchAccounts,
 };
};

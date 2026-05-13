"use client";

import { useState, useEffect, useCallback } from "react";
import { AboutSettings, AboutFormData, Message } from "../types";
import { aboutSettingsApi } from "../service";

const initialFormData: AboutFormData = {
 appTitle: "THANK YOU",
 appName: "THANK YOU",
 logo: null,
 logoPreview: null,
 loginPageTitle: "THANK YOU",
 companyAddress: "Manchester",
 orderPdfTitle: "Sale Order",
 invoicePdfTitle: "Dispatch Note",
};

export const useAboutSettings = () => {
 const [formData, setFormData] = useState<AboutFormData>(initialFormData);
 const [originalData, setOriginalData] = useState<AboutSettings | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Fetch existing settings
 const fetchSettings = useCallback(async () => {
  setIsLoading(true);
  try {
   const response = await aboutSettingsApi.getSettings();

   if (response.success && response.data) {
    const data = response.data;
    setOriginalData(data);
    
    // Handle logo: can be base64 data URL or file path
    const logoPreview = data.logo
     ? (data.logo.startsWith('data:') || data.logo.startsWith('http'))
      ? data.logo
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${data.logo}`
     : null;
    
    setFormData({
     appTitle: data.appTitle || "THANK YOU",
     appName: data.appName || "THANK YOU",
     logo: null,
     logoPreview: logoPreview,
     loginPageTitle: data.loginPageTitle || "THANK YOU",
     companyAddress: data.companyAddress || "Manchester",
     orderPdfTitle: data.orderPdfTitle || "Sale Order",
     invoicePdfTitle: data.invoicePdfTitle || "Dispatch Note",
    });
   } else {
    // Set default values if no settings exist
    setFormData(initialFormData);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to load settings" });
   setFormData(initialFormData);
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchSettings();
 }, [fetchSettings]);

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
 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
 };

 // Handle logo file change
 const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   // Validate file type
   if (!file.type.startsWith("image/")) {
    setMessage({ type: "error", text: "Please select a valid image file" });
    return;
   }

   // Validate file size (max 2MB)
   if (file.size > 2 * 1024 * 1024) {
    setMessage({ type: "error", text: "Image size should be less than 2MB" });
    return;
   }

   try {
    // Upload logo to server
    const response = await aboutSettingsApi.uploadLogo(file);

    if (response.success && response.data) {
     // Backend now returns base64 data URL directly, or legacy file path
     const logoUrl = response.data.logo?.startsWith('data:')
      ? response.data.logo
      : response.data.logo?.startsWith('http')
      ? response.data.logo
      : response.data.logo
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${response.data.logo}`
      : null;

     setFormData((prev) => ({
      ...prev,
      logo: file,
      logoPreview: logoUrl,
     }));
     
     // Update originalData with the new settings from response
     if (response.data.settings) {
      setOriginalData(response.data.settings);
     }
     
     setMessage({ type: "success", text: "Logo uploaded successfully" });
    } else {
     setMessage({ type: "error", text: response.message || "Failed to upload logo" });
    }
   } catch {
    // Fallback to local preview if upload fails
    const reader = new FileReader();
    reader.onloadend = () => {
     setFormData((prev) => ({
      ...prev,
      logo: file,
      logoPreview: reader.result as string,
     }));
    };
    reader.readAsDataURL(file);
    setMessage({ type: "error", text: "Failed to upload logo to server" });
   }
  }
 };

 // Remove logo
 const removeLogo = async () => {
  try {
   const response = await aboutSettingsApi.removeLogo();

   if (response.success) {
    setFormData((prev) => ({
     ...prev,
     logo: null,
     logoPreview: null,
    }));
    setMessage({ type: "success", text: "Logo removed successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to remove logo" });
   }
  } catch {
   // Remove locally even if API fails
   setFormData((prev) => ({
    ...prev,
    logo: null,
    logoPreview: null,
   }));
  }
 };

 // Save settings
 const saveSettings = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setMessage({ type: "", text: "" });

  try {
   // Validate required fields
   if (!formData.appTitle.trim()) {
    setMessage({ type: "error", text: "App Title is required" });
    setIsSaving(false);
    return;
   }

   if (!formData.appName.trim()) {
    setMessage({ type: "error", text: "App Name is required" });
    setIsSaving(false);
    return;
   }

   const response = await aboutSettingsApi.saveSettings(formData);

   if (response.success && response.data) {
    setOriginalData(response.data);
    setMessage({ type: "success", text: response.message || "Settings saved successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to save settings" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to save settings" });
  } finally {
   setIsSaving(false);
  }
 };

 // Reset form to original values
 const resetForm = () => {
  if (originalData) {
   // Handle logo: can be base64 data URL or file path
   const logoPreview = originalData.logo
    ? (originalData.logo.startsWith('data:') || originalData.logo.startsWith('http'))
     ? originalData.logo
     : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${originalData.logo}`
    : null;
   
   setFormData({
    appTitle: originalData.appTitle || "THANK YOU",
    appName: originalData.appName || "THANK YOU",
    logo: null,
    logoPreview: logoPreview,
    loginPageTitle: originalData.loginPageTitle || "THANK YOU",
    companyAddress: originalData.companyAddress || "Manchester",
    orderPdfTitle: originalData.orderPdfTitle || "Sale Order",
    invoicePdfTitle: originalData.invoicePdfTitle || "Dispatch Note",
   });
  } else {
   setFormData(initialFormData);
  }
  setMessage({ type: "", text: "" });
 };

 // Delete settings (reset to defaults)
 const deleteSettings = async () => {
  setIsLoading(true);
  try {
   const response = await aboutSettingsApi.deleteSettings();

   if (response.success && response.data) {
    setOriginalData(response.data);
    
    // Handle logo: can be base64 data URL or file path
    const logoPreview = response.data.logo
     ? (response.data.logo.startsWith('data:') || response.data.logo.startsWith('http'))
      ? response.data.logo
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${response.data.logo}`
     : null;
    
    setFormData({
     appTitle: response.data.appTitle || "THANK YOU",
     appName: response.data.appName || "THANK YOU",
     logo: null,
     logoPreview: logoPreview,
     loginPageTitle: response.data.loginPageTitle || "THANK YOU",
     companyAddress: response.data.companyAddress || "Manchester",
     orderPdfTitle: response.data.orderPdfTitle || "Sale Order",
     invoicePdfTitle: response.data.invoicePdfTitle || "Dispatch Note",
    });
    setMessage({ type: "success", text: response.message || "Settings reset to defaults successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to reset settings" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to reset settings" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  formData,
  isLoading,
  isSaving,
  message,
  hasExistingData: !!originalData?._id,
  handleChange,
  handleLogoChange,
  removeLogo,
  saveSettings,
  resetForm,
  deleteSettings,
  fetchSettings,
 };
};

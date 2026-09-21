"use client";

import { useState, useEffect, useCallback } from "react";
import { EmailSettings, EmailFormData, Message } from "../types";
import { emailSettingsApi } from "../service";

const initialFormData: EmailFormData = {
 smtpHost: "",
 smtpPort: "587",
 smtpSecure: "tls",
 smtpUsername: "",
 smtpPassword: "",
 fromEmail: "",
 fromName: "",
 replyToEmail: "",
 replyToName: "",
 enableEmailNotifications: true,
};

export const useEmailSettings = () => {
 const [formData, setFormData] = useState<EmailFormData>(initialFormData);
 const [originalData, setOriginalData] = useState<EmailSettings | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [isTesting, setIsTesting] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Fetch existing settings
 const fetchSettings = useCallback(async () => {
  setIsLoading(true);
  try {
   const response = await emailSettingsApi.getSettings();

   if (response.success && response.data) {
    const data = response.data;
    setOriginalData(data);
    setFormData({
     smtpHost: data.smtpHost || "",
     smtpPort: data.smtpPort?.toString() || "587",
     smtpSecure: data.smtpSecure || "tls",
     smtpUsername: data.smtpUsername || "",
     smtpPassword: data.smtpPassword || "",
     fromEmail: data.fromEmail || "",
     fromName: data.fromName || "",
     replyToEmail: data.replyToEmail || "",
     replyToName: data.replyToName || "",
     enableEmailNotifications: data.enableEmailNotifications ?? true,
    });
   } else {
    setFormData(initialFormData);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to load email settings" });
   setFormData(initialFormData);
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchSettings();
 }, [fetchSettings]);

 // Clear message after delay (longer for errors so SMTP details can be read)
 useEffect(() => {
  if (message.text) {
   const delay = message.type === "error" ? 20000 : 5000;
   const timer = setTimeout(() => {
    setMessage({ type: "", text: "" });
   }, delay);
   return () => clearTimeout(timer);
  }
 }, [message]);

 // Handle input changes
 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => {
   const next = { ...prev, [name]: value };
   if (name === "smtpPort") {
    const port = parseInt(value, 10);
    if (port === 465) next.smtpSecure = "ssl";
    else if (port === 587 || port === 2525) next.smtpSecure = "tls";
   }
   return next;
  });
 };

 // Handle checkbox changes
 const handleCheckboxChange = (name: string, checked: boolean) => {
  setFormData((prev) => ({ ...prev, [name]: checked }));
 };

 // Save settings
 const saveSettings = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setMessage({ type: "", text: "" });

  try {
   // Validate required fields
   if (!formData.smtpHost.trim()) {
    setMessage({ type: "error", text: "SMTP Host is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.smtpPort.trim()) {
    setMessage({ type: "error", text: "SMTP Port is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.smtpUsername.trim()) {
    setMessage({ type: "error", text: "SMTP Username is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.smtpPassword.trim()) {
    setMessage({ type: "error", text: "SMTP Password is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.fromEmail.trim()) {
    setMessage({ type: "error", text: "From Email is required" });
    setIsSaving(false);
    return;
   }
   if (!formData.fromName.trim()) {
    setMessage({ type: "error", text: "From Name is required" });
    setIsSaving(false);
    return;
   }

   const response = await emailSettingsApi.saveSettings(formData);

   if (response.success && response.data) {
    setOriginalData(response.data);
    setMessage({ type: "success", text: response.message || "Email settings saved successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to save email settings" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to save email settings" });
  } finally {
   setIsSaving(false);
  }
 };

 // Reset form to original values
 const resetForm = () => {
  if (originalData) {
   setFormData({
    smtpHost: originalData.smtpHost || "",
    smtpPort: originalData.smtpPort?.toString() || "587",
    smtpSecure: originalData.smtpSecure || "tls",
    smtpUsername: originalData.smtpUsername || "",
    smtpPassword: originalData.smtpPassword || "",
    fromEmail: originalData.fromEmail || "",
    fromName: originalData.fromName || "",
    replyToEmail: originalData.replyToEmail || "",
    replyToName: originalData.replyToName || "",
    enableEmailNotifications: originalData.enableEmailNotifications ?? true,
   });
  } else {
   setFormData(initialFormData);
  }
  setMessage({ type: "", text: "" });
 };

 // Delete settings
 const deleteSettings = async () => {
  setIsLoading(true);
  try {
   const response = await emailSettingsApi.deleteSettings();

   if (response.success) {
    setOriginalData(null);
    setFormData(initialFormData);
    setMessage({ type: "success", text: response.message || "Email settings deleted successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete email settings" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete email settings" });
  } finally {
   setIsLoading(false);
  }
 };

 // Test email settings — returns true when sent successfully.
 const testEmail = async (testEmailAddress: string): Promise<boolean> => {
  setIsTesting(true);
  setMessage({ type: "", text: "" });

  const port = parseInt(formData.smtpPort, 10);
  if (port === 587 && formData.smtpSecure === "ssl") {
   setMessage({
    type: "error",
    text: "Port 587 requires TLS encryption (not SSL). Encryption has been corrected — try Test Email again.",
   });
   setFormData((prev) => ({ ...prev, smtpSecure: "tls" }));
   setIsTesting(false);
   return false;
  }
  if (port === 465 && formData.smtpSecure === "tls") {
   setMessage({
    type: "error",
    text: "Port 465 requires SSL encryption (not TLS). Encryption has been corrected — try Test Email again.",
   });
   setFormData((prev) => ({ ...prev, smtpSecure: "ssl" }));
   setIsTesting(false);
   return false;
  }

  try {
   const response = await emailSettingsApi.testEmail(testEmailAddress, formData);

   if (response.success) {
    setMessage({ type: "success", text: response.message || "Test email sent successfully" });
    return true;
   }
   setMessage({ type: "error", text: response.message || "Failed to send test email" });
   return false;
  } catch (e) {
   setMessage({
    type: "error",
    text: e instanceof Error ? e.message : "Failed to send test email",
   });
   return false;
  } finally {
   setIsTesting(false);
  }
 };

 return {
  formData,
  isLoading,
  isSaving,
  isTesting,
  message,
  hasExistingData: !!originalData?._id,
  handleChange,
  handleCheckboxChange,
  saveSettings,
  resetForm,
  deleteSettings,
  testEmail,
  fetchSettings,
 };
};

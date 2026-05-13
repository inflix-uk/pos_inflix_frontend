"use client";

import { useState, useEffect } from "react";
import { UserData, ProfileFormData, PasswordFormData, Message } from "../types";
import { profileApi } from "../service";

const initialUserData: UserData = {
 _id: "",
 name: "",
 email: "",
 role: "",
 phone: "",
 createdAt: "",
 lastLogin: "",
};

const initialProfileForm: ProfileFormData = {
 name: "",
 email: "",
 phone: "",
};

const initialPasswordForm: PasswordFormData = {
 currentPassword: "",
 newPassword: "",
 confirmPassword: "",
};

export const useProfile = () => {
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });
 const [userData, setUserData] = useState<UserData>(initialUserData);
 const [profileForm, setProfileForm] = useState<ProfileFormData>(initialProfileForm);
 const [passwordForm, setPasswordForm] = useState<PasswordFormData>(initialPasswordForm);

 useEffect(() => {
  loadUserData();
 }, []);

 const loadUserData = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
   const user = JSON.parse(storedUser);
   setUserData(user);
   setProfileForm({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
   });
  }
 };

 const clearMessage = () => {
  setMessage({ type: "", text: "" });
 };

 const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setProfileForm((prev) => ({ ...prev, [name]: value }));
 };

 const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setPasswordForm((prev) => ({ ...prev, [name]: value }));
 };

 const updateProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  clearMessage();

  try {
   const response = await profileApi.updateProfile(userData._id, profileForm);

   if (response.success) {
    const updatedUser = { ...userData, ...profileForm };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUserData(updatedUser);
    setMessage({ type: "success", text: "Profile updated successfully!" });
   } else {
    setMessage({ type: "error", text: response.message || "Update failed" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update profile" });
  } finally {
   setIsLoading(false);
  }
 };

 const updatePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  clearMessage();

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
   setMessage({ type: "error", text: "New passwords do not match" });
   return;
  }

  if (passwordForm.newPassword.length < 6) {
   setMessage({ type: "error", text: "Password must be at least 6 characters" });
   return;
  }

  setIsLoading(true);

  try {
   const response = await profileApi.updatePassword(
    passwordForm.currentPassword,
    passwordForm.newPassword
   );

   if (response.success) {
    setMessage({ type: "success", text: "Password updated successfully!" });
    setPasswordForm(initialPasswordForm);
    if (response.token) {
     localStorage.setItem("token", response.token);
    }
   } else {
    setMessage({ type: "error", text: response.message || "Update failed" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update password" });
  } finally {
   setIsLoading(false);
  }
 };

 const fetchProfile = async () => {
  setIsLoading(true);
  try {
   const response = await profileApi.getProfile();
   if (response.success && response.data) {
    const user = response.data as UserData;
    setUserData(user);
    setProfileForm({
     name: user.name || "",
     email: user.email || "",
     phone: user.phone || "",
    });
    localStorage.setItem("user", JSON.stringify(user));
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch profile" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  userData,
  profileForm,
  passwordForm,
  isLoading,
  message,
  handleProfileChange,
  handlePasswordChange,
  updateProfile,
  updatePassword,
  fetchProfile,
 };
};

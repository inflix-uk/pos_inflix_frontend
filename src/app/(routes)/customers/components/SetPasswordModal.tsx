"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";

interface SetPasswordModalProps {
 open: boolean;
 customerName: string;
 customerEmail: string;
 customerId: string;
 onClose: () => void;
 onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
 open,
 customerName,
 customerEmail,
 customerId,
 onClose,
 onSuccess,
}) => {
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [error, setError] = useState("");
 const [isLoading, setIsLoading] = useState(false);

 if (!open) return null;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");

 if (!password || password.length < 6) {
 setError("Password must be at least 6 characters");
 return;
 }
 if (password !== confirmPassword) {
 setError("Passwords do not match");
 return;
 }

 setIsLoading(true);
 try {
 const token = localStorage.getItem("token");
 const res = await fetch(`${API_URL}/api/customer-portal/set-password`, {
 method: "POST",
 headers: {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 },
 body: JSON.stringify({ customerId, password }),
 });
 const data = await res.json();
 if (!res.ok) {
 setError(data.message || "Failed to set password");
 return;
 }
 setPassword("");
 setConfirmPassword("");
 onSuccess();
 onClose();
 } catch {
 setError("Failed to connect to server");
 } finally {
 setIsLoading(false);
 }
 };

 const handleClose = () => {
 setPassword("");
 setConfirmPassword("");
 setError("");
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
 <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-gray-900">
  Set Portal Password
  </h2>
  <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} className="text-gray-500" />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  {error && (
  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
  {error}
  </div>
  )}

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Customer
  </label>
  <input
  type="text"
  value={customerName}
  readOnly
  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Email
  </label>
  <input
  type="email"
  value={customerEmail}
  readOnly
  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Password
  </label>
  <div className="relative">
  <input
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Min 6 characters"
  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  />
  <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute inset-y-0 right-0 pr-3 flex items-center"
  >
  {showPassword ? (
   <EyeOff size={18} className="text-gray-400" />
  ) : (
   <Eye size={18} className="text-gray-400" />
  )}
  </button>
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Confirm Password
  </label>
  <div className="relative">
  <input
  type={showConfirm ? "text" : "password"}
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  placeholder="Re-enter password"
  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  />
  <button
  type="button"
  onClick={() => setShowConfirm(!showConfirm)}
  className="absolute inset-y-0 right-0 pr-3 flex items-center"
  >
  {showConfirm ? (
   <EyeOff size={18} className="text-gray-400" />
  ) : (
   <Eye size={18} className="text-gray-400" />
  )}
  </button>
  </div>
  </div>

  <div className="flex justify-end gap-3 pt-2">
  <button
  type="button"
  onClick={handleClose}
  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isLoading}
  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-60 flex items-center gap-2"
  >
  {isLoading && <Loader2 size={16} className="animate-spin" />}
  Set Password
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

"use client";

import React, { useState } from "react";
import { Send, X, Mail } from "lucide-react";
import { TestEmailModalProps } from "../types";

export const TestEmailModal: React.FC<TestEmailModalProps> = ({
 isOpen,
 onClose,
 onTest,
 isTesting,
}) => {
 const [email, setEmail] = useState("");

 if (!isOpen) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (email.trim()) {
 onTest(email.trim());
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/50" aria-hidden />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
 <div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
  <div className="p-2 bg-orange-100 rounded-full">
  <Send className="h-6 w-6 text-orange-500" />
  </div>
  <h3 className="text-lg font-semibold text-gray-800">Send Test Email</h3>
  </div>
  <button
  onClick={onClose}
  className="p-1 text-gray-400 hover:text-gray-600"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <form onSubmit={handleSubmit}>
  <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Recipient Email Address
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Mail className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  placeholder="test@example.com"
  required
  />
  </div>
  <p className="text-xs text-gray-500 mt-2">
  A test email will be sent to this address to verify your SMTP settings.
  </p>
  </div>

  <div className="flex justify-end gap-3">
  <button
  type="button"
  onClick={onClose}
  disabled={isTesting}
  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isTesting || !email.trim()}
  className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
  >
  <Send className="w-4 h-4 mr-2" />
  {isTesting ? "Sending..." : "Send Test"}
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

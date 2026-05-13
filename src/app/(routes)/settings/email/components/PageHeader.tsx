"use client";

import React from "react";
import { Mail } from "lucide-react";

export const PageHeader: React.FC = () => {
 return (
 <div className="mb-6">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-orange-100 rounded-lg">
  <Mail className="h-6 w-6 text-orange-500" />
 </div>
 <div>
  <h1 className="text-2xl font-semibold text-gray-800">Email Settings</h1>
  <p className="text-gray-500 text-sm mt-1">
  Configure SMTP settings for sending emails
  </p>
 </div>
 </div>
 </div>
 );
};

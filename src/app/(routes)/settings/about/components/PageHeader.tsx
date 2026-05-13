"use client";

import React from "react";
import { Info } from "lucide-react";

export const PageHeader: React.FC = () => {
 return (
 <div className="mb-6">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-orange-100 rounded-lg">
  <Info className="h-6 w-6 text-orange-500" />
 </div>
 <div>
  <h1 className="text-2xl font-semibold text-gray-800">About Settings</h1>
  <p className="text-gray-500 text-sm mt-1">
  Configure your application details and branding
  </p>
 </div>
 </div>
 </div>
 );
};

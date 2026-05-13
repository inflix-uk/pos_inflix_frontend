"use client";

import React from "react";
import { Receipt, Plus } from "lucide-react";

interface PageHeaderProps {
 onAddClick: () => void;
 showAddButton: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ onAddClick, showAddButton }) => {
 return (
 <div className="mb-6 flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-orange-100 rounded-lg">
  <Receipt className="h-6 w-6 text-orange-500" />
 </div>
 <div>
  <h1 className="text-2xl font-semibold text-gray-800">Tax Settings</h1>
  <p className="text-gray-500 text-sm mt-1">
  Manage tax rates for your products and services
  </p>
 </div>
 </div>

 {showAddButton && (
 <button
  onClick={onAddClick}
  className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
 >
  <Plus className="w-5 h-5 mr-2" />
  Add Tax
 </button>
 )}
 </div>
 );
};

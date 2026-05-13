"use client";

import React from "react";
import { Landmark, Plus } from "lucide-react";

interface PageHeaderProps {
 onAddClick: () => void;
 showAddButton: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ onAddClick, showAddButton }) => {
 return (
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-3 @[640px]:gap-4">
 <div className="flex items-center gap-2 @[640px]:gap-3">
 <div className="p-1.5 @[640px]:p-2 bg-orange-100 rounded-lg">
  <Landmark className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 text-orange-500" />
 </div>
 <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-semibold text-gray-800">Bank Accounts</h1>
  <p className="text-gray-500 text-xs @[640px]:text-sm mt-0.5 @[640px]:mt-1">
  Manage your UK bank accounts for payments
  </p>
 </div>
 </div>

 {showAddButton && (
 <button
  onClick={onAddClick}
  className="inline-flex items-center px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs @[640px]:text-sm font-medium rounded-lg transition-colors"
 >
  <Plus className="w-4 h-4 @[640px]:w-5 @[640px]:h-5 mr-1.5 @[640px]:mr-2" />
  Add Bank Account
 </button>
 )}
 </div>
 );
};

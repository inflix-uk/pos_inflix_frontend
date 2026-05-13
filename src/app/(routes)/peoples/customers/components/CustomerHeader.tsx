"use client";
import React from "react";
import { Plus, RefreshCw } from "lucide-react";

interface CustomerHeaderProps { onAddClick: () => void; onRefresh: () => void; }

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ onAddClick, onRefresh }) => {
 return (
 <div className="flex flex-col @[640px]:flex-row justify-between items-start @[640px]:items-center gap-3 @[640px]:gap-4 mb-4 @[640px]:mb-6">
 <div>
 <h1 className="text-lg @[480px]:text-xl @[640px]:text-2xl font-bold text-gray-900">Customers</h1>
 <p className="text-xs @[640px]:text-sm @[768px]:text-base text-gray-600 mt-1">Manage your customer database</p>
 </div>
 <div className="flex gap-2 @[640px]:gap-3">
 <button onClick={onRefresh} className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCw size={16} className="@[640px]:hidden" /><RefreshCw size={18} className="hidden @[640px]:inline" /> Refresh</button>
 <button onClick={onAddClick} className="flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"><Plus size={16} className="@[640px]:hidden" /><Plus size={18} className="hidden @[640px]:inline" /> Add Customer</button>
 </div>
 </div>
 );
};

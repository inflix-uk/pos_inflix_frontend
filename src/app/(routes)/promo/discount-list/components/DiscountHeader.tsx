"use client";

import React from "react";
import { Plus, Download, Upload, MoreHorizontal } from "lucide-react";

interface DiscountHeaderProps {
 onAddClick: () => void;
}

export const DiscountHeader: React.FC<DiscountHeaderProps> = ({ onAddClick }) => {
 return (
 <div className="flex items-center justify-between mb-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Discount</h1>
 <p className="text-gray-600 mt-1">Manage your discount</p>
 </div>
 <div className="flex items-center gap-3">
 <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
  <Download size={20} />
 </button>
 <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
  <Upload size={20} />
 </button>
 <button
  onClick={onAddClick}
  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
 >
  <Plus size={20} />
  Add discount
 </button>
 <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
  <MoreHorizontal size={20} />
 </button>
 </div>
 </div>
 );
};

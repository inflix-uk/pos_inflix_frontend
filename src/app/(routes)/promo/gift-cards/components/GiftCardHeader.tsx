"use client";

import React from "react";
import { Plus, Download, FileText, RotateCcw, TrendingUp } from "lucide-react";

interface GiftCardHeaderProps {
 onAddClick: () => void;
}

export const GiftCardHeader: React.FC<GiftCardHeaderProps> = ({ onAddClick }) => {
 return (
 <div className="mb-8">
 <div className="flex items-center justify-between">
 <div>
  <h1 className="text-2xl font-semibold text-gray-900">Gift Cards</h1>
  <p className="text-gray-600 mt-1">Manage your gift cards</p>
 </div>
 <div className="flex items-center gap-3">
  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
  <RotateCcw size={20} />
  </button>
  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
  <TrendingUp size={20} />
  </button>
  <button
  onClick={onAddClick}
  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
  >
  <Plus size={20} />
  Add Gift Card
  </button>
  <button className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
  <Download size={20} />
  Import Gift Cards
  </button>
 </div>
 </div>
 </div>
 );
};

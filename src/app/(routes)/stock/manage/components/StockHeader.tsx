"use client";

import React from "react";
import { Plus, FileText, RotateCcw, ChevronRight } from "lucide-react";

interface StockHeaderProps {
 onAddClick: () => void;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ onAddClick }) => {
 return (
 <div className="mb-8">
 <div className="flex items-center justify-between">
 <div>
  <h1 className="text-2xl font-semibold text-gray-900">Manage Stock</h1>
  <p className="text-gray-600 mt-1">Manage your stock</p>
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
  <span className="inline-block rotate-180">
  <ChevronRight size={20} />
  </span>
  </button>
  <button
  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
  onClick={onAddClick}
  >
  <Plus size={20} />
  Add Stock
  </button>
 </div>
 </div>
 </div>
 );
};

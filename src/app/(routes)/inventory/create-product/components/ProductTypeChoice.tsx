"use client";

import React from "react";
import { Smartphone, Package } from "lucide-react";

interface ProductTypeChoiceProps {
 onSelect: (mode: "serial" | "non-serial") => void;
 isLoading?: boolean;
}

export function ProductTypeChoice({ onSelect, isLoading }: ProductTypeChoiceProps) {
 return (
 <div className="p-4 @[640px]:p-5">
 <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Add product</h2>
 <p className="text-xs text-gray-500 mb-4">Choose how you want to add a product to inventory</p>
 <div className="flex flex-col @[640px]:flex-row gap-3">
 <button
  type="button"
  onClick={() => onSelect("serial")}
  disabled={isLoading}
  className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors text-left disabled:opacity-50"
 >
  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-100 text-orange-600 shrink-0">
  <Smartphone className="w-4.5 h-4.5" />
  </span>
  <div>
  <span className="block text-sm font-medium text-gray-800">Serial items (IMEI)</span>
  <span className="block text-xs text-gray-500 mt-0.5">Enter multiple IMEIs per line or comma-separated</span>
  </div>
 </button>
 <button
  type="button"
  onClick={() => onSelect("non-serial")}
  disabled={isLoading}
  className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors text-left disabled:opacity-50"
 >
  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 shrink-0">
  <Package className="w-4.5 h-4.5" />
  </span>
  <div>
  <span className="block text-sm font-medium text-gray-800">Non-serial items</span>
  <span className="block text-xs text-gray-500 mt-0.5">Add a product without serial numbers</span>
  </div>
 </button>
 </div>
 </div>
 );
}

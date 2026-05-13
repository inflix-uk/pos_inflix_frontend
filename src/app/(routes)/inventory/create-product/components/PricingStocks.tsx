"use client";

import React from "react";
import { DollarSign, Package, Percent, ChevronDown } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { PricingData } from "../types";

const inputClass =
 "block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const gridClass = "grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-3 gap-6";

interface PricingStocksProps {
 pricingData: PricingData;
 updatePricingData: (data: Partial<PricingData>) => void;
 isExpanded?: boolean;
 onToggle?: () => void;
}

const taxOptions = [
 { value: "0", label: "0%" },
 { value: "5", label: "5%" },
 { value: "10", label: "10%" },
 { value: "18", label: "18%" },
];

export default function PricingStocks({
 pricingData,
 updatePricingData,
 isExpanded = true,
 onToggle,
}: PricingStocksProps) {
 return (
 <div className={gridClass}>
 <div>
  <label className={labelClass}>QUANTITY <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Package className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  inputMode="numeric"
  value={pricingData.quantity}
  onChange={(e) => updatePricingData({ quantity: e.target.value })}
  placeholder="0"
  className={inputClass}
  />
  </div>
 </div>

 <div>
  <label className={labelClass}>COST PRICE <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <DollarSign className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  inputMode="decimal"
  value={pricingData.costPrice}
  onChange={(e) => updatePricingData({ costPrice: e.target.value })}
  placeholder="0.00"
  className={inputClass}
  />
  </div>
 </div>

 <div>
  <label className={labelClass}>SELLING PRICE <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <DollarSign className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  inputMode="decimal"
  value={pricingData.sellingPrice}
  onChange={(e) => updatePricingData({ sellingPrice: e.target.value })}
  placeholder="0.00"
  className={inputClass}
  />
  </div>
 </div>

 <div>
  <label className={labelClass}>MIN STOCK LEVEL</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Package className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  inputMode="numeric"
  value={pricingData.minStockLevel}
  onChange={(e) => updatePricingData({ minStockLevel: e.target.value })}
  placeholder="10"
  className={inputClass}
  />
  </div>
 </div>

 <div>
  <label className={labelClass}>TAX TYPE</label>
  <div className="relative">
  <select
  value={pricingData.taxType}
  onChange={(e) => updatePricingData({ taxType: e.target.value })}
  className={`${inputClass} appearance-none pr-10`}
  >
  <option value="inclusive">Tax Inclusive</option>
  <option value="exclusive">Tax Exclusive</option>
  </select>
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
  </div>
 </div>

 <div>
  <label className={labelClass}>TAX RATE</label>
  <SearchableSelect
  value={pricingData.tax}
  onChange={(value) => updatePricingData({ tax: value })}
  options={taxOptions}
  placeholder="Select rate"
  icon={<Percent className="h-5 w-5 text-gray-400" />}
  />
 </div>

 <div>
  <label className={labelClass}>DISCOUNT TYPE</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Percent className="h-5 w-5 text-gray-400" />
  </div>
  <select
  value={pricingData.discountType}
  onChange={(e) => updatePricingData({ discountType: e.target.value })}
  className={`${inputClass} appearance-none pr-10 pl-10`}
  >
  <option value="percentage">Percentage</option>
  <option value="fixed">Fixed Amount</option>
  </select>
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
  </div>
 </div>

 <div>
  <label className={labelClass}>DISCOUNT VALUE</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Percent className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="text"
  inputMode="decimal"
  value={pricingData.discountValue}
  onChange={(e) => updatePricingData({ discountValue: e.target.value })}
  placeholder="0"
  className={inputClass}
  />
  </div>
 </div>
 </div>
 );
}

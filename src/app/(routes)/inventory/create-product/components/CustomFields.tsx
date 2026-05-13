"use client";

import React from "react";
import { Calendar, Shield, Factory } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { CustomFieldsData, SelectOption } from "../types";

const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const inputClass =
 "block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800";

const manufacturerOptions: SelectOption[] = [
 { value: "apple", label: "Apple" },
 { value: "samsung", label: "Samsung" },
 { value: "google", label: "Google" },
 { value: "sony", label: "Sony" },
 { value: "lg", label: "LG" },
 { value: "microsoft", label: "Microsoft" },
 { value: "dell", label: "Dell" },
 { value: "hp", label: "HP" },
 { value: "lenovo", label: "Lenovo" },
];

const defaultWarrantyOptions: SelectOption[] = [
 { value: "1-year", label: "1 Year" },
 { value: "2-year", label: "2 Years" },
 { value: "3-year", label: "3 Years" },
 { value: "5-year", label: "5 Years" },
];

interface CustomFieldsProps {
 customFields: CustomFieldsData;
 updateCustomFields: (data: Partial<CustomFieldsData>) => void;
 warranties: SelectOption[];
 isExpanded?: boolean;
 onToggle?: () => void;
}

export default function CustomFields({
 customFields,
 updateCustomFields,
 warranties,
 isExpanded = true,
 onToggle,
}: CustomFieldsProps) {
 const warrantyOptions = warranties.length > 0 ? warranties : defaultWarrantyOptions;

 return (
 <div>
 <div className="flex flex-wrap gap-6 mb-6">
 <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
  <input
  type="checkbox"
  checked={customFields.warrantiesChecked}
  onChange={(e) => updateCustomFields({ warrantiesChecked: e.target.checked })}
  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  Warranty
 </label>
 <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
  <input
  type="checkbox"
  checked={customFields.manufacturerChecked}
  onChange={(e) => updateCustomFields({ manufacturerChecked: e.target.checked })}
  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  Manufacturer
 </label>
 <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
  <input
  type="checkbox"
  checked={customFields.expiryChecked}
  onChange={(e) => updateCustomFields({ expiryChecked: e.target.checked })}
  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  Expiry date
 </label>
 </div>

 <div className="grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-4 gap-6">
 <div>
  <label className={labelClass}>WARRANTY</label>
  <SearchableSelect
  value={customFields.warranty}
  onChange={(value) => updateCustomFields({ warranty: value })}
  options={warrantyOptions}
  placeholder="Select warranty"
  icon={<Shield className="h-5 w-5 text-gray-400" />}
  />
 </div>
 <div>
  <label className={labelClass}>MANUFACTURER</label>
  <SearchableSelect
  value={customFields.manufacturer}
  onChange={(value) => updateCustomFields({ manufacturer: value })}
  options={manufacturerOptions}
  placeholder="Select manufacturer"
  icon={<Factory className="h-5 w-5 text-gray-400" />}
  />
 </div>
 <div>
  <label className={labelClass}>MANUFACTURED DATE</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Calendar className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="date"
  value={customFields.manufacturedDate}
  onChange={(e) => updateCustomFields({ manufacturedDate: e.target.value })}
  className={inputClass}
  />
  </div>
 </div>
 <div>
  <label className={labelClass}>EXPIRY DATE</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Calendar className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="date"
  value={customFields.expiryDate}
  onChange={(e) => updateCustomFields({ expiryDate: e.target.value })}
  className={inputClass}
  />
  </div>
 </div>
 </div>
 </div>
 );
}

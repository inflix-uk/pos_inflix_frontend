"use client";

import React from "react";
import { Calendar, Truck, Hash, FileText, DollarSign, ChevronDown, ArrowRight, RotateCcw, UserPlus } from "lucide-react";
import { ParcelData, Currency } from "../types";
import { SearchableSelect } from "./SearchableSelect";
import { HelpTip } from "@/components/HelpTip";

interface AccountOption {
 _id: string;
 name: string;
 subtitle?: string;
 searchText?: string;
}

interface ParcelFormProps {
 data: ParcelData;
 currencies: Currency[];
 accountOptions: AccountOption[];
 onChange: (field: keyof ParcelData, value: string) => void;
 onSubmit: () => boolean;
 onReset: () => void;
 variant?: "card" | "inline";
 readOnly?: boolean;
 /** Open modal to create a new customer or supplier (parcel / add flow). */
 onAddAccount?: () => void;
 addAccountDisabled?: boolean;
}

export const ParcelForm: React.FC<ParcelFormProps> = ({
 data,
 currencies,
 accountOptions,
 onChange,
 onSubmit,
 onReset,
 variant = "card",
 readOnly = false,
 onAddAccount,
 addAccountDisabled = false,
}) => {
 const handleSubmit = () => {
 onSubmit();
 };

 const isInline = variant === "inline";
 const inputDisabled = readOnly;
 const wrapperClass = isInline ? "space-y-3" : "max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200";
 const contentClass = isInline ? "space-y-3" : "p-4 space-y-4";
 const gridClass = isInline ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3";
 const labelClass = isInline
 ? "block text-xs font-medium text-gray-600 mb-1"
 : "block text-xs font-medium text-gray-600 mb-1";
 const inputClass = isInline
 ? `block w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${inputDisabled ? "bg-gray-50 cursor-not-allowed opacity-80" : ""}`
 : `block w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${inputDisabled ? "bg-gray-50 cursor-not-allowed" : ""}`;

 return (
 <div className={wrapperClass}>
 {!isInline && (
 <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3">
  <h2 className="text-lg font-medium text-gray-800">Add New Purchase</h2>
  <HelpTip ariaLabel="Purchase details help" className="mt-0.5" align="end">
  Enter date, optional purchase number, currency, and the supplier account this stock came from. Notes are optional.
  </HelpTip>
 </div>
 )}

 <div className={isInline ? contentClass : "p-6 space-y-6"}>
 {/* Inline: Row1 = Date, Parcel#, Currency. Row2 = full-width Account. Row3 = Note. Card: keep original order */}
 {isInline ? (
  <>
  <div className={gridClass}>
  <div>
  <label className={labelClass}>
   Date <span className="text-red-500">*</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
   <Calendar className="h-4 w-4 text-gray-400" />
   </div>
   <input
   type="date"
   value={data.date}
   onChange={(e) => onChange("date", e.target.value)}
   disabled={inputDisabled}
   readOnly={readOnly}
   className={inputClass}
   />
  </div>
  </div>
  <div>
  <label className={labelClass}>
   Purchase number
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
   <Hash className="h-4 w-4 text-gray-400" />
   </div>
   <input
   type="text"
   value={data.parcelNumber}
   onChange={(e) => onChange("parcelNumber", e.target.value)}
   placeholder="Enter purchase number"
   disabled={inputDisabled}
   readOnly={readOnly}
   className={inputClass}
   />
  </div>
  </div>
  <div>
  <label className={labelClass}>
   Currency <span className="text-red-500">*</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
   <DollarSign className="h-4 w-4 text-gray-400" />
   </div>
   <select
   value={data.currency}
   onChange={(e) => onChange("currency", e.target.value)}
   disabled={inputDisabled}
   className={`${inputClass} appearance-none bg-white pr-10`}
   >
   {currencies.map((currency) => (
   <option key={currency.code} value={currency.code}>
   {currency.code} ({currency.symbol}) - {currency.name}
   </option>
   ))}
   </select>
   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
   <ChevronDown className="h-4 w-4 text-gray-400" />
   </div>
  </div>
  </div>
  </div>
  <div>
  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
  <label className={labelClass} style={{ marginBottom: 0 }}>
   Account (supplier / customer) <span className="text-red-500">*</span>
  </label>
  {!inputDisabled && onAddAccount && (
   <button
   type="button"
   onClick={onAddAccount}
   disabled={addAccountDisabled}
   className="inline-flex items-center gap-1 shrink-0 px-2 py-1 text-[11px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   <UserPlus className="h-3 w-3" aria-hidden />
   New
   </button>
  )}
  </div>
  <SearchableSelect
  options={accountOptions}
  value={data.account}
  onChange={(val) => onChange("account", val)}
  placeholder="Search by name, email, phone…"
  icon={<Truck className="h-4 w-4 text-gray-400" />}
  disabled={inputDisabled}
  />
  </div>
  <div>
  <label className={labelClass}>Note</label>
  <div className="relative">
  <div className="absolute left-0 pl-2.5 flex items-start pointer-events-none top-2.5">
   <FileText className="h-4 w-4 text-gray-400" />
  </div>
  <textarea
   value={data.note}
   onChange={(e) => onChange("note", e.target.value)}
   placeholder="Additional notes…"
   rows={2}
   disabled={inputDisabled}
   readOnly={readOnly}
   className={`${inputClass} resize-none min-h-[60px]`}
  />
  </div>
  </div>
  </>
 ) : (
 <>
 <div className={isInline ? gridClass : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
  <div>
  <label className={labelClass}>
  DATE <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Calendar className="h-5 w-5 text-gray-400" />
  </div>
  <input
  type="date"
  value={data.date}
  onChange={(e) => onChange("date", e.target.value)}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
  />
  </div>
  </div>

  <div>
  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
  <label className={`${labelClass} mb-0`}>
  ACCOUNT (SUPPLIER / CUSTOMER) <span className="text-red-500">*</span>
  </label>
  {!readOnly && onAddAccount && (
  <button
   type="button"
   onClick={onAddAccount}
   disabled={addAccountDisabled}
   className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 border border-orange-200 text-orange-900 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
  >
   <UserPlus className="h-3.5 w-3.5" aria-hidden />
   New customer / supplier
  </button>
  )}
  </div>
  <SearchableSelect
  options={accountOptions}
  value={data.account}
  onChange={(val) => onChange("account", val)}
  placeholder="Search by name, email, phone, contact name..."
  icon={<Truck className="h-5 w-5 text-gray-400" />}
  />
  </div>

  {!isInline && (
  <>
  <div>
  <label className={labelClass}>PURCHASE NUMBER</label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Hash className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="text"
   value={data.parcelNumber}
   onChange={(e) => onChange("parcelNumber", e.target.value)}
   placeholder="Enter purchase number"
   className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
   />
  </div>
  </div>
  <div>
  <label className={labelClass}>
   CURRENCY <span className="text-red-500">*</span>
  </label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <DollarSign className="h-5 w-5 text-gray-400" />
   </div>
   <select
   value={data.currency}
   onChange={(e) => onChange("currency", e.target.value)}
   className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 appearance-none bg-white"
   >
   {currencies.map((currency) => (
   <option key={currency.code} value={currency.code}>
   {currency.code} ({currency.symbol}) - {currency.name}
   </option>
   ))}
   </select>
   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
   <ChevronDown className="h-5 w-5 text-gray-400" />
   </div>
  </div>
  </div>
  </>
  )}

 </div>

 {!isInline && (
  <div>
  <label className={labelClass}>NOTE</label>
  <div className="relative">
  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
  <FileText className="h-5 w-5 text-gray-400" />
  </div>
  <textarea
  value={data.note}
  onChange={(e) => onChange("note", e.target.value)}
  placeholder="Enter additional notes..."
  rows={3}
  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 resize-none"
  />
  </div>
  </div>
 )}
 </>
 )}
 </div>

 {/* Action Buttons */}
 {!isInline && (
 <div className="p-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
 <button
  type="button"
  onClick={onReset}
  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
 >
  <RotateCcw className="w-4 h-4 mr-2" />
  Reset
 </button>
 <button
  onClick={handleSubmit}
  disabled={!data.account}
  className="inline-flex items-center px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
  Add New Purchase
  <ArrowRight className="w-4 h-4 ml-2" />
 </button>
 </div>
 )}
 </div>
 );
};

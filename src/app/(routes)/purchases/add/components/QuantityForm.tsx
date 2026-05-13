"use client";

import React, { useRef, useLayoutEffect } from "react";
import { Calendar, Smartphone, Package, FileText, ArrowRight, RotateCcw } from "lucide-react";
import { QuantityData } from "../types";
import { HelpTip } from "@/components/HelpTip";

/** Hide number spinners; wheel is blocked via non-passive listener (see below). */
const noSpinnerNumberClass =
 " [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function preventWheelChangingNumber(e: Event) {
 e.preventDefault();
}

interface QuantityFormProps {
 data: QuantityData;
 onChange: (field: keyof QuantityData, value: string) => void;
 onSubmit: () => void;
 onReset: () => void;
 variant?: "card" | "inline";
 readOnly?: boolean;
 /** Shown on the same row as quantity fields (e.g. Save) — inline layout only */
 inlineEnd?: React.ReactNode;
}

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const inputClassInline =
 "block w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400";
const inputClass = "block w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800";

export const QuantityForm: React.FC<QuantityFormProps> = ({
 data,
 onChange,
 onSubmit,
 onReset,
 variant = "card",
 readOnly = false,
 inlineEnd,
}) => {
 const isInline = variant === "inline";
 const inputDisabled = readOnly;
 const gridClass = isInline
 ? "grid grid-cols-3 gap-3 items-end"
 : "grid grid-cols-2 gap-3";
 const quantityFormRootRef = useRef<HTMLDivElement>(null);

 useLayoutEffect(() => {
 const root = quantityFormRootRef.current;
 if (!root) return;
 const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="number"]'));
 for (const el of inputs) {
 el.addEventListener("wheel", preventWheelChangingNumber, { passive: false });
 }
 return () => {
 for (const el of inputs) {
 el.removeEventListener("wheel", preventWheelChangingNumber);
 }
 };
 }, [isInline, readOnly]);

 return (
 <div
 ref={quantityFormRootRef}
 className={isInline ? "space-y-0" : "max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200"}
 >
 {!isInline && (
 <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3">
  <h2 className="text-lg font-medium text-gray-800">Quantity Details</h2>
  <HelpTip ariaLabel="Quantity details help" className="mt-0.5" align="end">
  Enter how many serial-tracked units and how many non-serial lines you expect on this purchase. You can still add more when entering items.
  </HelpTip>
 </div>
 )}

 <div className={isInline ? "space-y-0" : "p-6 space-y-6"}>
 <div className={gridClass}>
  {!isInline && (
  <>
  <div>
  <label className={labelClass}>DATE</label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Calendar className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="date"
   value={data.date}
   onChange={(e) => onChange("date", e.target.value)}
   className={inputClass}
   />
  </div>
  </div>
  <div>
  <label className={labelClass}>NOTE</label>
  <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <FileText className="h-5 w-5 text-gray-400" />
   </div>
   <input
   type="text"
   value={data.note}
   onChange={(e) => onChange("note", e.target.value)}
   placeholder="Enter additional notes..."
   className={inputClass}
   />
  </div>
  </div>
  </>
  )}
  <div>
  <div className="flex flex-wrap items-center gap-1 mb-1">
  <label className="text-xs font-medium text-gray-600">
  Serial items <span className="text-red-500">*</span>
  </label>
  <HelpTip
  ariaLabel="Serial items quantity"
  contentClassName="border-gray-200 bg-white text-gray-900"
  iconClassName="h-3 w-3 text-gray-400"
  >
  Phones, tablets, and other units with a unique serial or IMEI per device.
  </HelpTip>
  </div>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
  <Smartphone className="h-4 w-4 text-gray-400" />
  </div>
  <input
  type="number"
  value={data.imeiQuantity}
  onChange={(e) => onChange("imeiQuantity", e.target.value)}
  placeholder="Expected serial / IMEI count"
  min="0"
  step="1"
  inputMode="numeric"
  disabled={inputDisabled}
  className={`${isInline ? inputClassInline : inputClass}${noSpinnerNumberClass} ${inputDisabled ? "bg-gray-50 cursor-not-allowed opacity-80" : ""}`}
  />
  </div>
  </div>

  <div>
  <div className="flex flex-wrap items-center gap-1 mb-1">
  <label className="text-xs font-medium text-gray-600">
  Non serial items <span className="text-red-500">*</span>
  </label>
  <HelpTip
  ariaLabel="Non-serial items quantity"
  contentClassName="border-gray-200 bg-white text-gray-900"
  iconClassName="h-3 w-3 text-gray-400"
  >
  Accessories, bulk SKU lines, or anything sold by quantity without a per-unit serial.
  </HelpTip>
  </div>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
  <Package className="h-4 w-4 text-gray-400" />
  </div>
  <input
  type="number"
  value={data.otherQuantity}
  onChange={(e) => onChange("otherQuantity", e.target.value)}
  placeholder="Qty-only lines expected"
  min="0"
  step="1"
  inputMode="numeric"
  disabled={inputDisabled}
  className={`${isInline ? inputClassInline : inputClass}${noSpinnerNumberClass} ${inputDisabled ? "bg-gray-50 cursor-not-allowed opacity-80" : ""}`}
  />
  </div>
  </div>

  {isInline && inlineEnd != null && (
  <div className="flex flex-col justify-end">
  <div className="flex w-full items-stretch">{inlineEnd}</div>
  </div>
  )}
 </div>
 </div>

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
  onClick={onSubmit}
  className="inline-flex items-center px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
  >
  Continue To Item Entry
  <ArrowRight className="w-4 h-4 ml-2" />
  </button>
 </div>
 )}
 </div>
 );
};

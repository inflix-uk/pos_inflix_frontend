"use client";

import React, { useCallback, useState } from "react";
import { Send, Receipt, Tag, Hash, RotateCcw, Barcode, Truck, Calendar, FileText, StickyNote } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { CreatableSearchableSelect } from "./CreatableSearchableSelect";
import type { SerialSingleFormData, NonSerialSingleFormData, SingleProductParcelData, CategoryVariantAttribute } from "../types";
import { parseMultiIMEIs } from "@/lib/parseMultiIMEIs";

interface SingleProductFormProps {
 mode: "serial" | "non-serial";
 parcelData: SingleProductParcelData;
 onParcelChange: (data: Partial<SingleProductParcelData>) => void;
 suppliers: { _id: string; name: string }[];
 serialData: SerialSingleFormData;
 nonSerialData: NonSerialSingleFormData;
 onSerialChange: (data: Partial<SerialSingleFormData>) => void;
 onNonSerialChange: (data: Partial<NonSerialSingleFormData>) => void;
 sendToOptions: { _id: string; name: string }[];
 taxCategories: { _id: string; name: string; rate: number; type: string }[];
 types: { _id: string; name: string }[];
 categoryVariantAttributes: CategoryVariantAttribute[];
 getVariantOptionsForAttributeIndex: (variantValues: Record<string, string>, attributeIndex: number) => { _id: string; name: string }[];
 /** When provided, variant attribute dropdowns show "+ Add" to create new values (like add parcel). */
 onAddValueAtPath?: (categoryId: string, firstAttributeId: string, parentPath: string[], name: string) => Promise<string | null>;
 /** When false, variant dropdowns are select-only (existing values in the system). */
 allowCreateVariantValues?: boolean;
 currentImeiCount: number;
 /** Category dropdown still fetching (user picked type before prefetch finished). */
 isCategoryTypesLoading?: boolean;
 currencySymbol?: string;
 onSubmit: () => void;
 onReset: () => void;
 onBack: () => void;
 isSubmitting: boolean;
}

function toSelectOptions(list: { _id: string; name: string }[]) {
 return list.map((o) => ({ value: String(o._id), label: o.name || "" }));
}

function taxOptions(taxCategories: { _id: string; name: string; rate: number; type: string }[]) {
 return taxCategories.map((t) => ({
 value: String(t._id),
 label: t.type === "percentage" ? `${t.name} (${t.rate}%)` : `${t.name} (£${t.rate} Flat)`,
 }));
}

const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1";
const inputCls = "block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800";
const inputNoPadCls = "block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800";

export function SingleProductForm({
 mode,
 parcelData,
 onParcelChange,
 suppliers,
 serialData,
 nonSerialData,
 onSerialChange,
 onNonSerialChange,
 sendToOptions,
 taxCategories,
 types,
 categoryVariantAttributes,
 getVariantOptionsForAttributeIndex,
 onAddValueAtPath,
 allowCreateVariantValues = false,
 currentImeiCount,
 isCategoryTypesLoading = false,
 currencySymbol = "£",
 onSubmit,
 onReset,
 onBack,
 isSubmitting,
}: SingleProductFormProps) {
 const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

 const handleImeiChange = useCallback(
 (value: string) => {
 onSerialChange({ multiIMEIs: value });
 if (duplicateAlert) setDuplicateAlert(null);
 },
 [onSerialChange, duplicateAlert]
 );

 const handleImeiKeyDown = useCallback(
 (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key !== "Enter") return;

 const value = e.currentTarget.value;
 const cursorPos = e.currentTarget.selectionStart;
 const textBeforeCursor = value.substring(0, cursorPos);
 const lastNewline = textBeforeCursor.lastIndexOf("\n");
 const currentLine = textBeforeCursor.substring(lastNewline + 1).trim();
 if (!currentLine) return;

 const currentLineTokens = parseMultiIMEIs(currentLine);
 if (currentLineTokens.length === 0) return;

 const linesAbove = parseMultiIMEIs(
  textBeforeCursor.substring(0, lastNewline >= 0 ? lastNewline : 0)
 );
 const aboveU = new Set(linesAbove.map((x) => x.toUpperCase()));
 const dup = currentLineTokens.find((t) => aboveU.has(t.toUpperCase()));
 if (dup) {
  e.preventDefault();
  setDuplicateAlert(`"${dup}" is already in this list!`);
  const before = value.substring(0, lastNewline >= 0 ? lastNewline + 1 : 0);
  const after = value.substring(cursorPos);
  const cleaned = (before + after).replace(/\n{2,}/g, "\n").replace(/^\n|\n$/g, "");
  onSerialChange({ multiIMEIs: cleaned });
  return;
 }

 setDuplicateAlert(null);
 },
 [onSerialChange]
 );

 return (
 <div className="p-4 space-y-4">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <button
  type="button"
  onClick={onBack}
  className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
 >
  ← Change type
 </button>
 </div>

 {/* Parcel / Supplier section */}
 <div className="pb-3 border-b border-gray-200">
 <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Purchase & supplier</h3>
 <div className="grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-12 gap-3">
  <div className="@[1024px]:col-span-4">
  <label className={labelCls}>Supplier <span className="text-red-500">*</span></label>
  <SearchableSelect
  options={toSelectOptions(suppliers)}
  value={parcelData.supplier}
  onChange={(v) => onParcelChange({ supplier: v })}
  placeholder="Select supplier"
  icon={<Truck className="h-4 w-4 text-gray-400" />}
  />
  </div>
  <div className="@[1024px]:col-span-3">
  <label className={labelCls}>Purchase number</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <FileText className="h-4 w-4 text-gray-400" />
  </div>
  <input
  type="text"
  value={parcelData.parcelNumber}
  onChange={(e) => onParcelChange({ parcelNumber: e.target.value })}
  placeholder="e.g. SINGLE-001"
  className={inputCls}
  />
  </div>
  </div>
  <div className="@[1024px]:col-span-3">
  <label className={labelCls}>Date</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Calendar className="h-4 w-4 text-gray-400" />
  </div>
  <input
  type="date"
  value={parcelData.date}
  onChange={(e) => onParcelChange({ date: e.target.value })}
  className={inputCls}
  />
  </div>
  </div>
  <div className="@[1024px]:col-span-2">
  <label className={labelCls}>Currency</label>
  <select
  value={parcelData.currency}
  onChange={(e) => onParcelChange({ currency: e.target.value })}
  className={`${inputNoPadCls} bg-white`}
  >
  <option value="GBP">GBP (£)</option>
  <option value="USD">USD ($)</option>
  <option value="EUR">EUR (€)</option>
  </select>
  </div>
 </div>
 </div>

 {mode === "serial" && (
 <>
  <div className="grid grid-cols-1 @[768px]:grid-cols-3 gap-3">
  <div>
  <label className={labelCls}>Send to</label>
  <SearchableSelect
  options={toSelectOptions(sendToOptions)}
  value={serialData.sendTo}
  onChange={(v) => onSerialChange({ sendTo: v })}
  placeholder="Select Location"
  icon={<Send className="h-4 w-4 text-gray-400" />}
  />
  </div>
  <div>
  <label className={labelCls}>Tax</label>
  <SearchableSelect
  options={taxOptions(taxCategories)}
  value={serialData.taxCategory}
  onChange={(v) => onSerialChange({ taxCategory: v })}
  placeholder="Select Tax"
  icon={<Receipt className="h-4 w-4 text-gray-400" />}
  />
  </div>
  <div>
  <label className={labelCls}>Category</label>
  <SearchableSelect
  options={toSelectOptions(types)}
  value={serialData.type}
  onChange={(v) => onSerialChange({ type: v, variantValues: {} })}
  placeholder={isCategoryTypesLoading ? "Loading categories…" : "Select Category"}
  disabled={isCategoryTypesLoading}
  icon={<Tag className="h-4 w-4 text-gray-400" />}
  />
  </div>
  </div>

  {categoryVariantAttributes.length > 0 && (
  <div className="space-y-2">
  <p className="text-[11px] text-gray-400">
  Select in order; each dropdown shows options under the previous selection.
  {allowCreateVariantValues
   ? ' Type and click "+ Add" to create new values.'
   : " Choose from existing values only."}
  </p>
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-3 gap-3">
  {categoryVariantAttributes.map((attr, attributeIndex) => {
   const valueOptions = getVariantOptionsForAttributeIndex(serialData.variantValues, attributeIndex);
   const selectedValueId = serialData.variantValues[attr._id] ?? "";
   const parentSelected =
   attributeIndex === 0 ||
   categoryVariantAttributes.slice(0, attributeIndex).every((a) => serialData.variantValues[a._id]);
   const firstAttrId = categoryVariantAttributes[0]?._id;
   const parentPath = categoryVariantAttributes
   .slice(0, attributeIndex)
   .map((a) => serialData.variantValues[a._id])
   .filter(Boolean);
   const canAdd =
    allowCreateVariantValues && !!serialData.type && parentSelected && firstAttrId && onAddValueAtPath;
   const onCreateNew = canAdd
   ? (name: string) => onAddValueAtPath!(serialData.type, firstAttrId, parentPath, name)
   : undefined;
   return (
   <div key={attr._id}>
   <label className={labelCls}>{attr.name}</label>
   {onCreateNew ? (
   <CreatableSearchableSelect
    options={valueOptions}
    value={selectedValueId}
    onChange={(id) =>
    onSerialChange({
    variantValues: { ...serialData.variantValues, [attr._id]: id },
    })
    }
    placeholder={parentSelected ? `Select or add ${attr.name}` : "Select previous first"}
    disabled={!parentSelected}
    onCreateNew={onCreateNew}
   />
   ) : (
   <SearchableSelect
    options={valueOptions.map((o) => ({ value: o._id, label: o.name }))}
    value={selectedValueId}
    onChange={(id) =>
    onSerialChange({
    variantValues: { ...serialData.variantValues, [attr._id]: id },
    })
    }
    placeholder={parentSelected ? `Select ${attr.name}` : "Select previous first"}
    disabled={!parentSelected}
   />
   )}
   </div>
   );
  })}
  </div>
  </div>
  )}

  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-3">
  <div>
  <label className={labelCls}>Purchase price <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 text-sm font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={serialData.purchasePrice}
   onChange={(e) => onSerialChange({ purchasePrice: e.target.value })}
   className={inputCls}
   min="0"
   step="0.01"
   required
  />
  </div>
  </div>
  <div>
  <label className={labelCls}>Sale price <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 text-sm font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={serialData.salePrice}
   onChange={(e) => onSerialChange({ salePrice: e.target.value })}
   className={inputCls}
   min="0"
   step="0.01"
   required
  />
  </div>
  </div>
  </div>

  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-3">
  {/* Left – IMEIs */}
  <div>
  <label className={labelCls}>IMEIs / Serial numbers</label>
  {duplicateAlert && (
  <div className="mb-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded flex items-center gap-1.5">
   <span className="text-red-500 font-bold text-xs">!</span>
   <span className="text-xs text-red-700">{duplicateAlert}</span>
  </div>
  )}
  <div className="relative">
  <div className="absolute top-2 left-0 pl-3 flex items-start pointer-events-none">
   <Hash className="h-4 w-4 text-gray-400" />
  </div>
  <textarea
   value={serialData.multiIMEIs}
   onChange={(e) => handleImeiChange(e.target.value)}
   onKeyDown={handleImeiKeyDown}
   placeholder="Scan or paste serials / IMEIs — one per line, comma, or space separated"
   rows={10}
   className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800 resize-none font-mono"
  />
  </div>
  <p className="text-[11px] text-gray-400 mt-1">Scan as many as you like — each scan adds a new line. Duplicates are blocked automatically. Only this field clears after adding.</p>
  </div>

  {/* Right – Note */}
  <div>
  <label className={labelCls}>
  <span className="inline-flex items-center gap-1">
   <StickyNote className="h-3.5 w-3.5 text-gray-400" aria-hidden />
   Note
  </span>
  </label>
  <textarea
  value={parcelData.note}
  onChange={(e) => onParcelChange({ note: e.target.value.slice(0, 2000) })}
  rows={4}
  maxLength={2000}
  placeholder="e.g. Customer trade-in, warranty seal intact…"
  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800 placeholder-gray-400 resize-none"
  />
  <p className="text-[11px] text-gray-400 mt-1">Saved with every product created in this session.</p>
  </div>
  </div>

  <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
  <span className="text-xs font-semibold text-orange-800">Total IMEI Count</span>
  <span className="text-lg font-bold text-orange-600">
  {currentImeiCount}
  </span>
  </div>
 </>
 )}

 {mode === "non-serial" && (
 <>
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-3">
  <div>
  <label className={labelCls}>
  Name {categoryVariantAttributes.length > 0 ? <span className="text-gray-400 font-normal normal-case tracking-normal">(optional when attributes selected)</span> : null}
  </label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Tag className="h-4 w-4 text-gray-400" />
  </div>
  <input
   type="text"
   value={nonSerialData.name}
   onChange={(e) => onNonSerialChange({ name: e.target.value })}
   placeholder={categoryVariantAttributes.length > 0 ? "Product name (optional)" : "Product name"}
   className={inputCls}
  />
  </div>
  </div>
  <div>
  <label className={labelCls}>Barcode</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Barcode className="h-4 w-4 text-gray-400" />
  </div>
  <input
   type="text"
   value={nonSerialData.barcode}
   onChange={(e) => onNonSerialChange({ barcode: e.target.value })}
   placeholder="Barcode / SKU (optional)"
   className={inputCls}
  />
  </div>
  </div>
  </div>

  <div className="grid grid-cols-1 @[768px]:grid-cols-3 gap-3">
  <div>
  <label className={labelCls}>Send to</label>
  <SearchableSelect
  options={toSelectOptions(sendToOptions)}
  value={nonSerialData.sendTo}
  onChange={(v) => onNonSerialChange({ sendTo: v })}
  placeholder="Select Location"
  icon={<Send className="h-4 w-4 text-gray-400" />}
  />
  </div>
  <div>
  <label className={labelCls}>Tax</label>
  <SearchableSelect
  options={taxOptions(taxCategories)}
  value={nonSerialData.taxCategory}
  onChange={(v) => onNonSerialChange({ taxCategory: v })}
  placeholder="Select Tax"
  icon={<Receipt className="h-4 w-4 text-gray-400" />}
  />
  </div>
  <div>
  <label className={labelCls}>Category</label>
  <SearchableSelect
  options={toSelectOptions(types)}
  value={nonSerialData.type}
  onChange={(v) => onNonSerialChange({ type: v, variantValues: {} })}
  placeholder={isCategoryTypesLoading ? "Loading categories…" : "Select Category"}
  disabled={isCategoryTypesLoading}
  icon={<Tag className="h-4 w-4 text-gray-400" />}
  />
  </div>
  </div>

  {categoryVariantAttributes.length > 0 && (
  <div className="space-y-2">
  <p className="text-[11px] text-gray-400">
  Select in order; each dropdown shows options under the previous selection.
  {allowCreateVariantValues
   ? ' Type and click "+ Add" to create new values.'
   : " Choose from existing values only."}
  </p>
  <div className="grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-3 gap-3">
  {categoryVariantAttributes.map((attr, attributeIndex) => {
   const valueOptions = getVariantOptionsForAttributeIndex(nonSerialData.variantValues, attributeIndex);
   const selectedValueId = nonSerialData.variantValues[attr._id] ?? "";
   const parentSelected =
   attributeIndex === 0 ||
   categoryVariantAttributes.slice(0, attributeIndex).every((a) => nonSerialData.variantValues[a._id]);
   const firstAttrId = categoryVariantAttributes[0]?._id;
   const parentPath = categoryVariantAttributes
   .slice(0, attributeIndex)
   .map((a) => nonSerialData.variantValues[a._id])
   .filter(Boolean);
   const canAdd =
    allowCreateVariantValues && !!nonSerialData.type && parentSelected && firstAttrId && onAddValueAtPath;
   const onCreateNew = canAdd
   ? (name: string) => onAddValueAtPath!(nonSerialData.type, firstAttrId, parentPath, name)
   : undefined;
   return (
   <div key={attr._id}>
   <label className={labelCls}>{attr.name}</label>
   {onCreateNew ? (
   <CreatableSearchableSelect
    options={valueOptions}
    value={selectedValueId}
    onChange={(id) =>
    onNonSerialChange({
    variantValues: { ...nonSerialData.variantValues, [attr._id]: id },
    })
    }
    placeholder={parentSelected ? `Select or add ${attr.name}` : "Select previous first"}
    disabled={!parentSelected}
    onCreateNew={onCreateNew}
   />
   ) : (
   <SearchableSelect
    options={valueOptions.map((o) => ({ value: o._id, label: o.name }))}
    value={selectedValueId}
    onChange={(id) =>
    onNonSerialChange({
    variantValues: { ...nonSerialData.variantValues, [attr._id]: id },
    })
    }
    placeholder={parentSelected ? `Select ${attr.name}` : "Select previous first"}
    disabled={!parentSelected}
   />
   )}
   </div>
   );
  })}
  </div>
  </div>
  )}

  <div className="grid grid-cols-1 @[768px]:grid-cols-3 gap-3">
  <div>
  <label className={labelCls}>Purchase price <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 text-sm font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={nonSerialData.purchasePrice}
   onChange={(e) => onNonSerialChange({ purchasePrice: e.target.value })}
   className={inputCls}
   min="0"
   step="0.01"
   required
  />
  </div>
  </div>
  <div>
  <label className={labelCls}>Sale price <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 text-sm font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={nonSerialData.salePrice}
   onChange={(e) => onNonSerialChange({ salePrice: e.target.value })}
   className={inputCls}
   min="0"
   step="0.01"
   required
  />
  </div>
  </div>
  <div>
  <label className={labelCls}>Qty</label>
  <input
  type="number"
  value={nonSerialData.quantity}
  onChange={(e) => onNonSerialChange({ quantity: e.target.value })}
  className={inputNoPadCls}
  min="1"
  step="1"
  />
  </div>
  </div>
 </>
 )}

 <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
 <button
  type="button"
  onClick={onReset}
  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
 >
  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
  Reset
 </button>
 <button
  type="button"
  onClick={onSubmit}
  disabled={isSubmitting}
  className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
  {isSubmitting ? "Adding…" : "Add product to inventory"}
 </button>
 </div>
 </div>
 );
}

"use client";

import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import {
 Send,
 Receipt,
 Tag,
 Smartphone,
 Award,
 HardDrive,
 Palette,
 Hash,
 Save,
 RotateCcw,
 Monitor,
 Plus,
 X,
 ChevronDown,
 ChevronUp,
 Pencil,
 Package,
 Trash2,
 Barcode,
} from "lucide-react";
import { ItemData, ItemEntry, ItemMode, OtherItemData, OtherItemEntry, CategoryVariantAttribute, NonSerialSearchResult, SerialSearchResult } from "../types";
import { SearchableSelect } from "./SearchableSelect";
import { CreatableSearchableSelect } from "./CreatableSearchableSelect";
import { parseMultiIMEIs } from "../utils/parseMultiIMEIs";
import { HelpTip } from "@/components/HelpTip";
import { formatProductNameInput } from "@/lib/formatProductName";

interface NonSerialNameSearchProps {
 value: string;
 onChange: (value: string) => void;
 onSearch: (query: string, limit?: number) => Promise<NonSerialSearchResult[]>;
 onSelect: (product: NonSerialSearchResult) => void;
 placeholder?: string;
}

/** Combobox: user types freely (creates new item) or selects from matching existing non-serial items to prefill. */
const NonSerialNameSearch: React.FC<NonSerialNameSearchProps> = ({ value, onChange, onSearch, onSelect, placeholder }) => {
 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [results, setResults] = useState<NonSerialSearchResult[]>([]);
 const [activeIndex, setActiveIndex] = useState<number>(-1);
 const containerRef = useRef<HTMLDivElement>(null);
 const searchSeqRef = useRef(0);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useLayoutEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
    setOpen(false);
   }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const runSearch = useCallback((q: string) => {
  const trimmed = q.trim();
  if (trimmed.length < 3) {
   setResults([]);
   setLoading(false);
   return;
  }
  const seq = ++searchSeqRef.current;
  setLoading(true);
  onSearch(trimmed, 10)
   .then((data) => {
    if (seq !== searchSeqRef.current) return;
    setResults(data);
    setActiveIndex(data.length > 0 ? 0 : -1);
   })
   .catch(() => {
    if (seq !== searchSeqRef.current) return;
    setResults([]);
   })
   .finally(() => {
    if (seq === searchSeqRef.current) setLoading(false);
   });
 }, [onSearch]);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const next = formatProductNameInput(e.target.value);
  onChange(next);
  setOpen(true);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => runSearch(next), 200);
 };

 const handleSelect = (product: NonSerialSearchResult) => {
  onSelect(product);
  setOpen(false);
  setResults([]);
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (!open || results.length === 0) return;
  if (e.key === "ArrowDown") {
   e.preventDefault();
   setActiveIndex((i) => (i + 1) % results.length);
  } else if (e.key === "ArrowUp") {
   e.preventDefault();
   setActiveIndex((i) => (i - 1 + results.length) % results.length);
  } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < results.length) {
   e.preventDefault();
   handleSelect(results[activeIndex]);
  } else if (e.key === "Escape") {
   setOpen(false);
  }
 };

 const renderSubtitle = (r: NonSerialSearchResult) => {
  const variantPart = (r.variantValues || []).map((v) => v.value).filter(Boolean).join(" / ");
  const parts: string[] = [];
  if (r.categoryName) parts.push(r.categoryName);
  if (variantPart) parts.push(variantPart);
  if (r.barcode) parts.push(`BC: ${r.barcode}`);
  return parts.join(" · ");
 };

 // Build a readable title from whatever the product has — name first, then brand/model,
 // then category, finally the joined variant values. We never want to show "(unnamed)".
 const renderTitle = (r: NonSerialSearchResult): string => {
  if (r.name && r.name.trim()) return r.name.trim();
  const brandModel = [r.brand, r.brandModel].filter((s) => s && String(s).trim()).join(" ");
  if (brandModel) return brandModel;
  if (r.categoryName && r.categoryName.trim()) return r.categoryName.trim();
  if (r.barcode && r.barcode.trim()) return r.barcode.trim();
  const variantPart = (r.variantValues || []).map((v) => v.value).filter(Boolean).join(" / ");
  if (variantPart) return variantPart;
  return "Item";
 };

 return (
  <div ref={containerRef} className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <Tag className="h-4 w-4 text-gray-400" />
   </div>
   <input
    type="text"
    value={value}
    onChange={handleInputChange}
    onFocus={() => {
     if (value.trim()) {
      setOpen(true);
      if (results.length === 0) runSearch(value);
     }
    }}
    onKeyDown={handleKeyDown}
    placeholder={placeholder || "Item name (type 3+ letters to search existing)"}
    className="block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
    autoComplete="off"
   />
   {open && (loading || results.length > 0 || value.trim().length > 0) && (
    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
     {value.trim().length > 0 && value.trim().length < 3 && (
      <div className="px-3 py-2 text-xs text-gray-500">Type at least 3 letters to search…</div>
     )}
     {loading && results.length === 0 && value.trim().length >= 3 && (
      <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
     )}
     {!loading && results.length === 0 && value.trim().length >= 3 && (
      <div className="px-3 py-2 text-xs text-gray-500">No matches — will be saved as new.</div>
     )}
     {results.map((r, idx) => (
      <button
       key={r._id}
       type="button"
       onMouseEnter={() => setActiveIndex(idx)}
       onClick={() => handleSelect(r)}
       className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
        idx === activeIndex ? "bg-blue-50" : "bg-white hover:bg-gray-50"
       }`}
      >
       <div className="font-medium text-gray-800 truncate">{renderTitle(r)}</div>
       {renderSubtitle(r) && (
        <div className="text-[11px] text-gray-500 truncate">{renderSubtitle(r)}</div>
       )}
      </button>
     ))}
    </div>
   )}
  </div>
 );
};

interface SerialNameSearchProps {
 onSearch: (query: string, limit?: number) => Promise<SerialSearchResult[]>;
 onSelect: (product: SerialSearchResult) => void;
 placeholder?: string;
}

/** Typeahead for the IMEI/serial form: pick an existing serial product to auto-fill all classification, attributes, and price fields. */
const SerialNameSearch: React.FC<SerialNameSearchProps> = ({ onSearch, onSelect, placeholder }) => {
 const [value, setValue] = useState("");
 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [results, setResults] = useState<SerialSearchResult[]>([]);
 const [activeIndex, setActiveIndex] = useState<number>(-1);
 const containerRef = useRef<HTMLDivElement>(null);
 const searchSeqRef = useRef(0);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useLayoutEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
    setOpen(false);
   }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const runSearch = useCallback((q: string) => {
  const trimmed = q.trim();
  if (trimmed.length < 3) {
   setResults([]);
   setLoading(false);
   return;
  }
  const seq = ++searchSeqRef.current;
  setLoading(true);
  onSearch(trimmed, 10)
   .then((data) => {
    if (seq !== searchSeqRef.current) return;
    setResults(data);
    setActiveIndex(data.length > 0 ? 0 : -1);
   })
   .catch(() => {
    if (seq !== searchSeqRef.current) return;
    setResults([]);
   })
   .finally(() => {
    if (seq === searchSeqRef.current) setLoading(false);
   });
 }, [onSearch]);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const next = e.target.value;
  setValue(next);
  setOpen(true);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => runSearch(next), 200);
 };

 const renderTitle = (r: SerialSearchResult): string => {
  const brandModel = [r.brand, r.brandModel].filter((s) => s && String(s).trim()).join(" ");
  if (brandModel) return brandModel;
  if (r.categoryName && r.categoryName.trim()) return r.categoryName.trim();
  const variantPart = (r.variantValues || []).map((v) => v.value).filter(Boolean).join(" / ");
  if (variantPart) return variantPart;
  return "Item";
 };

 const handleSelect = (product: SerialSearchResult) => {
  onSelect(product);
  // Show the matched specs on the input so the user sees what was applied, but it's only a hint —
  // changing it later won't unset any fields, since unique key here is config, not name.
  const label = renderTitle(product);
  setValue(label);
  setOpen(false);
  setResults([]);
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (!open || results.length === 0) return;
  if (e.key === "ArrowDown") {
   e.preventDefault();
   setActiveIndex((i) => (i + 1) % results.length);
  } else if (e.key === "ArrowUp") {
   e.preventDefault();
   setActiveIndex((i) => (i - 1 + results.length) % results.length);
  } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < results.length) {
   e.preventDefault();
   handleSelect(results[activeIndex]);
  } else if (e.key === "Escape") {
   setOpen(false);
  }
 };

 const renderSubtitle = (r: SerialSearchResult) => {
  const variantPart = (r.variantValues || []).map((v) => v.value).filter(Boolean).join(" / ");
  const parts: string[] = [];
  if (r.categoryName) parts.push(r.categoryName);
  if (variantPart) parts.push(variantPart);
  if (r.capacity) parts.push(String(r.capacity));
  if (r.colour) parts.push(String(r.colour));
  if (r.grade) parts.push(String(r.grade));
  return parts.filter(Boolean).join(" · ");
 };

 return (
  <div ref={containerRef} className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <Tag className="h-4 w-4 text-gray-400" />
   </div>
   <input
    type="text"
    value={value}
    onChange={handleInputChange}
    onFocus={() => {
     if (value.trim()) {
      setOpen(true);
      if (results.length === 0) runSearch(value);
     }
    }}
    onKeyDown={handleKeyDown}
    placeholder={placeholder || "Search by brand, model, category… (3+ letters) — auto-fills below"}
    className="block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
    autoComplete="off"
   />
   {open && (loading || results.length > 0 || value.trim().length > 0) && (
    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
     {value.trim().length > 0 && value.trim().length < 3 && (
      <div className="px-3 py-2 text-xs text-gray-500">Type at least 3 letters to search…</div>
     )}
     {loading && results.length === 0 && value.trim().length >= 3 && (
      <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
     )}
     {!loading && results.length === 0 && value.trim().length >= 3 && (
      <div className="px-3 py-2 text-xs text-gray-500">No matches — fill the fields manually below.</div>
     )}
     {results.map((r, idx) => (
      <button
       key={`${r.lastPurchaseId || ""}-${idx}`}
       type="button"
       onMouseEnter={() => setActiveIndex(idx)}
       onClick={() => handleSelect(r)}
       className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
        idx === activeIndex ? "bg-blue-50" : "bg-white hover:bg-gray-50"
       }`}
      >
       <div className="font-medium text-gray-800 truncate">{renderTitle(r)}</div>
       {renderSubtitle(r) && (
        <div className="text-[11px] text-gray-500 truncate">{renderSubtitle(r)}</div>
       )}
      </button>
     ))}
    </div>
   )}
  </div>
 );
};

/** Hide browser number spinners; keep type="number" for mobile keyboards. */
const priceInputClassName =
 "block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

/** Browsers change focused <input type="number"> on wheel; React onWheel is often passive — use capture + non-passive. */
function preventWheelChangingNumber(e: Event) {
 e.preventDefault();
}

interface ItemFormProps {
 data: ItemData;
 currencySymbol: string;
 totalIMEIs: number;
 imeiQuantity: number;
 savedItems: ItemEntry[];
 /** @deprecated Optional; kept for older callers. Serial totals no longer cap at expected qty. */
 allSavedIMEICount?: number;
 sendToOptions: { _id: string; name: string }[];
 taxCategories: { _id: string; name: string; rate: number; type: string }[];
 types: { _id: string; name: string }[];
 /** Categories for Non Serial Numbers tab (defaults to types if not provided) */
 typesForNonSerial?: { _id: string; name: string }[];
 /** Loading/error state for the shipment & classification options (sendTo, tax, categories). */
 optionsLoading?: boolean;
 optionsError?: { sendTo: boolean; tax: boolean; categories: boolean };
 onRetryOptions?: () => void;
 makes: { _id: string; name: string }[];
 grades: { _id: string; name: string }[];
 brands: { _id: string; name: string }[];
 brandModels: { _id: string; name: string }[];
 capacities: { _id: string; name: string }[];
 colours: { _id: string; name: string }[];
 showGradeImei?: boolean;
 showBrandImei?: boolean;
 showStorageImei?: boolean;
 showColorImei?: boolean;
 showGradeOther?: boolean;
 showBrandOther?: boolean;
 showStorageOther?: boolean;
 showColorOther?: boolean;
 onChange: (field: keyof ItemData, value: string) => void;
 onSubmit: () => void;
 onReset: () => void;
 onAddItem: () => void;
 /** When false, Add Item (IMEI) is disabled until all variant attributes are filled */
 canAddSerialItem?: boolean;
 onRemoveItem: (id: string) => void;
 onEditItem: (id: string) => void;
 /** Id of the saved IMEI entry currently loaded in the form for editing (highlighted, up-arrow toggle). */
 editingItemId?: string | null;
 /** Called when the user clicks the up-arrow on the row currently being edited. */
 onCancelEdit?: () => void;
 // Other items props
 mode: ItemMode;
 onModeChange: (mode: ItemMode) => void;
 otherItemData: OtherItemData;
 otherQuantityLimit: number;
 savedOtherItems: OtherItemEntry[];
 savedOtherQuantity: number;
 totalOtherQuantity: number;
 onOtherItemChange: (field: keyof OtherItemData, value: string) => void;
 onAddOtherItem: () => void;
 onRemoveOtherItem: (id: string) => void;
 onEditOtherItem: (id: string) => void;
 /** Id of the saved non-serial entry currently loaded in the form for editing. */
 editingOtherItemId?: string | null;
 /** Called when the user clicks the up-arrow on the non-serial row currently being edited. */
 onCancelOtherEdit?: () => void;
 /** Typeahead search for existing non-serial items. */
 onSearchNonSerialProducts?: (query: string, limit?: number) => Promise<NonSerialSearchResult[]>;
 /** Prefill the non-serial form from a selected existing item. */
 onSelectNonSerialProduct?: (product: NonSerialSearchResult) => void;
 /** Typeahead search for existing serial/IMEI items. */
 onSearchSerialProducts?: (query: string, limit?: number) => Promise<SerialSearchResult[]>;
 /** Prefill the IMEI/serial form from a selected existing item. */
 onSelectSerialProduct?: (product: SerialSearchResult) => void;
 variant?: "card" | "inline";
 /** When false, variant dropdowns are select-only (no "+ Add" for brand/model/etc.). */
 allowCreateVariantValues?: boolean;
 onAddBrand?: (name: string) => Promise<string | null>;
 onAddModel?: (brandId: string, modelName: string) => Promise<string | null>;
 onAddCapacity?: (name: string) => Promise<string | null>;
 onAddColour?: (name: string) => Promise<string | null>;
 onAddGrade?: (name: string) => Promise<string | null>;
 categoryVariantAttributesImei?: CategoryVariantAttribute[];
 categoryVariantAttributesOther?: CategoryVariantAttribute[];
 onVariantChange?: (attributeId: string, valueId: string) => void;
 onVariantModelChange?: (attributeId: string, modelId: string) => void;
 onOtherVariantChange?: (attributeId: string, valueId: string) => void;
 onOtherVariantModelChange?: (attributeId: string, modelId: string) => void;
 onAddValueForAttribute?: (categoryId: string, attributeId: string, name: string) => Promise<string | null>;
 onAddModelForAttribute?: (categoryId: string, attributeId: string, valueId: string, modelName: string) => Promise<string | null>;
 onAddChildForModelAttribute?: (categoryId: string, firstAttrId: string, valueId: string, modelId: string, name: string) => Promise<string | null>;
 /** Fully dynamic: add a variant value at any level. parentPath = selected ids for previous attributes ([] for first). */
 onAddValueAtPath?: (categoryId: string, firstAttributeId: string, parentPath: string[], name: string) => Promise<string | null>;
 /** Edit (rename) variant value at path. path = full path including current selection. */
 onEditVariantAtPath?: (categoryId: string, firstAttributeId: string, path: string[], newName: string) => Promise<boolean | { ok: boolean; message?: string }>;
 /** Delete variant value at path; when in use, pass replacementValueName. Returns true/false or { ok: false, inUse: true, count, replacementOptions }. */
 onDeleteVariantAtPath?: (
 categoryId: string,
 firstAttributeId: string,
 path: string[],
 replacementValueName?: string
 ) => Promise<
 | boolean
 | { ok: false; inUse: true; count: number; replacementOptions: Array<{ _id: string; name: string }> }
 >;
 getVariantOptionsForAttributeIndex?: (attributes: CategoryVariantAttribute[], variantValues: Record<string, string>, attributeIndex: number) => { _id: string; name: string }[];
}

export const ItemForm: React.FC<ItemFormProps> = ({
 data,
 currencySymbol,
 totalIMEIs,
 imeiQuantity,
 savedItems,
 sendToOptions,
 taxCategories,
 types,
 optionsLoading = false,
 optionsError,
 onRetryOptions,
 makes,
 grades,
 brands,
 brandModels,
 capacities,
 colours,
 showGradeImei = true,
 showBrandImei = true,
 showStorageImei = true,
 showColorImei = true,
 showGradeOther = true,
 showBrandOther = true,
 showStorageOther = true,
 showColorOther = true,
 onChange,
 onSubmit,
 onReset,
 onAddItem,
 canAddSerialItem = true,
 onRemoveItem,
 onEditItem,
 editingItemId = null,
 onCancelEdit,
 // Other items props
 mode,
 onModeChange,
 otherItemData,
 otherQuantityLimit,
 savedOtherItems,
 savedOtherQuantity,
 totalOtherQuantity,
 onOtherItemChange,
 onAddOtherItem,
 onRemoveOtherItem,
 onEditOtherItem,
 editingOtherItemId = null,
 onCancelOtherEdit,
 onSearchNonSerialProducts,
 onSelectNonSerialProduct,
 onSearchSerialProducts,
 onSelectSerialProduct,
 variant = "card",
 allowCreateVariantValues = false,
 onAddBrand,
 onAddModel,
 onAddCapacity,
 onAddColour,
 onAddGrade,
 typesForNonSerial,
 categoryVariantAttributesImei = [],
 categoryVariantAttributesOther = [],
 onVariantChange,
 onVariantModelChange,
 onOtherVariantChange,
 onOtherVariantModelChange,
 onAddValueForAttribute,
 onAddModelForAttribute,
 onAddChildForModelAttribute,
 onAddValueAtPath,
 onEditVariantAtPath,
 onDeleteVariantAtPath,
 getVariantOptionsForAttributeIndex,
}) => {
 const isInline = variant === "inline";
 const itemFormRootRef = useRef<HTMLDivElement>(null);
 const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
 const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
 const [replaceModal, setReplaceModal] = useState<{
 count: number;
 replacementOptions: Array<{ _id: string; name: string }>;
 categoryId: string;
 attributeId: string;
 path: string[];
 valueName: string;
 clearVariant: () => void;
 } | null>(null);
 const [replacementSelection, setReplacementSelection] = useState("");

 const toggleExpand = (id: string) => {
 setExpandedItems((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 };

 const resolveLabel = (id: string, options: { _id: string; name: string }[]) =>
 options.find((o) => o._id === id)?.name || id || "—";

 const handleIMEIKeyDown = useCallback(
 (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key !== "Enter") return;

 const value = e.currentTarget.value;
 const cursorPos = e.currentTarget.selectionStart;

 // Get the current line the user just typed
 const textBeforeCursor = value.substring(0, cursorPos);
 const lastNewline = textBeforeCursor.lastIndexOf("\n");
 const currentLine = textBeforeCursor.substring(lastNewline + 1).trim();

 if (!currentLine) return;

 // Current line may contain multiple IMEIs (comma-separated)
 const currentLineTokens = parseMultiIMEIs(currentLine);
 if (currentLineTokens.length === 0) return;

 // Check all IMEIs above the current position
 const linesAbove = parseMultiIMEIs(
 textBeforeCursor.substring(0, lastNewline >= 0 ? lastNewline : 0)
 );

 // Check duplicate within current form
 const aboveU = new Set(linesAbove.map((x) => x.toUpperCase()));
 const dupInForm = currentLineTokens.find((t) => aboveU.has(t.toUpperCase()));
 if (dupInForm) {
 e.preventDefault();
 setDuplicateAlert(`"${dupInForm}" is already in this list!`);
 const before = value.substring(0, lastNewline >= 0 ? lastNewline + 1 : 0);
 const after = value.substring(cursorPos);
 const cleaned = before + after;
 onChange("multiIMEIs", cleaned.replace(/\n{2,}/g, "\n").replace(/^\n|\n$/g, ""));
 return;
 }

 // Check duplicate across saved items
 const allSavedIMEIs = savedItems.flatMap((item) => parseMultiIMEIs(item.data.multiIMEIs));
 const savedU = new Set(allSavedIMEIs.map((x) => x.toUpperCase()));
 const dupInSaved = currentLineTokens.find((t) => savedU.has(t.toUpperCase()));
 if (dupInSaved) {
 e.preventDefault();
 setDuplicateAlert(`"${dupInSaved}" is already used in another item group!`);
 const before = value.substring(0, lastNewline >= 0 ? lastNewline + 1 : 0);
 const after = value.substring(cursorPos);
 const cleaned = before + after;
 onChange("multiIMEIs", cleaned.replace(/\n{2,}/g, "\n").replace(/^\n|\n$/g, ""));
 return;
 }

 setDuplicateAlert(null);
 },
 [onChange, savedItems]
 );

 useLayoutEffect(() => {
 const root = itemFormRootRef.current;
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
 }, [mode, isInline]);

 return (
 <>
 <div ref={itemFormRootRef} className={isInline ? "" : "max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200"}>
 {!isInline && (
 <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3">
  <h2 className="text-lg font-medium text-gray-800">Item Entry</h2>
  <HelpTip ariaLabel="Item entry help" className="mt-0.5" align="end">
  Add IMEI/serial lines or non-serial quantity lines, then use Add purchase to inventory when finished. Saved groups stay listed above the form.
  </HelpTip>
 </div>
 )}

 {/* Mode Toggle */}
 <div className={isInline ? "pb-3" : "p-4 border-b border-gray-200"}>
 <div className="inline-flex w-full sm:w-auto flex-col sm:flex-row gap-0 p-0.5 rounded-md bg-gray-100 border border-gray-200">
  <button
  type="button"
  onClick={() => onModeChange("imei")}
  className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-all ${
  mode === "imei"
  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
  : "text-gray-500 hover:text-gray-700"
  }`}
  >
  <Smartphone className="w-3.5 h-3.5 shrink-0" />
  IMEI items
  </button>
  <button
  type="button"
  onClick={() => onModeChange("other")}
  className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-all ${
  mode === "other"
  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
  : "text-gray-500 hover:text-gray-700"
  }`}
  >
  <Package className="w-3.5 h-3.5 shrink-0" />
  Non serial numbers
  </button>
 </div>
 </div>

 {/* Saved IMEI Items Summary */}
 {mode === "imei" && savedItems.length > 0 && (
 <div className={`${isInline ? "px-3 py-3 sm:px-4" : "p-4"} border-b border-gray-200 space-y-1.5`}>
  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Saved item groups</h3>
  {savedItems.map((item, idx) => {
  const isEditingRow = editingItemId === item.id;
  // Editing row auto-expands so the user always sees the "open" state. Otherwise normal toggle.
  const isExpanded = isEditingRow || expandedItems.has(item.id);
  const d = item.data;
  const imeiLines = parseMultiIMEIs(d.multiIMEIs);
  return (
  <div
   key={item.id}
   className={`bg-white border rounded-lg overflow-hidden transition-all duration-300 ease-out ${
   isEditingRow
    ? "border-blue-400 ring-2 ring-blue-200 shadow-sm bg-blue-50/40 scale-[1.005]"
    : "border-gray-200"
   }`}
  >
  {/* Header row — click to toggle (or close edit when this is the editing row) */}
  <div
   className={`flex items-center justify-between px-3 py-2 transition-colors ${
   isEditingRow ? "cursor-default" : "cursor-pointer hover:bg-gray-50"
   }`}
   onClick={() => {
   if (!isEditingRow) toggleExpand(item.id);
   }}
  >
   <div className="flex items-center gap-2">
   <button
   type="button"
   onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
   className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
   title="Remove item"
   >
   <X className="w-4 h-4" />
   </button>
   <span
    className={`inline-flex items-center justify-center w-5 h-5 text-white text-[10px] font-bold rounded-full transition-colors ${
    isEditingRow ? "bg-blue-600" : "bg-gray-900"
    }`}
   >
   {idx + 1}
   </span>
   <span className="text-xs text-gray-800 font-medium">{item.specsSummary}</span>
   <span className="text-[11px] text-gray-500">({item.imeiCount} serial{item.imeiCount === 1 ? "" : "s"})</span>
   {isEditingRow && (
   <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold uppercase tracking-wide animate-pulse">
    Editing
   </span>
   )}
   </div>
   <div className="flex items-center gap-2">
   {isEditingRow ? (
   <button
   type="button"
   onClick={(e) => { e.stopPropagation(); onCancelEdit?.(); }}
   className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-all duration-200"
   title="Close edit"
   aria-label="Close edit"
   >
   <ChevronUp className="w-4 h-4 transition-transform duration-300" />
   </button>
   ) : (
   <>
   <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onEditItem(item.id); }}
    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
    title="Edit item"
   >
    <Pencil className="w-4 h-4" />
   </button>
   {isExpanded ? (
    <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-300" />
   ) : (
    <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300" />
   )}
   </>
   )}
   </div>
  </div>

  {/* Expanded details */}
  {isExpanded && (
   <div
   className={`px-4 pb-4 pt-2 border-t space-y-3 transition-colors duration-300 ${
   isEditingRow ? "border-blue-200 bg-blue-50/30" : "border-gray-100"
   }`}
   >
   <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
   <div>
   <span className="text-gray-500">Send To:</span>{" "}
   <span className="text-gray-800 font-medium">{resolveLabel(d.sendTo, sendToOptions)}</span>
   </div>
   <div>
   <span className="text-gray-500">Tax:</span>{" "}
   <span className="text-gray-800 font-medium">{resolveLabel(d.taxCategory, taxCategories)}</span>
   </div>
   <div>
   <span className="text-gray-500">Category:</span>{" "}
   <span className="text-gray-800 font-medium">{resolveLabel(d.type, types)}</span>
   </div>
   {d.make ? (
   <div>
    <span className="text-gray-500">Sub Category:</span>{" "}
    <span className="text-gray-800 font-medium">{resolveLabel(d.make, makes)}</span>
   </div>
   ) : null}
   {d.grade ? (
   <div>
    <span className="text-gray-500">Condition:</span>{" "}
    <span className="text-gray-800 font-medium">{resolveLabel(d.grade, grades)}</span>
   </div>
   ) : null}
   <div>
   <span className="text-gray-500">Brand:</span>{" "}
   <span className="text-gray-800 font-medium">{d.brand ? resolveLabel(d.brand, brands) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Model:</span>{" "}
   <span className="text-gray-800 font-medium">{d.brandModel ? resolveLabel(d.brandModel, brandModels) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Storage:</span>{" "}
   <span className="text-gray-800 font-medium">{d.capacity ? resolveLabel(d.capacity, capacities) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Color:</span>{" "}
   <span className="text-gray-800 font-medium">{d.colour ? resolveLabel(d.colour, colours) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Purchase Price:</span>{" "}
   <span className="text-gray-800 font-medium">{currencySymbol}{d.purchasePrice}</span>
   </div>
   <div>
   <span className="text-gray-500">Sale Price:</span>{" "}
   <span className="text-gray-800 font-medium">{currencySymbol}{d.salePrice}</span>
   </div>
   </div>
   {imeiLines.length > 0 && (
   <div>
   <span className="text-sm text-gray-500">Serials:</span>
   <div className="mt-1 bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-xs text-gray-700">
    {imeiLines.map((serial, i) => (
    <div key={i}>{serial}</div>
    ))}
   </div>
   </div>
   )}
   {d.note && d.note.trim() && (
   <div>
   <span className="text-sm text-gray-500">Note:</span>
   <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{d.note}</p>
   </div>
   )}
   </div>
  )}
  </div>
  );
  })}
 </div>
 )}

 {/* Saved Non Serial Numbers Summary */}
 {mode === "other" && savedOtherItems.length > 0 && (
 <div className={`${isInline ? "px-3 py-3 sm:px-4" : "p-4"} border-b border-gray-200 space-y-1.5`}>
  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Saved non-serial groups</h3>
  {savedOtherItems.map((item, idx) => {
  const isEditingRow = editingOtherItemId === item.id;
  const isExpanded = isEditingRow || expandedItems.has(item.id);
  const d = item.data;
  return (
  <div
   key={item.id}
   className={`bg-white border rounded-lg overflow-hidden transition-all duration-300 ease-out ${
   isEditingRow
    ? "border-blue-400 ring-2 ring-blue-200 shadow-sm bg-blue-50/40 scale-[1.005]"
    : "border-gray-200"
   }`}
  >
  <div
   className={`flex items-center justify-between px-3 py-2 transition-colors ${
   isEditingRow ? "cursor-default" : "cursor-pointer hover:bg-gray-50"
   }`}
   onClick={() => {
   if (!isEditingRow) toggleExpand(item.id);
   }}
  >
   <div className="flex items-center gap-2">
   <button
   type="button"
   onClick={(e) => { e.stopPropagation(); onRemoveOtherItem(item.id); }}
   className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
   title="Remove item"
   >
   <X className="w-4 h-4" />
   </button>
   <span
    className={`inline-flex items-center justify-center w-5 h-5 text-white text-[10px] font-bold rounded-full transition-colors ${
    isEditingRow ? "bg-blue-600" : "bg-gray-900"
    }`}
   >
   {idx + 1}
   </span>
   <span className="text-sm text-gray-800 font-medium">{item.specsSummary}</span>
   {d.barcode && (
   <span className="text-xs text-gray-500 font-mono">— {d.barcode}</span>
   )}
   <span className="text-xs text-gray-500">(Qty: {item.quantity})</span>
   {isEditingRow && (
   <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold uppercase tracking-wide animate-pulse">
    Editing
   </span>
   )}
   </div>
   <div className="flex items-center gap-2">
   {isEditingRow ? (
   <button
   type="button"
   onClick={(e) => { e.stopPropagation(); onCancelOtherEdit?.(); }}
   className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-all duration-200"
   title="Close edit"
   aria-label="Close edit"
   >
   <ChevronUp className="w-4 h-4 transition-transform duration-300" />
   </button>
   ) : (
   <>
   <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onEditOtherItem(item.id); }}
    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
    title="Edit item"
   >
    <Pencil className="w-4 h-4" />
   </button>
   {isExpanded ? (
    <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-300" />
   ) : (
    <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300" />
   )}
   </>
   )}
   </div>
  </div>

  {isExpanded && (
   <div
   className={`px-4 pb-4 pt-2 border-t space-y-3 transition-colors duration-300 ${
   isEditingRow ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
   }`}
   >
   <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
   <div>
   <span className="text-gray-500">Barcode:</span>{" "}
   <span className="text-gray-800 font-medium font-mono">{d.barcode || "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Send To:</span>{" "}
   <span className="text-gray-800 font-medium">{resolveLabel(d.sendTo, sendToOptions)}</span>
   </div>
   <div>
   <span className="text-gray-500">Tax:</span>{" "}
   <span className="text-gray-800 font-medium">{resolveLabel(d.taxCategory, taxCategories)}</span>
   </div>
   <div>
   <span className="text-gray-500">Category:</span>{" "}
   <span className="text-gray-800 font-medium">{resolveLabel(d.type, typesForNonSerial ?? types)}</span>
   </div>
   {d.make ? (
   <div>
    <span className="text-gray-500">Sub Category:</span>{" "}
    <span className="text-gray-800 font-medium">{resolveLabel(d.make, makes)}</span>
   </div>
   ) : null}
   {d.grade ? (
   <div>
    <span className="text-gray-500">Condition:</span>{" "}
    <span className="text-gray-800 font-medium">{resolveLabel(d.grade, grades)}</span>
   </div>
   ) : null}
   <div>
   <span className="text-gray-500">Brand:</span>{" "}
   <span className="text-gray-800 font-medium">{d.brand ? resolveLabel(d.brand, brands) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Model:</span>{" "}
   <span className="text-gray-800 font-medium">{d.brandModel ? resolveLabel(d.brandModel, brandModels) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Storage:</span>{" "}
   <span className="text-gray-800 font-medium">{d.capacity ? resolveLabel(d.capacity, capacities) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Color:</span>{" "}
   <span className="text-gray-800 font-medium">{d.colour ? resolveLabel(d.colour, colours) : "—"}</span>
   </div>
   <div>
   <span className="text-gray-500">Purchase Price:</span>{" "}
   <span className="text-gray-800 font-medium">{currencySymbol}{d.purchasePrice}</span>
   </div>
   <div>
   <span className="text-gray-500">Sale Price:</span>{" "}
   <span className="text-gray-800 font-medium">{currencySymbol}{d.salePrice}</span>
   </div>
   <div>
   <span className="text-gray-500">Quantity:</span>{" "}
   <span className="text-gray-800 font-medium">{d.quantity}</span>
   </div>
   </div>
   {d.note && d.note.trim() && (
   <div>
   <span className="text-sm text-gray-500">Note:</span>
   <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{d.note}</p>
   </div>
   )}
   </div>
  )}
  </div>
  );
  })}
 </div>
 )}

 {/* IMEI Mode Form */}
 {mode === "imei" && (
 <div className={`${isInline ? "p-3 sm:p-4" : "p-4"} space-y-3`}>
  {/* Quick-fill: search existing serial products to auto-populate every field below */}
  {onSearchSerialProducts && onSelectSerialProduct && (
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">NAME</label>
  <SerialNameSearch
  key={`serial-name-search-${savedItems.length}`}
  onSearch={onSearchSerialProducts}
  onSelect={onSelectSerialProduct}
  />
  </div>
  )}
  {/* Row 1: Send To, Tax, Category */}
  <div>
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Shipment & classification</p>
  <div className="grid grid-cols-3 gap-3">
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">SEND TO</label>
  <SearchableSelect
  options={sendToOptions}
  value={data.sendTo}
  onChange={(val) => onChange("sendTo", val)}
  placeholder="Select Location"
  icon={<Send className="h-4 w-4 text-gray-400" />}
  loading={optionsLoading}
  error={optionsError?.sendTo}
  onRetry={onRetryOptions}
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">TAX</label>
  <SearchableSelect
  options={taxCategories.map((cat) => ({ _id: cat._id, name: cat.name, subtitle: cat.type === 'percentage' ? `${cat.rate}%` : `£${cat.rate} Flat` }))}
  value={data.taxCategory}
  onChange={(val) => onChange("taxCategory", val)}
  placeholder="Select Tax"
  icon={<Receipt className="h-4 w-4 text-gray-400" />}
  loading={optionsLoading}
  error={optionsError?.tax}
  onRetry={onRetryOptions}
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">CATEGORY</label>
  <SearchableSelect
  options={types}
  value={data.type}
  onChange={(val) => onChange("type", val)}
  placeholder="Select Category"
  loading={optionsLoading}
  error={optionsError?.categories}
  onRetry={onRetryOptions}
  icon={<Tag className="h-4 w-4 text-gray-400" />}
  />
  </div>
  </div>
  </div>

  {/* Dynamic: one dropdown per category variant attribute (cascading: options from parent selection) */}
  {categoryVariantAttributesImei.length > 0 && getVariantOptionsForAttributeIndex && (
  <div className="space-y-2">
  <div className="flex flex-wrap items-start justify-between gap-2">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Variant attributes</p>
  <HelpTip
   align="end"
   ariaLabel="How variant attributes work"
   contentClassName="border-gray-200 bg-white text-gray-900 [&_strong]:font-semibold"
   iconClassName="h-3.5 w-3.5 text-gray-400"
  >
   <p>
   Select in order: each dropdown shows only options under the previous selection. Type and click &quot;+ Add&quot; to create new values (saved for this category).
   </p>
   <p className="mt-2">
   After selecting a value, use the <strong>pencil</strong> or <strong>trash</strong> icon next to the label to edit or remove.
   </p>
  </HelpTip>
  </div>
  <div className="grid grid-cols-3 gap-3">
  {categoryVariantAttributesImei.map((attr, attributeIndex) => {
   const valueOptions = getVariantOptionsForAttributeIndex(categoryVariantAttributesImei, data.variantValues || {}, attributeIndex);
   const selectedValueId = data.variantValues?.[attr._id] ?? "";
   const parentSelected = attributeIndex === 0 || categoryVariantAttributesImei.slice(0, attributeIndex).every((a) => data.variantValues?.[a._id]);
   const canAdd = data.type && parentSelected;
   const canCreateNew = allowCreateVariantValues && canAdd;
   const parentPath = categoryVariantAttributesImei.slice(0, attributeIndex).map((a) => data.variantValues?.[a._id]).filter(Boolean) as string[];
   const firstAttrId = categoryVariantAttributesImei[0]?._id;
   const onCreateNew =
   canCreateNew && onAddValueAtPath && firstAttrId
   ? (name: string) => onAddValueAtPath(data.type!, firstAttrId, parentPath, name)
   : undefined;
   const pathWithSelection = categoryVariantAttributesImei.slice(0, attributeIndex + 1).map((a) => data.variantValues?.[a._id]).filter(Boolean) as string[];
   const selectedName = valueOptions.find((o) => o._id === selectedValueId)?.name ?? "";
   const handleEdit = async () => {
   if (!onEditVariantAtPath || !firstAttrId || !data.type || pathWithSelection.length === 0) return;
   const newName = window.prompt(`Rename "${selectedName}" to:`, selectedName);
   if (newName == null || newName.trim() === "" || newName.trim() === selectedName) return;
   const result = await onEditVariantAtPath(data.type, firstAttrId, pathWithSelection, newName.trim());
   const ok = typeof result === "object" ? result?.ok : result;
   if (!ok) window.alert(typeof result === "object" && result?.message ? result.message : "Failed to rename. Try again.");
   };
   const handleRemove = async () => {
   if (!onDeleteVariantAtPath || !firstAttrId || !data.type || pathWithSelection.length === 0) return;
   if (!window.confirm(`Remove "${selectedName}" from this category? You can add it again later.`)) return;
   const result = await onDeleteVariantAtPath(data.type, firstAttrId, pathWithSelection);
   if (result === true) {
   onVariantChange?.(attr._id, "");
   return;
   }
   if (typeof result === "object" && result?.inUse && result.replacementOptions?.length) {
   setReplaceModal({
   count: result.count,
   replacementOptions: result.replacementOptions,
   categoryId: data.type,
   attributeId: firstAttrId,
   path: pathWithSelection,
   valueName: selectedName,
   clearVariant: () => onVariantChange?.(attr._id, ""),
   });
   setReplacementSelection(result.replacementOptions[0]?.name ?? "");
   return;
   }
   window.alert("Failed to remove. Try again.");
   };
   return (
   <div key={attr._id} className="space-y-2">
   <div className="flex items-center justify-between gap-2">
   <label className="block text-sm font-medium text-gray-700">{attr.name.toUpperCase()}</label>
   {allowCreateVariantValues && selectedValueId && (onEditVariantAtPath || onDeleteVariantAtPath) && (
    <div className="flex items-center gap-1 shrink-0">
    {onEditVariantAtPath && (
    <button
    type="button"
    onClick={handleEdit}
    title="Edit name"
    className="p-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded"
    >
    <Pencil className="h-3.5 w-3.5" />
    </button>
    )}
    {onDeleteVariantAtPath && (
    <button
    type="button"
    onClick={handleRemove}
    title="Remove from category"
    className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
    >
    <Trash2 className="h-3.5 w-3.5" />
    </button>
    )}
    </div>
   )}
   </div>
   {canCreateNew && onCreateNew ? (
   <CreatableSearchableSelect
    options={valueOptions}
    value={selectedValueId}
    onChange={(id) => onVariantChange?.(attr._id, id)}
    placeholder={parentSelected ? `Select or add ${attr.name}` : `Select ${categoryVariantAttributesImei[attributeIndex - 1]?.name} first`}
    onCreateNew={onCreateNew}
    disabled={!parentSelected}
   />
   ) : (
   <SearchableSelect
    options={valueOptions}
    value={selectedValueId}
    onChange={(id) => onVariantChange?.(attr._id, id)}
    placeholder={parentSelected ? `Select ${attr.name}` : `Select previous first`}
    disabled={!parentSelected}
   />
   )}
   </div>
   );
  })}
  </div>
  </div>
  )}

  {/* Row 2 + 3: Condition, Brand, Model, Storage, Color (fallback when no dynamic attributes) */}
  {categoryVariantAttributesImei.length === 0 && (
  <div className="space-y-2">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Item attributes</p>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {showGradeImei && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">CONDITION</label>
  {allowCreateVariantValues && onAddGrade ? (
   <CreatableSearchableSelect
   options={grades}
   value={data.grade}
   onChange={(val) => onChange("grade", val)}
   placeholder="Select or add Condition"
   icon={<Award className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddGrade}
   />
  ) : (
   <SearchableSelect
   options={grades}
   value={data.grade}
   onChange={(val) => onChange("grade", val)}
   placeholder="Select Condition"
   icon={<Award className="h-5 w-5 text-gray-400" />}
   />
  )}
  </div>
  )}
  {showBrandImei && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">BRAND</label>
  {allowCreateVariantValues && onAddBrand ? (
   <CreatableSearchableSelect
   options={brands}
   value={data.brand}
   onChange={(val) => onChange("brand", val)}
   placeholder="Select or add Brand"
   icon={<Smartphone className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddBrand}
   />
  ) : (
   <SearchableSelect
   options={brands}
   value={data.brand}
   onChange={(val) => onChange("brand", val)}
   placeholder="Select Brand"
   icon={<Smartphone className="h-5 w-5 text-gray-400" />}
   />
  )}
  </div>
  )}
  </div>

  {/* Row 3: Model, Storage, Color (only if assigned to category) */}
  {(showBrandImei || showStorageImei || showColorImei) && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {showBrandImei && (
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-2">MODEL</label>
   {allowCreateVariantValues && onAddModel && data.brand ? (
   <CreatableSearchableSelect
   options={brandModels}
   value={data.brandModel}
   onChange={(val) => onChange("brandModel", val)}
   placeholder="Select or add Model"
   icon={<Monitor className="h-5 w-5 text-gray-400" />}
   onCreateNew={(name) => onAddModel(data.brand, name)}
   />
   ) : (
   <SearchableSelect
   options={brandModels}
   value={data.brandModel}
   onChange={(val) => onChange("brandModel", val)}
   placeholder={data.brand ? "Select Model" : "Select a Brand first"}
   icon={<Monitor className="h-5 w-5 text-gray-400" />}
   />
   )}
  </div>
  )}
  {showStorageImei && (
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-2">STORAGE</label>
   {allowCreateVariantValues && onAddCapacity ? (
   <CreatableSearchableSelect
   options={capacities}
   value={data.capacity}
   onChange={(val) => onChange("capacity", val)}
   placeholder="Select or add Storage"
   icon={<HardDrive className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddCapacity}
   />
   ) : (
   <SearchableSelect
   options={capacities}
   value={data.capacity}
   onChange={(val) => onChange("capacity", val)}
   placeholder="Select Storage"
   icon={<HardDrive className="h-5 w-5 text-gray-400" />}
   />
   )}
  </div>
  )}
  {showColorImei && (
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-2">COLOR</label>
   {allowCreateVariantValues && onAddColour ? (
   <CreatableSearchableSelect
   options={colours}
   value={data.colour}
   onChange={(val) => onChange("colour", val)}
   placeholder="Select or add Color"
   icon={<Palette className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddColour}
   />
   ) : (
   <SearchableSelect
   options={colours}
   value={data.colour}
   onChange={(val) => onChange("colour", val)}
   placeholder="Select Color"
   icon={<Palette className="h-5 w-5 text-gray-400" />}
   />
   )}
  </div>
  )}
  </div>
  )}
  </div>
  )}

  {/* Row 4: Purchase Price, Sale Price */}
  <div>
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Pricing</p>
  <div className="grid grid-cols-3 gap-3">
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">PURCHASE PRICE <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={data.purchasePrice}
   onChange={(e) => onChange("purchasePrice", e.target.value)}
   className={priceInputClassName}
   min="0"
   step="0.01"
   inputMode="decimal"
   required
  />
  </div>
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">SALE PRICE <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={data.salePrice}
   onChange={(e) => onChange("salePrice", e.target.value)}
   className={priceInputClassName}
   min="0"
   step="0.01"
   inputMode="decimal"
   required
  />
  </div>
  </div>
  </div>
  </div>

  {/* IMEIs + Note side by side */}
  <div className="grid grid-cols-2 gap-3">
  {/* Multi IMEIs */}
  <div className="space-y-1.5">
  <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-gray-600">
  <Hash className="h-4 w-4 text-gray-500 shrink-0" aria-hidden />
  <span>Serials / IMEIs</span>
  <span
   className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums normal-case tracking-normal ${
    imeiQuantity > 0 && totalIMEIs > imeiQuantity
     ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
     : imeiQuantity > 0 && totalIMEIs === imeiQuantity
     ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
     : "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
   }`}
   aria-label={`${totalIMEIs} serial${totalIMEIs === 1 ? "" : "s"} entered`}
  >
   {totalIMEIs}
   {imeiQuantity > 0 && ` / ${imeiQuantity}`}
  </span>
  <HelpTip
   align="end"
   ariaLabel="Serial and IMEI paste format"
   className="ml-auto"
   contentClassName="border-gray-200 bg-white text-gray-900"
   iconClassName="h-3.5 w-3.5 text-gray-400"
  >
   Separate with new lines, commas, or spaces. Counts 15-digit IMEIs and alphanumeric serials (6–32 chars).
  </HelpTip>
  </div>
  {duplicateAlert && (
  <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded flex items-center gap-1.5">
   <span className="text-red-500 font-bold text-sm">!</span>
   <span className="text-sm text-red-700">{duplicateAlert}</span>
  </div>
  )}
  <textarea
  value={data.multiIMEIs}
  onChange={(e) => onChange("multiIMEIs", e.target.value)}
  onKeyDown={handleIMEIKeyDown}
  placeholder="Paste serials or IMEIs — one per line or comma-separated"
  rows={10}
  className="block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none font-mono text-lg leading-8 tracking-wide"
  />
  </div>

  {/* Note — per-item-group: saved only with the IMEIs in this section */}
  <div className="space-y-1.5">
  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Note (this item only)</label>
  <textarea
   value={data.note ?? ""}
   onChange={(e) => onChange("note", e.target.value.slice(0, 2000))}
   rows={3}
   maxLength={2000}
   placeholder="e.g. Customer trade-in, warranty seal intact…"
   className="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 resize-none text-sm"
  />
  <p className="text-[10px] text-gray-400 text-right">{(data.note ?? "").length}/2000</p>
  </div>
  </div>

  {/* Total IMEI Count */}
  <div
  className={`border rounded-lg px-3 py-2 flex items-center justify-between ${
  imeiQuantity > 0 && totalIMEIs > imeiQuantity
  ? "bg-neutral-50 border-neutral-200"
  : "bg-gray-50 border-gray-200"
  }`}
  >
  <span
  className={`text-xs font-medium ${
  imeiQuantity > 0 && totalIMEIs > imeiQuantity ? "text-neutral-900" : "text-gray-900"
  }`}
  >
  Total serials
  {imeiQuantity > 0 && (
  <span className="font-normal text-gray-500">
   {" "}(expected {imeiQuantity}{totalIMEIs > imeiQuantity ? " — over OK" : ""})
  </span>
  )}
  </span>
  <span
  className={`text-lg font-bold tabular-nums ${
  imeiQuantity > 0 && totalIMEIs > imeiQuantity ? "text-neutral-700" : "text-gray-900"
  }`}
  >
  {totalIMEIs}
  {imeiQuantity > 0 && ` / ${imeiQuantity}`}
  </span>
  </div>
 </div>
 )}

 {/* Other Mode Form */}
 {mode === "other" && (
 <div className={`${isInline ? "p-3 sm:p-4" : "p-4"} space-y-3`}>
  {/* Name & Barcode */}
  <div>
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Identification</p>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">NAME</label>
  {onSearchNonSerialProducts && onSelectNonSerialProduct ? (
   <NonSerialNameSearch
    value={otherItemData.name}
    onChange={(val) => onOtherItemChange("name", val)}
    onSearch={onSearchNonSerialProducts}
    onSelect={onSelectNonSerialProduct}
   />
  ) : (
   <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
     <Tag className="h-4 w-4 text-gray-400" />
    </div>
    <input
     type="text"
     value={otherItemData.name}
     onChange={(e) => onOtherItemChange("name", e.target.value)}
     placeholder="Item name"
     className="block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
    />
   </div>
  )}
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">BARCODE</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Barcode className="h-4 w-4 text-gray-400" />
  </div>
  <input
   type="text"
   value={otherItemData.barcode}
   onChange={(e) => onOtherItemChange("barcode", e.target.value)}
   placeholder="Barcode / SKU"
   className="block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
  />
  </div>
  </div>
  </div>
  </div>

  {/* Row 1: Send To, Tax, Category */}
  <div>
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Shipment & classification</p>
  <div className="grid grid-cols-3 gap-3">
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">SEND TO</label>
  <SearchableSelect
  options={sendToOptions}
  value={otherItemData.sendTo}
  onChange={(val) => onOtherItemChange("sendTo", val)}
  placeholder="Select Location"
  icon={<Send className="h-4 w-4 text-gray-400" />}
  loading={optionsLoading}
  error={optionsError?.sendTo}
  onRetry={onRetryOptions}
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">TAX</label>
  <SearchableSelect
  options={taxCategories.map((cat) => ({ _id: cat._id, name: cat.name, subtitle: cat.type === 'percentage' ? `${cat.rate}%` : `£${cat.rate} Flat` }))}
  value={otherItemData.taxCategory}
  onChange={(val) => onOtherItemChange("taxCategory", val)}
  placeholder="Select Tax"
  icon={<Receipt className="h-4 w-4 text-gray-400" />}
  loading={optionsLoading}
  error={optionsError?.tax}
  onRetry={onRetryOptions}
  />
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">CATEGORY</label>
  <SearchableSelect
  options={typesForNonSerial ?? []}
  value={otherItemData.type}
  onChange={(val) => onOtherItemChange("type", val)}
  placeholder="Select Category"
  icon={<Tag className="h-4 w-4 text-gray-400" />}
  loading={optionsLoading}
  error={optionsError?.categories}
  onRetry={onRetryOptions}
  />
  </div>
  </div>
  </div>

  {/* Dynamic: one dropdown per category variant attribute (Other – cascading) */}
  {categoryVariantAttributesOther.length > 0 && getVariantOptionsForAttributeIndex && (
  <div className="space-y-2">
  <div className="flex flex-wrap items-start justify-between gap-2">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Variant attributes</p>
  <HelpTip
   align="end"
   ariaLabel="How variant attributes work"
   contentClassName="border-gray-200 bg-white text-gray-900 [&_strong]:font-semibold"
   iconClassName="h-3.5 w-3.5 text-gray-400"
  >
   <p>
   Select in order: each dropdown shows only options under the previous selection. Type and click &quot;+ Add&quot; to create new values (saved for this category).
   </p>
   <p className="mt-2">
   After selecting a value, use the <strong>pencil</strong> or <strong>trash</strong> icon next to the label to edit or remove.
   </p>
  </HelpTip>
  </div>
  <div className="grid grid-cols-3 gap-3">
  {categoryVariantAttributesOther.map((attr, attributeIndex) => {
   const valueOptions = getVariantOptionsForAttributeIndex(categoryVariantAttributesOther, otherItemData.variantValues || {}, attributeIndex);
   const selectedValueId = otherItemData.variantValues?.[attr._id] ?? "";
   const parentSelected = attributeIndex === 0 || categoryVariantAttributesOther.slice(0, attributeIndex).every((a) => otherItemData.variantValues?.[a._id]);
   const canAdd = otherItemData.type && parentSelected;
   const canCreateNew = allowCreateVariantValues && canAdd;
   const parentPath = categoryVariantAttributesOther.slice(0, attributeIndex).map((a) => otherItemData.variantValues?.[a._id]).filter(Boolean) as string[];
   const firstAttrId = categoryVariantAttributesOther[0]?._id;
   const onCreateNew =
   canCreateNew && onAddValueAtPath && firstAttrId
   ? (name: string) => onAddValueAtPath(otherItemData.type!, firstAttrId, parentPath, name)
   : undefined;
   const pathWithSelection = categoryVariantAttributesOther.slice(0, attributeIndex + 1).map((a) => otherItemData.variantValues?.[a._id]).filter(Boolean) as string[];
   const selectedName = valueOptions.find((o) => o._id === selectedValueId)?.name ?? "";
   const handleEditOther = async () => {
   if (!onEditVariantAtPath || !firstAttrId || !otherItemData.type || pathWithSelection.length === 0) return;
   const newName = window.prompt(`Rename "${selectedName}" to:`, selectedName);
   if (newName == null || newName.trim() === "" || newName.trim() === selectedName) return;
   const result = await onEditVariantAtPath(otherItemData.type, firstAttrId, pathWithSelection, newName.trim());
   const ok = typeof result === "object" ? result?.ok : result;
   if (!ok) window.alert(typeof result === "object" && result?.message ? result.message : "Failed to rename. Try again.");
   };
   const handleRemoveOther = async () => {
   if (!onDeleteVariantAtPath || !firstAttrId || !otherItemData.type || pathWithSelection.length === 0) return;
   if (!window.confirm(`Remove "${selectedName}" from this category? You can add it again later.`)) return;
   const result = await onDeleteVariantAtPath(otherItemData.type, firstAttrId, pathWithSelection);
   if (result === true) {
   onOtherVariantChange?.(attr._id, "");
   return;
   }
   if (typeof result === "object" && result?.inUse && result.replacementOptions?.length) {
   setReplaceModal({
   count: result.count,
   replacementOptions: result.replacementOptions,
   categoryId: otherItemData.type,
   attributeId: firstAttrId,
   path: pathWithSelection,
   valueName: selectedName,
   clearVariant: () => onOtherVariantChange?.(attr._id, ""),
   });
   setReplacementSelection(result.replacementOptions[0]?.name ?? "");
   return;
   }
   window.alert("Failed to remove. Try again.");
   };
   return (
   <div key={attr._id} className="space-y-2">
   <div className="flex items-center justify-between gap-2">
   <label className="block text-sm font-medium text-gray-700">{attr.name.toUpperCase()}</label>
   {allowCreateVariantValues && selectedValueId && (onEditVariantAtPath || onDeleteVariantAtPath) && (
    <div className="flex items-center gap-1 shrink-0">
    {onEditVariantAtPath && (
    <button
    type="button"
    onClick={handleEditOther}
    title="Edit name"
    className="p-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded"
    >
    <Pencil className="h-3.5 w-3.5" />
    </button>
    )}
    {onDeleteVariantAtPath && (
    <button
    type="button"
    onClick={handleRemoveOther}
    title="Remove from category"
    className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
    >
    <Trash2 className="h-3.5 w-3.5" />
    </button>
    )}
    </div>
   )}
   </div>
   {canCreateNew && onCreateNew ? (
   <CreatableSearchableSelect
    options={valueOptions}
    value={selectedValueId}
    onChange={(id) => onOtherVariantChange?.(attr._id, id)}
    placeholder={parentSelected ? `Select or add ${attr.name}` : `Select ${categoryVariantAttributesOther[attributeIndex - 1]?.name} first`}
    onCreateNew={onCreateNew}
    disabled={!parentSelected}
   />
   ) : (
   <SearchableSelect
    options={valueOptions}
    value={selectedValueId}
    onChange={(id) => onOtherVariantChange?.(attr._id, id)}
    placeholder={parentSelected ? `Select ${attr.name}` : `Select previous first`}
    disabled={!parentSelected}
   />
   )}
   </div>
   );
  })}
  </div>
  </div>
  )}

  {/* Row 2 + 3: Condition, Brand, Model, Storage, Color (fallback when no dynamic attributes) */}
  {categoryVariantAttributesOther.length === 0 && (
  <div className="space-y-2">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Item attributes</p>
  <div className="grid grid-cols-3 gap-3">
  {showGradeOther && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">CONDITION</label>
  {allowCreateVariantValues && onAddGrade ? (
   <CreatableSearchableSelect
   options={grades}
   value={otherItemData.grade}
   onChange={(val) => onOtherItemChange("grade", val)}
   placeholder="Select or add Condition"
   icon={<Award className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddGrade}
   />
  ) : (
   <SearchableSelect
   options={grades}
   value={otherItemData.grade}
   onChange={(val) => onOtherItemChange("grade", val)}
   placeholder="Select Condition"
   icon={<Award className="h-5 w-5 text-gray-400" />}
   />
  )}
  </div>
  )}
  {showBrandOther && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">BRAND</label>
  {allowCreateVariantValues && onAddBrand ? (
   <CreatableSearchableSelect
   options={brands}
   value={otherItemData.brand}
   onChange={(val) => onOtherItemChange("brand", val)}
   placeholder="Select or add Brand"
   icon={<Smartphone className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddBrand}
   />
  ) : (
   <SearchableSelect
   options={brands}
   value={otherItemData.brand}
   onChange={(val) => onOtherItemChange("brand", val)}
   placeholder="Select Brand"
   icon={<Smartphone className="h-5 w-5 text-gray-400" />}
   />
  )}
  </div>
  )}
  </div>

  {/* Row 3: Model, Storage, Color (only if assigned to category) */}
  {(showBrandOther || showStorageOther || showColorOther) && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {showBrandOther && (
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-2">MODEL</label>
   {allowCreateVariantValues && onAddModel && otherItemData.brand ? (
   <CreatableSearchableSelect
   options={brandModels}
   value={otherItemData.brandModel}
   onChange={(val) => onOtherItemChange("brandModel", val)}
   placeholder="Select or add Model"
   icon={<Monitor className="h-5 w-5 text-gray-400" />}
   onCreateNew={(name) => onAddModel(otherItemData.brand, name)}
   />
   ) : (
   <SearchableSelect
   options={brandModels}
   value={otherItemData.brandModel}
   onChange={(val) => onOtherItemChange("brandModel", val)}
   placeholder={otherItemData.brand ? "Select Model" : "Select a Brand first"}
   icon={<Monitor className="h-5 w-5 text-gray-400" />}
   />
   )}
  </div>
  )}
  {showStorageOther && (
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-2">STORAGE</label>
   {allowCreateVariantValues && onAddCapacity ? (
   <CreatableSearchableSelect
   options={capacities}
   value={otherItemData.capacity}
   onChange={(val) => onOtherItemChange("capacity", val)}
   placeholder="Select or add Storage"
   icon={<HardDrive className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddCapacity}
   />
   ) : (
   <SearchableSelect
   options={capacities}
   value={otherItemData.capacity}
   onChange={(val) => onOtherItemChange("capacity", val)}
   placeholder="Select Storage"
   icon={<HardDrive className="h-5 w-5 text-gray-400" />}
   />
   )}
  </div>
  )}
  {showColorOther && (
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-2">COLOR</label>
   {allowCreateVariantValues && onAddColour ? (
   <CreatableSearchableSelect
   options={colours}
   value={otherItemData.colour}
   onChange={(val) => onOtherItemChange("colour", val)}
   placeholder="Select or add Color"
   icon={<Palette className="h-5 w-5 text-gray-400" />}
   onCreateNew={onAddColour}
   />
   ) : (
   <SearchableSelect
   options={colours}
   value={otherItemData.colour}
   onChange={(val) => onOtherItemChange("colour", val)}
   placeholder="Select Color"
   icon={<Palette className="h-5 w-5 text-gray-400" />}
   />
   )}
  </div>
  )}
  </div>
  )}
  </div>
  )}

  {/* Row 4: Purchase Price, Sale Price, Quantity */}
  <div>
  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Pricing & quantity</p>
  <div className="grid grid-cols-3 gap-3">
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">PURCHASE PRICE <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={otherItemData.purchasePrice}
   onChange={(e) => onOtherItemChange("purchasePrice", e.target.value)}
   className={priceInputClassName}
   min="0"
   step="0.01"
   inputMode="decimal"
   required
  />
  </div>
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">SALE PRICE <span className="text-red-500">*</span></label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 font-medium">{currencySymbol}</span>
  </div>
  <input
   type="number"
   value={otherItemData.salePrice}
   onChange={(e) => onOtherItemChange("salePrice", e.target.value)}
   className={priceInputClassName}
   min="0"
   step="0.01"
   inputMode="decimal"
   required
  />
  </div>
  </div>

  <div>
  <div className="mb-1 flex flex-wrap items-center gap-1">
  <label className="text-xs font-medium text-gray-600">QUANTITY</label>
  {otherQuantityLimit > 0 ? (
   <HelpTip
   ariaLabel="Expected non-serial quantity"
   contentClassName="border-gray-200 bg-white text-gray-900"
   iconClassName="h-3 w-3 text-gray-400"
   >
   Purchase expected {otherQuantityLimit} non-serial item{otherQuantityLimit === 1 ? "" : "s"}. You can add more if the delivery has extra units.
   </HelpTip>
  ) : null}
  </div>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <Package className="h-4 w-4 text-gray-400" />
  </div>
  <input
   type="number"
   value={otherItemData.quantity}
   onChange={(e) => onOtherItemChange("quantity", e.target.value)}
   className="block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
   min="0"
   step="1"
  />
  </div>
  </div>
  </div>
  </div>

  {/* Note — per-item-group: saved only with this non-serial line */}
  <div className="space-y-1.5">
  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Note (this item only)</label>
  <textarea
  value={otherItemData.note ?? ""}
  onChange={(e) => onOtherItemChange("note", e.target.value.slice(0, 2000))}
  rows={3}
  maxLength={2000}
  placeholder="e.g. Customer trade-in, warranty seal intact…"
  className="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 resize-none text-sm"
  />
  <p className="text-[10px] text-gray-400 text-right">{(otherItemData.note ?? "").length}/2000</p>
  </div>

  {/* Total Other Quantity Count */}
  <div
  className={`border rounded-lg px-3 py-2 flex items-center justify-between ${
  otherQuantityLimit > 0 && totalOtherQuantity > otherQuantityLimit
  ? "bg-neutral-50 border-neutral-200"
  : "bg-gray-50 border-gray-200"
  }`}
  >
  <span
  className={`text-xs font-medium ${
  otherQuantityLimit > 0 && totalOtherQuantity > otherQuantityLimit ? "text-neutral-900" : "text-gray-900"
  }`}
  >
  Total quantity (saved + this line)
  {otherQuantityLimit > 0 && (
  <span className="font-normal text-gray-500">
   {" "}
   (expected {otherQuantityLimit}
   {totalOtherQuantity > otherQuantityLimit ? " — over expected is OK" : ""})
  </span>
  )}
  </span>
  <span
  className={`text-lg font-bold tabular-nums ${
  otherQuantityLimit > 0 && totalOtherQuantity > otherQuantityLimit ? "text-neutral-700" : "text-gray-900"
  }`}
  >
  {totalOtherQuantity}
  {otherQuantityLimit > 0 && ` / ${otherQuantityLimit}`}
  </span>
  </div>
 </div>
 )}

 {/* Action Buttons: inline = only Add Item; card = Reset + Add Item + Submit */}
 <div className={isInline ? "pt-3 flex flex-wrap items-center gap-2 border-t border-gray-200" : "p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3"}>
 {!isInline && (
  <button
  type="button"
  onClick={onReset}
  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
  >
  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
  Reset
  </button>
 )}
 <div className="flex items-center gap-2">
  <button
  type="button"
  onClick={mode === "imei" ? onAddItem : onAddOtherItem}
  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
  (mode === "imei" ? editingItemId : editingOtherItemId)
   ? "bg-blue-600 hover:bg-blue-700 shadow-md"
   : "bg-gray-900 hover:bg-gray-800"
  }`}
  disabled={
  (mode === "imei" && !canAddSerialItem) || (mode === "other" && Number(otherItemData.quantity) <= 0)
  }
  title={
  mode === "imei" && !canAddSerialItem
  ? "Fill all variant attributes (Category and every attribute) and add at least one serial / IMEI"
  : mode === "other" && Number(otherItemData.quantity) <= 0
   ? "Enter quantity (1 or more) to add"
   : undefined
  }
  >
  {(mode === "imei" ? editingItemId : editingOtherItemId) ? (
  <>
  <Save className="w-3.5 h-3.5 mr-1.5" />
  Save changes
  </>
  ) : (
  <>
  <Plus className="w-3.5 h-3.5 mr-1.5" />
  Add Item
  </>
  )}
  </button>
  {!isInline && (
  <button
  onClick={onSubmit}
  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
  >
  <Save className="w-3.5 h-3.5 mr-1.5" />
  Add purchase to inventory
  </button>
  )}
 </div>
 </div>

 {/* Replace variant value modal (when value is in use) */}
 {replaceModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Value in use</h3>
  <p className="text-gray-600 mb-4">
  &quot;{replaceModal.valueName}&quot; is used in {replaceModal.count} purchase item(s). Choose a replacement from the same attribute. Purchase and product data will be updated; sales will not.
  </p>
  <label className="block text-sm font-medium text-gray-700 mb-1">Replacement</label>
  <select
  value={replacementSelection}
  onChange={(e) => setReplacementSelection(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
  >
  {replaceModal.replacementOptions.map((opt) => (
  <option key={opt._id} value={opt.name}>
   {opt.name}
  </option>
  ))}
  </select>
  <div className="flex justify-end gap-2">
  <button
  type="button"
  onClick={() => {
   setReplaceModal(null);
   setReplacementSelection("");
  }}
  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={async () => {
   if (!onDeleteVariantAtPath || !replacementSelection.trim()) return;
   const result = await onDeleteVariantAtPath(
   replaceModal.categoryId,
   replaceModal.attributeId,
   replaceModal.path,
   replacementSelection.trim()
   );
   if (result === true) {
   replaceModal.clearVariant();
   setReplaceModal(null);
   setReplacementSelection("");
   return;
   }
   if (typeof result === "object" && result?.inUse && result.replacementOptions?.length) {
   setReplaceModal((prev) =>
   prev
   ? { ...prev, count: result.count, replacementOptions: result.replacementOptions }
   : null
   );
   setReplacementSelection(result.replacementOptions[0]?.name ?? "");
   return;
   }
   window.alert("Failed to replace and remove. Try again.");
   setReplaceModal(null);
  }}
  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
  >
  Replace and remove
  </button>
  </div>
  </div>
 </div>
 )}
 </div>
 </>
 );
};

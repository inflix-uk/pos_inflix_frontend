"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";

/** UK-available phone & device brands */
const UK_BRANDS = [
 "Apple",
 "Samsung",
 "Google",
 "Motorola",
 "OnePlus",
 "Xiaomi",
 "OPPO",
 "HONOR",
 "Nokia",
 "Sony",
 "Realme",
 "Nothing",
 "Huawei",
 "Vivo",
 "Asus",
 "LG",
 "Microsoft",
 "Fairphone",
 "Cat",
 "BlackBerry",
];

/** Common UK device models (phones & tablets), grouped by brand for filtering */
const UK_MODELS = [
 "iPhone 16 Pro Max",
 "iPhone 16 Pro",
 "iPhone 16",
 "iPhone 15 Pro Max",
 "iPhone 15 Pro",
 "iPhone 15",
 "iPhone 14 Pro Max",
 "iPhone 14 Pro",
 "iPhone 14",
 "iPhone 13",
 "iPhone 12",
 "iPhone SE",
 "iPad Pro",
 "iPad Air",
 "iPad",
 "iPad mini",
 "Samsung Galaxy S24 Ultra",
 "Samsung Galaxy S24+",
 "Samsung Galaxy S24",
 "Samsung Galaxy S23",
 "Samsung Galaxy Z Fold 5",
 "Samsung Galaxy Z Flip 5",
 "Samsung Galaxy A54",
 "Samsung Galaxy A34",
 "Google Pixel 9 Pro",
 "Google Pixel 9",
 "Google Pixel 8 Pro",
 "Google Pixel 8",
 "Google Pixel 7",
 "Motorola Edge 40",
 "Motorola Razr",
 "Motorola G84",
 "OnePlus 12",
 "OnePlus 11",
 "OnePlus Nord",
 "Xiaomi 14",
 "Xiaomi 13",
 "Xiaomi Redmi Note",
 "OPPO Find X6",
 "OPPO Reno",
 "OPPO A series",
 "Honor Magic 5",
 "Honor 90",
 "Nokia G42",
 "Nokia XR21",
 "Sony Xperia 1 V",
 "Sony Xperia 10",
 "Realme 11",
 "Nothing Phone (2)",
 "Nothing Phone (1)",
 "Huawei P60",
 "Huawei Mate",
 "Other",
];

/** Returns models that belong to the given brand (for dropdown filtering). */
function getModelsForBrand(brand: string): string[] {
 if (!brand.trim()) return UK_MODELS;
 const b = brand.trim().toLowerCase();
 return UK_MODELS.filter((m) => {
 const ml = m.toLowerCase();
 if (b === "apple") return ml.startsWith("iphone") || ml.startsWith("ipad");
 if (b === "samsung") return ml.startsWith("samsung");
 if (b === "google") return ml.startsWith("google");
 if (b === "motorola") return ml.startsWith("motorola");
 if (b === "oneplus") return ml.startsWith("oneplus");
 if (b === "xiaomi") return ml.startsWith("xiaomi");
 if (b === "oppo") return ml.startsWith("oppo");
 if (b === "honor") return ml.startsWith("honor");
 if (b === "nokia") return ml.startsWith("nokia");
 if (b === "sony") return ml.startsWith("sony");
 if (b === "realme") return ml.startsWith("realme");
 if (b === "nothing") return ml.startsWith("nothing");
 if (b === "huawei") return ml.startsWith("huawei");
 if (b === "other") return m === "Other";
 return ml.startsWith(b);
 });
}

export interface NewDeviceModalResult {
 deviceDescription: string;
 serialNumber: string;
}

interface NewDeviceModalProps {
 open: boolean;
 onClose: () => void;
 initialSerialNumber?: string;
 initialDeviceDescription?: string;
 onSave: (result: NewDeviceModalResult) => void;
}

export const NewDeviceModal: React.FC<NewDeviceModalProps> = ({
 open,
 onClose,
 initialSerialNumber = "",
 initialDeviceDescription = "",
 onSave,
}) => {
 const [imeiSerial, setImeiSerial] = useState("");
 const [brand, setBrand] = useState("");
 const [brandOptions, setBrandOptions] = useState<string[]>(UK_BRANDS);
 const [brandOpen, setBrandOpen] = useState(false);
 const [brandSearch, setBrandSearch] = useState("");
 const [model, setModel] = useState("");
 const [modelOptions, setModelOptions] = useState<string[]>(UK_MODELS);
 const [modelOpen, setModelOpen] = useState(false);
 const [modelSearch, setModelSearch] = useState("");
 const [moreDetails, setMoreDetails] = useState("");
 const brandSearchInputRef = useRef<HTMLInputElement>(null);
 const modelSearchInputRef = useRef<HTMLInputElement>(null);
 /** Custom models added via "+ New" — keyed by brand so they only show for that brand (like add parcel). */
 const [customModelsByBrand, setCustomModelsByBrand] = useState<Record<string, string[]>>({});

 // Filter model list by selected brand; include only custom models for this brand
 useEffect(() => {
 const forBrand = getModelsForBrand(brand);
 const customForBrand = brand.trim() ? customModelsByBrand[brand.trim()] ?? [] : [];
 const options = customForBrand.length ? [...forBrand, ...customForBrand] : forBrand;
 setModelOptions(options);
 if (model && !options.includes(model)) setModel("");
 }, [brand, customModelsByBrand]);

 useEffect(() => {
 if (open) {
 setImeiSerial(initialSerialNumber);
 setMoreDetails("");
 setCustomModelsByBrand({});
 setBrandSearch("");
 setModelSearch("");
 const parts = initialDeviceDescription.trim().split(/\s+/);
 if (parts.length >= 2 && UK_BRANDS.includes(parts[0])) {
 setBrand(parts[0]);
 const modelPart = parts.slice(1).join(" ");
 const brandModels = getModelsForBrand(parts[0]);
 setModel(brandModels.includes(modelPart) ? modelPart : modelPart || "");
 if (!brandModels.includes(modelPart) && modelPart) setMoreDetails(modelPart);
 } else if (initialDeviceDescription) {
 setMoreDetails(initialDeviceDescription);
 } else {
 setBrand("");
 setModel("");
 }
 }
 }, [open, initialSerialNumber, initialDeviceDescription]);

 useEffect(() => {
 if (brandOpen) {
 setBrandSearch("");
 setTimeout(() => brandSearchInputRef.current?.focus(), 0);
 }
 }, [brandOpen]);

 useEffect(() => {
 if (modelOpen) {
 setModelSearch("");
 setTimeout(() => modelSearchInputRef.current?.focus(), 0);
 }
 }, [modelOpen]);

 const closeBrandDropdown = () => {
 setBrandSearch("");
 setBrandOpen(false);
 };

 const closeModelDropdown = () => {
 setModelSearch("");
 setModelOpen(false);
 };

 const addNewBrand = (value?: string) => {
 const v = (value ?? brandSearch).trim();
 if (!v || brandOptions.includes(v)) return;
 setBrandOptions((prev) => [...prev, v].sort());
 setBrand(v);
 setBrandSearch("");
 setBrandOpen(false);
 };

 const addNewModel = (value?: string) => {
 const v = (value ?? modelSearch).trim();
 if (!v || modelOptions.includes(v)) return;
 const brandKey = brand.trim();
 if (!brandKey) return;
 setCustomModelsByBrand((prev) => {
 const list = prev[brandKey] ?? [];
 if (list.includes(v)) return prev;
 return { ...prev, [brandKey]: [...list, v].sort() };
 });
 setModel(v);
 setModelSearch("");
 setModelOpen(false);
 };

 const handleSave = () => {
 if (!brand.trim()) return;
 if (!model.trim()) return;
 const parts = [brand.trim(), model.trim()];
 if (moreDetails.trim()) parts.push(moreDetails.trim());
 const deviceDescription = parts.join(" ");
 onSave({ deviceDescription, serialNumber: imeiSerial.trim() });
 onClose();
 };

 if (!open) return null;

 const inputCls =
 "w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/30" onClick={onClose} />
 <div className="relative flex max-h-[90vh] min-h-[28rem] w-full max-w-md flex-col overflow-visible rounded-lg border border-gray-200 bg-white shadow-xl">
 <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
  <div className="flex flex-wrap items-center gap-2">
  <h2 className="text-sm font-bold text-gray-900">Add device</h2>
  <HelpTip
  ariaLabel="About adding a device"
  align="end"
  iconClassName="h-4 w-4 text-gray-400"
  contentClassName="max-w-xs text-left text-sm leading-relaxed"
  >
  Build a clear device line for the repair list: brand and model are required. IMEI/serial is optional but
  helps with labels and handover. You can type to add brands or models that are not in the list.
  </HelpTip>
  </div>
  <button
  type="button"
  onClick={onClose}
  className="rounded-lg p-1 text-gray-500 transition hover:bg-white hover:text-gray-800"
  >
  <X className="h-4 w-4" />
  </button>
 </div>
 <div className="space-y-3 px-4 py-3">
  <div>
  <div className="mb-1 flex items-center justify-between gap-2">
  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">IMEI / serial</label>
  <HelpTip
  ariaLabel="IMEI or serial"
  align="end"
  iconClassName="h-3.5 w-3.5 text-gray-400"
  contentClassName="max-w-[14rem] text-left text-xs leading-relaxed"
  >
  Optional. Saved on the ticket for tracking. You can also add or edit it later on each device row.
  </HelpTip>
  </div>
  <input
  type="text"
  value={imeiSerial}
  onChange={(e) => setImeiSerial(e.target.value)}
  placeholder="Enter IMEI or serial number"
  className={`${inputCls} font-mono text-xs`}
  />
  </div>

  <div>
  <div className="mb-1 flex items-center justify-between gap-2">
  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
  Brand <span className="text-red-500">*</span>
  </label>
  <HelpTip
  ariaLabel="Brand field"
  align="end"
  iconClassName="h-3.5 w-3.5 text-gray-400"
  contentClassName="max-w-[14rem] text-left text-xs leading-relaxed"
  >
  Pick from the list or type a new name and press Enter / use “Add” to save it for this session.
  </HelpTip>
  </div>
  <div className="relative">
  <div
  role="combobox"
  aria-expanded={brandOpen}
  onClick={() => setBrandOpen(true)}
  className="flex min-h-[36px] w-full cursor-pointer items-center rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-10 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/30"
  >
  <span className={brand ? "text-gray-900" : "text-gray-500"}>{brand || "Select or type brand"}</span>
  </div>
  {brand && (
  <button
   type="button"
   onClick={(e) => { e.stopPropagation(); setBrand(""); }}
   className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
  >
   <X className="h-4 w-4" />
  </button>
  )}
  <button
  type="button"
  onClick={(e) => { e.stopPropagation(); setBrandOpen((b) => !b); }}
  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
  >
  <ChevronDown className={`h-4 w-4 transition-transform ${brandOpen ? "rotate-180" : ""}`} />
  </button>
  {brandOpen && (
  <>
   <div className="absolute inset-0 z-10" onClick={closeBrandDropdown} />
   <div className="absolute left-0 right-0 top-full z-20 mt-1 flex max-h-72 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ring-0">
   <div className="shrink-0 border-b border-gray-100 p-2">
   <div className="relative">
   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
   <input
    ref={brandSearchInputRef}
    type="text"
    value={brandSearch}
    onChange={(e) => setBrandSearch(e.target.value)}
    onKeyDown={(e) => {
    if (e.key === "Enter" && brandSearch.trim() && !brandOptions.some((b) => b.toLowerCase() === brandSearch.trim().toLowerCase())) {
    e.preventDefault();
    addNewBrand(brandSearch.trim());
    }
    }}
    placeholder="Search or type to add..."
    className="w-full rounded-lg border border-gray-200/80 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
    onClick={(e) => e.stopPropagation()}
   />
   </div>
   </div>
   <ul className="min-h-0 max-h-52 flex-1 overflow-auto py-1" role="listbox">
   {brandOptions
   .filter((b) => !brandSearch.trim() || b.toLowerCase().includes(brandSearch.trim().toLowerCase()))
   .map((b) => (
    <li key={b}>
    <button
    type="button"
    onClick={() => { setBrand(b); closeBrandDropdown(); }}
    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-orange-50 ${b === brand ? "bg-orange-50 font-semibold text-orange-800" : "text-gray-800"}`}
    >
    {b}
    </button>
    </li>
   ))}
   {brandSearch.trim() &&
   !brandOptions.some((b) => b.toLowerCase() === brandSearch.trim().toLowerCase()) && (
    <li className="mt-1 border-t border-gray-200 pt-2">
    <button
    type="button"
    onClick={(e) => { e.preventDefault(); addNewBrand(brandSearch.trim()); }}
    className="w-full rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-orange-600 hover:bg-orange-50"
    >
    + Add &quot;{brandSearch.trim()}&quot;
    </button>
    <p className="px-3 pb-1 text-xs text-gray-500">Click to add and select</p>
    </li>
   )}
   </ul>
   </div>
  </>
  )}
  </div>
  </div>

  <div>
  <div className="mb-1 flex items-center justify-between gap-2">
  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
  Model <span className="text-red-500">*</span>
  </label>
  <HelpTip
  ariaLabel="Model field"
  align="end"
  iconClassName="h-3.5 w-3.5 text-gray-400"
  contentClassName="max-w-[14rem] text-left text-xs leading-relaxed"
  >
  Options filter by brand. Choose <strong className="font-medium text-gray-800">Other</strong> or add a
  custom model if yours is not listed.
  </HelpTip>
  </div>
  <div className="relative">
  <div
  role="combobox"
  aria-expanded={modelOpen}
  onClick={() => brand.trim() && setModelOpen(true)}
  className={`flex min-h-[36px] w-full items-center rounded-lg border py-2 pl-3 pr-10 shadow-sm ${brand.trim() ? "cursor-pointer border-gray-200 bg-white focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/30" : "cursor-not-allowed border-gray-200 bg-gray-50"}`}
  >
  <span className={model ? "text-gray-900" : "text-gray-500"}>
   {model || (brand.trim() ? "Select or type model" : "Select a brand first")}
  </span>
  </div>
  {model && (
  <button
   type="button"
   onClick={(e) => { e.stopPropagation(); setModel(""); }}
   className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
  >
   <X className="h-4 w-4" />
  </button>
  )}
  <button
  type="button"
  onClick={(e) => { e.stopPropagation(); brand.trim() && setModelOpen((m) => !m); }}
  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
  disabled={!brand.trim()}
  >
  <ChevronDown className={`h-4 w-4 transition-transform ${modelOpen ? "rotate-180" : ""}`} />
  </button>
  {modelOpen && brand.trim() && (
  <>
   <div className="absolute inset-0 z-10" onClick={closeModelDropdown} />
   <div className="absolute left-0 right-0 top-full z-20 mt-1 flex max-h-72 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ring-0">
   <div className="shrink-0 border-b border-gray-100 p-2">
   <div className="relative">
   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
   <input
    ref={modelSearchInputRef}
    type="text"
    value={modelSearch}
    onChange={(e) => setModelSearch(e.target.value)}
    onKeyDown={(e) => {
    if (e.key === "Enter" && modelSearch.trim() && !modelOptions.some((m) => m.toLowerCase() === modelSearch.trim().toLowerCase())) {
    e.preventDefault();
    addNewModel(modelSearch.trim());
    }
    }}
    placeholder="Search or type to add..."
    className="w-full rounded-lg border border-gray-200/80 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
    onClick={(e) => e.stopPropagation()}
   />
   </div>
   </div>
   <ul className="min-h-0 max-h-52 flex-1 overflow-auto py-1" role="listbox">
   {modelOptions
   .filter((m) => !modelSearch.trim() || m.toLowerCase().includes(modelSearch.trim().toLowerCase()))
   .map((m) => (
    <li key={m}>
    <button
    type="button"
    onClick={() => { setModel(m); closeModelDropdown(); }}
    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-orange-50 ${m === model ? "bg-orange-50 font-semibold text-orange-800" : "text-gray-800"}`}
    >
    {m}
    </button>
    </li>
   ))}
   {modelSearch.trim() &&
   !modelOptions.some((m) => m.toLowerCase() === modelSearch.trim().toLowerCase()) && (
    <li className="mt-1 border-t border-gray-200 pt-2">
    <button
    type="button"
    onClick={(e) => { e.preventDefault(); addNewModel(modelSearch.trim()); }}
    className="w-full rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-orange-600 hover:bg-orange-50"
    >
    + Add &quot;{modelSearch.trim()}&quot;
    </button>
    <p className="px-3 pb-1 text-xs text-gray-500">Click to add and select</p>
    </li>
   )}
   </ul>
   </div>
  </>
  )}
  </div>
  </div>

  <div>
  <div className="mb-1 flex items-center justify-between gap-2">
  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">More details</label>
  <HelpTip
  ariaLabel="More details field"
  align="end"
  iconClassName="h-3.5 w-3.5 text-gray-400"
  contentClassName="max-w-[14rem] text-left text-xs leading-relaxed"
  >
  Appended to the device description (e.g. storage, colour). Optional but useful for identical models on
  the same job.
  </HelpTip>
  </div>
  <div className="relative">
  <input
  type="text"
  value={moreDetails}
  onChange={(e) => setMoreDetails(e.target.value)}
  placeholder="e.g. 256GB, Green, storage or colour"
  className={`${inputCls} pr-8`}
  />
  {moreDetails && (
  <button
   type="button"
   onClick={() => setMoreDetails("")}
   className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
  >
   <X className="h-4 w-4" />
  </button>
  )}
  </div>
  </div>
 </div>
 <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
  <button
  type="button"
  onClick={onClose}
  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={handleSave}
  disabled={!brand.trim() || !model.trim()}
  className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
  >
  Add to list
  </button>
 </div>
 </div>
 </div>
 );
};

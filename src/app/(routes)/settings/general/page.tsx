"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SlidersHorizontal, ArrowLeft, Package, Palette, Check, ShoppingBag, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useAppCurrency, type CurrencyCode } from "@/lib/app-currency-context";
import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/lib/theme";
import { usePermissions } from "@/hooks/usePermissions";
import { getInventorySettings, updateInventorySettings } from "./service/inventorySettingsApi";
import { getGeneralSettings, updateSalesMode, updateNegativeStock } from "../sales/service/generalSettingsApi";

const GeneralSettingsPage = () => {
 const { currencyCode, setCurrency, currencies } = useAppCurrency();
 const { theme, setTheme } = useTheme();
 const { can } = usePermissions();
 const canManageSalesMode = can("settings.manage");
 const [selected, setSelected] = useState<CurrencyCode>(currencyCode);
 const [saved, setSaved] = useState(false);
 const [syncSalePriceToSameVariant, setSyncSalePriceToSameVariant] = useState(true);
 const [inventorySettingsLoading, setInventorySettingsLoading] = useState(true);
 const [inventorySettingsSaving, setInventorySettingsSaving] = useState(false);
 const [inventorySettingsSaved, setInventorySettingsSaved] = useState(false);
 const [retailModeEnabled, setRetailModeEnabled] = useState(false);
 const [salesModeLoading, setSalesModeLoading] = useState(true);
 const [salesModeSaving, setSalesModeSaving] = useState(false);
 const [salesModeMessage, setSalesModeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const [allowNegativeStock, setAllowNegativeStock] = useState(false);
 const [negStockSaving, setNegStockSaving] = useState(false);
 const [negStockMessage, setNegStockMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 useEffect(() => {
 setSelected(currencyCode);
 }, [currencyCode]);

 useEffect(() => {
 getInventorySettings()
 .then((res) => {
 if (res.success && res.data != null) setSyncSalePriceToSameVariant(res.data.syncSalePriceToSameVariant !== false);
 })
 .finally(() => setInventorySettingsLoading(false));
 }, []);

 useEffect(() => {
 getGeneralSettings()
 .then((res) => {
 if (res.success && res.data) {
  if (typeof res.data.retailModeEnabled === "boolean") {
  setRetailModeEnabled(res.data.retailModeEnabled);
  }
  if (typeof res.data.allowNegativeStock === "boolean") {
  setAllowNegativeStock(res.data.allowNegativeStock);
  }
 }
 })
 .finally(() => setSalesModeLoading(false));
 }, []);

 const handleNegativeStockToggle = useCallback(async (value: boolean) => {
 if (!canManageSalesMode) return;
 setNegStockSaving(true);
 setNegStockMessage(null);
 try {
 const res = await updateNegativeStock({ allowNegativeStock: value });
 if (res.success && res.data) {
 setAllowNegativeStock(!!res.data.allowNegativeStock);
 setNegStockMessage({
  type: "success",
  text: value
  ? "Negative stock allowed — non-IMEI items can be sold below zero."
  : "Negative stock blocked — sales fail when stock would go below zero.",
 });
 setTimeout(() => setNegStockMessage(null), 4000);
 } else {
 setNegStockMessage({ type: "error", text: res.message || "Could not update setting." });
 }
 } catch {
 setNegStockMessage({ type: "error", text: "Could not update setting." });
 } finally {
 setNegStockSaving(false);
 }
 }, [canManageSalesMode]);

 const handleSalesModeToggle = useCallback(async (value: boolean) => {
 if (!canManageSalesMode) return;
 setSalesModeSaving(true);
 setSalesModeMessage(null);
 try {
 const res = await updateSalesMode({ retailModeEnabled: value });
 if (res.success && res.data) {
 setRetailModeEnabled(res.data.retailModeEnabled ?? false);
 setSalesModeMessage({
  type: "success",
  text: value ? "Retail (walk-in) mode is now active." : "Wholesale mode is now active.",
 });
 setTimeout(() => setSalesModeMessage(null), 4000);
 } else {
 setSalesModeMessage({ type: "error", text: res.message || "Could not update sales mode." });
 }
 } catch {
 setSalesModeMessage({ type: "error", text: "Could not update sales mode." });
 } finally {
 setSalesModeSaving(false);
 }
 }, [canManageSalesMode]);

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 setCurrency(selected);
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 };

 const handleAutoSyncToggle = useCallback(async (enabled: boolean) => {
 setSyncSalePriceToSameVariant(enabled);
 setInventorySettingsSaving(true);
 setInventorySettingsSaved(false);
 try {
 const res = await updateInventorySettings({ syncSalePriceToSameVariant: enabled });
 if (res.success) {
 setInventorySettingsSaved(true);
 setTimeout(() => setInventorySettingsSaved(false), 3000);
 }
 } finally {
 setInventorySettingsSaving(false);
 }
 }, []);

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="mb-6">
 <Link
  href="/settings"
  className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 text-sm mb-4"
 >
  <ArrowLeft className="h-4 w-4" />
  Back to Settings
 </Link>
 <div className="flex items-center gap-3">
  <div className="p-2 bg-slate-100 rounded-lg">
  <SlidersHorizontal className="h-6 w-6 text-slate-600" />
  </div>
  <div>
  <h1 className="text-2xl font-semibold text-gray-800">General</h1>
  <p className="text-gray-500 text-sm mt-1">
  Currency, Create Sales mode (retail / wholesale), theme, and inventory options
  </p>
  </div>
 </div>
 </div>

 <form onSubmit={handleSave} className="max-w-4xl">
 {/* Row 1: Display + Cache side by side */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-medium text-gray-800 mb-4">Display</h2>
  <div>
  <label
  htmlFor="currency"
  className="block text-sm font-medium text-gray-700 mb-2"
  >
  Default display currency
  </label>
  <select
  id="currency"
  value={selected}
  onChange={(e) => setSelected(e.target.value as CurrencyCode)}
  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  {currencies.map((c) => (
   <option key={c.code} value={c.code}>
   {c.symbol} {c.name} ({c.code})
   </option>
  ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
  Used for prices across sales, wholesale, and inventory
  </p>
  </div>
  <div className="mt-6 flex items-center gap-3">
  <button
  type="submit"
  className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
  >
  Save changes
  </button>
  {saved && (
  <span className="text-sm text-green-600">Saved</span>
  )}
  </div>
  </div>

  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
  <h2 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
  <Trash2 className="h-5 w-5 text-red-500" />
  Cache
  </h2>
  <p className="text-sm text-gray-500 mb-4">
  Clear all locally cached data (session &amp; local storage) and reload the app.
  </p>
  <div className="mt-auto">
  <button
  type="button"
  onClick={() => {
   try {
   const token = localStorage.getItem("token");
   const user = localStorage.getItem("user");
   const platformToken = localStorage.getItem("platformToken");
   sessionStorage.clear();
   localStorage.clear();
   if (token) localStorage.setItem("token", token);
   if (user) localStorage.setItem("user", user);
   if (platformToken) localStorage.setItem("platformToken", platformToken);
   } catch {}
   window.location.reload();
  }}
  title="Clear all cached data and reload"
  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-800 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 active:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
  >
  <Trash2 className="h-4.5 w-4.5 shrink-0 text-red-600" />
  Reset Cache
  </button>
  </div>
  </div>
 </div>

 {/* Row 2: Sales Mode + Inventory side by side */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
  <ShoppingBag className="h-5 w-5 text-orange-500" />
  Create Sales mode
  </h2>
  <p className="text-sm text-gray-500 mb-4">
  <strong>Wholesale</strong> requires a customer account and supports credit terms.{" "}
  <strong>Retail (walk-in)</strong> uses walk-in checkout by default and expects full payment. Same setting as under{" "}
  <Link href="/settings/sales" className="text-orange-600 hover:text-orange-700 font-medium">
  Sales settings
  </Link>
  .
  </p>
  {salesModeMessage && (
  <div
  className={`mb-4 px-3 py-2 rounded-lg text-sm ${
   salesModeMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
  }`}
  >
  {salesModeMessage.text}
  </div>
  )}
  {salesModeLoading ? (
  <div className="flex items-center gap-2 text-gray-500 py-2">
  <Loader2 className="h-5 w-5 animate-spin" />
  Loading…
  </div>
  ) : (
  <div className="flex flex-col gap-4">
  <div className="flex items-center gap-3">
   <span className={`text-sm font-medium ${!retailModeEnabled ? "text-gray-900" : "text-gray-500"}`}>
   Wholesale
   </span>
   <button
   type="button"
   role="switch"
   aria-checked={retailModeEnabled}
   disabled={!canManageSalesMode || salesModeSaving}
   onClick={() => canManageSalesMode && handleSalesModeToggle(!retailModeEnabled)}
   className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
   retailModeEnabled ? "bg-orange-500" : "bg-gray-200"
   }`}
   >
   <span
   className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
   retailModeEnabled ? "translate-x-5" : "translate-x-1"
   }`}
   />
   </button>
   <span className={`text-sm font-medium ${retailModeEnabled ? "text-gray-900" : "text-gray-500"}`}>
   Retail (walk-in)
   </span>
  </div>
  <div className="flex items-center gap-2 text-sm text-gray-500">
   {salesModeSaving && (
   <>
   <Loader2 className="h-4 w-4 animate-spin" />
   Saving…
   </>
   )}
   {!canManageSalesMode && (
   <span className="text-neutral-800 bg-neutral-50 px-2 py-1 rounded-md">
   Only users with <span className="font-medium">settings.manage</span> can change this.
   </span>
   )}
  </div>
  </div>
  )}
  </div>

  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
  <Package className="h-5 w-5 text-orange-500" />
  Inventory / Rate list
  </h2>
  <p className="text-sm text-gray-500 mb-4">
  When adding a new purchase with the same variant, automatically update the sale price on all existing items with that variant.
  </p>
  {inventorySettingsLoading ? (
  <p className="text-sm text-gray-500">Loading…</p>
  ) : (
  <div className="flex items-center gap-3">
  <label className="flex items-center gap-3 cursor-pointer">
   <input
   type="checkbox"
   checked={syncSalePriceToSameVariant}
   onChange={(e) => handleAutoSyncToggle(e.target.checked)}
   disabled={inventorySettingsSaving}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-60"
   />
   <span className="text-sm font-medium text-gray-800">Auto-sync sale price to same variant</span>
  </label>
  {inventorySettingsSaving && <span className="text-sm text-gray-500">Saving…</span>}
  {inventorySettingsSaved && !inventorySettingsSaving && (
   <span className="text-sm text-green-600">Saved</span>
  )}
  </div>
  )}
  <p className="text-xs text-gray-500 mt-3">
  Turn off to keep each purchase&apos;s price independent.
  </p>
  </div>
 </div>

 {/* Row 2.5: Negative stock allowance */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
  <h2 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
  <AlertTriangle className="h-5 w-5 text-orange-500" />
  Negative stock on Create Sales
  </h2>
  <p className="text-sm text-gray-500 mb-4">
  Controls whether <strong>non-IMEI (quantity-based)</strong> products can be sold when stock would drop below zero.
  When <strong>off</strong>, the sale is blocked with an &quot;Insufficient stock&quot; error.
  When <strong>on</strong>, the sale completes and the stock count goes negative.
  IMEI/serialized products are unaffected.
  </p>
  {negStockMessage && (
  <div
  className={`mb-4 px-3 py-2 rounded-lg text-sm ${
  negStockMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
  }`}
  >
  {negStockMessage.text}
  </div>
  )}
  {salesModeLoading ? (
  <div className="flex items-center gap-2 text-gray-500 py-2">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
  ) : (
  <div className="flex flex-col gap-3">
  <div className="flex items-center gap-3">
  <span className={`text-sm font-medium ${!allowNegativeStock ? "text-gray-900" : "text-gray-500"}`}>
  Block (recommended)
  </span>
  <button
  type="button"
  role="switch"
  aria-checked={allowNegativeStock}
  disabled={!canManageSalesMode || negStockSaving}
  onClick={() => canManageSalesMode && handleNegativeStockToggle(!allowNegativeStock)}
  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
  allowNegativeStock ? "bg-orange-500" : "bg-gray-200"
  }`}
  >
  <span
  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
   allowNegativeStock ? "translate-x-5" : "translate-x-1"
  }`}
  />
  </button>
  <span className={`text-sm font-medium ${allowNegativeStock ? "text-gray-900" : "text-gray-500"}`}>
  Allow negative
  </span>
  </div>
  <div className="flex items-center gap-2 text-sm text-gray-500">
  {negStockSaving && (
  <>
   <Loader2 className="h-4 w-4 animate-spin" /> Saving…
  </>
  )}
  {!canManageSalesMode && (
  <span className="text-neutral-800 bg-neutral-50 px-2 py-1 rounded-md">
   Only users with <span className="font-medium">settings.manage</span> can change this.
  </span>
  )}
  </div>
  </div>
  )}
 </div>

 {/* Row 3: Theme full width */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
  <Palette className="h-5 w-5 text-orange-500" />
  Theme
  </h2>
  <p className="text-sm text-gray-500 mb-4">
  Choose the primary brand color for buttons, links, and highlights across the app.
  </p>
  <div className="flex flex-wrap gap-4">
  {THEMES.map((t) => {
  const isActive = theme === t.id;
  return (
  <button
   key={t.id}
   type="button"
   onClick={() => setTheme(t.id)}
   className={`
   flex items-center gap-4 rounded-xl border-2 p-4 min-w-[140px] text-left
   transition-all hover:shadow-md
   ${isActive
   ? "border-orange-500 bg-orange-50 shadow-sm"
   : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
   }
   `}
   aria-pressed={isActive}
   aria-label={`Select ${t.name} theme`}
  >
   <div
   className="h-10 w-10 rounded-lg shrink-0 shadow-inner border border-black/10"
   style={{ backgroundColor: t.primary }}
   />
   <div className="min-w-0">
   <div className="font-medium text-gray-900">{t.name}</div>
   <div className="text-xs text-gray-500 font-mono">{t.primary}</div>
   </div>
   {isActive && (
   <div className="ml-auto shrink-0 rounded-full bg-orange-500 p-1">
   <Check className="h-4 w-4 text-white" />
   </div>
   )}
  </button>
  );
  })}
  </div>
 </div>
 </form>
 </div>
 );
};

export default GeneralSettingsPage;

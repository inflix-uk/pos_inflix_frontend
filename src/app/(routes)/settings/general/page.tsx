"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SlidersHorizontal, ArrowLeft, Package, Palette, Check, ShoppingBag, Loader2, Trash2, AlertTriangle, Globe, ShieldCheck } from "lucide-react";
import { useAppCurrency, type CurrencyCode } from "@/lib/app-currency-context";
import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/lib/theme";
import { usePermissions } from "@/hooks/usePermissions";
import { getInventorySettings, updateInventorySettings } from "./service/inventorySettingsApi";
import { getGeneralSettings, updateSalesMode, updateNegativeStock, setupAdminTotp, verifyAndEnableAdminTotp, disableAdminTotp } from "../sales/service/generalSettingsApi";

const GeneralSettingsPage = () => {
 const { currencyCode, setCurrency, currencies } = useAppCurrency();
 const { theme, setTheme } = useTheme();
 const { can } = usePermissions();
 const canManageSalesMode = can("settings.manage");
 const [selected, setSelected] = useState<CurrencyCode>(currencyCode);
 const [saved, setSaved] = useState(false);
 const [syncSalePriceToSameVariant, setSyncSalePriceToSameVariant] = useState(true);
 const [syncAllLocations, setSyncAllLocations] = useState(false);
 const [syncAllLocationsSaving, setSyncAllLocationsSaving] = useState(false);
 const [syncAllLocationsSaved, setSyncAllLocationsSaved] = useState(false);
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
 const [adminTotpEnabled, setAdminTotpEnabled] = useState(false);
 const [refundOtpThreshold, setRefundOtpThreshold] = useState<number>(50);
 const [totpSetupQr, setTotpSetupQr] = useState<string | null>(null);
 const [totpSetupSecret, setTotpSetupSecret] = useState<string | null>(null);
 const [totpVerifyCode, setTotpVerifyCode] = useState("");
 const [totpDisableCode, setTotpDisableCode] = useState("");
 const [totpBusy, setTotpBusy] = useState(false);
 const [totpMessage, setTotpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 useEffect(() => {
 setSelected(currencyCode);
 }, [currencyCode]);

 useEffect(() => {
 getInventorySettings()
 .then((res) => {
 if (res.success && res.data != null) {
  setSyncSalePriceToSameVariant(res.data.syncSalePriceToSameVariant !== false);
  setSyncAllLocations(res.data.syncAllLocations === true);
 }
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
  if (typeof res.data.adminTotpEnabled === "boolean") {
  setAdminTotpEnabled(res.data.adminTotpEnabled);
  }
  if (typeof res.data.refundOtpThreshold === "number") {
  setRefundOtpThreshold(res.data.refundOtpThreshold);
  }
 }
 })
 .finally(() => setSalesModeLoading(false));
 }, []);

 const handleStartTotpSetup = useCallback(async () => {
 if (!canManageSalesMode) return;
 setTotpBusy(true);
 setTotpMessage(null);
 try {
 const res = await setupAdminTotp();
 if (res.success && res.data) {
  setTotpSetupQr(res.data.qrDataUrl);
  setTotpSetupSecret(res.data.secret);
  setTotpVerifyCode("");
 } else {
  setTotpMessage({ type: "error", text: res.message || "Could not start 2FA setup" });
 }
 } finally {
 setTotpBusy(false);
 }
 }, [canManageSalesMode]);

 const handleVerifyTotp = useCallback(async () => {
 if (!totpVerifyCode.trim()) return;
 setTotpBusy(true);
 setTotpMessage(null);
 try {
 const res = await verifyAndEnableAdminTotp(totpVerifyCode.trim());
 if (res.success) {
  setAdminTotpEnabled(true);
  setTotpSetupQr(null);
  setTotpSetupSecret(null);
  setTotpVerifyCode("");
  setTotpMessage({ type: "success", text: "Google Authenticator enabled. High-value refunds will now require this code." });
 } else {
  setTotpMessage({ type: "error", text: res.message || "Invalid code" });
 }
 } finally {
 setTotpBusy(false);
 }
 }, [totpVerifyCode]);

 const handleDisableTotp = useCallback(async () => {
 if (!totpDisableCode.trim()) return;
 setTotpBusy(true);
 setTotpMessage(null);
 try {
 const res = await disableAdminTotp(totpDisableCode.trim());
 if (res.success) {
  setAdminTotpEnabled(false);
  setTotpDisableCode("");
  setTotpMessage({ type: "success", text: "Google Authenticator disabled." });
 } else {
  setTotpMessage({ type: "error", text: res.message || "Could not disable 2FA" });
 }
 } finally {
 setTotpBusy(false);
 }
 }, [totpDisableCode]);

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

 const handleSyncAllLocationsToggle = useCallback(async (enabled: boolean) => {
 setSyncAllLocations(enabled);
 setSyncAllLocationsSaving(true);
 setSyncAllLocationsSaved(false);
 try {
 const res = await updateInventorySettings({ syncAllLocations: enabled });
 if (res.success) {
 setSyncAllLocationsSaved(true);
 setTimeout(() => setSyncAllLocationsSaved(false), 3000);
 } else {
 setSyncAllLocations(!enabled);
 }
 } catch {
 setSyncAllLocations(!enabled);
 } finally {
 setSyncAllLocationsSaving(false);
 }
 }, []);

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

 {/* Row 2.6: Sync inventory across all locations */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
  <Globe className="h-5 w-5 text-orange-500" />
  Inventory location scope on Create Sales
 </h2>
 <p className="text-sm text-gray-500 mb-4">
  Controls whether the <strong>Create Sales</strong> page shows inventory <strong>only from the selected location</strong> or
  <strong> from all locations</strong>. When <strong>on</strong>, the selected location filter is ignored and stock from every
  location is visible in the product grid and typeahead. When <strong>off</strong> (default), only items assigned to the
  selected location are shown.
 </p>
 {inventorySettingsLoading ? (
  <div className="flex items-center gap-2 text-gray-500 py-2">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
 ) : (
  <div className="flex flex-col gap-3">
  <div className="flex items-center gap-3">
   <span className={`text-sm font-medium ${!syncAllLocations ? "text-gray-900" : "text-gray-500"}`}>
   Location-wise (default)
   </span>
   <button
   type="button"
   role="switch"
   aria-checked={syncAllLocations}
   disabled={syncAllLocationsSaving}
   onClick={() => handleSyncAllLocationsToggle(!syncAllLocations)}
   className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
   syncAllLocations ? "bg-orange-500" : "bg-gray-200"
   }`}
   >
   <span
   className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
   syncAllLocations ? "translate-x-5" : "translate-x-1"
   }`}
   />
   </button>
   <span className={`text-sm font-medium ${syncAllLocations ? "text-gray-900" : "text-gray-500"}`}>
   Sync all locations
   </span>
  </div>
  <div className="flex items-center gap-2 text-sm text-gray-500">
   {syncAllLocationsSaving && (
   <>
   <Loader2 className="h-4 w-4 animate-spin" /> Saving…
   </>
   )}
   {syncAllLocationsSaved && !syncAllLocationsSaving && (
   <span className="text-green-600">Saved</span>
   )}
  </div>
  </div>
 )}
 </div>

 {/* Admin Google Authenticator (for high-value refund approval) */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
  <ShieldCheck className="h-5 w-5 text-orange-500" />
  Admin Google Authenticator (refund approval)
 </h2>
 <p className="text-sm text-gray-500 mb-4">
  Connect Google Authenticator once. Whenever any user issues a <strong>refund over {refundOtpThreshold}</strong>,
  the system will ask for the admin&apos;s current 6-digit code before the refund is processed.
 </p>
 {totpMessage && (
  <div
  className={`mb-4 px-3 py-2 rounded-lg text-sm ${
   totpMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
  }`}
  >
  {totpMessage.text}
  </div>
 )}

 {!adminTotpEnabled && !totpSetupQr && (
  <button
  type="button"
  disabled={!canManageSalesMode || totpBusy}
  onClick={handleStartTotpSetup}
  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {totpBusy && <Loader2 className="h-4 w-4 animate-spin" />}
  Connect Google Authenticator
  </button>
 )}

 {!adminTotpEnabled && totpSetupQr && (
  <div className="flex flex-col md:flex-row gap-6 items-start">
  <div className="flex flex-col items-center gap-2">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={totpSetupQr} alt="Google Authenticator QR code" className="w-44 h-44 border border-gray-200 rounded-lg" />
   <p className="text-xs text-gray-500 max-w-[200px] text-center">
   Scan with Google Authenticator (or any TOTP app).
   </p>
  </div>
  <div className="flex-1 min-w-0">
   <p className="text-sm text-gray-700 mb-2">
   Can&apos;t scan? Enter this secret manually in the app:
   </p>
   <code className="block bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-mono break-all mb-4">
   {totpSetupSecret}
   </code>
   <label className="block text-sm font-medium text-gray-700 mb-2">
   Enter the current 6-digit code to confirm
   </label>
   <div className="flex items-center gap-2">
   <input
    type="text"
    inputMode="numeric"
    autoComplete="one-time-code"
    maxLength={6}
    value={totpVerifyCode}
    onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
    placeholder="123456"
    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-800 tracking-widest text-center font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
   />
   <button
    type="button"
    disabled={totpBusy || totpVerifyCode.length !== 6}
    onClick={handleVerifyTotp}
    className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
   >
    {totpBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & enable"}
   </button>
   <button
    type="button"
    disabled={totpBusy}
    onClick={() => { setTotpSetupQr(null); setTotpSetupSecret(null); setTotpVerifyCode(""); setTotpMessage(null); }}
    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
   >
    Cancel
   </button>
   </div>
  </div>
  </div>
 )}

 {adminTotpEnabled && (
  <div className="flex flex-col gap-3">
  <div className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 w-fit">
   <Check className="h-4 w-4" />
   Connected — refunds over {refundOtpThreshold} will require the admin&apos;s code.
  </div>
  <div className="flex items-center gap-2">
   <input
   type="text"
   inputMode="numeric"
   autoComplete="one-time-code"
   maxLength={6}
   value={totpDisableCode}
   onChange={(e) => setTotpDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
   placeholder="Current code"
   className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-gray-800 tracking-widest text-center font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
   />
   <button
   type="button"
   disabled={!canManageSalesMode || totpBusy || totpDisableCode.length !== 6}
   onClick={handleDisableTotp}
   className="px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   Disable
   </button>
  </div>
  </div>
 )}

 {!canManageSalesMode && (
  <p className="text-sm text-neutral-700 mt-3 bg-neutral-50 px-2 py-1 rounded-md w-fit">
  Only users with <span className="font-medium">settings.manage</span> can change this.
  </p>
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

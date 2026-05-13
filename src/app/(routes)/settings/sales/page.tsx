"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, User, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
 getGeneralSettings,
 updateSalesAutoSelectAccount,
 updateSalesMode,
 type GeneralSettingsData,
} from "./service/generalSettingsApi";
import { customerApi } from "../../peoples/customers/service/customerApi";
import { supplierApi } from "../../peoples/suppliers/service/supplierApi";
import type { Customer } from "../../peoples/customers/types";
import type { Supplier } from "../../peoples/suppliers/types";

type AccountOption = (Customer | Supplier) & { _id: string; name: string };

const searchable = (a: AccountOption, q: string): boolean => {
 const qq = q.toLowerCase();
 return Boolean(
 a.name.toLowerCase().includes(qq) ||
 (a.phone && a.phone.includes(q)) ||
 (a.email && a.email.toLowerCase().includes(qq)) ||
 ("contactName" in a && (a as Customer).contactName?.toLowerCase().includes(qq)) ||
 ("contactPerson" in a && (a as Supplier).contactPerson?.toLowerCase().includes(qq))
 );
};

export default function SalesSettingsPage() {
 const { can, loading: permLoading } = usePermissions();
 const canManage = can("settings.manage");
 const canView = can("settings.view");

 const [settings, setSettings] = useState<GeneralSettingsData | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 const [enabled, setEnabled] = useState(false);
 const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);
 const [defaultAccountName, setDefaultAccountName] = useState<string | null>(null);
 const [retailModeEnabled, setRetailModeEnabled] = useState(false);
 const [salesModeSaving, setSalesModeSaving] = useState(false);

 const [accounts, setAccounts] = useState<AccountOption[]>([]);
 const [accountsLoading, setAccountsLoading] = useState(false);
 const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
 const [accountSearch, setAccountSearch] = useState("");

 useEffect(() => {
 if (!canView) return;
 setLoading(true);
 getGeneralSettings()
 .then((res) => {
 if (res.success && res.data) {
  setSettings(res.data);
  setEnabled(res.data.salesAutoSelectAccountEnabled);
  setDefaultAccountId(res.data.defaultSalesAccountId ?? null);
  setDefaultAccountName(res.data.defaultAccount?.name ?? null);
  setRetailModeEnabled(res.data.retailModeEnabled ?? false);
 }
 })
 .finally(() => setLoading(false));
 }, [canView]);

 useEffect(() => {
 if (!canView || !accountDropdownOpen) return;
 setAccountsLoading(true);
 Promise.all([
 customerApi.getAll({ status: "active", limit: 500, sortBy: "newest" }).then((r) => (r.success && Array.isArray(r.data) ? (r.data as Customer[]) : [])),
 supplierApi.getSuppliers({ isActive: true, limit: 500 }).then((r) => (r.success && Array.isArray(r.data) ? (r.data as Supplier[]) : [])),
 ])
 .then(([customers, suppliers]) =>
 setAccounts(
  ([...customers, ...suppliers].filter((a) => a._id != null && a.name != null) as AccountOption[])
 )
 )
 .catch(() => setAccounts([]))
 .finally(() => setAccountsLoading(false));
 }, [canView, accountDropdownOpen]);

 const filteredAccounts = useMemo(
 () => (accountSearch.trim() === "" ? accounts : accounts.filter((a) => searchable(a, accountSearch.trim()))),
 [accounts, accountSearch]
 );

 const handleSave = async () => {
 if (!canManage) return;
 setSaving(true);
 setMessage(null);
 try {
 const res = await updateSalesAutoSelectAccount({
 enabled,
 defaultSalesAccountId: defaultAccountId,
 });
 if (res.success && res.data) {
 setSettings(res.data);
 setDefaultAccountName(res.data.defaultAccount?.name ?? null);
 setMessage({ type: "success", text: "Settings saved." });
 setTimeout(() => setMessage(null), 3000);
 } else {
 setMessage({ type: "error", text: res.message || "Failed to save settings." });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to save settings." });
 } finally {
 setSaving(false);
 }
 };

 const handleClearDefault = async () => {
 if (!canManage) return;
 setSaving(true);
 setMessage(null);
 try {
 const res = await updateSalesAutoSelectAccount({
 enabled,
 defaultSalesAccountId: null,
 });
 if (res.success && res.data) {
 setSettings(res.data);
 setDefaultAccountId(null);
 setDefaultAccountName(null);
 setMessage({ type: "success", text: "Default account cleared." });
 setTimeout(() => setMessage(null), 3000);
 } else {
 setMessage({ type: "error", text: res.message || "Failed to clear default account." });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to clear default account." });
 } finally {
 setSaving(false);
 }
 };

 const selectAccount = (a: AccountOption) => {
 setDefaultAccountId(a._id);
 setDefaultAccountName(a.name);
 setAccountDropdownOpen(false);
 setAccountSearch("");
 };

 const handleSalesModeToggle = async (value: boolean) => {
 if (!canManage) return;
 setSalesModeSaving(true);
 setMessage(null);
 try {
 const res = await updateSalesMode({ retailModeEnabled: value });
 if (res.success && res.data) {
 setRetailModeEnabled(res.data.retailModeEnabled ?? false);
 setSettings(res.data);
 setMessage({ type: "success", text: value ? "Retail Mode enabled." : "Wholesale Mode enabled." });
 setTimeout(() => setMessage(null), 3000);
 } else {
 setMessage({ type: "error", text: res.message || "Failed to update sales mode." });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to update sales mode." });
 } finally {
 setSalesModeSaving(false);
 }
 };

 if (permLoading || !canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {!canView && (
  <p className="text-gray-600">You do not have permission to view settings.</p>
 )}
 {permLoading && canView && (
  <div className="flex items-center gap-2 text-gray-600">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
 )}
 </div>
 );
 }

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
  <div className="p-2 bg-orange-100 rounded-lg">
  <User className="h-6 w-6 text-orange-600" />
  </div>
  <div>
  <h1 className="text-2xl font-semibold text-gray-800">Sales Settings</h1>
  <p className="text-gray-500 text-sm mt-1">
  Default account and Create Sales behaviour
  </p>
  </div>
 </div>
 </div>

 {message && (
 <div
  className={`mb-4 px-4 py-3 rounded-lg text-sm ${
  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="max-w-xl bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-lg font-medium text-gray-800 mb-4">Sales Mode</h2>
 <p className="text-sm text-gray-500 mb-4">
  Choose how Create Sales behaves: <strong>Wholesale</strong> requires a customer account and allows credit; <strong>Retail (Walk-in)</strong> uses Walk-in Customer by default and requires full payment (no credit).
 </p>
 {loading ? (
  <div className="flex items-center gap-2 text-gray-500 py-2">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
 ) : (
  <div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
  <span className={`text-sm font-medium ${!retailModeEnabled ? "text-gray-900" : "text-gray-500"}`}>Wholesale</span>
  <button
  type="button"
  role="switch"
  aria-checked={retailModeEnabled}
  disabled={!canManage || salesModeSaving}
  onClick={() => canManage && handleSalesModeToggle(!retailModeEnabled)}
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
  <span className={`text-sm font-medium ${retailModeEnabled ? "text-gray-900" : "text-gray-500"}`}>Retail (Walk-in)</span>
  </div>
  {salesModeSaving && <span className="text-sm text-gray-500">Saving…</span>}
  </div>
 )}
 </div>

 <div className="max-w-xl bg-white rounded-lg shadow-sm border border-gray-200 p-6">
 <h2 className="text-lg font-medium text-gray-800 mb-4">Default Sales Account auto-select</h2>

 {loading ? (
  <div className="flex items-center gap-2 text-gray-500 py-4">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading settings…
  </div>
 ) : (
  <div className="space-y-5">
  <div className="flex items-center justify-between gap-4">
  <div>
  <p className="font-medium text-gray-800">Auto-select default account on Create Sales</p>
  <p className="text-sm text-gray-500 mt-0.5">
   When enabled, the Create Sales page will pre-select the default account below (if none is already selected).
  </p>
  </div>
  <button
  type="button"
  role="switch"
  aria-checked={enabled}
  disabled={!canManage}
  onClick={() => canManage && setEnabled((e) => !e)}
  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
   enabled ? "bg-orange-500" : "bg-gray-200"
  }`}
  >
  <span
   className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
   enabled ? "translate-x-5" : "translate-x-1"
   }`}
  />
  </button>
  </div>

  {!enabled && (
  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
  Disabled — Create Sales will not auto-select an account.
  </p>
  )}
  {enabled && !defaultAccountId && (
  <p className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded-lg">
  Enabled but no default account chosen.
  </p>
  )}

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Default Sales Account</label>
  <div className="relative">
  <button
   type="button"
   onClick={() => canManage && setAccountDropdownOpen((o) => !o)}
   disabled={!canManage}
   className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 bg-white text-left text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
   <span className="truncate">
   {defaultAccountName || "Select customer or supplier…"}
   </span>
   <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 ${accountDropdownOpen ? "rotate-180" : ""}`} />
  </button>
  {accountDropdownOpen && (
   <>
   <div className="fixed inset-0 z-40" aria-hidden onClick={() => setAccountDropdownOpen(false)} />
   <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-hidden flex flex-col">
   <div className="p-2 border-b border-gray-100">
   <input
    type="search"
    value={accountSearch}
    onChange={(e) => setAccountSearch(e.target.value)}
    placeholder="Search by name, phone, email…"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
    autoFocus
   />
   </div>
   <ul className="overflow-y-auto py-1">
   {accountsLoading ? (
    <li className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </li>
   ) : filteredAccounts.length === 0 ? (
    <li className="px-4 py-3 text-sm text-gray-500">No accounts found</li>
   ) : (
    filteredAccounts.map((a) => (
    <li key={a._id}>
    <button
    type="button"
    onClick={() => selectAccount(a)}
    className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 ${
     defaultAccountId === a._id ? "bg-orange-50 text-orange-700" : ""
    }`}
    >
    {a.name}
    </button>
    </li>
    ))
   )}
   </ul>
   </div>
   </>
  )}
  </div>
  <p className="text-xs text-gray-500 mt-1">
  You can set or change the default even when auto-select is disabled (it will apply when you enable it).
  </p>
  </div>

  {canManage && (
  <div className="flex flex-wrap items-center gap-3 pt-2">
  <button
   type="button"
   onClick={handleSave}
   disabled={saving}
   className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
   {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Save
  </button>
  {defaultAccountId && (
   <button
   type="button"
   onClick={handleClearDefault}
   disabled={saving}
   className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   Clear default account
   </button>
  )}
  </div>
  )}
  </div>
 )}
 </div>
 </div>
 );
}

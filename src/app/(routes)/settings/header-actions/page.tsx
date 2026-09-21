"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutPanelTop, Loader2, PlusCircle, Wrench, Truck, RotateCcw, ShoppingBag, FileSpreadsheet, Boxes, Globe, FileText, BookOpen } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
 fetchHeaderQuickActionsVisibility,
 saveHeaderQuickActionsVisibility,
 invalidateHeaderQuickActionsCache,
 type HeaderQuickActionsVisibility,
 HEADER_QUICK_ACTIONS_DEFAULTS,
} from "@/lib/header-quick-actions";

type Row = {
 key: keyof HeaderQuickActionsVisibility;
 label: string;
 description: string;
 Icon: React.ComponentType<{ className?: string }>;
};

const ROWS: Row[] = [
 {
 key: "showNewSale",
 label: "New Sale",
 description: "Shortcut to Create Sales (orange button).",
 Icon: PlusCircle,
 },
 {
 key: "showNewRepair",
 label: "New Repair",
 description: "Shortcut to add a repair ticket.",
 Icon: Wrench,
 },
 {
 key: "showParcel",
 label: "Purchase",
 description: "Shortcut to add a purchase.",
 Icon: Truck,
 },
 {
 key: "showReturn",
 label: "Return",
 description: "Shortcut to sales return.",
 Icon: RotateCcw,
 },
 {
 key: "showSalesModeToggle",
 label: "Retail / Wholesale toggle",
 description: "Purple header control to switch sales mode (managers with settings access only).",
 Icon: ShoppingBag,
 },
 {
 key: "showAccounts",
 label: "Accounts",
 description: "Shortcut to Account Statement (requires accounts.view).",
 Icon: FileSpreadsheet,
 },
 {
 key: "showStockList",
 label: "Stock List",
 description: "Shortcut to Inventory → Stock List tab.",
 Icon: Boxes,
 },
 {
 key: "showSalesOnline",
 label: "Sales",
 description: "Shortcut to Sales (Online Orders) page.",
 Icon: Globe,
 },
 {
 key: "showNewInvoice",
 label: "Invoice",
 description: "Shortcut to Create Invoice.",
 Icon: FileText,
 },
 {
 key: "showNotebooks",
 label: "Notes",
 description: "Shortcut to Notebooks.",
 Icon: BookOpen,
 },
];

export default function HeaderActionsSettingsPage() {
 const { can, loading: permLoading } = usePermissions();
 const canView = can("settings.view");
 const canManage = can("settings.manage");
 const [vis, setVis] = useState<HeaderQuickActionsVisibility>(HEADER_QUICK_ACTIONS_DEFAULTS);
 const [hydrated, setHydrated] = useState(false);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 invalidateHeaderQuickActionsCache();
 fetchHeaderQuickActionsVisibility().then((data) => {
 setVis(data);
 setHydrated(true);
 });
 }, []);

 useEffect(() => {
 const onChange = (e: Event) => {
 const d = (e as CustomEvent<HeaderQuickActionsVisibility>).detail;
 if (d) setVis(d);
 };
 window.addEventListener("pos-header-quick-actions-change", onChange);
 return () => window.removeEventListener("pos-header-quick-actions-change", onChange);
 }, []);

 const toggle = useCallback(
 async (key: keyof HeaderQuickActionsVisibility) => {
 if (!canManage || saving) return;
 const next = { ...vis, [key]: !vis[key] };
 setVis(next);
 setSaving(true);
 await saveHeaderQuickActionsVisibility(next);
 setSaving(false);
 },
 [canManage, vis, saving]
 );

 const resetDefaults = useCallback(async () => {
 if (!canManage || saving) return;
 setVis(HEADER_QUICK_ACTIONS_DEFAULTS);
 setSaving(true);
 await saveHeaderQuickActionsVisibility(HEADER_QUICK_ACTIONS_DEFAULTS);
 setSaving(false);
 }, [canManage, saving]);

 if (permLoading || !canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {!canView && !permLoading && <p className="text-gray-600">You do not have permission to view settings.</p>}
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
 <Link href="/settings" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 text-sm mb-4">
  <ArrowLeft className="h-4 w-4" />
  Back to Settings
 </Link>
 <div className="flex items-center gap-3">
  <div className="p-2 bg-neutral-100 rounded-lg">
  <LayoutPanelTop className="h-6 w-6 text-neutral-700" />
  </div>
  <div>
  <h1 className="text-2xl font-semibold text-gray-800">Header quick actions</h1>
  <p className="text-gray-500 text-sm mt-1">Show or hide top bar shortcuts next to search.</p>
  </div>
 </div>
 </div>

 <div className="max-w-4xl bg-white rounded-lg shadow-sm border border-gray-200 p-6">
 <p className="text-sm text-gray-600 mb-6">
  Disabled buttons stay available from the sidebar if the user has permission. Only users with{" "}
  <span className="font-medium">settings.manage</span> can change these toggles.
 </p>

 {!hydrated ? (
  <div className="flex items-center gap-2 text-gray-500 py-4">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
 ) : (
  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
  {ROWS.map(({ key, label, description, Icon }) => (
  <li key={key} className="flex items-center justify-between gap-4 py-4 border-b border-gray-100">
  <div className="flex items-start gap-3 min-w-0">
   <div className="p-2 rounded-lg bg-gray-100 text-gray-600 shrink-0">
   <Icon className="h-4 w-4" />
   </div>
   <div className="min-w-0">
   <p className="font-medium text-gray-900">{label}</p>
   <p className="text-sm text-gray-500 mt-0.5">{description}</p>
   </div>
  </div>
  <button
   type="button"
   role="switch"
   aria-checked={vis[key]}
   disabled={!canManage || saving}
   onClick={() => toggle(key)}
   className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
   vis[key] ? "bg-orange-500" : "bg-gray-200"
   }`}
  >
   <span
   className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
   vis[key] ? "translate-x-5" : "translate-x-1"
   }`}
   />
  </button>
  </li>
  ))}
  </ul>
 )}

 {canManage && hydrated && (
  <div className="mt-6 pt-6 border-t border-gray-100">
  <button
  type="button"
  onClick={resetDefaults}
  disabled={saving}
  className="text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
  >
  Reset all to visible
  </button>
  </div>
 )}
 </div>
 </div>
 );
}

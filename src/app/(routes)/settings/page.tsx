"use client";

import React, { useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 Settings,
 Info,
 FileText,
 Landmark,
 Mail,
 Receipt,
 ChevronRight,
 SlidersHorizontal,
 History,
 Shield,
 ShoppingCart,
 Printer,
 LayoutPanelTop,
 MessageCircle,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface SettingsItem {
 title: string;
 description: string;
 icon: React.ElementType;
 path: string;
 color: string;
 /** If set, item is only shown when user has this permission (or any of them if array) */
 permission?: string | string[];
}

const allSettingsItems: SettingsItem[] = [
 {
 title: "General",
 description: "Default currency and display preferences",
 icon: SlidersHorizontal,
 path: "/settings/general",
 color: "bg-slate-100 text-slate-600",
 },
 {
 title: "My sales mode",
 description: "Retail (walk-in) or wholesale for your account on Create Sales",
 icon: ShoppingCart,
 path: "/settings/my-sales-mode",
 color: "bg-orange-100 text-orange-600",
 permission: "settings.sales_mode",
 },
 {
 title: "Sales",
 description: "Default sales account and Create Sales auto-select",
 icon: ShoppingCart,
 path: "/settings/sales",
 color: "bg-emerald-100 text-emerald-600",
 permission: "settings.view",
 },
 {
 title: "Header quick actions",
 description: "Show or hide New Sale, Repair, Purchase, Return, and sales mode in the top bar",
 icon: LayoutPanelTop,
 path: "/settings/header-actions",
 color: "bg-neutral-100 text-neutral-700",
 permission: "settings.view",
 },
 {
 title: "Printing",
 description: "Silent printing (receipt + labels) via local print agent",
 icon: Printer,
 path: "/settings/printing",
 color: "bg-neutral-100 text-neutral-600",
 permission: ["settings.view", "settings.printing", "settings.manage"],
 },
 {
 title: "About",
 description: "Configure app title, name, logo, and company details",
 icon: Info,
 path: "/settings/about",
 color: "bg-blue-100 text-blue-600",
 },
 {
 title: "Notes & Terms",
 description: "Manage terms and conditions, notes for invoices",
 icon: FileText,
 path: "/settings/notes-terms",
 color: "bg-green-100 text-green-600",
 },
 {
 title: "Bank Accounts",
 description: "Configure bank account information for payments",
 icon: Landmark,
 path: "/bank-accounts",
 color: "bg-neutral-100 text-neutral-600",
 },
 {
 title: "Email",
 description: "Configure email settings and templates",
 icon: Mail,
 path: "/settings/email",
 color: "bg-neutral-100 text-neutral-600",
 },
 {
 title: "Tax",
 description: "Manage tax rates and tax settings",
 icon: Receipt,
 path: "/settings/tax",
 color: "bg-yellow-100 text-yellow-600",
 },
 {
 title: "WhatsApp",
 description: "Connect WhatsApp via QR and send a test message",
 icon: MessageCircle,
 path: "/settings/whatsapp",
 color: "bg-green-100 text-green-600",
 },
 {
 title: "Activity Log",
 description: "View system-wide audit and activity (admin/manager)",
 icon: History,
 path: "/settings/activity-log",
 color: "bg-neutral-100 text-neutral-600",
 permission: "audit.view",
 },
 {
 title: "Admin (Users & Roles)",
 description: "Manage users, roles, and permissions (RBAC)",
 icon: Shield,
 path: "/settings/admin",
 color: "bg-neutral-100 text-neutral-600",
 permission: ["user.manage", "role.manage", "audit.view"],
 },
];

const SettingsPage = () => {
 const router = useRouter();
 const { can, loading } = usePermissions();
 const canSeeSettings =
  can("settings.view") ||
  can("settings.printing") ||
  can("settings.sales_mode") ||
  can("audit.view") ||
  can("user.manage") ||
  can("role.manage");

 useEffect(() => {
 if (loading) return;
 if (!canSeeSettings) {
 router.replace("/dashboard");
 }
 }, [loading, canSeeSettings, router]);

 const settingsItems = useMemo(() => {
 if (loading) {
 return allSettingsItems.filter((item) => !item.permission);
 }
 const filtered = allSettingsItems.filter((item) => {
 if (!item.permission) return true;
 const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
 return perms.some((p) => can(p));
 });
 return filtered;
 }, [can, loading]);

 if (!loading && !canSeeSettings) {
 return null;
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 {/* Page Header */}
 <div className="mb-4 @[768px]:mb-6">
 <div className="flex items-center gap-3">
  <div className="p-2 bg-orange-100 rounded-lg">
  <Settings className="h-5 w-5 @[768px]:h-6 @[768px]:w-6 text-orange-500" />
  </div>
  <div>
  <h1 className="text-xl @[768px]:text-2xl font-semibold text-gray-800">Settings</h1>
  <p className="text-gray-500 text-xs @[768px]:text-sm mt-1">
  Manage your application settings and preferences
  </p>
  </div>
 </div>
 </div>

 {/* Settings Grid */}
 <div className="grid grid-cols-1 @[768px]:grid-cols-2 @[1024px]:grid-cols-3 gap-3 @[768px]:gap-4">
 {settingsItems.map((item, index) => (
  <Link
  key={index}
  href={item.path}
  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 @[768px]:p-6 hover:shadow-md hover:border-orange-200 transition-all group"
  >
  <div className="flex items-start justify-between">
  <div className={`p-2 @[768px]:p-3 rounded-lg ${item.color}`}>
  <item.icon className="h-5 w-5 @[768px]:h-6 @[768px]:w-6" />
  </div>
  <ChevronRight className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
  </div>
  <h3 className="text-base @[768px]:text-lg font-medium text-gray-800 mt-3 @[768px]:mt-4">{item.title}</h3>
  <p className="text-xs @[768px]:text-sm text-gray-500 mt-1">{item.description}</p>
  </Link>
 ))}
 </div>
 </div>
 );
};

export default SettingsPage;

"use client";

import React from "react";
import Link from "next/link";
import { Trash2, User as UserIcon, Mail, Shield, MapPin } from "lucide-react";
import { useDashboard } from "./hooks/useDashboard";
import { usePermissions } from "@/hooks/usePermissions";
import {
 DashboardKpiTiles,
 DashboardAlerts,
 DashboardDateRange,
 RepairsPipelineWidget,
 RecentInvoicesTable,
 LowStockTable,
 ActivityPreview,
} from "./components";

function StaffProfileDashboard() {
 const { user, loading } = usePermissions();
 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
  <div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-orange-500" />
  </div>
 </div>
 );
 }
 if (!user) {
 return (
 <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md">
  <p className="text-gray-600">Could not load your profile. Try refreshing the page.</p>
  </div>
 </div>
 );
 }
 const roleNames = (user.roles || []).map((r) => r.name).filter(Boolean);
 const roleLabel = roleNames.length > 0 ? roleNames.join(", ") : (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—");
 const initials = (user.name || user.email || "?")
 .split(/\s+/)
 .map((s) => s.charAt(0).toUpperCase())
 .filter(Boolean)
 .slice(0, 2)
 .join("");

 return (
 <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
 <div className="max-w-2xl mx-auto">
 <div className="mb-6">
  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome, {user.name?.split(" ")[0] || "User"}</h1>
  <p className="text-xs sm:text-sm text-gray-500 mt-1">Your account details and assigned role.</p>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="p-5 sm:p-6 flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
  <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-orange-500 text-white text-lg sm:text-xl font-bold shrink-0">
   {initials || <UserIcon className="h-7 w-7" />}
  </div>
  <div className="min-w-0">
   <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{user.name || "—"}</p>
   <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email || "—"}</p>
  </div>
  </div>

  <dl className="divide-y divide-gray-100">
  <div className="px-5 sm:px-6 py-3 sm:py-4 flex items-start gap-3">
   <UserIcon className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
   <div className="flex-1 min-w-0">
   <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</dt>
   <dd className="text-sm text-gray-900 mt-0.5">{user.name || "—"}</dd>
   </div>
  </div>
  <div className="px-5 sm:px-6 py-3 sm:py-4 flex items-start gap-3">
   <Mail className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
   <div className="flex-1 min-w-0">
   <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</dt>
   <dd className="text-sm text-gray-900 mt-0.5 break-all">{user.email || "—"}</dd>
   </div>
  </div>
  <div className="px-5 sm:px-6 py-3 sm:py-4 flex items-start gap-3">
   <Shield className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
   <div className="flex-1 min-w-0">
   <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</dt>
   <dd className="mt-1 flex flex-wrap gap-1.5">
   {roleNames.length > 0 ? (
    roleNames.map((r) => (
    <span key={r} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
    {r}
    </span>
    ))
   ) : (
    <span className="text-sm text-gray-900">{roleLabel}</span>
   )}
   </dd>
   </div>
  </div>
  {(user.assignedLocationIds && user.assignedLocationIds.length > 0) && (
   <div className="px-5 sm:px-6 py-3 sm:py-4 flex items-start gap-3">
   <MapPin className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
   <div className="flex-1 min-w-0">
   <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned locations</dt>
   <dd className="text-sm text-gray-900 mt-0.5">{user.assignedLocationIds.length} location(s) assigned</dd>
   </div>
   </div>
  )}
  </dl>

  <div className="px-5 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
  <p className="text-xs text-gray-500">Need to change your password or update profile?</p>
  <Link
   href="/dashboard/profile"
   className="text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700"
  >
   Manage profile →
  </Link>
  </div>
 </div>
 </div>
 </div>
 );
}

export default function DashboardPage() {
 const { can, loading: permsLoading } = usePermissions();
 if (permsLoading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-orange-500" />
 </div>
 );
 }
 if (!can("dashboard.view")) {
 return <StaffProfileDashboard />;
 }
 return <FullDashboard />;
}

function FullDashboard() {
 const { data, loading, error, range, setRange, dateRange, refresh } = useDashboard();
 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 <div className="mb-3 @[640px]:mb-4 @[768px]:mb-6 flex flex-col gap-2 @[640px]:gap-3 @[768px]:gap-4 @[1024px]:flex-row @[1024px]:items-center @[1024px]:justify-between">
 <div className="min-w-0">
  <h1 className="text-base @[640px]:text-lg @[768px]:text-xl @[1024px]:text-2xl font-bold text-gray-900">Dashboard</h1>
  <p className="text-[10px] @[640px]:text-xs @[768px]:text-sm text-gray-500 mt-0.5">
  Overview of sales, repairs, stock and activity. Data in Europe/London time.
  </p>
 </div>
 <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2 @[768px]:gap-3 @[1024px]:flex-nowrap @[1024px]:justify-end">
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
  className="inline-flex items-center gap-1 @[640px]:gap-1.5 @[768px]:gap-2 px-2 @[640px]:px-2.5 @[768px]:px-3.5 py-1 @[640px]:py-1.5 @[768px]:py-2 rounded-lg text-[10px] @[640px]:text-xs @[768px]:text-sm font-semibold text-red-800 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 active:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
  >
  <Trash2 className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0 text-red-600" />
  <span className="hidden @[640px]:inline">Reset Cache</span>
  </button>
  <DashboardDateRange
  range={range}
  setRange={setRange}
  label={dateRange.label}
  onRefresh={refresh}
  loading={loading}
  />
 </div>
 </div>

 {error && (
 <div className="mb-3 @[640px]:mb-4 @[768px]:mb-6 rounded-lg bg-red-50 border border-red-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-2 @[640px]:py-2.5 @[768px]:py-3 text-red-700 text-[10px] @[640px]:text-xs @[768px]:text-sm">
  {error}
 </div>
 )}

 {loading && !data ? (
 <div className="flex items-center justify-center py-8 @[640px]:py-10 @[768px]:py-12">
  <div className="animate-spin rounded-full h-8 w-8 @[640px]:h-10 @[640px]:w-10 border-2 border-gray-300 border-t-blue-600" />
 </div>
 ) : data ? (
 <>
  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <DashboardKpiTiles kpis={data.kpis} />
  </div>

  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <DashboardAlerts alerts={data.alerts} />
  </div>

  <div className="grid grid-cols-1 @[1024px]:grid-cols-2 gap-3 @[640px]:gap-4 @[768px]:gap-6 @[1024px]:gap-8 mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <RepairsPipelineWidget pipeline={data.repairsPipeline} />
  <div className="min-w-0">
  {data.parcelSummary != null && (
  <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4 @[768px]:p-6 shadow-sm">
   <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900 mb-1.5 @[640px]:mb-2">Purchases</h2>
   <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-600">
   Created today: <strong>{data.parcelSummary.parcelsCreatedToday}</strong> · Pending:{" "}
   <strong>{data.parcelSummary.pendingDispatch}</strong>
   </p>
   <a
   href="/purchases"
   className="mt-1.5 @[640px]:mt-2 inline-block text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800"
   >
   View purchases →
   </a>
  </div>
  )}
  </div>
  </div>

  <div className="grid grid-cols-1 @[1280px]:grid-cols-2 gap-3 @[640px]:gap-4 @[768px]:gap-6 @[1024px]:gap-8 mb-4 @[640px]:mb-5 @[768px]:mb-8">
  <RecentInvoicesTable invoices={data.recentInvoices} />
  <LowStockTable items={data.lowStock} />
  </div>

  {data.topCustomers.length > 0 && (
  <div className="mb-4 @[640px]:mb-5 @[768px]:mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
  <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Top outstanding balances</h2>
  <a href="/account-statement" className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800">
   Account statement
  </a>
  </div>
  <ul className="divide-y divide-gray-200">
  {data.topCustomers.map((c) => (
   <li key={c._id} className="px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 flex flex-wrap justify-between items-center gap-2">
   <span className="font-medium text-gray-900 text-xs @[640px]:text-sm @[768px]:text-base break-all">{c.name}</span>
   <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-semibold text-neutral-600">
   {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(c.balance)}
   </span>
   </li>
  ))}
  </ul>
  </div>
  )}

  <ActivityPreview items={data.activityPreview} />
 </>
 ) : null}
 </div>
 );
}

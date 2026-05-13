"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, AlertCircle, Wrench, Package, CreditCard } from "lucide-react";
import type { DashboardAlerts } from "../service/dashboardApi";
import { usePermissions } from "@/hooks/usePermissions";

interface DashboardAlertsProps {
 alerts: DashboardAlerts;
}

const severityClass = {
 critical: "bg-red-100 border-red-300 text-red-800",
 warning: "bg-neutral-100 border-neutral-300 text-neutral-800",
 info: "bg-blue-100 border-blue-300 text-blue-800",
};

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
 const { can } = usePermissions();
 const rows: { severity: keyof typeof severityClass; label: string; count: number; href: string; icon: React.ReactNode }[] = [];

 if (can("repair.view") && (alerts.overdueRepairs ?? 0) > 0) {
 rows.push({
 severity: "critical",
 label: "Overdue repairs",
 count: alerts.overdueRepairs ?? 0,
 href: "/repairs",
 icon: <Wrench className="h-4 w-4" />,
 });
 }
 if ((can("accounts.view") || can("sale.view")) && (alerts.overdueBalancesCount ?? 0) > 0) {
 rows.push({
 severity: "warning",
 label: "Customers with outstanding balance",
 count: alerts.overdueBalancesCount ?? 0,
 href: "/account-statement",
 icon: <CreditCard className="h-4 w-4" />,
 });
 }
 if ((can("product.view") || can("stock.view")) && (alerts.lowStockCount ?? 0) > 0) {
 rows.push({
 severity: "warning",
 label: "Stock below reorder level",
 count: alerts.lowStockCount ?? 0,
 href: "/inventory/low-stocks",
 icon: <Package className="h-4 w-4" />,
 });
 }
 if ((can("product.view") || can("stock.view")) && (alerts.negativeStockCount ?? 0) > 0) {
 rows.push({
 severity: "critical",
 label: "Negative stock (mismatch)",
 count: alerts.negativeStockCount ?? 0,
 href: "/stock/adjustment",
 icon: <AlertTriangle className="h-4 w-4" />,
 });
 }

 if (rows.length === 0) {
 return (
 <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4 @[768px]:p-6 shadow-sm">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900 mb-2 @[640px]:mb-3 @[768px]:mb-4 flex items-center gap-1.5 @[640px]:gap-2">
  <AlertCircle className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-emerald-500" />
  Actions &amp; Alerts
 </h2>
 <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No urgent alerts right now.</p>
 </div>
 );
 }

 return (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900 flex items-center gap-1.5 @[640px]:gap-2">
  <AlertTriangle className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-neutral-500" />
  Actions &amp; Alerts
 </h2>
 </div>
 <ul className="divide-y divide-gray-200">
 {rows.map((r) => (
  <li key={r.label}>
  <Link
  href={r.href}
  className={`flex flex-wrap items-center justify-between gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 @[768px]:px-6 py-2 @[640px]:py-2.5 @[768px]:py-3 hover:bg-gray-50 transition-colors ${severityClass[r.severity]}`}
  >
  <div className="flex items-center gap-1.5 @[640px]:gap-2 @[768px]:gap-3 min-w-0">
  <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5 @[640px]:[&>svg]:h-4 @[640px]:[&>svg]:w-4">{r.icon}</span>
  <span className="font-medium text-xs @[640px]:text-sm @[768px]:text-base break-words">{r.label}</span>
  <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm opacity-90 shrink-0">({r.count})</span>
  </div>
  <span className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium shrink-0">View →</span>
  </Link>
  </li>
 ))}
 </ul>
 </div>
 );
}

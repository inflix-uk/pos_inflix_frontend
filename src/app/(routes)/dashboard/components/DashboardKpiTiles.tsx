"use client";

import React from "react";
import Link from "next/link";
import {
 PoundSterling,
 ShoppingCart,
 RotateCcw,
 CreditCard,
 Package,
 AlertTriangle,
 Wrench,
 Clock,
 CheckCircle,
 PackageSearch,
} from "lucide-react";
import type { DashboardKpis } from "../service/dashboardApi";
import { usePermissions } from "@/hooks/usePermissions";

function formatCurrency(n: number | undefined | null): string {
 if (n == null || Number.isNaN(n)) return "—";
 return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

interface DashboardKpiTilesProps {
 kpis: DashboardKpis;
}

export function DashboardKpiTiles({ kpis }: DashboardKpiTilesProps) {
 const { can } = usePermissions();
 const showSales = can("sale.view");
 const showInventory = can("product.view") || can("stock.view");
 const showRepairs = can("repair.view");

 const tileClass =
 "bg-white rounded-xl border border-gray-200 p-2 @[640px]:p-3 @[768px]:p-4 shadow-sm hover:shadow-md transition-shadow min-w-0";
 const tileInner = "flex items-center justify-between gap-1.5 @[640px]:gap-2 min-w-0";
 const tileBody = "min-w-0 flex-1";
 const tileLabel = "text-[9px] @[640px]:text-[10px] @[768px]:text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight break-words";
 const tileValue = "text-sm @[640px]:text-base @[768px]:text-lg @[1024px]:text-xl font-bold text-gray-900 mt-0.5 break-words leading-tight";
 const tileIcon = "h-5 w-5 @[640px]:h-5 @[640px]:w-5 @[768px]:h-6 @[768px]:w-6 @[1024px]:h-7 @[1024px]:w-7 @[1280px]:h-8 @[1280px]:w-8 shrink-0";

 return (
 <div className="grid grid-cols-2 @[640px]:grid-cols-3 @[768px]:grid-cols-4 @[1024px]:grid-cols-5 @[1280px]:grid-cols-5 @[1536px]:grid-cols-6 gap-2 @[640px]:gap-2.5 @[768px]:gap-3 @[1024px]:gap-4">
 {showSales && (
 <>
  <Link href="/sales-online-orders" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Sales</p>
  <p className={tileValue}>{formatCurrency(kpis.salesToday)}</p>
  </div>
  <PoundSterling className={`${tileIcon} text-emerald-500`} />
  </div>
  </Link>
  <Link href="/sales-online-orders" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Orders</p>
  <p className={tileValue}>{kpis.ordersToday ?? "—"}</p>
  </div>
  <ShoppingCart className={`${tileIcon} text-blue-500`} />
  </div>
  </Link>
  <Link href="/sales-return" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Returns</p>
  {kpis.returnsCount != null ? (
   <p className={tileValue}>
   {kpis.returnsCount}
   <span className="ml-1 text-[10px] @[640px]:text-xs @[768px]:text-sm font-semibold text-gray-500 whitespace-nowrap">
    ({formatCurrency(kpis.returnsToday)})
   </span>
   </p>
  ) : (
   <p className={tileValue}>—</p>
  )}
  </div>
  <RotateCcw className={`${tileIcon} text-neutral-500`} />
  </div>
  </Link>
  <Link href="/account-statement" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Outstanding</p>
  <p className={tileValue}>{formatCurrency(kpis.outstandingCredit)}</p>
  </div>
  <CreditCard className={`${tileIcon} text-orange-500`} />
  </div>
  </Link>
 </>
 )}
 {showInventory && (
 <>
  <Link href="/inventory/low-stocks" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Low stock</p>
  <p className={tileValue}>{kpis.lowStockCount ?? "—"}</p>
  </div>
  <Package className={`${tileIcon} text-neutral-500`} />
  </div>
  </Link>
  <Link href="/inventory/low-stocks" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Out of stock</p>
  <p className={tileValue}>{kpis.outOfStockCount ?? "—"}</p>
  </div>
  <AlertTriangle className={`${tileIcon} text-red-500`} />
  </div>
  </Link>
 </>
 )}
 {showRepairs && (
 <>
  <Link href="/repairs" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Open repairs</p>
  <p className={tileValue}>{kpis.openRepairs ?? "—"}</p>
  </div>
  <Wrench className={`${tileIcon} text-neutral-500`} />
  </div>
  </Link>
  <Link href="/repairs?status=pending" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Due / Overdue</p>
  <p className={tileValue}>{kpis.dueTodayOverdue ?? "—"}</p>
  </div>
  <Clock className={`${tileIcon} text-red-500`} />
  </div>
  </Link>
  <Link href="/repairs?status=completed" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Ready for pickup</p>
  <p className={tileValue}>{kpis.readyForPickup ?? "—"}</p>
  </div>
  <CheckCircle className={`${tileIcon} text-emerald-500`} />
  </div>
  </Link>
  <Link href="/repairs?status=waiting_parts" className={tileClass}>
  <div className={tileInner}>
  <div className={tileBody}>
  <p className={tileLabel}>Awaiting parts</p>
  <p className={tileValue}>{kpis.awaitingParts ?? "—"}</p>
  </div>
  <PackageSearch className={`${tileIcon} text-neutral-500`} />
  </div>
  </Link>
 </>
 )}
 </div>
 );
}

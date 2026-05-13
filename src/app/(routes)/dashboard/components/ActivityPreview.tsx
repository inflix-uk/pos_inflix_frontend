"use client";

import React from "react";
import Link from "next/link";
import type { ActivityPreviewItem } from "../service/dashboardApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { usePermissions } from "@/hooks/usePermissions";

interface ActivityPreviewProps {
 items: ActivityPreviewItem[];
}

export function ActivityPreview({ items }: ActivityPreviewProps) {
 const { can } = usePermissions();
 if (!can("audit.view")) return null;

 return (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Activity log</h2>
 <Link href="/settings/activity-log" className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800">
  View full log
 </Link>
 </div>
 {items.length === 0 ? (
 <div className="p-3 @[640px]:p-4 @[768px]:p-6 text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500">No recent activity.</div>
 ) : (
 <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
  {items.map((e) => (
  <li key={e.id} className="px-3 @[640px]:px-4 @[768px]:px-6 py-1.5 @[640px]:py-2 text-[11px] @[640px]:text-xs @[768px]:text-sm hover:bg-gray-50">
  <div className="flex flex-wrap items-baseline gap-x-1.5 @[640px]:gap-x-2 gap-y-0.5">
  <span className="text-gray-500 shrink-0">{formatDateTimeLondon(e.occurredAtUtc)}</span>
  <span className="font-medium text-gray-700 break-words">{e.action}</span>
  {e.actorName && <span className="text-gray-500 break-words">by {e.actorName}</span>}
  </div>
  {e.message && <p className="text-gray-600 mt-0.5 truncate">{e.message}</p>}
  {(e.invoiceNo || e.imei) && (
  <p className="text-[10px] @[640px]:text-[11px] @[768px]:text-xs text-gray-400 mt-0.5 break-all">
   {e.invoiceNo && <span>Invoice: {e.invoiceNo}</span>}
   {e.invoiceNo && e.imei && " · "}
   {e.imei && <span>IMEI: {e.imei}</span>}
  </p>
  )}
  </li>
  ))}
 </ul>
 )}
 </div>
 );
}

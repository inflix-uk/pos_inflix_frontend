"use client";

import React from "react";
import { Calendar, RefreshCw } from "lucide-react";
import type { DashboardRange } from "@/lib/dateUtils";

interface DashboardDateRangeProps {
 range: DashboardRange;
 setRange: (r: DashboardRange) => void;
 label: string;
 onRefresh: () => void;
 loading?: boolean;
}

export function DashboardDateRange({
 range,
 setRange,
 label,
 onRefresh,
 loading,
}: DashboardDateRangeProps) {
 return (
 <div className="flex flex-nowrap items-center gap-1.5 @[640px]:gap-2 @[768px]:gap-3 whitespace-nowrap">
 <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 @[640px]:p-1 shrink-0">
 {(["today", "7d", "30d"] as const).map((r) => (
  <button
  key={r}
  type="button"
  onClick={() => setRange(r)}
  className={`px-1.5 @[640px]:px-2 @[768px]:px-3 py-0.5 @[640px]:py-1 @[768px]:py-1.5 rounded-md text-[10px] @[640px]:text-xs @[768px]:text-sm font-medium transition-colors ${
  range === r ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  {r === "today" ? "Today" : r === "7d" ? "7 days" : "30 days"}
  </button>
 ))}
 </div>
 <span className="text-[10px] @[640px]:text-xs @[768px]:text-sm text-gray-500 flex items-center gap-1">
 <Calendar className="h-3 w-3 @[640px]:h-3.5 @[640px]:w-3.5 @[768px]:h-4 @[768px]:w-4" />
 <span className="truncate max-w-[120px] @[640px]:max-w-[160px] @[768px]:max-w-none">{label}</span>
 </span>
 <button
 type="button"
 onClick={onRefresh}
 disabled={loading}
 className="p-1 @[640px]:p-1.5 @[768px]:p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
 title="Refresh"
 >
 <RefreshCw className={`h-3 w-3 @[640px]:h-3.5 @[640px]:w-3.5 @[768px]:h-4 @[768px]:w-4 ${loading ? "animate-spin" : ""}`} />
 </button>
 </div>
 );
}

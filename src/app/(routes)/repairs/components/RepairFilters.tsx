"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
 all: "All statuses",
 pending: "Pending",
 in_progress: "In progress",
 waiting_parts: "Waiting parts",
 completed: "Completed",
 cancelled: "Cancelled",
 collected: "Collected",
};

interface RepairFiltersProps {
 searchTerm: string;
 statusFilter: string;
 sortBy: "newest" | "oldest";
 onSearchChange: (value: string) => void;
 onStatusChange: (value: string) => void;
 onSortChange: (value: "newest" | "oldest") => void;
}

export const RepairFilters: React.FC<RepairFiltersProps> = ({
 searchTerm,
 statusFilter,
 sortBy,
 onSearchChange,
 onStatusChange,
 onSortChange,
}) => {
 const [statusOpen, setStatusOpen] = useState(false);
 const [sortOpen, setSortOpen] = useState(false);

 return (
 <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3 p-3 @[640px]:p-4 border-b border-neutral-200 bg-neutral-50">
 <div className="relative flex-1 min-w-[160px] @[640px]:min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-neutral-400" />
 <input
  type="text"
  placeholder="Search reference, customer, device, IMEI…"
  value={searchTerm}
  onChange={(e) => onSearchChange(e.target.value)}
  className="w-full pl-8 @[640px]:pl-9 pr-3 py-1.5 @[640px]:py-2 border border-slate-200 rounded-lg text-xs @[640px]:text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-shadow"
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <div className="relative">
  <button
  type="button"
  onClick={() => { setStatusOpen((v) => !v); setSortOpen(false); }}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 border border-slate-200 rounded-lg hover:bg-white text-xs @[640px]:text-sm text-slate-700 bg-white transition-colors"
  >
  {STATUS_LABELS[statusFilter] ?? statusFilter}
  <ChevronDown className="h-4 w-4 text-gray-400" />
  </button>
  {statusOpen && (
  <>
  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusOpen(false)} />
  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg z-20 py-1">
  {["all", "pending", "in_progress", "waiting_parts", "completed", "cancelled", "collected"].map((s) => (
   <button
   key={s}
   type="button"
   onClick={() => { onStatusChange(s); setStatusOpen(false); }}
   className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50/60"
   >
   {STATUS_LABELS[s]}
   </button>
  ))}
  </div>
  </>
  )}
 </div>
 <div className="relative">
  <button
  type="button"
  onClick={() => { setSortOpen((v) => !v); setStatusOpen(false); }}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 border border-slate-200 rounded-lg hover:bg-white text-xs @[640px]:text-sm text-slate-700 bg-white transition-colors"
  >
  {sortBy === "newest" ? "Newest first" : "Oldest first"}
  <ChevronDown className="h-4 w-4 text-gray-400" />
  </button>
  {sortOpen && (
  <>
  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setSortOpen(false)} />
  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg z-20 py-1">
  <button
   type="button"
   onClick={() => { onSortChange("newest"); setSortOpen(false); }}
   className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50/60"
  >
   Newest first
  </button>
  <button
   type="button"
   onClick={() => { onSortChange("oldest"); setSortOpen(false); }}
   className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50/60"
  >
   Oldest first
  </button>
  </div>
  </>
  )}
 </div>
 </div>
 </div>
 );
};

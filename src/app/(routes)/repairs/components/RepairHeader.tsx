"use client";

import React from "react";
import Link from "next/link";
import { Plus, RefreshCw, Wrench } from "lucide-react";

interface RepairHeaderProps {
 onAddClick: () => void;
 onRefresh: () => void;
 /** If true, primary "Add repair" links to /repairs/add; optional quick-add opens modal */
 useAddPage?: boolean;
 /** Shown when useAddPage: opens quick-add modal from list */
 onQuickAdd?: () => void;
}

export const RepairHeader: React.FC<RepairHeaderProps> = ({
 onAddClick,
 onRefresh,
 useAddPage,
 onQuickAdd,
}) => {
 return (
 <div className="flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-4">
 <div className="flex items-start gap-3">
 <div
  className="mt-1 hidden @[640px]:block h-11 w-1 rounded-full shrink-0 bg-orange-500"
  aria-hidden
 />
 <div>
  <div className="flex items-center gap-2">
  <Wrench className="h-7 w-7 text-neutral-600 @[640px]:hidden" aria-hidden />
  <h1 className="text-lg @[640px]:text-2xl font-bold text-slate-900 tracking-tight">Repairs</h1>
  </div>
  <p className="text-slate-600 text-[11px] @[640px]:text-sm mt-0.5 max-w-xl">
  Open a job from the reference, print tickets or labels from the list, or add a new repair.
  </p>
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <button
  type="button"
  onClick={onRefresh}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-xs @[640px]:text-sm font-medium transition-colors"
 >
  <RefreshCw className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-neutral-500" />
  <span className="hidden @[420px]:inline">Refresh</span>
 </button>
 {useAddPage ? (
  <>
  {onQuickAdd && (
  <button
  type="button"
  onClick={onQuickAdd}
  className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 rounded-lg border border-neutral-200 bg-neutral-50/80 text-neutral-800 text-xs @[640px]:text-sm font-medium hover:bg-neutral-100/90 transition-colors"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  <span className="hidden @[420px]:inline">Quick add</span>
  </button>
  )}
  <Link
  href="/repairs/add"
  className="flex items-center gap-1.5 @[640px]:gap-2 bg-orange-500 text-white px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 rounded-lg hover:bg-orange-600 text-xs @[640px]:text-sm font-medium transition-all"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  <span className="hidden @[360px]:inline">Add repair</span>
  <span className="@[360px]:hidden">Add</span>
  </Link>
  </>
 ) : (
  <button
  type="button"
  onClick={onAddClick}
  className="flex items-center gap-1.5 @[640px]:gap-2 bg-orange-500 text-white px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 rounded-lg hover:bg-orange-600 text-xs @[640px]:text-sm font-medium transition-all"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  <span className="hidden @[360px]:inline">Add repair</span>
  <span className="@[360px]:hidden">Add</span>
  </button>
 )}
 </div>
 </div>
 );
};

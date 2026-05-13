"use client";

import React from "react";
import Link from "next/link";
import type { RepairsPipeline } from "../service/dashboardApi";
import { usePermissions } from "@/hooks/usePermissions";

interface RepairsPipelineWidgetProps {
 pipeline: RepairsPipeline | null;
}

const STAGES = [
 { key: "pending", label: "Pending", href: "/repairs?status=pending", color: "bg-gray-200 text-gray-800" },
 { key: "in_progress", label: "In progress", href: "/repairs?status=in_progress", color: "bg-blue-200 text-blue-800" },
 { key: "waiting_parts", label: "Awaiting parts", href: "/repairs?status=waiting_parts", color: "bg-neutral-200 text-neutral-800" },
 { key: "completed", label: "Ready", href: "/repairs?status=completed", color: "bg-emerald-200 text-emerald-800" },
 { key: "collected", label: "Collected", href: "/repairs?status=collected", color: "bg-slate-200 text-slate-800" },
 { key: "redo", label: "Redo", href: "/repairs?status=redo", color: "bg-neutral-200 text-neutral-700" },
];

export function RepairsPipelineWidget({ pipeline }: RepairsPipelineWidgetProps) {
 const { can } = usePermissions();
 if (!can("repair.view") || !pipeline) return null;

 return (
 <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4 @[768px]:p-6 shadow-sm">
 <div className="flex flex-wrap items-center justify-between gap-1.5 @[640px]:gap-2 mb-2 @[640px]:mb-3 @[768px]:mb-4">
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Repair pipeline</h2>
 <Link href="/repairs" className="text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium text-blue-600 hover:text-blue-800">
  View all
 </Link>
 </div>
 <div className="flex flex-wrap gap-1.5 @[640px]:gap-2 @[768px]:gap-3">
 {STAGES.map(({ key, label, href, color }) => (
  <Link
  key={key}
  href={href}
  className={`inline-flex items-center gap-1 @[640px]:gap-1.5 @[768px]:gap-2 px-2 @[640px]:px-2.5 @[768px]:px-3 py-0.5 @[640px]:py-1 @[768px]:py-1.5 rounded-lg text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium ${color} hover:opacity-90`}
  >
  <span>{label}</span>
  <span>{(pipeline as unknown as Record<string, number>)[key] ?? 0}</span>
  </Link>
 ))}
 </div>
 </div>
 );
}

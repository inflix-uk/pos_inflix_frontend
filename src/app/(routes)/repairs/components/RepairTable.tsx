"use client";

import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, Loader2, ChevronDown, Printer, Tag, ExternalLink } from "lucide-react";
import type { Repair, RepairStatus } from "../types";

const STATUS_OPTIONS: { value: RepairStatus; label: string }[] = [
 { value: "pending", label: "Pending" },
 { value: "in_progress", label: "In progress" },
 { value: "waiting_parts", label: "Waiting parts" },
 { value: "completed", label: "Completed" },
 { value: "cancelled", label: "Cancelled" },
 { value: "collected", label: "Collected" },
 { value: "redo", label: "REDO" },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const STATUS_COLORS: Record<string, string> = {
 pending: "bg-neutral-100 text-neutral-800",
 in_progress: "bg-blue-100 text-blue-800",
 waiting_parts: "bg-orange-100 text-orange-800",
 completed: "bg-green-100 text-green-800",
 cancelled: "bg-gray-100 text-gray-700",
 collected: "bg-emerald-100 text-emerald-800",
 redo: "bg-neutral-100 text-neutral-700",
};

interface RepairTableProps {
 repairs: Repair[];
 isLoading: boolean;
 onEdit: (repair: Repair) => void;
 onDelete: (repair: Repair) => void;
 /** Open repair detail (same route as edit) — used for reference + “Open” */
 onOpenRepair: (repair: Repair) => void;
 onStatusChange?: (repair: Repair, newStatus: string) => void;
 /** Print 80mm ticket */
 onPrintTicket?: (repair: Repair) => void | Promise<void>;
 /** Print 57×32 label (silent agent or browser fallback) */
 onPrintLabel?: (repair: Repair) => void | Promise<void>;
 /** While label print is in progress for this repair id */
 printingLabelId?: string | null;
 /** While ticket PDF is being built / opened for this repair id */
 printingTicketId?: string | null;
}

function formatDate(val: string | undefined | null): string {
 if (!val) return "—";
 const d = new Date(val);
 return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(val: string | undefined | null): string {
 if (!val) return "—";
 const d = new Date(val);
 return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Collected is often stored as date-only or midnight UTC/local — avoid misleading "00:00". */
function formatCollectedAt(val: string | undefined | null): string {
 if (!val) return "—";
 const trimmed = val.trim();
 if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
 return formatDate(val);
 }
 // e.g. 2026-03-27T00:00:00 from API/forms (no zone) = calendar day only
 if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.\d+)?$/.test(trimmed)) {
 return formatDate(trimmed.slice(0, 10));
 }
 // Midnight with Z or offset (stored as start-of-day)
 if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
 return formatDate(trimmed.slice(0, 10));
 }
 const d = new Date(val);
 if (isNaN(d.getTime())) return "—";
 const utcMidnight =
 d.getUTCHours() === 0 &&
 d.getUTCMinutes() === 0 &&
 d.getUTCSeconds() === 0 &&
 d.getUTCMilliseconds() === 0;
 if (utcMidnight) {
 return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
 }
 return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(val: number | undefined | null): string {
 if (val == null) return "—";
 return `£${Number(val).toFixed(2)}`;
}

function RepairCardRow({
 repair,
 statusClass,
 isStatusOpen,
 setStatusDropdownId,
 statusTriggerRef,
 onOpenRepair,
 onEdit,
 onDelete,
 onStatusChange,
 onPrintTicket,
 onPrintLabel,
 printingLabelId,
 printingTicketId,
}: {
 repair: Repair;
 statusClass: string;
 isStatusOpen: boolean;
 setStatusDropdownId: (id: string | null) => void;
 statusTriggerRef: React.RefObject<HTMLButtonElement | null>;
 onOpenRepair: (r: Repair) => void;
 onEdit: (r: Repair) => void;
 onDelete: (r: Repair) => void;
 onStatusChange?: (r: Repair, s: string) => void;
 onPrintTicket?: (r: Repair) => void | Promise<void>;
 onPrintLabel?: (r: Repair) => void | Promise<void>;
 printingLabelId?: string | null;
 printingTicketId?: string | null;
}) {
 const ref = repair.reference ?? "—";
 return (
 <article className="p-4 hover:bg-neutral-50/30 transition-colors">
 <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
 <button
  type="button"
  onClick={() => onOpenRepair(repair)}
  className="font-semibold text-neutral-700 hover:text-neutral-900 hover:underline text-left text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded min-w-0 break-words"
 >
  {ref}
 </button>
 <div className="shrink-0">
  {onStatusChange ? (
  <button
  ref={isStatusOpen ? statusTriggerRef : undefined}
  type="button"
  onClick={() => setStatusDropdownId(isStatusOpen ? null : repair._id)}
  className={`inline-flex items-center justify-between gap-1.5 min-w-[8.5rem] max-w-full px-2.5 py-1.5 rounded-md text-xs font-medium border ${statusClass}`}
  aria-expanded={isStatusOpen}
  aria-haspopup="listbox"
  >
  <span className="truncate">{STATUS_LABELS[repair.status] ?? repair.status}</span>
  <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
  </button>
  ) : (
  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
  {STATUS_LABELS[repair.status] ?? repair.status}
  </span>
  )}
 </div>
 </div>
 <div className="mt-2 space-y-1 text-sm text-slate-700 min-w-0">
 <p className="break-words font-medium text-slate-800">{repair.customerName || "—"}</p>
 {repair.contactPhone && <p className="text-xs text-slate-500">{repair.contactPhone}</p>}
 {repair.deviceDescription && (
  <p className="text-slate-600 break-words">
  <span className="text-slate-500">Device</span> {repair.deviceDescription}
  </p>
 )}
 <p className="font-mono text-xs text-slate-600 break-all">
  <span className="text-slate-500 font-sans">IMEI / Serial</span> {repair.serialNumber || "—"}
 </p>
 </div>
 <dl className="mt-3 grid grid-cols-1 @[640px]:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
 <div className="flex flex-wrap gap-x-1 min-w-0">
  <dt className="text-slate-500 shrink-0">Created</dt>
  <dd className="min-w-0 break-words">{formatDateTime(repair.createdAt)}</dd>
 </div>
 <div className="flex flex-wrap gap-x-1 min-w-0">
  <dt className="text-slate-500 shrink-0">Collected</dt>
  <dd>{formatCollectedAt(repair.collectedAt)}</dd>
 </div>
 <div className="flex flex-wrap gap-x-1 min-w-0">
  <dt className="text-slate-500 shrink-0">By</dt>
  <dd className="truncate" title={repair.createdByName ?? undefined}>
  {repair.createdByName ?? "—"}
  </dd>
 </div>
 <div className="flex flex-wrap gap-x-1">
  <dt className="text-slate-500 shrink-0">Est. / Taken</dt>
  <dd>
  {formatCurrency(repair.estimatedCost)}
  {" · "}
  {repair.amountTaken != null ? formatCurrency(repair.amountTaken) : "—"}
  </dd>
 </div>
 </dl>
 <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
 <button
  type="button"
  onClick={() => onOpenRepair(repair)}
  className="p-2 text-slate-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
  title="Open repair"
 >
  <ExternalLink className="h-4 w-4" />
 </button>
 {onPrintTicket && (
  <button
  type="button"
  onClick={() => void onPrintTicket(repair)}
  disabled={printingTicketId === repair._id}
  className="p-2 text-slate-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50"
  title="Print ticket (80mm)"
  >
  {printingTicketId === repair._id ? (
  <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
  ) : (
  <Printer className="h-4 w-4" />
  )}
  </button>
 )}
 {onPrintLabel && (
  <button
  type="button"
  onClick={() => void onPrintLabel(repair)}
  disabled={printingLabelId === repair._id}
  className="p-2 text-slate-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50"
  title="Print label (57×32)"
  >
  {printingLabelId === repair._id ? (
  <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
  ) : (
  <Tag className="h-4 w-4" />
  )}
  </button>
 )}
 <button
  type="button"
  onClick={() => onEdit(repair)}
  className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
  title="Edit"
 >
  <Edit className="h-4 w-4" />
 </button>
 <button
  type="button"
  onClick={() => onDelete(repair)}
  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  title="Delete"
 >
  <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </article>
 );
}

export const RepairTable: React.FC<RepairTableProps> = ({
 repairs,
 isLoading,
 onEdit,
 onDelete,
 onOpenRepair,
 onStatusChange,
 onPrintTicket,
 onPrintLabel,
 printingLabelId,
 printingTicketId,
}) => {
 const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
 const [statusMenuPos, setStatusMenuPos] = useState<{
 top: number;
 left: number;
 minWidth: number;
 } | null>(null);
 const statusTriggerRef = useRef<HTMLButtonElement | null>(null);

 const closeStatusMenu = useCallback(() => {
 setStatusDropdownId(null);
 setStatusMenuPos(null);
 }, []);

 useLayoutEffect(() => {
 if (!statusDropdownId) {
 setStatusMenuPos(null);
 return;
 }
 const updatePosition = () => {
 const el = statusTriggerRef.current;
 if (!el) return;
 const rect = el.getBoundingClientRect();
 const gap = 6;
 const edge = 12;
 const estHeight = STATUS_OPTIONS.length * 40 + 24;
 const spaceBelow = window.innerHeight - rect.bottom - gap;
 const flip = spaceBelow < estHeight && rect.top > estHeight + gap;
 const top = flip
 ? Math.max(edge, rect.top - estHeight - gap)
 : Math.min(rect.bottom + gap, window.innerHeight - estHeight - edge);
 // Wider menu than trigger so options are not cramped; keep inside viewport (shift left if needed)
 const minW = Math.max(220, rect.width + 8);
 let left = rect.left;
 if (left + minW > window.innerWidth - edge) {
 left = rect.right - minW;
 }
 left = Math.max(edge, Math.min(left, window.innerWidth - minW - edge));
 setStatusMenuPos({ top, left, minWidth: minW });
 };
 updatePosition();
 window.addEventListener("scroll", updatePosition, true);
 window.addEventListener("resize", updatePosition);
 return () => {
 window.removeEventListener("scroll", updatePosition, true);
 window.removeEventListener("resize", updatePosition);
 };
 }, [statusDropdownId]);

 useEffect(() => {
 if (!statusDropdownId) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") closeStatusMenu();
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [statusDropdownId, closeStatusMenu]);

 if (isLoading) {
 return (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
 </div>
 );
 }

 if (repairs.length === 0) {
 return (
 <div className="py-14 text-center text-slate-500 px-4">
 <p className="text-slate-600 font-medium">No repairs match your filters.</p>
 <p className="text-sm mt-1 text-slate-500">Use <span className="text-neutral-600 font-medium">Add repair</span> or{" "}
  <span className="text-neutral-600 font-medium">Quick add</span> to create one.</p>
 </div>
 );
 }

 const statusMenuPortal =
 typeof document !== "undefined" &&
 statusDropdownId &&
 statusMenuPos &&
 onStatusChange &&
 createPortal(
 <>
 <div
  className="fixed inset-0 z-[10050] bg-slate-900/25"
  aria-hidden
  onClick={closeStatusMenu}
 />
 <div
  role="listbox"
  aria-label="Repair status"
  className="fixed z-[10060] rounded-lg border border-slate-200 bg-white py-1.5 shadow-2xl max-h-[min(360px,calc(100vh-24px))] overflow-y-auto"
  style={{
  top: statusMenuPos.top,
  left: statusMenuPos.left,
  minWidth: statusMenuPos.minWidth,
  width: statusMenuPos.minWidth,
  }}
 >
  {(() => {
  const row = repairs.find((r) => r._id === statusDropdownId);
  if (!row) return null;
  return STATUS_OPTIONS.map((o) => (
  <button
  key={o.value}
  type="button"
  role="option"
  aria-selected={o.value === row.status}
  onClick={() => {
   onStatusChange(row, o.value);
   closeStatusMenu();
  }}
  className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50 ${
   o.value === row.status ? "bg-neutral-50 text-neutral-900 font-semibold" : "text-slate-800"
  }`}
  >
  {o.label}
  </button>
  ));
  })()}
 </div>
 </>,
 document.body
 );

 return (
 <>
 <div className="@[1024px]:hidden divide-y divide-slate-100 bg-white">
 {repairs.map((repair) => {
  const statusClass = STATUS_COLORS[repair.status] ?? "bg-gray-100 text-gray-700";
  const isStatusOpen = statusDropdownId === repair._id;
  return (
  <RepairCardRow
  key={repair._id}
  repair={repair}
  statusClass={statusClass}
  isStatusOpen={isStatusOpen}
  setStatusDropdownId={setStatusDropdownId}
  statusTriggerRef={statusTriggerRef}
  onOpenRepair={onOpenRepair}
  onEdit={onEdit}
  onDelete={onDelete}
  onStatusChange={onStatusChange}
  onPrintTicket={onPrintTicket}
  onPrintLabel={onPrintLabel}
  printingLabelId={printingLabelId}
  printingTicketId={printingTicketId}
  />
  );
 })}
 </div>

 <div className="hidden @[1024px]:block w-full min-w-0">
 <table className="w-full min-w-0 table-fixed border-collapse text-sm">
  <colgroup>
  <col className="w-[8%]" />
  <col className="w-[13%]" />
  <col className="w-[12%]" />
  <col className="w-[9%]" />
  <col className="w-[8%]" />
  <col className="w-[11%]" />
  <col className="w-[9%]" />
  <col className="w-[7%]" />
  <col className="w-[7%]" />
  <col className="w-[9%]" />
  <col className="w-[7%]" />
  </colgroup>
  <thead className="bg-neutral-100 border-b border-neutral-200">
  <tr>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Ref
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Customer
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Device
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  IMEI
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  By
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Created
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Coll.
  </th>
  <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Est.
  </th>
  <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Taken
  </th>
  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
  Status
  </th>
  <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider pr-3">
  Act.
  </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-slate-100">
  {repairs.map((repair) => {
  const statusClass = STATUS_COLORS[repair.status] ?? "bg-gray-100 text-gray-700";
  const isStatusOpen = statusDropdownId === repair._id;
  const ref = repair.reference ?? "—";
  return (
  <tr key={repair._id} className="hover:bg-neutral-50/40 transition-colors">
   <td className="px-2 py-2.5 align-top">
   <button
   type="button"
   onClick={() => onOpenRepair(repair)}
   className="font-semibold text-neutral-700 hover:text-neutral-900 hover:underline text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded block w-full truncate"
   title={ref}
   >
   {ref}
   </button>
   </td>
   <td className="px-2 py-2.5 text-gray-700 align-top min-w-0">
   <div className="truncate font-medium" title={repair.customerName}>
   {repair.customerName || "—"}
   </div>
   {repair.contactPhone && (
   <div className="text-[11px] text-gray-500 truncate" title={repair.contactPhone}>
   {repair.contactPhone}
   </div>
   )}
   </td>
   <td className="px-2 py-2.5 text-gray-700 align-top min-w-0">
   <div className="truncate" title={repair.deviceDescription || undefined}>
   {repair.deviceDescription || "—"}
   </div>
   </td>
   <td className="px-2 py-2.5 text-gray-600 font-mono text-[11px] align-top min-w-0">
   <div className="truncate" title={repair.serialNumber || undefined}>
   {repair.serialNumber || "—"}
   </div>
   </td>
   <td className="px-2 py-2.5 text-gray-600 align-top min-w-0">
   <div className="truncate text-xs" title={repair.createdByName ?? undefined}>
   {repair.createdByName ?? "—"}
   </div>
   </td>
   <td className="px-2 py-2.5 text-gray-600 text-[11px] align-top min-w-0 leading-snug">
   <span className="line-clamp-2" title={formatDateTime(repair.createdAt)}>
   {formatDateTime(repair.createdAt)}
   </span>
   </td>
   <td className="px-2 py-2.5 text-gray-600 text-[11px] align-top min-w-0 leading-snug">
   <span className="line-clamp-2" title={formatCollectedAt(repair.collectedAt)}>
   {formatCollectedAt(repair.collectedAt)}
   </span>
   </td>
   <td className="px-2 py-2.5 text-right text-gray-700 text-xs align-top whitespace-nowrap">
   {formatCurrency(repair.estimatedCost)}
   </td>
   <td className="px-2 py-2.5 text-right text-gray-700 text-xs align-top whitespace-nowrap">
   {repair.amountTaken != null ? formatCurrency(repair.amountTaken) : "—"}
   </td>
   <td className="px-2 py-2.5 align-top min-w-0">
   {onStatusChange ? (
   <button
   ref={isStatusOpen ? statusTriggerRef : undefined}
   type="button"
   onClick={() => setStatusDropdownId(isStatusOpen ? null : repair._id)}
   className={`inline-flex w-full max-w-full items-center justify-between gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium border ${statusClass}`}
   aria-expanded={isStatusOpen}
   aria-haspopup="listbox"
   >
   <span className="truncate text-left">{STATUS_LABELS[repair.status] ?? repair.status}</span>
   <ChevronDown className={`h-2.5 w-2.5 shrink-0 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
   </button>
   ) : (
   <span className={`inline-flex max-w-full px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${statusClass}`}>
   {STATUS_LABELS[repair.status] ?? repair.status}
   </span>
   )}
   </td>
   <td className="px-1 py-2 align-top">
   <div className="flex flex-wrap items-center justify-end gap-0">
   <button
   type="button"
   onClick={() => onOpenRepair(repair)}
   className="p-1 text-slate-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
   title="Open"
   >
   <ExternalLink className="h-3.5 w-3.5" />
   </button>
   {onPrintTicket && (
   <button
    type="button"
    onClick={() => void onPrintTicket(repair)}
    disabled={printingTicketId === repair._id}
    className="p-1 text-slate-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors disabled:opacity-50"
    title="Ticket"
   >
    {printingTicketId === repair._id ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-600" />
    ) : (
    <Printer className="h-3.5 w-3.5" />
    )}
   </button>
   )}
   {onPrintLabel && (
   <button
    type="button"
    onClick={() => void onPrintLabel(repair)}
    disabled={printingLabelId === repair._id}
    className="p-1 text-slate-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors disabled:opacity-50"
    title="Label"
   >
    {printingLabelId === repair._id ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-600" />
    ) : (
    <Tag className="h-3.5 w-3.5" />
    )}
   </button>
   )}
   <button
   type="button"
   onClick={() => onEdit(repair)}
   className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
   title="Edit"
   >
   <Edit className="h-3.5 w-3.5" />
   </button>
   <button
   type="button"
   onClick={() => onDelete(repair)}
   className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
   title="Delete"
   >
   <Trash2 className="h-3.5 w-3.5" />
   </button>
   </div>
   </td>
  </tr>
  );
  })}
  </tbody>
 </table>
 </div>
 {statusMenuPortal}
 </>
 );
};

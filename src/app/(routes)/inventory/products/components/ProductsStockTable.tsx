"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import type { StockViewRow } from "../../../stock/view/types";
import { empty } from "../../../stock/view/hooks/useStockView";
import { formatDateTimeLondon } from "@/lib/dateUtils";

export type SoldInfoMap = Record<string, { customerName: string; saleReference?: string; saleId?: string }>;

export type TableVariant = "serial" | "non-serial";

const hasValue = (v: string | undefined): boolean => !!(v && String(v).trim());

interface ProductsStockTableProps {
 rows: StockViewRow[];
 soldInfoMap?: SoldInfoMap;
 isLoading?: boolean;
 /** When provided, non-serial rows show editable quantity; call to persist */
 onQuantityChange?: (purchaseId: string, itemId: string, quantity: number) => Promise<void>;
 /** "serial" = IMEI column, no Qty; "non-serial" = Qty column, no IMEI. Omit for legacy single-table (both). */
 variant?: TableVariant;
 /** Optional section title above the table */
 title?: string;
 /** When provided, shows a View button that opens product history for the given serial (IMEI) */
 onViewHistory?: (serial: string) => void;
 /** When provided and variant is non-serial, shows a Delete button to remove the item from the purchase */
 onDeleteNonSerialItem?: (purchaseId: string, itemId: string) => Promise<void>;
}

const thClass =
 "px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50/80";
const tdClass = "px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700 whitespace-nowrap";

const hasNonSerial = (rows: StockViewRow[]) => rows.some((r) => !r.isSerialProduct);

function formatSlugAsHeader(slug: string): string {
 const s = (slug || "").trim();
 if (!s) return slug;
 return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Get display value for a variant slug from row.variantValues only */
function getRowValueForSlug(row: StockViewRow, slug: string): string {
 const key = (slug || "").toLowerCase();
 const v = row.variantValues?.find((x) => (x.slug || "").toLowerCase() === key);
 const val = (v?.value ?? "").trim();
 return val ? String(val) : "";
}

/** Order variant column slugs by category save order; merge when multiple categories share one table. */
function orderedVariantSlugsForRows(rows: StockViewRow[]): string[] {
 const slugSet = new Set<string>();
 rows.forEach((r) => {
 r.variantValues?.forEach((v) => {
 const s = (v.slug || "").trim().toLowerCase();
 if (s) slugSet.add(s);
 });
 });
 const withValues = [...slugSet].filter((slug) => rows.some((r) => hasValue(getRowValueForSlug(r, slug))));

 const orders = rows
 .map((r) => r.variantAttributeSlugsOrder)
 .filter((o): o is string[] => Array.isArray(o) && o.length > 0);

 if (orders.length === 0) {
 return withValues.sort((a, b) => a.localeCompare(b));
 }

 const norm = (o: string[]) => o.map((s) => s.trim().toLowerCase()).join("\0");
 const canonical = norm(orders[0]);
 const allSame = orders.every((o) => norm(o) === canonical);

 let primaryOrder: string[];
 if (allSame) {
 primaryOrder = orders[0].map((s) => s.trim().toLowerCase());
 } else {
 const seen = new Set<string>();
 primaryOrder = [];
 const maxLen = Math.max(...orders.map((o) => o.length), 0);
 for (let i = 0; i < maxLen; i++) {
 for (const ord of orders) {
 const s = (ord[i] || "").trim().toLowerCase();
 if (s && !seen.has(s)) {
  seen.add(s);
  primaryOrder.push(s);
 }
 }
 }
 }

 const ordered = primaryOrder.filter((s) => withValues.includes(s));
 const rest = withValues.filter((s) => !ordered.includes(s)).sort((a, b) => a.localeCompare(b));
 return [...ordered, ...rest];
}

export function ProductsStockTable({
 rows,
 soldInfoMap = {},
 isLoading,
 onQuantityChange,
 variant,
 title,
 onViewHistory,
 onDeleteNonSerialItem,
}: ProductsStockTableProps) {
 const isSerial = variant === "serial";
 const isNonSerial = variant === "non-serial";
 const showQtyColumn =
 variant !== undefined
 ? isNonSerial && Boolean(onQuantityChange)
 : hasNonSerial(rows) && Boolean(onQuantityChange);
 const showImeiColumn = variant === undefined ? true : !isNonSerial;

 const showNameColumn = isNonSerial || isSerial;

 /** Dynamic variant columns: category attribute order when API provides variantAttributeSlugsOrder; else A–Z */
 const dynamicVariantSlugs = useMemo(() => orderedVariantSlugsForRows(rows), [rows]);

 const showViewColumn = Boolean(onViewHistory) || Boolean(isNonSerial && onDeleteNonSerialItem);
 const colCount =
 (showNameColumn ? 1 : 0) +
 (isSerial ? 1 : 0) + /* SID */
 (showQtyColumn ? 1 : 0) +
 dynamicVariantSlugs.length +
 (showImeiColumn ? 1 : 0) +
 5 + /* Date, Cost, Sale price, Note, Status */
 (showViewColumn ? 1 : 0);

 const tableContent = (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[700px]">
 <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
  <tr>
  {isSerial && <th className={thClass}>SID</th>}
  {showNameColumn && <th className={thClass}>Category</th>}
  {showQtyColumn && <th className={thClass}>Qty</th>}
  {dynamicVariantSlugs.map((slug) => (
  <th key={slug} className={thClass}>
  {formatSlugAsHeader(slug)}
  </th>
  ))}
  {showImeiColumn && <th className={thClass}>IMEI</th>}
  <th className={thClass}>Date</th>
  <th className={thClass}>Cost</th>
  <th className={thClass}>Sale price</th>
  <th className={thClass}>Note</th>
  <th className={thClass}>Status</th>
  {showViewColumn && <th className={thClass}>Action</th>}
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 bg-white">
  {isLoading ? (
  <tr>
  <td colSpan={colCount} className="px-4 py-16 text-center text-gray-500">
  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
  <p className="mt-2 text-sm">Loading…</p>
  </td>
  </tr>
  ) : rows.length === 0 ? (
  <tr>
  <td colSpan={colCount} className="px-4 py-14 text-center text-gray-500">
  <p className="font-medium">No products found</p>
  <p className="text-sm mt-1">Try adjusting filters or add products from purchases.</p>
  </td>
  </tr>
  ) : (
  rows.map((row) => (
  <ProductsStockTableRow
  key={row.rowKey}
  row={row}
  soldInfoMap={soldInfoMap}
  onQuantityChange={onQuantityChange}
  showQtyColumn={showQtyColumn}
  showImeiColumn={showImeiColumn}
  showNameColumn={showNameColumn}
  showSidColumn={isSerial}
  dynamicVariantSlugs={dynamicVariantSlugs}
  onViewHistory={onViewHistory}
  onDeleteNonSerialItem={onDeleteNonSerialItem}
  showViewColumn={showViewColumn}
  />
  ))
  )}
 </tbody>
 </table>
 </div>
 );

 if (title) {
 return (
 <div className="mb-4 @[640px]:mb-8">
 <h2 className="text-sm @[640px]:text-base font-semibold text-gray-800 mb-2 @[640px]:mb-3">{title}</h2>
 {tableContent}
 </div>
 );
 }
 return tableContent;
}

function ProductsStockTableRow({
 row,
 soldInfoMap,
 onQuantityChange,
 showQtyColumn,
 showImeiColumn = true,
 showNameColumn = false,
 dynamicVariantSlugs = [],
 onViewHistory,
 onDeleteNonSerialItem,
 showSidColumn = false,
 showViewColumn = false,
}: {
 row: StockViewRow;
 soldInfoMap: SoldInfoMap;
 onQuantityChange?: (purchaseId: string, itemId: string, quantity: number) => Promise<void>;
 showQtyColumn: boolean;
 showImeiColumn?: boolean;
 showNameColumn?: boolean;
 showSidColumn?: boolean;
 dynamicVariantSlugs?: string[];
 onViewHistory?: (serial: string) => void;
 onDeleteNonSerialItem?: (purchaseId: string, itemId: string) => Promise<void>;
 showViewColumn?: boolean;
}) {
 const [editingQty, setEditingQty] = useState<number | null>(null);
 const [saving, setSaving] = useState(false);
 const [deleting, setDeleting] = useState(false);

 const soldInfo = row.imei ? soldInfoMap[(row.imei || "").trim()] : undefined;
 const canEditQty = !row.isSerialProduct && row.purchaseId && row.itemId && onQuantityChange;
 const displayQty = editingQty !== null ? editingQty : (row.quantity ?? 0);
 const displayName = (row.category && row.category.trim()) || (row.name && row.name.trim()) || "-";

 const handleQtyBlur = useCallback(async () => {
 if (editingQty === null || !onQuantityChange || !row.purchaseId || !row.itemId) return;
 const num = Math.floor(editingQty);
 if (num === row.quantity) {
 setEditingQty(null);
 return;
 }
 setSaving(true);
 try {
 await onQuantityChange(row.purchaseId, row.itemId, num);
 setEditingQty(null);
 } catch {
 setEditingQty(row.quantity ?? 0);
 } finally {
 setSaving(false);
 }
 }, [editingQty, onQuantityChange, row.purchaseId, row.itemId, row.quantity]);

 const handleQtyKeyDown = useCallback(
 (e: React.KeyboardEvent) => {
 if (e.key === "Enter") {
 (e.currentTarget as HTMLElement).blur();
 }
 },
 []
 );

 const canDelete = !row.isSerialProduct && row.purchaseId && row.itemId && onDeleteNonSerialItem;
 const handleDeleteClick = useCallback(async () => {
 if (!canDelete || !row.purchaseId || !row.itemId) return;
 const confirmed = window.confirm(
 "Remove this non-serial item from the purchase? This cannot be undone."
 );
 if (!confirmed) return;
 setDeleting(true);
 try {
 await onDeleteNonSerialItem(row.purchaseId, row.itemId);
 } finally {
 setDeleting(false);
 }
 }, [canDelete, row.purchaseId, row.itemId, onDeleteNonSerialItem]);

 return (
 <tr
 className={soldInfo ? "bg-gray-50/80 hover:bg-gray-100/80" : "hover:bg-orange-50/50 transition-colors"}
 >
 {showSidColumn && (
 <td className={`${tdClass} font-mono text-xs`}>{empty(row.serialItemIdNumber)}</td>
 )}
 {showNameColumn && <td className={tdClass}>{displayName}</td>}
 {showQtyColumn && (
 <td className={tdClass}>
  {canEditQty ? (
  <input
  type="number"
  step={1}
  value={displayQty}
  onChange={(e) => {
  const v = e.target.value;
  if (v === "") {
   setEditingQty(0);
   return;
  }
  const n = parseInt(v, 10);
  if (!Number.isNaN(n)) setEditingQty(n);
  }}
  onBlur={handleQtyBlur}
  onKeyDown={handleQtyKeyDown}
  disabled={saving}
  className={`w-16 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60 ${displayQty < 0 ? "border-neutral-400 bg-neutral-50 text-neutral-900" : "border-gray-200"}`}
  />
  ) : (
  "-"
  )}
 </td>
 )}
 {dynamicVariantSlugs.map((slug) => (
 <td key={slug} className={tdClass}>
  {empty(getRowValueForSlug(row, slug) || undefined)}
 </td>
 ))}
 {showImeiColumn && (
 <td className={`${tdClass} font-mono text-xs`}>{empty(row.imei)}</td>
 )}
 <td className={tdClass}>
 {formatDateTimeLondon(row.createdAt ?? row.date)}
 </td>
 <td className={tdClass}>
 {empty(row.purchasePrice) === "-"
  ? "-"
  : `${row.currency ? `${row.currency} ` : ""}${row.purchasePrice}`}
 </td>
 <td className={tdClass}>
 {empty(row.salePrice) === "-"
  ? "-"
  : `${row.currency ? `${row.currency} ` : ""}${row.salePrice}`}
 </td>
 <td className={`${tdClass} max-w-[200px] truncate`} title={row.note || ""}>
 {empty(row.note)}
 </td>
 <td className={tdClass}>
 {soldInfo ? (
  <span className="flex flex-wrap items-center gap-1.5">
  <span className="text-neutral-700 font-medium">Sold to {soldInfo.customerName}</span>
  {soldInfo.saleReference &&
  (soldInfo.saleId ? (
  <Link
   href={`/sales-online-orders/edit/${soldInfo.saleId}`}
   className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
   title="Open invoice"
  >
   {soldInfo.saleReference}
  </Link>
  ) : (
  <span className="font-mono text-xs text-gray-500">{soldInfo.saleReference}</span>
  ))}
  </span>
 ) : (
  <span className="text-gray-500">Available</span>
 )}
 </td>
 {showViewColumn && (
 <td className={tdClass}>
  {row.imei && row.imei.trim() && row.imei !== "-" && onViewHistory ? (
  <button
  type="button"
  onClick={() => onViewHistory(row.imei!.trim())}
  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
  title="View product history"
  >
  <Eye className="h-4 w-4" />
  View
  </button>
  ) : canDelete ? (
  <button
  type="button"
  onClick={handleDeleteClick}
  disabled={deleting}
  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-60"
  title="Remove this non-serial item from the purchase"
  >
  <Trash2 className="h-4 w-4" />
  {deleting ? "Removing…" : "Delete"}
  </button>
  ) : (
  <span className="text-gray-400">—</span>
  )}
 </td>
 )}
 </tr>
 );
}

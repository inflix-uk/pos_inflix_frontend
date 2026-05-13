"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { StockViewRow } from "../../../stock/view/types";

/**
 * Variant key: category + grade (condition) + brand + brandModel (model) + capacity.
 * No colour. Normalization must match backend utils/variantKeyUtils.js buildVariantKey:
 * trim each part, drop empty, join single space, uppercase.
 */
export function variantKey(row: StockViewRow): string {
 const parts = [
 row.category,
 row.grade,
 row.brand,
 row.brandModel,
 row.capacity,
 ]
 .filter(Boolean)
 .map((s) => String(s).trim())
 .filter(Boolean);
 return parts.join(" ").toUpperCase();
}

/** Display name without colour. */
function nameWithoutColour(row: StockViewRow): string {
 const parts = [
 row.category,
 row.grade,
 row.brand,
 row.brandModel,
 row.capacity,
 ]
 .filter(Boolean)
 .map((s) => String(s).trim());
 return parts.length ? parts.join(" ").trim() : (row.name && row.name.trim()) || "-";
}

function getItemKey(row: StockViewRow): { purchaseId: string; itemId: string } | null {
 if (row.purchaseId && row.itemId) return { purchaseId: row.purchaseId, itemId: row.itemId };
 const parts = (row.rowKey || "").split("-");
 if (parts.length >= 2) return { purchaseId: parts[0], itemId: parts[1] };
 return null;
}

export interface RateListItem {
 /** Unique key for row (variant key; same product different colour merges). */
 variantKey: string;
 name: string;
 category: string;
 grade: string;
 brand: string;
 brandModel: string;
 capacity: string;
 salePrice: number;
 currency: string;
 serialCount: number;
 serials: string[];
 /** All purchase item refs in this group — updating price updates all. */
 itemRefs: { purchaseId: string; itemId: string }[];
 /** First row's barcode in this variant (for mapping to Product for group pricing). */
 firstBarcode?: string;
 /** First row's productId when backend resolved it by barcode (serial items). */
 firstProductId?: string;
}

/** Use most recent purchase date for ordering (createdAt preferred). */
function getRowDate(row: StockViewRow): string {
 const d = row.createdAt ?? row.date ?? "";
 return typeof d === "string" ? d : "";
}

/** Group stock view rows by variant; each item gets firstBarcode from first row for ProductGroupPrice mapping. */
export function groupRowsByVariant(rows: StockViewRow[]): RateListItem[] {
 const map = new Map<string, RateListItem & { _maxDate?: string }>();
 for (const row of rows) {
 const ref = getItemKey(row);
 if (!ref) continue;
 const key = variantKey(row);
 const imeiStr = row.imei && row.imei.trim() && row.imei !== "-" ? row.imei.trim() : "";
 const rowDate = getRowDate(row);
 const rawPrice = row.salePrice;
 const rowPrice =
 typeof rawPrice === "number" && !Number.isNaN(rawPrice)
 ? rawPrice
 : Math.max(0, Number(parseFloat(String(rawPrice ?? ""))) || 0);
 const rowBarcode = row.barcode?.trim() || undefined;
 const rowProductId = row.productId;
 const existing = map.get(key);
 if (existing) {
 existing.serialCount += row.isSerialProduct ? 1 : 0;
 if (imeiStr) existing.serials.push(imeiStr);
 const hasRef = existing.itemRefs.some((r) => r.purchaseId === ref.purchaseId && r.itemId === ref.itemId);
 if (!hasRef) existing.itemRefs.push(ref);
 if (rowProductId && !existing.firstProductId) existing.firstProductId = rowProductId;
 const prevMax = existing._maxDate ?? "";
 if (rowDate && rowDate > prevMax) {
 existing._maxDate = rowDate;
 existing.salePrice = rowPrice;
 }
 continue;
 }
 const item: RateListItem & { _maxDate?: string } = {
 variantKey: key,
 name: nameWithoutColour(row),
 category: row.category ?? "",
 grade: row.grade ?? "",
 brand: row.brand ?? "",
 brandModel: row.brandModel ?? "",
 capacity: row.capacity ?? "",
 salePrice: rowPrice,
 currency: row.currency ?? "",
 serialCount: row.isSerialProduct ? 1 : 0,
 serials: imeiStr ? [imeiStr] : [],
 itemRefs: [ref],
 firstBarcode: rowBarcode,
 firstProductId: rowProductId,
 _maxDate: rowDate,
 };
 map.set(key, item);
 }
 return [...map.values()]
 .map((item) => {
 const { _maxDate: _, ...rest } = item;
 return rest as RateListItem;
 })
 .sort((a, b) => a.name.localeCompare(b.name));
}

const thClass =
 "px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50/80";
const tdClass = "px-2.5 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700 whitespace-nowrap";
/** Column min-widths for a wider, readable layout */
const colMinWidths = {
 name: "min-w-[200px]",
 condition: "min-w-[90px]",
 brand: "min-w-[100px]",
 model: "min-w-[120px]",
 capacity: "min-w-[80px]",
 serials: "min-w-[100px]",
 salePrice: "min-w-[120px]",
};

interface ProductsRateTableProps {
 rows: StockViewRow[];
 isLoading?: boolean;
 /** Default/inventory mode: update purchase item sale price. */
 onSalePriceChange?: (
 purchaseId: string,
 itemId: string,
 salePrice: number
 ) => Promise<void>;
 refetch?: () => Promise<void>;
 /** When true, display group price (fallback to salePrice) and save via onGroupPriceChange to ProductGroupPrice. */
 groupMode?: boolean;
 /** variantKey -> group price (for display). */
 groupPricesByVariantKey?: Record<string, number>;
 /** variantKey -> productId (for saving group price). Single-id fallback when productIdsByVariantKey not provided. */
 productIdByVariantKey?: Record<string, string>;
 /** variantKey -> productIds[] (real mapping from rows: barcode-only; one or many products per variant). When provided, save runs for each productId. */
 productIdsByVariantKey?: Record<string, string[]>;
 /** Save or remove group price for this variant (price null = remove). Called once per productId when variant has multiple products. */
 onGroupPriceChange?: (variantKey: string, productId: string, price: number | null) => Promise<void>;
 /** When in group mode and provided: save by variantKey only (VariantGroupPrice). No productId needed; every row is saveable. */
 onVariantGroupPriceChange?: (variantKey: string, price: number | null) => Promise<void>;
 /** When in group mode and user blurs but variant has no linked product (no productIds), call this so parent can show a message. */
 onNoProductIdLink?: () => void;
}

export function ProductsRateTable({
 rows,
 isLoading,
 onSalePriceChange,
 refetch,
 groupMode = false,
 groupPricesByVariantKey,
 productIdByVariantKey,
 productIdsByVariantKey,
 onGroupPriceChange,
 onVariantGroupPriceChange,
 onNoProductIdLink,
}: ProductsRateTableProps) {
 const [editingKey, setEditingKey] = useState<string | null>(null);
 const [editValue, setEditValue] = useState("");
 const [saving, setSaving] = useState(false);
 /** After saving in normal mode, show saved price until refetch updates rows (avoids showing stale price so "revert" is saved). */
 const [lastSavedPriceByVariantKey, setLastSavedPriceByVariantKey] = useState<Record<string, number>>({});

 const items = React.useMemo(() => groupRowsByVariant(rows), [rows]);

 // Clear optimistic prices when rows change (e.g. after refetch) so we use server data.
 useEffect(() => {
 setLastSavedPriceByVariantKey({});
 }, [rows]);

 // Normal inventory mode: show last-saved price if we have it (optimistic), else item.salePrice from rows.
 // Pricing group mode: show group price if set, otherwise fallback to item.salePrice.
 const displayPrice = useCallback(
 (item: RateListItem) => {
 if (!groupMode) {
 const optimistic = lastSavedPriceByVariantKey[item.variantKey];
 return optimistic !== undefined ? optimistic : item.salePrice;
 }
 if (groupPricesByVariantKey && item.variantKey in groupPricesByVariantKey) {
 return groupPricesByVariantKey[item.variantKey];
 }
 return item.salePrice;
 },
 [groupMode, groupPricesByVariantKey, lastSavedPriceByVariantKey]
 );

 const handleBlur = useCallback(
 async (item: RateListItem) => {
 if (editingKey !== item.variantKey) return;

 if (groupMode && onVariantGroupPriceChange) {
 const trimmed = editValue.trim();
 const num = trimmed === "" ? null : parseFloat(trimmed);
 const valid = num === null ? null : !Number.isNaN(num) && num >= 0 ? num : null;
 const currentDisplay = displayPrice(item);
 if (valid !== null && valid === currentDisplay) {
  setEditingKey(null);
  setEditValue("");
  return;
 }
 setSaving(true);
 try {
  await onVariantGroupPriceChange(item.variantKey, valid);
  setEditingKey(null);
  setEditValue("");
 } catch {
  setEditValue(String(currentDisplay));
 } finally {
  setSaving(false);
 }
 return;
 }

 if (groupMode && onGroupPriceChange) {
 const ids = productIdsByVariantKey?.[item.variantKey] ?? (productIdByVariantKey?.[item.variantKey] ? [productIdByVariantKey[item.variantKey]] : []);
 if (!ids || ids.length === 0) {
  if (editValue.trim() !== "" || displayPrice(item) !== item.salePrice) onNoProductIdLink?.();
  setEditingKey(null);
  setEditValue("");
  return;
 }
 const trimmed = editValue.trim();
 const num = trimmed === "" ? null : parseFloat(trimmed);
 const valid = num === null ? null : !Number.isNaN(num) && num >= 0 ? num : null;
 const currentDisplay = displayPrice(item);
 if (valid !== null && valid === currentDisplay) {
  setEditingKey(null);
  setEditValue("");
  return;
 }
 setSaving(true);
 try {
  for (const productId of ids) {
  await onGroupPriceChange(item.variantKey, productId, valid);
  }
  setEditingKey(null);
  setEditValue("");
 } catch {
  setEditValue(String(currentDisplay));
 } finally {
  setSaving(false);
 }
 return;
 }

 if (!onSalePriceChange || !refetch || editValue === "") return;
 const num = parseFloat(editValue);
 if (Number.isNaN(num) || num < 0) {
 setEditValue(String(displayPrice(item)));
 setEditingKey(null);
 return;
 }
 const effectivePrice = lastSavedPriceByVariantKey[item.variantKey] ?? item.salePrice;
 if (num === effectivePrice) {
 setEditingKey(null);
 setEditValue("");
 return;
 }
 setSaving(true);
 try {
 await Promise.all(
  item.itemRefs.map((ref) => onSalePriceChange(ref.purchaseId, ref.itemId, num))
 );
 setLastSavedPriceByVariantKey((prev) => ({ ...prev, [item.variantKey]: num }));
 await refetch();
 setEditingKey(null);
 setEditValue("");
 } catch {
 setEditValue(String(displayPrice(item)));
 } finally {
 setSaving(false);
 }
 },
 [
 editingKey,
 editValue,
 groupMode,
 productIdByVariantKey,
 productIdsByVariantKey,
 onGroupPriceChange,
 onVariantGroupPriceChange,
 onNoProductIdLink,
 onSalePriceChange,
 refetch,
 displayPrice,
 lastSavedPriceByVariantKey,
 ]
 );

 const handleKeyDown = useCallback(
 (e: React.KeyboardEvent, item: RateListItem) => {
 if (e.key === "Enter") (e.currentTarget as HTMLElement).blur();
 },
 []
 );

 return (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[900px]">
 <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
  <tr>
  <th className={`${thClass} ${colMinWidths.name}`}>Name</th>
  <th className={`${thClass} ${colMinWidths.condition}`}>Condition</th>
  <th className={`${thClass} ${colMinWidths.brand}`}>Brand</th>
  <th className={`${thClass} ${colMinWidths.model}`}>Model</th>
  <th className={`${thClass} ${colMinWidths.capacity}`}>Capacity</th>
  <th className={`${thClass} ${colMinWidths.serials}`}>Serials</th>
  <th className={`${thClass} ${colMinWidths.salePrice}`}>Sale price</th>
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 bg-white">
  {isLoading ? (
  <tr>
  <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
  <p className="mt-2 text-sm">Loading…</p>
  </td>
  </tr>
  ) : items.length === 0 ? (
  <tr>
  <td colSpan={7} className="px-4 py-14 text-center text-gray-500">
  <p className="font-medium">No items to show</p>
  <p className="text-sm mt-1">Add serial products from purchases to update prices here.</p>
  </td>
  </tr>
  ) : (
  items.map((item) => {
  const isEditing = editingKey === item.variantKey;
  return (
  <tr key={item.variantKey} className="hover:bg-orange-50/50 transition-colors">
   <td className={`${tdClass} break-words`}>{item.name}</td>
   <td className={tdClass}>{item.grade || "—"}</td>
   <td className={tdClass}>{item.brand || "—"}</td>
   <td className={tdClass}>{item.brandModel || "—"}</td>
   <td className={tdClass}>{item.capacity || "—"}</td>
   <td className={`${tdClass} break-all`}>
   {item.serialCount > 0
   ? item.serialCount === 1
   ? item.serials[0] || "1"
   : `${item.serialCount} items`
   : "—"}
   </td>
   <td className={tdClass}>
   <input
   type="number"
   step="0.01"
   min={0}
   value={isEditing ? editValue : String(displayPrice(item))}
   onChange={(e) => {
   if (!isEditing) {
    setEditingKey(item.variantKey);
    setEditValue(e.target.value);
   } else setEditValue(e.target.value);
   }}
   onFocus={() => {
   setEditingKey(item.variantKey);
   setEditValue(String(displayPrice(item)));
   }}
   disabled={saving}
   title={groupMode && onVariantGroupPriceChange ? undefined : groupMode && !(productIdsByVariantKey?.[item.variantKey]?.length || productIdByVariantKey?.[item.variantKey]) ? "No product linked for this variant — add barcode to the product in Inventory to save group price" : undefined}
   onBlur={() => handleBlur(item)}
   onKeyDown={(e) => handleKeyDown(e, item)}
   className="w-full min-w-[100px] max-w-[140px] px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
   />
   </td>
  </tr>
  );
  })
  )}
 </tbody>
 </table>
 </div>
 );
}

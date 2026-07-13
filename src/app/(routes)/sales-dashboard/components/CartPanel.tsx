"use client";

import React, { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingCart, CreditCard } from "lucide-react";
import type { CartLineItem } from "../types";
import { useAppCurrency } from "@/lib/app-currency-context";
import { HelpTip } from "@/components/HelpTip";
import { useCartTaxSlot } from "./CartTaxSlotContext";

interface CartPanelProps {
 title?: string;
 emptyHint?: string;
 items: CartLineItem[];
 subtotal: number;
 tax: number;
 total: number;
 onUpdateQty: (sku: string, delta: number) => void;
 onUpdatePrice?: (sku: string, price: string, serial?: string, wholeLine?: boolean) => void;
 onRemove: (sku: string, serial?: string) => void;
 onClear: () => void;
 onPay: () => void;
 /** When true, Pay button is disabled and payDisabledLabel is shown (e.g. wholesale requires customer) */
 payDisabled?: boolean;
 payDisabledLabel?: string;
 /** "blue" for wholesale (Order) vs default orange (Sale) */
 accent?: "orange" | "blue";
 /** When true, each line is collapsible to save space (good for long item names) */
 collapsibleLines?: boolean;
 /** Optional override for the primary button label (e.g. "Save changes" for edit mode) */
 primaryButtonLabel?: string;
 /** When true, show Items Summary + Serial Items Details tables (wholesale); when false, show only cart lines (retail) */
 showItemsSummaryAndDetail?: boolean;
 /** Category _id → ordered variant attribute slugs (Items Summary column order) */
 categoryVariantSlugOrderByCategoryId?: Record<string, string[]>;
 /** Retail/POS look: oversized TOTAL display + big Pay button (Eposnow-inspired). */
 prominentTotals?: boolean;
 /** Optional "Hold" action (save current cart as a draft). Renders DELETE | HOLD | PAY bar when set in prominent mode. */
 onHold?: () => void;
}

const parsePriceDisplay = (priceStr: string): string => {
 const n = parseFloat(priceStr.replace(/[^0-9.-]/g, ""));
 return isNaN(n) ? "" : n.toString();
};

/** Display condition: item.grade or parse from item.name (e.g. "GRADE A") for existing cart lines */
function getDisplayCondition(item: CartLineItem): string {
 if (item.grade != null && String(item.grade).trim()) return String(item.grade).trim();
 const nameStr = item.name?.trim() ?? "";
 const match = nameStr.match(/\b(GRADE\s+[A-Z0-9\-]+(?:\s*-\s*[A-Z][A-Za-z\s]{2,})?|Grade\s+[A-Za-z0-9\-]+)\b/i);
 return match ? match[1].trim() : "—";
}

function slugLooksLikeColour(slug: string): boolean {
 const s = slug.toLowerCase();
 return s.includes("colour") || s.includes("color");
}

function valueForSlugFromLine(slug: string, item: CartLineItem): string {
 const want = slug.toLowerCase();
 const exact = item.variantValues?.find((v) => (v.slug ?? "").toLowerCase() === want)?.value;
 if (exact != null && String(exact).trim()) return String(exact).trim();
 for (const v of item.variantValues ?? []) {
 const s = (v.slug ?? "").toLowerCase();
 if (!s) continue;
 if (s === want || s.endsWith(want) || want.endsWith(s)) {
 if (v.value != null && String(v.value).trim()) return String(v.value).trim();
 }
 }
 if (slugLooksLikeColour(slug)) return "";
 if (/grade|condition/i.test(slug)) {
 const g = getDisplayCondition(item);
 return g !== "—" ? g : "";
 }
 if (/model/i.test(slug) && item.brandModel?.trim()) return item.brandModel.trim();
 if (/storage|capacity|rom|gb|tb/i.test(slug) && item.capacity?.trim()) return item.capacity.trim();
 return "";
}

/** Normalize spaces for summary comparisons. */
function normSummaryFragment(s: string): string {
 return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function summaryWords(ctx: string): string[] {
 return normSummaryFragment(ctx).split(/\s+/).filter(Boolean);
}

/**
 * True if `part` repeats info already in `base` + prior parts. Uses word tokens so "8GB" is not treated
 * as duplicate of "256GB" (substring false positive). Multi-word parts must match a consecutive run.
 */
function isSummaryPartRedundant(base: string, priorParts: string[], part: string): boolean {
 const pWords = summaryWords(part);
 if (pWords.length === 0) return true;
 const cWords = summaryWords([base, ...priorParts].join(" "));
 if (pWords.length === 1) {
 return cWords.includes(pWords[0]!);
 }
 for (let i = 0; i <= cWords.length - pWords.length; i++) {
 let match = true;
 for (let j = 0; j < pWords.length; j++) {
 if (cWords[i + j] !== pWords[j]) {
 match = false;
 break;
 }
 }
 if (match) return true;
 }
 return false;
}

function itemsSummaryVariantDescription(
 item: CartLineItem,
 slugOrder: string[] | undefined
): string {
 const base = getSummaryItemName(item);
 if (!slugOrder?.length) {
 const cond = getDisplayCondition(item);
 if (cond !== "—") return [base, cond].filter(Boolean).join(" ").trim() || "—";
 return base || "—";
 }
 const parts: string[] = [];
 for (const slug of slugOrder) {
 if (slugLooksLikeColour(slug)) continue;
 const v = valueForSlugFromLine(slug, item);
 if (!v) continue;
 if (isSummaryPartRedundant(base, parts, v)) continue;
 parts.push(v);
 }
 if (parts.length === 0) {
 const cond = getDisplayCondition(item);
 if (cond !== "—") return [base, cond].filter(Boolean).join(" ").trim() || "—";
 return base || "—";
 }
 return [base, ...parts].filter(Boolean).join(" ").trim() || "—";
}

/** Remove trailing " - A" / " - B+" style grade suffix from inventory titles (grade still in Serial Items Details). */
function stripTrailingHyphenGradeSuffix(name: string): string {
 return name.replace(/\s+-\s+[A-Z]\+?\s*$/i, "").trim();
}

/** For Items Summary: show item name without colour so summary stays generic (colour shown in Serial Items Details only) */
function getSummaryItemName(item: CartLineItem): string {
 let name = item.name?.trim() ?? "";
 const colour = item.colour?.trim();
 if (colour) {
 const escaped = colour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 name = name.replace(new RegExp(`\\s*\\b${escaped}\\b\\s*`, "gi"), " ").replace(/\s+/g, " ").trim() || name;
 }
 name = stripTrailingHyphenGradeSuffix(name);
 return name || "—";
}

/** For Serial Items Details: show colour from item, or parse from name so colours always display when present. */
function getDisplayColour(item: CartLineItem): string {
 if (item.colour != null && String(item.colour).trim()) return String(item.colour).trim();
 const name = item.name?.trim() ?? "";
 const commonColours =
 /\b(BLUE|BLACK|WHITE|RED|GREEN|GOLD|SILVER|GREY|GRAY|PINK|PURPLE|ORANGE|NAVY|BROWN|BEIGE|CREAM|GRAPHITE|PHANTOM|STARLIGHT|MIDNIGHT|STORM|SAGE|LAVENDER|CORAL|MINT|IVORY|ROSE|YELLOW|TITANIUM|AZURE|SLATE|OLIVE|MAROON|TEAL|CYAN|BURGUNDY|CHAMPAGNE|COPPER|PLATINUM)\b/i;
 const match = name.match(commonColours);
 if (match) return match[1];
 const lastWord = name.split(/\s+/).filter(Boolean).pop();
 if (lastWord && lastWord.length >= 2 && lastWord.length <= 20 && /^[A-Za-z]+$/.test(lastWord)) return lastWord;
 return "—";
}

/** Strip all colour words from name so Serial Items Details can show base name + this serial's colour only (avoids "YELLOW BLUE"). */
const STRIP_COLOUR_WORDS =
 /\s+(BLUE|BLACK|WHITE|RED|GREEN|YELLOW|GOLD|SILVER|GREY|GRAY|PINK|PURPLE|ORANGE|NAVY|BROWN|BEIGE|CREAM|GRAPHITE|PHANTOM|STARLIGHT|MIDNIGHT|STORM|SAGE|LAVENDER|CORAL|MINT|IVORY|ROSE|TITANIUM|AZURE|SLATE|OLIVE|MAROON|TEAL|CYAN|BURGUNDY|CHAMPAGNE|COPPER|PLATINUM)\b/gi;
function nameWithoutColour(name: string): string {
 return (name ?? "").trim().replace(STRIP_COLOUR_WORDS, " ").replace(/\s+/g, " ").trim() || (name ?? "").trim();
}

/** Editable row for Items Summary table (wholesale): #, Item (variant-ordered), Qty, Unit price, Amount */
const SummaryTableRow: React.FC<{
 index: number;
 item: CartLineItem;
 onUpdateQty: (sku: string, delta: number) => void;
 onUpdatePrice?: (sku: string, price: string, serial?: string, wholeLine?: boolean) => void;
 formatMoney: (n: number) => string;
 currencySymbol: string;
 accent?: "orange" | "blue";
 categoryVariantSlugOrderByCategoryId?: Record<string, string[]>;
}> = ({
 index,
 item,
 onUpdateQty,
 onUpdatePrice,
 formatMoney,
 currencySymbol,
 accent = "blue",
 categoryVariantSlugOrderByCategoryId,
}) => {
 const slugOrder =
 item.categoryId && categoryVariantSlugOrderByCategoryId
 ? categoryVariantSlugOrderByCategoryId[item.categoryId]
 : undefined;
 const [priceInput, setPriceInput] = useState(parsePriceDisplay(item.price));
 const [editingPrice, setEditingPrice] = useState(false);
 useEffect(() => {
 if (!editingPrice) setPriceInput(parsePriceDisplay(item.price));
 }, [item.price, editingPrice]);
 const commitPrice = () => {
 setEditingPrice(false);
 const num = parseFloat(priceInput.replace(/[^0-9.-]/g, ""));
 if (!isNaN(num) && num >= 0 && onUpdatePrice) {
 // Items Summary: update whole group price (no split). Pass first serial to identify the line.
 onUpdatePrice(item.sku, num.toFixed(2), item.serialNumbers?.[0], true);
 }
 };
 const rateNum = parseFloat(item.price.replace(/[^0-9.-]/g, "")) || 0;
 const amount = rateNum * item.quantity;
 const isSerialItem = (item.serialNumbers?.length ?? 0) > 0;
 return (
 <tr className="border-b border-slate-100 last:border-0 align-middle bg-white hover:bg-slate-50/80 transition-colors">
 <td className="py-1.5 px-2 text-slate-500 tabular-nums shrink-0">{index + 1}</td>
 <td className="py-1.5 pl-2 pr-1 min-w-[180px] font-medium text-slate-900">
 {itemsSummaryVariantDescription(item, slugOrder)}
 </td>
 <td className="py-1.5 px-2 text-right">
 {isSerialItem ? (
  <span className="tabular-nums">{item.quantity}</span>
 ) : (
  <div className="flex items-center justify-end gap-0.5">
  <button
  type="button"
  onClick={() => onUpdateQty(item.sku, -1)}
  className="min-w-[28px] min-h-[28px] rounded flex items-center justify-center hover:bg-gray-100 text-gray-600"
  aria-label="Decrease quantity"
  >
  <Minus className="h-3.5 w-3.5" />
  </button>
  <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
  <button
  type="button"
  onClick={() => onUpdateQty(item.sku, 1)}
  className="min-w-[28px] min-h-[28px] rounded flex items-center justify-center hover:bg-gray-100 text-gray-600"
  aria-label="Increase quantity"
  >
  <Plus className="h-3.5 w-3.5" />
  </button>
  </div>
 )}
 </td>
 <td className="py-1.5 px-2 text-right overflow-visible">
 {onUpdatePrice ? (
  <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 min-w-[5.75rem] px-2 py-0.5 normal-case">
  <span className="text-gray-500 text-xs font-medium shrink-0 select-none">{currencySymbol}</span>
  <input
  type="text"
  inputMode="decimal"
  value={editingPrice ? priceInput : parsePriceDisplay(item.price)}
  onChange={(e) => {
  setPriceInput(e.target.value.replace(/[^0-9.]/g, ""));
  setEditingPrice(true);
  }}
  onBlur={commitPrice}
  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
  className="w-full min-w-[2.75rem] py-0.5 pl-1 pr-0.5 text-sm font-medium bg-transparent border-0 focus:ring-0 focus:outline-none tabular-nums text-right normal-case"
  aria-label="Unit price"
  />
  </span>
 ) : (
  <span className="text-sm tabular-nums">{item.price}</span>
 )}
 </td>
 <td className="py-1.5 px-2 text-right font-medium tabular-nums">{formatMoney(amount)}</td>
 </tr>
 );
};

/** Row type for Serial Items Details: includes sku so we can call onUpdatePrice(sku, price, serial); colour shown here */
type SerialDetailRow = {
 serial: string;
 name: string;
 grade: string;
 colour: string;
 rate: string;
 sku: string;
};

/** Grade value → short token (e.g. "GRADE A" / "Grade A" → "A") for inline description. */
function compactGradeToken(grade: string): string {
 const g = grade.trim();
 if (!g || g === "—") return "";
 const m = g.match(/\bgrade\s+([A-Z0-9]+(?:\+)?)\b/i);
 if (m) return m[1].toUpperCase();
 if (/^[A-Z0-9]+(?:\+)?$/i.test(g)) return g.toUpperCase();
 return g;
}

/** One line: base name + grade + colour (e.g. "APPLE IPHONE 7 PLUS 128GB GRADE A BLACK"). */
function serialRowInlineDescription(row: SerialDetailRow): string {
 const base = nameWithoutColour(row.name ?? "").trim();
 const token = compactGradeToken(row.grade);
 const g = token ? `GRADE ${token}` : "";
 const c = (row.colour ?? "").trim();
 const colourPart = c && c !== "—" && c.toLowerCase() !== base.toLowerCase() ? c : "";
 return [base, g, colourPart].filter(Boolean).join(" ").trim() || "—";
}

/** Editable rate cell for a single serial row */
const SerialDetailRateCell: React.FC<{
 row: SerialDetailRow;
 onUpdatePrice?: (sku: string, price: string, serial?: string) => void;
 currencySymbol: string;
}> = ({ row, onUpdatePrice, currencySymbol }) => {
 const [priceInput, setPriceInput] = useState(parsePriceDisplay(row.rate));
 const [editingPrice, setEditingPrice] = useState(false);
 useEffect(() => {
 if (!editingPrice) setPriceInput(parsePriceDisplay(row.rate));
 }, [row.rate, editingPrice]);
 const commitPrice = () => {
 setEditingPrice(false);
 const num = parseFloat(priceInput.replace(/[^0-9.-]/g, ""));
 if (!isNaN(num) && num >= 0 && onUpdatePrice) {
 onUpdatePrice(row.sku, num.toFixed(2), row.serial);
 }
 };
 if (!onUpdatePrice) {
 return <td className="py-1.5 px-2 text-right text-sm tabular-nums">{row.rate}</td>;
 }
 return (
 <td className="py-1.5 px-2 text-right">
 <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 min-w-[5.75rem] px-2 py-0.5 normal-case justify-end">
 <span className="text-gray-500 text-xs font-medium shrink-0 select-none">{currencySymbol}</span>
 <input
  type="text"
  inputMode="decimal"
  value={editingPrice ? priceInput : parsePriceDisplay(row.rate)}
  onChange={(e) => {
  setPriceInput(e.target.value.replace(/[^0-9.]/g, ""));
  setEditingPrice(true);
  }}
  onBlur={commitPrice}
  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
  className="w-full min-w-[2.75rem] py-0.5 pl-1 pr-0.5 text-sm font-medium bg-transparent border-0 focus:ring-0 focus:outline-none tabular-nums text-right normal-case"
  aria-label="Unit price"
 />
 </span>
 </td>
 );
};

const SerialItemsDetailTable: React.FC<{
 serialRows: SerialDetailRow[];
 onUpdatePrice?: (sku: string, price: string, serial?: string) => void;
 onRemove: (sku: string, serial?: string) => void;
 currencySymbol: string;
}> = ({ serialRows, onUpdatePrice, onRemove, currencySymbol }) => (
 <section
 className="rounded-xl border border-neutral-200 bg-neutral-50/50 shadow-sm overflow-hidden ring-1 ring-violet-100/80"
 aria-label="Serial items details table"
 >
 <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wide px-2.5 py-1.5 bg-neutral-100/90 border-b border-neutral-200/90">
 Serial items details
 </h3>
 <div className="overflow-x-auto bg-white">
 <table className="w-full text-sm min-w-[480px]">
 <thead>
  <tr className="text-left text-neutral-800/90 text-xs font-semibold uppercase tracking-wide border-b border-neutral-100 bg-neutral-50/80">
  <th className="py-1.5 px-2 w-8 shrink-0">#</th>
  <th className="py-1.5 pl-2 pr-1 min-w-[100px]">Serial / IMEI</th>
  <th className="py-1.5 pl-1 pr-2 min-w-[180px]">Product</th>
  <th className="py-1.5 px-2 text-right w-24 shrink-0">Unit</th>
  <th className="py-1.5 px-2 w-10 shrink-0" aria-label="Remove" />
  </tr>
 </thead>
 <tbody>
  {serialRows.map((r, i) => (
  <tr
  key={`${r.sku}-${r.serial}-${i}`}
  className="border-b border-neutral-100/80 last:border-0 odd:bg-white even:bg-neutral-50/40"
  >
  <td className="py-1.5 px-2 text-neutral-700/80 tabular-nums shrink-0 align-top">{i + 1}</td>
  <td className="py-1.5 pl-2 pr-1 min-w-[100px] align-top">
  <span className="font-mono text-xs font-semibold text-neutral-900">{r.serial}</span>
  </td>
  <td className="py-1.5 pl-1 pr-2 min-w-[180px] align-top text-gray-900">
  <span className="text-sm font-medium leading-snug">{serialRowInlineDescription(r)}</span>
  </td>
  <SerialDetailRateCell row={r} onUpdatePrice={onUpdatePrice} currencySymbol={currencySymbol} />
  <td className="py-1.5 px-2 w-10 align-top">
  <button
   type="button"
   onClick={() => onRemove(r.sku, r.serial)}
   className="p-1 rounded-md text-red-600 hover:bg-red-50"
   aria-label={`Remove ${r.name} (${r.serial})`}
  >
   <Trash2 className="h-3.5 w-3.5" />
  </button>
  </td>
  </tr>
  ))}
 </tbody>
 </table>
 </div>
 </section>
);

interface CartLineRowProps {
 item: CartLineItem;
 onUpdateQty: (sku: string, delta: number) => void;
 onUpdatePrice?: (sku: string, price: string, serial?: string) => void;
 onRemove: (sku: string, serial?: string) => void;
 collapsible?: boolean;
 accent?: "orange" | "blue";
 formatMoney: (n: number) => string;
 currencySymbol: string;
}

const CartLineRow: React.FC<CartLineRowProps> = ({
 item,
 onUpdateQty,
 onUpdatePrice,
 onRemove,
 collapsible = false,
 accent = "orange",
 formatMoney,
 currencySymbol,
}) => {
 const lineTotalClass = accent === "blue" ? "text-blue-600" : "text-orange-600";
 const [priceInput, setPriceInput] = useState(parsePriceDisplay(item.price));
 const [editingPrice, setEditingPrice] = useState(false);

 useEffect(() => {
 if (!editingPrice) setPriceInput(parsePriceDisplay(item.price));
 }, [item.price, editingPrice]);

 const commitPrice = () => {
 setEditingPrice(false);
 const num = parseFloat(priceInput.replace(/[^0-9.-]/g, ""));
 if (!isNaN(num) && num >= 0 && onUpdatePrice) {
 onUpdatePrice(item.sku, num.toFixed(2), item.serialNumbers?.[0]);
 } else {
 setPriceInput(parsePriceDisplay(item.price));
 }
 };

 const unitPriceNum = parseFloat(item.price.replace(/[^0-9.-]/g, "")) || 0;
 const lineTotal = unitPriceNum * item.quantity;

 const isSerialLine = Boolean(item.serialNumbers && item.serialNumbers.length > 0);

 if (collapsible) {
 return (
 <li
 className={`rounded-lg border shadow-sm overflow-hidden ${
  isSerialLine
  ? "border-l-[3px] border-l-orange-500 border-y border-r border-gray-200 bg-neutral-50"
  : "bg-white border border-gray-200"
 }`}
 >
 <div className="p-1.5 @[480px]/cp:p-2 flex items-center justify-between gap-2">
  <div className="min-w-0 flex-1">
  <p className="text-[11px] @[480px]/cp:text-xs font-medium text-gray-900 truncate min-w-0">
  {item.name}
  </p>
  </div>
  <div className="grid grid-cols-[minmax(0,1fr)_72px_80px_72px_28px] gap-1.5 items-center flex-shrink-0 min-w-0">
  <div className="min-w-0 flex items-center justify-start">
  {item.serialNumbers && item.serialNumbers.length > 0 && (
  <span className={`font-mono text-[10px] font-semibold rounded px-1.5 py-0.5 truncate max-w-full block ${accent === "blue" ? "bg-blue-50 border border-blue-200 text-blue-900" : "bg-gray-100 border border-gray-200 text-gray-900"}`} title={item.serialNumbers.join(", ")}>
   {item.serialNumbers.length > 1 ? `${item.serialNumbers[0]} (+${item.serialNumbers.length - 1} more)` : item.serialNumbers[0]}
  </span>
  )}
  </div>
  <div className="flex justify-center">
  {item.serialNumbers && item.serialNumbers.length > 0 ? (
  <span className="text-[11px] font-semibold text-gray-500 tabular-nums">×{item.quantity}</span>
  ) : (
  <div className="flex items-center gap-0 rounded-md border border-gray-200 bg-gray-50 p-0.5">
   <button
   type="button"
   onClick={() => onUpdateQty(item.sku, -1)}
   className="min-w-[24px] min-h-[24px] rounded flex items-center justify-center hover:bg-white text-gray-600 touch-manipulation"
   aria-label="Decrease quantity"
   >
   <Minus className="h-3 w-3" />
   </button>
   <span className="min-w-[1rem] text-center text-[11px] font-semibold tabular-nums">{item.quantity}</span>
   <button
   type="button"
   onClick={() => onUpdateQty(item.sku, 1)}
   className="min-w-[24px] min-h-[24px] rounded flex items-center justify-center hover:bg-white text-gray-600 touch-manipulation"
   aria-label="Increase quantity"
   >
   <Plus className="h-3 w-3" />
   </button>
  </div>
  )}
  </div>
  {onUpdatePrice ? (
  <span>
  <span className="sr-only">Unit price</span>
  <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 w-full min-w-[4.5rem] px-1.5 py-0.5 normal-case">
   <span className="text-gray-500 text-[10px] font-medium shrink-0 select-none">{currencySymbol}</span>
   <input
   type="text"
   inputMode="decimal"
   value={editingPrice ? priceInput : parsePriceDisplay(item.price)}
   onChange={(e) => {
   setPriceInput(e.target.value.replace(/[^0-9.]/g, ""));
   setEditingPrice(true);
   }}
   onBlur={commitPrice}
   onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
   className="w-full min-w-0 py-0.5 pl-0.5 pr-0.5 text-[11px] font-bold bg-transparent border-0 focus:ring-0 focus:outline-none tabular-nums normal-case"
   aria-label="Unit price"
   />
  </span>
  </span>
  ) : (
  <span className="text-[11px] text-gray-500 tabular-nums">{item.price}</span>
  )}
  <span className={`text-[11px] font-bold tabular-nums text-right ${lineTotalClass}`}>
  {formatMoney(lineTotal)}
  </span>
  <button
  type="button"
  onClick={() => onRemove(item.sku, item.serialNumbers?.[0])}
  className="p-1 rounded text-red-600 hover:bg-red-50 touch-manipulation justify-self-center"
  aria-label={`Remove ${item.name}`}
  >
  <Trash2 className="h-3.5 w-3.5" />
  </button>
  </div>
 </div>
 </li>
 );
 }

 return (
 <li
 className={`p-4 rounded-xl border shadow-sm ${
 isSerialLine
  ? "border-l-[4px] border-l-orange-500 border-y border-r border-gray-200 bg-neutral-50"
  : "bg-white border border-gray-200"
 }`}
 >
 {/* Row 1: Product name + Serial + Remove */}
 <div className="flex items-start justify-between gap-2 mb-3">
 <div className="flex-1 min-w-0 pr-2 flex flex-wrap items-baseline gap-2">
  <p className={`text-sm font-semibold text-gray-900 leading-tight ${collapsible ? "line-clamp-3 break-words" : ""}`}>
  {item.name}
  </p>
  {item.serialNumbers && item.serialNumbers.length > 0 && (
  <span className={`font-mono text-sm font-semibold rounded-md px-2 py-1 break-all shrink-0 ${accent === "blue" ? "bg-blue-50 border border-blue-200 text-blue-900" : "bg-gray-100 border border-gray-200 text-gray-900"}`} title={item.serialNumbers.join(", ")}>
  {item.serialNumbers.length > 1 ? `${item.serialNumbers[0]} (+${item.serialNumbers.length - 1} more)` : item.serialNumbers[0]}
  </span>
  )}
 </div>
 <div className="flex items-center gap-1 flex-shrink-0">
  <button
  type="button"
  onClick={() => onRemove(item.sku, item.serialNumbers?.[0])}
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 touch-manipulation"
  aria-label={`Remove ${item.name}`}
  >
  <Trash2 className="h-5 w-5" />
  </button>
 </div>
 </div>

 {/* Row 2: Unit price × Qty + Line total */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
 {onUpdatePrice ? (
  <div className="flex items-center gap-2 flex-wrap">
  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
  Unit price
  </label>
  <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 normal-case">
  <span className="pl-2.5 pr-1 text-gray-500 text-sm font-medium shrink-0 select-none">{currencySymbol}</span>
  <input
  type="text"
  inputMode="decimal"
  value={editingPrice ? priceInput : parsePriceDisplay(item.price)}
  onChange={(e) => {
   setPriceInput(e.target.value.replace(/[^0-9.]/g, ""));
   setEditingPrice(true);
  }}
  onBlur={commitPrice}
  onKeyDown={(e) => e.key === "Enter" && commitPrice()}
  className="w-16 py-1.5 pr-2 text-sm font-medium bg-transparent border-0 focus:ring-0 focus:outline-none normal-case"
  aria-label="Unit price"
  />
  </div>
  <span className="text-gray-500 text-sm">×</span>
  <span className="text-sm font-semibold text-gray-700 tabular-nums">{item.quantity}</span>
  </div>
 ) : (
  <span className="text-sm text-gray-600">
  {item.price} × {item.quantity}
  </span>
 )}
 <span className={`text-sm font-bold ml-auto tabular-nums ${lineTotalClass}`}>
  {formatMoney(lineTotal)}
 </span>
 </div>

 {/* Row 3: Quantity stepper (serial items show count; no stepper to avoid desync with serials) */}
 {item.serialNumbers && item.serialNumbers.length > 0 ? (
 <p className="text-sm text-gray-600">
  Quantity: {item.quantity} <span className="text-gray-400">(serial item{item.quantity > 1 ? "s" : ""})</span>
 </p>
 ) : (
 <div className="flex items-center gap-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5 w-fit">
  <button
  type="button"
  onClick={() => onUpdateQty(item.sku, -1)}
  className="min-w-[40px] min-h-[40px] rounded-md flex items-center justify-center hover:bg-white active:bg-gray-100 touch-manipulation text-gray-600"
  aria-label="Decrease quantity"
  >
  <Minus className="h-5 w-5" />
  </button>
  <span className="min-w-[2.5rem] text-center text-sm font-bold text-gray-900 tabular-nums">
  {item.quantity}
  </span>
  <button
  type="button"
  onClick={() => onUpdateQty(item.sku, 1)}
  className="min-w-[40px] min-h-[40px] rounded-md flex items-center justify-center hover:bg-white active:bg-gray-100 touch-manipulation text-gray-600"
  aria-label="Increase quantity"
  >
  <Plus className="h-5 w-5" />
  </button>
 </div>
 )}
 </li>
 );
};

export const CartPanel: React.FC<CartPanelProps> = ({
 title = "Current Sale",
 emptyHint,
 items,
 subtotal,
 tax,
 total,
 onUpdateQty,
 onUpdatePrice,
 onRemove,
 onClear,
 onPay,
 payDisabled = false,
 payDisabledLabel,
 accent = "orange",
 collapsibleLines = false,
 primaryButtonLabel,
 showItemsSummaryAndDetail = false,
 categoryVariantSlugOrderByCategoryId,
 prominentTotals = false,
 onHold,
}) => {
 const taxSlot = useCartTaxSlot();
 const { formatMoney, currencySymbol } = useAppCurrency();
 const canPay = items.length > 0 && !payDisabled;
 const isWholesale = accent === "blue";
 const accentClasses = isWholesale
 ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
 : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700";
 const totalColorClass = isWholesale ? "text-blue-600" : "text-orange-600";
 const showCartTitleRow = Boolean(title?.trim());
 return (
 <div className="@container/cp flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 {showCartTitleRow && (
 <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
  <ShoppingCart className="h-5 w-5" />
  {title}
  </h2>
  {items.length > 0 && (
  <button
  onClick={onClear}
  className="text-sm text-red-600 hover:text-red-700 font-medium touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center px-3 rounded-lg hover:bg-red-50 active:bg-red-100"
  aria-label="Clear cart"
  >
  Clear
  </button>
  )}
 </div>
 )}
 {/* Retail: cart lines only. Wholesale: Items Summary + IMEI Detail + editable lines */}
 <div className={`flex-1 overflow-y-auto touch-scroll min-h-0 ${showItemsSummaryAndDetail ? "p-2.5 sm:p-3 space-y-3" : prominentTotals ? "p-1.5 @[480px]/cp:p-2" : "p-4 sm:p-5"}`}>
 {items.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
  <ShoppingCart className="h-12 w-12 mb-3 opacity-50" />
  <div className="flex items-center gap-2 flex-wrap justify-center">
  <p className="text-sm font-medium">Cart is empty</p>
  <HelpTip ariaLabel="How to add to cart" contentClassName="text-left text-slate-700">
  {emptyHint ?? "Tap products or use “Add manual item” above"}
  </HelpTip>
  </div>
  </div>
 ) : showItemsSummaryAndDetail ? (
  <>
  <section className="rounded-xl border border-slate-200 bg-slate-50/70 shadow-sm overflow-hidden ring-1 ring-slate-100">
  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-200/70 border-b border-slate-200">
  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Items summary</h3>
  <HelpTip
   align="end"
   ariaLabel="About items summary"
   contentClassName="border-slate-200 bg-slate-50 text-slate-800 [&_span.font-medium]:text-neutral-800"
   iconClassName="h-3.5 w-3.5 text-slate-600"
  >
   Line totals by product. Per-serial prices and removals are in{" "}
   <span className="font-medium text-neutral-800">Serial items details</span> below.
  </HelpTip>
  </div>
  <div className="overflow-x-auto bg-white">
  <table className="w-full text-sm min-w-[480px]">
   <thead>
   <tr className="text-left text-slate-600 text-xs font-semibold uppercase tracking-wide border-b border-slate-200 bg-slate-100/90">
   <th className="py-1.5 px-2 w-8 shrink-0">#</th>
   <th className="py-1.5 pl-2 pr-1 min-w-[180px]">Item</th>
   <th className="py-1.5 px-2 text-right w-20 shrink-0">Qty</th>
   <th className="py-1.5 px-2 text-right w-28 shrink-0">Unit price</th>
   <th className="py-1.5 px-2 text-right w-24 shrink-0">Amount</th>
   </tr>
   </thead>
   <tbody>
   {items.map((item, idx) => (
   <SummaryTableRow
   key={item.sku + (item.serialNumbers?.[0] ?? idx)}
   index={idx}
   item={item}
   onUpdateQty={onUpdateQty}
   onUpdatePrice={onUpdatePrice}
   formatMoney={formatMoney}
   currencySymbol={currencySymbol}
   accent={accent}
   categoryVariantSlugOrderByCategoryId={categoryVariantSlugOrderByCategoryId}
   />
   ))}
   </tbody>
  </table>
  </div>
  </section>

  {(() => {
  const serialRows: SerialDetailRow[] = [];
  items.forEach((item) => {
  if (item.serialNumbers && item.serialNumbers.length > 0) {
   item.serialNumbers.forEach((serial) => {
   const grade =
   (item.serialGrades && item.serialGrades[serial]?.trim()) || getDisplayCondition(item);
   const colour =
   (item.serialColours && item.serialColours[serial]?.trim()) || getDisplayColour(item);
   const rate = item.serialPrices?.[serial] ?? item.price;
   serialRows.push({
   serial,
   name: item.name ?? "—",
   grade,
   colour,
   rate,
   sku: item.sku,
   });
   });
  }
  });
  if (serialRows.length === 0) return null;
  return (
  <SerialItemsDetailTable
   serialRows={serialRows}
   onUpdatePrice={onUpdatePrice}
   onRemove={onRemove}
   currencySymbol={currencySymbol}
  />
  );
  })()}
  </>
 ) : (
  <>
  {prominentTotals && (
  <div className="grid grid-cols-[minmax(0,1fr)_72px_80px_72px_28px] gap-1.5 items-center px-1.5 @[480px]/cp:px-2 pb-1 mb-1.5 border-b border-slate-200">
   <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Product</span>
   <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Qty</span>
   <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Each</span>
   <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Total</span>
   <span />
  </div>
  )}
  <ul className={prominentTotals ? "space-y-1" : "space-y-3"}>
  {items.map((item, index) => (
  <CartLineRow
  key={item.serialNumbers?.[0] ? `${item.sku}-${item.serialNumbers[0]}` : `${item.sku}-${index}`}
  item={item}
  onUpdateQty={onUpdateQty}
  onUpdatePrice={onUpdatePrice}
  onRemove={onRemove}
  collapsible={collapsibleLines}
  accent={accent}
  formatMoney={formatMoney}
  currencySymbol={currencySymbol}
  />
  ))}
  </ul>
  </>
 )}
 </div>

 {/* Totals & Pay */}
 <div className={`border-t border-gray-200 ${prominentTotals ? "bg-white" : "bg-gray-50"} space-y-1.5 ${showItemsSummaryAndDetail ? "p-2.5 sm:p-3" : "p-4 sm:p-5 space-y-2"}`}>
 {items.length > 0 && (
  <>
  {prominentTotals ? (
   <>
   <div className="rounded-md bg-white border border-slate-200 p-2 @[480px]/cp:p-3 mb-0.5">
   <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-3 gap-y-1.5 items-center">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Items</span>
    <span className="text-sm @[480px]/cp:text-base font-bold tabular-nums text-slate-900 text-right">{items.reduce((s, i) => s + i.quantity, 0)}</span>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total</span>
    <span className="text-sm @[480px]/cp:text-base @[768px]/cp:text-lg font-bold tabular-nums text-slate-900 text-right">{formatMoney(subtotal)}</span>

    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Discount</span>
    <span className="text-sm @[480px]/cp:text-base font-bold tabular-nums text-slate-900 text-right">{formatMoney(Math.max(0, subtotal - total + tax))}</span>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Due</span>
    <span className={`text-sm @[480px]/cp:text-base @[768px]/cp:text-lg font-bold tabular-nums text-right ${total > 0 ? "text-red-600" : "text-slate-900"}`}>{formatMoney(total)}</span>

    {tax > 0 && (
    <>
     <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">&nbsp;</span>
     <span />
     <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tax</span>
     <span className="text-xs @[480px]/cp:text-sm font-semibold tabular-nums text-slate-700 text-right">{formatMoney(tax)}</span>
    </>
    )}
   </div>
   </div>
   {taxSlot}
   </>
  ) : (
   <>
   <div className="flex justify-between text-sm">
   <span className="text-gray-600">Subtotal</span>
   <span className="font-medium">{formatMoney(subtotal)}</span>
   </div>
   {taxSlot}
   {tax > 0 && (
   <div className="flex justify-between text-sm">
    <span className="text-gray-600">Tax</span>
    <span className="font-medium">{formatMoney(tax)}</span>
   </div>
   )}
   <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
   <span>Total</span>
   <span className={totalColorClass}>{formatMoney(total)}</span>
   </div>
   </>
  )}
  </>
 )}
 {payDisabled && payDisabledLabel && (
  <p className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded-lg">
  {payDisabledLabel}
  </p>
 )}
 {prominentTotals ? (
  <div className="grid grid-cols-3 gap-1 @[280px]/cp:gap-1.5 @[480px]/cp:gap-2 pt-0.5">
  <button
  type="button"
  onClick={onClear}
  disabled={items.length === 0}
  className="min-h-[28px] @[280px]/cp:min-h-[32px] @[480px]/cp:min-h-[36px] @[768px]/cp:min-h-[40px] rounded @[280px]/cp:rounded-md @[480px]/cp:rounded-lg border @[280px]/cp:border-2 border-red-300 bg-white text-red-600 font-semibold text-[10px] @[280px]/cp:text-[11px] @[480px]/cp:text-xs @[768px]/cp:text-sm hover:bg-red-50 active:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation tracking-wide uppercase"
  aria-label="Delete (clear cart)"
  >
  Delete
  </button>
  <button
  type="button"
  onClick={onHold}
  disabled={items.length === 0 || !onHold}
  className="min-h-[28px] @[280px]/cp:min-h-[32px] @[480px]/cp:min-h-[36px] @[768px]/cp:min-h-[40px] rounded @[280px]/cp:rounded-md @[480px]/cp:rounded-lg border @[280px]/cp:border-2 border-slate-300 bg-white text-slate-800 font-semibold text-[10px] @[280px]/cp:text-[11px] @[480px]/cp:text-xs @[768px]/cp:text-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation tracking-wide uppercase"
  aria-label="Hold (save draft)"
  >
  Hold
  </button>
  <button
  onClick={onPay}
  disabled={!canPay}
  className={`min-h-[28px] @[280px]/cp:min-h-[32px] @[480px]/cp:min-h-[36px] @[768px]/cp:min-h-[40px] rounded @[280px]/cp:rounded-md @[480px]/cp:rounded-lg text-white font-bold text-[10px] @[280px]/cp:text-[11px] @[480px]/cp:text-xs @[768px]/cp:text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation tracking-wide uppercase ${accentClasses}`}
  >
  Pay {items.length > 0 ? formatMoney(total) : ""}
  </button>
  </div>
 ) : (
 <button
  onClick={onPay}
  disabled={!canPay}
  className={`w-full flex items-center justify-center gap-1 @[280px]/cp:gap-1.5 text-white font-bold rounded-md @[480px]/cp:rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation ${showItemsSummaryAndDetail ? "py-1.5 @[280px]/cp:py-2 min-h-[32px] @[280px]/cp:min-h-[38px] text-[11px] @[280px]/cp:text-xs @[480px]/cp:text-sm font-semibold" : "py-1.5 @[280px]/cp:py-2 @[480px]/cp:py-2.5 min-h-[34px] @[280px]/cp:min-h-[40px] @[480px]/cp:min-h-[44px] text-xs @[280px]/cp:text-sm @[480px]/cp:text-base font-semibold"} ${accentClasses}`}
 >
  <CreditCard className="h-3.5 w-3.5 @[280px]/cp:h-4 @[280px]/cp:w-4 @[480px]/cp:h-4.5 @[480px]/cp:w-4.5" />
  {primaryButtonLabel ?? (isWholesale ? "Complete Order" : "Pay")} {items.length > 0 ? formatMoney(total) : ""}
 </button>
 )}
 </div>
 </div>
 );
};

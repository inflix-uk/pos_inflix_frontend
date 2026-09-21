"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useProducts } from "@/lib/products-context";
import type { CartLineItem, POSProduct, PaymentMethod } from "../types";
import { salesApi } from "../service/salesApi";
import { printInvoiceA4 } from "@/lib/invoicePrint";
import { openCashDrawer } from "@/services/printService";
import { useCartTaxConfig } from "../components/CartTaxSlotContext";

const parsePrice = (priceStr: string): number => {
 const num = parseFloat(priceStr.replace(/[^0-9.-]/g, ""));
 return isNaN(num) ? 0 : num;
};

const COLOUR_WORDS =
 /\s+(BLUE|BLACK|WHITE|RED|GREEN|YELLOW|GOLD|SILVER|GREY|GRAY|PINK|PURPLE|ORANGE|NAVY|BROWN|BEIGE|CREAM|GRAPHITE|PHANTOM|STARLIGHT|MIDNIGHT|STORM|SAGE|LAVENDER|CORAL|MINT|IVORY|ROSE|TITANIUM|AZURE|SLATE|OLIVE)$/i;

/** Name with colour word stripped from end so same product with/without colour in name matches (colour is not part of SKU). */
function normalizedNameForVariant(name: string): string {
 return (name ?? "").trim().replace(COLOUR_WORDS, "").replace(/\s+/g, " ").trim() || (name ?? "").trim();
}

/** Same product variant (normalized name + grade; colour is not part of SKU). Merges same product even if one has colour in name and one doesn't. Case-insensitive so "C" and "c" merge. */
function variantKey(item: { name?: string; colour?: string; grade?: string }): string {
 const n = normalizedNameForVariant(item.name ?? "").toUpperCase().replace(/\s+/g, " ").trim();
 const g = (item.grade ?? "").trim().toUpperCase();
 return `${n}\t${g}`;
}

function isColourVariantSlug(slug: string | undefined): boolean {
 if (!slug) return false;
 const s = slug.toLowerCase();
 return s.includes("colour") || s.includes("color");
}

/** Merge key for serial lines: variant attribute values except colour; else name+grade fallback.
 * Always appends grade so different conditions never share a summary line.
 * When grade is missing (e.g. old index snapshot), also key by unit price so £125 and £110 stay separate.
 */
function serialVariantMergeKey(item: {
 name?: string;
 grade?: string;
 price?: string;
 variantValues?: { slug?: string; value?: string }[];
}): string {
 const grade = productGradeString(item).toUpperCase();
 const raw = item.variantValues?.filter((v) => v?.slug && !isColourVariantSlug(v.slug));
 let base: string;
 if (raw && raw.length > 0) {
  const parts = [...raw]
   .sort((a, b) => (a.slug ?? "").localeCompare(b.slug ?? ""))
   .map((v) => `${(v.slug ?? "").toLowerCase()}\t${(v.value ?? "").trim().toUpperCase()}`);
  // If variantValues already include grade/condition, don't double-key — still append normalized grade below for safety.
  base = `vv:${parts.join("\x1f")}`;
 } else {
  base = variantKey(item);
 }
 if (grade) return `${base}\tg:${grade}`;
 const priceKey = parsePrice(String(item.price ?? "0")).toFixed(2);
 return `${base}\tp:${priceKey}`;
}

function productGradeString(p: { grade?: string; name?: string }): string {
 if (p.grade != null && String(p.grade).trim()) return String(p.grade).trim();
 const nameStr = (p.name ?? "").trim();
 const match = nameStr.match(/\b(GRADE\s+[A-Z0-9\-]+(?:\s*-\s*[A-Z][A-Za-z\s]{2,})?|Grade\s+[A-Za-z0-9\-]+)\b/i);
 return match ? match[1].trim() : "";
}

function productModelString(p: { brandModel?: string }): string {
 if (p.brandModel != null && String(p.brandModel).trim()) return String(p.brandModel).trim();
 return "";
}

/** First serial's price from line (one price per variant; no recent-inventory rule). */
function firstSerialPrice(line: CartLineItem): string {
 const prices = line.serialPrices ?? {};
 const serials = line.serialNumbers ?? [];
 const first = serials[0];
 if (first && prices[first]) return prices[first];
 const anyPrice = Object.values(prices)[0];
 return anyPrice ?? line.price;
}

/** Line amount: sum per-serial prices when present so mixed rates are not flattened to qty × unit. */
function cartLineAmount(line: CartLineItem): number {
 const serials = line.serialNumbers ?? [];
 const prices = line.serialPrices ?? {};
 if (serials.length > 0 && Object.keys(prices).length > 0) {
  return serials.reduce((sum, sn) => sum + parsePrice(prices[sn] ?? line.price), 0);
 }
 return parsePrice(line.price) * line.quantity;
}

/** Colour for a product (from API or parsed from name) so we can store per-serial. */
function productColour(p: { name?: string; colour?: string }): string {
 if (p.colour != null && String(p.colour).trim()) return String(p.colour).trim();
 const name = (p.name ?? "").trim();
 const match = name.match(
  /\b(BLUE|BLACK|WHITE|RED|GREEN|GOLD|SILVER|GREY|GRAY|PINK|PURPLE|ORANGE|NAVY|BROWN|YELLOW|BEIGE|CREAM|GRAPHITE|PHANTOM|STARLIGHT|MIDNIGHT|STORM|SAGE|LAVENDER|CORAL|MINT|IVORY|ROSE|TITANIUM|AZURE|SLATE|OLIVE)\b/i
 );
 if (match) return match[1];
 const last = name.split(/\s+/).filter(Boolean).pop();
 if (last && last.length >= 2 && last.length <= 20 && /^[A-Za-z]+$/.test(last) && !/^(product|item|misc)$/i.test(last)) return last;
 return "";
}

/** When provided, sales dashboard uses these products (e.g. from inventory/products) instead of products context */
export interface SalesDashboardProductsOverride {
 products: Array<{
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  unit: string;
  qty: number;
  iconColor?: string;
  serialNumber?: string;
  /** Barcode / SKU for non-serial items (search and add-by-scan) */
  barcode?: string;
  grade?: string;
  colour?: string;
  brandModel?: string;
  capacity?: string;
  categoryId?: string;
  variantValues?: { slug?: string; value?: string }[];
  inventoryDate?: string;
  unitCost?: number;
  purchaseId?: string;
  purchaseItemId?: string;
 }>;
}

/** Map of serial number -> { customerName } for "Already sold to [Customer Name]" check */
export type SoldInfoMap = Record<string, { customerName: string; saleReference?: string }>;

export const useSalesDashboard = (options?: {
 productsOverride?: SalesDashboardProductsOverride["products"] | null;
 soldInfoMap?: SoldInfoMap | null;
 /** Optional key to persist cart as a draft in localStorage (e.g. wholesale-dashboard) */
 draftStorageKey?: string | null;
 /** Location where sale occurs (for multi-location; new sales should set this when available). */
 locationId?: string | null;
 /** Optional pricing group for customer-group price when adding by SKU/barcode. */
 pricingGroupId?: string | null;
 /** Pre-loaded category names so category buttons appear before products load. */
 categoriesOverride?: string[] | null;
 /** When true, refuse cart adds/increases that would exceed on-hand inventory (product.qty). */
 blockNegativeStock?: boolean;
}) => {
 const { products: contextProducts } = useProducts();
 const productsOverride = options?.productsOverride;
 const soldInfoMap = options?.soldInfoMap ?? {};
 const draftStorageKey = options?.draftStorageKey ?? null;
 const locationId = options?.locationId ?? null;
 const pricingGroupId = options?.pricingGroupId ?? undefined;
 const blockNegativeStock = options?.blockNegativeStock ?? false;

 const products = useMemo(() => {
  // When override is an array (including empty), use it so wholesale can show only real inventory
  if (Array.isArray(productsOverride)) return productsOverride;
  return contextProducts.map((p) => ({
   sku: p.sku,
   name: p.name,
   category: p.category,
   brand: p.brand,
   price: p.price,
   unit: p.unit,
   qty: p.qty,
   iconColor: p.iconColor,
   serialNumber: (p as { serialNumber?: string }).serialNumber,
   barcode: (p as { barcode?: string }).barcode,
   grade: (p as { grade?: string }).grade,
   colour: (p as { colour?: string }).colour,
   brandModel: (p as { brandModel?: string }).brandModel,
   capacity: (p as { capacity?: string }).capacity,
   categoryId: (p as { categoryId?: string }).categoryId,
   variantValues: (p as { variantValues?: { slug?: string; value?: string }[] }).variantValues,
   inventoryDate: (p as { inventoryDate?: string }).inventoryDate,
  }));
 }, [productsOverride, contextProducts]);
 const [cart, setCart] = useState<CartLineItem[]>([]);
 const cartStateRef = useRef<CartLineItem[]>([]);
 cartStateRef.current = cart;
 const [search, setSearch] = useState("");
 const [categoryFilter, setCategoryFilter] = useState<string>("all");
 const [paymentModalOpen, setPaymentModalOpen] = useState(false);
 const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 // Idempotency key for the current checkout — same id reused on retry so a network glitch
 // does not create a duplicate or trigger "Serial already sold". Rotated after a successful sale.
 const retailRequestIdRef = useRef<string>("");

 // Persist cart to draft storage (if enabled). Do not hydrate here — wholesale page moves session into Drafts list on load.
 useEffect(() => {
  if (!draftStorageKey || typeof window === "undefined") return;
  try {
   if (cart.length > 0) {
    window.localStorage.setItem(draftStorageKey, JSON.stringify(cart));
   }
   // when cart is empty we do not removeItem here; page clears session after moving to drafts
  } catch {
   // ignore quota / storage errors
  }
 }, [cart, draftStorageKey]);

 const showMessage = (type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 };

 const posProducts: POSProduct[] = useMemo(
  () =>
   products.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    brand: p.brand,
    price: p.price,
    unit: p.unit,
    qty: p.qty,
    iconColor: p.iconColor,
    serialNumber: p.serialNumber,
    barcode: (p as { barcode?: string }).barcode,
    grade: (p as { grade?: string }).grade,
    colour: (p as { colour?: string }).colour,
    brandModel: (p as { brandModel?: string }).brandModel,
    capacity: (p as { capacity?: string }).capacity,
    categoryId: (p as { categoryId?: string }).categoryId,
    variantValues: (p as { variantValues?: { slug?: string; value?: string }[] }).variantValues,
    inventoryDate: (p as { inventoryDate?: string }).inventoryDate,
    unitCost: (p as { unitCost?: number }).unitCost,
    purchaseId: (p as { purchaseId?: string }).purchaseId,
    purchaseItemId: (p as { purchaseItemId?: string }).purchaseItemId,
   })),
  [products]
 );

 const inventoryBySku = useMemo(() => {
  const m = new Map<string, number>();
  for (const p of posProducts) {
   if (p.qty != null) m.set(p.sku, Number(p.qty));
  }
  return m;
 }, [posProducts]);

 // Precompute a single lowercase haystack per product. Built once when posProducts changes;
 // the search filter then runs a single `indexOf` per row instead of lowercasing 5 fields per keystroke.
 const productSearchIndex = useMemo<string[]>(() => {
  return posProducts.map((p) =>
   `${p.name}\u0001${p.sku}\u0001${p.brand ?? ""}\u0001${p.serialNumber ?? ""}\u0001${p.barcode ?? ""}`.toLowerCase()
  );
 }, [posProducts]);

 const filteredProducts = useMemo(() => {
  const term = search.trim().toLowerCase();
  const hasCategory = categoryFilter !== "all";
  if (!term && !hasCategory) return posProducts;

  const out: POSProduct[] = [];
  for (let i = 0; i < posProducts.length; i++) {
   const p = posProducts[i];
   if (hasCategory && p.category !== categoryFilter) continue;
   if (term && productSearchIndex[i].indexOf(term) === -1) continue;
   out.push(p);
  }
  return out;
 }, [posProducts, productSearchIndex, categoryFilter, search]);

 const categoriesOverride = options?.categoriesOverride;
 const categories = useMemo(() => {
  const set = new Set(posProducts.map((p) => p.category));
  // Merge pre-loaded category names so buttons appear before products load
  if (categoriesOverride) categoriesOverride.forEach((c) => set.add(c));
  return ["all", ...Array.from(set).sort()];
 }, [posProducts, categoriesOverride]);

 const addToCart = useCallback((product: POSProduct, qty = 1, opts?: { skipSoldCheck?: boolean }): boolean => {
  if (!opts?.skipSoldCheck && product.serialNumber && Object.keys(soldInfoMap).length > 0) {
   const info = soldInfoMap[(product.serialNumber as string).trim()];
   if (info) {
    showMessage("error", `Already sold to ${info.customerName}`);
    return false;
   }
  }
  const isSerialItem = !!product.serialNumber;
  // Non-serial: allow oversell (cart can exceed stock; inventory may go negative)
  const addedQty = isSerialItem ? 1 : Math.max(1, qty);
  if (blockNegativeStock && !isSerialItem && product.qty != null) {
   const stock = Number(product.qty);
   const existing = cartStateRef.current.find((i) => i.sku === product.sku);
   const inCart = existing?.quantity ?? 0;
   if (inCart + addedQty > stock) {
    const remaining = Math.max(0, stock - inCart);
    if (remaining <= 0) {
     showMessage("error", `Out of stock for "${product.name}" (in stock: ${stock}).`);
    } else {
     showMessage("error", `Only ${remaining} more available for "${product.name}" (in stock: ${stock}).`);
    }
    return false;
   }
  }
  // Prefer ref-based result over a flag inside the updater (more reliable after await).
  const serialNorm = isSerialItem && product.serialNumber ? product.serialNumber.trim() : null;
  const cartHasSerial = (lines: CartLineItem[], serial: string) =>
   lines.some((i) => (i.serialNumbers ?? []).some((s) => s.trim() === serial));
  if (serialNorm && cartHasSerial(cartStateRef.current, serialNorm)) {
   return false;
  }
  setCart((prev) => {
   const serial = serialNorm;
   // Serial already in cart (any line) — skip to avoid duplicate after price splits
   if (isSerialItem && serial && cartHasSerial(prev, serial)) {
    return prev;
   }
   const existingBySku = prev.find((i) => i.sku === product.sku);
   // For serial items: merge into same variant (any price); line price = recent-inventory price by date
   const existingByVariant = isSerialItem ? prev.find((i) => serialVariantMergeKey(i) === serialVariantMergeKey(product)) : null;
   const existing = isSerialItem ? existingByVariant : existingBySku;
   if (existing) {
    if (isSerialItem) {
     const existingSerials = existing.serialNumbers ?? [];
     if (!serial || existingSerials.some((s) => s.trim() === serial)) return prev;
     const serialColours = { ...(existing.serialColours ?? {}), [serial]: productColour(product) };
     const serialInventoryDates = { ...(existing.serialInventoryDates ?? {}), [serial]: (product as POSProduct).inventoryDate ?? "" };
     const serialPrices = { ...(existing.serialPrices ?? {}), [serial]: product.price };
     const g = productGradeString(product);
     const m = productModelString(product);
     const serialGrades = g ? { ...(existing.serialGrades ?? {}), [serial]: g } : existing.serialGrades;
     const serialBrandModels = m ? { ...(existing.serialBrandModels ?? {}), [serial]: m } : existing.serialBrandModels;
     const categoryId = (product as POSProduct).categoryId ?? existing.categoryId;
     const variantValues = (product as POSProduct).variantValues?.length
      ? (product as POSProduct).variantValues
      : existing.variantValues;
     const updated = {
      ...existing,
      quantity: existingSerials.length + 1,
      serialNumbers: [...existingSerials, serial],
      serialColours,
      serialInventoryDates,
      serialPrices,
      serialGrades,
      serialBrandModels,
      categoryId,
      variantValues,
     };
     // Use incoming serial's price (from API = Rate list) so Rate list updates show in cart when adding this item
     const newLinePrice = product.price;
     const next = prev.map((i) =>
      i === existing ? { ...updated, price: newLinePrice } : i
     );
     cartStateRef.current = next;
     return next;
    }
    const nextQty = existing.quantity + addedQty;
    const baseSerials = existing.serialNumbers ?? [];
    const newSerials = product.serialNumber
     ? Array.from({ length: nextQty - existing.quantity }, (_, i) =>
       existing.quantity + i + 1 === 1
        ? product.serialNumber!
        : `${product.serialNumber}-${existing.quantity + i + 1}`
      )
     : [];
    const next = prev.map((i) =>
     i.sku === existing.sku
      ? {
        ...i,
        quantity: nextQty,
        serialNumbers:
         baseSerials.length > 0 || newSerials.length > 0
          ? [...baseSerials, ...newSerials]
          : undefined,
        price: product.price,
       }
      : i
    );
    cartStateRef.current = next;
    return next;
   }
   const serialNumbers = serial ? [serial] : undefined;
   const serialColours = serial && isSerialItem ? { [serial]: productColour(product) } : undefined;
   const invDate = (product as POSProduct).inventoryDate;
   const serialInventoryDates = serial && invDate ? { [serial]: invDate } : undefined;
   const serialPrices = serial && isSerialItem ? { [serial]: product.price } : undefined;
   const p = product as POSProduct & { unitCost?: number; purchaseId?: string; purchaseItemId?: string };
   const pg = productGradeString(product);
   const pm = productModelString(product);
   const serialGrades =
    serial && isSerialItem && pg ? { [serial]: pg } : undefined;
   const serialBrandModels =
    serial && isSerialItem && pm ? { [serial]: pm } : undefined;
   const next = [
    ...prev,
    {
     sku: product.sku,
     name: product.name,
     price: product.price,
     quantity: addedQty,
     unit: product.unit ?? "piece",
     serialNumbers,
     serialColours,
     serialInventoryDates,
     serialPrices,
     serialGrades,
     serialBrandModels,
     grade: productGradeString(product) || product.grade,
     brand: product.brand,
     colour: product.colour,
     brandModel: product.brandModel,
     capacity: product.capacity,
     categoryId: (product as POSProduct).categoryId,
     variantValues: (product as POSProduct).variantValues,
     unit_cost_at_sale: p.unitCost,
     purchaseId: p.purchaseId,
     purchaseItemId: p.purchaseItemId,
     cost_missing: p.unitCost == null && !p.purchaseId,
    },
   ];
   cartStateRef.current = next;
   return next;
  });
  if (serialNorm) return cartHasSerial(cartStateRef.current, serialNorm);
  return true;
 }, [soldInfoMap, blockNegativeStock]);

 /** Add multiple serial items — merged by variant; line price = price of serial most recently added to inventory. */
 const addBulkSerialsToCart = useCallback((products: POSProduct[]) => {
  const serialItems = products.filter((p) => p.serialNumber);
  if (serialItems.length === 0) return;
  setCart((prev) => {
   const existingSerials = new Set(prev.flatMap((i) => i.serialNumbers ?? []));
   type VariantAgg = {
    sku: string;
    name: string;
    price: string;
    unit: string;
    serials: string[];
    serialColours: Record<string, string>;
    serialInventoryDates: Record<string, string>;
    serialPrices: Record<string, string>;
    serialGrades: Record<string, string>;
    serialBrandModels: Record<string, string>;
    grade?: string;
    brand?: string;
    colour?: string;
    brandModel?: string;
    capacity?: string;
    categoryId?: string;
    variantValues?: { slug?: string; value?: string }[];
    unitCost?: number;
    purchaseId?: string;
    purchaseItemId?: string;
   };
   const byVariant: Record<string, VariantAgg> = {};
   for (const p of serialItems) {
    const serial = p.serialNumber!;
    if (existingSerials.has(serial)) continue;
    existingSerials.add(serial);
    const key = serialVariantMergeKey(p);
    if (!byVariant[key]) {
     byVariant[key] = {
      sku: p.sku,
      name: p.name,
      price: p.price,
      unit: p.unit ?? "piece",
      serials: [],
      serialColours: {},
      serialInventoryDates: {},
      serialPrices: {},
      serialGrades: {},
      serialBrandModels: {},
      grade: productGradeString(p) || p.grade,
      brand: p.brand,
      colour: p.colour,
      brandModel: p.brandModel,
      capacity: p.capacity,
      categoryId: (p as POSProduct).categoryId,
      variantValues: (p as POSProduct).variantValues,
      unitCost: (p as POSProduct & { unitCost?: number }).unitCost,
      purchaseId: (p as POSProduct & { purchaseId?: string }).purchaseId,
      purchaseItemId: (p as POSProduct & { purchaseItemId?: string }).purchaseItemId,
     };
    }
    byVariant[key].serials.push(serial);
    byVariant[key].serialColours[serial] = productColour(p);
    byVariant[key].serialInventoryDates[serial] = p.inventoryDate ?? "";
    byVariant[key].serialPrices[serial] = p.price;
    const g = productGradeString(p);
    const m = productModelString(p);
    if (g) byVariant[key].serialGrades[serial] = g;
    if (m) byVariant[key].serialBrandModels[serial] = m;
    byVariant[key].price = p.price;
    byVariant[key].sku = p.sku;
    if ((p as POSProduct).categoryId && !byVariant[key].categoryId) {
     byVariant[key].categoryId = (p as POSProduct).categoryId;
    }
    if ((p as POSProduct).variantValues?.length && !byVariant[key].variantValues?.length) {
     byVariant[key].variantValues = (p as POSProduct).variantValues;
    }
    if ((p as POSProduct & { unitCost?: number }).unitCost != null) {
     byVariant[key].unitCost = (p as POSProduct & { unitCost?: number }).unitCost;
     byVariant[key].purchaseId = (p as POSProduct & { purchaseId?: string }).purchaseId;
     byVariant[key].purchaseItemId = (p as POSProduct & { purchaseItemId?: string }).purchaseItemId;
    }
   }
   const newLines: CartLineItem[] = Object.values(byVariant).map((v) => {
    const price = Object.keys(v.serialPrices).length > 0 ? Object.values(v.serialPrices)[0]! : v.serials.length ? "£0.00" : "£0.00";
    const line: CartLineItem = {
     sku: v.sku,
     name: v.name,
     price,
     quantity: v.serials.length,
     unit: v.unit,
     serialNumbers: v.serials,
     serialColours: v.serialColours,
     serialInventoryDates: Object.keys(v.serialInventoryDates).length ? v.serialInventoryDates : undefined,
     serialPrices: Object.keys(v.serialPrices).length ? v.serialPrices : undefined,
     serialGrades: Object.keys(v.serialGrades).length ? v.serialGrades : undefined,
     serialBrandModels: Object.keys(v.serialBrandModels).length ? v.serialBrandModels : undefined,
     grade: v.grade,
     brand: v.brand,
     colour: v.colour,
     brandModel: v.brandModel,
     capacity: v.capacity,
     categoryId: v.categoryId,
     variantValues: v.variantValues,
     unit_cost_at_sale: v.unitCost,
     purchaseId: v.purchaseId,
     purchaseItemId: v.purchaseItemId,
     cost_missing: !(v.unitCost != null && v.purchaseId),
    };
    return line;
   });
   if (newLines.length === 0) return prev;
   let next = [...prev];
   for (const line of newLines) {
    // Prefer merging into a line with same variant and same price so we don't overwrite user-edited prices
    const existingByVariantSamePrice = next.find(
     (i) => serialVariantMergeKey(i) === serialVariantMergeKey(line) && i.price === line.price
    );
    const existingByVariant = next.find((i) => serialVariantMergeKey(i) === serialVariantMergeKey(line));
    const existing = existingByVariantSamePrice ?? existingByVariant ?? null;
    if (existing) {
     const mergedSerials = [...(existing.serialNumbers ?? []), ...(line.serialNumbers ?? [])];
     const mergedSerialColours = { ...(existing.serialColours ?? {}), ...(line.serialColours ?? {}) };
     const mergedSerialInventoryDates = { ...(existing.serialInventoryDates ?? {}), ...(line.serialInventoryDates ?? {}) };
     const mergedSerialPrices = { ...(existing.serialPrices ?? {}), ...(line.serialPrices ?? {}) };
     const mergedSerialGrades = { ...(existing.serialGrades ?? {}), ...(line.serialGrades ?? {}) };
     const mergedSerialBrandModels = { ...(existing.serialBrandModels ?? {}), ...(line.serialBrandModels ?? {}) };
     const merged: CartLineItem = {
      ...existing,
      quantity: mergedSerials.length,
      serialNumbers: mergedSerials,
      serialColours: mergedSerialColours,
      serialInventoryDates: Object.keys(mergedSerialInventoryDates).length ? mergedSerialInventoryDates : undefined,
      serialPrices: Object.keys(mergedSerialPrices).length ? mergedSerialPrices : undefined,
      serialGrades: Object.keys(mergedSerialGrades).length ? mergedSerialGrades : undefined,
      serialBrandModels: Object.keys(mergedSerialBrandModels).length ? mergedSerialBrandModels : undefined,
      categoryId: line.categoryId ?? existing.categoryId,
      variantValues: line.variantValues?.length ? line.variantValues : existing.variantValues,
      price: existing.price,
      unit_cost_at_sale: line.unit_cost_at_sale ?? existing.unit_cost_at_sale,
      purchaseId: line.purchaseId ?? existing.purchaseId,
      purchaseItemId: line.purchaseItemId ?? existing.purchaseItemId,
      cost_missing: line.cost_missing ?? existing.cost_missing,
     };
     // Replace only the line we merged into (same reference), not every line with same SKU (avoids wiping other price-split lines)
     next = next.map((i) => (i === existing ? merged : i));
    } else {
     next.push(line);
    }
   }
   return next;
  });
 }, []);

 const updateQuantity = useCallback((sku: string, delta: number) => {
  if (blockNegativeStock && delta > 0) {
   const line = cartStateRef.current.find((i) => i.sku === sku);
   const stock = inventoryBySku.get(sku);
   if (line && stock != null) {
    const isSerialItem = !!(line.serialNumbers && line.serialNumbers.length > 0);
    if (!isSerialItem && line.quantity + delta > stock) {
     showMessage("error", `Only ${stock} in stock for "${line.name}".`);
     return;
    }
   }
  }
  setCart((prev) =>
   prev
    .map((i) => {
     if (i.sku !== sku) return i;
     const isSerialItem = i.serialNumbers && i.serialNumbers.length > 0;
     let next = i.quantity + delta;
     if (isSerialItem && delta > 0) next = 1;
     if (next <= 0) return null;
     const serials = i.serialNumbers;
     const newSerials =
      delta > 0 && serials && serials.length > 0 && !isSerialItem
       ? Array.from({ length: delta }, (_, j) =>
         `${serials[0].replace(/-\d+$/, "")}-${i.quantity + j + 1}`
        )
       : undefined;
     return {
      ...i,
      quantity: next,
      serialNumbers:
       serials && newSerials
        ? [...serials, ...newSerials]
        : delta < 0 && serials
         ? serials.slice(0, next)
         : serials,
     };
    })
    .filter((i): i is CartLineItem => i !== null)
  );
 }, [blockNegativeStock, inventoryBySku]);

 const removeLine = useCallback((sku: string, serial?: string) => {
  setCart((prev) => {
   if (serial != null) {
    const result: CartLineItem[] = [];
    for (const i of prev) {
     if (i.sku !== sku || !(i.serialNumbers ?? []).includes(serial)) {
      result.push(i);
      continue;
     }
     const restSerials = (i.serialNumbers ?? []).filter((s) => s !== serial);
     if (restSerials.length > 0) {
      const { [serial]: _c, ...restColours } = i.serialColours ?? {};
      const { [serial]: _d, ...restDates } = i.serialInventoryDates ?? {};
      const { [serial]: _p, ...restPrices } = i.serialPrices ?? {};
      const { [serial]: _g, ...restGrades } = i.serialGrades ?? {};
      const { [serial]: _m, ...restModels } = i.serialBrandModels ?? {};
      const updated = {
       ...i,
       serialNumbers: restSerials,
       quantity: restSerials.length,
       serialColours: Object.keys(restColours).length > 0 ? restColours : undefined,
       serialInventoryDates: Object.keys(restDates).length > 0 ? restDates : undefined,
       serialPrices: Object.keys(restPrices).length > 0 ? restPrices : undefined,
       serialGrades: Object.keys(restGrades).length > 0 ? restGrades : undefined,
       serialBrandModels: Object.keys(restModels).length > 0 ? restModels : undefined,
      };
      result.push({ ...updated, price: firstSerialPrice(updated) });
     }
     // else: line had only this serial, drop the line
    }
    return result;
   }
   return prev.filter((i) => i.sku !== sku);
  });
 }, []);

 const updateLinePrice = useCallback((sku: string, priceStr: string, serial?: string, wholeLine?: boolean) => {
  const num = parsePrice(priceStr);
  if (num < 0) return;
  const price = `£${Number(num).toFixed(2)}`;
  setCart((prev) => {
   const result: CartLineItem[] = [];
   for (const i of prev) {
    if (i.sku !== sku) {
     result.push(i);
     continue;
    }
    const serials = i.serialNumbers ?? [];
    // From Items Summary: update the whole line (no split). Identify line by serial if provided.
    // Serial Items Details reads serialPrices[serial] ?? price — sync every serial so summary edits reflect there.
    if (wholeLine && (serial == null || serials.includes(serial))) {
     const serialPrices =
      serials.length > 0 ? Object.fromEntries(serials.map((s) => [s, price])) : i.serialPrices;
     result.push({
      ...i,
      price,
      ...(serials.length > 0 ? { serialPrices } : {}),
     });
     continue;
    }
    if (serial != null && serials.includes(serial)) {
     if (serials.length > 1) {
      // Split: remove this serial from the group and add a new line with the new price
      const restSerials = serials.filter((s) => s !== serial);
      const { [serial]: _sc, ...restColours } = i.serialColours ?? {};
      const { [serial]: _sd, ...restDates } = i.serialInventoryDates ?? {};
      const { [serial]: _sp, ...restPrices } = i.serialPrices ?? {};
      const { [serial]: _sg, ...restGrades } = i.serialGrades ?? {};
      const { [serial]: _sm, ...restModels } = i.serialBrandModels ?? {};
      const restLine: CartLineItem = {
       ...i,
       serialNumbers: restSerials,
       quantity: restSerials.length,
       serialColours: Object.keys(restColours).length > 0 ? restColours : undefined,
       serialInventoryDates: Object.keys(restDates).length > 0 ? restDates : undefined,
       serialPrices: Object.keys(restPrices).length > 0 ? restPrices : undefined,
       serialGrades: Object.keys(restGrades).length > 0 ? restGrades : undefined,
       serialBrandModels: Object.keys(restModels).length > 0 ? restModels : undefined,
      };
      // Keep the rest line's current price so the other items don't appear to change when user edits one
      result.push({ ...restLine, price: i.price });
      const oneSerialColours = (i.serialColours?.[serial] || i.colour) ? { [serial]: i.serialColours?.[serial] ?? i.colour ?? "" } : undefined;
      const oneSerialDates = i.serialInventoryDates?.[serial] ? { [serial]: i.serialInventoryDates[serial] } : undefined;
      const oneSerialPrices = { [serial]: price };
      const oneGrades = i.serialGrades?.[serial] ? { [serial]: i.serialGrades[serial] } : undefined;
      const oneModels = i.serialBrandModels?.[serial] ? { [serial]: i.serialBrandModels[serial] } : undefined;
      result.push({
       ...i,
       serialNumbers: [serial],
       serialColours: oneSerialColours,
       serialInventoryDates: oneSerialDates,
       serialPrices: oneSerialPrices,
       serialGrades: oneGrades,
       serialBrandModels: oneModels,
       quantity: 1,
       price,
      });
     } else {
      // One serial: keep serialPrices in sync so Serial items details matches line price
      const only = serials[0];
      result.push({
       ...i,
       price,
       ...(only ? { serialPrices: { [only]: price } } : {}),
      });
     }
    } else {
     result.push(serial == null ? { ...i, price } : i);
    }
   }
   // When variant + sku + price match, merge back: combine serials into one line (not sku+price alone)
   const mergeKey = (line: CartLineItem) =>
    `${serialVariantMergeKey(line)}\t${line.sku}\t${line.price}`;
   const byKey = new Map<string, CartLineItem[]>();
   for (const line of result) {
    const key = mergeKey(line);
    const list = byKey.get(key) ?? [];
    list.push(line);
    byKey.set(key, list);
   }
   const merged: CartLineItem[] = [];
   for (const lines of byKey.values()) {
    if (lines.length === 1) {
     merged.push(lines[0]);
    } else {
     const first = lines[0];
     const mergedSerialColours = lines.reduce((acc, l) => ({ ...acc, ...(l.serialColours ?? {}) }), {} as Record<string, string>);
     const mergedSerialInventoryDates = lines.reduce((acc, l) => ({ ...acc, ...(l.serialInventoryDates ?? {}) }), {} as Record<string, string>);
     const mergedSerialGrades = lines.reduce((acc, l) => ({ ...acc, ...(l.serialGrades ?? {}) }), {} as Record<string, string>);
     const mergedSerialBrandModels = lines.reduce((acc, l) => ({ ...acc, ...(l.serialBrandModels ?? {}) }), {} as Record<string, string>);
     const allSerials = lines.flatMap((l) => l.serialNumbers ?? []);
     // Merge key includes line.price — every merged segment shares first.price. Reset per-serial
     // rates so stale serialPrices (e.g. after reverting summary) cannot disagree with the line.
     const serialPricesUnified =
      allSerials.length > 0
       ? Object.fromEntries(allSerials.map((s) => [s, first.price]))
       : undefined;
     const mergedLine: CartLineItem = {
      ...first,
      serialNumbers: allSerials,
      quantity: lines.reduce((s, l) => s + l.quantity, 0),
      serialColours: Object.keys(mergedSerialColours).length > 0 ? mergedSerialColours : undefined,
      serialInventoryDates: Object.keys(mergedSerialInventoryDates).length > 0 ? mergedSerialInventoryDates : undefined,
      serialPrices: serialPricesUnified,
      serialGrades: Object.keys(mergedSerialGrades).length > 0 ? mergedSerialGrades : undefined,
      serialBrandModels: Object.keys(mergedSerialBrandModels).length > 0 ? mergedSerialBrandModels : undefined,
     };
     merged.push({ ...mergedLine, price: first.price });
    }
   }
   return merged;
  });
 }, []);

 const clearCart = useCallback(() => {
  setCart([]);
  if (draftStorageKey && typeof window !== "undefined") {
   try {
    window.localStorage.removeItem(draftStorageKey);
   } catch {
    // ignore
   }
  }
 }, [draftStorageKey]);

 /** Replace entire cart (e.g. when restoring a saved draft). Syncs to draft storage if enabled. */
 const replaceCart = useCallback(
  (items: CartLineItem[]) => {
   setCart(items);
   if (draftStorageKey && typeof window !== "undefined") {
    try {
     if (items.length === 0) window.localStorage.removeItem(draftStorageKey);
     else window.localStorage.setItem(draftStorageKey, JSON.stringify(items));
    } catch {
     // ignore
    }
   }
  },
  [draftStorageKey]
 );

 /** Add an item not in the product list (manual/custom item). Cost price is optional. */
 const addManualItem = useCallback(
  (name: string, priceStr: string, quantity = 1, costPriceStr?: string) => {
   const trimmedName = name.trim();
   if (!trimmedName) return false;
   const num = parsePrice(priceStr);
   if (num < 0) return false;
   const price = `£${Number(num).toFixed(2)}`;
   const sku = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
   const costNum = costPriceStr != null && costPriceStr.trim() !== "" ? parsePrice(costPriceStr) : undefined;
   const unit_cost_at_sale =
    costNum != null && !Number.isNaN(costNum) && costNum >= 0 ? costNum : undefined;
   setCart((prev) => [
    ...prev,
    {
     sku,
     name: trimmedName,
     price,
     quantity: Math.max(1, Math.floor(quantity)),
     unit: "Pc",
     ...(unit_cost_at_sale !== undefined ? { unit_cost_at_sale } : {}),
    },
   ]);
   return true;
  },
  []
 );

 const subtotal = useMemo(() => {
  return cart.reduce((sum, i) => sum + cartLineAmount(i), 0);
 }, [cart]);

 const taxConfig = useCartTaxConfig();
 const tax = useMemo(() => {
  if (!taxConfig) return 0;
  const rate = Number(taxConfig.rate);
  if (!Number.isFinite(rate)) return 0;
  if (taxConfig.type === "percentage") return Math.round(subtotal * (rate / 100) * 100) / 100;
  return Math.round(rate * 100) / 100;
 }, [subtotal, taxConfig]);
 const total = subtotal + tax;

 /** Add product to cart by scanned or typed SKU/barcode. Checks local list first, then Product API by SKU/barcode. */
 const addBySku = useCallback(
  async (skuOrBarcode: string): Promise<boolean> => {
   const key = skuOrBarcode.trim().toLowerCase();
   if (!key) return false;
   const product = posProducts.find((p) => {
    const pSku = (p.sku ?? "").trim().toLowerCase();
    const pBarcode = (p.barcode ?? "").trim().toLowerCase();
    return pSku === key || pBarcode === key;
   });
   if (product) {
    addToCart(product);
    return true;
   }
   try {
    const res = await salesApi.getProductBySkuOrBarcode(skuOrBarcode, pricingGroupId);
    if (res.success && res.data) {
     const p = res.data;
     const categoryName = typeof p.category === "object" && p.category && "name" in p.category ? p.category.name : "";
     const categoryId =
      typeof p.category === "object" && p.category && "_id" in p.category
       ? String((p.category as { _id: string })._id)
       : undefined;
     const rawVv = (p as { variantValues?: { slug?: string; value?: string }[] }).variantValues;
     const variantValues = Array.isArray(rawVv) ? rawVv : undefined;
     const posProduct: POSProduct = {
      sku: p.sku,
      name: p.name,
      category: categoryName,
      brand: "",
      price: `£${Number(p.sellingPrice ?? 0).toFixed(2)}`,
      unit: p.unit || "piece",
      qty: Number(p.quantity ?? 0),
      iconColor: "text-orange-600",
      barcode: p.barcode,
      ...(categoryId ? { categoryId } : {}),
      ...(variantValues?.length ? { variantValues } : {}),
     };
     addToCart(posProduct);
     return true;
    }
   } catch {
    // ignore
   }
   return false;
  },
  [posProducts, addToCart, pricingGroupId]
 );

 const openPaymentModal = useCallback(() => {
  if (cart.length === 0) {
   showMessage("error", "Cart is empty");
   return;
  }
  setPaymentModalOpen(true);
 }, [cart.length]);

 const closePaymentModal = useCallback(() => {
  setPaymentModalOpen(false);
 }, []);

 const completeSale = useCallback(async () => {
  const items = cart.map((i) => ({
   sku: i.sku,
   name: i.name,
   price: parsePrice(i.price),
   quantity: i.quantity,
   unit: i.unit,
   serialNumbers: i.serialNumbers,
   serialColours: i.serialColours,
   grade: i.grade,
   brand: i.brand,
   colour: i.colour,
   brandModel: i.brandModel,
   capacity: i.capacity,
  }));
  if (!retailRequestIdRef.current) {
   retailRequestIdRef.current =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
     ? crypto.randomUUID()
     : `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
  const payload = {
   type: "retail" as const,
   items,
   subtotal,
   tax,
   total,
   paymentMethod,
   clientRequestId: retailRequestIdRef.current,
   ...(locationId ? { locationId } : {}),
  };
  const result = await salesApi.createSale(payload);
  setPaymentModalOpen(false);
  if (result.success) retailRequestIdRef.current = "";
  setCart([]);
  if (result.success) {
   showMessage("success", result.data?.reference ? `Sale saved: ${result.data.reference}` : "Sale completed");
   if (result.data?._id && result.data?.reference) {
    const saleForPrint = {
     _id: result.data._id,
     reference: result.data.reference,
     type: "retail" as const,
     createdAt: new Date().toISOString(),
     customerName: undefined,
     items: cart.map((i) => ({
      name: i.name,
      sku: i.sku,
      price: parsePrice(i.price),
      quantity: i.quantity,
      unit: i.unit,
      serialNumbers: i.serialNumbers,
      serialColours: i.serialColours,
      grade: i.grade,
      brand: i.brand,
      colour: i.colour,
      brandModel: i.brandModel,
      capacity: i.capacity,
     })),
     subtotal,
     tax,
     discount: 0,
     total,
     paymentMethod,
    };
    printInvoiceA4(saleForPrint).catch(() => {});
    if (paymentMethod === "cash") {
      openCashDrawer({ tryBothPins: true }).then((drawer) => {
        if (!drawer.sent) {
          showMessage("error", drawer.error ?? "Cash drawer did not open. Check Settings → Printing.");
        }
      });
    }
   }
  } else {
   showMessage("error", result.message || "Failed to save sale");
  }
 }, [cart, subtotal, tax, total, paymentMethod, showMessage]);

 return {
  cart,
  filteredProducts,
  categories,
  search,
  categoryFilter,
  setSearch,
  setCategoryFilter,
  addToCart,
  addBulkSerialsToCart,
  addBySku,
  updateQuantity,
  updateLinePrice,
  removeLine,
  clearCart,
  replaceCart,
  addManualItem,
  subtotal,
  tax,
  total,
  paymentModalOpen,
  paymentMethod,
  setPaymentMethod,
  openPaymentModal,
  closePaymentModal,
  completeSale,
  message,
  showMessage,
 };
};

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Package } from "lucide-react";
import {
 stockViewApi,
 type PurchaseRaw,
 type PurchaseItemRaw,
} from "@/app/(routes)/stock/view/services/stockViewApi";
import { onInventoryEvent } from "@/lib/inventoryEvents";
import { formatProductName } from "@/lib/formatProductName";
import { salesApi } from "../service/salesApi";

/** Product shape compatible with products-context for POS grid */
export interface InventoryProductForSales {
 sku: string;
 name: string;
 category: string;
 brand: string;
 price: string;
 unit: string;
 qty: number;
 createdBy: { name: string; avatar: string; color: string };
 icon: typeof Package;
 iconColor: string;
 serialNumber?: string;
 /** Barcode / SKU for non-serial items (searchable) */
 barcode?: string;
 /** Condition/grade (e.g. A, NEW) */
 grade?: string;
 colour?: string;
 brandModel?: string;
 capacity?: string;
 /** For serial items: unit cost and purchase refs (sent with sale) */
 unitCost?: number;
 purchaseId?: string;
 purchaseItemId?: string;
 /** Purchase date for serial line price / display */
 inventoryDate?: string;
 categoryId?: string;
 variantValues?: { slug?: string; value?: string }[];
}

function getCategoryName(category: PurchaseItemRaw["category"]): string {
 if (!category) return "";
 if (typeof category === "object" && category !== null && "name" in category)
  return (category as { name: string }).name;
 if (typeof category === "string") return category;
 return "";
}

function getCategoryId(category: PurchaseItemRaw["category"]): string | undefined {
 if (!category || typeof category !== "object" || category === null) return undefined;
 const id = (category as { _id?: string })._id;
 return id != null && String(id).trim() ? String(id) : undefined;
}

/** Condition/grade: from item.grade, then variantValues (slug 'grade'/'condition'), then parse from item.name */
function getCondition(item: PurchaseItemRaw): string {
 if (item.grade != null && String(item.grade).trim()) return String(item.grade).trim();
 const vv = item.variantValues ?? [];
 const entry = vv.find(
  (e) =>
   ((e.slug ?? "").toLowerCase() === "grade" || (e.slug ?? "").toLowerCase() === "condition") && e.value
 );
 if (entry) return String(entry.value).trim();
 const nameStr = item.name?.trim() ?? "";
 if (nameStr) {
  const match = nameStr.match(/\b(GRADE\s+[A-Z0-9\-]+(?:\s*-\s*[A-Z][A-Za-z\s]{2,})?|Grade\s+[A-Za-z0-9\-]+)\b/i);
  if (match) return match[1].trim();
 }
 return "";
}

/** Row shape for flattening purchases (one per serial or one per non-serial item) */
interface FlattenRow {
 rowKey: string;
 name?: string;
 barcode?: string;
 category: string;
 brand: string;
 brandModel: string;
 grade: string;
 capacity: string;
 colour: string;
 salePrice: number;
 currency: string;
 imei: string;
 quantity?: number;
 purchaseId?: string;
 purchaseItemId?: string;
 unitCost?: number;
 inventoryDate?: string;
 categoryId?: string;
 variantValues?: { slug?: string; value?: string }[];
}

/** Flatten purchases to one row per serial (IMEI) and one per non-serial item (for sales/wholesale dashboards) */
function flattenPurchasesToRows(purchases: PurchaseRaw[], allowNegativeStock: boolean): FlattenRow[] {
 const rows: FlattenRow[] = [];
 if (!Array.isArray(purchases)) return rows;

 purchases.forEach((purchase) => {
  const purchaseId = purchase._id;
  const currency = purchase.currency || "";
  const items = purchase.items || [];
  const purchaseDate = (purchase as { date?: string }).date ?? "";

  items.forEach((item, itemIndex) => {
   const isOtherItem = (item as PurchaseItemRaw).isOtherItem === true;
   const imeis = Array.isArray(item.imeis) ? item.imeis : [];
   const isSerial = !isOtherItem && imeis.length > 0;
   const itemId = item._id || `item-${itemIndex}`;
   const category = getCategoryName(item.category);
   const categoryId = getCategoryId(item.category);
   const variantValues = Array.isArray(item.variantValues)
    ? item.variantValues.map((v) => ({ slug: v.slug, value: v.value }))
    : undefined;
   const brand = item.brand ?? "";
   let brandModel = item.brandModel ?? "";
   if (!String(brandModel).trim() && variantValues?.length) {
    const m = variantValues.find(
     (v) => /model/i.test(v.slug ?? "") && String(v.value ?? "").trim()
    );
    if (m?.value) brandModel = String(m.value).trim();
   }
   const grade = getCondition(item);
   const capacity = item.capacity ?? "";
   const colour = item.colour ?? "";
   const salePrice = Number(item.salePrice) || 0;
   const itemName = item.name?.trim();
   const itemBarcode = item.barcode?.trim();
   // `Number(item.quantity) || 1` would render qty=0 as 1 (0 is falsy in JS),
   // making sold-out non-serial items appear to still have one in stock on the
   // create-sales / create-invoice grid.
   const rawQty = Number(item.quantity);
   const qty = Number.isFinite(rawQty) ? rawQty : 0;
   const unitCost = item.purchasePrice != null ? Number(item.purchasePrice) : undefined;

   if (isSerial) {
    imeis.forEach((imei) => {
     rows.push({
      rowKey: `${purchaseId}-${itemId}-${String(imei).trim()}`,
      name: itemName,
      barcode: itemBarcode,
      category,
      brand,
      brandModel,
      grade,
      capacity,
      colour,
      salePrice,
      currency,
      imei: String(imei).trim(),
      quantity: 1,
      purchaseId,
      purchaseItemId: itemId,
      unitCost,
      inventoryDate: purchaseDate,
      categoryId,
      variantValues,
     });
    });
   } else {
    // Hide sold-out non-serial items only when negative stock is NOT allowed.
    // When negative stock is allowed, show the item even at qty<=0 (cashier can still sell it).
    if (qty <= 0 && !allowNegativeStock) return;
    rows.push({
     rowKey: `${purchaseId}-${itemId}-no-imei`,
     name: itemName,
     barcode: itemBarcode,
     category,
     brand,
     brandModel,
     grade,
     capacity,
     colour,
     salePrice,
     currency,
     imei: "-",
     quantity: qty,
     purchaseId,
     purchaseItemId: itemId,
     unitCost,
     inventoryDate: purchaseDate,
     categoryId,
     variantValues,
    });
   }
  });
 });

 return rows;
}

function rowToProduct(row: FlattenRow): InventoryProductForSales {
 // Item name without grade — condition is shown in Condition column
 const parts = [row.brand, row.brandModel, row.capacity, row.colour].filter(Boolean);
 const rawName =
  row.name && row.name.trim()
   ? row.name.trim()
   : parts.length > 0
    ? parts.join(" ")
    : "Product";
 const name = formatProductName(rawName) || "PRODUCT";
 const symbol = row.currency === "GBP" ? "£" : row.currency === "USD" ? "£" : row.currency ? `${row.currency} ` : "£";
 const price = `${symbol}${Number(row.salePrice).toFixed(2)}`;

 return {
  sku: row.rowKey,
  name,
  category: row.category || "Uncategorized",
  brand: row.brand,
  price,
  unit: "piece",
  qty: row.quantity ?? 1,
  createdBy: { name: "Inventory", avatar: "📦", color: "bg-orange-100" },
  icon: Package,
  iconColor: "text-orange-600",
  serialNumber: row.imei !== "-" ? row.imei : undefined,
  barcode: row.barcode,
  grade: row.grade || undefined,
  colour: row.colour || undefined,
  brandModel: row.brandModel || undefined,
  capacity: row.capacity || undefined,
  unitCost: row.unitCost,
  purchaseId: row.purchaseId,
  purchaseItemId: row.purchaseItemId,
  inventoryDate: row.inventoryDate,
  categoryId: row.categoryId,
  variantValues: row.variantValues,
 };
}

export type SoldInfoMap = Record<string, { customerName: string; saleReference?: string }>;

/** sessionStorage key for stale-while-revalidate product cache */
function salesCacheKey(pricingGroupId?: string, locationId?: string) {
 return `inv-products-v1|${pricingGroupId || ""}|${locationId || ""}`;
}

/** Try to read cached products from sessionStorage (returns [] on miss/error) */
function readProductCache(key: string): InventoryProductForSales[] {
 try {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(key);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as InventoryProductForSales[];
  if (!Array.isArray(parsed)) return [];
  return parsed.map((p) => ({ ...p, name: formatProductName(p.name) || p.name }));
 } catch { return []; }
}

/** Clear cached create-sales product lists (call after purchase import or stock changes). */
export function clearSalesProductCache(): void {
 if (typeof window === "undefined") return;
 try {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
   const k = sessionStorage.key(i);
   if (k && k.startsWith("inv-products-v1")) keys.push(k);
  }
  keys.forEach((k) => sessionStorage.removeItem(k));
 } catch { /* ignore */ }
}

export function useInventoryProductsForSales(options?: { pricingGroupId?: string | null; locationId?: string | null; allowNegativeStock?: boolean }) {
 const pricingGroupId = options?.pricingGroupId ?? undefined;
 const locationId = options?.locationId ?? undefined;
 const allowNegativeStock = options?.allowNegativeStock ?? false;
 const cacheKey = salesCacheKey(pricingGroupId, locationId) + `|neg=${allowNegativeStock ? 1 : 0}`;

 // Hydrate from sessionStorage on the very first render (not in useEffect) so products appear immediately
 const [products, setProducts] = useState<InventoryProductForSales[]>(() => readProductCache(cacheKey));
 const [soldInfoMap, setSoldInfoMap] = useState<SoldInfoMap>({});
 const [loading, setLoading] = useState(() => readProductCache(cacheKey).length === 0);
 const [error, setError] = useState<string | null>(null);
 const prevCacheKeyRef = useRef(cacheKey);

 // When cache key changes (e.g. customer/location switch), re-hydrate from new cache
 useEffect(() => {
  if (prevCacheKeyRef.current === cacheKey) return;
  prevCacheKeyRef.current = cacheKey;
  const cached = readProductCache(cacheKey);
  if (cached.length > 0) {
   setProducts(cached);
   setLoading(false);
  } else {
   setLoading(true);
  }
 }, [cacheKey]);

 const refetch = useCallback(async () => {
  setError(null);
  try {
   // Load purchases; when pricingGroupId is set, backend resolves salePrice from customer group pricing
   const res = await stockViewApi.getPurchases({
    limit: 2000,
    page: 1,
    excludeSold: true,
    forSales: true,
    ...(pricingGroupId ? { pricingGroupId } : {}),
    ...(locationId ? { locationId } : {}),
   });
   if (!res.success || !Array.isArray(res.data)) {
    setProducts([]);
    setError(res.message || "Failed to load inventory");
    return;
   }
   const rows = flattenPurchasesToRows(res.data, allowNegativeStock);
   const newProducts = rows.map(rowToProduct);
   setProducts(newProducts);

   // Persist to sessionStorage for instant display on next visit
   try { sessionStorage.setItem(cacheKey, JSON.stringify(newProducts)); } catch { /* quota */ }

   // Fetch sold serials in background (for serial items added via scan — "Sold to [Customer]" in cart)
   salesApi.getSoldSerials().then((soldRes) => {
    if (soldRes.success && Array.isArray(soldRes.data)) {
     const map: SoldInfoMap = {};
     soldRes.data.forEach((s) => {
      const key = (s.serialNumber || "").trim();
      if (key) map[key] = { customerName: s.customerName || "Walk-in", saleReference: s.saleReference || "" };
     });
     setSoldInfoMap(map);
    } else {
     setSoldInfoMap({});
    }
   }).catch(() => setSoldInfoMap({}));
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load inventory");
   setProducts([]);
  } finally {
   setLoading(false);
  }
 }, [pricingGroupId, locationId, cacheKey, allowNegativeStock]);

 useEffect(() => {
  refetch();
 }, [refetch]);

 useEffect(() => {
  return onInventoryEvent((event) => {
   if (
    event.type === "purchase-imported" ||
    event.type === "manual-refresh" ||
    event.type === "sale-created" ||
    event.type === "sale-return" ||
    event.type === "stock-transferred"
   ) {
    refetch();
   }
  });
 }, [refetch]);

 return { products, soldInfoMap, loading, error, refetch };
}

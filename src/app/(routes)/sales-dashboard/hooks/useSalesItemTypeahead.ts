"use client";

import { useEffect, useRef, useState } from "react";
import { stockViewApi, type SalesTypeaheadRow } from "@/app/(routes)/stock/view/services/stockViewApi";
import type { POSProduct } from "../types";

interface UseSalesItemTypeaheadOptions {
 query: string;
 pricingGroupId?: string | null;
 locationId?: string | null;
 limit?: number;
 /** Skip the query when shorter than this (default 1) */
 minLength?: number;
 /** Debounce window before firing the request. Default 0 because UnifiedAddInput already debounces upstream. */
 debounceMs?: number;
}

function rowToPOSProduct(r: SalesTypeaheadRow): POSProduct {
 const parts = [r.brand, r.brandModel, r.capacity, r.colour].filter(Boolean) as string[];
 const name =
  r.name && r.name.trim()
   ? r.name.trim()
   : parts.length > 0
   ? parts.join(" ")
   : "Product";
 const symbol =
  r.currency === "GBP" || r.currency === "USD"
   ? "£"
   : r.currency
   ? `${r.currency} `
   : "£";
 const price = `${symbol}${Number(r.salePrice).toFixed(2)}`;
 return {
  sku: r.rowKey,
  name,
  category: r.category || "Uncategorized",
  brand: r.brand || "",
  price,
  unit: "piece",
  qty: r.quantity ?? 1,
  iconColor: "text-orange-600",
  serialNumber: r.imei && r.imei !== "-" ? r.imei : undefined,
  barcode: r.barcode,
  grade: r.grade || undefined,
  colour: r.colour || undefined,
  brandModel: r.brandModel || undefined,
  capacity: r.capacity || undefined,
  categoryId: r.categoryId,
  variantValues: r.variantValues,
  inventoryDate: r.inventoryDate,
  unitCost: r.purchasePrice,
  purchaseId: r.purchaseId,
  purchaseItemId: r.purchaseItemId,
 };
}

/** Module-level cache shared across mounts of the hook. Mirrors the backend's 8 s TTL. */
const CLIENT_CACHE_TTL_MS = 5_000;
const CLIENT_CACHE_MAX = 60;
type CacheEntry = { products: POSProduct[]; ts: number };
const _clientCache: Map<string, CacheEntry> = new Map();
function _cacheKey(q: string, limit: number, pricingGroupId: string | null | undefined, locationId: string | null | undefined) {
 return `${q.toLowerCase()}|${limit}|${pricingGroupId || ""}|${locationId || ""}`;
}
function _cacheGet(key: string): POSProduct[] | null {
 const e = _clientCache.get(key);
 if (!e) return null;
 if (Date.now() - e.ts > CLIENT_CACHE_TTL_MS) {
  _clientCache.delete(key);
  return null;
 }
 _clientCache.delete(key);
 _clientCache.set(key, e);
 return e.products;
}
function _cacheSet(key: string, products: POSProduct[]) {
 _clientCache.set(key, { products, ts: Date.now() });
 while (_clientCache.size > CLIENT_CACHE_MAX) {
  const first = _clientCache.keys().next().value;
  if (first === undefined) break;
  _clientCache.delete(first);
 }
}

/**
 * Hits the dedicated /api/purchases/sales-typeahead endpoint and returns a
 * POSProduct[] suitable for the create-sales item dropdown.
 *
 * Optimizations:
 *  - In-flight request dedup + sequence ref drop stale responses.
 *  - 5 s in-memory client cache: re-typed / backspaced queries return instantly.
 *  - Previous results stay visible while a new request is in flight (stale-while-revalidate).
 */
export function useSalesItemTypeahead({
 query,
 pricingGroupId,
 locationId,
 limit = 12,
 minLength = 1,
 debounceMs = 0,
}: UseSalesItemTypeaheadOptions) {
 const [results, setResults] = useState<POSProduct[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const seqRef = useRef(0);
 const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
  const term = (query || "").trim();
  if (timerRef.current) {
   clearTimeout(timerRef.current);
   timerRef.current = null;
  }
  if (!term || term.length < minLength) {
   setResults([]);
   setLoading(false);
   setError(null);
   return;
  }

  // Cache hit: return synchronously, no spinner, no network.
  const key = _cacheKey(term, limit, pricingGroupId, locationId);
  const cached = _cacheGet(key);
  if (cached) {
   setResults(cached);
   setLoading(false);
   setError(null);
   return;
  }

  const seq = ++seqRef.current;
  setLoading(true);

  const fire = async () => {
   const res = await stockViewApi.salesTypeahead({
    q: term,
    limit,
    pricingGroupId: pricingGroupId ?? null,
    locationId: locationId ?? null,
   });
   if (seq !== seqRef.current) return; // stale
   if (!res.success) {
    setError(res.message || "Search failed");
    setResults([]);
   } else {
    const mapped = res.data.map(rowToPOSProduct);
    _cacheSet(key, mapped);
    setError(null);
    setResults(mapped);
   }
   setLoading(false);
  };

  if (debounceMs > 0) {
   timerRef.current = setTimeout(fire, debounceMs);
  } else {
   fire();
  }

  return () => {
   if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
   }
  };
 }, [query, pricingGroupId, locationId, limit, minLength, debounceMs]);

 return { results, loading, error };
}

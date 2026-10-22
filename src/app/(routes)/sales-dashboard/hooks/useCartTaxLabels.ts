"use client";

import { useCallback, useEffect, useState } from "react";
import { salesApi } from "../service/salesApi";
import type { CartLineItem } from "../types";

/** App-wide cache: "s:<serial>" / "i:<purchaseItemId>" → tax name (null = no tax option on the purchase). */
const cache = new Map<string, string | null>();
const inFlight = new Set<string>();
const serialKey = (s: string) => `s:${s.trim()}`;
const itemKey = (id: string) => `i:${id}`;

/**
 * Tax option (Settings → Tax, e.g. "Marginal VAT" / "Normal VAT") for cart lines.
 * Serial items are resolved per IMEI, because one line can hold units from different purchases.
 */
export function useCartTaxLabels(items: CartLineItem[]) {
  const [version, setVersion] = useState(0);

  const serials: string[] = [];
  const lines: { purchaseId: string; purchaseItemId: string }[] = [];
  for (const item of items) {
    if (item.taxName) continue;
    if (item.serialNumbers && item.serialNumbers.length > 0) {
      for (const s of item.serialNumbers) {
        const k = serialKey(s);
        if (s.trim() && !cache.has(k) && !inFlight.has(k)) serials.push(s.trim());
      }
    } else if (item.purchaseId && item.purchaseItemId) {
      const k = itemKey(item.purchaseItemId);
      if (!cache.has(k) && !inFlight.has(k)) {
        lines.push({ purchaseId: item.purchaseId, purchaseItemId: item.purchaseItemId });
      }
    }
  }
  const requestKey = JSON.stringify([serials, lines]);

  useEffect(() => {
    const [reqSerials, reqLines] = JSON.parse(requestKey) as [
      string[],
      { purchaseId: string; purchaseItemId: string }[],
    ];
    if (reqSerials.length === 0 && reqLines.length === 0) return;
    const keys = [...reqSerials.map(serialKey), ...reqLines.map((l) => itemKey(l.purchaseItemId))];
    keys.forEach((k) => inFlight.add(k));
    let alive = true;
    salesApi
      .getItemTaxes({ serials: reqSerials, items: reqLines })
      .then((res) => {
        const d = res.data;
        reqSerials.forEach((s) => cache.set(serialKey(s), d?.serials?.[s]?.name ?? null));
        reqLines.forEach((l) => cache.set(itemKey(l.purchaseItemId), d?.items?.[l.purchaseItemId]?.name ?? null));
      })
      .catch(() => {
        // Labels are informational only; don't retry on every render.
        keys.forEach((k) => cache.set(k, null));
      })
      .finally(() => {
        keys.forEach((k) => inFlight.delete(k));
        if (alive) setVersion((v) => v + 1);
      });
    return () => {
      alive = false;
    };
  }, [requestKey]);

  const taxNameForSerial = useCallback(
    (serial: string): string | null => cache.get(serialKey(serial)) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-create after each fetch so callers re-render
    [version]
  );

  /** Unique tax names for a line (more than one only when its units were bought under different options). */
  const taxNamesForLine = useCallback(
    (item: CartLineItem): string[] => {
      if (item.taxName) return [item.taxName];
      const names: string[] = [];
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        for (const s of item.serialNumbers) {
          const n = cache.get(serialKey(s));
          if (n && !names.includes(n)) names.push(n);
        }
      } else if (item.purchaseItemId) {
        const n = cache.get(itemKey(item.purchaseItemId));
        if (n) names.push(n);
      }
      return names;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-create after each fetch so callers re-render
    [version]
  );

  return { taxNamesForLine, taxNameForSerial };
}

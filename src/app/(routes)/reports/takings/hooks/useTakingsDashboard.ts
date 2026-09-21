"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
 getTakingsDashboard,
 getTodayLondon,
 type TakingsDashboardData,
} from "../service/takingsDashboardApi";
import { getSalesDateRange } from "@/lib/salesDateAccess";
import type { DashboardRange } from "@/lib/dateUtils";

function toLondonDateKey(d: Date): string {
 return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

export interface UseTakingsDashboardOptions {
 locationId?: string | null;
 /** When false, date range is locked to today (staff without report.view). */
 canViewHistorical?: boolean;
}

export function useTakingsDashboard(options?: UseTakingsDashboardOptions) {
 const canViewHistorical = options?.canViewHistorical !== false;
 const [range, setRange] = useState<DashboardRange>("today");
 const [customFrom, setCustomFrom] = useState(() => getTodayLondon());
 const [customTo, setCustomTo] = useState(() => getTodayLondon());
 const [from, setFrom] = useState(() => getTodayLondon());
 const [to, setTo] = useState(() => getTodayLondon());
 const [data, setData] = useState<TakingsDashboardData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const abortRef = useRef<AbortController | null>(null);
 const requestIdRef = useRef(0);

 const load = useCallback(async () => {
  abortRef.current?.abort();
 const controller = new AbortController();
 abortRef.current = controller;
 const requestId = ++requestIdRef.current;
 const timeoutId = window.setTimeout(() => controller.abort(), 30000);

 setLoading(true);
 setError(null);
 try {
   const dateRange = getSalesDateRange(range, customFrom, customTo, canViewHistorical);
   const fromStr = toLondonDateKey(dateRange.fromUtc);
   const toStr = toLondonDateKey(dateRange.toUtc);
   setFrom(fromStr);
   setTo(toStr);
   const result = await getTakingsDashboard({
    from: fromStr,
    to: toStr,
    locationId: options?.locationId ?? "all",
    signal: controller.signal,
   });
   if (requestId !== requestIdRef.current) return;
   setData(result);
  } catch (e) {
   if (requestId !== requestIdRef.current) return;
   if (e instanceof DOMException && e.name === "AbortError") {
    setError("Takings dashboard timed out. Try a single location or a shorter date range.");
    return;
   }
   setError(e instanceof Error ? e.message : "Failed to load takings dashboard");
  } finally {
   window.clearTimeout(timeoutId);
   if (requestId === requestIdRef.current) setLoading(false);
  }
 }, [range, customFrom, customTo, options?.locationId, canViewHistorical]);

 useEffect(() => {
  load();
  return () => {
   abortRef.current?.abort();
  };
 }, [load]);

 return {
  data,
  loading,
  error,
  from,
  to,
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  refresh: load,
 };
}

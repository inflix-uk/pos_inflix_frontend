"use client";

import { useState, useCallback, useEffect } from "react";
import {
 getTakingsDashboard,
 getTodayLondon,
 type TakingsDashboardData,
} from "../service/takingsDashboardApi";
import {
 getDashboardRangeUtc,
 type DashboardRange,
} from "@/lib/dateUtils";

function toLondonDateKey(d: Date): string {
 return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

export interface UseTakingsDashboardOptions {
 locationId?: string | null;
}

export function useTakingsDashboard(options?: UseTakingsDashboardOptions) {
 const [range, setRange] = useState<DashboardRange>("today");
 const [customFrom, setCustomFrom] = useState(() => getTodayLondon());
 const [customTo, setCustomTo] = useState(() => getTodayLondon());
 const [from, setFrom] = useState(() => getTodayLondon());
 const [to, setTo] = useState(() => getTodayLondon());
 const [data, setData] = useState<TakingsDashboardData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
   const dateRange = getDashboardRangeUtc(range, customFrom, customTo);
   const fromStr = toLondonDateKey(dateRange.fromUtc);
   const toStr = toLondonDateKey(dateRange.toUtc);
   setFrom(fromStr);
   setTo(toStr);
   const result = await getTakingsDashboard({
    from: fromStr,
    to: toStr,
    locationId: options?.locationId ?? "all",
   });
   setData(result);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load takings dashboard");
  } finally {
   setLoading(false);
  }
 }, [range, customFrom, customTo, options?.locationId]);

 useEffect(() => {
  load();
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

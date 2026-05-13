"use client";

import { useState, useCallback, useEffect } from "react";
import { fetchDashboard, type DashboardData } from "../service/dashboardApi";
import {
 getDashboardRangeUtc,
 type DashboardRange,
 type DashboardDateRange,
} from "@/lib/dateUtils";

export interface UseDashboardOptions {
 /** Single location filter (for Reports dashboard). */
 locationId?: string | null;
 /** Multi-location filter (for Reports dashboard). */
 locationIds?: string[] | null;
}

export function useDashboard(options?: UseDashboardOptions) {
 const [range, setRange] = useState<DashboardRange>("today");
 const [customFrom, setCustomFrom] = useState("");
 const [customTo, setCustomTo] = useState("");
 const [dateRange, setDateRange] = useState<DashboardDateRange>(() =>
  getDashboardRangeUtc("today")
 );
 const [data, setData] = useState<DashboardData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
   const next = getDashboardRangeUtc(range, customFrom, customTo);
   setDateRange(next);
   const result = await fetchDashboard(next.fromUtc, next.toUtc, {
    locationId: options?.locationId ?? undefined,
    locationIds: options?.locationIds ?? undefined,
   });
   setData(result);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load dashboard");
  } finally {
   setLoading(false);
  }
 }, [range, customFrom, customTo, options?.locationId, options?.locationIds]);

 useEffect(() => {
  load();
 }, [load]);

 return {
  data,
  loading,
  error,
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  dateRange,
  refresh: load,
 };
}

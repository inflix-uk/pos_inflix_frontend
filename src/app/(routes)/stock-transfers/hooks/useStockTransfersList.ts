"use client";

import { useState, useCallback, useEffect } from "react";
import { stockTransferApi } from "../service/stockTransferApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import type { StockTransfer, StockTransferFilters } from "../types";
import type { Location } from "@/app/(routes)/peoples/locations/types";

export function useStockTransfersList() {
 const [transfers, setTransfers] = useState<StockTransfer[]>([]);
 const [locations, setLocations] = useState<Location[]>([]);
 const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
 const [loading, setLoading] = useState(true);
 const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
 const [filters, setFilters] = useState<StockTransferFilters>({ page: 1, limit: 25 });

 const loadLocations = useCallback(async () => {
  try {
   const res = await locationApi.getLocations({ limit: 500, isActive: true });
   if (res.success && Array.isArray((res as { data?: Location[] }).data)) {
    setLocations((res as { data: Location[] }).data);
   }
  } catch {
   // ignore
  }
 }, []);

 const load = useCallback(async () => {
  setLoading(true);
  try {
   const res = await stockTransferApi.list(filters);
   setTransfers(res.data);
   setPagination(res.pagination);
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to load", type: "error" });
  } finally {
   setLoading(false);
  }
 }, [filters]);

 useEffect(() => {
  loadLocations();
 }, [loadLocations]);
 useEffect(() => {
  load();
 }, [load]);

 const setFilter = useCallback(<K extends keyof StockTransferFilters>(key: K, value: StockTransferFilters[K]) => {
  setFilters((f) => ({ ...f, [key]: value, page: 1 }));
 }, []);

 const setPage = useCallback((page: number) => {
  setFilters((f) => ({ ...f, page }));
 }, []);

 const refresh = useCallback(() => {
  load();
 }, [load]);

 return {
  transfers,
  locations,
  pagination,
  loading,
  message,
  setMessage,
  filters,
  setFilter,
  setPage,
  refresh,
 };
}

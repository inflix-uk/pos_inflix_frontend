"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { StockViewRow } from "../types";
import { stockViewApi } from "../services/stockViewApi";
import { downloadProductsExcel, downloadProductsPdf } from "@/lib/productsExport";
import { onInventoryEvent } from "@/lib/inventoryEvents";

export function empty(v: string | number | undefined | null): string | number {
 if (v === undefined || v === null) return "-";
 if (typeof v === "string" && !v.trim()) return "-";
 if (typeof v === "number" && Number.isNaN(v)) return "-";
 return v;
}

export function useStockView() {
 const [rows, setRows] = useState<StockViewRow[]>([]);
 const [totalRows, setTotalRows] = useState(0);
 const [isLoading, setIsLoading] = useState(true);
 const [isFetching, setIsFetching] = useState(false);
 const hasLoadedRef = useRef(false);
 const fetchSeqRef = useRef(0);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [debouncedSearch, setDebouncedSearch] = useState("");
 const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
 const [category, setCategory] = useState("");
 const [brand, setBrand] = useState("");
 const [brandModel, setBrandModel] = useState("");
 const [capacity, setCapacity] = useState("");
 const [colour, setColour] = useState("");
 const [imei, setImei] = useState("");
 const [locationId, setLocationId] = useState("");
 /** "available" = only in-stock (backend excludeSold); "sold" = only sold; "all" = show both */
 const [statusFilter, setStatusFilter] = useState<"available" | "sold" | "all">("available");
 /** "all" = both; "serial" = serial/IMEI products only; "non-serial" = other items only */
 const [productTypeFilter, setProductTypeFilter] = useState<"all" | "serial" | "non-serial">("all");
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(25);
 const [totalPages, setTotalPages] = useState(1);
 /** Filter options from API (for dropdowns); fallback to derived from current rows */
 const [filterOptions, setFilterOptions] = useState<{
  categories: string[];
  brands: string[];
  brandModels: string[];
  capacities: string[];
  colours: string[];
  locations: { _id: string; name: string }[];
 }>({ categories: [], brands: [], brandModels: [], capacities: [], colours: [], locations: [] });

 const [soldInfoMap, setSoldInfoMap] = useState<Record<string, { customerName: string; saleReference: string; saleId?: string }>>({});

 const fetchStock = useCallback(async () => {
  const seq = ++fetchSeqRef.current;
  if (!hasLoadedRef.current) setIsLoading(true);
  setIsFetching(true);
  setError(null);
  try {
   const data = await stockViewApi.getStockViewRows({
    page: currentPage,
    limit: rowsPerPage,
    excludeSold: statusFilter === "available",
    statusFilter,
    productType: productTypeFilter,
    search: debouncedSearch || undefined,
    category: category || undefined,
    brand: brand || undefined,
    brandModel: brandModel || undefined,
    capacity: capacity || undefined,
    colour: colour || undefined,
    imei: imei || undefined,
    locationId: locationId || undefined,
   });

   // Drop stale responses (newer request already fired)
   if (seq !== fetchSeqRef.current) return;

   if (!data.success || !Array.isArray(data.data)) {
    setRows([]);
    setTotalRows(0);
    setTotalPages(1);
    setError(data.message || "Failed to load stock");
    return;
   }

   setRows(data.data);
   setTotalRows(data.total ?? data.data.length);
   setTotalPages(data.pages ?? 1);
   if (data.filterOptions) {
    setFilterOptions({
     ...data.filterOptions,
     brandModels: data.filterOptions.brandModels ?? [],
     locations: data.filterOptions.locations ?? [],
    });
   }

   // Build soldInfoMap from embedded soldInfo on rows (backend now includes it; no separate sold-serials call)
   const map: Record<string, { customerName: string; saleReference: string; saleId?: string }> = {};
   data.data.forEach((r) => {
    if (r.soldInfo && r.imei && r.imei !== "-") {
     const key = (r.imei || "").trim();
     if (key) map[key] = r.soldInfo;
    }
   });
   setSoldInfoMap(map);
  } catch (err) {
   if (seq !== fetchSeqRef.current) return;
   console.error("Error fetching stock view rows:", err);
   setError("Failed to load stock");
   setRows([]);
   setTotalRows(0);
  } finally {
   if (seq === fetchSeqRef.current) {
    setIsLoading(false);
    setIsFetching(false);
    hasLoadedRef.current = true;
   }
  }
 }, [
  currentPage,
  rowsPerPage,
  statusFilter,
  productTypeFilter,
  debouncedSearch,
  category,
  brand,
  brandModel,
  capacity,
  colour,
  imei,
  locationId,
 ]);

 useEffect(() => {
  fetchStock();
 }, [fetchStock]);

 // Re-fetch when the tab regains focus or becomes visible, so qty reflects sales
 // made in another tab (e.g. /create-sales). Without this, stock looks stale.
 useEffect(() => {
  const onVisible = () => {
   if (document.visibilityState === "visible") fetchStock();
  };
  const onFocus = () => fetchStock();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onFocus);
  return () => {
   document.removeEventListener("visibilitychange", onVisible);
   window.removeEventListener("focus", onFocus);
  };
 }, [fetchStock]);

 // Live cross-tab refresh: re-fetch the moment a sale (or other inventory write) lands
 // in any tab, even if this tab is in the background and never receives a focus event.
 useEffect(() => {
  return onInventoryEvent(() => fetchStock());
 }, [fetchStock]);

 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
 }, []);

 const handleRowsPerPageChange = useCallback((rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
 }, []);

 const setSearchAndResetPage = useCallback((value: string) => {
  setSearch(value);
  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  searchTimerRef.current = setTimeout(() => {
   setDebouncedSearch(value);
   setCurrentPage(1);
  }, 400);
 }, []);
 const setCategoryAndResetPage = useCallback((value: string) => {
  setCategory(value);
  setCurrentPage(1);
 }, []);
 const setBrandAndResetPage = useCallback((value: string) => {
  setBrand(value);
  setCurrentPage(1);
 }, []);
 const setBrandModelAndResetPage = useCallback((value: string) => {
  setBrandModel(value);
  setCurrentPage(1);
 }, []);
 const setCapacityAndResetPage = useCallback((value: string) => {
  setCapacity(value);
  setCurrentPage(1);
 }, []);
 const setColourAndResetPage = useCallback((value: string) => {
  setColour(value);
  setCurrentPage(1);
 }, []);
 const setImeiAndResetPage = useCallback((value: string) => {
  setImei(value);
  setCurrentPage(1);
 }, []);
 const setLocationIdAndResetPage = useCallback((value: string) => {
  setLocationId(value);
  setCurrentPage(1);
 }, []);
 const setStatusFilterAndResetPage = useCallback((value: "available" | "sold" | "all") => {
  setStatusFilter(value);
  setCurrentPage(1);
 }, []);
 const setProductTypeFilterAndResetPage = useCallback((value: "all" | "serial" | "non-serial") => {
  setProductTypeFilter(value);
  setCurrentPage(1);
 }, []);

 // Server returns the current page of filtered rows; no client-side filter needed
 const filteredRows = rows;

 const categoryOptions = useMemo(
  () =>
   filterOptions.categories.length > 0
    ? filterOptions.categories
    : ([...new Set(rows.map((r) => r.category).filter(Boolean))].sort() as string[]),
  [filterOptions.categories, rows]
 );
 const brandOptions = useMemo(
  () =>
   filterOptions.brands.length > 0
    ? filterOptions.brands
    : ([...new Set(rows.map((r) => r.brand).filter(Boolean))].sort() as string[]),
  [filterOptions.brands, rows]
 );
 const brandModelOptions = useMemo(
  () =>
   filterOptions.brandModels.length > 0
    ? filterOptions.brandModels
    : ([...new Set(rows.map((r) => r.brandModel).filter(Boolean))].sort() as string[]),
  [filterOptions.brandModels, rows]
 );
 const capacityOptions = useMemo(
  () =>
   filterOptions.capacities.length > 0
    ? filterOptions.capacities
    : ([...new Set(rows.map((r) => r.capacity).filter(Boolean))].sort() as string[]),
  [filterOptions.capacities, rows]
 );
 const colourOptions = useMemo(
  () =>
   filterOptions.colours.length > 0
    ? filterOptions.colours
    : ([...new Set(rows.map((r) => r.colour).filter(Boolean))].sort() as string[]),
  [filterOptions.colours, rows]
 );
 const locationOptions = useMemo(
  () => filterOptions.locations || [],
  [filterOptions.locations]
 );

 const exportAsCsv = useCallback(
  (
   rowsToExport: StockViewRow[],
   soldInfoOverride?: Record<string, { customerName: string; saleReference: string; saleId?: string }>
  ) => {
   const map = soldInfoOverride ?? soldInfoMap;
   const escape = (v: string | number): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n"))
     return `"${s.replace(/"/g, '""')}"`;
    return s;
   };
   const formatPrice = (row: StockViewRow, value: number): string => {
    if (value == null || Number.isNaN(value)) return "-";
    const prefix = row.currency ? `${row.currency} ` : "";
    return `${prefix}${value}`;
   };
   const headers = [
    "Purchase ref",
    "Purchase #",
    "Date",
    "Supplier",
    "Status",
    "Payment",
    "Brand",
    "Model",
    "Grade",
    "Capacity",
    "Colour",
    "IMEI",
    "Cost",
    "Sale Price",
    "Sold To",
   ];
   const lines = [
    headers.join(","),
    ...rowsToExport.map((row) => {
     const soldInfo =
      row.soldInfo ?? (row.imei ? map[(row.imei || "").trim()] : undefined);
     const soldTo = soldInfo ? `Sold to ${soldInfo.customerName}` : "Available";
     return [
      escape(empty(row.purchaseNumber)),
      escape(empty(row.parcelNumber)),
      escape(empty(row.date)),
      escape(empty(row.supplier)),
      escape(empty(row.status)),
      escape(empty(row.paymentStatus)),
      escape(empty(row.brand)),
      escape(empty(row.brandModel)),
      escape(empty(row.grade)),
      escape(empty(row.capacity)),
      escape(empty(row.colour)),
      escape(empty(row.imei)),
      escape(formatPrice(row, row.purchasePrice)),
      escape(formatPrice(row, row.salePrice)),
      escape(soldTo),
     ].join(",");
    }),
   ];
   const csv = lines.join("\n");
   const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = `stock-export-${new Date().toISOString().slice(0, 10)}.csv`;
   a.click();
   URL.revokeObjectURL(url);
  },
  [soldInfoMap]
 );

 const [isExporting, setIsExporting] = useState(false);
 const exportAllAsCsv = useCallback(async () => {
  setIsExporting(true);
  try {
   const data = await stockViewApi.getStockViewRows({
    page: 1,
    limit: 50000,
    excludeSold: statusFilter === "available",
    statusFilter,
    productType: productTypeFilter,
    search: debouncedSearch || undefined,
    category: category || undefined,
    brand: brand || undefined,
    brandModel: brandModel || undefined,
    capacity: capacity || undefined,
    colour: colour || undefined,
    imei: imei || undefined,
    locationId: locationId || undefined,
   });
   const rowsToExport = data.success && Array.isArray(data.data) ? data.data : [];
   const map: Record<string, { customerName: string; saleReference: string; saleId?: string }> = { ...soldInfoMap };
   rowsToExport.forEach((r) => {
    if (r.imei && r.soldInfo) map[(r.imei || "").trim()] = r.soldInfo;
   });
   exportAsCsv(rowsToExport, map);
  } finally {
   setIsExporting(false);
  }
 }, [
  statusFilter,
  productTypeFilter,
  debouncedSearch,
  category,
  brand,
  brandModel,
  capacity,
  colour,
  imei,
  locationId,
  soldInfoMap,
  exportAsCsv,
 ]);

 const fetchAllRowsForExport = useCallback(async () => {
  const data = await stockViewApi.getStockViewRows({
   page: 1,
   limit: 50000,
   excludeSold: statusFilter === "available",
   statusFilter,
   productType: productTypeFilter,
   search: debouncedSearch || undefined,
   category: category || undefined,
   brand: brand || undefined,
   brandModel: brandModel || undefined,
   capacity: capacity || undefined,
   colour: colour || undefined,
   imei: imei || undefined,
   locationId: locationId || undefined,
  });
  const rowsToExport = data.success && Array.isArray(data.data) ? data.data : [];
  const map: Record<string, { customerName: string; saleReference: string; saleId?: string }> = { ...soldInfoMap };
  rowsToExport.forEach((r) => {
   if (r.imei && r.soldInfo) map[(r.imei || "").trim()] = r.soldInfo;
  });
  return { rowsToExport, map };
 }, [statusFilter, productTypeFilter, debouncedSearch, category, brand, brandModel, capacity, colour, imei, locationId, soldInfoMap]);

 const exportAllAsExcel = useCallback(async () => {
  setIsExporting(true);
  try {
   const { rowsToExport, map } = await fetchAllRowsForExport();
   downloadProductsExcel(rowsToExport, map);
  } finally {
   setIsExporting(false);
  }
 }, [fetchAllRowsForExport]);

 const exportAllAsPdf = useCallback(async () => {
  setIsExporting(true);
  try {
   const { rowsToExport, map } = await fetchAllRowsForExport();
   downloadProductsPdf(rowsToExport, map);
  } finally {
   setIsExporting(false);
  }
 }, [fetchAllRowsForExport]);

 return {
  rows,
  filteredRows,
  totalRows,
  soldInfoMap,
  statusFilter,
  setStatusFilter: setStatusFilterAndResetPage,
  productTypeFilter,
  setProductTypeFilter: setProductTypeFilterAndResetPage,
  isLoading,
  isFetching,
  error,
  refetch: fetchStock,
  currentPage,
  rowsPerPage,
  totalPages,
  handlePageChange,
  handleRowsPerPageChange,
  search,
  setSearch: setSearchAndResetPage,
  category,
  setCategory: setCategoryAndResetPage,
  brand,
  setBrand: setBrandAndResetPage,
  brandModel,
  setBrandModel: setBrandModelAndResetPage,
  capacity,
  setCapacity: setCapacityAndResetPage,
  colour,
  setColour: setColourAndResetPage,
  imei,
  setImei: setImeiAndResetPage,
  locationId,
  setLocationId: setLocationIdAndResetPage,
  categoryOptions,
  brandOptions,
  brandModelOptions,
  capacityOptions,
  colourOptions,
  locationOptions,
  exportAsCsv,
  exportAllAsCsv,
  exportAllAsExcel,
  exportAllAsPdf,
  isExporting,
 };
}

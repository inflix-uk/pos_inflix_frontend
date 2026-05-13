"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { LowStockProduct, LowStockRow } from "../types";
import { lowStockApi } from "../service";

export interface LowStocksState {
 locationId: string;
 q: string;
 thresholdOverride: number | null;
 categoryId: string;
 page: number;
 limit: number;
}

export const useLowStocks = () => {
 const [rows, setRows] = useState<LowStockRow[]>([]);
 const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
 const [defaultThreshold, setDefaultThreshold] = useState<number>(5);
 const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
 const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [productToEdit, setProductToEdit] = useState<LowStockProduct | null>(null);
 const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 const [filters, setFilters] = useState<LowStocksState>({
  locationId: "",
  q: "",
  thresholdOverride: null,
  categoryId: "",
  page: 1,
  limit: 25,
 });
 const [debouncedQ, setDebouncedQ] = useState("");
 const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

 const showMessage = useCallback((type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 }, []);

 const loadFilterOptions = useCallback(async () => {
  const [locRes, catRes] = await Promise.all([
   lowStockApi.getLocations(),
   lowStockApi.getCategories(),
  ]);
  setLocations(locRes);
  setCategories(catRes);
 }, []);

 const loadLowStocks = useCallback(async () => {
  setIsLoading(true);
  try {
   const res = await lowStockApi.getLowStocks({
    locationId: filters.locationId || undefined,
    threshold: filters.thresholdOverride ?? undefined,
    q: debouncedQ || undefined,
    categoryId: filters.categoryId || undefined,
    page: filters.page,
    limit: filters.limit,
   });
   setRows(res.data);
   setPagination(res.pagination);
   if (res.defaultLowStockThreshold != null) {
    setDefaultThreshold(res.defaultLowStockThreshold);
   }
  } catch (e) {
   showMessage("error", e instanceof Error ? e.message : "Failed to load low stocks");
  } finally {
   setIsLoading(false);
  }
 }, [filters.locationId, filters.thresholdOverride, debouncedQ, filters.categoryId, filters.page, filters.limit, showMessage]);

 useEffect(() => {
  loadFilterOptions();
 }, [loadFilterOptions]);
 useEffect(() => {
  loadLowStocks();
 }, [loadLowStocks]);

 const setFilter = useCallback(<K extends keyof LowStocksState>(key: K, value: LowStocksState[K]) => {
  setFilters((f) => ({ ...f, [key]: value, ...(key !== "page" && key !== "limit" ? { page: 1 } : {}) }));
  if (key === "q") {
   if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
   searchTimerRef.current = setTimeout(() => {
    setDebouncedQ(value as string);
   }, 400);
  }
 }, []);

 const updateDefaultThreshold = useCallback(
  async (value: number) => {
   try {
    await lowStockApi.updateInventorySettings({ defaultLowStockThreshold: value });
    setDefaultThreshold(value);
    showMessage("success", "Default threshold updated");
    loadLowStocks();
   } catch (e) {
    showMessage("error", e instanceof Error ? e.message : "Failed to update");
   }
  },
  [showMessage, loadLowStocks]
 );

 const updateProductThreshold = useCallback(
  async (productId: string, value: number | null) => {
   try {
    await lowStockApi.updateProductLowStockThreshold(productId, value);
    showMessage("success", value === null ? "Reset to default" : "Threshold updated");
    loadLowStocks();
   } catch (e) {
    showMessage("error", e instanceof Error ? e.message : "Failed to update");
   }
  },
  [showMessage, loadLowStocks]
 );

 const { lowStockCount, outOfStockCount } = useMemo(() => {
  let low = 0;
  let out = 0;
  for (const r of rows) {
   if (r.status === "low") low++;
   else if (r.status === "out_of_stock") out++;
  }
  return { lowStockCount: low, outOfStockCount: out };
 }, [rows]);

 const handleSelectAll = useCallback(() => {
  if (selectAll) setSelectedProducts([]);
  else setSelectedProducts(rows.map((r) => r.productId));
  setSelectAll(!selectAll);
 }, [selectAll, rows]);

 const handleSelectProduct = useCallback((id: string) => {
  setSelectedProducts((prev) =>
   prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
  );
 }, []);

 return {
  rows,
  pagination,
  defaultThreshold,
  locations,
  categories,
  filters,
  setFilter,
  isLoading,
  message,
  lowStockCount,
  outOfStockCount,
  updateDefaultThreshold,
  updateProductThreshold,
  refresh: loadLowStocks,
  editModalOpen,
  productToEdit,
  openEditModal: () => setEditModalOpen(true),
  setProductToEdit,
  closeEditModal: () => {
   setEditModalOpen(false);
   setProductToEdit(null);
  },
  selectedProducts,
  selectAll,
  handleSelectAll,
  handleSelectProduct,
  updateStock: async (
   productId: string,
   quantity: number,
   type: "in" | "out" | "adjustment",
   locationId?: string
  ) => {
   try {
    await lowStockApi.updateStock(productId, { quantity, type, locationId });
    showMessage("success", "Stock updated");
    loadLowStocks();
    setEditModalOpen(false);
    setProductToEdit(null);
   } catch (e) {
    showMessage("error", e instanceof Error ? e.message : "Failed to update stock");
   }
  },
 };
};

export default useLowStocks;

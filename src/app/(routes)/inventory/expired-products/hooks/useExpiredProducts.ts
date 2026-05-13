"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ExpiredProduct } from "../types";
import { expiredProductApi } from "../service";

export const useExpiredProducts = () => {
 // Data state
 const [expiredProducts, setExpiredProducts] = useState<ExpiredProduct[]>([]);
 const [expiringSoonProducts, setExpiringSoonProducts] = useState<ExpiredProduct[]>([]);
 const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
 const [warehouses, setWarehouses] = useState<{ value: string; label: string }[]>([]);
 const [stores, setStores] = useState<{ value: string; label: string }[]>([]);

 // UI state
 const [activeTab, setActiveTab] = useState<"expired" | "expiringSoon">("expired");
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({
  type: "success",
  text: "",
 });

 // Filter state
 const [searchTerm, setSearchTerm] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("");
 const [warehouseFilter, setWarehouseFilter] = useState("");
 const [storeFilter, setStoreFilter] = useState("");

 // Pagination state
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);

 // Selection state
 const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 const isInitialLoad = useRef(true);

 // Show message helper
 const showMessage = useCallback((type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 }, []);

 // Fetch expired products
 const fetchExpired = useCallback(async (showError = true) => {
  try {
   const response = await expiredProductApi.getExpired();
   setExpiredProducts(response.data);
  } catch (error) {
   if (showError) {
    showMessage("error", "Failed to fetch expired products");
   }
  }
 }, [showMessage]);

 // Fetch expiring soon products
 const fetchExpiringSoon = useCallback(async (showError = true) => {
  try {
   const response = await expiredProductApi.getExpiringSoon();
   setExpiringSoonProducts(response.data);
  } catch (error) {
   if (showError) {
    showMessage("error", "Failed to fetch expiring soon products");
   }
  }
 }, [showMessage]);

 // Fetch filter options
 const fetchFilterOptions = useCallback(async () => {
  const [categoriesData, warehousesData, storesData] = await Promise.all([
   expiredProductApi.getCategories(),
   expiredProductApi.getWarehouses(),
   expiredProductApi.getStores(),
  ]);
  setCategories(categoriesData);
  setWarehouses(warehousesData);
  setStores(storesData);
 }, []);

 // Initial fetch
 useEffect(() => {
  const fetchData = async () => {
   setIsLoading(true);
   try {
    await Promise.all([
     fetchExpired(!isInitialLoad.current),
     fetchExpiringSoon(!isInitialLoad.current),
     fetchFilterOptions(),
    ]);
   } finally {
    setIsLoading(false);
    isInitialLoad.current = false;
   }
  };

  fetchData();
 }, [fetchExpired, fetchExpiringSoon, fetchFilterOptions]);

 // Get current products based on active tab
 const currentProducts = activeTab === "expired" ? expiredProducts : expiringSoonProducts;

 // Apply filters
 const filteredProducts = currentProducts.filter((product) => {
  const searchMatch =
   !searchTerm ||
   product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   product.sku.toLowerCase().includes(searchTerm.toLowerCase());

  const categoryMatch =
   !categoryFilter || product.category?._id === categoryFilter;

  const warehouseMatch =
   !warehouseFilter || product.warehouse?._id === warehouseFilter;

  const storeMatch = !storeFilter || product.store?._id === storeFilter;

  return searchMatch && categoryMatch && warehouseMatch && storeMatch;
 });

 // Pagination
 const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

 // Handlers
 const handleSearch = useCallback((term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 }, []);

 const handleCategoryFilter = useCallback((category: string) => {
  setCategoryFilter(category);
  setCurrentPage(1);
 }, []);

 const handleWarehouseFilter = useCallback((warehouse: string) => {
  setWarehouseFilter(warehouse);
  setCurrentPage(1);
 }, []);

 const handleStoreFilter = useCallback((store: string) => {
  setStoreFilter(store);
  setCurrentPage(1);
 }, []);

 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
  setSelectedProducts([]);
  setSelectAll(false);
 }, []);

 const handleRowsPerPageChange = useCallback((rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedProducts([]);
  setSelectAll(false);
 }, []);

 const handleSelectAll = useCallback(() => {
  if (selectAll) {
   setSelectedProducts([]);
  } else {
   setSelectedProducts(paginatedProducts.map((p) => p._id));
  }
  setSelectAll(!selectAll);
 }, [selectAll, paginatedProducts]);

 const handleSelectProduct = useCallback((id: string) => {
  setSelectedProducts((prev) =>
   prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
  );
 }, []);

 const handleTabChange = useCallback((tab: "expired" | "expiringSoon") => {
  setActiveTab(tab);
  setCurrentPage(1);
  setSelectedProducts([]);
  setSelectAll(false);
 }, []);

 // Calculate days since/until expiry
 const getDaysFromExpiry = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 };

 return {
  // Data
  products: paginatedProducts,
  totalProducts: filteredProducts.length,
  expiredCount: expiredProducts.length,
  expiringSoonCount: expiringSoonProducts.length,
  categories,
  warehouses,
  stores,

  // Tab
  activeTab,
  handleTabChange,

  // Filters
  searchTerm,
  categoryFilter,
  warehouseFilter,
  storeFilter,
  handleSearch,
  handleCategoryFilter,
  handleWarehouseFilter,
  handleStoreFilter,

  // Pagination
  currentPage,
  rowsPerPage,
  totalPages,
  handlePageChange,
  handleRowsPerPageChange,

  // Selection
  selectedProducts,
  selectAll,
  handleSelectAll,
  handleSelectProduct,

  // UI state
  isLoading,
  message,

  // Helpers
  getDaysFromExpiry,

  // Refresh
  refresh: () => Promise.all([fetchExpired(), fetchExpiringSoon()]),
 };
};

export default useExpiredProducts;

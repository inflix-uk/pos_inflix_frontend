"use client";

import { useState, useMemo, useCallback } from "react";
import { Stock, StockForm, Message } from "../types";
import { ProductInfo } from "../components";

// Static sample data
const initialStocks: Stock[] = [
 {
  id: "1",
  warehouse: "Lavish Warehouse",
  store: "Electro Mart",
  product: { name: "Lenovo IdeaPad 3", icon: "💻" },
  date: "24 Dec 2024",
  person: { name: "James Kirwin", avatar: "🧑‍💼" },
  qty: 100,
 },
 {
  id: "2",
  warehouse: "Quaint Warehouse",
  store: "Quantum Gadgets",
  product: { name: "Beats Pro", icon: "🎧" },
  date: "10 Dec 2024",
  person: { name: "Francis Chang", avatar: "👩‍💼" },
  qty: 140,
 },
 {
  id: "3",
  warehouse: "Lobar Handy",
  store: "Prime Bazaar",
  product: { name: "Nike Jordan", icon: "👟" },
  date: "25 Jul 2023",
  person: { name: "Steven", avatar: "🧑‍🔬" },
  qty: 120,
 },
 {
  id: "4",
  warehouse: "Quaint Warehouse",
  store: "Gadget World",
  product: { name: "Apple Series 5 Watch", icon: "⌚" },
  date: "28 Jul 2023",
  person: { name: "Gravely", avatar: "👩‍🎤" },
  qty: 130,
 },
 {
  id: "5",
  warehouse: "Traditional Warehouse",
  store: "Volt Vault",
  product: { name: "Amazon Echo Dot", icon: "🛒" },
  date: "24 Jul 2023",
  person: { name: "Kevin", avatar: "🧑‍🚀" },
  qty: 140,
 },
 {
  id: "6",
  warehouse: "Cool Warehouse",
  store: "Elite Retail",
  product: { name: "Lobar Handy", icon: "💺" },
  date: "15 Jul 2023",
  person: { name: "Grillo", avatar: "🧑‍🎨" },
  qty: 150,
 },
 {
  id: "7",
  warehouse: "Retail Supply Hub",
  store: "Prime Mart",
  product: { name: "Red Premium Satchel", icon: "👜" },
  date: "14 Oct 2024",
  person: { name: "Gary Hennessy", avatar: "🧑‍🚒" },
  qty: 700,
 },
 {
  id: "8",
  warehouse: "EdgeWare Solutions",
  store: "NeoTech Store",
  product: { name: "Iphone 14 Pro", icon: "📱" },
  date: "03 Oct 2024",
  person: { name: "Eleanor Panek", avatar: "👩‍🔬" },
  qty: 630,
 },
 {
  id: "9",
  warehouse: "North Zone Warehouse",
  store: "Urban Mart",
  product: { name: "Gaming Chair", icon: "🕹️" },
  date: "20 Sep 2024",
  person: { name: "William Levy", avatar: "🧑‍🏫" },
  qty: 410,
 },
 {
  id: "10",
  warehouse: "Fulfillment Hub",
  store: "Travel Mart",
  product: { name: "Borealis Backpack", icon: "🎒" },
  date: "10 Sep 2024",
  person: { name: "Charlotte Klotz", avatar: "👩‍🎓" },
  qty: 550,
 },
];

// Product list for modals
const productList: ProductInfo[] = [
 { name: "Lenovo IdeaPad 3", sku: "PT001", category: "Computers", icon: "💻", qty: 100 },
 { name: "Beats Pro", sku: "PT002", category: "Electronics", icon: "🎧", qty: 140 },
 { name: "Nike Jordan", sku: "PT003", category: "Shoe", icon: "👟", qty: 120 },
 { name: "Apple Series 5 Watch", sku: "PT004", category: "Electronics", icon: "⌚", qty: 130 },
 { name: "Amazon Echo Dot", sku: "PT005", category: "Electronics", icon: "🛒", qty: 140 },
 { name: "Lobar Handy", sku: "PT006", category: "Furnitures", icon: "💺", qty: 150 },
 { name: "Red Premium Satchel", sku: "PT007", category: "Bags", icon: "👜", qty: 700 },
 { name: "Iphone 14 Pro", sku: "PT008", category: "Phone", icon: "📱", qty: 630 },
 { name: "Gaming Chair", sku: "PT009", category: "Furniture", icon: "🕹️", qty: 410 },
 { name: "Borealis Backpack", sku: "PT010", category: "Bags", icon: "🎒", qty: 550 },
];

export const useStock = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedWarehouse, setSelectedWarehouse] = useState("All");
 const [selectedStore, setSelectedStore] = useState("All");
 const [selectedProduct, setSelectedProduct] = useState("All");
 const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
 const [showStoreDropdown, setShowStoreDropdown] = useState(false);
 const [showProductDropdown, setShowProductDropdown] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [message, setMessage] = useState<Message | null>(null);

 // Modal states
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

 // Stock data
 const [stocks, setStocks] = useState<Stock[]>(initialStocks);

 // Get unique values for filters
 const warehouses = useMemo(() => {
  return ["All", ...Array.from(new Set(stocks.map((s) => s.warehouse)))];
 }, [stocks]);

 const stores = useMemo(() => {
  return ["All", ...Array.from(new Set(stocks.map((s) => s.store)))];
 }, [stocks]);

 const products = useMemo(() => {
  return ["All", ...Array.from(new Set(stocks.map((s) => s.product.name)))];
 }, [stocks]);

 const people = useMemo(() => {
  return Array.from(new Set(stocks.map((s) => s.person.name)));
 }, [stocks]);

 // Filter and search logic
 const filteredStocks = useMemo(() => {
  return stocks.filter((stock) => {
   const matchesSearch =
    stock.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.person.name.toLowerCase().includes(searchTerm.toLowerCase());

   const matchesWarehouse =
    selectedWarehouse === "All" || stock.warehouse === selectedWarehouse;
   const matchesStore =
    selectedStore === "All" || stock.store === selectedStore;
   const matchesProduct =
    selectedProduct === "All" || stock.product.name === selectedProduct;

   return matchesSearch && matchesWarehouse && matchesStore && matchesProduct;
  });
 }, [stocks, searchTerm, selectedWarehouse, selectedStore, selectedProduct]);

 // Pagination logic
 const totalPages = Math.ceil(filteredStocks.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const currentStocks = filteredStocks.slice(startIndex, startIndex + rowsPerPage);

 // Handlers
 const handleSearchChange = useCallback((value: string) => {
  setSearchTerm(value);
  setCurrentPage(1);
 }, []);

 const handleWarehouseChange = useCallback((value: string) => {
  setSelectedWarehouse(value);
  setShowWarehouseDropdown(false);
  setCurrentPage(1);
 }, []);

 const handleStoreChange = useCallback((value: string) => {
  setSelectedStore(value);
  setShowStoreDropdown(false);
  setCurrentPage(1);
 }, []);

 const handleProductChange = useCallback((value: string) => {
  setSelectedProduct(value);
  setShowProductDropdown(false);
  setCurrentPage(1);
 }, []);

 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
 }, []);

 const handleRowsPerPageChange = useCallback((value: number) => {
  setRowsPerPage(value);
  setCurrentPage(1);
 }, []);

 const handleSelectAll = useCallback(() => {
  if (selectAll) {
   setSelectedStocks([]);
  } else {
   setSelectedStocks(currentStocks.map((s) => s.id));
  }
  setSelectAll(!selectAll);
 }, [selectAll, currentStocks]);

 const handleSelectStock = useCallback((id: string) => {
  setSelectedStocks((prev) =>
   prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
  );
 }, []);

 const toggleWarehouseDropdown = useCallback(() => {
  setShowWarehouseDropdown((prev) => !prev);
  setShowStoreDropdown(false);
  setShowProductDropdown(false);
 }, []);

 const toggleStoreDropdown = useCallback(() => {
  setShowStoreDropdown((prev) => !prev);
  setShowWarehouseDropdown(false);
  setShowProductDropdown(false);
 }, []);

 const toggleProductDropdown = useCallback(() => {
  setShowProductDropdown((prev) => !prev);
  setShowWarehouseDropdown(false);
  setShowStoreDropdown(false);
 }, []);

 // Modal handlers
 const openAddModal = useCallback(() => setShowAddModal(true), []);
 const closeAddModal = useCallback(() => setShowAddModal(false), []);

 const openEditModal = useCallback((stock: Stock) => {
  setSelectedStock(stock);
  setShowEditModal(true);
 }, []);
 const closeEditModal = useCallback(() => {
  setShowEditModal(false);
  setSelectedStock(null);
 }, []);

 const openDeleteModal = useCallback((stock: Stock) => {
  setSelectedStock(stock);
  setShowDeleteModal(true);
 }, []);
 const closeDeleteModal = useCallback(() => {
  setShowDeleteModal(false);
  setSelectedStock(null);
 }, []);

 const handleAddStock = useCallback((newStock: StockForm) => {
  const productInfo = productList.find((p) => p.name === newStock.product);
  const newId = String(stocks.length + 1);
  const stock: Stock = {
   id: newId,
   warehouse: newStock.warehouse,
   store: newStock.store,
   product: {
    name: newStock.product,
    icon: productInfo?.icon || "📦",
   },
   date: new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
   }),
   person: {
    name: newStock.person,
    avatar: "👤",
   },
   qty: newStock.qty || 0,
  };
  setStocks((prev) => [...prev, stock]);
  setShowAddModal(false);
  setMessage({ type: "success", text: "Stock added successfully" });
 }, [stocks.length]);

 const handleUpdateStock = useCallback((updatedStock: StockForm & { id?: string }) => {
  if (!selectedStock) return;

  const productInfo = productList.find((p) => p.name === updatedStock.product);
  setStocks((prev) =>
   prev.map((s) =>
    s.id === selectedStock.id
     ? {
       ...s,
       warehouse: updatedStock.warehouse,
       store: updatedStock.store,
       person: { ...s.person, name: updatedStock.person },
       product: { name: updatedStock.product, icon: productInfo?.icon || s.product.icon },
       qty: updatedStock.qty || s.qty,
      }
     : s
   )
  );
  setShowEditModal(false);
  setSelectedStock(null);
  setMessage({ type: "success", text: "Stock updated successfully" });
 }, [selectedStock]);

 const handleDeleteStock = useCallback(() => {
  if (!selectedStock) return;

  setStocks((prev) => prev.filter((s) => s.id !== selectedStock.id));
  setShowDeleteModal(false);
  setSelectedStock(null);
  setMessage({ type: "success", text: "Stock deleted successfully" });
 }, [selectedStock]);

 return {
  // State
  searchTerm,
  selectedWarehouse,
  selectedStore,
  selectedProduct,
  showWarehouseDropdown,
  showStoreDropdown,
  showProductDropdown,
  currentPage,
  rowsPerPage,
  selectedStocks,
  selectAll,
  isLoading: false,
  message,
  showAddModal,
  showEditModal,
  showDeleteModal,
  selectedStock,

  // Filter options
  warehouses,
  stores,
  products,
  people,
  productList,

  // Data
  stocks,
  filteredStocks,
  currentStocks,
  totalPages,
  startIndex,

  // Handlers
  handleSearchChange,
  handleWarehouseChange,
  handleStoreChange,
  handleProductChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectStock,
  toggleWarehouseDropdown,
  toggleStoreDropdown,
  toggleProductDropdown,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  handleAddStock,
  handleUpdateStock,
  handleDeleteStock,
  setMessage,
 };
};

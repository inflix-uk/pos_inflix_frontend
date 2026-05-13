"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Product } from "../types";
import { productApi } from "../service";

export const useProducts = () => {
 const [products, setProducts] = useState<Product[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [totalPages, setTotalPages] = useState(1);
 const [totalProducts, setTotalProducts] = useState(0);
 const [searchTerm, setSearchTerm] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("");
 const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [productToDelete, setProductToDelete] = useState<Product | null>(null);

 const isInitialLoad = useRef(true);

 const showMessage = useCallback((type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 }, []);

 // Fetch products
 const fetchProducts = useCallback(async (showError = true) => {
  setIsLoading(true);
  try {
   const response = await productApi.getAll({
    search: searchTerm || undefined,
    category: categoryFilter || undefined,
    page: currentPage,
    limit: rowsPerPage,
   });

   setProducts(response.data);
   setTotalPages(response.pages);
   setTotalProducts(response.total);
  } catch (error) {
   if (showError) {
    showMessage("error", "Failed to fetch products");
   }
  } finally {
   setIsLoading(false);
   isInitialLoad.current = false;
  }
 }, [searchTerm, categoryFilter, currentPage, rowsPerPage, showMessage]);

 // Fetch categories for filter
 const fetchCategories = useCallback(async () => {
  const cats = await productApi.getCategories();
  setCategories(cats);
 }, []);

 // Initial fetch
 useEffect(() => {
  fetchCategories();
 }, [fetchCategories]);

 // Fetch products when filters change
 useEffect(() => {
  if (isInitialLoad.current) {
   fetchProducts(false);
  } else {
   fetchProducts(true);
  }
 }, [searchTerm, categoryFilter, currentPage, rowsPerPage]);

 // Search handler
 const handleSearch = useCallback((term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 }, []);

 // Category filter handler
 const handleCategoryFilter = useCallback((category: string) => {
  setCategoryFilter(category);
  setCurrentPage(1);
 }, []);

 // Page change handler
 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
  setSelectedProducts([]);
  setSelectAll(false);
 }, []);

 // Rows per page change handler
 const handleRowsPerPageChange = useCallback((rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedProducts([]);
  setSelectAll(false);
 }, []);

 // Select all handler
 const handleSelectAll = useCallback(() => {
  if (selectAll) {
   setSelectedProducts([]);
  } else {
   setSelectedProducts(products.map((p) => p._id));
  }
  setSelectAll(!selectAll);
 }, [selectAll, products]);

 // Select single product handler
 const handleSelectProduct = useCallback((id: string) => {
  setSelectedProducts((prev) =>
   prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
  );
 }, []);

 // Open delete modal
 const openDeleteModal = useCallback((product: Product) => {
  setProductToDelete(product);
  setDeleteModalOpen(true);
 }, []);

 // Close delete modal
 const closeDeleteModal = useCallback(() => {
  setProductToDelete(null);
  setDeleteModalOpen(false);
 }, []);

 // Delete product
 const deleteProduct = useCallback(async () => {
  if (!productToDelete) return;

  setIsLoading(true);
  try {
   await productApi.delete(productToDelete._id);
   showMessage("success", "Product deleted successfully");
   closeDeleteModal();
   fetchProducts();
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to delete product");
  } finally {
   setIsLoading(false);
  }
 }, [productToDelete, showMessage, closeDeleteModal, fetchProducts]);

 return {
  // Data
  products,
  categories,
  totalProducts,

  // Pagination
  currentPage,
  rowsPerPage,
  totalPages,

  // Filters
  searchTerm,
  categoryFilter,

  // Selection
  selectedProducts,
  selectAll,

  // UI State
  isLoading,
  message,
  deleteModalOpen,
  productToDelete,

  // Handlers
  handleSearch,
  handleCategoryFilter,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectProduct,
  openDeleteModal,
  closeDeleteModal,
  deleteProduct,
  fetchProducts,
 };
};

export default useProducts;

"use client";

import { useState, useEffect, useCallback } from "react";
import { Category, Message } from "../types";
import { categoryApi } from "../service";

export const useCategory = () => {
 const [categories, setCategories] = useState<Category[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Pagination
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [totalItems, setTotalItems] = useState(0);
 const [totalPages, setTotalPages] = useState(0);

 // Filters
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

 // Selection
 const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 // Modals
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

 const fetchCategories = useCallback(async () => {
  setIsLoading(true);
  try {
   const params: { search?: string; isActive?: boolean; page?: number; limit?: number } = {
    page: currentPage,
    limit: rowsPerPage,
   };

   if (searchTerm) params.search = searchTerm;
   if (statusFilter === "active") params.isActive = true;
   if (statusFilter === "inactive") params.isActive = false;

   const response = await categoryApi.getCategories(params);

   if (response.success && response.data) {
    setCategories(response.data as Category[]);
    setTotalItems(response.total || 0);
    setTotalPages(response.pages || 0);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch categories" });
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, searchTerm, statusFilter]);

 useEffect(() => {
  fetchCategories();
 }, [fetchCategories]);

 const clearMessage = () => setMessage({ type: "", text: "" });

 const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 };

 const handleStatusFilter = (status: "all" | "active" | "inactive") => {
  setStatusFilter(status);
  setCurrentPage(1);
 };

 const handlePageChange = (page: number) => {
  setCurrentPage(page);
  setSelectedCategories([]);
  setSelectAll(false);
 };

 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedCategories([]);
  setSelectAll(false);
 };

 const handleSelectAll = () => {
  if (selectAll) {
   setSelectedCategories([]);
  } else {
   setSelectedCategories(categories.map((c) => c._id || c.slug));
  }
  setSelectAll(!selectAll);
 };

 const handleSelectCategory = (id: string) => {
  if (selectedCategories.includes(id)) {
   setSelectedCategories(selectedCategories.filter((i) => i !== id));
  } else {
   setSelectedCategories([...selectedCategories, id]);
  }
 };

 const openDeleteModal = (category: Category) => {
  setSelectedCategory(category);
  setDeleteModalOpen(true);
 };

 const closeDeleteModal = () => {
  setDeleteModalOpen(false);
  setSelectedCategory(null);
 };

 const deleteCategory = async (id: string) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await categoryApi.deleteCategory(id);
   if (response.success) {
    setMessage({ type: "success", text: "Category deleted successfully!" });
    closeDeleteModal();
    fetchCategories();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete category" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete category" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  // Data
  categories,
  isLoading,
  message,
  selectedCategory,

  // Pagination
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,

  // Filters
  searchTerm,
  statusFilter,

  // Selection
  selectedCategories,
  selectAll,

  // Modal states
  deleteModalOpen,

  // Actions
  fetchCategories,
  handleSearch,
  handleStatusFilter,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectCategory,

  // Modal actions
  openDeleteModal,
  closeDeleteModal,

  // CRUD actions
  deleteCategory,
 };
};

"use client";

import { useState, useEffect, useCallback } from "react";
import { SubCategory, SubCategoryFormData, Message, CategoryOption } from "../types";
import { subCategoryApi } from "../service";

export const useSubCategory = () => {
 const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
 const [categories, setCategories] = useState<CategoryOption[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Pagination
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [totalItems, setTotalItems] = useState(0);
 const [totalPages, setTotalPages] = useState(0);

 // Filters
 const [searchTerm, setSearchTerm] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("all");
 const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

 // Selection
 const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 // Modals
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);

 const fetchCategories = useCallback(async () => {
  try {
   const response = await subCategoryApi.getCategories();
   if (response.success && response.data) {
    setCategories(response.data as CategoryOption[]);
   }
  } catch {
   console.error("Failed to fetch categories");
  }
 }, []);

 const fetchSubCategories = useCallback(async () => {
  setIsLoading(true);
  try {
   const params: {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
   } = {
    page: currentPage,
    limit: rowsPerPage,
   };

   if (searchTerm) params.search = searchTerm;
   if (categoryFilter !== "all") params.category = categoryFilter;
   if (statusFilter === "active") params.isActive = true;
   if (statusFilter === "inactive") params.isActive = false;

   const response = await subCategoryApi.getSubCategories(params);

   if (response.success && response.data) {
    setSubCategories(response.data as SubCategory[]);
    setTotalItems(response.total || 0);
    setTotalPages(response.pages || 0);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch sub-categories" });
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, searchTerm, categoryFilter, statusFilter]);

 useEffect(() => {
  fetchCategories();
 }, [fetchCategories]);

 useEffect(() => {
  fetchSubCategories();
 }, [fetchSubCategories]);

 const clearMessage = () => setMessage({ type: "", text: "" });

 const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 };

 const handleCategoryFilter = (category: string) => {
  setCategoryFilter(category);
  setCurrentPage(1);
 };

 const handleStatusFilter = (status: "all" | "active" | "inactive") => {
  setStatusFilter(status);
  setCurrentPage(1);
 };

 const handlePageChange = (page: number) => {
  setCurrentPage(page);
  setSelectedSubCategories([]);
  setSelectAll(false);
 };

 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedSubCategories([]);
  setSelectAll(false);
 };

 const handleSelectAll = () => {
  if (selectAll) {
   setSelectedSubCategories([]);
  } else {
   setSelectedSubCategories(subCategories.map((s) => s._id || s.code));
  }
  setSelectAll(!selectAll);
 };

 const handleSelectSubCategory = (id: string) => {
  if (selectedSubCategories.includes(id)) {
   setSelectedSubCategories(selectedSubCategories.filter((i) => i !== id));
  } else {
   setSelectedSubCategories([...selectedSubCategories, id]);
  }
 };

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);

 const openEditModal = (subCategory: SubCategory) => {
  setSelectedSubCategory(subCategory);
  setEditModalOpen(true);
 };

 const closeEditModal = () => {
  setEditModalOpen(false);
  setSelectedSubCategory(null);
 };

 const openDeleteModal = (subCategory: SubCategory) => {
  setSelectedSubCategory(subCategory);
  setDeleteModalOpen(true);
 };

 const closeDeleteModal = () => {
  setDeleteModalOpen(false);
  setSelectedSubCategory(null);
 };

 const createSubCategory = async (data: SubCategoryFormData) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await subCategoryApi.createSubCategory(data);
   if (response.success) {
    setMessage({ type: "success", text: "Sub-category created successfully!" });
    closeAddModal();
    fetchSubCategories();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to create sub-category" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to create sub-category" });
  } finally {
   setIsLoading(false);
  }
 };

 const updateSubCategory = async (id: string, data: Partial<SubCategoryFormData>) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await subCategoryApi.updateSubCategory(id, data);
   if (response.success) {
    setMessage({ type: "success", text: "Sub-category updated successfully!" });
    closeEditModal();
    fetchSubCategories();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update sub-category" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update sub-category" });
  } finally {
   setIsLoading(false);
  }
 };

 const deleteSubCategory = async (id: string) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await subCategoryApi.deleteSubCategory(id);
   if (response.success) {
    setMessage({ type: "success", text: "Sub-category deleted successfully!" });
    closeDeleteModal();
    fetchSubCategories();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete sub-category" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete sub-category" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  // Data
  subCategories,
  categories,
  isLoading,
  message,
  selectedSubCategory,

  // Pagination
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,

  // Filters
  searchTerm,
  categoryFilter,
  statusFilter,

  // Selection
  selectedSubCategories,
  selectAll,

  // Modal states
  addModalOpen,
  editModalOpen,
  deleteModalOpen,

  // Actions
  fetchSubCategories,
  handleSearch,
  handleCategoryFilter,
  handleStatusFilter,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectSubCategory,

  // Modal actions
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,

  // CRUD actions
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
 };
};

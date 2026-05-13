"use client";

import { useState, useEffect, useCallback } from "react";
import { VariantAttribute, VariantAttributeFormData, Message } from "../types";
import { variantAttributeApi } from "../service";

export const useVariantAttribute = () => {
 const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Pagination
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [totalItems, setTotalItems] = useState(0);
 const [totalPages, setTotalPages] = useState(0);

 // Filters
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
 const [sortBy, setSortBy] = useState<string>("latest");

 // Selection
 const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 // Modals
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [selectedVariant, setSelectedVariant] = useState<VariantAttribute | null>(null);

 const fetchVariantAttributes = useCallback(async () => {
  setIsLoading(true);
  try {
   const params: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
   } = {
    page: currentPage,
    limit: rowsPerPage,
   };

   if (searchTerm) params.search = searchTerm;
   if (statusFilter === "active") params.isActive = true;
   if (statusFilter === "inactive") params.isActive = false;
   if (sortBy) params.sort = sortBy;

   const response = await variantAttributeApi.getVariantAttributes(params);

   if (response.success && response.data) {
    setVariantAttributes(response.data as VariantAttribute[]);
    setTotalItems(response.total || 0);
    setTotalPages(response.pages || 0);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch data" });
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, searchTerm, statusFilter, sortBy]);

 useEffect(() => {
  fetchVariantAttributes();
 }, [fetchVariantAttributes]);

 const clearMessage = () => setMessage({ type: "", text: "" });

 const handleSearch = useCallback((term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 }, []);

 const handleStatusFilter = (status: "all" | "active" | "inactive") => {
  setStatusFilter(status);
  setCurrentPage(1);
 };

 const handleSortChange = (sort: string) => {
  setSortBy(sort);
  setCurrentPage(1);
 };

 const handlePageChange = (page: number) => {
  setCurrentPage(page);
  setSelectedVariants([]);
  setSelectAll(false);
 };

 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedVariants([]);
  setSelectAll(false);
 };

 const handleSelectAll = () => {
  if (selectAll) {
   setSelectedVariants([]);
  } else {
   setSelectedVariants(variantAttributes.map((v) => v._id || v.name));
  }
  setSelectAll(!selectAll);
 };

 const handleSelectVariant = (id: string) => {
  if (selectedVariants.includes(id)) {
   setSelectedVariants(selectedVariants.filter((i) => i !== id));
  } else {
   setSelectedVariants([...selectedVariants, id]);
  }
 };

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);

 const openEditModal = (variant: VariantAttribute) => {
  setSelectedVariant(variant);
  setEditModalOpen(true);
 };

 const closeEditModal = () => {
  setEditModalOpen(false);
  setSelectedVariant(null);
 };

 const createVariantAttribute = async (data: VariantAttributeFormData) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await variantAttributeApi.createVariantAttribute(data);
   if (response.success) {
    setMessage({ type: "success", text: "Variant attribute created successfully!" });
    closeAddModal();
    fetchVariantAttributes();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to create" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to create" });
  } finally {
   setIsLoading(false);
  }
 };

 const updateVariantAttribute = async (id: string, data: Partial<VariantAttributeFormData>) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await variantAttributeApi.updateVariantAttribute(id, data);
   if (response.success) {
    setMessage({ type: "success", text: "Updated successfully!" });
    closeEditModal();
    fetchVariantAttributes();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update" });
  } finally {
   setIsLoading(false);
  }
 };

 const toggleVariantStatus = async (id: string, currentStatus: boolean) => {
  try {
   const response = await variantAttributeApi.updateVariantAttribute(id, { isActive: !currentStatus });
   if (response.success) {
    fetchVariantAttributes();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update status" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update status" });
  }
 };

 return {
  // Data
  variantAttributes,
  isLoading,
  message,
  selectedVariant,

  // Pagination
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,

  // Filters
  searchTerm,
  statusFilter,
  sortBy,

  // Selection
  selectedVariants,
  selectAll,

  // Modal states
  addModalOpen,
  editModalOpen,

  // Actions
  fetchVariantAttributes,
  handleSearch,
  handleStatusFilter,
  handleSortChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectVariant,

  // Modal actions
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,

  // CRUD actions
  createVariantAttribute,
  updateVariantAttribute,
  toggleVariantStatus,
 };
};

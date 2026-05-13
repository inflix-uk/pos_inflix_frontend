"use client";

import { useState, useEffect, useCallback } from "react";
import { Supplier, SupplierFormData, Message } from "../types";
import { supplierApi } from "../service";

export const useSupplier = () => {
 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
 const [sortBy, setSortBy] = useState<string>("latest");

 // Selection
 const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 // Modals
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

 const fetchSuppliers = useCallback(async () => {
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

   const response = await supplierApi.getSuppliers(params);

   if (response.success && response.data) {
    setSuppliers(response.data as Supplier[]);
    setTotalItems(response.total || 0);
    setTotalPages(response.pages || 0);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch suppliers" });
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, searchTerm, statusFilter, sortBy]);

 useEffect(() => {
  fetchSuppliers();
 }, [fetchSuppliers]);

 const clearMessage = () => setMessage({ type: "", text: "" });

 const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 };

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
  setSelectedSuppliers([]);
  setSelectAll(false);
 };

 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedSuppliers([]);
  setSelectAll(false);
 };

 const handleSelectAll = () => {
  if (selectAll) {
   setSelectedSuppliers([]);
  } else {
   setSelectedSuppliers(suppliers.map((s) => s._id || s.name));
  }
  setSelectAll(!selectAll);
 };

 const handleSelectSupplier = (id: string) => {
  if (selectedSuppliers.includes(id)) {
   setSelectedSuppliers(selectedSuppliers.filter((i) => i !== id));
  } else {
   setSelectedSuppliers([...selectedSuppliers, id]);
  }
 };

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);

 const openEditModal = (supplier: Supplier) => {
  setSelectedSupplier(supplier);
  setEditModalOpen(true);
 };

 const closeEditModal = () => {
  setEditModalOpen(false);
  setSelectedSupplier(null);
 };

 const openDeleteModal = (supplier: Supplier) => {
  setSelectedSupplier(supplier);
  setDeleteModalOpen(true);
 };

 const closeDeleteModal = () => {
  setDeleteModalOpen(false);
  setSelectedSupplier(null);
 };

 const createSupplier = async (data: SupplierFormData) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await supplierApi.createSupplier(data);
   if (response.success) {
    setMessage({ type: "success", text: "Supplier created successfully!" });
    closeAddModal();
    fetchSuppliers();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to create supplier" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to create supplier" });
  } finally {
   setIsLoading(false);
  }
 };

 const updateSupplier = async (id: string, data: Partial<SupplierFormData>) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await supplierApi.updateSupplier(id, data);
   if (response.success) {
    setMessage({ type: "success", text: "Supplier updated successfully!" });
    closeEditModal();
    fetchSuppliers();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update supplier" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update supplier" });
  } finally {
   setIsLoading(false);
  }
 };

 const deleteSupplier = async (id: string) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await supplierApi.deleteSupplier(id);
   if (response.success) {
    setMessage({ type: "success", text: "Supplier deleted successfully!" });
    closeDeleteModal();
    fetchSuppliers();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete supplier" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete supplier" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  suppliers,
  isLoading,
  message,
  selectedSupplier,
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,
  searchTerm,
  statusFilter,
  sortBy,
  selectedSuppliers,
  selectAll,
  addModalOpen,
  editModalOpen,
  deleteModalOpen,
  fetchSuppliers,
  handleSearch,
  handleStatusFilter,
  handleSortChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectSupplier,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  createSupplier,
  updateSupplier,
  deleteSupplier,
 };
};

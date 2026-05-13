"use client";

import { useState, useEffect, useCallback } from "react";
import { Purchase, PurchaseFormData, Message } from "../types";
import { purchaseApi } from "../service";

export const usePurchase = () => {
 const [purchases, setPurchases] = useState<Purchase[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [totalPages, setTotalPages] = useState(1);
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
 const [completionStatusFilter, setCompletionStatusFilter] = useState<string>("all");
 const [sortBy, setSortBy] = useState<string>("latest");
 const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
 const [searchTerm, setSearchTerm] = useState("");

 const fetchPurchases = useCallback(async () => {
  setIsLoading(true);
  try {
   const params: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    completionStatus?: string;
    page?: number;
    limit?: number;
    sort?: string;
   } = {
    page: currentPage,
    limit: rowsPerPage,
   };
   if (searchTerm) params.search = searchTerm;
   if (statusFilter !== "all") params.status = statusFilter;
   if (paymentStatusFilter !== "all") params.paymentStatus = paymentStatusFilter;
   if (completionStatusFilter !== "all") params.completionStatus = completionStatusFilter;
   if (sortBy) params.sort = sortBy;

   const response = await purchaseApi.getPurchases(params);
   if (response.success && response.data) {
    setPurchases(response.data);
    setTotalPages(response.pages || 1);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch purchases" });
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, searchTerm, statusFilter, paymentStatusFilter, completionStatusFilter, sortBy]);

 useEffect(() => {
  fetchPurchases();
 }, [fetchPurchases]);

 const filteredPurchases = purchases;
 const paginatedPurchases = purchases;

 const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 };

 const handleStatusFilter = (status: string) => {
  setStatusFilter(status);
  setCurrentPage(1);
 };

 const handlePaymentStatusFilter = (status: string) => {
  setPaymentStatusFilter(status);
  setCurrentPage(1);
 };

 const handleCompletionStatusFilter = (status: string) => {
  setCompletionStatusFilter(status);
  setCurrentPage(1);
 };

 const handleCompletionStatusChange = async (purchaseId: string, completionStatus: "In Process" | "Completed") => {
  try {
   const response = await purchaseApi.updatePurchase(purchaseId, { completionStatus });
   if (response.success) {
    setMessage({ type: "success", text: "Status updated" });
    fetchPurchases();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update status" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update status" });
  }
 };

 const handleSortChange = (sort: string) => {
  setSortBy(sort);
  setCurrentPage(1);
 };

 const handlePageChange = (page: number) => {
  setCurrentPage(page);
  setSelectedPurchases([]);
  setSelectAll(false);
 };

 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
 };

 const handleSelectAll = () => {
  setSelectAll(!selectAll);
  setSelectedPurchases(selectAll ? [] : paginatedPurchases.map((p) => p._id));
 };

 const handleSelectPurchase = (id: string) => {
  setSelectedPurchases(
   selectedPurchases.includes(id)
    ? selectedPurchases.filter((i) => i !== id)
    : [...selectedPurchases, id]
  );
 };

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);

 const openEditModal = (purchase: Purchase) => {
  setSelectedPurchase(purchase);
  setEditModalOpen(true);
 };

 const closeEditModal = () => {
  setEditModalOpen(false);
  setSelectedPurchase(null);
 };

 const openDeleteModal = (purchase: Purchase) => {
  setSelectedPurchase(purchase);
  setDeleteModalOpen(true);
 };

 const closeDeleteModal = () => {
  setDeleteModalOpen(false);
  setSelectedPurchase(null);
 };

 const createPurchase = async (data: PurchaseFormData) => {
  setIsLoading(true);
  try {
   const response = await purchaseApi.createPurchase(data);
   if (response.success) {
    setMessage({ type: "success", text: "Purchase added to inventory!" });
    closeAddModal();
    fetchPurchases();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to add purchase" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to add purchase" });
  } finally {
   setIsLoading(false);
  }
 };

 const updatePurchase = async (id: string, data: Partial<PurchaseFormData>) => {
  setIsLoading(true);
  try {
   const response = await purchaseApi.updatePurchase(id, data);
   if (response.success) {
    setMessage({ type: "success", text: "Purchase updated successfully!" });
    closeEditModal();
    fetchPurchases();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update purchase" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update purchase" });
  } finally {
   setIsLoading(false);
  }
 };

 const deletePurchase = async (id: string) => {
  setIsLoading(true);
  try {
   const response = await purchaseApi.deletePurchase(id);
   if (response.success) {
    setMessage({ type: "success", text: "Purchase removed successfully!" });
    closeDeleteModal();
    fetchPurchases();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to remove purchase" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to remove purchase" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  purchases: paginatedPurchases,
  allPurchases: filteredPurchases,
  isLoading,
  message,
  selectedPurchase,
  currentPage,
  rowsPerPage,
  totalPages,
  statusFilter,
  paymentStatusFilter,
  completionStatusFilter,
  sortBy,
  selectedPurchases,
  selectAll,
  addModalOpen,
  editModalOpen,
  deleteModalOpen,
  fetchPurchases,
  handleSearch,
  handleStatusFilter,
  handlePaymentStatusFilter,
  handleCompletionStatusFilter,
  handleCompletionStatusChange,
  handleSortChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectPurchase,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  createPurchase,
  updatePurchase,
  deletePurchase,
 };
};

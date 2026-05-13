"use client";

import { useState, useCallback, useEffect } from "react";
import { purchaseReturnApi } from "../service/purchaseReturnApi";
import { PurchaseReturn, Message } from "../types";

export const usePurchaseReturn = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState("Status");
 const [sortBy, setSortBy] = useState("Last 7 Days");
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedPurchaseReturns, setSelectedPurchaseReturns] = useState<string[]>([]);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<Message | null>(null);

 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [showReceiveRepairModal, setShowReceiveRepairModal] = useState(false);
 const [selectedPurchaseReturn, setSelectedPurchaseReturn] = useState<PurchaseReturn | null>(null);

 const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
 const [totalCount, setTotalCount] = useState(0);
 const [totalPages, setTotalPages] = useState(0);

 const fetchReturns = useCallback(async () => {
  setIsLoading(true);
  try {
   const res = await purchaseReturnApi.getAll({
    page: currentPage,
    limit: rowsPerPage,
    status: statusFilter !== "Status" ? statusFilter : undefined,
    search: searchTerm || undefined,
   });
   if (res.success && res.data) {
    setPurchaseReturns(res.data);
    setTotalCount(res.total ?? res.data.length);
    setTotalPages(res.pages ?? 1);
   } else {
    setPurchaseReturns([]);
   }
  } catch (err) {
   setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load purchase returns" });
   setPurchaseReturns([]);
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, statusFilter, searchTerm]);

 useEffect(() => {
  fetchReturns();
 }, [fetchReturns]);

 const filteredPurchaseReturns = purchaseReturns;
 const currentPurchaseReturns = purchaseReturns;

 const statuses = ["Status", "Pending", "Sent", "Received by Supplier"];
 const sortOptions = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"];

 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
 }, []);

 const handleRowsPerPageChange = useCallback((value: number) => {
  setRowsPerPage(value);
  setCurrentPage(1);
 }, []);

 const handleSearchChange = useCallback((value: string) => {
  setSearchTerm(value);
  setCurrentPage(1);
 }, []);

 const handleStatusFilterChange = useCallback((value: string) => {
  setStatusFilter(value);
  setShowStatusDropdown(false);
  setCurrentPage(1);
 }, []);

 const handleSortChange = useCallback((value: string) => {
  setSortBy(value);
  setShowSortDropdown(false);
 }, []);

 const handleSelectAll = useCallback(
  (checked: boolean) => {
   if (checked) {
    setSelectedPurchaseReturns(currentPurchaseReturns.map((pr) => pr._id));
   } else {
    setSelectedPurchaseReturns([]);
   }
  },
  [currentPurchaseReturns]
 );

 const handleSelectPurchaseReturn = useCallback((id: string, checked: boolean) => {
  if (checked) {
   setSelectedPurchaseReturns((prev) => [...prev, id]);
  } else {
   setSelectedPurchaseReturns((prev) => prev.filter((x) => x !== id));
  }
 }, []);

 const openAddModal = useCallback(() => setShowAddModal(true), []);
 const closeAddModal = useCallback(() => setShowAddModal(false), []);

 const openEditModal = useCallback((pr: PurchaseReturn) => {
  setSelectedPurchaseReturn(pr);
  setShowEditModal(true);
 }, []);

 const closeEditModal = useCallback(() => {
  setShowEditModal(false);
  setSelectedPurchaseReturn(null);
 }, []);

 const openDeleteModal = useCallback((pr: PurchaseReturn) => {
  setSelectedPurchaseReturn(pr);
  setShowDeleteModal(true);
 }, []);

 const closeDeleteModal = useCallback(() => {
  setShowDeleteModal(false);
  setSelectedPurchaseReturn(null);
 }, []);

 const openReceiveRepairModal = useCallback((pr: PurchaseReturn) => {
  setSelectedPurchaseReturn(pr);
  setShowReceiveRepairModal(true);
 }, []);

 const closeReceiveRepairModal = useCallback(() => {
  setShowReceiveRepairModal(false);
  setSelectedPurchaseReturn(null);
 }, []);

 const handleReceiveRepair = useCallback(
  async (id: string, imeis: string[]) => {
   await purchaseReturnApi.receiveRepair(id, imeis);
   setMessage({ type: "success", text: "Serials received from repair and put back in stock." });
   setShowReceiveRepairModal(false);
   setSelectedPurchaseReturn(null);
   fetchReturns();
  },
  [fetchReturns]
 );

 const handleAddPurchaseReturn = useCallback(
  async (payload: import("../types").CreatePurchaseReturnPayload) => {
   try {
    const res = await purchaseReturnApi.create(payload);
    if (res.success && res.data) {
     setPurchaseReturns((prev) => [res.data!, ...prev]);
     setShowAddModal(false);
     setMessage({ type: "success", text: "Purchase return created successfully. Stock has been reduced." });
     fetchReturns();
    }
   } catch (err) {
    setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create purchase return" });
   }
  },
  [fetchReturns]
 );

 const handleUpdatePurchaseReturn = useCallback(
  async (id: string, data: { status?: string; note?: string }) => {
   try {
    const res = await purchaseReturnApi.update(id, data);
    if (res.success && res.data) {
     setPurchaseReturns((prev) => prev.map((pr) => (pr._id === id ? res.data! : pr)));
     setShowEditModal(false);
     setSelectedPurchaseReturn(null);
     setMessage({ type: "success", text: "Purchase return updated successfully" });
    }
   } catch (err) {
    setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update purchase return" });
   }
  },
  []
 );

 const handleDeletePurchaseReturn = useCallback(async () => {
  if (!selectedPurchaseReturn) return;
  try {
   await purchaseReturnApi.delete(selectedPurchaseReturn._id);
   setPurchaseReturns((prev) => prev.filter((pr) => pr._id !== selectedPurchaseReturn._id));
   setShowDeleteModal(false);
   setSelectedPurchaseReturn(null);
   setMessage({ type: "success", text: "Purchase return deleted" });
  } catch (err) {
   setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete purchase return" });
  }
 }, [selectedPurchaseReturn]);

 const toggleStatusDropdown = useCallback(() => {
  setShowStatusDropdown((prev) => !prev);
  setShowSortDropdown(false);
 }, []);

 const toggleSortDropdown = useCallback(() => {
  setShowSortDropdown((prev) => !prev);
  setShowStatusDropdown(false);
 }, []);

 const getStatusBadge = useCallback((status: string) => {
  switch (status) {
   case "Received by Supplier":
    return "bg-green-100 text-green-800";
   case "Sent":
    return "bg-blue-100 text-blue-800";
   case "Pending":
    return "bg-neutral-100 text-neutral-800";
   default:
    return "bg-gray-100 text-gray-800";
  }
 }, []);

 const getPaymentStatusBadge = useCallback((_status: string) => {
  return "bg-gray-100 text-gray-800";
 }, []);

 const getProductIcon = useCallback((index: number) => {
  const icons = ["📦", "🔄", "📤", "📥"];
  const colors = ["bg-orange-100", "bg-blue-100", "bg-green-100", "bg-gray-100"];
  return { icon: icons[index % icons.length], color: colors[index % colors.length] };
 }, []);

 return {
  searchTerm,
  statusFilter,
  sortBy,
  currentPage,
  rowsPerPage,
  selectedPurchaseReturns,
  showStatusDropdown,
  showSortDropdown,
  isLoading,
  message,
  showAddModal,
  showEditModal,
  showDeleteModal,
  selectedPurchaseReturn,
  statuses,
  sortOptions,
  purchaseReturns,
  filteredPurchaseReturns,
  currentPurchaseReturns,
  totalPages,
  totalCount,
  handleSearchChange,
  handleStatusFilterChange,
  handleSortChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectPurchaseReturn,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  showReceiveRepairModal,
  openReceiveRepairModal,
  closeReceiveRepairModal,
  handleReceiveRepair,
  handleAddPurchaseReturn,
  handleUpdatePurchaseReturn,
  handleDeletePurchaseReturn,
  toggleStatusDropdown,
  toggleSortDropdown,
  setMessage,
  getStatusBadge,
  getPaymentStatusBadge,
  getProductIcon,
 };
};

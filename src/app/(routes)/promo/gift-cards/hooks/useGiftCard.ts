"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { GiftCard, Message } from "../types";
import { giftCardApi } from "../service/giftCardApi";

export const useGiftCard = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedStatus, setSelectedStatus] = useState("All");
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(5);
 const [selectedGiftCards, setSelectedGiftCards] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<Message | null>(null);

 // Modal states
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showViewModal, setShowViewModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null);

 // Dynamic data from API
 const [giftCards, setGiftCards] = useState<GiftCard[]>([]);

 // Fetch gift cards on mount
 const fetchGiftCards = useCallback(async () => {
  setIsLoading(true);
  try {
   const data = await giftCardApi.getAll();
   setGiftCards(data);
  } catch (error) {
   setMessage({ type: "error", text: "Failed to fetch gift cards" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchGiftCards();
 }, [fetchGiftCards]);

 const statuses = ["All", "Active", "Redeemed", "Expired"];

 // Filter and search logic
 const filteredGiftCards = useMemo(() => {
  return giftCards.filter((giftCard) => {
   const matchesSearch =
    giftCard.giftCard.toLowerCase().includes(searchTerm.toLowerCase()) ||
    giftCard.customer.name.toLowerCase().includes(searchTerm.toLowerCase());

   const matchesStatus = selectedStatus === "All" || giftCard.status === selectedStatus;

   return matchesSearch && matchesStatus;
  });
 }, [giftCards, searchTerm, selectedStatus]);

 // Pagination logic
 const totalPages = Math.ceil(filteredGiftCards.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const currentGiftCards = filteredGiftCards.slice(startIndex, startIndex + rowsPerPage);

 // Handlers
 const handleSearchChange = useCallback((value: string) => {
  setSearchTerm(value);
  setCurrentPage(1);
 }, []);

 const handleStatusChange = useCallback((value: string) => {
  setSelectedStatus(value);
  setShowStatusDropdown(false);
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
   setSelectedGiftCards([]);
  } else {
   setSelectedGiftCards(currentGiftCards.map((gc) => gc.id));
  }
  setSelectAll(!selectAll);
 }, [selectAll, currentGiftCards]);

 const handleSelectGiftCard = useCallback((id: string) => {
  setSelectedGiftCards((prev) =>
   prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
  );
 }, []);

 const toggleStatusDropdown = useCallback(() => {
  setShowStatusDropdown((prev) => !prev);
 }, []);

 // Modal handlers
 const openAddModal = useCallback(() => setShowAddModal(true), []);
 const closeAddModal = useCallback(() => setShowAddModal(false), []);

 const openEditModal = useCallback((giftCard: GiftCard) => {
  setSelectedGiftCard(giftCard);
  setShowEditModal(true);
 }, []);
 const closeEditModal = useCallback(() => {
  setShowEditModal(false);
  setSelectedGiftCard(null);
 }, []);

 const openViewModal = useCallback((giftCard: GiftCard) => {
  setSelectedGiftCard(giftCard);
  setShowViewModal(true);
 }, []);
 const closeViewModal = useCallback(() => {
  setShowViewModal(false);
  setSelectedGiftCard(null);
 }, []);

 const openDeleteModal = useCallback((giftCard: GiftCard) => {
  setSelectedGiftCard(giftCard);
  setShowDeleteModal(true);
 }, []);
 const closeDeleteModal = useCallback(() => {
  setShowDeleteModal(false);
  setSelectedGiftCard(null);
 }, []);

 const handleAddGiftCard = useCallback(async (newGiftCard: Omit<GiftCard, "id">) => {
  setIsLoading(true);
  try {
   const created = await giftCardApi.create(newGiftCard);
   setGiftCards((prev) => [...prev, created]);
   setShowAddModal(false);
   setMessage({ type: "success", text: "Gift card added successfully" });
  } catch (error) {
   setMessage({ type: "error", text: "Failed to add gift card" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 const handleUpdateGiftCard = useCallback(async (updatedGiftCard: GiftCard) => {
  setIsLoading(true);
  try {
   const updated = await giftCardApi.update(updatedGiftCard.id, updatedGiftCard);
   setGiftCards((prev) =>
    prev.map((gc) => (gc.id === updated.id ? updated : gc))
   );
   setShowEditModal(false);
   setSelectedGiftCard(null);
   setMessage({ type: "success", text: "Gift card updated successfully" });
  } catch (error) {
   setMessage({ type: "error", text: "Failed to update gift card" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 const handleDeleteGiftCard = useCallback(async (id: string) => {
  setIsLoading(true);
  try {
   await giftCardApi.delete(id);
   setGiftCards((prev) => prev.filter((gc) => gc.id !== id));
   setShowDeleteModal(false);
   setSelectedGiftCard(null);
   setMessage({ type: "success", text: "Gift card deleted successfully" });
  } catch (error) {
   setMessage({ type: "error", text: "Failed to delete gift card" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 const getStatusBadge = useCallback((status: string) => {
  const statusClasses = {
   Active: "bg-green-100 text-green-800",
   Redeemed: "bg-red-100 text-red-800",
   Expired: "bg-gray-100 text-gray-800",
  };
  return statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800";
 }, []);

 return {
  // State
  searchTerm,
  selectedStatus,
  showStatusDropdown,
  currentPage,
  rowsPerPage,
  selectedGiftCards,
  selectAll,
  isLoading,
  message,
  showAddModal,
  showEditModal,
  showViewModal,
  showDeleteModal,
  selectedGiftCard,
  statuses,

  // Data
  giftCards,
  filteredGiftCards,
  currentGiftCards,
  totalPages,

  // Handlers
  handleSearchChange,
  handleStatusChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectGiftCard,
  toggleStatusDropdown,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openViewModal,
  closeViewModal,
  openDeleteModal,
  closeDeleteModal,
  handleAddGiftCard,
  handleUpdateGiftCard,
  handleDeleteGiftCard,
  setMessage,
  refetch: fetchGiftCards,

  // Utility functions
  getStatusBadge,
 };
};

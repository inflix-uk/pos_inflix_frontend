"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Coupon, Message } from "../types";
import { couponApi } from "../service";

export const useCoupon = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedType, setSelectedType] = useState("All");
 const [selectedStatus, setSelectedStatus] = useState("All");
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [showTypeDropdown, setShowTypeDropdown] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message | null>(null);

 // Modal states
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

 // Dynamic data from API
 const [coupons, setCoupons] = useState<Coupon[]>([]);

 // Fetch coupons on mount
 const fetchCoupons = useCallback(async () => {
  setIsLoading(true);
  try {
   const data = await couponApi.getAll();
   setCoupons(data);
  } catch (error) {
   setMessage({ type: "error", text: "Failed to fetch coupons" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchCoupons();
 }, [fetchCoupons]);

 const types = ["All", "Percentage", "Fixed Amount"];
 const statuses = ["All", "Active", "Inactive"];

 // Filter and search logic
 const filteredCoupons = useMemo(() => {
  return coupons.filter((coupon) => {
   const matchesSearch =
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
   const matchesType = selectedType === "All" || coupon.type === selectedType;
   const matchesStatus = selectedStatus === "All" || coupon.status === selectedStatus;

   return matchesSearch && matchesType && matchesStatus;
  });
 }, [coupons, searchTerm, selectedType, selectedStatus]);

 // Pagination
 const totalPages = Math.ceil(filteredCoupons.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + rowsPerPage);

 // Handlers
 const handleSearchChange = useCallback((value: string) => {
  setSearchTerm(value);
  setCurrentPage(1);
 }, []);

 const handleTypeChange = useCallback((value: string) => {
  setSelectedType(value);
  setShowTypeDropdown(false);
  setCurrentPage(1);
 }, []);

 const handleStatusChange = useCallback((value: string) => {
  setSelectedStatus(value);
  setShowStatusDropdown(false);
  setCurrentPage(1);
 }, []);

 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
  setSelectAll(false);
  setSelectedCoupons([]);
 }, []);

 const handleRowsPerPageChange = useCallback((value: number) => {
  setRowsPerPage(value);
  setCurrentPage(1);
  setSelectAll(false);
  setSelectedCoupons([]);
 }, []);

 const handleSelectAll = useCallback(() => {
  if (selectAll) {
   setSelectedCoupons([]);
  } else {
   setSelectedCoupons(paginatedCoupons.map((c) => c.id));
  }
  setSelectAll(!selectAll);
 }, [selectAll, paginatedCoupons]);

 const handleSelectCoupon = useCallback((id: string) => {
  setSelectedCoupons((prev) =>
   prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
  );
 }, []);

 // Modal handlers
 const openAddModal = useCallback(() => {
  setShowAddModal(true);
 }, []);

 const closeAddModal = useCallback(() => {
  setShowAddModal(false);
 }, []);

 const openEditModal = useCallback((coupon: Coupon) => {
  setSelectedCoupon(coupon);
  setShowEditModal(true);
 }, []);

 const closeEditModal = useCallback(() => {
  setShowEditModal(false);
  setSelectedCoupon(null);
 }, []);

 const openDeleteModal = useCallback((coupon: Coupon) => {
  setSelectedCoupon(coupon);
  setShowDeleteModal(true);
 }, []);

 const closeDeleteModal = useCallback(() => {
  setShowDeleteModal(false);
  setSelectedCoupon(null);
 }, []);

 const handleAddCoupon = useCallback(async (newCoupon: Omit<Coupon, "id">) => {
  setIsLoading(true);
  try {
   const created = await couponApi.create(newCoupon);
   setCoupons((prev) => [...prev, created]);
   setShowAddModal(false);
   setMessage({ type: "success", text: "Coupon added successfully" });
  } catch (error) {
   setMessage({ type: "error", text: "Failed to add coupon" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 const handleUpdateCoupon = useCallback(async (updatedCoupon: Coupon) => {
  setIsLoading(true);
  try {
   const updated = await couponApi.update(updatedCoupon.id, updatedCoupon);
   setCoupons((prev) =>
    prev.map((c) => (c.id === updated.id ? updated : c))
   );
   setShowEditModal(false);
   setSelectedCoupon(null);
   setMessage({ type: "success", text: "Coupon updated successfully" });
  } catch (error) {
   setMessage({ type: "error", text: "Failed to update coupon" });
  } finally {
   setIsLoading(false);
  }
 }, []);

 const handleDeleteCoupon = useCallback(async () => {
  if (selectedCoupon) {
   setIsLoading(true);
   try {
    await couponApi.delete(selectedCoupon.id);
    setCoupons((prev) => prev.filter((c) => c.id !== selectedCoupon.id));
    setSelectedCoupons((prev) => prev.filter((id) => id !== selectedCoupon.id));
    setShowDeleteModal(false);
    setSelectedCoupon(null);
    setMessage({ type: "success", text: "Coupon deleted successfully" });
   } catch (error) {
    setMessage({ type: "error", text: "Failed to delete coupon" });
   } finally {
    setIsLoading(false);
   }
  }
 }, [selectedCoupon]);

 const toggleTypeDropdown = useCallback(() => {
  setShowTypeDropdown((prev) => !prev);
  setShowStatusDropdown(false);
  setShowSortDropdown(false);
 }, []);

 const toggleStatusDropdown = useCallback(() => {
  setShowStatusDropdown((prev) => !prev);
  setShowTypeDropdown(false);
  setShowSortDropdown(false);
 }, []);

 const toggleSortDropdown = useCallback(() => {
  setShowSortDropdown((prev) => !prev);
  setShowTypeDropdown(false);
  setShowStatusDropdown(false);
 }, []);

 const getStatusColor = useCallback((status: string) => {
  switch (status) {
   case "Active":
    return "text-green-600 bg-green-100";
   case "Inactive":
    return "text-red-600 bg-red-100";
   default:
    return "text-gray-600 bg-gray-100";
  }
 }, []);

 const getTypeColor = useCallback((type: string) => {
  switch (type) {
   case "Percentage":
    return "text-blue-600 bg-blue-100";
   case "Fixed Amount":
    return "text-neutral-600 bg-neutral-100";
   default:
    return "text-gray-600 bg-gray-100";
  }
 }, []);

 return {
  // State
  searchTerm,
  selectedType,
  selectedStatus,
  currentPage,
  rowsPerPage,
  selectedCoupons,
  selectAll,
  showTypeDropdown,
  showStatusDropdown,
  showSortDropdown,
  isLoading,
  message,
  showAddModal,
  showEditModal,
  showDeleteModal,
  selectedCoupon,
  types,
  statuses,

  // Data
  coupons,
  filteredCoupons,
  paginatedCoupons,
  totalPages,

  // Handlers
  handleSearchChange,
  handleTypeChange,
  handleStatusChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectCoupon,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  handleAddCoupon,
  handleUpdateCoupon,
  handleDeleteCoupon,
  toggleTypeDropdown,
  toggleStatusDropdown,
  toggleSortDropdown,
  setMessage,

  // Utility functions
  getStatusColor,
  getTypeColor,
 };
};

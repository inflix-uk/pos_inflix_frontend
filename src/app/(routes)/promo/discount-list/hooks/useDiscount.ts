"use client";

import { useState, useMemo, useCallback } from "react";
import { Discount, Message } from "../types";

export const useDiscount = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [customerFilter, setCustomerFilter] = useState("Customer");
 const [statusFilter, setStatusFilter] = useState("Status");
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
 const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message | null>(null);

 // Modal states
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

 // Sample data
 const [discounts, setDiscounts] = useState<Discount[]>([
  {
   id: "1",
   name: "Weekend Deal",
   value: "70 (Percentage)",
   discountPlan: "Standard",
   validity: "22 May 2025 - 24 Jun 2025",
   days: ["Sat", "Sun"],
   products: "All Products",
   status: "Active",
   discountType: "Percentage",
   applicableFor: "All Products",
   validFrom: "2025-05-22",
   validTill: "2025-06-24",
  },
  {
   id: "2",
   name: "Loyalty Reward",
   value: "40 (Flat)",
   discountPlan: "Membership",
   validity: "16 Apr 2025 - 16 May 2025",
   days: ["Mon", "Tue", "Thu", "Fri"],
   products: "Specific Products",
   status: "Active",
   discountType: "Flat",
   applicableFor: "Specific Products",
   validFrom: "2025-04-16",
   validTill: "2025-05-16",
  },
  {
   id: "3",
   name: "Flash Sale",
   value: "60 (Percentage)",
   discountPlan: "Standard",
   validity: "20 Mar 2025 - 20 Apr 2025",
   days: ["Thu", "Fri", "Sat", "Sun"],
   products: "All Products",
   status: "Active",
   discountType: "Percentage",
   applicableFor: "All Products",
   validFrom: "2025-03-20",
   validTill: "2025-04-20",
  },
  {
   id: "4",
   name: "Super Saver",
   value: "90 (Percentage)",
   discountPlan: "Standard",
   validity: "15 Feb 2025 - 15 Apr 2025",
   days: ["Mon", "Tue", "Wed"],
   products: "All Products",
   status: "Active",
   discountType: "Percentage",
   applicableFor: "All Products",
   validFrom: "2025-02-15",
   validTill: "2025-04-15",
  },
  {
   id: "5",
   name: "Surprise Savings",
   value: "50 (Flat)",
   discountPlan: "Standard",
   validity: "24 Jan 2025 - 24 Mar 2025",
   days: ["Mon", "Tue", "Thu", "Sat"],
   products: "Specific Products",
   status: "Active",
   discountType: "Flat",
   applicableFor: "Specific Products",
   validFrom: "2025-01-24",
   validTill: "2025-03-24",
  },
 ]);

 const customers = ["Customer"];
 const statuses = ["Status", "Active", "Inactive"];

 // Filter and search logic
 const filteredDiscounts = useMemo(() => {
  return discounts.filter((discount) => {
   const matchesSearch =
    discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.discountPlan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.value.toLowerCase().includes(searchTerm.toLowerCase());

   const matchesStatus = statusFilter === "Status" || discount.status === statusFilter;

   return matchesSearch && matchesStatus;
  });
 }, [discounts, searchTerm, statusFilter]);

 // Pagination logic
 const totalPages = Math.ceil(filteredDiscounts.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const currentDiscounts = filteredDiscounts.slice(startIndex, startIndex + rowsPerPage);

 // Handlers
 const handleSearchChange = useCallback((value: string) => {
  setSearchTerm(value);
  setCurrentPage(1);
 }, []);

 const handleCustomerFilterChange = useCallback((value: string) => {
  setCustomerFilter(value);
  setShowCustomerDropdown(false);
 }, []);

 const handleStatusFilterChange = useCallback((value: string) => {
  setStatusFilter(value);
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

 const handleSelectAll = useCallback(
  (checked: boolean) => {
   if (checked) {
    setSelectedDiscounts(currentDiscounts.map((discount) => discount.id));
   } else {
    setSelectedDiscounts([]);
   }
  },
  [currentDiscounts]
 );

 const handleSelectDiscount = useCallback((discountId: string, checked: boolean) => {
  if (checked) {
   setSelectedDiscounts((prev) => [...prev, discountId]);
  } else {
   setSelectedDiscounts((prev) => prev.filter((id) => id !== discountId));
  }
 }, []);

 const toggleCustomerDropdown = useCallback(() => {
  setShowCustomerDropdown((prev) => !prev);
  setShowStatusDropdown(false);
 }, []);

 const toggleStatusDropdown = useCallback(() => {
  setShowStatusDropdown((prev) => !prev);
  setShowCustomerDropdown(false);
 }, []);

 // Modal handlers
 const openAddModal = useCallback(() => setShowAddModal(true), []);
 const closeAddModal = useCallback(() => setShowAddModal(false), []);

 const openEditModal = useCallback((discount: Discount) => {
  setSelectedDiscount(discount);
  setShowEditModal(true);
 }, []);
 const closeEditModal = useCallback(() => {
  setShowEditModal(false);
  setSelectedDiscount(null);
 }, []);

 const openDeleteModal = useCallback((discount: Discount) => {
  setSelectedDiscount(discount);
  setShowDeleteModal(true);
 }, []);
 const closeDeleteModal = useCallback(() => {
  setShowDeleteModal(false);
  setSelectedDiscount(null);
 }, []);

 const handleAddDiscount = useCallback((newDiscount: Discount) => {
  setDiscounts((prev) => [...prev, newDiscount]);
  setShowAddModal(false);
  setMessage({ type: "success", text: "Discount added successfully" });
 }, []);

 const handleUpdateDiscount = useCallback((updatedDiscount: Discount) => {
  setDiscounts((prev) =>
   prev.map((discount) =>
    discount.id === updatedDiscount.id ? updatedDiscount : discount
   )
  );
  setShowEditModal(false);
  setSelectedDiscount(null);
  setMessage({ type: "success", text: "Discount updated successfully" });
 }, []);

 const handleDeleteDiscount = useCallback(() => {
  if (selectedDiscount) {
   setDiscounts((prev) => prev.filter((discount) => discount.id !== selectedDiscount.id));
   setShowDeleteModal(false);
   setSelectedDiscount(null);
   setMessage({ type: "success", text: "Discount deleted successfully" });
  }
 }, [selectedDiscount]);

 return {
  // State
  searchTerm,
  customerFilter,
  statusFilter,
  currentPage,
  rowsPerPage,
  selectedDiscounts,
  showCustomerDropdown,
  showStatusDropdown,
  isLoading,
  message,
  showAddModal,
  showEditModal,
  showDeleteModal,
  selectedDiscount,
  customers,
  statuses,

  // Data
  discounts,
  filteredDiscounts,
  currentDiscounts,
  totalPages,
  startIndex,

  // Handlers
  handleSearchChange,
  handleCustomerFilterChange,
  handleStatusFilterChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectDiscount,
  toggleCustomerDropdown,
  toggleStatusDropdown,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  handleAddDiscount,
  handleUpdateDiscount,
  handleDeleteDiscount,
  setMessage,
 };
};

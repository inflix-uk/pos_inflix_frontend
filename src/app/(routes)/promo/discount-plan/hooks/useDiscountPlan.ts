"use client";

import { useState, useMemo, useCallback } from "react";
import { DiscountPlan, Message } from "../types";

export const useDiscountPlan = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedCustomer, setSelectedCustomer] = useState("All");
 const [selectedStatus, setSelectedStatus] = useState("All");
 const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedItems, setSelectedItems] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [message, setMessage] = useState<Message | null>(null);

 // Modal states
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedDiscountPlan, setSelectedDiscountPlan] = useState<DiscountPlan | null>(null);

 // Sample data
 const [discountPlans, setDiscountPlans] = useState<DiscountPlan[]>([
  { id: "1", planName: "Standard Plan", customers: "All Customers", status: "Active" },
  { id: "2", planName: "Membership Plan", customers: "Members Only", status: "Active" },
  { id: "3", planName: "Premium Plan", customers: "High-Spending Customers", status: "Active" },
  { id: "4", planName: "Seasonal Plan", customers: "All Customers", status: "Active" },
  { id: "5", planName: "Student Plan", customers: "Students", status: "Active" },
  { id: "6", planName: "Free Shipping Plan", customers: "Online Customers", status: "Active" },
  { id: "7", planName: "Celebration Plan", customers: "All Customers", status: "Active" },
 ]);

 const customers = useMemo(
  () => ["All", ...Array.from(new Set(discountPlans.map((plan) => plan.customers)))],
  [discountPlans]
 );
 const statuses = ["All", "Active", "Inactive"];

 // Filter and search logic
 const filteredDiscountPlans = useMemo(() => {
  return discountPlans.filter((plan) => {
   const customerMatch = selectedCustomer === "All" || plan.customers === selectedCustomer;
   const statusMatch = selectedStatus === "All" || plan.status === selectedStatus;
   const searchTermMatch =
    plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.customers.toLowerCase().includes(searchTerm.toLowerCase());

   return customerMatch && statusMatch && searchTermMatch;
  });
 }, [discountPlans, searchTerm, selectedCustomer, selectedStatus]);

 // Pagination logic
 const totalPages = Math.ceil(filteredDiscountPlans.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const currentDiscountPlans = filteredDiscountPlans.slice(startIndex, startIndex + rowsPerPage);

 // Handlers
 const handleSearchChange = useCallback((value: string) => {
  setSearchTerm(value);
  setCurrentPage(1);
 }, []);

 const handleCustomerChange = useCallback((value: string) => {
  setSelectedCustomer(value);
  setShowCustomerDropdown(false);
  setCurrentPage(1);
 }, []);

 const handleStatusChange = useCallback((value: string) => {
  setSelectedStatus(value);
  setShowStatusDropdown(false);
  setCurrentPage(1);
 }, []);

 const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
  setSelectedItems([]);
  setSelectAll(false);
 }, []);

 const handleRowsPerPageChange = useCallback((value: number) => {
  setRowsPerPage(value);
  setCurrentPage(1);
  setSelectedItems([]);
  setSelectAll(false);
 }, []);

 const handleSelectAll = useCallback(() => {
  if (selectAll) {
   setSelectedItems([]);
  } else {
   setSelectedItems(currentDiscountPlans.map((plan) => plan.id));
  }
  setSelectAll(!selectAll);
 }, [selectAll, currentDiscountPlans]);

 const handleSelectItem = useCallback((id: string) => {
  setSelectedItems((prev) =>
   prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
  );
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

 const openEditModal = useCallback((discountPlan: DiscountPlan) => {
  setSelectedDiscountPlan(discountPlan);
  setShowEditModal(true);
 }, []);
 const closeEditModal = useCallback(() => {
  setShowEditModal(false);
  setSelectedDiscountPlan(null);
 }, []);

 const openDeleteModal = useCallback((discountPlan: DiscountPlan) => {
  setSelectedDiscountPlan(discountPlan);
  setShowDeleteModal(true);
 }, []);
 const closeDeleteModal = useCallback(() => {
  setShowDeleteModal(false);
  setSelectedDiscountPlan(null);
 }, []);

 const handleAddDiscountPlan = useCallback((newDiscountPlan: DiscountPlan) => {
  setDiscountPlans((prev) => [...prev, newDiscountPlan]);
  setShowAddModal(false);
  setMessage({ type: "success", text: "Discount plan added successfully" });
 }, []);

 const handleUpdateDiscountPlan = useCallback((updatedDiscountPlan: DiscountPlan) => {
  setDiscountPlans((prev) =>
   prev.map((plan) => (plan.id === updatedDiscountPlan.id ? updatedDiscountPlan : plan))
  );
  setShowEditModal(false);
  setSelectedDiscountPlan(null);
  setMessage({ type: "success", text: "Discount plan updated successfully" });
 }, []);

 const handleDeleteDiscountPlan = useCallback((id: string) => {
  setDiscountPlans((prev) => prev.filter((plan) => plan.id !== id));
  setShowDeleteModal(false);
  setSelectedDiscountPlan(null);
  setMessage({ type: "success", text: "Discount plan deleted successfully" });
 }, []);

 const getStatusBadgeColor = useCallback((status: string) => {
  switch (status) {
   case "Active":
    return "bg-green-100 text-green-800";
   case "Inactive":
    return "bg-gray-100 text-gray-800";
   default:
    return "bg-gray-100 text-gray-800";
  }
 }, []);

 return {
  // State
  searchTerm,
  selectedCustomer,
  selectedStatus,
  showCustomerDropdown,
  showStatusDropdown,
  currentPage,
  rowsPerPage,
  selectedItems,
  selectAll,
  isLoading,
  message,
  showAddModal,
  showEditModal,
  showDeleteModal,
  selectedDiscountPlan,
  customers,
  statuses,

  // Data
  discountPlans,
  filteredDiscountPlans,
  currentDiscountPlans,
  totalPages,

  // Handlers
  handleSearchChange,
  handleCustomerChange,
  handleStatusChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectItem,
  toggleCustomerDropdown,
  toggleStatusDropdown,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  handleAddDiscountPlan,
  handleUpdateDiscountPlan,
  handleDeleteDiscountPlan,
  setMessage,

  // Utility functions
  getStatusBadgeColor,
 };
};

"use client";
import { useState, useEffect, useCallback } from "react";
import { Customer, CustomerFormData } from "../types";
import { customerApi } from "../service";

export const useCustomer = () => {
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isInitialLoad, setIsInitialLoad] = useState(true);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [totalPages, setTotalPages] = useState(1);
 const [statusFilter, setStatusFilter] = useState("all");
 const [sortBy, setSortBy] = useState("newest");
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);

 const showMessage = (type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 };

 const fetchCustomers = useCallback(async (showError = true) => {
  setIsLoading(true);
  try {
   const response = await customerApi.getAll({
    search: searchTerm,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sortBy,
    page: currentPage,
    limit: rowsPerPage,
   });
   setCustomers(Array.isArray(response.data) ? response.data : []);
   setTotalPages(response.pages ?? response.pagination?.pages ?? 1);
  } catch (error) {
   if (showError) {
    showMessage("error", "Failed to fetch customers");
   }
  } finally {
   setIsLoading(false);
   setIsInitialLoad(false);
  }
 }, [searchTerm, statusFilter, sortBy, currentPage, rowsPerPage]);

 useEffect(() => {
  // On initial load, don't show error and retry once if it fails
  if (isInitialLoad) {
   fetchCustomers(false).then(() => {
    // If customers are still empty after first try, retry once
    if (customers.length === 0) {
     setTimeout(() => fetchCustomers(false), 1000);
    }
   });
  } else {
   fetchCustomers(true);
  }
 }, [searchTerm, statusFilter, sortBy, currentPage, rowsPerPage]);

 const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 };

 const handleStatusFilter = (status: string) => {
  setStatusFilter(status);
  setCurrentPage(1);
 };

 const handleSortChange = (sort: string) => {
  setSortBy(sort);
  setCurrentPage(1);
 };

 const handlePageChange = (page: number) => setCurrentPage(page);
 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
 };

 const handleSelectAll = () => {
  if (selectAll) {
   setSelectedCustomers([]);
  } else {
   setSelectedCustomers(customers.map((c) => c._id!));
  }
  setSelectAll(!selectAll);
 };

 const handleSelectCustomer = (id: string) => {
  setSelectedCustomers((prev) =>
   prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
  );
 };

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);
 const openEditModal = (customer: Customer) => {
  setSelectedCustomer(customer);
  setEditModalOpen(true);
 };
 const closeEditModal = () => {
  setSelectedCustomer(null);
  setEditModalOpen(false);
 };
 const openDeleteModal = (customer: Customer) => {
  setSelectedCustomer(customer);
  setDeleteModalOpen(true);
 };
 const closeDeleteModal = () => {
  setSelectedCustomer(null);
  setDeleteModalOpen(false);
 };

 const createCustomer = async (data: CustomerFormData) => {
  setIsLoading(true);
  try {
   await customerApi.create(data);
   showMessage("success", "Customer created successfully");
   closeAddModal();
   fetchCustomers();
  } catch (error: unknown) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create customer");
  } finally {
   setIsLoading(false);
  }
 };

 const updateCustomer = async (id: string, data: Partial<CustomerFormData>) => {
  setIsLoading(true);
  try {
   await customerApi.update(id, data);
   showMessage("success", "Customer updated successfully");
   closeEditModal();
   fetchCustomers();
  } catch (error: unknown) {
   showMessage("error", error instanceof Error ? error.message : "Failed to update customer");
  } finally {
   setIsLoading(false);
  }
 };

 const deleteCustomer = async (id: string) => {
  setIsLoading(true);
  try {
   await customerApi.delete(id);
   showMessage("success", "Customer deleted successfully");
   closeDeleteModal();
   fetchCustomers();
  } catch (error) {
   showMessage("error", "Failed to delete customer");
  } finally {
   setIsLoading(false);
  }
 };

 return {
  customers,
  isLoading,
  message,
  selectedCustomer,
  currentPage,
  rowsPerPage,
  totalPages,
  statusFilter,
  sortBy,
  selectedCustomers,
  selectAll,
  addModalOpen,
  editModalOpen,
  deleteModalOpen,
  handleSearch,
  handleStatusFilter,
  handleSortChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectCustomer,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCustomers,
 };
};

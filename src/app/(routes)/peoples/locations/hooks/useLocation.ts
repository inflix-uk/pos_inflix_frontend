"use client";

import { useState, useEffect, useCallback } from "react";
import { Location, LocationFormData, Message } from "../types";
import { locationApi } from "../service";

export const useLocation = () => {
 const [locations, setLocations] = useState<Location[]>([]);
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
 const [typeFilter, setTypeFilter] = useState<"all" | "store" | "warehouse">("all");
 const [sortBy, setSortBy] = useState<string>("latest");

 // Selection
 const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);

 // Modals
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

 const fetchLocations = useCallback(async () => {
  setIsLoading(true);
  try {
   const params: {
    search?: string;
    isActive?: boolean;
    type?: string;
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
   if (typeFilter !== "all") params.type = typeFilter;
   if (sortBy) params.sort = sortBy;

   const response = await locationApi.getLocations(params);

   if (response.success && response.data) {
    setLocations(response.data as Location[]);
    setTotalItems(response.total || 0);
    setTotalPages(response.pages || 0);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to fetch locations" });
  } finally {
   setIsLoading(false);
  }
 }, [currentPage, rowsPerPage, searchTerm, statusFilter, typeFilter, sortBy]);

 useEffect(() => {
  fetchLocations();
 }, [fetchLocations]);

 const clearMessage = () => setMessage({ type: "", text: "" });

 const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
 };

 const handleStatusFilter = (status: "all" | "active" | "inactive") => {
  setStatusFilter(status);
  setCurrentPage(1);
 };

 const handleTypeFilter = (type: "all" | "store" | "warehouse") => {
  setTypeFilter(type);
  setCurrentPage(1);
 };

 const handleSortChange = (sort: string) => {
  setSortBy(sort);
  setCurrentPage(1);
 };

 const handlePageChange = (page: number) => {
  setCurrentPage(page);
  setSelectedLocations([]);
  setSelectAll(false);
 };

 const handleRowsPerPageChange = (rows: number) => {
  setRowsPerPage(rows);
  setCurrentPage(1);
  setSelectedLocations([]);
  setSelectAll(false);
 };

 const handleSelectAll = () => {
  if (selectAll) {
   setSelectedLocations([]);
  } else {
   setSelectedLocations(locations.map((l) => l._id || l.name));
  }
  setSelectAll(!selectAll);
 };

 const handleSelectLocation = (id: string) => {
  if (selectedLocations.includes(id)) {
   setSelectedLocations(selectedLocations.filter((i) => i !== id));
  } else {
   setSelectedLocations([...selectedLocations, id]);
  }
 };

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);

 const openEditModal = (location: Location) => {
  setSelectedLocation(location);
  setEditModalOpen(true);
 };

 const closeEditModal = () => {
  setEditModalOpen(false);
  setSelectedLocation(null);
 };

 const openDeleteModal = (location: Location) => {
  setSelectedLocation(location);
  setDeleteModalOpen(true);
 };

 const closeDeleteModal = () => {
  setDeleteModalOpen(false);
  setSelectedLocation(null);
 };

 const createLocation = async (data: LocationFormData) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await locationApi.createLocation(data);
   if (response.success) {
    setMessage({ type: "success", text: "Location created successfully!" });
    closeAddModal();
    fetchLocations();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to create location" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to create location" });
  } finally {
   setIsLoading(false);
  }
 };

 const updateLocation = async (id: string, data: Partial<LocationFormData>) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await locationApi.updateLocation(id, data);
   if (response.success) {
    setMessage({ type: "success", text: "Location updated successfully!" });
    closeEditModal();
    fetchLocations();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to update location" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update location" });
  } finally {
   setIsLoading(false);
  }
 };

 const deleteLocation = async (id: string) => {
  setIsLoading(true);
  clearMessage();
  try {
   const response = await locationApi.deleteLocation(id);
   if (response.success) {
    setMessage({ type: "success", text: "Location deleted successfully!" });
    closeDeleteModal();
    fetchLocations();
   } else {
    setMessage({ type: "error", text: response.message || "Failed to delete location" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to delete location" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  locations,
  isLoading,
  message,
  selectedLocation,
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,
  searchTerm,
  statusFilter,
  typeFilter,
  sortBy,
  selectedLocations,
  selectAll,
  addModalOpen,
  editModalOpen,
  deleteModalOpen,
  fetchLocations,
  handleSearch,
  handleStatusFilter,
  handleTypeFilter,
  handleSortChange,
  handlePageChange,
  handleRowsPerPageChange,
  handleSelectAll,
  handleSelectLocation,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  createLocation,
  updateLocation,
  deleteLocation,
 };
};

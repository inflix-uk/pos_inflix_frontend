"use client";

import { useState, useCallback, useEffect } from "react";
import { repairApi } from "../service/repairApi";
import type { Repair, RepairFormData } from "../types";

export interface RepairMessage {
 type: "success" | "error";
 text: string;
}

export const useRepairs = () => {
 const [repairs, setRepairs] = useState<Repair[]>([]);
 const [total, setTotal] = useState(0);
 const [pages, setPages] = useState(1);
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<RepairMessage>({ type: "success", text: "" });

 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(20);

 useEffect(() => {
  setCurrentPage(1);
 }, [searchTerm, statusFilter]);

 const [addModalOpen, setAddModalOpen] = useState(false);
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

 const fetchRepairs = useCallback(async () => {
  setIsLoading(true);
  setMessage({ type: "success", text: "" });
  try {
   const res = await repairApi.getAll({
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    page: currentPage,
    limit: rowsPerPage,
   });
   if (res.success && Array.isArray(res.data)) {
    setRepairs(res.data);
    setTotal(res.total ?? res.data.length);
    setPages(res.pages ?? 1);
   } else {
    setRepairs([]);
   }
  } catch (err) {
   setMessage({
    type: "error",
    text: err instanceof Error ? err.message : "Failed to load repairs",
   });
   setRepairs([]);
  } finally {
   setIsLoading(false);
  }
 }, [searchTerm, statusFilter, sortBy, currentPage, rowsPerPage]);

 useEffect(() => {
  fetchRepairs();
 }, [fetchRepairs]);

 const openAddModal = useCallback(() => setAddModalOpen(true), []);
 const closeAddModal = useCallback(() => setAddModalOpen(false), []);

 const openEditModal = useCallback((repair: Repair) => {
  setSelectedRepair(repair);
  setEditModalOpen(true);
 }, []);
 const closeEditModal = useCallback(() => {
  setSelectedRepair(null);
  setEditModalOpen(false);
 }, []);

 const openDeleteModal = useCallback((repair: Repair) => {
  setSelectedRepair(repair);
  setDeleteModalOpen(true);
 }, []);
 const closeDeleteModal = useCallback(() => {
  setSelectedRepair(null);
  setDeleteModalOpen(false);
 }, []);

 const handleCreateRepair = useCallback(
  async (data: RepairFormData) => {
   try {
    const res = await repairApi.create(data);
    if (res.success && res.data) {
     setMessage({ type: "success", text: "Repair created successfully" });
     closeAddModal();
     fetchRepairs();
    } else {
     setMessage({
      type: "error",
      text: (res as { message?: string }).message || "Failed to create repair",
     });
    }
   } catch (err) {
    setMessage({
     type: "error",
     text: err instanceof Error ? err.message : "Failed to create repair",
    });
   }
  },
  [closeAddModal, fetchRepairs]
 );

 const handleUpdateRepair = useCallback(
  async (id: string, data: Partial<RepairFormData>) => {
   try {
    const res = await repairApi.update(id, data);
    if (res.success && res.data) {
     setMessage({ type: "success", text: "Repair updated successfully" });
     closeEditModal();
     fetchRepairs();
    } else {
     setMessage({
      type: "error",
      text: (res as { message?: string }).message || "Failed to update repair",
     });
    }
   } catch (err) {
    setMessage({
     type: "error",
     text: err instanceof Error ? err.message : "Failed to update repair",
    });
   }
  },
  [closeEditModal, fetchRepairs]
 );

 const handleDeleteRepair = useCallback(
  async (id: string) => {
   try {
    await repairApi.delete(id);
    setMessage({ type: "success", text: "Repair deleted successfully" });
    closeDeleteModal();
    fetchRepairs();
   } catch (err) {
    setMessage({
     type: "error",
     text: err instanceof Error ? err.message : "Failed to delete repair",
    });
   }
  },
  [closeDeleteModal, fetchRepairs]
 );

 const handleStatusChange = useCallback(
  async (repair: Repair, newStatus: string) => {
   try {
    const res = await repairApi.update(repair._id, { status: newStatus as Repair["status"] });
    if (res.success) {
     setMessage({ type: "success", text: "Status updated" });
     fetchRepairs();
    } else {
     setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to update status" });
    }
   } catch (err) {
    setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update status" });
   }
  },
  [fetchRepairs]
 );

 const statusOptions = [
  "all",
  "pending",
  "in_progress",
  "waiting_parts",
  "completed",
  "cancelled",
  "collected",
  "redo",
 ] as const;

 return {
  repairs,
  total,
  pages,
  isLoading,
  message,
  setMessage,
  searchTerm,
  statusFilter,
  sortBy,
  currentPage,
  rowsPerPage,
  setSearchTerm,
  setStatusFilter,
  setSortBy,
  setCurrentPage,
  setRowsPerPage,
  addModalOpen,
  editModalOpen,
  deleteModalOpen,
  selectedRepair,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  handleCreateRepair,
  handleUpdateRepair,
  handleDeleteRepair,
  handleStatusChange,
  fetchRepairs,
  statusOptions,
 };
};

"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRepairs } from "./hooks/useRepairs";
import type { Repair } from "./types";
import { repairToForPrint } from "./lib/repairToForPrint";
import { printRepairLabel57x32, printRepairTicket80mm } from "@/lib/invoicePrint";
import {
 RepairHeader,
 RepairFilters,
 RepairTable,
 RepairPagination,
 AddRepairModal,
 DeleteRepairModal,
} from "./components";

export default function RepairsPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const {
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
 deleteModalOpen,
 selectedRepair,
 openAddModal,
 closeAddModal,
 openDeleteModal,
 closeDeleteModal,
 handleCreateRepair,
 handleDeleteRepair,
 handleStatusChange,
 fetchRepairs,
 } = useRepairs();

 const editRepairId = searchParams.get("edit");
 const [printingLabelId, setPrintingLabelId] = useState<string | null>(null);
 const [printingTicketId, setPrintingTicketId] = useState<string | null>(null);

 const openRepair = useCallback(
 (repair: Repair) => {
 router.push(`/repairs/edit/${repair._id}`);
 },
 [router]
 );

 const handlePrintTicket = useCallback(
 async (repair: Repair) => {
 setPrintingTicketId(repair._id);
 try {
 await printRepairTicket80mm(repairToForPrint(repair));
 } catch (e) {
 setMessage({
  type: "error",
  text: e instanceof Error ? e.message : "Failed to open repair ticket for print",
 });
 } finally {
 setPrintingTicketId(null);
 }
 },
 [setMessage]
 );

 const handlePrintLabel = useCallback(
 async (repair: Repair) => {
 setPrintingLabelId(repair._id);
 try {
 const path = await printRepairLabel57x32(repairToForPrint(repair));
 if (path === "label-png" || path === "pdf-silent") {
  setMessage({
  type: "success",
  text: `Label sent for ${repair.reference ?? "repair"}.`,
  });
 } else {
  setMessage({
  type: "success",
  text: "Label opened for printing in your browser.",
  });
 }
 } catch (e) {
 setMessage({
  type: "error",
  text: e instanceof Error ? e.message : "Failed to print label",
 });
 } finally {
 setPrintingLabelId(null);
 }
 },
 [setMessage]
 );

 // Redirect old ?edit=id to full edit page
 useEffect(() => {
 if (!editRepairId) return;
 router.replace(`/repairs/edit/${editRepairId}`);
 }, [editRepairId, router]);

 return (
 <div className="@container min-h-screen min-w-0 max-w-full bg-neutral-50 p-3 @[640px]:p-4 @[768px]:p-6">
 {message.text && (
 <div
  className={`mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-xl border shadow-sm text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-neutral-50/90 border-neutral-200 text-emerald-900"
  : "bg-red-50/90 border-red-200 text-red-900"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="mb-4 @[640px]:mb-6">
 <RepairHeader
  onAddClick={openAddModal}
  onRefresh={fetchRepairs}
  useAddPage
  onQuickAdd={openAddModal}
 />
 </div>

 <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden min-w-0 max-w-full">
 <RepairFilters
  searchTerm={searchTerm}
  statusFilter={statusFilter}
  sortBy={sortBy}
  onSearchChange={setSearchTerm}
  onStatusChange={setStatusFilter}
  onSortChange={setSortBy}
 />
 <RepairTable
  repairs={repairs}
  isLoading={isLoading}
  onOpenRepair={openRepair}
  onEdit={(repair) => router.push(`/repairs/edit/${repair._id}`)}
  onDelete={openDeleteModal}
  onStatusChange={handleStatusChange}
  onPrintTicket={handlePrintTicket}
  onPrintLabel={handlePrintLabel}
  printingLabelId={printingLabelId}
  printingTicketId={printingTicketId}
 />
 <RepairPagination
  currentPage={currentPage}
  totalPages={pages}
  total={total}
  rowsPerPage={rowsPerPage}
  onPageChange={setCurrentPage}
  onRowsPerPageChange={(v) => {
  setRowsPerPage(v);
  setCurrentPage(1);
  }}
 />
 </div>

 <AddRepairModal
 open={addModalOpen}
 onClose={closeAddModal}
 onSubmit={handleCreateRepair}
 isLoading={isLoading}
 />
 <DeleteRepairModal
 open={deleteModalOpen}
 repair={selectedRepair}
 onClose={closeDeleteModal}
 onConfirm={handleDeleteRepair}
 isLoading={isLoading}
 />
 </div>
 );
}

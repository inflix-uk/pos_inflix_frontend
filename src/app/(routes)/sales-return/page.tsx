"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
 Search,
 ChevronDown,
 Plus,
 Eye,
 Edit,
 Trash2,
 ChevronLeft,
 ChevronRight,
 RotateCcw,
 User,
 X,
} from "lucide-react";
import { TableLoader } from "@/app/components/ui/Loader";
import type { SalesReturn } from "./types";
import AddSalesReturnModal from "../../components/sales-return/AddSalesReturnModal";
import DeleteSalesReturnModal from "../../components/sales-return/DeleteSalesReturnModal";
import EditSalesReturnModal from "../../components/sales-return/EditSalesReturnModal";
import { salesReturnApi } from "./service";
import { customerApi } from "../peoples/customers/service";
import { salesApi } from "../sales-dashboard/service/salesApi";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
 if (!d) return "—";
 const date = new Date(d);
 return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const Page = () => {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
 const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
 const [selectedStatus, setSelectedStatus] = useState<string>("All");
 const [selectedCustomer, setSelectedCustomer] = useState<string>("All");
 const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("All");
 const [searchTerm, setSearchTerm] = useState<string>("");
 const [showAddModal, setShowAddModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showViewModal, setShowViewModal] = useState(false);
 const [selectedReturnForDelete, setSelectedReturnForDelete] = useState<string | null>(null);
 const [selectedReturnForEdit, setSelectedReturnForEdit] = useState<SalesReturn | null>(null);
 const [selectedReturnForView, setSelectedReturnForView] = useState<SalesReturn | null>(null);

 const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
 const [totalEntries, setTotalEntries] = useState(0);
 const [totalPages, setTotalPages] = useState(1);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [customerNames, setCustomerNames] = useState<string[]>([]);

 const customers = Array.from(new Set(salesReturns.map((ret) => ret.customer?.name).filter(Boolean))) as string[];
 const statuses = ["Received", "Pending", "Ordered"];
 const paymentStatuses = ["Paid", "Unpaid", "Pending"];

 const showMessage = useCallback((type: "success" | "error", text: string) => {
 setMessage({ type, text });
 setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 }, []);

 const fetchList = useCallback(async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await salesReturnApi.getList({
 search: searchTerm || undefined,
 status: selectedStatus,
 customer: selectedCustomer,
 paymentStatus: selectedPaymentStatus,
 page: currentPage,
 limit: rowsPerPage,
 });
 setSalesReturns(res.data);
 setTotalEntries(res.total);
 setTotalPages(res.pages || 1);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load sales returns");
 setSalesReturns([]);
 setTotalEntries(0);
 setTotalPages(1);
 } finally {
 setLoading(false);
 }
 }, [searchTerm, selectedStatus, selectedCustomer, selectedPaymentStatus, currentPage, rowsPerPage]);

 useEffect(() => {
 fetchList();
 }, [fetchList]);

 // Auto-open Add Return when arriving with ?invoice=... (&customer=...)
 useEffect(() => {
 const invoice = searchParams.get("invoice");
 if (invoice && invoice.trim()) setShowAddModal(true);
 }, [searchParams]);

 const handleSearchSubmit = useCallback(async () => {
 const term = searchTerm.trim();
 if (!term) {
 fetchList();
 return;
 }
 // If it looks like an invoice number, try to open that sale
 if (/^INV-/i.test(term)) {
 try {
 const res = await salesApi.getSales({ search: term, limit: 1 });
 const list = res.data ?? [];
 if (list.length > 0 && list[0]._id) {
  router.push(`/sales-online-orders/edit/${list[0]._id}?startReturn=1`);
  return;
 }
 showMessage("error", "No invoice found with that number.");
 } catch {
 showMessage("error", "Could not find invoice. Check the number and try again.");
 }
 return;
 }
 // If it looks like a serial/IMEI (e.g. long numeric), try to find the sale that sold it and open edit sale
 const looksLikeSerial = /^\d{8,}$/.test(term) || (term.length >= 8 && /^[A-Za-z0-9]+$/.test(term));
 if (looksLikeSerial) {
 try {
 const res = await salesApi.getFindBySerial(term);
 const saleId = res?.data?.saleId;
 if (saleId) {
  router.push(`/sales-online-orders/edit/${saleId}?startReturn=1`);
  return;
 }
 } catch {
 showMessage("error", "No sale found for this serial/IMEI. It may not be sold or may already be returned.");
 }
 return;
 }
 fetchList();
 }, [searchTerm, fetchList, router, showMessage]);

 useEffect(() => {
 customerApi.getAll({ limit: 500 }).then((res) => {
 const names = (res.data || []).map((c: { name?: string }) => c.name).filter(Boolean) as string[];
 setCustomerNames(names);
 }).catch(() => {});
 }, []);

 const onFilterChange = useCallback(() => setCurrentPage(1), []);

 const paginatedReturns = salesReturns;

 const handleSelectAll = () => {
 if (selectAll) {
 setSelectedReturns([]);
 } else {
 setSelectedReturns(paginatedReturns.map(ret => ret.id));
 }
 setSelectAll(!selectAll);
 };

 const handleSelectReturn = (id: string) => {
 if (selectedReturns.includes(id)) {
 setSelectedReturns(selectedReturns.filter(retId => retId !== id));
 } else {
 setSelectedReturns([...selectedReturns, id]);
 }
 };

 const handlePageChange = (page: number) => {
 setCurrentPage(page);
 setSelectAll(false);
 setSelectedReturns([]);
 };

 const handleRowsPerPageChange = (value: number) => {
 setRowsPerPage(value);
 setCurrentPage(1);
 setSelectAll(false);
 setSelectedReturns([]);
 };

 const handleAddSalesReturn = async (newSalesReturn: SalesReturn) => {
 try {
 await salesReturnApi.create(newSalesReturn);
 showMessage("success", "Sales return created.");
 setShowAddModal(false);
 fetchList();
 } catch (e) {
 showMessage("error", e instanceof Error ? e.message : "Failed to create sales return");
 }
 };

 const handleUpdateSalesReturn = async (updatedSalesReturn: SalesReturn) => {
 if (!updatedSalesReturn.id) return;
 try {
 await salesReturnApi.update(updatedSalesReturn.id, updatedSalesReturn);
 showMessage("success", "Sales return updated.");
 setShowEditModal(false);
 setSelectedReturnForEdit(null);
 fetchList();
 } catch (e) {
 showMessage("error", e instanceof Error ? e.message : "Failed to update sales return");
 }
 };

 const handleDeleteSalesReturn = async () => {
 if (!selectedReturnForDelete) return;
 try {
 await salesReturnApi.delete(selectedReturnForDelete);
 showMessage("success", "Sales return deleted.");
 setSelectedReturns((prev) => prev.filter((id) => id !== selectedReturnForDelete));
 setShowDeleteModal(false);
 setSelectedReturnForDelete(null);
 fetchList();
 } catch (e) {
 showMessage("error", e instanceof Error ? e.message : "Failed to delete sales return");
 }
 };

 const openDeleteModal = (id: string) => {
 setSelectedReturnForDelete(id);
 setShowDeleteModal(true);
 };

 const openEditModal = (salesReturn: SalesReturn) => {
 setSelectedReturnForEdit(salesReturn);
 setShowEditModal(true);
 };

 const getStatusColor = (status: string) => {
 switch (status) {
 case "Received":
 return "text-green-600 bg-green-100";
 case "Pending":
 return "text-blue-600 bg-blue-100";
 case "Ordered":
 return "text-orange-600 bg-orange-100";
 default:
 return "text-gray-600 bg-gray-100";
 }
 };

 const getPaymentStatusColor = (status: string) => {
 switch (status) {
 case "Paid":
 return "text-green-600 bg-green-100";
 case "Unpaid":
 return "text-red-600 bg-red-100";
 case "Pending":
 return "text-orange-600 bg-orange-100";
 default:
 return "text-gray-600 bg-gray-100";
 }
 };

 return (
 <div className="@container min-h-screen bg-gray-50/80 p-3 @[640px]:p-6">
 <div className="max-w-7xl mx-auto">
 {/* Header */}
 <div className="mb-4 @[640px]:mb-8 flex flex-wrap items-center justify-between gap-2 @[640px]:gap-4">
  <div className="flex items-center gap-2 @[640px]:gap-4">
  <div className="p-2 @[640px]:p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <RotateCcw className="h-5 w-5 @[640px]:h-8 @[640px]:w-8 text-orange-500" />
  </div>
  <div className="min-w-0">
  <h1 className="text-lg @[640px]:text-2xl font-bold text-gray-900 tracking-tight">Sales Return</h1>
  <p className="text-gray-500 text-[11px] @[640px]:text-sm mt-0.5">Manage customer returns — add, edit and track</p>
  </div>
  </div>
  <button
  onClick={() => setShowAddModal(true)}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-5 py-1.5 @[640px]:py-2.5 text-xs @[640px]:text-sm font-semibold text-white bg-orange-500 rounded-lg @[640px]:rounded-xl hover:bg-orange-600 shadow-sm transition-colors"
  >
  <Plus size={16} className="@[640px]:hidden" />
  <Plus size={18} className="hidden @[640px]:inline" />
  <span className="hidden @[420px]:inline">Add Sales Return</span>
  <span className="@[420px]:hidden">Add</span>
  </button>
 </div>

 {message.text && (
 <div
  className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded-xl shadow-lg ${
  message.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Filters and Search */}
 <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden">
 <div className="p-3 @[640px]:p-5 @[768px]:p-6 border-b border-gray-100 bg-gray-50/50">
  <div className="flex flex-col @[1024px]:flex-row @[1024px]:items-center @[1024px]:justify-between gap-3 @[640px]:gap-4">
  {/* Search */}
  <div className="flex flex-1 @[1024px]:max-w-xl items-center gap-2">
  <div className="relative flex-1 min-w-0">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 @[640px]:h-5 @[640px]:w-5" />
  <input
   type="text"
   placeholder="Search invoice, customer, product, serial…"
   className="w-full pl-9 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm border border-gray-200 rounded-lg @[640px]:rounded-xl focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   value={searchTerm}
   onChange={(e) => { setSearchTerm(e.target.value); onFilterChange(); }}
   onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
  />
  </div>
  <button
  type="button"
  onClick={handleSearchSubmit}
  className="shrink-0 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg @[640px]:rounded-xl hover:bg-orange-100"
  >
  Search
  </button>
  </div>

  {/* Filters */}
  <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3 @[1024px]:gap-4">
  {/* Customer Filter */}
  <div className="relative">
  <button
   onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
   className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Customer</span>
   <ChevronDown size={16} />
  </button>
  {showCustomerDropdown && (
   <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
   <button
   onClick={() => {
   setSelectedCustomer("All");
   setShowCustomerDropdown(false);
   onFilterChange();
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   All
   </button>
   {customers.map((customer) => (
   <button
   key={customer}
   onClick={() => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    onFilterChange();
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   {customer}
   </button>
   ))}
   </div>
  )}
  </div>

  {/* Status Filter */}
  <div className="relative">
  <button
   onClick={() => setShowStatusDropdown(!showStatusDropdown)}
   className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Status</span>
   <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
   <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
   <button
   onClick={() => {
   setSelectedStatus("All");
   setShowStatusDropdown(false);
   onFilterChange();
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   All
   </button>
   {statuses.map((status) => (
   <button
   key={status}
   onClick={() => {
    setSelectedStatus(status);
    setShowStatusDropdown(false);
    onFilterChange();
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   {status}
   </button>
   ))}
   </div>
  )}
  </div>

  {/* Payment Status Filter */}
  <div className="relative">
  <button
   onClick={() => setShowPaymentStatusDropdown(!showPaymentStatusDropdown)}
   className="flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Payment Status</span>
   <ChevronDown size={16} />
  </button>
  {showPaymentStatusDropdown && (
   <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
   <button
   onClick={() => {
   setSelectedPaymentStatus("All");
   setShowPaymentStatusDropdown(false);
   onFilterChange();
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   All
   </button>
   {paymentStatuses.map((status) => (
   <button
   key={status}
   onClick={() => {
    setSelectedPaymentStatus(status);
    setShowPaymentStatusDropdown(false);
    onFilterChange();
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   {status}
   </button>
   ))}
   </div>
  )}
  </div>

  </div>
  </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left">
   <input
   type="checkbox"
   checked={selectAll}
   onChange={handleSelectAll}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
  </th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Reference</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Invoice</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Product</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Date</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Customer</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Status</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Total</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Paid</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Due</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Payment Status</th>
  <th className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 text-left text-xs @[640px]:text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {loading ? (
  <TableLoader colSpan={12} />
  ) : error ? (
  <tr>
   <td colSpan={12} className="px-6 py-16 text-center">
   <p className="text-red-600 font-medium">{error}</p>
   <button
   type="button"
   onClick={() => fetchList()}
   className="mt-2 text-sm text-orange-600 hover:underline"
   >
   Retry
   </button>
   </td>
  </tr>
  ) : paginatedReturns.length === 0 ? (
  <tr>
   <td colSpan={12} className="px-6 py-16 text-center">
   <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
   <p className="text-gray-500 font-medium">No sales returns yet</p>
   <p className="text-gray-400 text-sm mt-1">Click “Add Sales Return” to create one.</p>
   <button
   type="button"
   onClick={() => setShowAddModal(true)}
   className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
   >
   <Plus size={18} />
   Add Sales Return
   </button>
   </td>
  </tr>
  ) : (
  paginatedReturns.map((salesReturn) => (
  <tr key={salesReturn.id} className="hover:bg-gray-50">
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4">
   <input
   type="checkbox"
   checked={selectedReturns.includes(salesReturn.id)}
   onChange={() => handleSelectReturn(salesReturn.id)}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <span className="font-mono text-sm font-medium text-orange-600">
   {salesReturn.reference || "—"}
   </span>
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <span className="font-mono text-sm text-gray-700">
   {salesReturn.linkedInvoiceRef || "—"}
   </span>
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <div className="flex items-center gap-3">
   <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
   <RotateCcw className="text-blue-600" size={16} />
   </div>
   <span className="text-sm font-medium text-gray-900">
   {salesReturn.items[0]?.product || "Multiple Items"}
   </span>
   </div>
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
   {formatDate(salesReturn.date)}
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <div className={`w-8 h-8 rounded-full ${salesReturn.customer.color} flex items-center justify-center text-sm`}>
   <User size={16} className="text-gray-600" />
   </div>
   <span className="text-sm text-gray-900">
   {salesReturn.customer.name}
   </span>
   </div>
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(salesReturn.status)}`}>
   {salesReturn.status}
   </span>
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm font-medium text-gray-900">
   {formatMoney(salesReturn.total)}
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
   {formatMoney(salesReturn.paid)}
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
   {formatMoney(salesReturn.due)}
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(salesReturn.paymentStatus)}`}>
   {salesReturn.paymentStatus}
   </span>
   </td>
   <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <button
   type="button"
   onClick={() => { setSelectedReturnForView(salesReturn); setShowViewModal(true); }}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   aria-label="View"
   >
   <Eye size={16} />
   </button>
   <button
   type="button"
   onClick={() => openEditModal(salesReturn)}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   aria-label="Edit"
   >
   <Edit size={16} />
   </button>
   <button
   type="button"
   onClick={() => openDeleteModal(salesReturn.id)}
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
   aria-label="Delete"
   >
   <Trash2 size={16} />
   </button>
   </div>
   </td>
  </tr>
  ))
  )}
  </tbody>
  </table>
 </div>

 {/* Pagination */}
 <div className="px-3 @[640px]:px-6 py-3 @[640px]:py-4 border-t border-gray-100 bg-gray-50/30 flex flex-wrap items-center justify-between gap-2 @[640px]:gap-4">
  <div className="flex items-center gap-3">
  <span className="text-sm text-gray-500">Rows per page</span>
  <select
  value={rowsPerPage}
  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-orange-500/30"
  >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={20}>20</option>
  <option value={50}>50</option>
  </select>
  <span className="text-sm text-gray-500">{totalEntries} entries</span>
  </div>
  <div className="flex items-center gap-1">
  <button
  onClick={() => handlePageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-40 disabled:pointer-events-none"
  >
  <ChevronLeft size={18} />
  </button>
  <span className="px-4 py-2 text-sm font-medium text-gray-600">
  Page {currentPage} of {totalPages}
  </span>
  <button
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages}
  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-40 disabled:pointer-events-none"
  >
  <ChevronRight size={18} />
  </button>
  </div>
 </div>
 </div>
 </div>

 {/* View modal */}
 {showViewModal && selectedReturnForView && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
  <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/80">
  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
  <h2 className="text-lg font-semibold text-gray-900">
  Return — <span className="font-mono text-orange-600">{selectedReturnForView.reference}</span>
  </h2>
  <button
  type="button"
  onClick={() => { setShowViewModal(false); setSelectedReturnForView(null); }}
  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200/80"
  aria-label="Close"
  >
  <X size={20} />
  </button>
  </div>
  <div className="p-6 overflow-y-auto space-y-4">
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Reference</span>
  <span className="font-mono font-medium text-orange-600">{selectedReturnForView.reference || "—"}</span>
  </div>
  {selectedReturnForView.linkedInvoiceRef && (
  <div className="flex justify-between text-sm">
   <span className="text-gray-500">Original invoice</span>
   <span className="font-mono font-medium text-gray-900">{selectedReturnForView.linkedInvoiceRef}</span>
  </div>
  )}
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Customer</span>
  <span className="font-medium text-gray-900">{selectedReturnForView.customer.name}</span>
  </div>
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Date</span>
  <span className="font-medium text-gray-900">{selectedReturnForView.date}</span>
  </div>
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Status</span>
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReturnForView.status)}`}>
   {selectedReturnForView.status}
  </span>
  </div>
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Payment</span>
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedReturnForView.paymentStatus)}`}>
   {selectedReturnForView.paymentStatus}
  </span>
  </div>
  <div className="border-t border-gray-200 pt-3">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</p>
  <ul className="space-y-2">
   {selectedReturnForView.items.map((item) => (
   <li key={item.id} className="flex justify-between text-sm">
   <span className="text-gray-700">
   {item.product} × {item.quantity}
   {(item.serialNumbers?.length ?? 0) > 0 && (
    <span className="block text-xs text-gray-500 mt-0.5">
    Serial: {item.serialNumbers!.join(", ")}
    </span>
   )}
   </span>
   <span className="font-medium text-gray-900">{formatMoney(item.subtotal)}</span>
   </li>
   ))}
  </ul>
  </div>
  <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900">
  <span>Grand total</span>
  <span>{formatMoney(selectedReturnForView.grandTotal)}</span>
  </div>
  </div>
  </div>
 </div>
 )}

 {/* Modals */}
 <AddSalesReturnModal
 open={showAddModal}
 onClose={() => setShowAddModal(false)}
 onAdd={handleAddSalesReturn}
 customerNames={customerNames}
 initialInvoiceRef={searchParams.get("invoice")?.trim() ?? ""}
 initialCustomerName={searchParams.get("customer")?.trim() ?? ""}
 />

 <EditSalesReturnModal
 open={showEditModal}
 onClose={() => setShowEditModal(false)}
 onUpdate={handleUpdateSalesReturn}
 salesReturn={selectedReturnForEdit}
 customerNames={customerNames}
 />

 <DeleteSalesReturnModal
 open={showDeleteModal}
 onClose={() => setShowDeleteModal(false)}
 onDelete={handleDeleteSalesReturn}
 reference={salesReturns.find(ret => ret.id === selectedReturnForDelete)?.reference}
 />
 </div>
 );
};

export default Page;
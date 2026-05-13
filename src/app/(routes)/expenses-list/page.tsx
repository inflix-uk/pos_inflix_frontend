"use client";

import React from "react";
import Link from "next/link";
import { useExpensesList } from "./hooks/useExpensesList";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { Plus, Eye, Pencil, Paperclip, Trash2 } from "lucide-react";
import type { Expense } from "./types";
import { DeleteExpenseModal } from "./components/DeleteExpenseModal";
import { PAYMENT_METHODS, STATUSES } from "./types";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function categoryName(exp: Expense): string {
 const c = exp.categoryId;
 return typeof c === "object" && c && "name" in c ? c.name : "—";
}

function createdByName(exp: Expense): string {
 const u = exp.createdByUserId;
 return typeof u === "object" && u && "name" in u ? u.name : "—";
}

function approvedByName(exp: Expense): string {
 const u = exp.approvedByUserId;
 return typeof u === "object" && u && "name" in u ? u.name : "—";
}

export default function ExpensesListPage() {
 const { can } = usePermissions();
 const canView = can("expense.view");
 const canCreate = can("expense.create");
 const canEditDraft = can("expense.edit_draft");
 const canSubmit = can("expense.submit");
 const canApprove = can("expense.approve");
 const canMarkPaid = can("expense.mark_paid");
 const canVoid = can("expense.void");
 const canDelete = can("expense.delete") || can("expense.edit_draft");

 const {
 expenses,
 categories,
 pagination,
 loading,
 message,
 setMessage,
 filters,
 setFilter,
 setPage,
 refresh,
 deleteModalOpen,
 expenseToDelete,
 openDeleteModal,
 closeDeleteModal,
 deleteExpense,
 deleteLoading,
 } = useExpensesList();

 if (!canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to view expenses.</p>
 </div>
 );
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col gap-3 @[640px]:gap-4 @[640px]:flex-row @[640px]:items-center @[640px]:justify-between">
 <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900">Expenses</h1>
  <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500 mt-0.5">List and manage expenses. Draft → Submit → Approve → Paid.</p>
 </div>
 {canCreate && (
  <Link
  href="/expenses-list/add"
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 rounded-xl bg-blue-600 text-white text-xs @[640px]:text-sm font-medium hover:bg-blue-700"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  Add expense
  </Link>
 )}
 </div>

 {message && (
 <div
  className={`mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-lg text-xs @[640px]:text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
 >
  {message.text}
  <button type="button" onClick={() => setMessage(null)} className="ml-2 underline">Dismiss</button>
 </div>
 )}

 <div className="mb-3 @[640px]:mb-4 flex flex-wrap gap-2 @[640px]:gap-3 items-center">
 <input
  type="datetime-local"
  value={filters.fromUtc ? new Date(filters.fromUtc).toISOString().slice(0, 16) : ""}
  onChange={(e) => setFilter("fromUtc", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 />
 <input
  type="datetime-local"
  value={filters.toUtc ? new Date(filters.toUtc).toISOString().slice(0, 16) : ""}
  onChange={(e) => setFilter("toUtc", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 />
 <select
  value={filters.categoryId ?? ""}
  onChange={(e) => setFilter("categoryId", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All categories</option>
  {categories.filter((c) => c.isActive).map((c) => (
  <option key={c._id} value={c._id}>{c.name}</option>
  ))}
 </select>
 <select
  value={filters.status ?? ""}
  onChange={(e) => setFilter("status", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All statuses</option>
  {STATUSES.map((s) => (
  <option key={s} value={s}>{s}</option>
  ))}
 </select>
 <select
  value={filters.paymentMethod ?? ""}
  onChange={(e) => setFilter("paymentMethod", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm"
 >
  <option value="">All payment methods</option>
  {PAYMENT_METHODS.map((m) => (
  <option key={m} value={m}>{m}</option>
  ))}
 </select>
 <input
  type="text"
  placeholder="Search reference / notes / vendor"
  value={filters.search ?? ""}
  onChange={(e) => setFilter("search", e.target.value || undefined)}
  className="rounded-lg border border-gray-300 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm w-40 @[640px]:w-48"
 />
 <button type="button" onClick={refresh} className="px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 rounded-lg border border-gray-300 bg-white text-xs @[640px]:text-sm hover:bg-gray-50">
  Refresh
 </button>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Date/Time</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Category</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Vendor</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Gross</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Payment</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Status</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Created by</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Approved by</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Reference</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-center text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Attach</th>
  <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {loading ? (
  <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500 text-xs @[640px]:text-sm">Loading…</td></tr>
  ) : (
  expenses.map((exp) => (
   <tr key={exp._id} className="hover:bg-gray-50">
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-900 whitespace-nowrap">{formatDateTimeLondon(exp.occurredAtUtc)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-700">{categoryName(exp)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{exp.vendorName || "—"}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-right font-medium">{formatCurrency(exp.amountGross)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{exp.paymentMethod}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3">
   <span className={`inline-flex px-2 py-0.5 text-[10px] @[640px]:text-xs font-medium rounded-full ${
   exp.status === "Paid" ? "bg-green-100 text-green-800" :
   exp.status === "Approved" ? "bg-blue-100 text-blue-800" :
   exp.status === "Submitted" ? "bg-neutral-100 text-neutral-800" :
   exp.status === "Voided" || exp.status === "Rejected" ? "bg-red-100 text-red-800" :
   "bg-gray-100 text-gray-800"
   }`}>
   {exp.status}
   </span>
   </td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{createdByName(exp)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{approvedByName(exp)}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600 font-mono">{exp.paymentReference || "—"}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-center">
   {exp.attachments && exp.attachments.length > 0 ? (
   <span title={`${exp.attachments.length} attachment(s)`}><Paperclip className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-gray-500 inline" /></span>
   ) : (
   "—"
   )}
   </td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right">
   <div className="flex items-center justify-end gap-0.5">
   <Link
    href={`/expenses-list/edit/${exp._id}`}
    className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-flex"
    title="View / Edit"
   >
    {(exp.status === "Draft" || exp.status === "Submitted") && canEditDraft ? <Pencil className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" /> : <Eye className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />}
   </Link>
   {canDelete && (exp.status === "Draft" || exp.status === "Submitted") && (
    <button
    type="button"
    onClick={() => openDeleteModal(exp)}
    className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg inline-flex"
    title="Delete"
    >
    <Trash2 className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
    </button>
   )}
   </div>
   </td>
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>
 {!loading && expenses.length === 0 && (
  <div className="p-6 @[640px]:p-8 text-center text-gray-500 text-xs @[640px]:text-sm">No expenses. Add one to get started.</div>
 )}
 <DeleteExpenseModal
  open={deleteModalOpen}
  expense={expenseToDelete}
  onClose={closeDeleteModal}
  onDelete={deleteExpense}
  isLoading={deleteLoading}
 />
 {pagination.pages > 1 && (
  <div className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 border-t border-gray-200 flex flex-col @[480px]:flex-row items-start @[480px]:items-center justify-between gap-2">
  <p className="text-xs @[640px]:text-sm text-gray-600">
  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
  </p>
  <div className="flex gap-2">
  <button
  type="button"
  onClick={() => setPage(pagination.page - 1)}
  disabled={pagination.page <= 1}
  className="px-2.5 @[640px]:px-3 py-1 rounded border border-gray-300 text-xs @[640px]:text-sm disabled:opacity-50"
  >
  Previous
  </button>
  <button
  type="button"
  onClick={() => setPage(pagination.page + 1)}
  disabled={pagination.page >= pagination.pages}
  className="px-2.5 @[640px]:px-3 py-1 rounded border border-gray-300 text-xs @[640px]:text-sm disabled:opacity-50"
  >
  Next
  </button>
  </div>
  </div>
 )}
 </div>
 </div>
 );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { expenseCategoryApi } from "./service/expenseCategoryApi";
import type { ExpenseCategory, ExpenseCategoryFormData } from "./types";
import { COST_CENTRES } from "./types";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { Plus, Pencil, Archive, RefreshCw } from "lucide-react";

const initialForm: ExpenseCategoryFormData = {
 name: "",
 code: "",
 costCentre: "General",
 defaultVatRate: 20,
 requiresAttachment: false,
 requiresManagerApproval: false,
 approvalThresholdAmount: null,
};

export default function ExpenseCategoryPage() {
 const { can } = usePermissions();
 const canView = can("expense_category.view");
 const canManage = can("expense_category.manage");
 const [list, setList] = useState<ExpenseCategory[]>([]);
 const [loading, setLoading] = useState(true);
 const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
 const [includeInactive, setIncludeInactive] = useState(false);
 const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
 const [editing, setEditing] = useState<ExpenseCategory | null>(null);
 const [form, setForm] = useState<ExpenseCategoryFormData>(initialForm);
 const [saving, setSaving] = useState(false);

 const load = useCallback(async () => {
 if (!canView) return;
 setLoading(true);
 try {
 const data = await expenseCategoryApi.getAll(includeInactive);
 setList(data);
 } catch (e) {
 setMessage({ text: e instanceof Error ? e.message : "Failed to load", type: "error" });
 } finally {
 setLoading(false);
 }
 }, [canView, includeInactive]);

 useEffect(() => {
 load();
 }, [load]);

 const openAdd = () => {
 setForm(initialForm);
 setEditing(null);
 setModalOpen("add");
 };
 const openEdit = (cat: ExpenseCategory) => {
 setForm({
 name: cat.name,
 code: cat.code ?? "",
 costCentre: cat.costCentre,
 defaultVatRate: cat.defaultVatRate,
 vatType: cat.vatType,
 requiresAttachment: cat.requiresAttachment,
 requiresManagerApproval: cat.requiresManagerApproval,
 approvalThresholdAmount: cat.approvalThresholdAmount ?? null,
 });
 setEditing(cat);
 setModalOpen("edit");
 };
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!canManage) return;
 setSaving(true);
 try {
 if (modalOpen === "add") {
 await expenseCategoryApi.create(form);
 setMessage({ text: "Category created", type: "success" });
 } else if (editing) {
 await expenseCategoryApi.update(editing._id, form);
 setMessage({ text: "Category updated", type: "success" });
 }
 setModalOpen(null);
 load();
 } catch (err) {
 setMessage({ text: err instanceof Error ? err.message : "Failed to save", type: "error" });
 } finally {
 setSaving(false);
 }
 };
 const handleSetInactive = async (cat: ExpenseCategory) => {
 if (!canManage) return;
 if (!confirm(`Set "${cat.name}" to inactive?`)) return;
 try {
 await expenseCategoryApi.setInactive(cat._id);
 setMessage({ text: "Category set inactive", type: "success" });
 load();
 } catch (err) {
 setMessage({ text: err instanceof Error ? err.message : "Failed", type: "error" });
 }
 };

 if (!canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to view expense categories.</p>
 </div>
 );
 }

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6 flex flex-col gap-3 @[640px]:gap-4 @[640px]:flex-row @[640px]:items-center @[640px]:justify-between">
 <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900">Expense Categories</h1>
  <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500 mt-0.5">Manage categories for expenses. Archive instead of delete when in use.</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
  <label className="flex items-center gap-2 text-xs @[640px]:text-sm text-gray-600">
  <input
  type="checkbox"
  checked={includeInactive}
  onChange={(e) => setIncludeInactive(e.target.checked)}
  />
  Include inactive
  </label>
  <button
  type="button"
  onClick={load}
  className="p-1.5 @[640px]:p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
  title="Refresh"
  >
  <RefreshCw className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  </button>
  {canManage && (
  <button
  type="button"
  onClick={openAdd}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 rounded-xl bg-blue-600 text-white text-xs @[640px]:text-sm font-medium hover:bg-blue-700"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  Add category
  </button>
  )}
 </div>
 </div>

 {message && (
 <div
  className={`mb-3 @[640px]:mb-4 p-3 @[640px]:p-4 rounded-lg text-xs @[640px]:text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
 >
  {message.text}
 </div>
 )}

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 {loading ? (
  <div className="p-6 @[640px]:p-8 text-center text-gray-500 text-xs @[640px]:text-sm">Loading…</div>
 ) : (
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Name</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Code</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Cost centre</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">VAT %</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Attachment</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Approval</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Active</th>
   <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Updated</th>
   {canManage && <th className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase">Actions</th>}
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {list.map((cat) => (
   <tr key={cat._id} className="hover:bg-gray-50">
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-medium text-gray-900">{cat.name}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600 font-mono">{cat.code || "—"}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{cat.costCentre}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{cat.defaultVatRate}%</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm">{cat.requiresAttachment ? "Yes" : "—"}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm">
   {cat.requiresManagerApproval ? "Yes" : cat.approvalThresholdAmount != null ? `> £${cat.approvalThresholdAmount}` : "—"}
   </td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3">
   <span className={`inline-flex px-2 py-0.5 text-[10px] @[640px]:text-xs font-medium rounded-full ${cat.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
   {cat.isActive ? "Active" : "Inactive"}
   </span>
   </td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-500">{cat.updatedAt ? formatDateTimeLondon(cat.updatedAt) : "—"}</td>
   {canManage && (
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-right">
   {cat.isActive && (
    <>
    <button
    type="button"
    onClick={() => openEdit(cat)}
    className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
    title="Edit"
    >
    <Pencil className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
    </button>
    <button
    type="button"
    onClick={() => handleSetInactive(cat)}
    className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg"
    title="Set inactive"
    >
    <Archive className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
    </button>
    </>
   )}
   </td>
   )}
   </tr>
  ))}
  </tbody>
  </table>
  </div>
 )}
 {!loading && list.length === 0 && (
  <div className="p-6 @[640px]:p-8 text-center text-gray-500 text-xs @[640px]:text-sm">No categories. Run seed to add defaults, or add one.</div>
 )}
 </div>

 {modalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
  <div className="@container bg-white rounded-xl shadow-xl w-full max-w-md">
  <div className="px-4 @[480px]:px-6 py-3 @[480px]:py-4 border-b border-gray-200">
  <h2 className="text-base @[480px]:text-lg font-semibold text-gray-900">{modalOpen === "add" ? "Add category" : "Edit category"}</h2>
  </div>
  <form onSubmit={handleSubmit} className="p-4 @[480px]:p-6 space-y-3 @[480px]:space-y-4">
  <div>
  <label className="block text-xs @[480px]:text-sm font-medium text-gray-700 mb-1">Name *</label>
  <input
   type="text"
   value={form.name}
   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[480px]:text-sm"
   required
  />
  </div>
  <div>
  <label className="block text-xs @[480px]:text-sm font-medium text-gray-700 mb-1">Code</label>
  <input
   type="text"
   value={form.code ?? ""}
   onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[480px]:text-sm"
  />
  </div>
  <div>
  <label className="block text-xs @[480px]:text-sm font-medium text-gray-700 mb-1">Cost centre</label>
  <select
   value={form.costCentre}
   onChange={(e) => setForm((f) => ({ ...f, costCentre: e.target.value as ExpenseCategoryFormData["costCentre"] }))}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[480px]:text-sm"
  >
   {COST_CENTRES.map((c) => (
   <option key={c} value={c}>{c}</option>
   ))}
  </select>
  </div>
  <div>
  <label className="block text-xs @[480px]:text-sm font-medium text-gray-700 mb-1">Default VAT %</label>
  <input
   type="number"
   min={0}
   max={100}
   value={form.defaultVatRate}
   onChange={(e) => setForm((f) => ({ ...f, defaultVatRate: Number(e.target.value) || 0 }))}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[480px]:text-sm"
  />
  </div>
  <div className="flex items-center gap-2">
  <input
   type="checkbox"
   id="reqAtt"
   checked={form.requiresAttachment}
   onChange={(e) => setForm((f) => ({ ...f, requiresAttachment: e.target.checked }))}
  />
  <label htmlFor="reqAtt" className="text-xs @[480px]:text-sm text-gray-700">Requires attachment</label>
  </div>
  <div className="flex items-center gap-2">
  <input
   type="checkbox"
   id="reqApproval"
   checked={form.requiresManagerApproval}
   onChange={(e) => setForm((f) => ({ ...f, requiresManagerApproval: e.target.checked }))}
  />
  <label htmlFor="reqApproval" className="text-xs @[480px]:text-sm text-gray-700">Requires manager approval</label>
  </div>
  <div>
  <label className="block text-xs @[480px]:text-sm font-medium text-gray-700 mb-1">Approval threshold (£)</label>
  <input
   type="number"
   min={0}
   step={0.01}
   value={form.approvalThresholdAmount ?? ""}
   onChange={(e) => setForm((f) => ({ ...f, approvalThresholdAmount: e.target.value === "" ? null : Number(e.target.value) }))}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[480px]:text-sm"
  />
  </div>
  <div className="flex justify-end gap-2 pt-3 @[480px]:pt-4">
  <button type="button" onClick={() => setModalOpen(null)} className="px-3 @[480px]:px-4 py-1.5 @[480px]:py-2 text-xs @[480px]:text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
   Cancel
  </button>
  <button type="submit" disabled={saving} className="px-3 @[480px]:px-4 py-1.5 @[480px]:py-2 text-xs @[480px]:text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
   {saving ? "Saving…" : modalOpen === "add" ? "Create" : "Save"}
  </button>
  </div>
  </form>
  </div>
 </div>
 )}
 </div>
 );
}

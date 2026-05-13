"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { expenseApi } from "../../service/expenseApi";
import { expenseCategoryApi } from "../../../expense-category/service/expenseCategoryApi";
import type { Expense, ExpenseFormData, ExpenseStatus, PaymentMethod } from "../../types";
import type { ExpenseCategory } from "../../../expense-category/types";
import { PAYMENT_METHODS, STATUSES } from "../../types";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { ArrowLeft, Send, Check, X, Banknote, Trash2, Pencil } from "lucide-react";

function round2(n: number): number {
 return Math.round(n * 100) / 100;
}

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function categoryName(exp: Expense): string {
 const c = exp.categoryId;
 return typeof c === "object" && c && "name" in c ? c.name : "—";
}

export default function EditExpensePage() {
 const params = useParams();
 const router = useRouter();
 const id = params.id as string;
 const { can } = usePermissions();
 const [expense, setExpense] = useState<Expense | null>(null);
 const [categories, setCategories] = useState<ExpenseCategory[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [message, setMessage] = useState<string | null>(null);
 const [rejectReason, setRejectReason] = useState("");
 const [voidReason, setVoidReason] = useState("");
 const [showRejectModal, setShowRejectModal] = useState(false);
 const [showVoidModal, setShowVoidModal] = useState(false);
 const [form, setForm] = useState<ExpenseFormData | null>(null);
 const [editing, setEditing] = useState(false);

 const canEdit = expense && (expense.status === "Draft" || expense.status === "Submitted") && can("expense.edit_draft");
 const canSubmit = expense?.status === "Draft" && can("expense.submit");
 const canApprove = expense?.status === "Submitted" && can("expense.approve");
 const canMarkPaid = expense?.status === "Approved" && can("expense.mark_paid");
 const canVoid = expense && expense.status !== "Voided" && can("expense.void");

 const load = async () => {
 if (!id) return;
 setLoading(true);
 try {
 const [exp, cats] = await Promise.all([
 expenseApi.getById(id),
 expenseCategoryApi.getAll(true),
 ]);
 setExpense(exp);
 setCategories(cats);
 setForm({
 occurredAtUtc: exp.occurredAtUtc ? new Date(exp.occurredAtUtc).toISOString().slice(0, 19) : "",
 vendorName: exp.vendorName ?? "",
 categoryId: typeof exp.categoryId === "object" && exp.categoryId ? (exp.categoryId as { _id: string })._id : exp.categoryId,
 description: exp.description ?? "",
 notes: exp.notes ?? "",
 amountNet: exp.amountNet,
 vatAmount: exp.vatAmount,
 amountGross: exp.amountGross,
 vatRate: exp.vatRate ?? 20,
 paymentMethod: exp.paymentMethod,
 paymentReference: exp.paymentReference ?? "",
 });
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 load();
 }, [id]);

 const recalcFromNetAndRate = (net: number, rate: number) => {
 if (!form) return;
 const n = round2(net);
 const v = round2(n * (rate / 100));
 setForm((f) => f ? { ...f, amountNet: n, vatAmount: v, amountGross: round2(n + v), vatRate: rate } : null);
 };

 const handleSave = async () => {
 if (!form || !expense || !canEdit) return;
 const net = round2(form.amountNet);
 const vat = round2(form.vatAmount);
 const gross = round2(form.amountGross);
 if (Math.abs(gross - (net + vat)) > 0.01) {
 setError("Gross must equal Net + VAT");
 return;
 }
 setSaving(true);
 setError(null);
 try {
 const updated = await expenseApi.update(expense._id, {
 ...form,
 amountNet: net,
 vatAmount: vat,
 amountGross: gross,
 occurredAtUtc: new Date(form.occurredAtUtc).toISOString(),
 });
 setExpense(updated);
 setEditing(false);
 setMessage("Saved");
 setTimeout(() => setMessage(null), 2000);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to save");
 } finally {
 setSaving(false);
 }
 };

 const handleSubmit = async () => {
 if (!expense || !canSubmit) return;
 setSaving(true);
 try {
 const updated = await expenseApi.submit(expense._id);
 setExpense(updated);
 setMessage("Submitted");
 setTimeout(() => setMessage(null), 2000);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to submit");
 } finally {
 setSaving(false);
 }
 };

 const handleApprove = async () => {
 if (!expense || !canApprove) return;
 setSaving(true);
 try {
 const updated = await expenseApi.approve(expense._id);
 setExpense(updated);
 setMessage("Approved");
 setTimeout(() => setMessage(null), 2000);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to approve");
 } finally {
 setSaving(false);
 }
 };

 const handleReject = async () => {
 if (!expense || !canApprove) return;
 setSaving(true);
 try {
 await expenseApi.reject(expense._id, rejectReason);
 await load();
 setShowRejectModal(false);
 setRejectReason("");
 setMessage("Rejected");
 setTimeout(() => setMessage(null), 2000);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to reject");
 } finally {
 setSaving(false);
 }
 };

 const handleMarkPaid = async () => {
 if (!expense || !canMarkPaid) return;
 setSaving(true);
 try {
 const updated = await expenseApi.markPaid(expense._id);
 setExpense(updated);
 setMessage("Marked as paid");
 setTimeout(() => setMessage(null), 2000);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to mark paid");
 } finally {
 setSaving(false);
 }
 };

 const handleVoid = async () => {
 if (!expense || !canVoid || !voidReason.trim()) return;
 setSaving(true);
 try {
 await expenseApi.void(expense._id, voidReason.trim());
 await load();
 setShowVoidModal(false);
 setVoidReason("");
 setMessage("Voided");
 setTimeout(() => setMessage(null), 2000);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to void");
 } finally {
 setSaving(false);
 }
 };

 if (loading || !expense) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-red-600">{error || "Not found"}</p>}
 <Link href="/expenses-list" className="text-blue-600 mt-2 inline-block">Back to list</Link>
 </div>
 );
 }

 const statusColor: Record<ExpenseStatus, string> = {
 Draft: "bg-gray-100 text-gray-800",
 Submitted: "bg-neutral-100 text-neutral-800",
 Approved: "bg-blue-100 text-blue-800",
 Paid: "bg-green-100 text-green-800",
 Rejected: "bg-red-100 text-red-800",
 Voided: "bg-red-100 text-red-800",
 };

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="max-w-2xl mx-auto">
 <Link href="/expenses-list" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
  <ArrowLeft className="h-4 w-4" />
  Back to list
 </Link>

 <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-gray-900">Expense</h1>
  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColor[expense.status]}`}>
  {expense.status}
  </span>
 </div>

 {message && <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700">{message}</div>}
 {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">{error}</div>}

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
  {editing && canEdit && form ? (
  <>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Date / time</label>
  <input
   type="datetime-local"
   value={form.occurredAtUtc}
   onChange={(e) => setForm((f) => f ? { ...f, occurredAtUtc: e.target.value } : null)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
  <select
   value={form.categoryId}
   onChange={(e) => {
   const cat = categories.find((c) => c._id === e.target.value);
   setForm((f) => f ? { ...f, categoryId: e.target.value, vatRate: cat?.defaultVatRate ?? 20 } : null);
   if (cat) recalcFromNetAndRate(form.amountNet, cat.defaultVatRate);
   }}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
  >
   {categories.filter((c) => c.isActive).map((c) => (
   <option key={c._id} value={c._id}>{c.name}</option>
   ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
  <input
   type="text"
   value={form.vendorName ?? ""}
   onChange={(e) => setForm((f) => f ? { ...f, vendorName: e.target.value } : null)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
  <input
   type="text"
   value={form.description ?? ""}
   onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : null)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
  <textarea
   value={form.notes ?? ""}
   onChange={(e) => setForm((f) => f ? { ...f, notes: e.target.value } : null)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
   rows={2}
  />
  </div>
  <div className="grid grid-cols-3 gap-4">
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">Net (£)</label>
   <input
   type="number"
   step={0.01}
   value={form.amountNet ?? ""}
   onChange={(e) => recalcFromNetAndRate(Number(e.target.value) || 0, form.vatRate ?? 20)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
   />
  </div>
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
   <input
   type="number"
   value={form.vatRate ?? 20}
   onChange={(e) => recalcFromNetAndRate(form.amountNet, Number(e.target.value) || 0)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
   />
  </div>
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">Gross (£)</label>
   <input type="text" value={formatCurrency(form.amountGross ?? 0)} readOnly className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-gray-50" />
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
  <select
   value={form.paymentMethod}
   onChange={(e) => setForm((f) => f ? { ...f, paymentMethod: e.target.value as PaymentMethod } : null)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
  >
   {PAYMENT_METHODS.map((m) => (
   <option key={m} value={m}>{m}</option>
   ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Payment reference</label>
  <input
   type="text"
   value={form.paymentReference ?? ""}
   onChange={(e) => setForm((f) => f ? { ...f, paymentReference: e.target.value } : null)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div className="flex gap-2 pt-4">
  <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
   {saving ? "Saving…" : "Save"}
  </button>
  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
   Cancel
  </button>
  </div>
  </>
  ) : (
  <>
  <dl className="grid grid-cols-1 gap-3">
  <div><dt className="text-sm text-gray-500">Date / time</dt><dd className="font-medium">{formatDateTimeLondon(expense.occurredAtUtc)}</dd></div>
  <div><dt className="text-sm text-gray-500">Category</dt><dd className="font-medium">{categoryName(expense)}</dd></div>
  <div><dt className="text-sm text-gray-500">Vendor</dt><dd className="font-medium">{expense.vendorName || "—"}</dd></div>
  <div><dt className="text-sm text-gray-500">Description</dt><dd className="font-medium">{expense.description || "—"}</dd></div>
  <div><dt className="text-sm text-gray-500">Notes</dt><dd className="font-medium whitespace-pre-wrap">{expense.notes || "—"}</dd></div>
  <div><dt className="text-sm text-gray-500">Amount net</dt><dd className="font-medium">{formatCurrency(expense.amountNet)}</dd></div>
  <div><dt className="text-sm text-gray-500">VAT</dt><dd className="font-medium">{formatCurrency(expense.vatAmount)}</dd></div>
  <div><dt className="text-sm text-gray-500">Amount gross</dt><dd className="font-medium">{formatCurrency(expense.amountGross)}</dd></div>
  <div><dt className="text-sm text-gray-500">Payment method</dt><dd className="font-medium">{expense.paymentMethod}</dd></div>
  <div><dt className="text-sm text-gray-500">Payment reference</dt><dd className="font-medium font-mono">{expense.paymentReference || "—"}</dd></div>
  {expense.voidReason && <div><dt className="text-sm text-gray-500">Void reason</dt><dd className="font-medium text-red-700">{expense.voidReason}</dd></div>}
  </dl>
  <div className="flex flex-wrap gap-2 pt-4 border-t">
  {canEdit && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"><Pencil className="h-4 w-4" /> Edit</button>}
  {canSubmit && <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"><Send className="h-4 w-4" /> Submit</button>}
  {canApprove && (
   <>
   <button type="button" onClick={handleApprove} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"><Check className="h-4 w-4" /> Approve</button>
   <button type="button" onClick={() => setShowRejectModal(true)} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button>
   </>
  )}
  {canMarkPaid && <button type="button" onClick={handleMarkPaid} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"><Banknote className="h-4 w-4" /> Mark as paid</button>}
  {canVoid && <button type="button" onClick={() => setShowVoidModal(true)} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Void</button>}
  </div>
  </>
  )}
 </div>
 </div>

 {showRejectModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
  <h3 className="text-lg font-semibold mb-2">Reject expense</h3>
  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-4" rows={3} />
  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
  <button type="button" onClick={handleReject} disabled={saving} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
  </div>
  </div>
 </div>
 )}

 {showVoidModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
  <h3 className="text-lg font-semibold mb-2">Void expense</h3>
  <p className="text-sm text-gray-600 mb-2">Void reason is required.</p>
  <input type="text" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason *" className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-4" required />
  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => setShowVoidModal(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
  <button type="button" onClick={handleVoid} disabled={saving || !voidReason.trim()} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Void</button>
  </div>
  </div>
 </div>
 )}
 </div>
 );
}

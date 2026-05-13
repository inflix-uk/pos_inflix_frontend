"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { expenseApi } from "../service/expenseApi";
import { expenseCategoryApi } from "../../expense-category/service/expenseCategoryApi";
import type { ExpenseCategory } from "../../expense-category/types";
import type { ExpenseFormData, PaymentMethod } from "../types";
import { PAYMENT_METHODS } from "../types";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft } from "lucide-react";

function round2(n: number): number {
 return Math.round(n * 100) / 100;
}

export default function AddExpensePage() {
 const { can } = usePermissions();
 const router = useRouter();
 const [categories, setCategories] = useState<ExpenseCategory[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const now = new Date();
 const [form, setForm] = useState<ExpenseFormData>({
 occurredAtUtc: now.toISOString().slice(0, 19).replace("T", "T"),
 vendorName: "",
 categoryId: "",
 description: "",
 notes: "",
 amountNet: 0,
 vatAmount: 0,
 amountGross: 0,
 vatRate: 20,
 paymentMethod: "Cash",
 paymentReference: "",
 });

 useEffect(() => {
 expenseCategoryApi.getAll(true).then((data) => setCategories(data.filter((c) => c.isActive)));
 }, []);

 const recalcFromNetAndVat = (net: number, vat: number) => {
 const n = round2(net);
 const v = round2(vat);
 setForm((f) => ({ ...f, amountNet: n, vatAmount: v, amountGross: round2(n + v) }));
 };
 const recalcFromNetAndRate = (net: number, rate: number) => {
 const n = round2(net);
 const v = round2(n * (rate / 100));
 setForm((f) => ({ ...f, amountNet: n, vatAmount: v, amountGross: round2(n + v), vatRate: rate }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!can("expense.create")) return;
 const net = round2(form.amountNet);
 const vat = round2(form.vatAmount);
 const gross = round2(form.amountGross);
 if (Math.abs(gross - (net + vat)) > 0.01) {
 setError("Gross must equal Net + VAT");
 return;
 }
 if (!form.categoryId) {
 setError("Category is required");
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const created = await expenseApi.create({
 ...form,
 amountNet: net,
 vatAmount: vat,
 amountGross: gross,
 occurredAtUtc: new Date(form.occurredAtUtc).toISOString(),
 });
 router.push(`/expenses-list/edit/${created._id}`);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to create");
 } finally {
 setLoading(false);
 }
 };

 if (!can("expense.create")) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <p className="text-red-600">You do not have permission to create expenses.</p>
 <Link href="/expenses-list" className="text-blue-600 mt-2 inline-block">Back to list</Link>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="max-w-2xl mx-auto">
 <Link href="/expenses-list" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
  <ArrowLeft className="h-4 w-4" />
  Back to list
 </Link>
 <h1 className="text-2xl font-bold text-gray-900 mb-6">Add expense</h1>

 {error && (
  <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700">{error}</div>
 )}

 <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Date / time *</label>
  <input
  type="datetime-local"
  value={form.occurredAtUtc}
  onChange={(e) => setForm((f) => ({ ...f, occurredAtUtc: e.target.value }))}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
  <select
  value={form.categoryId}
  onChange={(e) => {
  const id = e.target.value;
  const cat = categories.find((c) => c._id === id);
  setForm((f) => ({ ...f, categoryId: id, vatRate: cat?.defaultVatRate ?? 20 }));
  if (cat && form.amountNet) recalcFromNetAndRate(form.amountNet, cat.defaultVatRate);
  }}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  required
  >
  <option value="">Select category</option>
  {categories.map((c) => (
  <option key={c._id} value={c._id}>{c.name} (VAT {c.defaultVatRate}%)</option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor name</label>
  <input
  type="text"
  value={form.vendorName ?? ""}
  onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
  <input
  type="text"
  value={form.description ?? ""}
  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
  <textarea
  value={form.notes ?? ""}
  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  rows={2}
  />
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Amount net (£)</label>
  <input
  type="number"
  step={0.01}
  min={0}
  value={form.amountNet || ""}
  onChange={(e) => {
   const v = Number(e.target.value) || 0;
   recalcFromNetAndRate(v, form.vatRate ?? 20);
  }}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
  <input
  type="number"
  min={0}
  max={100}
  value={form.vatRate ?? 20}
  onChange={(e) => {
   const r = Number(e.target.value) || 0;
   recalcFromNetAndRate(form.amountNet, r);
  }}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">VAT amount (£)</label>
  <input
  type="number"
  step={0.01}
  min={0}
  value={form.vatAmount ?? ""}
  onChange={(e) => recalcFromNetAndVat(form.amountNet, Number(e.target.value) || 0)}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  />
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Amount gross (£) *</label>
  <input
  type="number"
  step={0.01}
  min={0}
  value={form.amountGross ?? ""}
  readOnly
  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-gray-50"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
  <select
  value={form.paymentMethod}
  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
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
  onChange={(e) => setForm((f) => ({ ...f, paymentReference: e.target.value }))}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
  placeholder="Receipt #, bank ref, invoice ref"
  />
  </div>
  <div className="flex gap-3 pt-4">
  <button
  type="submit"
  disabled={loading}
  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
  >
  {loading ? "Creating…" : "Create expense (Draft)"}
  </button>
  <Link href="/expenses-list" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
  Cancel
  </Link>
  </div>
 </form>
 </div>
 </div>
 );
}

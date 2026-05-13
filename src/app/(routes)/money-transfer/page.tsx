"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRightLeft } from "lucide-react";
import { getPaymentAccounts, createMoneyTransfer, type PaymentAccountRow } from "./service/paymentAccountApi";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
 style: "currency",
 currency: "GBP",
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(n);
}

export default function MoneyTransferPage() {
 const [accounts, setAccounts] = useState<PaymentAccountRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [fromAccountId, setFromAccountId] = useState("");
 const [toAccountId, setToAccountId] = useState("");
 const [amount, setAmount] = useState("");
 const [fee, setFee] = useState("");
 const [notes, setNotes] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [success, setSuccess] = useState<string | null>(null);

 const load = useCallback(async () => {
 setLoading(true);
 setError(null);
 try {
 const data = await getPaymentAccounts();
 setAccounts(data);
 if (!fromAccountId && data.length > 0) setFromAccountId(data[0]._id);
 if (!toAccountId && data.length > 1) setToAccountId(data[1]._id);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load accounts");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 load();
 }, [load]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const amt = parseFloat(amount);
 if (!fromAccountId || !toAccountId || !Number.isFinite(amt) || amt <= 0) {
 setError("Please select From and To accounts and enter a valid amount.");
 return;
 }
 if (fromAccountId === toAccountId) {
 setError("From and To accounts must be different.");
 return;
 }
 const fromAcc = accounts.find((a) => a._id === fromAccountId);
 if (fromAcc && fromAcc.balance < amt + (parseFloat(fee) || 0)) {
 setError(`Insufficient balance in ${fromAcc.name}. Available: ${formatCurrency(fromAcc.balance)}`);
 return;
 }
 setSubmitting(true);
 setError(null);
 setSuccess(null);
 try {
 await createMoneyTransfer({
 fromAccountId,
 toAccountId,
 amount: amt,
 fee: fee ? parseFloat(fee) || 0 : undefined,
 notes: notes.trim() || undefined,
 });
 setSuccess("Transfer completed.");
 setAmount("");
 setFee("");
 setNotes("");
 load();
 } catch (e) {
 setError(e instanceof Error ? e.message : "Transfer failed");
 } finally {
 setSubmitting(false);
 }
 };

 const fromBalance = accounts.find((a) => a._id === fromAccountId)?.balance ?? 0;
 const toBalance = accounts.find((a) => a._id === toAccountId)?.balance ?? 0;

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-3 @[640px]:mb-4">
 <Link
  href="/reports"
  className="inline-flex items-center gap-1 text-xs @[640px]:text-sm font-medium text-gray-600 hover:text-gray-900"
 >
  <ChevronLeft className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" /> Back to Reports
 </Link>
 </div>

 <div className="mx-auto max-w-lg">
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6">
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-bold text-gray-900">Money Transfer</h1>
  <p className="mt-0.5 text-xs @[640px]:text-sm text-gray-500">
  Move money between pots (e.g. cash deposit to bank).
  </p>
 </div>

 {error && (
  <div className="mb-3 @[640px]:mb-4 rounded-lg border border-red-200 bg-red-50 px-3 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm text-red-700">
  {error}
  </div>
 )}
 {success && (
  <div className="mb-3 @[640px]:mb-4 rounded-lg border border-green-200 bg-green-50 px-3 @[640px]:px-4 py-2 @[640px]:py-3 text-xs @[640px]:text-sm text-green-700">
  {success}
  </div>
 )}

 {loading ? (
  <div className="flex justify-center py-8 @[640px]:py-10 @[768px]:py-12">
  <div className="h-8 w-8 @[640px]:h-10 @[640px]:w-10 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
  </div>
 ) : (
  <form onSubmit={handleSubmit} className="space-y-4 @[640px]:space-y-5 @[768px]:space-y-6 rounded-xl border border-gray-200 bg-white p-4 @[640px]:p-5 @[768px]:p-6 shadow-sm">
  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700">From account</label>
  <select
  value={fromAccountId}
  onChange={(e) => setFromAccountId(e.target.value)}
  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[640px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
  >
  <option value="">Select account</option>
  {accounts.map((a) => (
   <option key={a._id} value={a._id}>
   {a.name} — {formatCurrency(a.balance)}
   </option>
  ))}
  </select>
  {fromAccountId && (
  <p className="mt-1 text-[11px] @[640px]:text-xs text-gray-500">
   Balance: {formatCurrency(fromBalance)}
  </p>
  )}
  </div>

  <div className="flex justify-center">
  <ArrowRightLeft className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400" />
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700">To account</label>
  <select
  value={toAccountId}
  onChange={(e) => setToAccountId(e.target.value)}
  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[640px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
  >
  <option value="">Select account</option>
  {accounts.map((a) => (
   <option key={a._id} value={a._id}>
   {a.name} — {formatCurrency(a.balance)}
   </option>
  ))}
  </select>
  {toAccountId && (
  <p className="mt-1 text-[11px] @[640px]:text-xs text-gray-500">
   Balance: {formatCurrency(toBalance)}
  </p>
  )}
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700">Amount (£)</label>
  <input
  type="number"
  step="0.01"
  min="0"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  placeholder="0.00"
  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[640px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
  />
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700">Fee (optional)</label>
  <input
  type="number"
  step="0.01"
  min="0"
  value={fee}
  onChange={(e) => setFee(e.target.value)}
  placeholder="0.00"
  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[640px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
  />
  </div>

  <div>
  <label className="block text-xs @[640px]:text-sm font-medium text-gray-700">Notes (optional)</label>
  <input
  type="text"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  placeholder="e.g. Cash deposit"
  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs @[640px]:text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
  />
  </div>

  <button
  type="submit"
  disabled={submitting || !fromAccountId || !toAccountId || !amount || parseFloat(amount) <= 0}
  className="w-full rounded-lg bg-orange-600 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
  >
  {submitting ? "Transferring…" : "Transfer"}
  </button>
  </form>
 )}

 {!loading && accounts.length === 0 && (
  <p className="mt-3 @[640px]:mt-4 text-center text-xs @[640px]:text-sm text-gray-500">
  No payment accounts found. Run the seed script to create default pots (Receivable, Bank, Card, Cash drawer).
  </p>
 )}
 </div>
 </div>
 );
}

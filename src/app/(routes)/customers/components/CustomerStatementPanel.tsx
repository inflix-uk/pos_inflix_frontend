"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
 Loader2,
 DollarSign,
 Plus,
 FileSpreadsheet,
 FileDown,
 Pencil,
 Trash2,
 X,
} from "lucide-react";
import { accountsApi, type CustomerStatement } from "../../accounts/service/accountsApi";
import {
 downloadAccountStatementCsv,
 downloadAccountStatementPdf,
} from "@/lib/accountStatementExport";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });

const EDITABLE_TYPES = new Set(["opening_balance", "payment_in", "payment_out", "refund"]);

interface CustomerStatementPanelProps {
 customerId: string;
 customerName?: string;
 onBalanceChange?: (balance: number) => void;
 compact?: boolean;
}

export function CustomerStatementPanel({
 customerId,
 customerName,
 onBalanceChange,
 compact = false,
}: CustomerStatementPanelProps) {
 const { can } = usePermissionsContext();
 const canManageAccounts = can("accounts.payment");

 const [statement, setStatement] = useState<CustomerStatement | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [filterFrom, setFilterFrom] = useState("");
 const [filterTo, setFilterTo] = useState("");

 const [paymentModalOpen, setPaymentModalOpen] = useState(false);
 const [refundModalOpen, setRefundModalOpen] = useState(false);
 const [adjustModalOpen, setAdjustModalOpen] = useState(false);
 const [paymentAmount, setPaymentAmount] = useState("");
 const [refundAmount, setRefundAmount] = useState("");
 const [adjustAmount, setAdjustAmount] = useState("");
 const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "card">("cash");
 const [paymentNote, setPaymentNote] = useState("");
 const [adjustNote, setAdjustNote] = useState("");
 const [paymentSubmitting, setPaymentSubmitting] = useState(false);
 const [refundSubmitting, setRefundSubmitting] = useState(false);
 const [adjustSubmitting, setAdjustSubmitting] = useState(false);

 const [editEntryId, setEditEntryId] = useState<string | null>(null);
 const [editAmount, setEditAmount] = useState("");
 const [editNote, setEditNote] = useState("");
 const [editPaymentMethod, setEditPaymentMethod] = useState("");
 const [editSubmitting, setEditSubmitting] = useState(false);
 const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

 const fetchStatement = useCallback(async () => {
 if (!customerId) return;
 setLoading(true);
 setError(null);
 try {
  const params =
   filterFrom || filterTo
    ? { from: filterFrom || undefined, to: filterTo || undefined }
    : undefined;
  const res = await accountsApi.getCustomerStatement(customerId, params);
  setStatement(res.data);
  onBalanceChange?.(res.data.balance);
 } catch (e) {
  setError(e instanceof Error ? e.message : "Failed to load statement");
 } finally {
  setLoading(false);
 }
 }, [customerId, filterFrom, filterTo, onBalanceChange]);

 useEffect(() => {
 fetchStatement();
 }, [fetchStatement]);

 const balance = statement?.balance ?? 0;
 const name = statement?.customer?.name ?? customerName ?? "Customer";
 const isStoreCredit = balance < 0;
 const balanceLabel = isStoreCredit ? "Store credit" : "Amount receivable";
 const balanceDisplay = isStoreCredit ? Math.abs(balance) : balance;
 const displayAmount = (amount: number) => -amount;
 const statementLines = statement?.lines ?? [];
 const periodDescription =
  filterFrom || filterTo ? `${filterFrom || "…"} → ${filterTo || "…"}` : "Full history";
 const exportBalanceText = `${formatMoney(balanceDisplay)}${isStoreCredit ? " (credit)" : ""}`;

 const handleRecordPayment = async (e: React.FormEvent) => {
  e.preventDefault();
  const amount = Number(paymentAmount);
  if (!customerId || amount <= 0) return;
  setPaymentSubmitting(true);
  setError(null);
  try {
   await accountsApi.recordCustomerPayment({
    customerId,
    amount,
    paymentMethod,
    note: paymentNote || undefined,
   });
   setPaymentModalOpen(false);
   setPaymentAmount("");
   setPaymentNote("");
   fetchStatement();
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to record payment");
  } finally {
   setPaymentSubmitting(false);
  }
 };

 const handleRecordRefund = async (e: React.FormEvent) => {
  e.preventDefault();
  const amount = Number(refundAmount);
  if (!customerId || amount <= 0) return;
  setRefundSubmitting(true);
  setError(null);
  try {
   await accountsApi.recordCustomerRefund({
    customerId,
    amount,
    paymentMethod,
    note: paymentNote || undefined,
   });
   setRefundModalOpen(false);
   setRefundAmount("");
   setPaymentNote("");
   fetchStatement();
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to record refund");
  } finally {
   setRefundSubmitting(false);
  }
 };

 const handleAdjustBalance = async (e: React.FormEvent) => {
  e.preventDefault();
  const amount = Number(adjustAmount);
  if (!customerId || amount <= 0) return;
  setAdjustSubmitting(true);
  setError(null);
  try {
   await accountsApi.recordBalanceAdjustment({
    accountType: "customer",
    accountId: customerId,
    amount,
    direction: "add",
    note: adjustNote || undefined,
   });
   setAdjustModalOpen(false);
   setAdjustAmount("");
   setAdjustNote("");
   fetchStatement();
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to adjust balance");
  } finally {
   setAdjustSubmitting(false);
  }
 };

 const openEditEntry = (line: {
  _id: string;
  amount: number;
  note?: string;
  paymentMethod?: string;
  type: string;
 }) => {
  if (!EDITABLE_TYPES.has(line.type)) return;
  setEditEntryId(line._id);
  setEditAmount(String(Math.abs(Number(line.amount) || 0)));
  setEditNote(line.note || "");
  setEditPaymentMethod(line.paymentMethod || "");
  setError(null);
 };

 const handleEditEntry = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editEntryId) return;
  const amount = Number(editAmount);
  if (!(amount > 0)) return;
  setEditSubmitting(true);
  setError(null);
  try {
   await accountsApi.updateLedgerEntry(editEntryId, {
    amount,
    note: editNote,
    paymentMethod: editPaymentMethod || undefined,
   });
   setEditEntryId(null);
   fetchStatement();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to update entry");
  } finally {
   setEditSubmitting(false);
  }
 };

 const handleDeleteEntry = async (entryId: string) => {
  if (!confirm("Delete this ledger entry? The account balance will be reversed.")) return;
  setDeletingEntryId(entryId);
  setError(null);
  try {
   await accountsApi.deleteLedgerEntry(entryId);
   fetchStatement();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to delete entry");
  } finally {
   setDeletingEntryId(null);
  }
 };

 const handleExportCsv = () => {
  if (!statement) return;
  downloadAccountStatementCsv({
   accountTypeLabel: "Customer",
   accountName: name,
   balanceLabel,
   balanceFormatted: exportBalanceText,
   periodDescription,
   lines: statementLines,
   formatDate,
   displayAmount,
   formatMoney,
  });
 };

 const handleExportPdf = () => {
  if (!statement) return;
  downloadAccountStatementPdf({
   accountTypeLabel: "Customer",
   accountName: name,
   balanceLabel,
   balanceFormatted: exportBalanceText,
   periodDescription,
   lines: statementLines,
   formatDate,
   displayAmount,
   formatMoney,
  });
 };

 return (
  <div className="space-y-4">
   <div className={`flex flex-wrap gap-3 items-end ${compact ? "" : "bg-white rounded-lg border border-gray-200 p-4"}`}>
    <div>
     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
     <input
      type="date"
      value={filterFrom}
      onChange={(e) => setFilterFrom(e.target.value)}
      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
     />
    </div>
    <div>
     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
     <input
      type="date"
      value={filterTo}
      onChange={(e) => setFilterTo(e.target.value)}
      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
     />
    </div>
    {(filterFrom || filterTo) && (
     <button
      type="button"
      onClick={() => {
       setFilterFrom("");
       setFilterTo("");
      }}
      className="py-2 text-sm text-gray-600 hover:text-orange-600"
     >
      Clear dates
     </button>
    )}
   </div>

   {error && (
    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
   )}

   {loading && !statement ? (
    <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
     <Loader2 className="h-5 w-5 animate-spin" />
     Loading statement…
    </div>
   ) : statement ? (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
     {loading && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
       <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
     )}
     <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-between gap-3">
      <div>
       <h3 className="font-semibold text-gray-900">{name}</h3>
       <p className="text-xs text-gray-500">Account statement · {periodDescription}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
       <button
        type="button"
        onClick={handleExportCsv}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50"
       >
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
        CSV
       </button>
       <button
        type="button"
        onClick={handleExportPdf}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50"
       >
        <FileDown className="h-3.5 w-3.5 text-red-600" />
        PDF
       </button>
       <div className="text-right px-2">
        <p className="text-[10px] text-gray-500 uppercase">{balanceLabel}</p>
        <p className={`text-lg font-bold ${isStoreCredit ? "text-blue-700" : "text-emerald-700"}`}>
         {formatMoney(balanceDisplay)}
         {isStoreCredit && " (credit)"}
        </p>
       </div>
       {canManageAccounts && (
        <>
         <button
          type="button"
          onClick={() => setAdjustModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 flex items-center gap-1"
         >
          <Plus className="h-3.5 w-3.5" />
          Add balance
         </button>
         {balance > 0 && (
          <button
           type="button"
           onClick={() => setPaymentModalOpen(true)}
           className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 flex items-center gap-1"
          >
           <DollarSign className="h-3.5 w-3.5" />
           Record payment
          </button>
         )}
         {balance < 0 && (
          <button
           type="button"
           onClick={() => setRefundModalOpen(true)}
           className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-semibold hover:bg-gray-700 flex items-center gap-1"
          >
           <DollarSign className="h-3.5 w-3.5" />
           Refund credit
          </button>
         )}
        </>
       )}
      </div>
     </div>
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
         <th className="text-left py-2.5 px-3 font-medium text-gray-700">Date</th>
         <th className="text-left py-2.5 px-3 font-medium text-gray-700">Type</th>
         <th className="text-left py-2.5 px-3 font-medium text-gray-700">Reference</th>
         <th className="text-left py-2.5 px-3 font-medium text-gray-700">Notes</th>
         <th className="text-right py-2.5 px-3 font-medium text-gray-700">Amount</th>
         {canManageAccounts && (
          <th className="text-right py-2.5 px-3 font-medium text-gray-700 w-20">Actions</th>
         )}
        </tr>
       </thead>
       <tbody>
        {statementLines.length === 0 ? (
         <tr>
          <td colSpan={canManageAccounts ? 6 : 5} className="py-8 text-center text-gray-500">
           No ledger entries for this period.
          </td>
         </tr>
        ) : (
         statementLines.map((line) => {
          const amt = displayAmount(line.amount);
          return (
           <tr key={line._id} className="border-b border-gray-100">
            <td className="py-2.5 px-3 text-gray-600">{formatDate(line.date)}</td>
            <td className="py-2.5 px-3 capitalize">
             {line.type.replace("_", " ")}
             {line.paymentMethod && (
              <span className="ml-1 text-gray-500 text-xs">({line.paymentMethod})</span>
             )}
            </td>
            <td className="py-2.5 px-3 text-gray-700">{line.referenceLabel || "—"}</td>
            <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{line.note?.trim() || "—"}</td>
            <td className="py-2.5 px-3 text-right font-medium">
             <span className={amt >= 0 ? "text-emerald-600" : "text-gray-600"}>
              {amt >= 0 ? "+" : ""}
              {formatMoney(amt)}
             </span>
            </td>
            {canManageAccounts && (
             <td className="py-2.5 px-3 text-right">
              {EDITABLE_TYPES.has(line.type) ? (
               <div className="inline-flex gap-1">
                <button
                 type="button"
                 onClick={() => openEditEntry(line)}
                 className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                >
                 <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                 type="button"
                 onClick={() => handleDeleteEntry(line._id)}
                 disabled={deletingEntryId === line._id}
                 className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                 {deletingEntryId === line._id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                 ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                 )}
                </button>
               </div>
              ) : (
               <span className="text-gray-400">—</span>
              )}
             </td>
            )}
           </tr>
          );
         })
        )}
       </tbody>
      </table>
     </div>
    </div>
   ) : null}

   {!compact && can("accounts.view") && (
    <p className="text-xs text-gray-500">
     Full account tools also available on{" "}
     <Link href="/account-statement" className="text-orange-600 hover:underline">
      Account Statement
     </Link>
     .
    </p>
   )}

   {paymentModalOpen && (
    <Modal title="Record payment" onClose={() => setPaymentModalOpen(false)}>
     <form onSubmit={handleRecordPayment} className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
       <input
        type="number"
        step="0.01"
        min="0.01"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
        required
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
       <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank" | "card")}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
       >
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="bank">Bank</option>
       </select>
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
       <input
        type="text"
        value={paymentNote}
        onChange={(e) => setPaymentNote(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
       />
      </div>
      <ModalActions onCancel={() => setPaymentModalOpen(false)} submitting={paymentSubmitting} submitLabel="Record payment" />
     </form>
    </Modal>
   )}

   {refundModalOpen && (
    <Modal title="Refund store credit" onClose={() => setRefundModalOpen(false)}>
     <form onSubmit={handleRecordRefund} className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
       <input
        type="number"
        step="0.01"
        min="0.01"
        value={refundAmount}
        onChange={(e) => setRefundAmount(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
        required
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
       <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank" | "card")}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
       >
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="bank">Bank</option>
       </select>
      </div>
      <ModalActions onCancel={() => setRefundModalOpen(false)} submitting={refundSubmitting} submitLabel="Record refund" />
     </form>
    </Modal>
   )}

   {adjustModalOpen && (
    <Modal title="Add balance" onClose={() => setAdjustModalOpen(false)}>
     <form onSubmit={handleAdjustBalance} className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
       <input
        type="number"
        step="0.01"
        min="0.01"
        value={adjustAmount}
        onChange={(e) => setAdjustAmount(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
        required
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
       <input
        type="text"
        value={adjustNote}
        onChange={(e) => setAdjustNote(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
       />
      </div>
      <ModalActions onCancel={() => setAdjustModalOpen(false)} submitting={adjustSubmitting} submitLabel="Add balance" />
     </form>
    </Modal>
   )}

   {editEntryId && (
    <Modal title="Edit ledger entry" onClose={() => setEditEntryId(null)}>
     <form onSubmit={handleEditEntry} className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
       <input
        type="number"
        step="0.01"
        min="0.01"
        value={editAmount}
        onChange={(e) => setEditAmount(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
        required
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
       <input
        type="text"
        value={editNote}
        onChange={(e) => setEditNote(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2"
       />
      </div>
      <ModalActions onCancel={() => setEditEntryId(null)} submitting={editSubmitting} submitLabel="Save" />
     </form>
    </Modal>
   )}
  </div>
 );
}

function Modal({
 title,
 onClose,
 children,
}: {
 title: string;
 onClose: () => void;
 children: React.ReactNode;
}) {
 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
   <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
    <div className="flex items-center justify-between mb-4">
     <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
     <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
      <X className="h-5 w-5 text-gray-500" />
     </button>
    </div>
    {children}
   </div>
  </div>
 );
}

function ModalActions({
 onCancel,
 submitting,
 submitLabel,
}: {
 onCancel: () => void;
 submitting: boolean;
 submitLabel: string;
}) {
 return (
  <div className="flex justify-end gap-2 pt-2">
   <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
    Cancel
   </button>
   <button
    type="submit"
    disabled={submitting}
    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
   >
    {submitting ? "Saving…" : submitLabel}
   </button>
  </div>
 );
}

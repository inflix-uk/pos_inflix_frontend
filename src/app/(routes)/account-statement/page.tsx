"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
 FileText,
 Loader2,
 DollarSign,
 X,
 Search,
 FileSpreadsheet,
 FileDown,
 Mail,
 Plus,
 Pencil,
 Trash2,
} from "lucide-react";
import { accountsApi, type CustomerStatement, type SupplierStatement } from "../accounts/service/accountsApi";
import {
 downloadAccountStatementCsv,
 downloadAccountStatementPdf,
 getAccountStatementPdfBase64,
} from "@/lib/accountStatementExport";
import { customerApi } from "../peoples/customers/service";
import { supplierApi } from "../peoples/suppliers/service";
import type { Customer } from "../peoples/customers/types";
import type { Supplier } from "../peoples/suppliers/types";
import { formatSupplierDisplay } from "@/lib/formatSupplierDisplay";

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

type AccountType = "customer" | "supplier";

export default function AccountStatementPage() {
 const [accountType, setAccountType] = useState<AccountType>("customer");
 const [customerId, setCustomerId] = useState("");
 const [supplierId, setSupplierId] = useState("");
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [customerStatement, setCustomerStatement] = useState<CustomerStatement | null>(null);
 const [supplierStatement, setSupplierStatement] = useState<SupplierStatement | null>(null);
 const [loading, setLoading] = useState(false);
 const [loadingList, setLoadingList] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [paymentModalOpen, setPaymentModalOpen] = useState(false);
 const [refundModalOpen, setRefundModalOpen] = useState(false);
 const [supplierPaymentModalOpen, setSupplierPaymentModalOpen] = useState(false);
 const [paymentAmount, setPaymentAmount] = useState("");
 const [refundAmount, setRefundAmount] = useState("");
 const [supplierPaymentAmount, setSupplierPaymentAmount] = useState("");
 const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "card">("cash");
 const [paymentNote, setPaymentNote] = useState("");
 const [paymentSubmitting, setPaymentSubmitting] = useState(false);
 const [refundSubmitting, setRefundSubmitting] = useState(false);
 const [supplierPaymentSubmitting, setSupplierPaymentSubmitting] = useState(false);
 const [filterFrom, setFilterFrom] = useState("");
 const [filterTo, setFilterTo] = useState("");
 const [searchQuery, setSearchQuery] = useState("");
 const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
 const accountSearchRef = useRef<HTMLDivElement>(null);
 const [editEntryId, setEditEntryId] = useState<string | null>(null);
 const [editAmount, setEditAmount] = useState("");
 const [editNote, setEditNote] = useState("");
 const [editPaymentMethod, setEditPaymentMethod] = useState("");
 const [editSubmitting, setEditSubmitting] = useState(false);
 const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
 const [adjustModalOpen, setAdjustModalOpen] = useState(false);
 const [adjustAmount, setAdjustAmount] = useState("");
 const [adjustNote, setAdjustNote] = useState("");
 const [adjustSubmitting, setAdjustSubmitting] = useState(false);
 const [emailPdfModalOpen, setEmailPdfModalOpen] = useState(false);
 const [emailPdfTo, setEmailPdfTo] = useState("");
 const [emailPdfSending, setEmailPdfSending] = useState(false);
 const [sendNotice, setSendNotice] = useState<string | null>(null);

 const filterBySearch = <T extends { name: string; phone?: string; email?: string; contactPerson?: string; contactName?: string }>(
 q: string,
 list: T[],
 ): T[] => {
 const term = (q || "").trim().toLowerCase();
 if (!term) return list;
 return list.filter(
 (c) =>
 (c.name || "").toLowerCase().includes(term) ||
 (c.phone || "").toLowerCase().includes(term) ||
 (c.email || "").toLowerCase().includes(term) ||
 (c.contactPerson || "").toLowerCase().includes(term) ||
 (c.contactName || "").toLowerCase().includes(term)
 );
 };

 const formatCustomerLabel = (c: Customer): string => {
 const name = (c.name || "").trim();
 const contact = (c.contactName || "").trim();
 if (!contact || contact === name) return name;
 return `${name} · ${contact}`;
 };

 const filteredCustomers = useMemo(() => filterBySearch(searchQuery, customers), [searchQuery, customers]);
 const filteredSuppliers = useMemo(() => filterBySearch(searchQuery, suppliers), [searchQuery, suppliers]);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (accountSearchRef.current && !accountSearchRef.current.contains(e.target as Node)) {
 setAccountDropdownOpen(false);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const loadLists = useCallback(async () => {
 setLoadingList(true);
 try {
 const [custRes, supRes] = await Promise.all([
 customerApi.getAll({ limit: 2000 }),
 supplierApi.getSuppliers({ limit: 2000 }),
 ]);
 setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
 setSuppliers(Array.isArray((supRes as { data?: Supplier[] }).data) ? (supRes as { data: Supplier[] }).data : []);
 } finally {
 setLoadingList(false);
 }
 }, []);

 useEffect(() => {
 loadLists();
 }, [loadLists]);

 useEffect(() => {
 if (!emailPdfModalOpen) return;
 const prefill =
 accountType === "customer"
 ? customers.find((c) => c._id === customerId)?.email?.trim() ?? ""
 : suppliers.find((s) => s._id === supplierId)?.email?.trim() ?? "";
 setEmailPdfTo(prefill);
 }, [emailPdfModalOpen, accountType, customerId, supplierId, customers, suppliers]);

 const fetchStatement = useCallback(async () => {
 const params =
 filterFrom || filterTo
 ? { from: filterFrom || undefined, to: filterTo || undefined }
 : undefined;
 if (accountType === "customer" && customerId) {
 setLoading(true);
 setError(null);
 try {
 const res = await accountsApi.getCustomerStatement(customerId, params);
 setCustomerStatement(res.data);
 setSupplierStatement(null);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load statement");
 } finally {
 setLoading(false);
 }
 } else if (accountType === "supplier" && supplierId) {
 setLoading(true);
 setError(null);
 try {
 const res = await accountsApi.getSupplierStatement(supplierId, params);
 setSupplierStatement(res.data);
 setCustomerStatement(null);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load statement");
 } finally {
 setLoading(false);
 }
 } else {
 setCustomerStatement(null);
 setSupplierStatement(null);
 }
 }, [accountType, customerId, supplierId, filterFrom, filterTo]);

 useEffect(() => {
 fetchStatement();
 }, [fetchStatement]);

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

 const handleRecordSupplierPayment = async (e: React.FormEvent) => {
 e.preventDefault();
 const amount = Number(supplierPaymentAmount);
 if (!supplierId || amount <= 0) return;
 setSupplierPaymentSubmitting(true);
 setError(null);
 try {
 await accountsApi.recordSupplierPayment({
 supplierId,
 amount,
 paymentMethod,
 note: paymentNote || undefined,
 });
 setSupplierPaymentModalOpen(false);
 setSupplierPaymentAmount("");
 setPaymentNote("");
 fetchStatement();
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to record payment");
 } finally {
 setSupplierPaymentSubmitting(false);
 }
 };

 const EDITABLE_TYPES = new Set(["opening_balance", "payment_in", "payment_out", "refund"]);

 const openEditEntry = (line: { _id: string; amount: number; note?: string; paymentMethod?: string; type: string }) => {
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

 const handleAdjustBalance = async (e: React.FormEvent) => {
 e.preventDefault();
 const amount = Number(adjustAmount);
 const accountId = accountType === "customer" ? customerId : supplierId;
 if (!accountId || amount <= 0) return;
 setAdjustSubmitting(true);
 setError(null);
 try {
  await accountsApi.recordBalanceAdjustment({
  accountType,
  accountId,
  amount,
  direction: "add",
  note: adjustNote || undefined,
  });
  setAdjustModalOpen(false);
  setAdjustAmount("");
  setAdjustNote("");
  fetchStatement();
 } catch (err) {
  setError(err instanceof Error ? err.message : "Failed to adjust balance");
 } finally {
  setAdjustSubmitting(false);
 }
 };

 const statement = customerStatement || supplierStatement;
 const balance = customerStatement?.balance ?? supplierStatement?.balance ?? 0;
 const name =
 customerStatement?.customer?.name ??
 (supplierStatement?.supplier
 ? supplierStatement.supplier.displayLabel?.trim() || formatSupplierDisplay(supplierStatement.supplier)
 : "");

 // Business view: Sale/Purchase = out (-), Payment in/out = in (+). Flip ledger amount for display.
 const displayAmount = (amount: number) => -amount;
 const isStoreCredit = accountType === "customer" && balance < 0;
 const balanceLabel =
 accountType === "customer"
 ? isStoreCredit
 ? "Store credit"
 : "Amount receivable"
 : "Amount payable";
 const balanceDisplay = isStoreCredit ? Math.abs(balance) : balance;

 const periodDescription =
 filterFrom || filterTo
 ? `${filterFrom || "…"} → ${filterTo || "…"}`
 : "Full history";

 const statementLines = customerStatement?.lines ?? supplierStatement?.lines ?? [];

 const exportBalanceText = `${formatMoney(balanceDisplay)}${isStoreCredit ? " (credit)" : ""}`;

 const handleExportCsv = () => {
 if (!statement) return;
 downloadAccountStatementCsv({
 accountTypeLabel: accountType === "customer" ? "Customer" : "Supplier",
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
 accountTypeLabel: accountType === "customer" ? "Customer" : "Supplier",
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

 const statementPdfParams = {
 accountTypeLabel: (accountType === "customer" ? "Customer" : "Supplier") as "Customer" | "Supplier",
 accountName: name,
 balanceLabel,
 balanceFormatted: exportBalanceText,
 periodDescription,
 lines: statementLines,
 formatDate,
 displayAmount,
 formatMoney,
 };

 const handleSendStatementPdfEmail = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!statement) return;
 const to = emailPdfTo.trim();
 if (!to) return;
 setEmailPdfSending(true);
 setError(null);
 try {
 const { base64, filename } = getAccountStatementPdfBase64(statementPdfParams);
 await accountsApi.sendAccountStatementPdfEmail({
 to,
 pdfBase64: base64,
 filename,
 accountName: name,
 accountType,
 });
 setSendNotice(`Statement PDF sent to ${to}.`);
 setEmailPdfModalOpen(false);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to send email");
 } finally {
 setEmailPdfSending(false);
 }
 };

 return (
 <div className="min-h-screen bg-gray-50/80 p-6">
 <div className="max-w-7xl mx-auto">
 <div className="mb-8 flex items-center gap-4">
  <div className="p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <FileText className="h-8 w-8 text-orange-500" />
  </div>
  <div>
  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Statement</h1>
  <p className="text-gray-500 text-sm mt-0.5">
  View ledger and balance for a customer or supplier. Record customer payments here.
  </p>
  </div>
 </div>

 <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-5 mb-6">
  <div className="flex flex-wrap gap-4 items-end">
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account type</label>
  <select
  value={accountType}
  onChange={(e) => {
   setAccountType(e.target.value as AccountType);
   setCustomerId("");
   setSupplierId("");
   setSearchQuery("");
   setAccountDropdownOpen(false);
  }}
  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  >
  <option value="customer">Customer</option>
  <option value="supplier">Supplier</option>
  </select>
  </div>
  {accountType === "customer" && (
  <div className="flex-1 min-w-[260px]" ref={accountSearchRef}>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Customer</label>
  <div className="relative">
   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
   <input
   type="text"
   value={
   customerId
   ? (() => {
   const c = customers.find((cu) => cu._id === customerId);
   return c ? formatCustomerLabel(c) : "";
   })()
   : searchQuery
   }
   onChange={(e) => {
   setCustomerId("");
   setSearchQuery(e.target.value);
   setAccountDropdownOpen(true);
   }}
   onFocus={() => setAccountDropdownOpen(true)}
   placeholder="Search customer by name, company, phone or email..."
   className="w-full rounded-xl border border-gray-200 pl-10 pr-9 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-60"
   disabled={loadingList}
   />
   {customerId && (
   <button
   type="button"
   onClick={() => {
   setCustomerId("");
   setSearchQuery("");
   setAccountDropdownOpen(true);
   }}
   className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
   aria-label="Clear selection"
   >
   <X className="h-4 w-4" />
   </button>
   )}
   {accountDropdownOpen && (
   <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1 text-sm">
   {filteredCustomers.length === 0 ? (
   <li className="px-4 py-3 text-gray-500">No customer found</li>
   ) : (
   filteredCustomers.map((c) => (
    <li key={c._id}>
    <button
    type="button"
    onClick={() => {
    setCustomerId(c._id!);
    setSearchQuery("");
    setAccountDropdownOpen(false);
    }}
    className="w-full text-left px-4 py-2.5 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
    >
    <div className="flex items-center justify-between gap-2">
    <span className="font-medium text-gray-900 truncate">{c.name}</span>
    {c.balance != null && c.balance !== 0 && (
    <span className="text-gray-500 shrink-0">(£{Number(c.balance).toFixed(2)})</span>
    )}
    </div>
    {c.contactName && c.contactName.trim() && c.contactName.trim() !== c.name && (
    <div className="text-xs text-gray-500 truncate">{c.contactName}</div>
    )}
    </button>
    </li>
   ))
   )}
   </ul>
   )}
  </div>
  </div>
  )}
  {accountType === "supplier" && (
  <div className="flex-1 min-w-[260px]" ref={accountSearchRef}>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Supplier</label>
  <div className="relative">
   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
   <input
   type="text"
   value={
   supplierId
   ? formatSupplierDisplay(suppliers.find((s) => s._id === supplierId) ?? null)
   : searchQuery
   }
   onChange={(e) => {
   setSupplierId("");
   setSearchQuery(e.target.value);
   setAccountDropdownOpen(true);
   }}
   onFocus={() => setAccountDropdownOpen(true)}
   placeholder="Search supplier by name, phone or email..."
   className="w-full rounded-xl border border-gray-200 pl-10 pr-9 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-60"
   disabled={loadingList}
   />
   {supplierId && (
   <button
   type="button"
   onClick={() => {
   setSupplierId("");
   setSearchQuery("");
   setAccountDropdownOpen(true);
   }}
   className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
   aria-label="Clear selection"
   >
   <X className="h-4 w-4" />
   </button>
   )}
   {accountDropdownOpen && (
   <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1 text-sm">
   {filteredSuppliers.length === 0 ? (
   <li className="px-4 py-3 text-gray-500">No supplier found</li>
   ) : (
   filteredSuppliers.map((s) => (
    <li key={s._id}>
    <button
    type="button"
    onClick={() => {
    if (s._id) setSupplierId(s._id);
    setSearchQuery("");
    setAccountDropdownOpen(false);
    }}
    className="w-full text-left px-4 py-2.5 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none font-medium text-gray-900"
    >
    {formatSupplierDisplay(s)}
    </button>
    </li>
   ))
   )}
   </ul>
   )}
  </div>
  </div>
  )}
  <div className="flex flex-wrap gap-3 items-end">
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From date</label>
  <input
   type="date"
   value={filterFrom}
   onChange={(e) => setFilterFrom(e.target.value)}
   className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  />
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To date</label>
  <input
   type="date"
   value={filterTo}
   onChange={(e) => setFilterTo(e.target.value)}
   className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  />
  </div>
  {(filterFrom || filterTo) && (
  <button
   type="button"
   onClick={() => {
   setFilterFrom("");
   setFilterTo("");
   }}
   className="py-2.5 px-3 text-sm font-medium text-gray-600 hover:text-orange-600"
  >
   Clear filter
  </button>
  )}
  </div>
  </div>
 </div>

 {sendNotice && (
  <div className="mb-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-emerald-800 flex items-center justify-between gap-3">
  <span>{sendNotice}</span>
  <button
  type="button"
  onClick={() => setSendNotice(null)}
  className="shrink-0 text-sm font-medium text-emerald-700 hover:text-emerald-900"
  >
  Dismiss
  </button>
  </div>
 )}
 {error && (
  <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
  {error}
  </div>
 )}

 {loading && !statement ? (
  <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden">
  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
  <div>
  <div className="animate-pulse bg-gray-200 rounded h-5 w-40" />
  <div className="animate-pulse bg-gray-200 rounded h-3 w-24 mt-2" />
  </div>
  <div className="animate-pulse bg-gray-200 rounded h-8 w-28" />
  </div>
  <table className="w-full text-sm">
  <thead>
  <tr className="border-b border-gray-200 bg-gray-50">
   <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
   <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
   <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
   <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[8rem]">Notes</th>
   <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
   <th className="text-right py-3 px-4 font-medium text-gray-700 w-24">Actions</th>
  </tr>
  </thead>
  <tbody>
  {[1, 2, 3, 4, 5].map((i) => (
   <tr key={i} className="border-b border-gray-100">
   <td className="py-3 px-4"><div className="animate-pulse bg-gray-200 rounded h-4 w-32" /></td>
   <td className="py-3 px-4"><div className="animate-pulse bg-gray-200 rounded h-4 w-20" /></td>
   <td className="py-3 px-4"><div className="animate-pulse bg-gray-200 rounded h-4 w-24" /></td>
   <td className="py-3 px-4"><div className="animate-pulse bg-gray-200 rounded h-4 w-28" /></td>
   <td className="py-3 px-4 text-right"><div className="animate-pulse bg-gray-200 rounded h-4 w-16 ml-auto" /></td>
   <td className="py-3 px-4 text-right"><div className="animate-pulse bg-gray-200 rounded h-4 w-12 ml-auto" /></td>
   </tr>
  ))}
  </tbody>
  </table>
  </div>
 ) : statement ? (
  <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden relative">
  {loading && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white rounded-lg">
  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
  </div>
  )}
  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-between gap-4">
  <div>
  <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
  <p className="text-sm text-gray-500">
   {accountType === "customer" ? "Customer" : "Supplier"} statement
  </p>
  </div>
  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
  <div className="flex flex-wrap gap-2">
   <button
   type="button"
   onClick={handleExportCsv}
   className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
   title="Download statement as CSV"
   >
   <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
   CSV
   </button>
   <button
   type="button"
   onClick={handleExportPdf}
   className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
   title="Download statement as PDF"
   >
   <FileDown className="h-4 w-4 text-red-600" />
   PDF
   </button>
   <button
   type="button"
   onClick={() => {
   setError(null);
   setEmailPdfModalOpen(true);
   }}
   className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
   title="Email statement as PDF only"
   >
   <Mail className="h-4 w-4 text-neutral-600" />
   Email PDF
   </button>
  </div>
  <div className="text-right">
   <p className="text-xs text-gray-500 uppercase">{balanceLabel}</p>
   <p
   className={`text-xl font-bold ${
   isStoreCredit ? "text-blue-700" : balance >= 0 ? "text-emerald-700" : "text-neutral-700"
   }`}
   >
   {formatMoney(balanceDisplay)}
   {isStoreCredit && " (credit)"}
   </p>
  </div>
  <button
   onClick={() => {
   setError(null);
   setAdjustModalOpen(true);
   }}
   className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm flex items-center gap-2 transition-colors"
   title="Add or adjust balance for this account"
  >
   <Plus className="h-4 w-4" />
   Add balance
  </button>
  {accountType === "customer" && balance > 0 && (
   <button
   onClick={() => setPaymentModalOpen(true)}
   className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-sm flex items-center gap-2 transition-colors"
   title="Record payment received from this customer"
   >
   <DollarSign className="h-4 w-4" />
   Record payment from customer
   </button>
  )}
  {accountType === "supplier" && balance > 0 && (
   <button
   onClick={() => {
   setError(null);
   setSupplierPaymentModalOpen(true);
   }}
   className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-sm flex items-center gap-2 transition-colors"
   title="Record payment made to this supplier"
   >
   <DollarSign className="h-4 w-4" />
   Pay supplier
   </button>
  )}
  {accountType === "customer" && balance < 0 && (
   <button
   onClick={() => setRefundModalOpen(true)}
   className="px-5 py-2.5 rounded-xl bg-neutral-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-sm flex items-center gap-2 transition-colors"
   title="Pay customer from their store credit"
   >
   <DollarSign className="h-4 w-4" />
   Refund customer (pay from credit)
   </button>
  )}
  </div>
  </div>
  <div className="overflow-x-auto">
  <p className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100">
  Business view: + = money in (payments received), − = money out (sales/credit extended). Newest first. Balance is for {filterFrom || filterTo ? "filtered period" : "full history"}.
  </p>
  <table className="w-full text-sm">
  <thead>
   <tr className="border-b border-gray-200 bg-gray-50">
   <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
   <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
   <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
   <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[8rem]">Notes</th>
   <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
   <th className="text-right py-3 px-4 font-medium text-gray-700 w-24">Actions</th>
   </tr>
  </thead>
  <tbody>
   {(customerStatement?.lines ?? supplierStatement?.lines ?? []).map((line) => {
   const amt = displayAmount(line.amount);
   return (
   <tr key={line._id} className="border-b border-gray-100">
   <td className="py-3 px-4 text-gray-600">{formatDate(line.date)}</td>
   <td className="py-3 px-4">
    <span className="capitalize">{line.type.replace("_", " ")}</span>
    {line.type === "sale" && line.isEdited && (
    <span className="ml-1 text-gray-500">(Edited)</span>
    )}
    {line.paymentMethod && (
    <span className="ml-1 text-gray-500">({line.paymentMethod})</span>
    )}
   </td>
   <td className="py-3 px-4 text-gray-700">{line.referenceLabel || "—"}</td>
   <td className="py-3 px-4 text-gray-600 max-w-xs">
    {line.note?.trim() ? (
     <span className="whitespace-pre-wrap break-words" title={line.note.trim()}>
      {line.note.trim()}
     </span>
    ) : (
     <span className="text-gray-400">—</span>
    )}
   </td>
   <td className="py-3 px-4 text-right font-medium">
    <span className={amt >= 0 ? "text-emerald-600" : "text-neutral-600"}>
    {amt >= 0 ? "+" : ""}{formatMoney(amt)}
    </span>
   </td>
   <td className="py-3 px-4 text-right">
    {EDITABLE_TYPES.has(line.type) ? (
    <div className="inline-flex items-center gap-1">
    <button
    type="button"
    onClick={() => openEditEntry(line)}
    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"
    title="Edit entry"
    >
    <Pencil className="h-4 w-4" />
    </button>
    <button
    type="button"
    onClick={() => handleDeleteEntry(line._id)}
    disabled={deletingEntryId === line._id}
    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
    title="Delete entry"
    >
    {deletingEntryId === line._id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
    <Trash2 className="h-4 w-4" />
    )}
    </button>
    </div>
    ) : (
    <span className="text-xs text-gray-400">—</span>
    )}
   </td>
   </tr>
   );
   })}
  </tbody>
  </table>
  </div>
  {(customerStatement?.lines?.length ?? supplierStatement?.lines?.length ?? 0) === 0 && (
  <div className="p-8 text-center text-gray-500">No ledger entries yet.</div>
  )}
  </div>
 ) : (
  <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-12 text-center">
  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
  <p className="text-gray-500 font-medium">Select a {accountType} to view their account statement.</p>
  </div>
 )}
 </div>

 {editEntryId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/40" onClick={() => setEditEntryId(null)} />
  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200/80 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">Edit ledger entry</h3>
  <button
  type="button"
  onClick={() => setEditEntryId(null)}
  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <form onSubmit={handleEditEntry} className="p-6 space-y-5">
  <p className="text-sm text-gray-600 -mt-2">Updates the entry and re-calculates the account balance.</p>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (£) *</label>
  <input
   type="number"
   step="0.01"
   min="0"
   value={editAmount}
   onChange={(e) => setEditAmount(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
   required
  />
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment method</label>
  <select
   value={editPaymentMethod}
   onChange={(e) => setEditPaymentMethod(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
  >
   <option value="">—</option>
   <option value="cash">Cash</option>
   <option value="bank">Bank</option>
   <option value="card">Card</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note</label>
  <input
   type="text"
   value={editNote}
   onChange={(e) => setEditNote(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
   type="button"
   onClick={() => setEditEntryId(null)}
   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
  >
   Cancel
  </button>
  <button
   type="submit"
   disabled={editSubmitting || !editAmount || Number(editAmount) <= 0}
   className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
   {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
   Save changes
  </button>
  </div>
  </form>
  </div>
 </div>
 )}

 {adjustModalOpen && (accountType === "customer" ? customerId : supplierId) && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/40" onClick={() => setAdjustModalOpen(false)} />
  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200/80 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">Add balance</h3>
  <button
  type="button"
  onClick={() => setAdjustModalOpen(false)}
  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <form onSubmit={handleAdjustBalance} className="p-6 space-y-5">
  <p className="text-sm text-gray-600 -mt-2">
  Add to the {accountType} balance ({accountType === "customer" ? "customer owes more" : "we owe supplier more"}). Use for opening balances or manual corrections.
  </p>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (£) *</label>
  <input
   type="number"
   step="0.01"
   min="0"
   value={adjustAmount}
   onChange={(e) => setAdjustAmount(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
   required
   placeholder="0.00"
  />
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
  <input
   type="text"
   value={adjustNote}
   onChange={(e) => setAdjustNote(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
   placeholder="e.g. Opening balance from old system"
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
   type="button"
   onClick={() => setAdjustModalOpen(false)}
   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
  >
   Cancel
  </button>
  <button
   type="submit"
   disabled={adjustSubmitting || !adjustAmount || Number(adjustAmount) <= 0}
   className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
   {adjustSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
   Add balance
  </button>
  </div>
  </form>
  </div>
 </div>
 )}

 {emailPdfModalOpen && statement && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/40" onClick={() => setEmailPdfModalOpen(false)} />
  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200/80 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">Email statement (PDF)</h3>
  <button
  type="button"
  onClick={() => setEmailPdfModalOpen(false)}
  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <form onSubmit={handleSendStatementPdfEmail} className="p-6 space-y-5">
  <p className="text-sm text-gray-600 -mt-2">
  Sends the same PDF as the download. Requires SMTP in the app server environment (see{" "}
  <code className="text-xs bg-gray-100 px-1 rounded">send-pdf</code> API route).
  </p>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
   Recipient email *
  </label>
  <input
   type="email"
   value={emailPdfTo}
   onChange={(e) => setEmailPdfTo(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
   placeholder="name@example.com"
   required
   autoComplete="email"
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
   type="button"
   onClick={() => setEmailPdfModalOpen(false)}
   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
  >
   Cancel
  </button>
  <button
   type="submit"
   disabled={emailPdfSending || !emailPdfTo.trim()}
   className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
   {emailPdfSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
   Send PDF
  </button>
  </div>
  </form>
  </div>
 </div>
 )}

 {paymentModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/40" onClick={() => setPaymentModalOpen(false)} />
  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200/80 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">Record payment from customer</h3>
  <button
  onClick={() => setPaymentModalOpen(false)}
  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <form onSubmit={handleRecordPayment} className="p-6 space-y-5">
  <p className="text-sm text-gray-600 -mt-2">Record money received from this customer against their balance.</p>
  {accountType === "customer" && customerStatement && (
  <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
   <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
   {balance >= 0 ? "Outstanding balance" : "Store credit"}
   </p>
   <p
   className={`text-lg font-bold ${balance >= 0 ? "text-emerald-700" : "text-blue-700"}`}
   >
   {balance >= 0 ? formatMoney(balance) : `${formatMoney(Math.abs(balance))} (credit)`}
   </p>
   {balance <= 0 && (
   <p className="text-sm text-neutral-600 mt-2">No balance owed. Use this only when the customer pays you against what they owe.</p>
   )}
  </div>
  )}
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (£) *</label>
  <input
   type="number"
   step="0.01"
   min="0"
   max={balance > 0 ? balance : undefined}
   value={paymentAmount}
   onChange={(e) => setPaymentAmount(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   required
   placeholder={balance > 0 ? `Max ${formatMoney(balance)}` : undefined}
  />
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment method</label>
  <select
   value={paymentMethod}
   onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank" | "card")}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  >
   <option value="cash">Cash</option>
   <option value="bank">Bank</option>
   <option value="card">Card</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
  <input
   type="text"
   value={paymentNote}
   onChange={(e) => setPaymentNote(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   placeholder="e.g. Invoice INV-xxx"
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
   type="button"
   onClick={() => setPaymentModalOpen(false)}
   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
  >
   Cancel
  </button>
  <button
   type="submit"
   disabled={paymentSubmitting || !paymentAmount || Number(paymentAmount) <= 0 || (accountType === "customer" && balance <= 0)}
   className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
   {paymentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Record payment from customer
  </button>
  </div>
  </form>
  </div>
 </div>
 )}

 {supplierPaymentModalOpen && accountType === "supplier" && supplierStatement && balance > 0 && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/40" onClick={() => setSupplierPaymentModalOpen(false)} />
  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200/80 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">Pay supplier</h3>
  <button
  onClick={() => setSupplierPaymentModalOpen(false)}
  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <form onSubmit={handleRecordSupplierPayment} className="p-6 space-y-5">
  <p className="text-sm text-gray-600 -mt-2">Record money paid to this supplier against their balance.</p>
  <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount payable</p>
  <p className="text-lg font-bold text-emerald-700">{formatMoney(balance)}</p>
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (£) *</label>
  <input
   type="number"
   step="0.01"
   min="0"
   max={balance}
   value={supplierPaymentAmount}
   onChange={(e) => setSupplierPaymentAmount(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   required
   placeholder={`Max ${formatMoney(balance)}`}
  />
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment method</label>
  <select
   value={paymentMethod}
   onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank" | "card")}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
  >
   <option value="cash">Cash</option>
   <option value="bank">Bank</option>
   <option value="card">Card</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
  <input
   type="text"
   value={paymentNote}
   onChange={(e) => setPaymentNote(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   placeholder="e.g. Settlement for invoices"
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
   type="button"
   onClick={() => setSupplierPaymentModalOpen(false)}
   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
  >
   Cancel
  </button>
  <button
   type="submit"
   disabled={
   supplierPaymentSubmitting ||
   !supplierPaymentAmount ||
   Number(supplierPaymentAmount) <= 0 ||
   Number(supplierPaymentAmount) > balance
   }
   className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
   {supplierPaymentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Pay supplier
  </button>
  </div>
  </form>
  </div>
 </div>
 )}

 {refundModalOpen && accountType === "customer" && customerStatement && balance < 0 && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/40" onClick={() => setRefundModalOpen(false)} />
  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200/80 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">Refund customer (pay from credit)</h3>
  <button
  onClick={() => setRefundModalOpen(false)}
  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <form onSubmit={handleRecordRefund} className="p-6 space-y-5">
  <p className="text-sm text-gray-600 -mt-2">Pay this customer from their store credit. This reduces their credit balance.</p>
  <div className="p-3 rounded-xl border border-gray-200 bg-neutral-50/50">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Store credit</p>
  <p className="text-lg font-bold text-neutral-700">{formatMoney(Math.abs(balance))}</p>
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (£) *</label>
  <input
   type="number"
   step="0.01"
   min="0"
   max={Math.abs(balance)}
   value={refundAmount}
   onChange={(e) => setRefundAmount(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
   required
   placeholder={`Max ${formatMoney(Math.abs(balance))}`}
  />
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment method</label>
  <select
   value={paymentMethod}
   onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank" | "card")}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-50/50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
  >
   <option value="cash">Cash</option>
   <option value="bank">Bank</option>
   <option value="card">Card</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
  <input
   type="text"
   value={paymentNote}
   onChange={(e) => setPaymentNote(e.target.value)}
   className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
   placeholder="e.g. Refund reason"
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
   type="button"
   onClick={() => setRefundModalOpen(false)}
   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
  >
   Cancel
  </button>
  <button
   type="submit"
   disabled={refundSubmitting || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > Math.abs(balance)}
   className="flex-1 py-2.5 rounded-xl bg-neutral-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-colors"
  >
   {refundSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Refund customer
  </button>
  </div>
  </form>
  </div>
 </div>
 )}
 </div>
 );
}

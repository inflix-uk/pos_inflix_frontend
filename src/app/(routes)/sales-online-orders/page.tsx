"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
 Search,
 ChevronDown,
 ChevronRight,
 Plus,
 ChevronLeft,
 Loader2,
 RefreshCw,
 Pencil,
 FileText,
 Receipt,
 Download,
 Trash2,
 Filter,
 Eye,
 X,
 MoreVertical,
 Banknote,
 CreditCard,
 Wallet,
 Landmark,
} from "lucide-react";
import {
 salesApi,
 type SaleRecord,
 type SaleCustomer,
 formatCustomerAddressForInvoice,
} from "../sales-dashboard/service/salesApi";
import { downloadInvoiceA4, printInvoiceA4, printReceipt80mm } from "@/lib/invoicePrint";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { locationApi } from "../peoples/locations/service/locationApi";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const sortOptions = ["Newest", "Oldest", "Last 7 Days", "Last 30 Days"] as const;
const typeOptions = ["All", "retail", "wholesale", "repair"];
const paymentOptions = ["", "cash", "card", "credit", "bank"];
const returnFilterOptions: { value: "" | "yes" | "no"; label: string }[] = [
 { value: "", label: "Any" },
 { value: "yes", label: "Has return" },
 { value: "no", label: "No return" },
];

const typeBadge = (type: string) => {
 const cls =
 type === "wholesale"
 ? "bg-blue-100 text-blue-700"
 : type === "repair"
 ? "bg-neutral-100 text-neutral-800"
 : "bg-emerald-100 text-emerald-700";
 const label = type === "wholesale" ? "Wholesale" : type === "repair" ? "Repair" : "Retail";
 return (
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
 );
};

const paymentBadge = (sale: SaleRecord) => {
 const allowed = ["cash", "card", "bank", "credit"] as const;
 const breakdown = sale.payments;
 const methods: string[] = breakdown
 ? allowed.filter((k) => Number((breakdown as Record<string, number | undefined>)[k] ?? 0) > 0)
 : sale.paymentMethod && (allowed as readonly string[]).includes(sale.paymentMethod)
 ? [sale.paymentMethod]
 : [];
 if (methods.length === 0) {
 return <span className="text-xs text-gray-400">—</span>;
 }
 const cls: Record<string, string> = {
 cash: "bg-emerald-100 text-emerald-700",
 card: "bg-blue-100 text-blue-700",
 credit: "bg-amber-100 text-amber-800",
 bank: "bg-violet-100 text-violet-700",
 };
 return (
 <div className="flex flex-wrap gap-1 text-[11px]">
 {methods.map((m) => (
  <span key={m} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${cls[m] ?? "bg-gray-100 text-gray-700"}`}>
  {m}
  </span>
 ))}
 </div>
 );
};

const statusBadge = (sale: SaleRecord) =>
 sale.hasReturn ? (
 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
 Returned
 </span>
 ) : (
 typeBadge(sale.type)
 );

/** Skeleton rows shown while sales data loads */
function SalesTableSkeleton({ rows = 6 }: { rows?: number }) {
 const shimmer = "animate-pulse bg-gray-200 rounded";
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
  <tr className="bg-gray-50/80 border-b border-gray-200">
  <th className="w-10 px-2 py-3.5" />
  {["Created / Reference", "Customer", "Type", "Total", "Actions"].map((h) => (
  <th key={h} className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
  ))}
  </tr>
 </thead>
 <tbody>
  {Array.from({ length: rows }).map((_, i) => (
  <tr key={i} className="border-b border-gray-100">
  <td className="px-2 py-4"><div className={`${shimmer} h-4 w-4`} /></td>
  <td className="px-6 py-4"><div className={`${shimmer} h-4 w-36`} /></td>
  <td className="px-6 py-4"><div className={`${shimmer} h-4 w-24`} /></td>
  <td className="px-6 py-4"><div className={`${shimmer} h-5 w-16 rounded-full`} /></td>
  <td className="px-6 py-4"><div className={`${shimmer} h-4 w-16`} /></td>
  <td className="px-6 py-4"><div className="flex gap-2"><div className={`${shimmer} h-8 w-8`} /><div className={`${shimmer} h-8 w-8`} /><div className={`${shimmer} h-8 w-8`} /></div></td>
  </tr>
  ))}
 </tbody>
 </table>
 </div>
 );
}

/** Icon button with a hover-revealed label tooltip */
function ActionButton({
 onClick,
 disabled,
 label,
 icon,
 hoverColor,
}: {
 onClick: () => void;
 disabled?: boolean;
 label: string;
 icon: React.ReactNode;
 hoverColor: string;
}) {
 return (
 <span className="relative group inline-flex">
  <button
  type="button"
  onClick={onClick}
  disabled={disabled}
  aria-label={label}
  className={`p-0.5 @[640px]:p-1 text-gray-500 ${hoverColor} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
  >
  {icon}
  </button>
  <span
  role="tooltip"
  className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
  >
  {label}
  <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
  </span>
 </span>
 );
}

/** Row-level overflow menu: collapses all action icons behind a single 3-dots button. */
function ActionsMenu({
 items,
}: {
 items: Array<{
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
 }>;
}) {
 const [open, setOpen] = useState(false);
 const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
 const triggerRef = useRef<HTMLButtonElement>(null);
 const menuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (!open) return;
  const onDocClick = (e: MouseEvent) => {
   if (
    menuRef.current && !menuRef.current.contains(e.target as Node) &&
    triggerRef.current && !triggerRef.current.contains(e.target as Node)
   ) {
    setOpen(false);
   }
  };
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") setOpen(false);
  };
  document.addEventListener("mousedown", onDocClick);
  document.addEventListener("keydown", onKey);
  return () => {
   document.removeEventListener("mousedown", onDocClick);
   document.removeEventListener("keydown", onKey);
  };
 }, [open]);

 const handleToggle = () => {
  if (!open && triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect();
   setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  }
  setOpen((v) => !v);
 };

 return (
  <>
   <button
    ref={triggerRef}
    type="button"
    onClick={handleToggle}
    aria-label="More actions"
    aria-haspopup="menu"
    aria-expanded={open}
    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
   >
    <MoreVertical className="h-4 w-4 @[640px]:h-[18px] @[640px]:w-[18px]" />
   </button>
   {open && pos && (
    <div
     ref={menuRef}
     role="menu"
     className="fixed z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
     style={{ top: pos.top, right: pos.right }}
    >
     {items.map((item) => (
      <button
       key={item.key}
       type="button"
       role="menuitem"
       disabled={item.disabled}
       onClick={() => {
        setOpen(false);
        item.onClick();
       }}
       className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        item.destructive
         ? "text-red-600 hover:bg-red-50"
         : "text-gray-700 hover:bg-gray-50"
       }`}
      >
       <span className="shrink-0">{item.icon}</span>
       <span className="truncate">{item.label}</span>
      </button>
     ))}
    </div>
   )}
  </>
 );
}

/** Partial-payment modal — records a follow-up payment against an existing sale invoice. */
function TakePaymentModal({
 sale,
 onClose,
 onSaved,
}: {
 sale: SaleRecord;
 onClose: () => void;
 onSaved: (updated: { amountDue: number; payments: { cash?: number; card?: number; credit?: number; bank?: number } }) => void;
}) {
 // Invoice headline value — what the customer was charged in total.
 const invoiceTotal = Math.max(0, Number(sale.total) || 0);
 // Outstanding balance signals (in priority order):
 //   1) `amountDue` is the authoritative balance written by wholesale/repair flows. Use it when set.
 //   2) Otherwise the `credit` bucket of the split breakdown represents the part the customer still owes.
 //   3) Otherwise the sale was settled at POS (single-method paymentMethod like "cash") — no balance, even if
 //      `payments.cash` etc. weren't recorded as a breakdown (legacy retail rows).
 //   We deliberately do NOT fall back to (total − sum(payments)) because retail sales often skip the
 //   breakdown entirely, which made cash-paid invoices look unpaid.
 const explicitDue = Number(sale.amountDue);
 const creditPart = Number(sale.payments?.credit || 0);
 const balanceDue = Math.max(
  0,
  Number.isFinite(explicitDue) ? explicitDue : (creditPart > 0 ? creditPart : 0)
 );
 const takenSoFar = Math.max(0, invoiceTotal - balanceDue);
 const maxMoreCanTake = balanceDue;

 const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : "");
 const [method, setMethod] = useState<"cash" | "card" | "credit" | "bank">("cash");
 const [note, setNote] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape" && !submitting) onClose();
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
 }, [onClose, submitting]);

 const parsed = parseFloat(amount);
 const parsedAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
 const overpaying = maxMoreCanTake > 0 && parsedAmount > maxMoreCanTake;
 const afterThis = Math.max(0, balanceDue - parsedAmount);

 const submit = async () => {
  if (parsedAmount <= 0) {
   setError("Enter an amount greater than 0.");
   return;
  }
  if (overpaying) {
   setError(`You can take at most ${formatMoney(maxMoreCanTake)} on this invoice.`);
   return;
  }
  setSubmitting(true);
  setError(null);
  try {
   const res = await salesApi.takePayment(sale._id, { amount: parsedAmount, paymentMethod: method, note: note.trim() || undefined });
   if (res.success && res.data) {
    onSaved({ amountDue: res.data.amountDue, payments: res.data.payments });
   } else {
    setError(res.message || "Failed to record payment");
   }
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to record payment");
  } finally {
   setSubmitting(false);
  }
 };

 const methods: Array<{ id: "cash" | "card" | "credit" | "bank"; label: string; icon: React.ReactNode }> = [
  { id: "cash", label: "Cash", icon: <Banknote className="h-5 w-5" /> },
  { id: "card", label: "Card", icon: <CreditCard className="h-5 w-5" /> },
  { id: "bank", label: "Bank", icon: <Landmark className="h-5 w-5" /> },
  { id: "credit", label: "Credit", icon: <Wallet className="h-5 w-5" /> },
 ];

 // % of invoice already paid — used for the progress bar.
 const paidPct = invoiceTotal > 0 ? Math.min(100, Math.round((takenSoFar / invoiceTotal) * 100)) : 0;

 const customerName =
  (typeof sale.customerId === "object" && sale.customerId && (sale.customerId as SaleCustomer).name)
   || sale.customerName
   || "—";

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
   <div role="dialog" aria-modal="true" className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
    <div className="bg-gray-900 px-5 py-4 flex items-center justify-between shrink-0">
     <div>
      <h3 className="text-lg font-semibold text-white">Take payment</h3>
      <p className="text-xs text-gray-300 mt-0.5">{sale.reference} · {customerName}</p>
     </div>
     <button type="button" onClick={onClose} disabled={submitting} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50">
      <X className="h-5 w-5" />
     </button>
    </div>

    <div className="p-5 space-y-4 overflow-y-auto">
     {/* Headline breakdown: invoice → paid → balance → after this payment */}
     <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3 text-center">
       <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Invoice total</p>
        <p className="mt-0.5 text-base font-bold text-gray-900 tabular-nums">{formatMoney(invoiceTotal)}</p>
       </div>
       <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Paid so far</p>
        <p className="mt-0.5 text-base font-bold text-emerald-700 tabular-nums">{formatMoney(takenSoFar)}</p>
       </div>
       <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Balance left</p>
        <p className="mt-0.5 text-base font-bold text-amber-700 tabular-nums">{formatMoney(balanceDue)}</p>
       </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-white border border-gray-200 overflow-hidden">
       <div
        className="h-full bg-emerald-500 transition-all"
        style={{ width: `${paidPct}%` }}
        aria-label={`${paidPct}% paid`}
       />
      </div>
      <p className="text-[11px] text-gray-500 text-center">{paidPct}% of invoice paid · max more you can take: <span className="font-semibold text-gray-700">{formatMoney(maxMoreCanTake)}</span></p>

      {/* Already-recorded payment breakdown so the cashier can see HOW it was paid */}
      {(sale.payments?.cash || sale.payments?.card || sale.payments?.bank) ? (
       <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-center gap-1.5">
        {sale.payments?.cash ? <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 rounded px-2 py-0.5"><Banknote className="h-3 w-3 text-emerald-600" />Cash {formatMoney(sale.payments.cash)}</span> : null}
        {sale.payments?.card ? <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 rounded px-2 py-0.5"><CreditCard className="h-3 w-3 text-blue-600" />Card {formatMoney(sale.payments.card)}</span> : null}
        {sale.payments?.bank ? <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 rounded px-2 py-0.5"><Landmark className="h-3 w-3 text-violet-600" />Bank {formatMoney(sale.payments.bank)}</span> : null}
       </div>
      ) : null}
     </div>

     {/* Amount input */}
     <div>
      <div className="flex items-center justify-between mb-1.5">
       <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Amount to take now</label>
       {maxMoreCanTake > 0 && (
        <button
         type="button"
         onClick={() => { setAmount(maxMoreCanTake.toFixed(2)); setError(null); }}
         className="text-[11px] font-medium text-orange-600 hover:text-orange-700"
        >
         Use full balance ({formatMoney(maxMoreCanTake)})
        </button>
       )}
      </div>
      <div className="relative">
       <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 font-medium">£</span>
       <input
        type="number"
        min="0"
        max={maxMoreCanTake}
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(e) => {
         // Hard-cap at Balance left: clamp the typed value so the user cannot enter more than is owed.
         // Allow an empty string so they can clear and retype; otherwise clamp to [0, maxMoreCanTake].
         const raw = e.target.value;
         if (raw === "") { setAmount(""); setError(null); return; }
         const n = parseFloat(raw);
         if (!Number.isFinite(n) || n < 0) { setAmount(raw); setError(null); return; }
         const clamped = Math.min(n, maxMoreCanTake);
         setAmount(clamped === n ? raw : clamped.toFixed(2));
         setError(null);
        }}
        autoFocus
        className="block w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base text-gray-900"
       />
      </div>
      {/* Live impact preview */}
      {parsedAmount > 0 && (
       <div className="mt-2 flex items-center justify-between text-xs px-1">
        <span className="text-gray-500">After this payment, balance left:</span>
        <span className={`font-semibold tabular-nums ${overpaying ? "text-red-600" : afterThis === 0 ? "text-emerald-600" : "text-gray-900"}`}>
         {overpaying ? `over by ${formatMoney(parsedAmount - maxMoreCanTake)}` : formatMoney(afterThis)}
        </span>
       </div>
      )}
     </div>

     {/* Method picker */}
     <div>
      <p className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Method</p>
      <div className="grid grid-cols-2 gap-2">
       {methods.map((m) => (
        <button
         key={m.id}
         type="button"
         onClick={() => setMethod(m.id)}
         className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
          method === m.id
           ? "border-orange-500 bg-orange-50 text-orange-700"
           : "border-gray-200 text-gray-700 hover:border-gray-300"
         }`}
        >
         {m.icon}
         <span className="font-medium text-sm">{m.label}</span>
        </button>
       ))}
      </div>
     </div>

     <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">Note (optional)</label>
      <input
       type="text"
       value={note}
       onChange={(e) => setNote(e.target.value.slice(0, 500))}
       placeholder="e.g. Customer paid in person"
       className="block w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800"
      />
     </div>
     {error && (
      <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
     )}
    </div>

    <div className="px-5 py-4 border-t border-gray-200 flex gap-3 shrink-0">
     <button
      type="button"
      onClick={onClose}
      disabled={submitting}
      className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
     >
      Cancel
     </button>
     <button
      type="button"
      onClick={submit}
      disabled={submitting || parsedAmount <= 0 || overpaying}
      className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
     >
      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
      {submitting ? "Recording…" : `Record ${parsedAmount > 0 ? formatMoney(parsedAmount) : "payment"}`}
     </button>
    </div>
   </div>
  </div>
 );
}

/** Invoice preview modal — shows full sale details (payments, items, totals) */
function InvoicePreviewModal({
 sale,
 onClose,
 onPrintInvoice,
 onDownloadInvoice,
 onPrintReceipt,
 printing,
}: {
 sale: SaleRecord;
 onClose: () => void;
 onPrintInvoice: () => void;
 onDownloadInvoice: () => void;
 onPrintReceipt: () => void;
 printing: boolean;
}) {
 const customer =
 typeof sale.customerId === "object" && sale.customerId
 ? (sale.customerId as SaleCustomer)
 : null;
 const customerName = customer?.name || sale.customerName || "\u2014";
 const location =
 typeof sale.locationId === "object" && sale.locationId
 ? (sale.locationId as { _id: string; name: string })
 : null;

 useEffect(() => {
 const handler = (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [onClose]);

 const hasPayments = !!(sale.payments && (sale.payments.cash || sale.payments.card || sale.payments.bank || sale.payments.credit));
 const grandTotal = sale.total - (sale.discount ?? 0);

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
 <div className="relative flex max-h-[100dvh] sm:max-h-[90vh] w-full sm:max-w-3xl flex-col rounded-t-2xl sm:rounded-2xl bg-gray-50 shadow-2xl">
 {/* Header */}
 <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
  <div className="min-w-0 flex-1">
  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{sale.reference}</h3>
  <p className="text-xs sm:text-sm text-gray-500 truncate">
  {sale.type.charAt(0).toUpperCase() + sale.type.slice(1)} sale &middot; {customerName}
  </p>
  </div>
  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
  <button type="button" onClick={onPrintInvoice} disabled={printing} title="Print invoice (A4)" className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50">
  <FileText size={18} />
  </button>
  <button type="button" onClick={onDownloadInvoice} disabled={printing} title="Download PDF" className="p-2 text-gray-500 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50">
  <Download size={18} />
  </button>
  <button type="button" onClick={onPrintReceipt} disabled={printing} title="Print receipt (80mm)" className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50">
  <Receipt size={18} />
  </button>
  <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
  <X className="h-5 w-5" />
  </button>
  </div>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
  {/* Summary card */}
  <div className="rounded-xl bg-white border border-gray-200 p-3 sm:p-4 shadow-sm">
  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
  <div className="min-w-0">
  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Customer</p>
  <p className="mt-1 text-sm font-medium text-gray-900 truncate">{customerName}</p>
  {customer?.phone && <p className="text-xs text-gray-500 truncate">{customer.phone}</p>}
  </div>
  <div className="min-w-0">
  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Date</p>
  <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTimeLondon(sale.createdAt)}</p>
  </div>
  {location && (
  <div className="min-w-0">
  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Location</p>
  <p className="mt-1 text-sm font-medium text-gray-900 truncate">{location.name}</p>
  </div>
  )}
  <div className="min-w-0">
  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Payment</p>
  {hasPayments ? (
  <div className="mt-1 flex flex-wrap gap-1">
   {sale.payments?.cash ? <span className="text-[11px] text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">Cash £{sale.payments.cash.toFixed(2)}</span> : null}
   {sale.payments?.card ? <span className="text-[11px] text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">Card £{sale.payments.card.toFixed(2)}</span> : null}
   {sale.payments?.bank ? <span className="text-[11px] text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">Bank £{sale.payments.bank.toFixed(2)}</span> : null}
   {sale.payments?.credit ? <span className="text-[11px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Due £{sale.payments.credit.toFixed(2)}</span> : null}
  </div>
  ) : (
  <p className="mt-1 text-sm font-medium capitalize text-gray-900">{sale.paymentMethod || "split"}</p>
  )}
  </div>
  </div>
  </div>

  {/* Items */}
  {sale.items && sale.items.length > 0 && (
  <div>
  <h4 className="mb-2 px-1 text-xs sm:text-sm font-semibold text-gray-700">Items ({sale.items.length})</h4>
  {/* Mobile: card list */}
  <div className="space-y-2 sm:hidden">
  {sale.items.map((item, idx) => {
   const sc = item.serialColours || {};
   const colours = (item.serialNumbers || []).map((s) => (sc[s] || "").trim()).filter(Boolean);
   const distinctColours = [...new Set(colours.map((c) => c.toUpperCase()))];
   const mixed = distinctColours.length > 1;
   return (
   <div key={item._id || idx} className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm">
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
    <div className="flex items-start gap-1.5">
     <span className="text-[11px] font-medium text-gray-400 mt-0.5">#{idx + 1}</span>
     <p className="text-sm font-medium text-gray-900 break-words">{item.name}</p>
    </div>
    {item.grade && <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{item.grade}</span>}
    </div>
    <div className="text-right shrink-0">
    <p className="text-sm font-semibold text-gray-900">{formatMoney(item.price * item.quantity)}</p>
    <p className="text-[11px] text-gray-500">{item.quantity} &times; {formatMoney(item.price)}</p>
    </div>
   </div>
   {item.serialNumbers && item.serialNumbers.length > 0 && (
    !mixed ? (
    <p className="mt-2 text-[11px] text-gray-500 break-words"><span className="font-medium text-gray-600">S/N:</span> {item.serialNumbers.join(", ")}</p>
    ) : (
    <ul className="mt-2 space-y-0.5 text-[11px] text-gray-500">
     {item.serialNumbers.map((s) => {
     const c = (sc[s] || "").trim();
     return (
      <li key={s} className="font-mono break-all">
      {s}{c && <span className="ml-1.5 font-sans uppercase tracking-wide text-gray-700">— {c}</span>}
      </li>
     );
     })}
    </ul>
    )
   )}
   </div>
   );
  })}
  </div>
  {/* Desktop: table */}
  <div className="hidden sm:block rounded-xl bg-white border border-gray-200 overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
   <thead className="bg-gray-50">
   <tr>
   <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
   <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">Qty</th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">Unit price</th>
   <th className="px-3 py-2 text-right font-medium text-gray-500">Amount</th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-100">
   {sale.items.map((item, idx) => (
   <tr key={item._id || idx}>
   <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
   <td className="px-3 py-2 text-gray-900">
    {item.name}
    {item.grade && <span className="ml-1.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{item.grade}</span>}
    {item.serialNumbers && item.serialNumbers.length > 0 && (() => {
    const sc = item.serialColours || {};
    const colours = item.serialNumbers.map((s) => (sc[s] || "").trim()).filter(Boolean);
    const distinctColours = [...new Set(colours.map((c) => c.toUpperCase()))];
    const mixed = distinctColours.length > 1;
    if (!mixed) {
    return <p className="mt-0.5 text-xs text-gray-400">S/N: {item.serialNumbers.join(", ")}</p>;
    }
    return (
     <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
     {item.serialNumbers.map((s) => {
      const c = (sc[s] || "").trim();
      return (
      <li key={s} className="font-mono">
       {s}
       {c && <span className="ml-1.5 font-sans not-italic uppercase tracking-wide text-gray-700">— {c}</span>}
      </li>
      );
     })}
     </ul>
    );
    })()}
   </td>
   <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">{item.quantity}</td>
   <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">{formatMoney(item.price)}</td>
   <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-900">{formatMoney(item.price * item.quantity)}</td>
   </tr>
   ))}
   </tbody>
  </table>
  </div>
  </div>
  )}

  {/* Totals card */}
  <div className="rounded-xl bg-white border border-gray-200 p-3 sm:p-4 shadow-sm sm:ml-auto sm:max-w-sm">
  <div className="space-y-1.5 text-sm">
  <div className="flex justify-between">
  <span className="text-gray-500">Subtotal</span>
  <span className="text-gray-900">{formatMoney(sale.subtotal)}</span>
  </div>
  {(sale.discount ?? 0) > 0 && (
  <div className="flex justify-between">
   <span className="text-gray-500">
   Discount
   {sale.discountType === "percent" && sale.discountValue
   ? ` (${Math.min(100, Number(sale.discountValue))}%)`
   : ""}
   </span>
   <span className="text-red-600">-{formatMoney(sale.discount)}</span>
  </div>
  )}
  <div className="flex justify-between">
  <span className="text-gray-500">Tax</span>
  <span className="text-gray-900">{formatMoney(sale.tax)}</span>
  </div>
  <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-base font-semibold">
  <span className="text-gray-700">Total</span>
  <span className="text-gray-900">{formatMoney(grandTotal)}</span>
  </div>
  {hasPayments && (
  <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
   <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Payments</span>
   {sale.payments?.cash ? <div className="flex justify-between text-xs"><span className="text-gray-500">Cash</span><span className="text-gray-700">{formatMoney(sale.payments.cash)}</span></div> : null}
   {sale.payments?.card ? <div className="flex justify-between text-xs"><span className="text-gray-500">Card</span><span className="text-gray-700">{formatMoney(sale.payments.card)}</span></div> : null}
   {sale.payments?.bank ? <div className="flex justify-between text-xs"><span className="text-gray-500">Bank</span><span className="text-gray-700">{formatMoney(sale.payments.bank)}</span></div> : null}
   {sale.payments?.credit ? <div className="flex justify-between text-xs"><span className="text-orange-600 font-medium">Balance to pay</span><span className="text-orange-600 font-medium">{formatMoney(sale.payments.credit)}</span></div> : null}
  </div>
  )}
  {sale.type === "wholesale" && (
  <>
   {(sale.previousBalance ?? 0) !== 0 && (
   <div className="flex justify-between text-xs"><span className="text-gray-500">Previous balance</span><span className="text-gray-700">{formatMoney(sale.previousBalance ?? 0)}</span></div>
   )}
   {(sale.amountDue ?? 0) !== 0 && (
   <div className="flex justify-between text-xs"><span className="text-gray-500">Amount due</span><span className="text-gray-700">{formatMoney(sale.amountDue ?? 0)}</span></div>
   )}
  </>
  )}
  </div>
  </div>
 </div>
 </div>
 </div>
 );
}

const Page = () => {
 const router = useRouter();
 const { can, user } = usePermissionsContext();
 const canVoid = can("sale.void");
 /** Backend hard-delete requires legacy role admin (not only sale.delete — managers may have that perm). */
 const canHardDelete = (user?.role || "").toLowerCase() === "admin";
 const [sales, setSales] = useState<SaleRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [total, setTotal] = useState(0);
 const [pages, setPages] = useState(1);
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(20);
 const [searchTerm, setSearchTerm] = useState("");
 const [debouncedSearch, setDebouncedSearch] = useState("");
 const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

 // Debounce search: wait 400ms after last keystroke before triggering API call
 const handleSearchChange = useCallback((value: string) => {
 setSearchTerm(value);
 if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
 searchTimerRef.current = setTimeout(() => {
 setDebouncedSearch(value);
 setCurrentPage(1);
 }, 400);
 }, []);

 const [showTypeDropdown, setShowTypeDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);
 const [selectedType, setSelectedType] = useState("All");
 const [selectedSort, setSelectedSort] = useState<(typeof sortOptions)[number]>("Newest");
 const [showMoreFilters, setShowMoreFilters] = useState(false);
 const [dateFrom, setDateFrom] = useState("");
 const [dateTo, setDateTo] = useState("");
 const [locationId, setLocationId] = useState("");
 const [paymentMethod, setPaymentMethod] = useState("");
 const [minTotal, setMinTotal] = useState("");
 const [maxTotal, setMaxTotal] = useState("");
 const [hasReturnFilter, setHasReturnFilter] = useState<"" | "yes" | "no">("");
 const [locations, setLocations] = useState<{ _id: string; name: string }[]>([]);
 const [expandedSaleIds, setExpandedSaleIds] = useState<Set<string>>(() => new Set());

 const [printLoading, setPrintLoading] = useState<string | null>(null);
 const [downloadInvoiceLoadingId, setDownloadInvoiceLoadingId] = useState<string | null>(null);
 const [deleteConfirmSale, setDeleteConfirmSale] = useState<SaleRecord | null>(null);
 const [deleting, setDeleting] = useState(false);
 const [hardDeleteConfirmRef, setHardDeleteConfirmRef] = useState("");
 const [hardDeleting, setHardDeleting] = useState(false);
 const [previewSale, setPreviewSale] = useState<SaleRecord | null>(null);
 const [previewLoading, setPreviewLoading] = useState(false);
 const [takePaymentSale, setTakePaymentSale] = useState<SaleRecord | null>(null);

 const openPreview = useCallback(async (sale: SaleRecord) => {
 // If items already loaded (from search results or expanded row), show directly
 if (sale.items && sale.items.length > 0) {
 setPreviewSale(sale);
 return;
 }
 // Otherwise fetch full sale details
 setPreviewLoading(true);
 try {
 const res = await salesApi.getSaleById(sale._id);
 setPreviewSale(res.data);
 } catch {
 setPreviewSale(sale); // show what we have
 } finally {
 setPreviewLoading(false);
 }
 }, []);

 const saleForPrint = (s: SaleRecord): Parameters<typeof printInvoiceA4>[0] => ({
 _id: s._id,
 reference: s.reference,
 type: s.type === "repair" ? "retail" : s.type,
 createdAt: s.createdAt,
 customerName: s.customerName,
 customerAddress: formatCustomerAddressForInvoice(s),
 items: (s.items ?? []).map((i) => ({
 name: i.name,
 sku: i.sku,
 price: i.price,
 quantity: i.quantity,
 unit: i.unit,
 serialNumbers: i.serialNumbers,
 grade: i.grade,
 })),
 subtotal: s.subtotal,
 tax: s.tax,
 discount: s.discount,
 discountType: s.discountType,
 discountValue: s.discountValue,
 total: s.total,
 paymentMethod: s.paymentMethod,
 payments: s.payments,
 previousBalance: s.previousBalance,
 amountDue: s.amountDue,
 balanceAfter: (s as { balanceAfter?: number }).balanceAfter,
 });

 /** The list endpoint excludes items when there is no search query, so fetch the full sale when items are missing. */
 const ensureSaleWithItems = async (sale: SaleRecord): Promise<SaleRecord> => {
 if (sale.items && sale.items.length > 0) return sale;
 const res = await salesApi.getSaleById(sale._id);
 return res.data ?? sale;
 };

 const handlePrintInvoice = async (sale: SaleRecord) => {
 setPrintLoading(sale._id);
 try {
 const full = await ensureSaleWithItems(sale);
 await printInvoiceA4(saleForPrint(full));
 } catch (_) {
 setError("Failed to generate invoice PDF");
 } finally {
 setPrintLoading(null);
 }
 };

 const handlePrintReceipt = async (sale: SaleRecord) => {
 setPrintLoading(sale._id);
 try {
 const full = await ensureSaleWithItems(sale);
 await printReceipt80mm(saleForPrint(full));
 } catch (_) {
 setError("Failed to generate receipt");
 } finally {
 setPrintLoading(null);
 }
 };

 const handleDownloadInvoice = async (sale: SaleRecord) => {
 setDownloadInvoiceLoadingId(sale._id);
 try {
 const full = await ensureSaleWithItems(sale);
 await downloadInvoiceA4(saleForPrint(full));
 } catch (_) {
 setError("Failed to download invoice PDF");
 } finally {
 setDownloadInvoiceLoadingId(null);
 }
 };

 const listOrder = useMemo(() => (selectedSort === "Oldest" ? "asc" : "desc"), [selectedSort]);

 const fetchSales = useCallback(async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await salesApi.getSales({
 page: currentPage,
 limit: rowsPerPage,
 type: selectedType === "All" ? undefined : selectedType,
 search: debouncedSearch.trim() || undefined,
 from: dateFrom.trim() || undefined,
 to: dateTo.trim() || undefined,
 locationId: locationId.trim() || undefined,
 paymentMethod: paymentMethod.trim() || undefined,
 minTotal: minTotal.trim() || undefined,
 maxTotal: maxTotal.trim() || undefined,
 hasReturn: hasReturnFilter || undefined,
 order: listOrder,
 });
 setSales(res.data ?? []);
 setTotal(res.total ?? 0);
 setPages(res.pages ?? 1);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load sales");
 setSales([]);
 } finally {
 setLoading(false);
 }
 }, [
 currentPage,
 rowsPerPage,
 selectedType,
 debouncedSearch,
 dateFrom,
 dateTo,
 locationId,
 paymentMethod,
 minTotal,
 maxTotal,
 hasReturnFilter,
 listOrder,
 ]);

 useEffect(() => {
 fetchSales();
 }, [fetchSales]);

 useEffect(() => {
 let cancelled = false;
 locationApi.getLocations({ limit: 300, isActive: true }).then((r) => {
 if (cancelled || !r.success || !Array.isArray(r.data)) return;
 setLocations(
 (r.data as { _id?: string; name?: string }[]).map((l) => ({
  _id: String(l._id),
  name: l.name || "—",
 }))
 );
 });
 return () => {
 cancelled = true;
 };
 }, []);

 const toggleExpanded = (id: string) => {
 setExpandedSaleIds((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 const target = sales.find((s) => s._id === id);
 const needsItems = target && (!target.items || target.items.length === 0);
 const hasSidLookup = target && (target.items ?? []).some((i) => i.serialIds);
 if (target && (needsItems || !hasSidLookup)) {
 salesApi.getSaleById(id).then((res) => {
  if (!res?.data) return;
  setSales((prev) => prev.map((s) => (s._id === id ? { ...s, items: res.data!.items } : s)));
 }).catch(() => {});
 }
 };

 const clearExtraFilters = () => {
 setDateFrom("");
 setDateTo("");
 setLocationId("");
 setPaymentMethod("");
 setMinTotal("");
 setMaxTotal("");
 setHasReturnFilter("");
 setCurrentPage(1);
 };

 const displayCustomerLine = (sale: SaleRecord) => {
 const name = sale.customerName || (sale.type === "retail" ? "Walk-in" : "—");
 const cust = typeof sale.customerId === "object" && sale.customerId ? (sale.customerId as SaleCustomer) : null;
 const extra = [cust?.phone, cust?.email].filter(Boolean).join(" · ");
 return { name, extra };
 };

 const handlePageChange = (page: number) => setCurrentPage(page);

 const handleRowsPerPageChange = (value: number) => {
 setRowsPerPage(value);
 setCurrentPage(1);
 };


 return (
 <div className="@container min-h-screen bg-gray-50/80 p-3 @[640px]:p-6">
 <div className="w-full">
 <div className="mb-4 @[640px]:mb-8 flex flex-wrap items-center justify-between gap-3">
  <div className="flex items-center gap-2 @[640px]:gap-4">
  <div className="p-2 @[640px]:p-3 rounded-lg bg-white border border-gray-200/80 shadow-sm">
  <Receipt className="h-5 w-5 @[640px]:h-8 @[640px]:w-8 text-orange-500" />
  </div>
  <div>
  <h1 className="text-lg @[640px]:text-2xl font-bold text-gray-900 tracking-tight">Sales</h1>
  <p className="text-gray-500 text-[11px] @[640px]:text-sm mt-0.5">
  All sales from POS and Wholesale — search matches invoice lines (SKU, product, IMEI), customer contact, and
  reprint invoices.
  </p>
  </div>
  </div>
  <div className="flex items-center gap-2">
  <button
  onClick={() => fetchSales()}
  disabled={loading}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-2.5 @[640px]:px-4 py-1.5 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg @[640px]:rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
  title="Refresh"
  >
  <RefreshCw className={`h-3.5 w-3.5 @[640px]:h-[18px] @[640px]:w-[18px] ${loading ? "animate-spin" : ""}`} />
  <span className="hidden @[640px]:inline">Refresh</span>
  </button>
  <a
  href="/create-sales"
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-5 py-1.5 @[640px]:py-2.5 text-xs @[640px]:text-sm font-semibold text-white bg-orange-500 rounded-lg @[640px]:rounded-xl hover:bg-orange-600 shadow-sm hover:shadow transition-all"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-[18px] @[640px]:w-[18px]" />
  New Sale
  </a>
  </div>
 </div>

 <div className="bg-white rounded-lg shadow-sm border border-gray-200/80 overflow-hidden">
  <div className="p-3 @[640px]:p-6 border-b border-gray-100 bg-gray-50/50 space-y-3 @[640px]:space-y-4">
  <div className="flex flex-wrap items-center gap-2 @[640px]:gap-3">
  <div className="relative flex-1 min-w-[160px] @[640px]:min-w-[200px] max-w-xl">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-gray-400" />
  <input
   type="text"
   placeholder="Invoice ref, customer, phone, email, SKU, product name, IMEI / serial…"
   className="w-full pl-8 @[640px]:pl-10 pr-3 @[640px]:pr-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm border border-gray-200 rounded-lg @[640px]:rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-shadow"
   value={searchTerm}
   onChange={(e) => handleSearchChange(e.target.value)}
   onKeyDown={(e) => {
   if (e.key === "Enter") {
   if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
   setDebouncedSearch(searchTerm);
   setCurrentPage(1);
   }
   }}
  />
  </div>
  <button
  type="button"
  onClick={fetchSales}
  className="px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg @[640px]:rounded-xl hover:bg-orange-100 transition-colors"
  >
  Search
  </button>
  <div className="relative">
  <button
   type="button"
   className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg @[640px]:rounded-xl hover:bg-gray-50"
   onClick={() => setShowTypeDropdown(!showTypeDropdown)}
  >
   {selectedType === "All" ? "All types" : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
   <ChevronDown className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-gray-400" />
  </button>
  {showTypeDropdown && (
   <div className="absolute z-10 mt-1.5 left-0 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 overflow-hidden">
   {typeOptions.map((opt) => (
   <button
   key={opt}
   type="button"
   className="block w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50"
   onClick={() => {
    setSelectedType(opt);
    setCurrentPage(1);
    setShowTypeDropdown(false);
   }}
   >
   {opt === "All" ? "All types" : opt.charAt(0).toUpperCase() + opt.slice(1)}
   </button>
   ))}
   </div>
  )}
  </div>
  <div className="relative">
  <button
   type="button"
   className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg @[640px]:rounded-xl hover:bg-gray-50"
   onClick={() => setShowSortDropdown(!showSortDropdown)}
  >
   {selectedSort}
   <ChevronDown className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4 text-gray-400" />
  </button>
  {showSortDropdown && (
   <div className="absolute z-10 mt-1.5 right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 overflow-hidden">
   {sortOptions.map((opt) => (
   <button
   key={opt}
   type="button"
   className="block w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50"
   onClick={() => {
    if (opt === "Last 7 Days") {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
    } else if (opt === "Last 30 Days") {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
    } else if (opt === "Newest" || opt === "Oldest") {
    setDateFrom("");
    setDateTo("");
    }
    setSelectedSort(opt);
    setCurrentPage(1);
    setShowSortDropdown(false);
   }}
   >
   {opt}
   </button>
   ))}
   </div>
  )}
  </div>
  <button
  type="button"
  onClick={() => setShowMoreFilters((v) => !v)}
  className={`inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-2 @[640px]:py-2.5 text-xs @[640px]:text-sm font-medium rounded-lg @[640px]:rounded-xl border transition-colors ${
   showMoreFilters
   ? "text-orange-700 bg-orange-50 border-orange-200"
   : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
  }`}
  >
  <Filter className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  More filters
  </button>
  </div>

  {showMoreFilters && (
  <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-200/80">
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">From date</label>
   <input
   type="date"
   value={dateFrom}
   onChange={(e) => {
   setDateFrom(e.target.value);
   setCurrentPage(1);
   }}
   className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   />
  </div>
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">To date</label>
   <input
   type="date"
   value={dateTo}
   onChange={(e) => {
   setDateTo(e.target.value);
   setCurrentPage(1);
   }}
   className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   />
  </div>
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</label>
   <select
   value={locationId}
   onChange={(e) => {
   setLocationId(e.target.value);
   setCurrentPage(1);
   }}
   className="min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   >
   <option value="">All locations</option>
   {locations.map((loc) => (
   <option key={loc._id} value={loc._id}>
   {loc.name}
   </option>
   ))}
   </select>
  </div>
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment (retail)</label>
   <select
   value={paymentMethod}
   onChange={(e) => {
   setPaymentMethod(e.target.value);
   setCurrentPage(1);
   }}
   className="min-w-[140px] px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   >
   <option value="">Any</option>
   {paymentOptions.filter(Boolean).map((p) => (
   <option key={p} value={p}>
   {p.charAt(0).toUpperCase() + p.slice(1)}
   </option>
   ))}
   </select>
  </div>
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Min total (£)</label>
   <input
   type="number"
   step="0.01"
   min={0}
   value={minTotal}
   onChange={(e) => {
   setMinTotal(e.target.value);
   setCurrentPage(1);
   }}
   className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   placeholder="0"
   />
  </div>
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max total (£)</label>
   <input
   type="number"
   step="0.01"
   min={0}
   value={maxTotal}
   onChange={(e) => {
   setMaxTotal(e.target.value);
   setCurrentPage(1);
   }}
   className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   placeholder="Any"
   />
  </div>
  <div>
   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Returns</label>
   <select
   value={hasReturnFilter}
   onChange={(e) => {
   setHasReturnFilter(e.target.value as "" | "yes" | "no");
   setCurrentPage(1);
   }}
   className="min-w-[140px] px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   >
   {returnFilterOptions.map((o) => (
   <option key={o.value || "any"} value={o.value}>
   {o.label}
   </option>
   ))}
   </select>
  </div>
  <div className="flex items-end">
   <button
   type="button"
   onClick={clearExtraFilters}
   className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600"
   >
   Clear extra filters
   </button>
  </div>
  </div>
  )}
  </div>

  {error && (
  <div className="mx-5 mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center justify-between gap-3">
  <span className="text-sm font-medium">{error}</span>
  <button onClick={fetchSales} className="text-sm font-semibold text-red-600 hover:underline shrink-0">
  Retry
  </button>
  </div>
  )}

  {loading ? (
  <SalesTableSkeleton rows={rowsPerPage} />
  ) : (
  <>
  {/* Mobile: card list (no horizontal scroll) */}
  <div className="@[640px]:hidden divide-y divide-gray-100">
  {sales.length === 0 ? (
   <div className="px-4 py-12 text-center">
   <p className="text-gray-500 font-medium">No sales found</p>
   <p className="text-gray-400 text-sm mt-1">Try broader search or filters.</p>
   </div>
  ) : (
   sales.map((sale, idx) => {
   const expanded = expandedSaleIds.has(sale._id);
   const { name: custName, extra: custExtra } = displayCustomerLine(sale);
   const lines = sale.items ?? [];
   const rowNumber = (currentPage - 1) * rowsPerPage + idx + 1;
   const explicitDue = Number(sale.amountDue);
   const creditPart = Number(sale.payments?.credit || 0);
   const rowBalance = Math.max(0, Number.isFinite(explicitDue) ? explicitDue : (creditPart > 0 ? creditPart : 0));
   return (
    <div key={sale._id} className="px-3 py-3 active:bg-orange-50">
    <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
     <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
     <span className="tabular-nums">#{rowNumber}</span>
     <span>·</span>
     <span className="truncate">{formatDateTimeLondon(sale.createdAt)}</span>
     </div>
     <button
     type="button"
     onClick={() => openPreview(sale)}
     disabled={previewLoading}
     className="font-mono text-xs text-blue-600 hover:underline disabled:opacity-50 truncate block max-w-full text-left"
     >
     {sale.reference}
     </button>
     <div className="mt-1 text-sm font-semibold text-gray-900 truncate">{custName}</div>
     {custExtra ? <div className="text-[11px] text-gray-500 truncate">{custExtra}</div> : null}
    </div>
    <div className="shrink-0 flex flex-col items-end gap-1">
     <div className="text-base font-bold text-gray-900 tabular-nums">{formatMoney(sale.total)}</div>
     <ActionsMenu
     items={[
      {
      key: "preview",
      label: "Preview",
      icon: <Eye className="h-4 w-4 text-gray-500" />,
      onClick: () => openPreview(sale),
      disabled: previewLoading,
      },
      ...(rowBalance > 0
      ? [{
      key: "take-payment",
      label: `Take payment (${formatMoney(rowBalance)} due)`,
      icon: <Banknote className="h-4 w-4 text-emerald-600" />,
      onClick: () => setTakePaymentSale(sale),
      disabled: sale.hasReturn,
      }]
      : []),
      {
      key: "print",
      label: "Print invoice (A4)",
      icon: (printLoading === sale._id
       ? <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
       : <FileText className="h-4 w-4 text-orange-600" />),
      onClick: () => handlePrintInvoice(sale),
      disabled: printLoading === sale._id || downloadInvoiceLoadingId === sale._id,
      },
      {
      key: "download",
      label: "Download PDF",
      icon: (downloadInvoiceLoadingId === sale._id
       ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
       : <Download className="h-4 w-4 text-gray-500" />),
      onClick: () => handleDownloadInvoice(sale),
      disabled: printLoading === sale._id || downloadInvoiceLoadingId === sale._id,
      },
      {
      key: "receipt",
      label: "Print receipt (80mm)",
      icon: <Receipt className="h-4 w-4 text-orange-600" />,
      onClick: () => handlePrintReceipt(sale),
      disabled: printLoading === sale._id || downloadInvoiceLoadingId === sale._id,
      },
      {
      key: "edit",
      label: sale.hasReturn ? "Cannot edit — sale has been returned" : "Edit",
      icon: <Pencil className="h-4 w-4 text-gray-700" />,
      onClick: () => {
       try { sessionStorage.setItem(`editSale_${sale._id}`, JSON.stringify(sale)); } catch (_) {}
       router.push(`/sales-online-orders/edit/${sale._id}`);
      },
      disabled: sale.hasReturn,
      },
      ...(canVoid
      ? [{
      key: "void",
      label: sale.hasReturn ? "Cannot void — sale has been returned" : "Void sale",
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      onClick: () => setDeleteConfirmSale(sale),
      disabled: sale.hasReturn,
      destructive: true,
      }]
      : []),
     ]}
     />
    </div>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
    {statusBadge(sale)}
    {paymentBadge(sale)}
    {sale.locationId && typeof sale.locationId === "object" && "name" in sale.locationId && (
     <span className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded bg-gray-100">{sale.locationId.name}</span>
    )}
    </div>
    <button
    type="button"
    onClick={() => toggleExpanded(sale._id)}
    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-orange-600"
    aria-expanded={expanded}
    >
    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
    {expanded ? "Hide" : "Show"} invoice lines ({lines.length})
    </button>
    {expanded && (
    lines.length === 0 ? (
     <p className="mt-2 text-xs text-slate-500">No line items.</p>
    ) : (
     <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 divide-y divide-slate-200">
     {lines.map((line, lidx) => {
     const serialsList = (line.serialNumbers ?? []).filter(Boolean);
     return (
      <div key={line._id ?? `${sale._id}-${lidx}`} className="px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
       <div className="font-medium text-slate-900 truncate">{line.name}</div>
       <div className="text-slate-500 mt-0.5">
       Qty {line.quantity} · {formatMoney(line.price)} ea
       </div>
       {serialsList.length > 0 && (
       <div className="font-mono text-[10px] text-slate-500 mt-0.5 break-all">
       {serialsList.join(", ")}
       </div>
       )}
      </div>
      <div className="font-semibold text-slate-900 tabular-nums shrink-0">{formatMoney(line.price * line.quantity)}</div>
      </div>
      </div>
     );
     })}
     </div>
    )
    )}
    </div>
   );
   })
  )}
  </div>

  {/* Desktop: table */}
  <div className="hidden @[640px]:block overflow-x-auto">
  <table className="w-full">
   <thead>
   <tr className="bg-gray-50/80 border-b border-gray-200">
   <th className="w-8 @[640px]:w-10 px-1.5 @[640px]:px-2 py-2.5 @[640px]:py-3.5" aria-label="Expand" />
   <th className="w-10 px-2 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   #
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Created / Reference
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Customer
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Type
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Location
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Total
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-left text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Payment
   </th>
   <th className="px-2 @[640px]:px-6 py-2.5 @[640px]:py-3.5 text-right text-[10px] @[640px]:text-xs font-semibold text-gray-500 uppercase tracking-wider">
   Actions
   </th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-100">
   {sales.length === 0 ? (
   <tr>
   <td colSpan={9} className="px-6 py-16 text-center">
    <p className="text-gray-500 font-medium">No sales found</p>
    <p className="text-gray-400 text-sm mt-1">
    Try broader search or filters — invoice line SKUs, product names, and IMEIs are searchable.
    </p>
   </td>
   </tr>
   ) : (
   sales.map((sale, idx) => {
   const expanded = expandedSaleIds.has(sale._id);
   const { name: custName, extra: custExtra } = displayCustomerLine(sale);
   const lines = sale.items ?? [];
   const rowNumber = (currentPage - 1) * rowsPerPage + idx + 1;
   return (
    <React.Fragment key={sale._id}>
    <tr className="hover:bg-orange-50 hover:shadow-sm transition-colors">
    <td className="px-1.5 @[640px]:px-2 py-0.5 @[640px]:py-1 align-top">
    <button
     type="button"
     onClick={() => toggleExpanded(sale._id)}
     className="p-1 @[640px]:p-1.5 rounded-lg text-gray-500 hover:bg-gray-200/80 hover:text-gray-800"
     title={expanded ? "Hide invoice lines" : "Show invoice lines"}
     aria-expanded={expanded}
    >
     <ChevronRight
     className={`h-3.5 w-3.5 @[640px]:h-[18px] @[640px]:w-[18px] transition-transform ${expanded ? "rotate-90" : ""}`}
     />
    </button>
    </td>
    <td className="px-2 py-0.5 @[640px]:py-1 text-xs @[640px]:text-sm text-gray-500 tabular-nums align-top">
    {rowNumber}
    </td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 text-xs @[640px]:text-sm align-top leading-tight">
    <div className="font-semibold text-gray-900">{formatDateTimeLondon(sale.createdAt)}</div>
    <button
    type="button"
    onClick={() => openPreview(sale)}
    disabled={previewLoading}
    className="font-mono text-[10px] @[640px]:text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 cursor-pointer"
    title="Preview invoice"
    >
    {sale.reference}
    </button>
    </td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 text-xs @[640px]:text-sm text-gray-900 font-medium align-top leading-tight">
    <div>{custName}</div>
    {custExtra ? <div className="text-[10px] @[640px]:text-xs text-gray-500 font-normal">{custExtra}</div> : null}
    </td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 align-top">{statusBadge(sale)}</td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 text-xs @[640px]:text-sm text-gray-700 align-top">
    {sale.locationId && typeof sale.locationId === "object" && "name" in sale.locationId
     ? sale.locationId.name
     : "—"}
    </td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 text-xs @[640px]:text-sm font-semibold text-gray-900 align-top">
    {formatMoney(sale.total)}
    </td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 align-top">
    {paymentBadge(sale)}
    </td>
    <td className="px-2 @[640px]:px-6 py-0.5 @[640px]:py-1 align-top">
    <div className="flex items-center justify-end">
     {(() => {
     // Same balance logic as the modal so we only offer Take payment when there's something owed.
     const explicitDue = Number(sale.amountDue);
     const creditPart = Number(sale.payments?.credit || 0);
     const rowBalance = Math.max(
      0,
      Number.isFinite(explicitDue) ? explicitDue : (creditPart > 0 ? creditPart : 0)
     );
     return (
     <ActionsMenu
     items={[
      {
      key: "preview",
      label: "Preview",
      icon: <Eye className="h-4 w-4 text-gray-500" />,
      onClick: () => openPreview(sale),
      disabled: previewLoading,
      },
      ...(rowBalance > 0
      ? [{
       key: "take-payment",
       label: `Take payment (${formatMoney(rowBalance)} due)`,
       icon: <Banknote className="h-4 w-4 text-emerald-600" />,
       onClick: () => setTakePaymentSale(sale),
       disabled: sale.hasReturn,
       }]
      : []),
      {
      key: "print",
      label: "Print invoice (A4)",
      icon: (printLoading === sale._id
       ? <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
       : <FileText className="h-4 w-4 text-orange-600" />),
      onClick: () => handlePrintInvoice(sale),
      disabled: printLoading === sale._id || downloadInvoiceLoadingId === sale._id,
      },
      {
      key: "download",
      label: "Download PDF",
      icon: (downloadInvoiceLoadingId === sale._id
       ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
       : <Download className="h-4 w-4 text-gray-500" />),
      onClick: () => handleDownloadInvoice(sale),
      disabled: printLoading === sale._id || downloadInvoiceLoadingId === sale._id,
      },
      {
      key: "receipt",
      label: "Print receipt (80mm)",
      icon: <Receipt className="h-4 w-4 text-orange-600" />,
      onClick: () => handlePrintReceipt(sale),
      disabled: printLoading === sale._id || downloadInvoiceLoadingId === sale._id,
      },
      {
      key: "edit",
      label: sale.hasReturn ? "Cannot edit — sale has been returned" : "Edit",
      icon: <Pencil className="h-4 w-4 text-gray-700" />,
      onClick: () => {
       try {
       sessionStorage.setItem(`editSale_${sale._id}`, JSON.stringify(sale));
       } catch (_) {}
       router.push(`/sales-online-orders/edit/${sale._id}`);
      },
      disabled: sale.hasReturn,
      },
      ...(canVoid
      ? [{
       key: "void",
       label: sale.hasReturn ? "Cannot void — sale has been returned" : "Void sale",
       icon: <Trash2 className="h-4 w-4 text-red-600" />,
       onClick: () => setDeleteConfirmSale(sale),
       disabled: sale.hasReturn,
       destructive: true,
       }]
      : []),
     ]}
     />
     );
     })()}
    </div>
    </td>
    </tr>
    {expanded && (
    <tr className="bg-slate-50/90 border-t border-slate-100">
    <td colSpan={9} className="px-4 py-4 @[640px]:px-8">
     <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
     Invoice lines ({lines.length})
     </p>
     {lines.length === 0 ? (
     <p className="text-sm text-slate-500">No line items on this record.</p>
     ) : (
     <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
     <table className="w-full text-sm min-w-[640px]">
     <thead>
      <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/80">
      <th className="py-2 px-3">#</th>
      <th className="py-2 px-3">SID</th>
      <th className="py-2 px-3 min-w-[200px]">Product</th>
      <th className="py-2 px-3 text-right">Qty</th>
      <th className="py-2 px-3 text-right">Unit</th>
      <th className="py-2 px-3 text-right">Line</th>
      <th className="py-2 px-3">Serial / IMEI</th>
      </tr>
     </thead>
     <tbody className="divide-y divide-slate-100">
      {lines.map((line, idx) => {
      const serials = (line.serialNumbers ?? []).filter(Boolean);
      const sids = serials
       .map((s) => line.serialIds?.[s])
       .filter((v): v is string => Boolean(v));
      const sidDisplay = sids.length > 0 ? sids.join(", ") : "—";
      return (
      <tr key={line._id ?? `${sale._id}-${idx}`} className="text-slate-800">
      <td className="py-2 px-3 tabular-nums text-slate-500">{idx + 1}</td>
      <td className="py-2 px-3 font-mono text-xs">{sidDisplay}</td>
      <td className="py-2 px-3">{line.name}</td>
      <td className="py-2 px-3 text-right tabular-nums">{line.quantity}</td>
      <td className="py-2 px-3 text-right tabular-nums">
      {formatMoney(line.price)}
      </td>
      <td className="py-2 px-3 text-right font-medium tabular-nums">
      {formatMoney(line.price * line.quantity)}
      </td>
      <td className="py-2 px-3 font-mono text-xs">
      {(line.serialNumbers ?? []).filter(Boolean).join(", ") || "—"}
      </td>
      </tr>
      );
      })}
     </tbody>
     </table>
     </div>
     )}
    </td>
    </tr>
    )}
    </React.Fragment>
   );
   })
   )}
   </tbody>
  </table>
  </div>
  <div className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 border-t border-gray-100 bg-gray-50/30 flex flex-wrap items-center justify-between gap-2 @[640px]:gap-4">
  <div className="flex items-center gap-2 @[640px]:gap-3">
   <span className="text-xs @[640px]:text-sm text-gray-500">Rows per page</span>
   <select
   value={rowsPerPage}
   onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
   className="border border-gray-200 rounded-lg px-2 @[640px]:px-3 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
   >
   <option value={5}>5</option>
   <option value={10}>10</option>
   <option value={20}>20</option>
   <option value={50}>50</option>
   <option value={100}>100</option>
   <option value={200}>200</option>
   <option value={500}>500</option>
   </select>
   <span className="text-xs @[640px]:text-sm text-gray-500">{total} entries</span>
  </div>
  <div className="flex items-center gap-1">
   <button
   onClick={() => handlePageChange(currentPage - 1)}
   disabled={currentPage === 1}
   className="p-1.5 @[640px]:p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
   >
   <ChevronLeft className="h-3.5 w-3.5 @[640px]:h-[18px] @[640px]:w-[18px]" />
   </button>
   <span className="px-2 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm font-medium text-gray-600">
   Page {currentPage} of {pages}
   </span>
   <button
   onClick={() => handlePageChange(currentPage + 1)}
   disabled={currentPage >= pages}
   className="p-1.5 @[640px]:p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
   >
   <ChevronRight className="h-3.5 w-3.5 @[640px]:h-[18px] @[640px]:w-[18px]" />
   </button>
  </div>
  </div>
  </>
  )}
 </div>
 </div>

 {deleteConfirmSale && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div
  className="absolute inset-0 bg-black/50"
  onClick={() => !deleting && !hardDeleting && (setDeleteConfirmSale(null), setHardDeleteConfirmRef(""))}
  aria-hidden
  />
  <div
  className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
  role="dialog"
  aria-labelledby="void-sale-dialog-title"
  >
  <h3 id="void-sale-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
  Void this sale?
  </h3>
  <p className="text-sm text-gray-600 mb-4">
  <span className="font-medium">{deleteConfirmSale.reference}</span> — items will be returned to inventory
  and the sale will be marked voided.
  </p>
  <div className="flex flex-col gap-4">
  <div className="flex justify-end gap-2">
  <button
   type="button"
   onClick={() => !deleting && !hardDeleting && (setDeleteConfirmSale(null), setHardDeleteConfirmRef(""))}
   disabled={deleting || hardDeleting}
   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
  >
   Cancel
  </button>
  <button
   type="button"
   onClick={async () => {
   if (!deleteConfirmSale._id || deleting) return;
   setDeleting(true);
   try {
   await salesApi.deleteSale(deleteConfirmSale._id);
   setDeleteConfirmSale(null);
   setHardDeleteConfirmRef("");
   fetchSales();
   } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to void sale");
   } finally {
   setDeleting(false);
   }
   }}
   disabled={deleting || hardDeleting}
   className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 inline-flex items-center gap-2"
  >
   {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Void
  </button>
  </div>
  {canHardDelete && (
  <div className="border-t border-gray-200 pt-4">
   <p className="text-sm font-medium text-gray-700 mb-2">Permanently delete (admin only)</p>
   <p className="text-xs text-gray-500 mb-2">
   Type <strong>{deleteConfirmSale.reference}</strong> to confirm. This cannot be undone.
   </p>
   <div className="flex gap-2">
   <input
   type="text"
   value={hardDeleteConfirmRef}
   onChange={(e) => setHardDeleteConfirmRef(e.target.value)}
   placeholder={deleteConfirmSale.reference}
   className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
   disabled={hardDeleting}
   />
   <button
   type="button"
   onClick={async () => {
   if (!deleteConfirmSale._id || hardDeleting || hardDeleteConfirmRef.trim() !== deleteConfirmSale.reference) return;
   setHardDeleting(true);
   try {
    await salesApi.hardDeleteSale(deleteConfirmSale._id, hardDeleteConfirmRef.trim());
    setDeleteConfirmSale(null);
    setHardDeleteConfirmRef("");
    fetchSales();
   } catch (e) {
    setError(e instanceof Error ? e.message : "Failed to permanently delete sale");
   } finally {
    setHardDeleting(false);
   }
   }}
   disabled={hardDeleting || hardDeleteConfirmRef.trim() !== deleteConfirmSale.reference}
   className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
   >
   {hardDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Permanently delete
   </button>
   </div>
  </div>
  )}
  </div>
  </div>
 </div>
 )}

 {/* Invoice preview modal */}
 {previewSale && (
 <InvoicePreviewModal
  sale={previewSale}
  onClose={() => setPreviewSale(null)}
  onPrintInvoice={() => handlePrintInvoice(previewSale)}
  onDownloadInvoice={() => handleDownloadInvoice(previewSale)}
  onPrintReceipt={() => handlePrintReceipt(previewSale)}
  printing={printLoading === previewSale._id || downloadInvoiceLoadingId === previewSale._id}
 />
 )}

 {takePaymentSale && (
 <TakePaymentModal
  sale={takePaymentSale}
  onClose={() => setTakePaymentSale(null)}
  onSaved={({ amountDue, payments }) => {
   // Optimistic patch so the row reflects the new balance + payment breakdown immediately.
   setSales((prev) => prev.map((s) => (
    s._id === takePaymentSale._id
     ? { ...s, amountDue, payments: { ...(s.payments || {}), ...(payments || {}) } }
     : s
   )));
   setTakePaymentSale(null);
  }}
 />
 )}

 </div>
 );
};

export default Page;

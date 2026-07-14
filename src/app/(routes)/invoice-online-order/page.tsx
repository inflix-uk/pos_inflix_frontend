"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 Search,
 Plus,
 RefreshCw,
 Loader2,
 Receipt,
 AlertTriangle,
 ChevronLeft,
 ChevronRight,
 Eye,
 Pencil,
 Printer,
 Calendar,
 Download,
 FileSpreadsheet,
 FileText,
 Trash2,
 X,
 MoreVertical,
 Mail,
 Send,
} from "lucide-react";
import { invoicesApi, invoiceDisplayDate, invoicePaymentTypeLabel, type InvoiceRecord } from "./service/invoicesApi";
import { formatDateLondon, formatOccurredAt } from "@/lib/dateUtils";
import { downloadInvoiceA4, getInvoiceA4PdfBase64, printInvoiceA4, printReceipt80mm, type SaleForPrint } from "@/lib/invoicePrint";
import { downloadInvoicesExcel } from "@/lib/invoiceExport";
import { usePermissions } from "@/hooks/usePermissions";
import { customerApi } from "../peoples/customers/service/customerApi";
import { getSalesDateRange, STAFF_SALES_BANNER } from "@/lib/salesDateAccess";
import type { DashboardRange } from "@/lib/dateUtils";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const PAGE_SIZE = 25;

function toLondonDateKey(d: Date): string {
 return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

/** Newest invoice date first (occurredAt, else createdAt). */
function sortInvoicesByDateDesc(list: InvoiceRecord[]): InvoiceRecord[] {
 return [...list].sort((a, b) => {
  const ta = new Date(invoiceDisplayDate(a)).getTime();
  const tb = new Date(invoiceDisplayDate(b)).getTime();
  if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
  if (!Number.isFinite(ta)) return 1;
  if (!Number.isFinite(tb)) return -1;
  return tb - ta;
 });
}

function invoiceToPrintable(inv: InvoiceRecord): SaleForPrint {
 return {
  _id: inv._id,
  reference: inv.reference,
  type: (inv.type as "wholesale" | "retail" | "repair") ?? "wholesale",
  createdAt: inv.occurredAt || inv.createdAt,
  occurredAt: inv.occurredAt,
  customerName: inv.customerName,
  items: (inv.items || []).map((i) => ({
   name: i.name,
   sku: i.sku,
   price: typeof i.price === "number" ? i.price : Number(i.price) || 0,
   quantity: i.quantity,
   unit: i.unit,
   serialNumbers: i.serialNumbers,
   serialColours: (i as unknown as { serialColours?: Record<string, string> }).serialColours,
   grade: i.grade,
   brand: i.brand,
   colour: i.colour,
   brandModel: i.brandModel,
   capacity: i.capacity,
  })),
  subtotal: inv.subtotal,
  tax: inv.tax,
  taxName: inv.taxName,
  taxRate: inv.taxRate,
  taxType: inv.taxType,
  discount: inv.discount,
  discountType: inv.discountType,
  discountValue: inv.discountValue,
  total: inv.total,
  paymentMethod: inv.paymentMethod,
  payments: inv.payments,
  previousBalance: inv.previousBalance,
  amountDue: inv.amountDue,
 };
}

type RowAction = {
 key: string;
 label: string;
 icon: React.ReactNode;
 onClick: () => void;
 disabled?: boolean;
 destructive?: boolean;
};

function ActionsMenu({ items }: { items: RowAction[] }) {
 const [open, setOpen] = React.useState(false);
 const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);
 const triggerRef = React.useRef<HTMLButtonElement>(null);
 const menuRef = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
  if (!open) return;
  const onDocClick = (e: MouseEvent) => {
   if (
    menuRef.current &&
    !menuRef.current.contains(e.target as Node) &&
    triggerRef.current &&
    !triggerRef.current.contains(e.target as Node)
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

 const toggle = () => {
  const next = !open;
  if (next && triggerRef.current) {
   const rect = triggerRef.current.getBoundingClientRect();
   setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }
  setOpen(next);
 };

 return (
  <>
   <button
    ref={triggerRef}
    type="button"
    onClick={toggle}
    aria-label="Actions"
    aria-haspopup="menu"
    aria-expanded={open}
    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
   >
    <MoreVertical className="w-4 h-4" />
   </button>
   {open && pos && (
    <div
     ref={menuRef}
     role="menu"
     style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 50 }}
     className="min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1"
    >
     {items.map((it) => (
      <button
       key={it.key}
       role="menuitem"
       type="button"
       disabled={it.disabled}
       onClick={() => {
        if (it.disabled) return;
        setOpen(false);
        it.onClick();
       }}
       className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        it.destructive
         ? "text-red-700 hover:bg-red-50"
         : "text-gray-700 hover:bg-gray-50"
       }`}
      >
       <span className="w-4 h-4 inline-flex items-center justify-center">{it.icon}</span>
       <span>{it.label}</span>
      </button>
     ))}
    </div>
   )}
  </>
 );
}

export default function InvoiceOnlineOrderPage() {
 const router = useRouter();
 const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [debouncedSearch, setDebouncedSearch] = useState("");
 const [page, setPage] = useState(1);
 const [total, setTotal] = useState(0);
 const [statusFilter, setStatusFilter] = useState<"active" | "voided" | "all">("active");
 const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);
 const [voidTarget, setVoidTarget] = useState<InvoiceRecord | null>(null);
 const [voidReason, setVoidReason] = useState("");
 const [voiding, setVoiding] = useState(false);
 const [emailTarget, setEmailTarget] = useState<InvoiceRecord | null>(null);
 const [emailTo, setEmailTo] = useState("");
 const [emailSending, setEmailSending] = useState(false);
 const [emailPrefillLoading, setEmailPrefillLoading] = useState(false);
 const [actionError, setActionError] = useState<string | null>(null);
 const [actionSuccess, setActionSuccess] = useState<string | null>(null);
 const [range, setRange] = useState<DashboardRange>("30d");
 const [customFrom, setCustomFrom] = useState("");
 const [customTo, setCustomTo] = useState("");
 const [from, setFrom] = useState(() => toLondonDateKey(new Date()));
 const [to, setTo] = useState(() => toLondonDateKey(new Date()));
 const [exporting, setExporting] = useState(false);
 const { can } = usePermissions();
 const canEdit = can("invoice.edit");
 const canVoid = can("invoice.void");
 const canViewHistorical = can("report.view");

 useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
  return () => clearTimeout(t);
 }, [search]);

 useEffect(() => {
  setPage(1);
 }, [debouncedSearch, statusFilter, from, to]);

 useEffect(() => {
  const dateRange = getSalesDateRange(range, customFrom, customTo, canViewHistorical);
  setFrom(toLondonDateKey(dateRange.fromUtc));
  setTo(toLondonDateKey(dateRange.toUtc));
 }, [range, customFrom, customTo, canViewHistorical]);

 const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
   const res = await invoicesApi.getInvoices({
    page,
    limit: PAGE_SIZE,
    status: statusFilter,
    search: debouncedSearch || undefined,
    from,
    to,
   });
   if (res.success) {
    setInvoices(sortInvoicesByDateDesc(res.data || []));
    setTotal(res.meta?.total ?? (res.data?.length ?? 0));
   } else {
    setInvoices([]);
    setTotal(0);
   }
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load invoices");
   setInvoices([]);
  } finally {
   setLoading(false);
  }
 }, [page, statusFilter, debouncedSearch, from, to]);

 const handleExportExcel = useCallback(async () => {
  setExporting(true);
  setActionError(null);
  try {
   const rows = await invoicesApi.fetchAllInvoicesInRange({
    from,
    to,
    status: statusFilter,
    search: debouncedSearch || undefined,
   });
   if (rows.length === 0) {
    setActionError("No invoices found in the selected date range.");
    return;
   }
   downloadInvoicesExcel(sortInvoicesByDateDesc(rows), from, to);
   setActionSuccess(`Exported ${rows.length} invoice${rows.length === 1 ? "" : "s"} to Excel.`);
  } catch (e) {
   setActionError(e instanceof Error ? e.message : "Failed to export invoices");
  } finally {
   setExporting(false);
  }
 }, [from, to, statusFilter, debouncedSearch]);

 useEffect(() => {
  load();
 }, [load]);

 const handlePrintA4 = useCallback(async (inv: InvoiceRecord) => {
  try {
   await printInvoiceA4(invoiceToPrintable(inv));
  } catch (e) {
   setActionError(e instanceof Error ? e.message : "Print failed");
  }
 }, []);

 const handleDownload = useCallback(async (inv: InvoiceRecord) => {
  try {
   await downloadInvoiceA4(invoiceToPrintable(inv));
  } catch (e) {
   setActionError(e instanceof Error ? e.message : "Download failed");
  }
 }, []);

 const openSendEmail = useCallback(async (inv: InvoiceRecord) => {
  setActionError(null);
  setActionSuccess(null);
  setEmailTarget(inv);
  setEmailTo("");
  setEmailPrefillLoading(true);
  try {
   const customerId =
    typeof inv.customerId === "object" && inv.customerId
     ? (inv.customerId as { _id?: string })._id
     : typeof inv.customerId === "string"
      ? inv.customerId
      : null;
   if (customerId) {
    const res = await customerApi.getById(customerId);
    const email = res?.data?.email?.trim();
    if (email) setEmailTo(email);
   }
  } catch {
   // optional prefill
  } finally {
   setEmailPrefillLoading(false);
  }
 }, []);

 const handleSendInvoiceEmail = useCallback(async () => {
  if (!emailTarget) return;
  const to = emailTo.trim();
  if (!to) return;
  setEmailSending(true);
  setActionError(null);
  try {
   const { base64, filename } = await getInvoiceA4PdfBase64(invoiceToPrintable(emailTarget));
   const res = await invoicesApi.sendInvoiceEmail(emailTarget._id, {
    to,
    pdfBase64: base64,
    filename,
   });
   setEmailTarget(null);
   setEmailTo("");
   setActionSuccess(res.message || `Invoice emailed to ${to}`);
  } catch (e) {
   setActionError(e instanceof Error ? e.message : "Failed to send invoice email");
  } finally {
   setEmailSending(false);
  }
 }, [emailTarget, emailTo]);

 const handlePrintReceipt = useCallback(async (inv: InvoiceRecord) => {
  try {
   await printReceipt80mm(invoiceToPrintable(inv));
  } catch (e) {
   setActionError(e instanceof Error ? e.message : "Receipt print failed");
  }
 }, []);

 const handleConfirmVoid = useCallback(async () => {
  if (!voidTarget) return;
  setVoiding(true);
  setActionError(null);
  try {
   await invoicesApi.voidInvoice(voidTarget._id, voidReason.trim() || undefined);
   setVoidTarget(null);
   setVoidReason("");
   load();
  } catch (e) {
   setActionError(e instanceof Error ? e.message : "Failed to void invoice");
  } finally {
   setVoiding(false);
  }
 }, [voidTarget, voidReason, load]);

 const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
 const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
 const rangeEnd = Math.min(total, page * PAGE_SIZE);

 const rangeLabel =
  range === "today"
   ? "Today"
   : range === "yesterday"
    ? "Yesterday"
    : range === "7d"
     ? "7 days"
     : range === "30d"
      ? "30 days"
      : "Custom";

 const headerRight = useMemo(
  () => (
   <div className="flex items-center gap-2">
    <button
     type="button"
     onClick={handleExportExcel}
     disabled={exporting || loading}
     className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-sm text-green-800 font-medium disabled:opacity-50"
    >
     {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
     Export Excel
    </button>
    <button
     type="button"
     onClick={load}
     disabled={loading}
     className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm text-gray-700 disabled:opacity-50"
    >
     <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
     Refresh
    </button>
    <Link
     href="/create-invoice"
     className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
    >
     <Plus className="w-4 h-4" />
     New Invoice
    </Link>
   </div>
  ),
  [load, loading, handleExportExcel, exporting],
 );

 return (
  <div className="min-h-screen bg-gray-50">
   <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
    <div className="flex items-start justify-between flex-wrap gap-3">
     <div className="flex items-center gap-2.5">
      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
       <Receipt className="w-5 h-5" />
      </div>
      <div>
       <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Invoices</h1>
       <p className="text-xs text-gray-500">Invoices created in the invoice flow — reference series <code className="font-mono">INVC-######</code></p>
      </div>
     </div>
     {headerRight}
    </div>

    {!canViewHistorical && (
     <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 sm:px-4 py-2 text-amber-800 text-xs sm:text-sm">
      {STAFF_SALES_BANNER}
     </div>
    )}

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
     <div className="p-3 sm:p-4 border-b border-gray-200 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
       <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
       {canViewHistorical ? (
        <>
         <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(["today", "yesterday", "7d", "30d", "custom"] as const).map((r) => (
           <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            disabled={loading}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
             range === r ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-white"
            }`}
           >
            {r === "today"
             ? "Today"
             : r === "yesterday"
              ? "Yesterday"
              : r === "7d"
               ? "7 days"
               : r === "30d"
                ? "30 days"
                : "Custom"}
           </button>
          ))}
         </div>
         {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
           <label className="text-xs text-gray-600">From</label>
           <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
           />
           <label className="text-xs text-gray-600">To</label>
           <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
           />
          </div>
         )}
        </>
       ) : (
        <span className="text-sm text-gray-600 font-medium">Today</span>
       )}
       <span className="text-xs text-gray-500">
        {rangeLabel} · {from} → {to}
       </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
       <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by reference or customer name…"
        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
       />
      </div>
      <select
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value as "active" | "voided" | "all")}
       className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
       <option value="active">Active</option>
       <option value="voided">Voided</option>
       <option value="all">All</option>
      </select>
      </div>
     </div>

     {error && (
      <div className="m-3 sm:m-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
       <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
       <span>{error}</span>
      </div>
     )}

     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
         <th className="px-3 sm:px-4 py-2.5">Reference</th>
         <th className="px-3 sm:px-4 py-2.5">Date</th>
         <th className="px-3 sm:px-4 py-2.5">Customer</th>
         <th className="px-3 sm:px-4 py-2.5">Tax</th>
         <th className="px-3 sm:px-4 py-2.5">Payment</th>
         <th className="px-3 sm:px-4 py-2.5 text-right">Total</th>
         <th className="px-3 sm:px-4 py-2.5 text-right">Actions</th>
        </tr>
       </thead>
       <tbody>
        {loading ? (
         Array.from({ length: 6 }).map((_, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-100"}>
           {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-3 sm:px-4 py-3">
             <div className="h-4 w-full max-w-[120px] bg-gray-200 rounded animate-pulse" />
            </td>
           ))}
          </tr>
         ))
        ) : invoices.length === 0 ? (
         <tr>
          <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
           <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
           No invoices found.{" "}
           <Link href="/create-invoice" className="text-blue-600 hover:underline font-medium">
            Create the first one.
           </Link>
          </td>
         </tr>
        ) : (
         invoices.map((inv, idx) => {
          const rowStripe = idx % 2 === 0 ? "bg-white" : "bg-gray-100";
          const taxLabel = (inv as unknown as { taxName?: string; taxRate?: number; taxType?: string }).taxName;
          const taxRate = (inv as unknown as { taxRate?: number }).taxRate ?? 0;
          const taxType = (inv as unknown as { taxType?: string }).taxType ?? "";
          return (
           <tr key={inv._id} className={`${rowStripe} border-b border-gray-100/80 hover:bg-orange-50/80 transition-colors`}>
            <td className="px-3 sm:px-4 py-3 font-mono text-xs font-semibold text-gray-800">{inv.reference}</td>
            <td className="px-3 sm:px-4 py-3 text-gray-600">
             {formatDateLondon(invoiceDisplayDate(inv))}
            </td>
            <td className="px-3 sm:px-4 py-3 text-gray-800">{inv.customerName || "—"}</td>
            <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
             {taxLabel ? (
              <span>
               {taxLabel} <span className="text-gray-400">({taxType === "percentage" ? `${taxRate}%` : `£${taxRate}`})</span>
              </span>
             ) : (
              <span className="text-gray-400">—</span>
             )}
            </td>
            <td className="px-3 sm:px-4 py-3 text-sm text-gray-800">{invoicePaymentTypeLabel(inv)}</td>
            <td className="px-3 sm:px-4 py-3 text-right font-semibold text-gray-900">{formatMoney(inv.total)}</td>
            <td className="px-3 sm:px-4 py-3">
             <div className="flex justify-end">
              <ActionsMenu
               items={[
                {
                 key: "edit",
                 label: inv.status === "voided" ? "Cannot edit voided" : "Edit invoice",
                 icon: <Pencil className="w-4 h-4" />,
                 disabled: !canEdit || inv.status === "voided",
                 onClick: () => router.push(`/edit-invoice/${inv._id}`),
                },
                { key: "view", label: "View", icon: <Eye className="w-4 h-4" />, onClick: () => setViewInvoice(inv) },
                { key: "print", label: "Print invoice (A4)", icon: <Printer className="w-4 h-4" />, onClick: () => handlePrintA4(inv) },
                { key: "download", label: "Download PDF", icon: <Download className="w-4 h-4" />, onClick: () => handleDownload(inv) },
                {
                 key: "email",
                 label: "Email invoice (PDF)",
                 icon: <Mail className="w-4 h-4" />,
                 onClick: () => openSendEmail(inv),
                },
                { key: "receipt", label: "Print receipt (80mm)", icon: <FileText className="w-4 h-4" />, onClick: () => handlePrintReceipt(inv) },
                {
                 key: "void",
                 label: inv.status === "voided" ? "Already voided" : "Void invoice",
                 icon: <Trash2 className="w-4 h-4" />,
                 destructive: true,
                 disabled: !canVoid || inv.status === "voided",
                 onClick: () => {
                  setActionError(null);
                  setVoidReason("");
                  setVoidTarget(inv);
                 },
                },
               ]}
              />
             </div>
            </td>
           </tr>
          );
         })
        )}
       </tbody>
      </table>
     </div>

     <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-600">
      <div>
       {loading ? (
        <span className="inline-flex items-center gap-1">
         <Loader2 className="w-3 h-3 animate-spin" />
         Loading…
        </span>
       ) : (
        <span>
         Showing <b>{rangeStart}</b>–<b>{rangeEnd}</b> of <b>{total}</b>
        </span>
       )}
      </div>
      <div className="inline-flex items-center gap-1">
       <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
       >
        <ChevronLeft className="w-3.5 h-3.5" />
        Prev
       </button>
       <span className="px-2">
        Page <b>{page}</b> / {totalPages}
       </span>
       <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
       >
        Next
        <ChevronRight className="w-3.5 h-3.5" />
       </button>
      </div>
     </div>
    </div>
   </div>

   {actionError && (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm flex items-start gap-2 p-3 rounded-lg bg-red-600 text-white shadow-lg">
     <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
     <span className="text-sm flex-1">{actionError}</span>
     <button onClick={() => setActionError(null)} className="p-0.5 hover:bg-red-700 rounded">
      <X className="w-3.5 h-3.5" />
     </button>
    </div>
   )}

   {actionSuccess && (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm flex items-start gap-2 p-3 rounded-lg bg-green-600 text-white shadow-lg">
     <Mail className="w-4 h-4 mt-0.5 shrink-0" />
     <span className="text-sm flex-1">{actionSuccess}</span>
     <button onClick={() => setActionSuccess(null)} className="p-0.5 hover:bg-green-700 rounded">
      <X className="w-3.5 h-3.5" />
     </button>
    </div>
   )}

   {viewInvoice && (
    <ViewInvoiceModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} canEdit={canEdit} />
   )}

   {voidTarget && (
    <VoidInvoiceModal
     invoice={voidTarget}
     reason={voidReason}
     onReasonChange={setVoidReason}
     loading={voiding}
     onCancel={() => {
      setVoidTarget(null);
      setVoidReason("");
     }}
     onConfirm={handleConfirmVoid}
    />
   )}

   {emailTarget && (
    <SendInvoiceEmailModal
     invoice={emailTarget}
     email={emailTo}
     onEmailChange={setEmailTo}
     loading={emailSending}
     prefillLoading={emailPrefillLoading}
     onCancel={() => {
      if (emailSending) return;
      setEmailTarget(null);
      setEmailTo("");
     }}
     onSend={handleSendInvoiceEmail}
    />
   )}
  </div>
 );
}

function ViewInvoiceModal({
 invoice,
 onClose,
 canEdit,
}: {
 invoice: InvoiceRecord;
 onClose: () => void;
 canEdit: boolean;
}) {
 const taxName = (invoice as unknown as { taxName?: string }).taxName;
 const taxRate = (invoice as unknown as { taxRate?: number }).taxRate ?? 0;
 const taxType = (invoice as unknown as { taxType?: string }).taxType ?? "";
 return (
  <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 overflow-auto">
   <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
     <div>
      <h3 className="text-base font-semibold text-gray-900">
       Invoice <span className="font-mono">{invoice.reference}</span>
      </h3>
      <p className="text-xs text-gray-500">
       Invoice date: {formatDateLondon(invoiceDisplayDate(invoice))}
       {invoice.occurredAt && invoice.createdAt && (
        <span className="block text-[10px] text-gray-400 mt-0.5">
         Created {formatOccurredAt(null, invoice.createdAt)}
        </span>
       )}
      </p>
     </div>
     <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
      <X className="w-4 h-4" />
     </button>
    </div>
    <div className="p-4 space-y-3 text-sm">
     <div className="grid grid-cols-2 gap-3">
      <div>
       <p className="text-xs text-gray-500">Customer</p>
       <p className="font-medium text-gray-900">{invoice.customerName || "—"}</p>
      </div>
      <div>
       <p className="text-xs text-gray-500">Payment</p>
       <p className="font-medium text-gray-900">{invoicePaymentTypeLabel(invoice)}</p>
      </div>
      <div>
       <p className="text-xs text-gray-500">Status</p>
       <p className="text-gray-900 capitalize">{invoice.status || "active"}</p>
      </div>
      <div>
       <p className="text-xs text-gray-500">Tax</p>
       <p className="text-gray-900">
        {taxName ? `${taxName} (${taxType === "percentage" ? `${taxRate}%` : `£${taxRate}`})` : "—"}
       </p>
      </div>
     </div>
     <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
       <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
        <tr>
         <th className="px-3 py-2 text-left">Item</th>
         <th className="px-3 py-2 text-right">Qty</th>
         <th className="px-3 py-2 text-right">Price</th>
        </tr>
       </thead>
       <tbody>
        {(invoice.items || []).map((it, idx) => (
         <tr key={idx} className="border-t border-gray-100">
          <td className="px-3 py-2">
           <div className="font-medium text-gray-900">{it.name}</div>
           {it.serialNumbers && it.serialNumbers.length > 0 && (
            <div className="text-[11px] font-mono text-gray-500">{it.serialNumbers.join(", ")}</div>
           )}
          </td>
          <td className="px-3 py-2 text-right">{it.quantity}</td>
          <td className="px-3 py-2 text-right">
           {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(it.price) || 0)}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
     <div className="border-t pt-3 space-y-1 text-right">
      <div className="text-xs text-gray-600">
       Subtotal: <span className="font-medium text-gray-900">{formatMoney(invoice.subtotal)}</span>
      </div>
      {invoice.tax > 0 && (
       <div className="text-xs text-gray-600">
        Tax: <span className="font-medium text-gray-900">{formatMoney(invoice.tax)}</span>
       </div>
      )}
      {invoice.discount > 0 && (
       <div className="text-xs text-gray-600">
        Discount: <span className="font-medium text-gray-900">-{formatMoney(invoice.discount)}</span>
       </div>
      )}
      <div className="text-base font-bold text-gray-900">
       Total: <span className="text-blue-700">{formatMoney(invoice.total)}</span>
      </div>
     </div>
    </div>
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50 rounded-b-xl">
     {canEdit && invoice.status !== "voided" && (
      <Link
       href={`/edit-invoice/${invoice._id}`}
       className="mr-auto text-sm font-medium text-blue-600 hover:text-blue-800"
      >
       Edit invoice
      </Link>
     )}
     <button onClick={onClose} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-white">
      Close
     </button>
    </div>
   </div>
  </div>
 );
}

function SendInvoiceEmailModal({
 invoice,
 email,
 onEmailChange,
 loading,
 prefillLoading,
 onCancel,
 onSend,
}: {
 invoice: InvoiceRecord;
 email: string;
 onEmailChange: (v: string) => void;
 loading: boolean;
 prefillLoading: boolean;
 onCancel: () => void;
 onSend: () => void;
}) {
 return (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
   <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
     <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
      <Mail className="w-4 h-4 text-blue-600" />
      Email invoice <span className="font-mono">{invoice.reference}</span>
     </h3>
     <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50"
     >
      <X className="w-4 h-4" />
     </button>
    </div>
    <form
     className="p-4 space-y-3 text-sm"
     onSubmit={(e) => {
      e.preventDefault();
      onSend();
     }}
    >
     <p className="text-gray-600">
      Sends the same A4 PDF as <strong>Download PDF</strong> to the recipient. SMTP must be configured under{" "}
      <strong>Settings → Email</strong>.
     </p>
     <label className="block">
      <span className="text-xs font-medium text-gray-600 uppercase">Recipient email</span>
      <div className="relative mt-1">
       <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
       <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        disabled={loading || prefillLoading}
        placeholder="customer@example.com"
        className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
       />
      </div>
      {prefillLoading && (
       <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Looking up customer email…
       </p>
      )}
     </label>
     <div className="text-xs text-gray-500">
      Customer: <span className="font-medium text-gray-800">{invoice.customerName || "—"}</span>
      {" · "}
      Total: <span className="font-medium text-gray-800">{formatMoney(invoice.total)}</span>
     </div>
    </form>
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50 rounded-b-xl">
     <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-white disabled:opacity-50"
     >
      Cancel
     </button>
     <button
      type="button"
      onClick={onSend}
      disabled={loading || prefillLoading || !email.trim()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
     >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {loading ? "Sending…" : "Send email"}
     </button>
    </div>
   </div>
  </div>
 );
}

function VoidInvoiceModal({
 invoice,
 reason,
 onReasonChange,
 loading,
 onCancel,
 onConfirm,
}: {
 invoice: InvoiceRecord;
 reason: string;
 onReasonChange: (v: string) => void;
 loading: boolean;
 onCancel: () => void;
 onConfirm: () => void;
}) {
 return (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
   <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
    <div className="p-4 border-b border-gray-200">
     <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
      <Trash2 className="w-4 h-4 text-red-600" />
      Void invoice <span className="font-mono">{invoice.reference}</span>?
     </h3>
    </div>
    <div className="p-4 space-y-3 text-sm">
     <p className="text-gray-600">
      The invoice will be marked as voided but remains in the system for audit. Total{" "}
      <b>{formatMoney(invoice.total)}</b> for {invoice.customerName || "—"}.
     </p>
     <label className="block">
      <span className="text-xs font-medium text-gray-600 uppercase">Reason (optional)</span>
      <textarea
       value={reason}
       onChange={(e) => onReasonChange(e.target.value)}
       rows={2}
       className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
       placeholder="Why is this being voided?"
      />
     </label>
    </div>
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50 rounded-b-xl">
     <button
      onClick={onCancel}
      disabled={loading}
      className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-white disabled:opacity-50"
     >
      Cancel
     </button>
     <button
      onClick={onConfirm}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
     >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      Void invoice
     </button>
    </div>
   </div>
  </div>
 );
}

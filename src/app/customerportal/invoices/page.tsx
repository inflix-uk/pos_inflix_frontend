"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  buildA4InvoicePdfUrl,
  type SaleForPrint,
  type InvoiceSettings,
  type LocationForHeader,
} from "@/lib/invoicePrint";
import { mergeReceiptPrinterSalesPrintOptions } from "@/lib/receiptPrinterPrintOptions";
import { mergeReceiptPrinterRepairPrintOptions } from "@/lib/receiptPrinterPrintOptions";
import { mergeRepairLabelPrintSettings } from "@/lib/repairLabelPrintConfig";
import { mergeInvoicePdfPrintOptions } from "@/lib/invoicePdfPrintOptions";
import { mergeBusinessInvoicePdfPrintOptions } from "@/lib/businessInvoicePdfPrintOptions";
import { normalizeA4InvoiceTemplate } from "@/lib/a4InvoiceTemplate";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDateShort = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface InvoiceItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Invoice {
  _id: string;
  reference: string;
  type: string;
  date: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paid: number;
  amountDue: number;
  paymentMethod: string;
  itemCount: number;
  items: InvoiceItem[];
}

function getPortalHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("cp_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CustomerPortalInvoices() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("cp_token");
    if (!token) {
      router.push("/customerportal");
    }
  }, [router]);

  const fetchInvoices = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/customer-portal/invoices?page=${p}&limit=20`, {
        headers: getPortalHeaders(),
      });
      if (res.status === 401) {
        localStorage.removeItem("cp_token");
        localStorage.removeItem("cp_customer");
        router.push("/customerportal");
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load invoices");
      setInvoices(data.data);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInvoices(1);
  }, [fetchInvoices]);

  const getPaymentStatus = (inv: Invoice) => {
    if (inv.amountDue <= 0 && inv.paid >= inv.total) return { label: "Paid", color: "bg-green-50 text-green-700" };
    if (inv.paid > 0) return { label: "Partial", color: "bg-amber-50 text-amber-700" };
    return { label: "Unpaid", color: "bg-red-50 text-red-700" };
  };

  const handleDownloadInvoice = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(invoiceId);
    try {
      const res = await fetch(`${API_BASE}/api/customer-portal/invoices/${invoiceId}/print-data`, {
        headers: getPortalHeaders(),
      });
      if (res.status === 401) {
        localStorage.removeItem("cp_token");
        localStorage.removeItem("cp_customer");
        router.push("/customerportal");
        return;
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load invoice data");

      const { sale, location, settings: srv, variantAttributeSlugsOrderBySku } = json.data;

      const saleForPrint: SaleForPrint = {
        _id: sale._id,
        reference: sale.reference || "",
        type: sale.type || "retail",
        createdAt: sale.occurredAt || sale.createdAt,
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",
        customerEmail: sale.customerEmail || "",
        items: (sale.items || []).map((item: Record<string, unknown>) => ({
          name: (item.name as string) || "",
          sku: (item.sku as string) || "",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          unit: (item.unit as string) || "piece",
          serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
          grade: (item.grade as string) || "",
          brand: (item.brand as string) || "",
          colour: (item.colour as string) || "",
          brandModel: (item.brandModel as string) || "",
          capacity: (item.capacity as string) || "",
        })),
        subtotal: Number(sale.subtotal) || 0,
        tax: Number(sale.tax) || 0,
        taxName: sale.taxName ? String(sale.taxName) : undefined,
        taxRate: sale.taxRate != null ? Number(sale.taxRate) : undefined,
        taxType:
          sale.taxType === "flat" ||
          sale.taxType === "fixed" ||
          sale.taxType === "percentage"
            ? sale.taxType
            : sale.taxType === ""
              ? ""
              : undefined,
        discount: Number(sale.discount) || 0,
        total: Number(sale.total) || 0,
        paymentMethod: sale.paymentMethod || "",
        payments: sale.payments || {},
        previousBalance: sale.previousBalance,
        amountDue: sale.amountDue,
        balanceAfter: sale.balanceAfter,
      };

      const invoiceSettings: InvoiceSettings = {
        about: {
          ...(srv.about || {}),
          companyNumber: srv.about?.companyNumber || "",
          vatNumber: srv.about?.vatNumber || "",
        },
        notesTerms: {
          pdfSalesTerms: srv.notesTerms?.pdfSalesTerms || "",
          paymentNote: srv.notesTerms?.paymentNote || "",
          receiptPrinterSalesTerms: "",
          receiptPrinterRepairTerms: "",
          receiptPrinterSalesPrint: mergeReceiptPrinterSalesPrintOptions(undefined),
          receiptPrinterRepairPrint: mergeReceiptPrinterRepairPrintOptions(undefined),
          repairLabelPrint: mergeRepairLabelPrintSettings(undefined),
          invoicePdfPrint: mergeInvoicePdfPrintOptions(srv.notesTerms?.invoicePdfPrint),
          businessInvoicePdfPrint: mergeBusinessInvoicePdfPrintOptions(
            srv.notesTerms?.businessInvoicePdfPrint
          ),
          businessInvoiceTerms: srv.notesTerms?.businessInvoiceTerms || "",
          a4InvoiceTemplate: normalizeA4InvoiceTemplate(srv.notesTerms?.a4InvoiceTemplate),
        },
        bankAccounts: srv.bankAccounts || [],
        defaultTax: null,
      };

      const loc: LocationForHeader | null = location || null;

      const url = await buildA4InvoicePdfUrl(
        saleForPrint,
        invoiceSettings,
        loc,
        variantAttributeSlugsOrderBySku || {}
      );

      const a = document.createElement("a");
      a.href = url;
      const ref = String(sale.reference || "invoice").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "invoice";
      a.download = `invoice-${ref}.pdf`;
      a.rel = "noopener";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-500">Total Invoices</p>
        <p className="text-3xl font-bold text-gray-900">{total}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-sm text-gray-500">Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No invoices found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-10 px-4 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => {
                    const isExpanded = expandedInvoice === inv._id;
                    const status = getPaymentStatus(inv);
                    return (
                      <React.Fragment key={inv._id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedInvoice(isExpanded ? null : inv._id)}
                        >
                          <td className="px-4 py-3 text-gray-400">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {inv.reference}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDateShort(inv.date)}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                              {inv.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {inv.itemCount} item{inv.itemCount !== 1 ? "s" : ""}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                            {formatMoney(inv.total)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                            {formatMoney(inv.paid)}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => handleDownloadInvoice(inv._id, e)}
                              disabled={downloadingId === inv._id}
                              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded disabled:opacity-50"
                              title="Download invoice (PDF)"
                            >
                              {downloadingId === inv._id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                            </button>
                          </td>
                        </tr>
                        {/* Expanded items */}
                        {isExpanded && inv.items.length > 0 && (
                          <tr>
                            <td colSpan={9} className="px-0 py-0">
                              <div className="bg-gray-50 border-y border-gray-100 px-12 py-3">
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <th className="text-left text-xs font-medium text-gray-400 pb-2">Product</th>
                                      <th className="text-left text-xs font-medium text-gray-400 pb-2">SKU</th>
                                      <th className="text-center text-xs font-medium text-gray-400 pb-2">Qty</th>
                                      <th className="text-right text-xs font-medium text-gray-400 pb-2">Price</th>
                                      <th className="text-right text-xs font-medium text-gray-400 pb-2">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {inv.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="py-1.5 text-sm text-gray-700">{item.name}</td>
                                        <td className="py-1.5 text-sm text-gray-500">{item.sku || "\u2014"}</td>
                                        <td className="py-1.5 text-sm text-gray-600 text-center">{item.quantity}</td>
                                        <td className="py-1.5 text-sm text-gray-600 text-right">{formatMoney(item.price)}</td>
                                        <td className="py-1.5 text-sm font-medium text-gray-900 text-right">
                                          {formatMoney(item.price * item.quantity)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="border-t border-gray-200">
                                    {inv.discount > 0 && (
                                      <tr>
                                        <td colSpan={4} className="pt-2 text-sm text-gray-500 text-right">Discount</td>
                                        <td className="pt-2 text-sm text-green-600 text-right">-{formatMoney(inv.discount)}</td>
                                      </tr>
                                    )}
                                    {inv.tax > 0 && (
                                      <tr>
                                        <td colSpan={4} className="pt-1 text-sm text-gray-500 text-right">Tax</td>
                                        <td className="pt-1 text-sm text-gray-600 text-right">{formatMoney(inv.tax)}</td>
                                      </tr>
                                    )}
                                    <tr>
                                      <td colSpan={4} className="pt-1 text-sm font-semibold text-gray-700 text-right">Total</td>
                                      <td className="pt-1 text-sm font-bold text-gray-900 text-right">{formatMoney(inv.total)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {pages} ({total} invoices)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchInvoices(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchInvoices(page + 1)}
                    disabled={page >= pages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import * as XLSX from "xlsx";
import {
  invoiceDisplayDate,
  invoicePaymentTypeLabel,
  type InvoiceRecord,
} from "@/app/(routes)/invoice-online-order/service/invoicesApi";
import { formatDateLondon, formatDateTimeLondon } from "@/lib/dateUtils";

const round2 = (n: number) => Math.round(n * 100) / 100;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function customerIdString(inv: InvoiceRecord): string {
  const c = inv.customerId;
  if (!c) return "";
  if (typeof c === "string") return c;
  if (typeof c === "object" && "_id" in c && c._id) return String(c._id);
  return "";
}

function locationIdString(inv: InvoiceRecord): string {
  const loc = inv.locationId;
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && "_id" in loc && loc._id) return String(loc._id);
  return "";
}

function soldByString(inv: InvoiceRecord): string {
  const soldBy = (inv as { soldBy?: string | { _id?: string } }).soldBy;
  if (!soldBy) return "";
  if (typeof soldBy === "string") return soldBy;
  if (typeof soldBy === "object" && soldBy._id) return String(soldBy._id);
  return "";
}

function computeInvoiceCost(inv: InvoiceRecord): { cost: number; costMissing: boolean } {
  const items = inv.items || [];
  let cost = 0;
  let costMissing = false;
  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const unitCost = Number((item as { unit_cost_at_sale?: number }).unit_cost_at_sale) || 0;
    if ((item as { cost_missing?: boolean }).cost_missing) costMissing = true;
    cost += unitCost * qty;
  }
  return { cost: round2(cost), costMissing };
}

function itemsSummary(inv: InvoiceRecord): string {
  return (inv.items || [])
    .map((i) => {
      const qty = Number(i.quantity) || 0;
      const sku = i.sku ? ` (${i.sku})` : "";
      return `${qty}x ${i.name || "—"}${sku}`;
    })
    .join("; ");
}

function allSerials(inv: InvoiceRecord): string {
  const serials: string[] = [];
  for (const item of inv.items || []) {
    if (Array.isArray(item.serialNumbers)) {
      serials.push(...item.serialNumbers.filter(Boolean));
    }
  }
  return serials.join(", ");
}

function invoiceToExportRow(inv: InvoiceRecord) {
  const { cost, costMissing } = computeInvoiceCost(inv);
  const payments = inv.payments || {};
  const taxType = (inv as { taxType?: string }).taxType ?? "";
  const taxRate = (inv as { taxRate?: number }).taxRate ?? 0;

  return {
    Date: formatDateLondon(invoiceDisplayDate(inv)),
    Reference: inv.reference || "",
    Status: inv.status || "active",
    Type: inv.type || "",
    Customer: inv.customerName || "",
    "Customer ID": customerIdString(inv),
    Cost: cost,
    "Cost Missing": costMissing ? "Yes" : "No",
    Subtotal: round2(Number(inv.subtotal) || 0),
    Discount: round2(Number(inv.discount) || 0),
    "Discount Type": inv.discountType || "",
    "Discount Value": round2(Number(inv.discountValue) || 0),
    "Sales Tax": round2(Number(inv.tax) || 0),
    "Tax Name": (inv as { taxName?: string }).taxName || "",
    "Tax Rate": taxRate,
    "Tax Type": taxType,
    Total: round2(Number(inv.total) || 0),
    "Previous Balance": round2(Number(inv.previousBalance) || 0),
    "Amount Due": round2(Number(inv.amountDue) || 0),
    Payment: invoicePaymentTypeLabel(inv),
    Cash: round2(Number(payments.cash) || 0),
    Card: round2(Number(payments.card) || 0),
    Bank: round2(Number(payments.bank) || 0),
    Credit: round2(Number(payments.credit) || 0),
    "Bank Account": (inv as { bankAccount?: string }).bankAccount || "",
    "Location ID": locationIdString(inv),
    "Sold By": soldByString(inv),
    Note: inv.note || "",
    "Created At": formatDateTimeLondon(inv.createdAt),
    "Updated At": formatDateTimeLondon(inv.updatedAt),
    "Voided At": formatDateTimeLondon((inv as { voidedAtUtc?: string }).voidedAtUtc),
    "Void Reason": (inv as { voidReason?: string }).voidReason || "",
    "Item Count": (inv.items || []).length,
    "Items Summary": itemsSummary(inv),
    "All Serials": allSerials(inv),
  };
}

export function downloadInvoicesExcel(
  invoices: InvoiceRecord[],
  from: string,
  to: string,
) {
  const data = invoices.map(invoiceToExportRow);
  const ws = XLSX.utils.json_to_sheet(data);

  const headers = Object.keys(data[0] ?? {});
  ws["!cols"] = headers.map((h) => {
    let max = h.length;
    for (const row of data) {
      const len = String((row as Record<string, string | number>)[h] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(max + 2, 48) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invoices");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `invoices-${from}_to_${to}.xlsx`);
}

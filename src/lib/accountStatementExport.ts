import { jsPDF } from "jspdf";
import type { StatementLine } from "@/app/(routes)/accounts/service/accountsApi";

export type AccountStatementLine = StatementLine;
export type StatementAccountType = "Customer" | "Supplier";

function slugifyFilenamePart(s: string): string {
  return (s || "account")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "account";
}

function csvEscape(cell: string): string {
  const needsQuote = /[",\r\n]/.test(cell);
  const escaped = cell.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

const MANUAL_PAYMENT_LABEL = /^Payment (cash|card|bank)$/i;

/** What a ledger line was, e.g. "Invoice INV-000002" or "Payment received (cash) · INV-000002". */
export function describeStatementLine(line: AccountStatementLine): string {
  const label = (line.referenceLabel || "").trim();
  const method = line.paymentMethod ? ` (${line.paymentMethod})` : "";
  switch (line.type) {
    case "sale":
      // Plain invoice number → "Invoice INV-…"; adjustments already describe themselves.
      return !label ? "Invoice" : /\s/.test(label) ? label : `Invoice ${label}`;
    case "purchase":
      return label ? `Purchase ${label}` : "Purchase";
    case "payment_in": {
      const onInvoice = label.match(/^(.*) payment$/);
      if (onInvoice) return `Payment received${method} · ${onInvoice[1]}`;
      if (!label || MANUAL_PAYMENT_LABEL.test(label)) return `Payment received${method}`;
      return label;
    }
    case "payment_out":
      if (!label || MANUAL_PAYMENT_LABEL.test(label)) return `Payment made${method}`;
      return `Payment made${method} · ${label}`;
    case "refund":
      return `Refund paid${method}`;
    case "opening_balance":
      return label || "Opening balance";
    default:
      return label || line.type.replace(/_/g, " ");
  }
}

/** Running-balance cell. Customers in credit / suppliers owing us are shown with a CR / DR suffix. */
export function formatStatementBalance(
  n: number,
  accountType: StatementAccountType,
  formatMoney: (n: number) => string
): string {
  if (Math.abs(n) < 0.005) return formatMoney(0);
  if (n > 0) return formatMoney(n);
  return `${formatMoney(-n)} ${accountType === "Customer" ? "CR" : "DR"}`;
}

function formatColumnAmount(n: number, formatMoney: (n: number) => string): string {
  return n > 0.004 ? formatMoney(n) : "";
}

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

export type AccountStatementPdfParams = {
  accountTypeLabel: StatementAccountType;
  accountName: string;
  balanceLabel: string;
  balanceFormatted: string;
  periodDescription: string;
  openingBalance: number;
  closingBalance: number;
  totals: { debit: number; credit: number };
  lines: AccountStatementLine[];
  formatDate: (d: string) => string;
  formatMoney: (n: number) => string;
};

export function downloadAccountStatementCsv(params: AccountStatementPdfParams) {
  const bal = (n: number) => formatStatementBalance(n, params.accountTypeLabel, params.formatMoney);
  const amt = (n: number) => formatColumnAmount(n, params.formatMoney);
  const rows: string[][] = [
    ["Account statement"],
    ["Type", params.accountTypeLabel],
    ["Name", params.accountName],
    [params.balanceLabel, params.balanceFormatted],
    ["Period", params.periodDescription],
    [],
    ["Date", "Description", "Notes", "Debit", "Credit", "Balance"],
    ["", "Opening balance", "", "", "", bal(params.openingBalance)],
  ];
  for (const line of params.lines) {
    rows.push([
      params.formatDate(line.date),
      describeStatementLine(line),
      line.note?.trim() || "",
      amt(line.debit),
      amt(line.credit),
      bal(line.balance),
    ]);
  }
  rows.push([
    "",
    "Total",
    "",
    params.formatMoney(params.totals.debit),
    params.formatMoney(params.totals.credit),
    bal(params.closingBalance),
  ]);
  const csv = rows.map((r) => r.map((c) => csvEscape(String(c))).join(",")).join("\r\n");
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `account-statement-${slugifyFilenamePart(params.accountName)}-${stamp}.csv`);
}

/** Build the same PDF used for download / email (caller may save, blob output, etc.). */
export function buildAccountStatementPdfDoc(params: AccountStatementPdfParams): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  const bal = (n: number) => formatStatementBalance(n, params.accountTypeLabel, params.formatMoney);
  const amt = (n: number) => formatColumnAmount(n, params.formatMoney);

  const colDate = margin;
  const colDesc = margin + 32;
  const colBalance = pageW - margin;
  const colCredit = colBalance - 30;
  const colDebit = colCredit - 26;
  const descMaxW = colDebit - 24 - colDesc;
  const lineHeight = 4;

  const drawTableHeader = () => {
    doc.setFillColor(35, 35, 35);
    doc.rect(margin, y - 4.5, pageW - margin * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Date", colDate + 1.5, y);
    doc.text("Description", colDesc, y);
    doc.text("Debit", colDebit, y, { align: "right" });
    doc.text("Credit", colCredit, y, { align: "right" });
    doc.text("Balance", colBalance - 1.5, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 7;
  };

  const newPageIfNeeded = (needed: number) => {
    const h = doc.internal.pageSize.getHeight();
    if (y + needed > h - 12) {
      doc.addPage();
      y = 16;
      drawTableHeader();
    }
  };

  const rule = () => {
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 3, pageW - margin, y - 3);
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Account statement", margin, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${params.accountTypeLabel}: ${params.accountName}`, margin, y);
  y += 6;
  doc.text(`${params.balanceLabel}: ${params.balanceFormatted}`, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Period: ${params.periodDescription}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  drawTableHeader();

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Opening balance", colDesc, y);
  doc.text(bal(params.openingBalance), colBalance - 1.5, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += lineHeight + 2;

  for (const line of params.lines) {
    const descLines: string[] = doc.splitTextToSize(describeStatementLine(line), descMaxW);
    const note = line.note?.trim();
    const noteLines: string[] = note ? doc.splitTextToSize(note, descMaxW) : [];
    const rowH = (descLines.length + noteLines.length) * lineHeight + 2;
    newPageIfNeeded(rowH + 2);
    rule();

    doc.text(params.formatDate(line.date), colDate + 1.5, y);
    descLines.forEach((t, i) => doc.text(t, colDesc, y + i * lineHeight));
    if (noteLines.length) {
      doc.setTextColor(110, 110, 110);
      noteLines.forEach((t, i) => doc.text(t, colDesc, y + (descLines.length + i) * lineHeight));
      doc.setTextColor(0, 0, 0);
    }
    doc.text(amt(line.debit), colDebit, y, { align: "right" });
    doc.text(amt(line.credit), colCredit, y, { align: "right" });
    doc.text(bal(line.balance), colBalance - 1.5, y, { align: "right" });
    y += rowH;
  }

  if (params.lines.length === 0) {
    newPageIfNeeded(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("No entries in this period.", colDesc, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += lineHeight + 2;
  }

  newPageIfNeeded(10);
  doc.setDrawColor(35, 35, 35);
  doc.setLineWidth(0.4);
  doc.line(margin, y - 3, pageW - margin, y - 3);
  y += 1;
  doc.setFont("helvetica", "bold");
  doc.text("Total", colDesc, y);
  doc.text(params.formatMoney(params.totals.debit), colDebit, y, { align: "right" });
  doc.text(params.formatMoney(params.totals.credit), colCredit, y, { align: "right" });
  doc.text(bal(params.closingBalance), colBalance - 1.5, y, { align: "right" });
  doc.setFont("helvetica", "normal");

  return doc;
}

export function accountStatementPdfFilename(accountName: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `account-statement-${slugifyFilenamePart(accountName)}-${stamp}.pdf`;
}

export function downloadAccountStatementPdf(params: AccountStatementPdfParams) {
  const doc = buildAccountStatementPdfDoc(params);
  doc.save(accountStatementPdfFilename(params.accountName));
}

/** Raw base64 (no data: prefix) for attaching to email API. */
export function getAccountStatementPdfBase64(params: AccountStatementPdfParams): {
  base64: string;
  filename: string;
} {
  const doc = buildAccountStatementPdfDoc(params);
  const filename = accountStatementPdfFilename(params.accountName);
  const dataUri = doc.output("datauristring");
  const comma = dataUri.indexOf(",");
  const base64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
  return { base64, filename };
}

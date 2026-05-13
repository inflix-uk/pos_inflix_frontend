import { jsPDF } from "jspdf";
import type { CustomerStatementLine, SupplierStatementLine } from "@/app/(routes)/accounts/service/accountsApi";

export type AccountStatementLine = CustomerStatementLine | SupplierStatementLine;

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

function lineTypeLabel(line: AccountStatementLine): string {
  const base = line.type.replace(/_/g, " ");
  let out = base.charAt(0).toUpperCase() + base.slice(1);
  if (line.type === "sale" && line.isEdited) out += " (Edited)";
  if (line.paymentMethod) out += ` (${line.paymentMethod})`;
  return out;
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

export function downloadAccountStatementCsv(params: {
  accountTypeLabel: "Customer" | "Supplier";
  accountName: string;
  balanceLabel: string;
  balanceFormatted: string;
  periodDescription: string;
  lines: AccountStatementLine[];
  formatDate: (d: string) => string;
  displayAmount: (amount: number) => number;
  formatMoney: (n: number) => string;
}) {
  const rows: string[][] = [
    ["Account statement"],
    ["Type", params.accountTypeLabel],
    ["Name", params.accountName],
    [params.balanceLabel, params.balanceFormatted],
    ["Period", params.periodDescription],
    [],
    ["Date", "Type", "Reference", "Amount", "Note"],
  ];
  for (const line of params.lines) {
    const amt = params.displayAmount(line.amount);
    const amtStr = `${amt >= 0 ? "+" : ""}${params.formatMoney(amt)}`;
    rows.push([
      params.formatDate(line.date),
      lineTypeLabel(line),
      line.referenceLabel || "—",
      amtStr,
      line.note?.trim() || "",
    ]);
  }
  const csv = rows.map((r) => r.map((c) => csvEscape(String(c))).join(",")).join("\r\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `account-statement-${slugifyFilenamePart(params.accountName)}-${stamp}.csv`);
}

export type AccountStatementPdfParams = {
  accountTypeLabel: "Customer" | "Supplier";
  accountName: string;
  balanceLabel: string;
  balanceFormatted: string;
  periodDescription: string;
  lines: AccountStatementLine[];
  formatDate: (d: string) => string;
  displayAmount: (amount: number) => number;
  formatMoney: (n: number) => string;
};

/** Build the same PDF used for download / email (caller may save, blob output, etc.). */
export function buildAccountStatementPdfDoc(params: AccountStatementPdfParams): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  const newPageIfNeeded = (needed: number) => {
    const h = doc.internal.pageSize.getHeight();
    if (y + needed > h - 12) {
      doc.addPage();
      y = 16;
    }
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

  const colDate = margin;
  const colType = margin + 34;
  const colRef = margin + 72;
  const colAmt = pageW - margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  newPageIfNeeded(8);
  doc.text("Date", colDate, y);
  doc.text("Type", colType, y);
  doc.text("Reference", colRef, y);
  doc.text("Amount", colAmt, y, { align: "right" });
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  const refMaxW = colAmt - colRef - 22;
  const lineHeight = 4.0;

  for (const line of params.lines) {
    const amt = params.displayAmount(line.amount);
    const amtStr = `${amt >= 0 ? "+" : ""}${params.formatMoney(amt)}`;
    const dateStr = params.formatDate(line.date);
    const typeStr = lineTypeLabel(line);
    const refRaw = line.referenceLabel || "—";
    const refLines = doc.splitTextToSize(refRaw, refMaxW);
    const typeLines = doc.splitTextToSize(typeStr, 32);
    const n = Math.max(typeLines.length, refLines.length, 1);

    newPageIfNeeded(n * lineHeight + 8);

    doc.text(dateStr, colDate, y);
    doc.text(amtStr, colAmt, y, { align: "right" });
    typeLines.forEach((t: string, i: number) => doc.text(t, colType, y + i * lineHeight));
    refLines.forEach((t: string, i: number) => doc.text(t, colRef, y + i * lineHeight));
    y += n * lineHeight + 1.5;
  }

  if (params.lines.length === 0) {
    newPageIfNeeded(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("No ledger entries.", margin, y);
    doc.setTextColor(0, 0, 0);
  }

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

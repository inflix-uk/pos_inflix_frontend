import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { StockViewRow } from "@/app/(routes)/stock/view/types";

/* ── helpers ─────────────────────────────────────── */

function empty(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return "-";
  if (typeof v === "string" && !v.trim()) return "-";
  if (typeof v === "number" && Number.isNaN(v)) return "-";
  return String(v);
}

function formatPrice(row: StockViewRow, value: number): string {
  if (value == null || Number.isNaN(value)) return "-";
  const prefix = row.currency ? `${row.currency} ` : "";
  return `${prefix}${value}`;
}

function formatMoneyAmount(value: number, currency?: string): string {
  if (!Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  const prefix = currency ? `${currency} ` : "";
  return `${prefix}${rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Qty for export: 1 per serial/IMEI row; stored quantity for non-serial. */
export function getExportQty(row: StockViewRow): number {
  if (row.isSerialProduct) return 1;
  const q = Number(row.quantity);
  return Number.isFinite(q) ? q : 0;
}

/** Cost stock value (qty × purchase/cost price) — same as inventory total on the products page. */
export function getExportStockValue(row: StockViewRow): number {
  const cost = Number(row.purchasePrice) || 0;
  return Math.round(getExportQty(row) * cost * 100) / 100;
}

function productLabel(row: StockViewRow): string {
  if (!row.isSerialProduct) {
    const name = (row.name || "").trim();
    if (name) return name;
  }
  const parts = [row.brand, row.brandModel, row.capacity, row.colour]
    .map((s) => (s || "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  return (row.category || row.name || "").trim() || "-";
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

function datestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

type SoldInfoMap = Record<string, { customerName: string; saleReference: string; saleId?: string }>;

/* ── row → flat object (shared by excel + pdf + csv) ───── */

export function rowToRecord(row: StockViewRow, soldInfoMap: SoldInfoMap) {
  const soldInfo =
    row.soldInfo ?? (row.imei ? soldInfoMap[(row.imei || "").trim()] : undefined);
  const soldTo = soldInfo ? `Sold to ${soldInfo.customerName}` : "Available";
  const qty = getExportQty(row);
  const stockValue = getExportStockValue(row);
  return {
    Product: productLabel(row),
    Category: empty(row.category),
    Brand: empty(row.brand),
    Model: empty(row.brandModel),
    Grade: empty(row.grade),
    Capacity: empty(row.capacity),
    Colour: empty(row.colour),
    IMEI: empty(row.imei),
    Qty: String(qty),
    Cost: formatPrice(row, row.purchasePrice),
    "Stock Value": formatMoneyAmount(stockValue, row.currency),
    "Sale Price": formatPrice(row, row.salePrice),
    "Purchase Ref": empty(row.purchaseNumber),
    Date: empty(row.date),
    Supplier: empty(row.supplier),
    Status: soldTo,
  };
}

export function summarizeExportRows(rows: StockViewRow[]): {
  totalQty: number;
  totalStockValue: number;
  currency: string;
} {
  let totalQty = 0;
  let totalStockValue = 0;
  const currencyCounts: Record<string, number> = {};
  for (const row of rows) {
    totalQty += getExportQty(row);
    totalStockValue += getExportStockValue(row);
    const cur = (row.currency || "").trim();
    if (cur) currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
  }
  let currency = "GBP";
  let top = -1;
  for (const cur of Object.keys(currencyCounts)) {
    if (currencyCounts[cur] > top) {
      top = currencyCounts[cur];
      currency = cur;
    }
  }
  return {
    totalQty,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    currency,
  };
}

/* ── EXCEL ───────────────────────────────────────── */

export function downloadProductsExcel(
  rows: StockViewRow[],
  soldInfoMap: SoldInfoMap,
  filenamePrefix = "products-export"
) {
  const data = rows.map((r) => rowToRecord(r, soldInfoMap));
  const summary = summarizeExportRows(rows);
  if (data.length > 0) {
    data.push({
      Product: "TOTAL",
      Category: "",
      Brand: "",
      Model: "",
      Grade: "",
      Capacity: "",
      Colour: "",
      IMEI: "",
      Qty: String(summary.totalQty),
      Cost: "",
      "Stock Value": formatMoneyAmount(summary.totalStockValue, summary.currency),
      "Sale Price": "",
      "Purchase Ref": "",
      Date: "",
      Supplier: "",
      Status: "",
    });
  }
  const ws = XLSX.utils.json_to_sheet(data);

  const headers = Object.keys(data[0] ?? {});
  ws["!cols"] = headers.map((h) => {
    let max = h.length;
    for (const row of data) {
      const len = String((row as Record<string, string>)[h] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(max + 2, 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${filenamePrefix}-${datestamp()}.xlsx`);
}

/* ── PDF ─────────────────────────────────────────── */

export function downloadProductsPdf(
  rows: StockViewRow[],
  soldInfoMap: SoldInfoMap,
  filenamePrefix = "products-export"
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 8;
  let y = 14;
  const summary = summarizeExportRows(rows);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Products Export", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Generated: ${datestamp()}  |  ${rows.length} items  |  Qty ${summary.totalQty}  |  Stock value ${formatMoneyAmount(summary.totalStockValue, summary.currency)}`,
    pageW - margin,
    y,
    { align: "right" }
  );
  y += 8;

  const cols = [
    { header: "Product", key: "Product", w: 42 },
    { header: "Category", key: "Category", w: 24 },
    { header: "Brand", key: "Brand", w: 20 },
    { header: "Model", key: "Model", w: 22 },
    { header: "IMEI", key: "IMEI", w: 32 },
    { header: "Qty", key: "Qty", w: 12 },
    { header: "Cost", key: "Cost", w: 20 },
    { header: "Stock Value", key: "Stock Value", w: 26 },
    { header: "Sale Price", key: "Sale Price", w: 22 },
    { header: "Status", key: "Status", w: 28 },
  ];

  const records = rows.map((r) => rowToRecord(r, soldInfoMap));

  const drawTableHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setFillColor(249, 115, 22);
    doc.setTextColor(255, 255, 255);
    let x = margin;
    for (const col of cols) {
      doc.rect(x, y, col.w, 6, "F");
      doc.text(col.header, x + 1.5, y + 4);
      x += col.w;
    }
    doc.setTextColor(0, 0, 0);
    y += 7;
  };

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > pageH - 10) {
      doc.addPage();
      y = 14;
      drawTableHeader();
    }
  };

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const rowHeight = 5;

  for (let i = 0; i < records.length; i++) {
    newPageIfNeeded(rowHeight + 1);
    const rec = records[i];
    let x = margin;

    if (i % 2 === 0) {
      doc.setFillColor(255, 247, 237);
      doc.rect(x, y - 0.5, cols.reduce((s, c) => s + c.w, 0), rowHeight, "F");
    }

    for (const col of cols) {
      const text = (rec as Record<string, string>)[col.key] ?? "-";
      const clipped = doc.splitTextToSize(text, col.w - 2)[0] || text;
      doc.text(clipped, x + 1.5, y + 3);
      x += col.w;
    }
    y += rowHeight;
  }

  if (records.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("No items to export.", margin, y + 6);
  } else {
    newPageIfNeeded(10);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(
      `TOTAL  Qty: ${summary.totalQty}   Stock value: ${formatMoneyAmount(summary.totalStockValue, summary.currency)}`,
      margin,
      y
    );
  }

  doc.save(`${filenamePrefix}-${datestamp()}.pdf`);
}

/* ── Rate list ───────────────────────────────────── */

export interface RateListExportItem {
  name: string;
  grade: string;
  brand: string;
  brandModel: string;
  capacity: string;
  serialCount: number;
  salePrice: number;
  currency: string;
}

function rateItemToRecord(item: RateListExportItem) {
  const price = item.currency ? `${item.currency} ${item.salePrice}` : String(item.salePrice);
  return {
    Name: item.name || "-",
    Condition: item.grade || "-",
    Brand: item.brand || "-",
    Model: item.brandModel || "-",
    Capacity: item.capacity || "-",
    Serials: item.serialCount > 0 ? String(item.serialCount) : "-",
    "Sale Price": price,
  };
}

export function downloadRateListExcel(items: RateListExportItem[], filenamePrefix = "rate-list") {
  const data = items.map(rateItemToRecord);
  const ws = XLSX.utils.json_to_sheet(data);
  const headers = Object.keys(data[0] ?? {});
  ws["!cols"] = headers.map((h) => {
    let max = h.length;
    for (const row of data) {
      const len = String((row as Record<string, string>)[h] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(max + 2, 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rate List");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${filenamePrefix}-${datestamp()}.xlsx`);
}

export function downloadRateListPdf(items: RateListExportItem[], filenamePrefix = "rate-list") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Rate List", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${datestamp()}  |  ${items.length} items`, pageW - margin, y, { align: "right" });
  y += 10;

  const cols = [
    { header: "Name", w: 52 },
    { header: "Condition", w: 22 },
    { header: "Brand", w: 24 },
    { header: "Model", w: 28 },
    { header: "Capacity", w: 20 },
    { header: "Serials", w: 16 },
    { header: "Sale Price", w: 22 },
  ];

  const records = items.map(rateItemToRecord);

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setFillColor(249, 115, 22);
    doc.setTextColor(255, 255, 255);
    let x = margin;
    for (const col of cols) {
      doc.rect(x, y, col.w, 6, "F");
      doc.text(col.header, x + 1.5, y + 4);
      x += col.w;
    }
    doc.setTextColor(0, 0, 0);
    y += 7;
  };

  const newPage = (needed: number) => {
    if (y + needed > pageH - 12) {
      doc.addPage();
      y = 16;
      drawHeader();
    }
  };

  drawHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const rowH = 5.5;

  for (let i = 0; i < records.length; i++) {
    newPage(rowH + 1);
    const rec = records[i];
    let x = margin;
    if (i % 2 === 0) {
      doc.setFillColor(255, 247, 237);
      doc.rect(x, y - 0.5, cols.reduce((s, c) => s + c.w, 0), rowH, "F");
    }
    const keys = ["Name", "Condition", "Brand", "Model", "Capacity", "Serials", "Sale Price"];
    for (let j = 0; j < cols.length; j++) {
      const text = (rec as Record<string, string>)[keys[j]] ?? "-";
      const clipped = doc.splitTextToSize(text, cols[j].w - 2)[0] || text;
      doc.text(clipped, x + 1.5, y + 3.5);
      x += cols[j].w;
    }
    y += rowH;
  }

  if (records.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("No items to export.", margin, y + 6);
  }

  doc.save(`${filenamePrefix}-${datestamp()}.pdf`);
}

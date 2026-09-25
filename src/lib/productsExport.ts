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

/** One Rate List line (a variant: category + grade + brand + model + capacity) with units per colour. */
export interface RateListExportItem {
  category: string;
  grade: string;
  brand: string;
  brandModel: string;
  capacity: string;
  salePrice: number;
  currency: string;
  colours: { colour: string; quantity: number }[];
}

interface RateListExportLine {
  model: string;
  grade: string;
  capacity: string;
  colour: string;
  rate: number;
  currency: string;
  quantity: number;
}

interface RateListExportBrand {
  brand: string;
  quantity: number;
  lines: RateListExportLine[];
}

interface RateListExportCategory {
  category: string;
  quantity: number;
  brands: RateListExportBrand[];
}

const RATE_LIST_COLUMNS = ["Model", "Grade", "Capacity", "Colour", "Rate", "Quantity"] as const;

const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, "en-GB", { numeric: true, sensitivity: "base" });

/** Labels for blank values; they sort last. */
const OTHER_BRAND = "Other";
const NO_CATEGORY = "Uncategorised";

/** Category → brand → one line per model/grade/capacity/colour, sorted for reading. */
export function buildRateListSections(items: RateListExportItem[]): RateListExportCategory[] {
  const categories = new Map<string, Map<string, RateListExportLine[]>>();
  for (const item of items) {
    const category = (item.category || "").trim() || NO_CATEGORY;
    const brand = (item.brand || "").trim() || OTHER_BRAND;
    if (!categories.has(category)) categories.set(category, new Map());
    const brands = categories.get(category)!;
    if (!brands.has(brand)) brands.set(brand, []);
    const colours = item.colours.length ? item.colours : [{ colour: "", quantity: 0 }];
    for (const c of colours) {
      brands.get(brand)!.push({
        model: (item.brandModel || "").trim(),
        grade: (item.grade || "").trim(),
        capacity: (item.capacity || "").trim(),
        colour: (c.colour || "").trim(),
        rate: Number(item.salePrice) || 0,
        currency: item.currency,
        quantity: c.quantity,
      });
    }
  }

  const lastIf = (label: string) => (a: string, b: string) =>
    (a === label ? 1 : 0) - (b === label ? 1 : 0) || naturalCompare(a, b);

  return [...categories.keys()].sort(lastIf(NO_CATEGORY)).map((category) => {
    const brands = categories.get(category)!;
    const brandSections = [...brands.keys()].sort(lastIf(OTHER_BRAND)).map((brand) => {
      const lines = brands.get(brand)!.sort(
        (a, b) =>
          naturalCompare(a.model, b.model) ||
          naturalCompare(a.grade, b.grade) ||
          naturalCompare(a.capacity, b.capacity) ||
          naturalCompare(a.colour, b.colour)
      );
      return { brand, quantity: lines.reduce((s, l) => s + l.quantity, 0), lines };
    });
    return {
      category,
      quantity: brandSections.reduce((s, b) => s + b.quantity, 0),
      brands: brandSections,
    };
  });
}

/** £135 / £135.50 — whole pounds without pence, like the printed stock list. */
function formatRate(value: number, currency: string): string {
  const code = (currency || "GBP").trim().toUpperCase();
  const digits = Number.isInteger(value) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency ? `${currency} ` : ""}${value.toFixed(digits)}`;
  }
}

const dashIfEmpty = (s: string) => s || "-";

export function downloadRateListExcel(items: RateListExportItem[], filenamePrefix = "rate-list") {
  const sections = buildRateListSections(items);
  const total = sections.reduce((s, c) => s + c.quantity, 0);
  const width = RATE_LIST_COLUMNS.length;
  const aoa: (string | number)[][] = [["Rate List"], [`Generated: ${datestamp()}  |  ${total} units`], []];
  const merges: XLSX.Range[] = [];
  const pushHeading = (text: string) => {
    aoa.push([text]);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: width - 1 } });
  };
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: width - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: width - 1 } });

  for (const category of sections) {
    pushHeading(`${category.category.toUpperCase()}  (${category.quantity} units)`);
    for (const brand of category.brands) {
      pushHeading(`${brand.brand}  (${brand.quantity} units)`);
      aoa.push([...RATE_LIST_COLUMNS]);
      for (const line of brand.lines) {
        // Rate and quantity stay numbers so the sheet can be summed or re-priced.
        aoa.push([
          dashIfEmpty(line.model),
          dashIfEmpty(line.grade),
          dashIfEmpty(line.capacity),
          dashIfEmpty(line.colour),
          line.rate,
          line.quantity,
        ]);
      }
      aoa.push([]);
    }
  }
  if (sections.length === 0) aoa.push(["No items to export."]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = RATE_LIST_COLUMNS.map((h, c) => {
    let max = h.length;
    for (const row of aoa) {
      if (row.length < width) continue; // headings span the whole row; don't size columns by them
      const len = String(row[c] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(max + 2, 40) };
  });
  // Show the numeric rate as money without turning it into text.
  const rateCol = RATE_LIST_COLUMNS.indexOf("Rate");
  const currency = (items.find((i) => i.currency)?.currency || "GBP").trim().toUpperCase();
  const symbol = currency === "GBP" ? "£" : `${currency} `;
  aoa.forEach((row, r) => {
    if (row.length !== width || typeof row[rateCol] !== "number") return;
    const cell = ws[XLSX.utils.encode_cell({ r, c: rateCol })];
    if (cell) cell.z = `"${symbol}"#,##0.00`;
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
  const sections = buildRateListSections(items);
  const total = sections.reduce((s, c) => s + c.quantity, 0);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const bottom = pageH - 12;
  let y = 16;

  const cols = [
    { header: "Model", w: 62, right: false },
    { header: "Grade", w: 18, right: false },
    { header: "Capacity", w: 24, right: false },
    { header: "Colour", w: 38, right: false },
    { header: "Rate", w: 22, right: true },
    { header: "Quantity", w: 18, right: true },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const rowH = 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Rate List", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${datestamp()}  |  ${total} units`, pageW - margin, y, { align: "right" });
  y += 9;

  const drawRow = (cells: string[]) => {
    let x = margin;
    cols.forEach((col, c) => {
      const text = doc.splitTextToSize(cells[c], col.w - 3)[0] || cells[c];
      if (col.right) doc.text(text, x + col.w - 1.5, y + 3.7, { align: "right" });
      else doc.text(text, x + 1.5, y + 3.7);
      x += col.w;
    });
    y += rowH;
  };

  const drawCategory = (label: string) => {
    doc.setFillColor(249, 115, 22);
    doc.rect(margin, y, tableW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(label, margin + 2, y + 4.9);
    doc.setTextColor(0, 0, 0);
    y += 9;
  };

  const drawBrand = (label: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(label, margin, y + 3.5);
    y += 5.5;
  };

  const drawTableHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, tableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    drawRow(cols.map((c) => c.header));
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
  };

  const newPage = () => {
    doc.addPage();
    y = 16;
  };

  for (const category of sections) {
    // Keep the category bar with its first brand heading, table header and first row.
    if (y + 9 + 5.5 + rowH * 2 > bottom) newPage();
    drawCategory(`${category.category.toUpperCase()}   (${category.quantity} units)`);

    for (const brand of category.brands) {
      if (y + 5.5 + rowH * 2 > bottom) newPage();
      const brandLabel = `${brand.brand}   (${brand.quantity} units)`;
      drawBrand(brandLabel);
      drawTableHeader();

      brand.lines.forEach((line, i) => {
        if (y + rowH > bottom) {
          newPage();
          drawBrand(`${brandLabel} (continued)`);
          drawTableHeader();
        }
        if (i % 2 === 1) {
          doc.setFillColor(255, 247, 237);
          doc.rect(margin, y, tableW, rowH, "F");
        }
        drawRow([
          dashIfEmpty(line.model),
          dashIfEmpty(line.grade),
          dashIfEmpty(line.capacity),
          dashIfEmpty(line.colour),
          formatRate(line.rate, line.currency),
          String(line.quantity),
        ]);
      });
      y += 4;
    }
    y += 2;
  }

  if (sections.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("No items to export.", margin, y + 6);
  }

  doc.save(`${filenamePrefix}-${datestamp()}.pdf`);
}

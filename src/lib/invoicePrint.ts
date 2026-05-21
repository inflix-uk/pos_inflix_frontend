/**
 * Invoice (A4) and receipt (80mm) PDF generation using company info from
 * Settings > About, Notes & Terms, and Bank Account Details.
 * Repair ticket 80mm with QR code.
 */
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import {
  mergeRepairLabelPrintSettings,
  repairLabelFieldFontPt,
  type RepairLabelPrintSettings,
  type RepairLabelQrPosition,
} from "./repairLabelPrintConfig";
import {
  mergeReceiptPrinterSalesPrintOptions,
  mergeReceiptPrinterRepairPrintOptions,
  repairTicketFontPt,
  salesReceiptFontPt,
  type ReceiptPrinterSalesPrintOptions,
  type ReceiptPrinterRepairPrintOptions,
} from "./receiptPrinterPrintOptions";
import { mergeInvoicePdfPrintOptions, type InvoicePdfPrintOptions } from "./invoicePdfPrintOptions";
import {
  printLabelsPdf,
  printRepairLabelCanvasPngToAgent,
  loadPrintingSettings,
  isLabelSilentPrintingConfigured,
} from "@/services/printService";
import { uint8ToBase64 } from "./normalizeRepairLabelPdf";
import {
  registerRepairLabelEmbeddedFont,
  REPAIR_LABEL_JSPDF_FONT,
} from "./repairLabelEmbeddedFont";
import { buildRepairLabelPngForDymoAgent } from "./repairLabelCanvasPng";
import type { RepairLabelTextFieldId, RepairTicketFontSizeKey, SalesReceiptFontSizeKey } from "./receiptPrintLayout";

const API_BASE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") : "";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface InvoiceSettings {
  about: {
    appName?: string;
    appTitle?: string;
    companyAddress?: string;
    logo?: string | null;
    invoicePdfTitle?: string;
  };
  notesTerms: {
    pdfSalesTerms?: string;
    paymentNote?: string;
    receiptPrinterSalesTerms?: string;
    receiptPrinterRepairTerms?: string;
    receiptPrinterSalesPrint: ReceiptPrinterSalesPrintOptions;
    receiptPrinterRepairPrint: ReceiptPrinterRepairPrintOptions;
    repairLabelPrint: RepairLabelPrintSettings;
    invoicePdfPrint: InvoicePdfPrintOptions;
  };
  bankAccounts: Array<{
    accountName: string;
    bankName: string;
    accountNumber: string;
    sortCode: string;
    iban?: string;
    isDefault?: boolean;
  }>;
}

export interface SaleForPrint {
  _id: string;
  reference: string;
  type: "retail" | "wholesale" | "repair";
  createdAt: string;
  customerName?: string;
  /** Formatted customer address (multi-line string) for Bill To section */
  customerAddress?: string;
  /** From Customer record when sale has customerId (print API enriches). */
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    unit?: string;
    /** IMEI / serial numbers to show under the item */
    serialNumbers?: string[];
    /** Colour per serial (for Serial Items Details: base name + this serial's colour) */
    serialColours?: Record<string, string>;
    /** Condition/grade (e.g. A, D, NEW) */
    grade?: string;
    brand?: string;
    colour?: string;
    brandModel?: string;
    capacity?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  discountType?: "flat" | "percent";
  discountValue?: number;
  total: number;
  paymentMethod?: string;
  payments?: { cash?: number; card?: number; credit?: number; bank?: number };
  /** Wholesale: balance before this invoice */
  previousBalance?: number;
  /** Wholesale: amount due for this invoice (total - discount + previousBalance) */
  amountDue?: number;
  /** Wholesale: account balance after this invoice (amountDue - payments) */
  balanceAfter?: number;
}

/** Location details for invoice/receipt header (from Sale.locationId) */
export interface LocationForHeader {
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

/** Repair ticket data for 80mm print (ref + QR and key details) */
export interface RepairForPrint {
  _id: string;
  reference: string;
  customerName: string;
  contactPhone?: string;
  contactEmail?: string;
  deviceDescription: string;
  serialNumber?: string;
  problemType?: string;
  estimatedCost?: number | null;
  /** When set, ticket/header can use location address and contact toggles */
  locationId?: string | null;
  /** Resolved location name for display on ticket */
  locationName?: string | null;
  /** First device or legacy single device */
  devices?: Array<{ deviceDescription?: string; serialNumber?: string; problemType?: string; devicePassword?: string }>;
  receivedAt?: string;
  status?: string;
  devicePassword?: string;
  repairItems?: Array<{ description: string; amount: number }>;
  actualCost?: number | null;
  notes?: string;
}

/** Load a location for receipt/repair headers (same fields as sale print context). */
export async function fetchLocationHeaderById(
  locationId: string | null | undefined
): Promise<LocationForHeader | null> {
  if (!locationId || String(locationId).trim() === "") return null;
  const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(String(locationId))}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  const loc = json?.data ?? json;
  if (!loc || typeof loc !== "object") return null;
  return {
    name: String(loc.name ?? "").trim() || "Location",
    address: loc.address ? String(loc.address) : undefined,
    city: loc.city ? String(loc.city) : undefined,
    postcode: loc.postcode ? String(loc.postcode) : undefined,
    country: loc.country ? String(loc.country) : undefined,
    phone: loc.phone ? String(loc.phone) : undefined,
    email: loc.email ? String(loc.email) : undefined,
  };
}

/** Get sale + resolved location for printing (header uses location details). */
export async function getSalePrintContext(saleId: string): Promise<{
  sale: SaleForPrint;
  location: LocationForHeader | null;
  fallbackLabel: string | null;
  /** SKU → variant slugs in category display order (from Product → Category). */
  variantAttributeSlugsOrderBySku: Record<string, string[]>;
}> {
  const res = await fetch(`${API_BASE}/api/print/sale-print-context/${encodeURIComponent(saleId)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to load print context");
  }
  const json = await res.json();
  const data = json?.data ?? json;
  return {
    sale: data.sale,
    location: data.location ?? null,
    fallbackLabel: data.fallbackLabel ?? null,
    variantAttributeSlugsOrderBySku: data.variantAttributeSlugsOrderBySku ?? {},
  };
}

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  const [aboutRes, notesRes, bankRes] = await Promise.all([
    fetch(`${API_BASE}/api/settings/about`, { headers: getAuthHeaders() }),
    fetch(`${API_BASE}/api/settings/notes-terms`, { headers: getAuthHeaders() }),
    fetch(`${API_BASE}/api/settings/bank-accounts`, { headers: getAuthHeaders() }),
  ]);
  const aboutData = await aboutRes.json().catch(() => ({}));
  const notesData = await notesRes.json().catch(() => ({}));
  const bankData = await bankRes.json().catch(() => ({}));
  const about = aboutData?.data ?? aboutData ?? {};
  const notesTerms = notesData?.data ?? notesData ?? {};
  const bankList = Array.isArray(bankData?.data) ? bankData.data : [];
  return {
    about: {
      appName: about.appName ?? "Company",
      appTitle: about.appTitle ?? "",
      companyAddress: about.companyAddress ?? "",
      logo: about.logo ?? null,
      invoicePdfTitle: about.invoicePdfTitle ?? "INVOICE",
    },
    notesTerms: {
      pdfSalesTerms: notesTerms.pdfSalesTerms ?? "",
      paymentNote: notesTerms.paymentNote ?? "",
      receiptPrinterSalesTerms: notesTerms.receiptPrinterSalesTerms ?? "",
      receiptPrinterRepairTerms: notesTerms.receiptPrinterRepairTerms ?? "",
      receiptPrinterSalesPrint: mergeReceiptPrinterSalesPrintOptions(notesTerms.receiptPrinterSalesPrint),
      receiptPrinterRepairPrint: mergeReceiptPrinterRepairPrintOptions(notesTerms.receiptPrinterRepairPrint),
      repairLabelPrint: mergeRepairLabelPrintSettings(notesTerms.repairLabelPrint),
      invoicePdfPrint: mergeInvoicePdfPrintOptions(notesTerms.invoicePdfPrint),
    },
    bankAccounts: bankList,
  };
}

/**
 * Repair device label layout from Settings → Notes & Terms → "REPAIR DEVICE LABEL (SMALL PDF)"
 * (GET /api/settings/notes-terms → repairLabelPrint). Used for silent and browser label printing.
 */
export async function getRepairLabelPrintSettings(): Promise<RepairLabelPrintSettings> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/notes-terms`, { headers: getAuthHeaders() });
    const notesData = await res.json().catch(() => ({}));
    const notesTerms = notesData?.data ?? notesData ?? {};
    return mergeRepairLabelPrintSettings(notesTerms.repairLabelPrint);
  } catch {
    return mergeRepairLabelPrintSettings();
  }
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${h}:${m}`;
}

// --- Helpers to match cart display (Items Summary: no colour; Serial Details: base name + serial's colour) ---
const STRIP_COLOUR_REGEX =
  /\s+(BLUE|BLACK|WHITE|RED|GREEN|YELLOW|GOLD|SILVER|GREY|GRAY|PINK|PURPLE|ORANGE|NAVY|BROWN|BEIGE|CREAM|GRAPHITE|PHANTOM|STARLIGHT|MIDNIGHT|STORM|SAGE|LAVENDER|CORAL|MINT|IVORY|ROSE|TITANIUM|AZURE|SLATE|OLIVE|MAROON|TEAL|CYAN|BURGUNDY|CHAMPAGNE|COPPER|PLATINUM)\b/gi;

function summaryItemName(item: { name?: string; colour?: string }): string {
  const name = (item.name ?? "").trim();
  const colour = (item.colour ?? "").trim();
  if (!colour) return name || "—";
  const escaped = colour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return name.replace(new RegExp(`\\s*\\b${escaped}\\b\\s*`, "gi"), " ").replace(/\s+/g, " ").trim() || name || "—";
}

/** PDF Items Summary: single description line — name + optional grade (no separate Condition column). */
function itemsSummaryLineWithGrade(item: { name?: string; colour?: string; grade?: string }): string {
  const base = summaryItemName(item);
  const g = (item.grade ?? "").trim();
  if (!g) return base || "—";
  const upper = base.toUpperCase();
  const gUp = g.toUpperCase();
  if (upper.endsWith(` ${gUp}`) || upper.endsWith(` · ${gUp}`) || new RegExp(`\\b${gUp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(upper)) {
    return base;
  }
  return `${base} · ${g}`.trim();
}

/** PDF serial detail row: item description + grade in one string. */
function serialDetailLineWithGrade(
  item: { name?: string; colour?: string; serialColours?: Record<string, string>; grade?: string },
  serial: string
): string {
  const base = serialDetailItemText(item, serial);
  const g = (item.grade ?? "").trim();
  if (!g) return base || "—";
  const upper = base.toUpperCase();
  const gUp = g.toUpperCase();
  if (new RegExp(`\\b${gUp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(upper)) return base;
  return `${base} · ${g}`.trim();
}

type SaleItemPrint = SaleForPrint["items"][number];

/** Map VariantAttribute.slug → fields stored on sale line items. */
const SLUG_TO_SALE_FIELD: Record<string, keyof Pick<SaleItemPrint, "grade" | "brand" | "colour" | "brandModel" | "capacity">> = {
  grade: "grade",
  condition: "grade",
  brands: "brand",
  brand: "brand",
  brands_model: "brandModel",
  brand_model: "brandModel",
  model: "brandModel",
  make: "brandModel",
  storage: "capacity",
  capacity: "capacity",
  colour: "colour",
  color: "colour",
};

function saleItemValueForSlug(item: SaleItemPrint, slug: string, serial?: string): string {
  const s = slug.toLowerCase();
  if ((s === "colour" || s === "color") && serial) {
    const per = item.serialColours?.[serial]?.trim();
    if (per) return per;
  }
  const field = SLUG_TO_SALE_FIELD[s];
  if (!field) return "";
  const v = item[field];
  return v != null && String(v).trim() ? String(v).trim() : "";
}

function appendOrderedAttributes(
  baseLine: string,
  slugOrder: string[],
  getValue: (slug: string) => string
): string {
  const nm = baseLine.trim() || "—";
  const parts: string[] = [];
  for (const slug of slugOrder) {
    const v = getValue(slug);
    if (v) parts.push(v);
  }
  if (parts.length === 0) return nm;
  const nmUp = nm.toUpperCase();
  const extra = parts.filter((p) => !nmUp.includes(p.toUpperCase()));
  if (extra.length === 0) return nm;
  return `${nm} · ${extra.join(" · ")}`;
}

/** Items Summary cell: name + variant values in category order (from print context). */
function invoiceItemsSummaryLine(item: SaleItemPrint, slugOrder: string[] | undefined): string {
  const nm = summaryItemName(item).trim() || (item.name || "").trim() || "—";
  if (!slugOrder?.length) return itemsSummaryLineWithGrade(item);
  const out = appendOrderedAttributes(nm, slugOrder, (slug) => saleItemValueForSlug(item, slug));
  if (out === nm) return itemsSummaryLineWithGrade(item);
  return out;
}

/** Serial detail row: description + variant values in category order (per-serial colour when slug is colour). */
function invoiceSerialDetailLine(item: SaleItemPrint, serial: string, slugOrder: string[] | undefined): string {
  const nm = serialDetailItemText(item, serial).trim() || "—";
  if (!slugOrder?.length) return serialDetailLineWithGrade(item, serial);
  const withAttrs = appendOrderedAttributes(nm, slugOrder, (slug) => saleItemValueForSlug(item, slug, serial));
  if (withAttrs === nm) return serialDetailLineWithGrade(item, serial);
  return withAttrs;
}

function nameWithoutColour(name: string): string {
  return (name ?? "").trim().replace(STRIP_COLOUR_REGEX, " ").replace(/\s+/g, " ").trim() || (name ?? "").trim();
}

function serialDetailItemText(
  item: { name?: string; colour?: string; serialColours?: Record<string, string> },
  serial: string
): string {
  const base = nameWithoutColour(item.name ?? "");
  const colour = (item.serialColours && item.serialColours[serial]?.trim()) || (item.colour ?? "").trim();
  return colour ? `${base} ${colour}`.trim() : base || "—";
}

/** Build address lines from location (for header). */
function getLocationHeaderLines(loc: LocationForHeader | null): string[] {
  if (!loc) return [];
  const lines: string[] = [];
  if (loc.address?.trim()) lines.push(loc.address.trim());
  // Render city, postcode, and country on separate lines to prevent text overlap
  if (loc.city?.trim()) lines.push(loc.city.trim());
  if (loc.postcode?.trim()) lines.push(loc.postcode.trim());
  if (loc.country?.trim()) lines.push(loc.country.trim());
  if (loc.phone?.trim()) lines.push(`Tel: ${loc.phone.trim()}`);
  if (loc.email?.trim()) lines.push(loc.email.trim());
  return lines.slice(0, 6);
}

/** Address lines only (no phone/email) — receipt layout can place contact on its own rows. */
function getLocationPostalLinesOnly(loc: LocationForHeader | null): string[] {
  if (!loc) return [];
  const lines: string[] = [];
  if (loc.address?.trim()) lines.push(loc.address.trim());
  if (loc.city?.trim()) lines.push(loc.city.trim());
  if (loc.postcode?.trim()) lines.push(loc.postcode.trim());
  if (loc.country?.trim()) lines.push(loc.country.trim());
  return lines.slice(0, 6);
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

/** Build A4 invoice PDF. Returns blob URL for open/print. */
export async function buildInvoicePdf(
  sale: SaleForPrint,
  settings: InvoiceSettings,
  location?: LocationForHeader | null,
  variantAttributeSlugsOrderBySku: Record<string, string[]> = {}
): Promise<string> {
  const io = mergeInvoicePdfPrintOptions(settings.notesTerms.invoicePdfPrint);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const left = io.marginMm;
  const right = pageW - io.marginMm;
  const textBlockW = pageW - 2 * left;
  let y = io.marginMm;

  const headerName = location?.name ?? settings.about.appName ?? "Company";
  const headerAddressLines = location
    ? getLocationHeaderLines(location)
    : (settings.about.companyAddress || "").split("\n").filter(Boolean);

  const docTitleY = io.marginMm + 4;
  let logoRendered = false;
  if (io.showLogo && settings.about.logo) {
    try {
      const format = (settings.about.logo as string).startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      const maxLogoW = 36;
      const maxLogoH = 16;
      const { width: natW, height: natH } = await loadImageDimensions(settings.about.logo as string);
      const aspect = natW > 0 && natH > 0 ? natW / natH : maxLogoW / maxLogoH;
      let logoW = maxLogoW;
      let logoH = logoW / aspect;
      if (logoH > maxLogoH) {
        logoH = maxLogoH;
        logoW = logoH * aspect;
      }
      doc.addImage(settings.about.logo, format, left, io.marginMm, logoW, logoH);
      y = io.marginMm + logoH + 4;
      logoRendered = true;
    } catch {
      /* ignore invalid image */
    }
  }

  if (!logoRendered) {
    doc.setFontSize(io.fontCompanyNamePt);
    doc.setFont("helvetica", "bold");
    doc.text(headerName, left, y);
    y += 8;
  }
  doc.setFontSize(io.fontBodyPt);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  headerAddressLines.forEach((line: string) => {
    doc.text(line.trim(), left, y);
    y += 5;
  });
  doc.setTextColor(0, 0, 0);
  y += 6;

  doc.setFontSize(io.fontDocTitlePt);
  doc.setFont("helvetica", "bold");
  const docTitleText = settings.about.invoicePdfTitle || "Dispatch Note";
  doc.text(docTitleText, right, docTitleY, { align: "right" });
  const titleWidth = doc.getTextWidth(docTitleText);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.4);
  doc.line(right - titleWidth, docTitleY + 1.5, right, docTitleY + 1.5);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.setFontSize(io.fontBodyPt);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text(`Ref: ${sale.reference}`, right, docTitleY + 6, { align: "right" });
  doc.text(`Date: ${formatDate(sale.createdAt)}`, right, docTitleY + 11, { align: "right" });
  doc.setTextColor(0, 0, 0);
  const invoiceQrPayload = String(sale.reference || "").trim() || String(sale._id || "");
  const invoiceQrMm = io.invoiceReferenceQrSizeMm;
  let headerBottom = docTitleY + 16;
  if (io.showInvoiceReferenceQr && invoiceQrPayload) {
    try {
      const qrDataUrl = await QRCode.toDataURL(invoiceQrPayload, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      const qrY = docTitleY + 13;
      const qrX = right - invoiceQrMm;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, invoiceQrMm, invoiceQrMm);
      headerBottom = Math.max(headerBottom, qrY + invoiceQrMm + 3);
    } catch {
      /* ignore QR failure */
    }
  }
  y = Math.max(y, headerBottom);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.1);
  doc.line(left, y, right, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  y += 6;

  if (io.showBillTo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontTablePt);
    doc.setTextColor(120, 120, 120);
    doc.text("BILL TO", left, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontBodyPt);
    const retailLike = sale.type === "retail" || sale.type === "repair";
    doc.text(sale.customerName || (retailLike ? "Walk-in Customer" : "—"), left, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    if (sale.customerAddress && sale.customerAddress.trim()) {
      doc.setFontSize(io.fontTablePt);
      const addrLines = sale.customerAddress.trim().split("\n").filter(Boolean);
      addrLines.forEach((line: string) => {
        doc.text(line.trim(), left, y);
        y += 4;
      });
      doc.setFontSize(io.fontBodyPt);
      y += 4;
    } else {
      y += 4;
    }
  }

  const colQty = left + 118;
  const colUnit = left + 132;
  if (io.showItemsSummary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.text("Items Summary", left, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontTablePt);
    doc.setTextColor(110, 110, 110);
    doc.text("#", left, y);
    doc.text("Item", left + 8, y);
    doc.text("Qty", colQty, y);
    doc.text("Unit price", colUnit, y);
    doc.text("Amount", right, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(left, y, right, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 7;

    const itemRowFontPt = Math.min(io.fontTablePt + 2, 11);
    const itemRowStep = itemRowFontPt >= 10 ? 6 : 5;
    doc.setFontSize(itemRowFontPt);
    sale.items.forEach((item, idx) => {
      if (y > 258) {
        doc.addPage();
        y = 20;
      }
      const lineTotal = item.price * item.quantity;
      const slugOrder = item.sku ? variantAttributeSlugsOrderBySku[item.sku] : undefined;
      const line = invoiceItemsSummaryLine(item, slugOrder).slice(0, 58);
      doc.text(String(idx + 1), left, y);
      doc.text(line, left + 8, y);
      doc.text(String(item.quantity), colQty, y);
      doc.text(formatMoney(item.price), colUnit, y);
      doc.text(formatMoney(lineTotal), right, y, { align: "right" });
      y += itemRowStep;
    });

    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(left, y, right, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 11;
    doc.setFont("helvetica", "bold");
    const grandTotalFontPt = Math.min(io.fontSectionHeadingPt + 4, 18);
    doc.setFontSize(grandTotalFontPt);
    const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0);
    doc.text("Grand total", left, y);
    doc.text(String(totalQty), colQty, y);
    doc.text(formatMoney(sale.subtotal), right, y, { align: "right" });
    y += grandTotalFontPt * 0.6 + 4;
    doc.setFont("helvetica", "normal");
  }

  const isWholesaleEarly = sale.type === "wholesale";
  if (io.showAccountSummary && isWholesaleEarly) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.text("Account Summary", left, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    const prevBal = Number(sale.previousBalance) || 0;
    const invTotal = (Number(sale.total) || 0) - (Number(sale.discount) || 0);
    const totalDueBeforePayments = prevBal + invTotal;
    doc.setTextColor(110, 110, 110);
    doc.text("Previous Balance:", left, y);
    doc.setTextColor(0, 0, 0);
    doc.text(formatMoney(prevBal), right, y, { align: "right" });
    y += 6;
    doc.setTextColor(110, 110, 110);
    doc.text("Invoice Total + Previous Balance:", left, y);
    doc.setTextColor(0, 0, 0);
    doc.text(formatMoney(totalDueBeforePayments), right, y, { align: "right" });
    y += 6;
    const payments = sale.payments || {};
    const received = (Number(payments.cash) || 0) + (Number(payments.card) || 0) + (Number(payments.bank) || 0);
    if (received > 0) {
      doc.setTextColor(110, 110, 110);
      doc.text("Payments Received:", left, y);
      doc.setTextColor(0, 0, 0);
      doc.text("-" + formatMoney(received), right, y, { align: "right" });
      y += 6;
    }
    const balanceDue = totalDueBeforePayments - received;
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(left, y, right, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 11;
    doc.setFont("helvetica", "bold");
    const balanceDueFontPt = Math.min(io.fontSectionHeadingPt + 4, 18);
    doc.setFontSize(balanceDueFontPt);
    doc.text("Balance Due:", left, y);
    doc.text(formatMoney(Math.max(0, balanceDue)), right, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    y += balanceDueFontPt * 0.6 + 4;
  }

  const hasPaymentsEarly =
    sale.payments && (sale.payments.cash || sale.payments.card || sale.payments.bank || sale.payments.credit);
  if (io.showPayments && hasPaymentsEarly) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.text("Payments", left, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    const dateStr = formatDateShort(sale.createdAt);
    const methodAmounts: { method: string; amount: number }[] = [];
    if (sale.payments!.cash) methodAmounts.push({ method: "Cash", amount: sale.payments!.cash });
    if (sale.payments!.card) methodAmounts.push({ method: "Card", amount: sale.payments!.card });
    if (sale.payments!.bank) methodAmounts.push({ method: "Bank", amount: sale.payments!.bank });
    if (sale.payments!.credit) methodAmounts.push({ method: "Balance to pay", amount: sale.payments!.credit });
    doc.setTextColor(110, 110, 110);
    methodAmounts.forEach(({ method, amount }) => {
      doc.text(`${dateStr} — ${method} — ${formatMoney(amount)}`, left, y);
      y += 5;
    });
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  const hasSerials = sale.items.some((i) => i.serialNumbers && i.serialNumbers.length > 0);
  if (io.showSerialDetails && hasSerials) {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.text("Serial Items Details", left, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontTablePt);
    const colSerial = left + 10;
    const colSerialItem = left + 44;
    doc.setTextColor(110, 110, 110);
    doc.text("#", left, y);
    doc.text("Serial", colSerial, y);
    doc.text("Item", colSerialItem, y);
    doc.text("Unit price", right, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(left, y, right, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 7;
    let rowNum = 0;
    sale.items.forEach((item) => {
      if (!item.serialNumbers || item.serialNumbers.length === 0) return;
      const slugOrder = item.sku ? variantAttributeSlugsOrderBySku[item.sku] : undefined;
      item.serialNumbers.forEach((serial) => {
        if (y > 268) {
          doc.addPage();
          y = 20;
        }
        rowNum += 1;
        const itemText = invoiceSerialDetailLine(item, serial, slugOrder).slice(0, 52);
        doc.text(String(rowNum), left, y);
        doc.text(String(serial).slice(0, 18), colSerial, y);
        doc.text(itemText, colSerialItem, y);
        doc.text(formatMoney(item.price), right, y, { align: "right" });
        y += 6;
      });
    });
    y += 12;
  }

  if (io.showInvoiceSummary) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(left, y, right, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 11;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.text("Invoice Summary", left, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    const discountAmt = Number(sale.discount) || 0;
    if (discountAmt > 0) {
      doc.setTextColor(110, 110, 110);
      doc.text("Subtotal:", left, y);
      doc.setTextColor(0, 0, 0);
      doc.text(formatMoney(sale.subtotal), right, y, { align: "right" });
      y += 6;
      const discLabel =
        sale.discountType === "percent" && sale.discountValue
          ? `Discount (${Math.min(100, Number(sale.discountValue))}%):`
          : "Discount:";
      doc.setTextColor(110, 110, 110);
      doc.text(discLabel, left, y);
      doc.setTextColor(0, 0, 0);
      doc.text(`-${formatMoney(discountAmt)}`, right, y, { align: "right" });
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(left, y, right, y);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      y += 5;
    }
    doc.setFont("helvetica", "bold");
    const invoiceTotalFontPt = Math.min(io.fontSectionHeadingPt + 4, 18);
    doc.setFontSize(invoiceTotalFontPt);
    doc.text("Invoice Total:", left, y);
    doc.text(formatMoney(sale.total - discountAmt), right, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    y += invoiceTotalFontPt * 0.6 + 6;
  }

  y += 6;
  if (io.showPdfSalesTerms && settings.notesTerms.pdfSalesTerms) {
    doc.setFontSize(io.fontTermsPt);
    const termsLines = doc.splitTextToSize(settings.notesTerms.pdfSalesTerms, textBlockW);
    termsLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, left, y);
      y += 4;
    });
    y += 4;
  }
  if (io.showPaymentNote && settings.notesTerms.paymentNote) {
    doc.setFontSize(io.fontTermsPt);
    const noteLines = doc.splitTextToSize(settings.notesTerms.paymentNote, textBlockW);
    noteLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, left, y);
      y += 4;
    });
    y += 4;
  }

  const defaultBank = settings.bankAccounts.find((b) => b.isDefault) || settings.bankAccounts[0];
  if (io.showBankDetails && defaultBank && y < 270) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.text("Bank details", left, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    doc.text(`${defaultBank.bankName} | ${defaultBank.accountName}`, left, y);
    y += 4;
    doc.text(`Sort code: ${defaultBank.sortCode}  Account: ${defaultBank.accountNumber}`, left, y);
    if (defaultBank.iban) {
      y += 4;
      doc.text(`IBAN: ${defaultBank.iban}`, left, y);
    }
  }

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

/** Build 80mm thermal receipt PDF. Returns blob URL. */
export async function buildReceipt80mmPdf(
  sale: SaleForPrint,
  settings: InvoiceSettings,
  location?: LocationForHeader | null,
  variantAttributeSlugsOrderBySku: Record<string, string[]> = {}
): Promise<string> {
  const ro = mergeReceiptPrinterSalesPrintOptions(settings.notesTerms.receiptPrinterSalesPrint);
  const width = ro.paperWidthMm;
  const pad = ro.sideMarginMm;
  const sfp = (k: SalesReceiptFontSizeKey) => salesReceiptFontPt(ro, k);
  const doc = new jsPDF({ unit: "mm", format: [width, 297], hotfixes: ["px_scaling"] });
  let y = 10;
  const center = width / 2;

  const headerName = location?.name ?? settings.about.appName ?? "Company";
  const postalLines = location ? getLocationPostalLinesOnly(location) : [];
  const companyAddrLines = (settings.about.companyAddress || "").split("\n").filter(Boolean);
  const shopAddressLines = location ? postalLines : companyAddrLines;

  let hasMetaForDivider = false;
  const markMeta = () => {
    hasMetaForDivider = true;
  };
  const ensurePage = () => {
    if (y > 280) {
      doc.addPage([width, 297], "p");
      y = 10;
    }
  };

  const willPrintItems = ro.showLineItems && sale.items.length > 0;
  let dividerBeforeItemsDone = false;
  const drawDividerBeforeItems = () => {
    if (dividerBeforeItemsDone) return;
    if (hasMetaForDivider || willPrintItems) {
      ensurePage();
      doc.line(pad, y, width - pad, y);
      y += 5;
      dividerBeforeItemsDone = true;
    }
  };

  for (const section of ro.sectionOrder) {
    switch (section) {
      case "logo": {
        if (!ro.showLogo || !settings.about.logo) break;
        try {
          const format = (settings.about.logo as string).startsWith("data:image/jpeg") ? "JPEG" : "PNG";
          const maxW = 22;
          const maxH = 16;
          const { width: naturalW, height: naturalH } = await loadImageDimensions(settings.about.logo as string);
          const aspect = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : maxW / maxH;
          let logoW = maxW;
          let logoH = logoW / aspect;
          if (logoH > maxH) {
            logoH = maxH;
            logoW = logoH * aspect;
          }
          const receiptLogoX = (width - logoW) / 2;
          doc.addImage(settings.about.logo, format, receiptLogoX, y, logoW, logoH);
          y += logoH + 4;
        } catch {
          /* ignore invalid image */
        }
        break;
      }
      case "shop_name": {
        if (!ro.showShopName) break;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(headerName, center, y, { align: "center" });
        y += 4;
        doc.setFont("helvetica", "normal");
        break;
      }
      case "shop_address": {
        if (!ro.showShopAddress || shopAddressLines.length === 0) break;
        doc.setFontSize(8);
        shopAddressLines.forEach((line: string) => {
          ensurePage();
          doc.text(line.trim().slice(0, 50), center, y, { align: "center" });
          y += 4;
        });
        break;
      }
      case "location_phone": {
        if (!ro.showLocationPhone || !location?.phone?.trim()) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Tel: ${location.phone.trim().slice(0, 36)}`, center, y, { align: "center" });
        y += 4;
        break;
      }
      case "location_email": {
        if (!ro.showLocationEmail || !location?.email?.trim()) break;
        doc.setFontSize(8);
        doc.splitTextToSize(location.email.trim().slice(0, 100), width - 2 * pad).forEach((w: string) => {
          ensurePage();
          doc.text(w, center, y, { align: "center" });
          y += 4;
        });
        break;
      }
      case "receipt_title": {
        if (!ro.showReceiptTitle) break;
        y += 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        ensurePage();
        doc.text("RECEIPT", center, y, { align: "center" });
        y += 5;
        doc.setFont("helvetica", "normal");
        break;
      }
      case "ref_date": {
        if (!ro.showReferenceAndDate) break;
        doc.setFontSize(sfp("ref_date"));
        ensurePage();
        doc.text(`Ref: ${sale.reference}`, pad, y);
        doc.text(formatDate(sale.createdAt), width - pad, y, { align: "right" });
        y += 5;
        markMeta();
        break;
      }
      case "reference_qr": {
        if (!ro.showReceiptReferenceQr) break;
        const qrPayload = String(sale.reference || "").trim() || String(sale._id || "");
        if (!qrPayload) break;
        try {
          ensurePage();
          y += 1;
          const cap = Math.min(ro.receiptReferenceQrSizeMm, width - 2 * pad - 4);
          const qrMm = Math.min(30, Math.max(14, cap));
          const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 200,
            margin: 1,
            errorCorrectionLevel: "M",
          });
          doc.addImage(qrDataUrl, "PNG", (width - qrMm) / 2, y, qrMm, qrMm);
          y += qrMm + 2;
          doc.setFontSize(Math.min(sfp("reference_qr"), 7));
          doc.setFont("helvetica", "normal");
          doc.text(qrPayload.slice(0, 32), center, y, { align: "center" });
          y += 4;
          markMeta();
        } catch {
          /* ignore QR failure */
        }
        break;
      }
      case "customer_name_address": {
        if (!ro.showCustomerNameAndAddress || !(sale.customerName || sale.customerAddress)) break;
        doc.setFontSize(sfp("customer_name_address"));
        if (sale.customerName) {
          ensurePage();
          doc.text(sale.customerName.slice(0, 40), pad, y);
          y += 4;
        }
        if (sale.customerAddress) {
          sale.customerAddress
            .split("\n")
            .filter(Boolean)
            .slice(0, 3)
            .forEach((ln) => {
              doc.splitTextToSize(ln.trim(), width - 2 * pad).forEach((w: string) => {
                ensurePage();
                doc.text(w, pad, y);
                y += 3.5;
              });
            });
        }
        y += 2;
        markMeta();
        break;
      }
      case "customer_phone": {
        if (!ro.showCustomerPhone || !sale.customerPhone?.trim()) break;
        ensurePage();
        doc.setFontSize(sfp("customer_phone"));
        doc.text(`Tel: ${sale.customerPhone.trim().slice(0, 36)}`, pad, y);
        y += 4;
        markMeta();
        break;
      }
      case "customer_email": {
        if (!ro.showCustomerEmail || !sale.customerEmail?.trim()) break;
        doc.setFontSize(sfp("customer_email"));
        doc.splitTextToSize(sale.customerEmail.trim().slice(0, 120), width - 2 * pad).forEach((w: string) => {
          ensurePage();
          doc.text(w, pad, y);
          y += 3.5;
        });
        doc.setFontSize(sfp("customer_phone"));
        markMeta();
        break;
      }
      case "items": {
        drawDividerBeforeItems();
        if (!ro.showLineItems) break;
        sale.items.forEach((item) => {
          ensurePage();
          const slugOrder = item.sku ? variantAttributeSlugsOrderBySku[item.sku] : undefined;
          const desc = invoiceItemsSummaryLine(item, slugOrder);
          doc.setFontSize(sfp("items"));
          doc.splitTextToSize(desc, width - 2 * pad).forEach((ln: string) => {
            ensurePage();
            doc.text(ln, pad, y);
            y += 4;
          });
          if (ro.showItemSerials && item.serialNumbers && item.serialNumbers.length > 0) {
            doc.setFontSize(sfp("items_serial"));
            doc.text(`IMEI: ${item.serialNumbers.join(", ").slice(0, 32)}`, pad, y);
            y += 3.5;
            doc.setFontSize(sfp("items_qty_price"));
          }
          doc.setFontSize(sfp("items_qty_price"));
          doc.text(`${item.quantity} x ${formatMoney(item.price)} = ${formatMoney(item.price * item.quantity)}`, pad, y);
          y += 5;
        });
        break;
      }
      case "total": {
        if (!ro.showTotal) break;
        y += 3;
        ensurePage();
        doc.line(pad, y, width - pad, y);
        y += 5;
        doc.setFontSize(sfp("total"));
        const receiptDiscountAmt = Number(sale.discount) || 0;
        if (receiptDiscountAmt > 0) {
          doc.setFont("helvetica", "normal");
          doc.text("Subtotal:", pad, y);
          doc.text(formatMoney(sale.subtotal), width - pad, y, { align: "right" });
          y += 5;
          const lbl =
            sale.discountType === "percent" && sale.discountValue
              ? `Discount (${Math.min(100, Number(sale.discountValue))}%):`
              : "Discount:";
          doc.text(lbl, pad, y);
          doc.text(`-${formatMoney(receiptDiscountAmt)}`, width - pad, y, { align: "right" });
          y += 5;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Total:", pad, y);
        doc.text(formatMoney(sale.total - receiptDiscountAmt), width - pad, y, { align: "right" });
        y += 6;
        doc.setFont("helvetica", "normal");

        /* ── Payment breakdown ── */
        const hasPayments =
          sale.payments && (sale.payments.cash || sale.payments.card || sale.payments.bank || sale.payments.credit);
        if (hasPayments) {
          ensurePage();
          doc.line(pad, y, width - pad, y);
          y += 4;
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Payments", pad, y);
          y += 4;
          doc.setFont("helvetica", "normal");
          const methodAmounts: { method: string; amount: number }[] = [];
          if (sale.payments!.cash) methodAmounts.push({ method: "Cash", amount: sale.payments!.cash });
          if (sale.payments!.card) methodAmounts.push({ method: "Card", amount: sale.payments!.card });
          if (sale.payments!.bank) methodAmounts.push({ method: "Bank", amount: sale.payments!.bank });
          if (sale.payments!.credit) methodAmounts.push({ method: "Balance to pay", amount: sale.payments!.credit });
          methodAmounts.forEach(({ method, amount }) => {
            ensurePage();
            doc.text(`${method} — ${formatMoney(amount)}`, pad, y);
            y += 4;
          });
          y += 2;
        }
        break;
      }
      case "terms": {
        if (!ro.showTermsText || !settings.notesTerms.receiptPrinterSalesTerms) break;
        doc.setFontSize(sfp("terms"));
        doc.splitTextToSize(settings.notesTerms.receiptPrinterSalesTerms, width - 2 * pad).forEach((line: string) => {
          if (y > 285) return;
          ensurePage();
          doc.text(line, pad, y);
          y += 3.5;
        });
        break;
      }
      case "thank_you": {
        if (!ro.showThankYou) break;
        y += 5;
        ensurePage();
        doc.setFontSize(sfp("thank_you"));
        doc.text("Thank you", center, y, { align: "center" });
        break;
      }
      default:
        break;
    }
  }

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

/** Build 80mm repair ticket PDF with QR (ref + edit URL). Async for QR generation. */
export async function buildRepairTicket80mmPdf(
  repair: RepairForPrint,
  settings: InvoiceSettings,
  location?: LocationForHeader | null
): Promise<string> {
  const rp = mergeReceiptPrinterRepairPrintOptions(settings.notesTerms.receiptPrinterRepairPrint);
  const width = rp.paperWidthMm;
  const pad = rp.sideMarginMm;
  const rfp = (k: RepairTicketFontSizeKey) => repairTicketFontPt(rp, k);
  const doc = new jsPDF({ unit: "mm", format: [width, 297], hotfixes: ["px_scaling"] });
  let y = 10;
  const center = width / 2;

  const headerName = location?.name ?? settings.about.appName ?? "Company";
  const postalLines = location ? getLocationPostalLinesOnly(location) : [];
  const companyAddrLines = (settings.about.companyAddress || "").split("\n").filter(Boolean);
  const shopAddressLines = location ? postalLines : companyAddrLines;

  const qrSize = rp.qrSizeMm;
  const problem = repair.problemType ?? repair.devices?.[0]?.problemType ?? "";
  const multiDevice = (repair.devices?.length ?? 0) > 1;

  let printedBody = false;
  let footerDividerDone = false;
  const markBody = () => {
    printedBody = true;
  };
  const ensurePage = () => {
    if (y > 280) {
      doc.addPage([width, 297], "p");
      y = 10;
    }
  };
  const drawFooterDivider = () => {
    if (footerDividerDone || !printedBody) return;
    y += 3;
    ensurePage();
    doc.line(pad, y, width - pad, y);
    y += 5;
    footerDividerDone = true;
  };

  for (const section of rp.sectionOrder) {
    switch (section) {
      case "rt_logo": {
        if (!rp.showLogo || !settings.about.logo) break;
        try {
          const format = (settings.about.logo as string).startsWith("data:image/jpeg") ? "JPEG" : "PNG";
          const maxW = 22;
          const maxH = 16;
          const { width: naturalW, height: naturalH } = await loadImageDimensions(settings.about.logo as string);
          const aspect = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : maxW / maxH;
          let logoW = maxW;
          let logoH = logoW / aspect;
          if (logoH > maxH) {
            logoH = maxH;
            logoW = logoH * aspect;
          }
          const receiptLogoX = (width - logoW) / 2;
          doc.addImage(settings.about.logo, format, receiptLogoX, y, logoW, logoH);
          y += logoH + 4;
        } catch {
          /* ignore invalid image */
        }
        markBody();
        break;
      }
      case "rt_shop_name": {
        if (!rp.showShopName) break;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        ensurePage();
        doc.text(headerName, center, y, { align: "center" });
        y += 4;
        doc.setFont("helvetica", "normal");
        markBody();
        break;
      }
      case "rt_shop_address": {
        if (!rp.showShopAddress || shopAddressLines.length === 0) break;
        doc.setFontSize(8);
        shopAddressLines.forEach((line: string) => {
          ensurePage();
          doc.text(line.trim().slice(0, 50), center, y, { align: "center" });
          y += 4;
        });
        break;
      }
      case "rt_location_phone": {
        if (!rp.showLocationPhone || !location?.phone?.trim()) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Tel: ${location.phone.trim().slice(0, 36)}`, center, y, { align: "center" });
        y += 4;
        break;
      }
      case "rt_location_email": {
        if (!rp.showLocationEmail || !location?.email?.trim()) break;
        doc.setFontSize(8);
        doc.splitTextToSize(location.email.trim().slice(0, 100), width - 2 * pad).forEach((w: string) => {
          ensurePage();
          doc.text(w, center, y, { align: "center" });
          y += 4;
        });
        break;
      }
      case "rt_ticket_title": {
        if (!rp.showTicketTitle) break;
        y += 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        ensurePage();
        doc.text("REPAIR TICKET", center, y, { align: "center" });
        y += 5;
        doc.setFont("helvetica", "normal");
        markBody();
        break;
      }
      case "rt_qr": {
        if (!rp.showQrCode) break;
        const qrPayload = repair.reference;
        try {
          const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 200, margin: 0 });
          ensurePage();
          doc.addImage(qrDataUrl, "PNG", (width - qrSize) / 2, y, qrSize, qrSize);
        } catch {
          doc.setFontSize(rfp("rt_reference"));
          ensurePage();
          doc.text(`Ref: ${repair.reference}`, center, y + qrSize / 2, { align: "center" });
        }
        y += qrSize + 4;
        markBody();
        break;
      }
      case "rt_reference": {
        if (!rp.showReferenceLine) break;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Ref: ${repair.reference}`, width - pad, y, { align: "right" });
        y += 4;
        markBody();
        break;
      }
      case "rt_date": {
        if (!rp.showDate || !repair.receivedAt) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Date: ${formatDate(repair.receivedAt)}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_customer": {
        if (!rp.showCustomerName) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Customer: ${(repair.customerName || "—").slice(0, 32)}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_phone": {
        if (!rp.showContactPhone || !repair.contactPhone) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Phone: ${repair.contactPhone.slice(0, 24)}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_email": {
        if (!rp.showContactEmail || !repair.contactEmail?.trim()) break;
        doc.setFontSize(8);
        doc.splitTextToSize(repair.contactEmail.trim().slice(0, 100), width - 2 * pad).forEach((w: string) => {
          ensurePage();
          doc.text(w, pad, y);
          y += 4;
        });
        markBody();
        break;
      }
      case "rt_device": {
        if (!rp.showDeviceDescription) break;
        doc.setFontSize(8);
        if (multiDevice && repair.devices) {
          repair.devices.forEach((d, i) => {
            ensurePage();
            doc.setFont("helvetica", "bold");
            doc.text(`Device ${i + 1}: ${(d.deviceDescription || "—").slice(0, 30)}`, pad, y);
            doc.setFont("helvetica", "normal");
            y += 4;
            if (rp.showSerialNumber) {
              ensurePage();
              doc.text(`  IMEI/Serial: ${(d.serialNumber || "—").slice(0, 26)}`, pad, y);
              y += 4;
            }
            if (rp.showDevicePassword && d.devicePassword?.trim()) {
              ensurePage();
              doc.text(`  Password: ${d.devicePassword.trim().slice(0, 22)}`, pad, y);
              y += 4;
            }
            if (rp.showProblemType && d.problemType?.trim()) {
              doc.splitTextToSize(`  Problem: ${d.problemType.trim()}`, width - 2 * pad).forEach((line: string) => {
                ensurePage();
                doc.text(line, pad, y);
                y += 4;
              });
            }
          });
        } else {
          ensurePage();
          doc.text(`Device: ${(repair.deviceDescription || "—").slice(0, 36)}`, pad, y);
          y += 4;
        }
        markBody();
        break;
      }
      case "rt_serial": {
        if (!rp.showSerialNumber || multiDevice) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`IMEI/Serial: ${(repair.serialNumber || "—").slice(0, 28)}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_device_password": {
        if (!rp.showDevicePassword || multiDevice || !repair.devicePassword?.trim()) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Password: ${repair.devicePassword.trim().slice(0, 24)}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_problem": {
        if (!rp.showProblemType || multiDevice || !problem) break;
        doc.setFontSize(8);
        doc.splitTextToSize(`Problem: ${problem}`, width - 2 * pad).forEach((line: string) => {
          ensurePage();
          doc.text(line, pad, y);
          y += 4;
        });
        markBody();
        break;
      }
      case "rt_estimated_cost": {
        if (!rp.showEstimatedCost || repair.estimatedCost == null) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text(`Est. cost: ${formatMoney(repair.estimatedCost)}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_items": {
        if (!rp.showRepairItems || !repair.repairItems?.length) break;
        y += 2;
        ensurePage();
        doc.line(pad, y, width - pad, y);
        y += 4;
        doc.setFontSize(8);
        for (const item of repair.repairItems) {
          ensurePage();
          const desc = (item.description || "Item").slice(0, 40);
          doc.text(desc, pad, y);
          doc.text(formatMoney(item.amount), width - pad, y, { align: "right" });
          y += 4;
        }
        y += 2;
        markBody();
        break;
      }
      case "rt_actual_cost": {
        if (!rp.showActualCost || repair.actualCost == null) break;
        y += 2;
        ensurePage();
        doc.line(pad, y, width - pad, y);
        y += 4;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Total:", pad, y);
        doc.text(formatMoney(repair.actualCost), width - pad, y, { align: "right" });
        y += 4;
        doc.setFont("helvetica", "normal");
        markBody();
        break;
      }
      case "rt_status": {
        if (!rp.showStatus || !repair.status) break;
        doc.setFontSize(8);
        ensurePage();
        const statusLabel = repair.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        doc.text(`Status: ${statusLabel}`, pad, y);
        y += 4;
        markBody();
        break;
      }
      case "rt_notes": {
        if (!rp.showNotes || !repair.notes?.trim()) break;
        doc.setFontSize(8);
        doc.splitTextToSize(`Notes: ${repair.notes.trim()}`, width - 2 * pad).forEach((line: string) => {
          if (y > 285) return;
          ensurePage();
          doc.text(line, pad, y);
          y += 4;
        });
        markBody();
        break;
      }
      case "rt_terms": {
        drawFooterDivider();
        if (!rp.showTermsText || !settings.notesTerms.receiptPrinterRepairTerms) break;
        doc.setFontSize(8);
        doc.splitTextToSize(settings.notesTerms.receiptPrinterRepairTerms, width - 2 * pad).forEach((line: string) => {
          if (y > 285) return;
          ensurePage();
          doc.text(line, center, y, { align: "center" });
          y += 4;
        });
        y += 2;
        break;
      }
      case "rt_thank_you": {
        drawFooterDivider();
        if (!rp.showThankYou) break;
        doc.setFontSize(8);
        ensurePage();
        doc.text("Thank you", center, y, { align: "center" });
        break;
      }
      default:
        break;
    }
  }

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

/** PDF blob URL + raw base64 for silent print agent. */
export interface RepairLabelPdfResult {
  objectUrl: string;
  base64: string;
}

/** Optional layout override for silent DYMO path only (see {@link printRepairLabel57x32}). */
export interface BuildRepairLabelPdfOptions {
  /** Swap QR and text columns in the generated PDF (not mirrored). */
  applySilentColumnSwap?: boolean;
}

/** Build device label PDF; layout from Notes & Terms repair label settings (use {@link getRepairLabelPrintSettings}). */
export async function buildRepairLabel57x32Pdf(
  repair: RepairForPrint,
  labelPrint: Partial<RepairLabelPrintSettings> | RepairLabelPrintSettings,
  options?: BuildRepairLabelPdfOptions
): Promise<RepairLabelPdfResult> {
  const opts = mergeRepairLabelPrintSettings(labelPrint);
  const qrLayoutPosition: RepairLabelQrPosition =
    options?.applySilentColumnSwap === true
      ? opts.qrPosition === "left"
        ? "right"
        : "left"
      : opts.qrPosition;
  const widthMm = opts.labelWidthMm;
  const heightMm = opts.labelHeightMm;
  const pad = heightMm <= 34 ? 0.9 : 1.2;
  const gap = heightMm <= 34 ? 1.2 : 1.5;
  const landscape = widthMm >= heightMm;

  const doc = new jsPDF({
    unit: "mm",
    format: [widthMm, heightMm],
    orientation: landscape ? "landscape" : "portrait",
    hotfixes: ["px_scaling"],
  });

  await registerRepairLabelEmbeddedFont(doc);
  doc.setFont(REPAIR_LABEL_JSPDF_FONT.family, REPAIR_LABEL_JSPDF_FONT.style);

  // Solid black for text/lines so PDF→raster (pdf.js) is not faint gray vs QR PNG.
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const qrCap = Math.min(opts.qrSizeMm, Math.max(4, Math.min(pageW, pageH) - 2 * pad));
  const showQr = opts.showQr && qrCap >= 6;

  let textLeft = pad;
  let textWidth = pageW - 2 * pad;
  let qrX = pad;
  const qrY = pad;

  if (showQr) {
    if (qrLayoutPosition === "right") {
      textLeft = pad;
      textWidth = pageW - 2 * pad - gap - qrCap;
      qrX = pageW - pad - qrCap;
    } else {
      textLeft = pad + qrCap + gap;
      textWidth = pageW - textLeft - pad;
      qrX = pad;
    }
  }
  textWidth = Math.max(6, textWidth);

  /** Match canvas label: ~5px at 300dpi so right-aligned text does not clip when printed */
  const rightInsetMm = opts.textAlign === "right" ? (5 * 25.4) / 300 : 0;
  const wrapTextWidthMm = Math.max(4, textWidth - rightInsetMm);

  const qrPayload = repair.reference;
  let qrDataUrl: string | null = null;
  if (showQr) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 180, margin: 0 });
    } catch {
      qrDataUrl = null;
    }
  }

  const lineStep = opts.lineHeightMm;
  const bottom = pageH - pad;

  const textXForLine = () => {
    if (opts.textAlign === "center") return textLeft + textWidth / 2;
    if (opts.textAlign === "right") return textLeft + textWidth - rightInsetMm;
    return textLeft;
  };

  /** Slight offset duplicate so pdf.js/canvas has more ink coverage after supersample+threshold (DYMO raster path). */
  const fauxDxMm = 0.08;
  const drawLabelText = (
    seg: string,
    x: number,
    yPos: number,
    textOpts: { align: typeof opts.textAlign; maxWidth: number }
  ) => {
    doc.text(seg, x, yPos, textOpts);
    if (opts.textAlign === "right") {
      doc.text(seg, x - fauxDxMm, yPos, textOpts);
    } else if (opts.textAlign === "center") {
      doc.text(seg, x + fauxDxMm, yPos, textOpts);
      doc.text(seg, x - fauxDxMm, yPos, textOpts);
    } else {
      doc.text(seg, x + fauxDxMm, yPos, textOpts);
    }
  };

  /** First baseline (mm): ~cap height below top padding; matches canvas intent without using px-scale 0.85 here. */
  let y = pad + opts.fontSizePt * 0.45;
  const drawLine = (raw: string, fieldId: RepairLabelTextFieldId) => {
    if (y > bottom) return;
    doc.setFontSize(repairLabelFieldFontPt(opts, fieldId));
    const line = raw.replace(/\n/g, " ").trim() || "—";
    const lines = doc.splitTextToSize(line, wrapTextWidthMm);
    for (const seg of lines) {
      if (y > bottom) return;
      drawLabelText(seg, textXForLine(), y, {
        align: opts.textAlign,
        maxWidth: wrapTextWidthMm,
      });
      y += lineStep;
    }
  };

  const drawDevicePage = (r: RepairForPrint) => {
    if (showQr) {
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrCap, qrCap);
      } else {
        doc.setFontSize(Math.min(8, repairLabelFieldFontPt(opts, "reference") + 1));
        doc.setFont(REPAIR_LABEL_JSPDF_FONT.family, REPAIR_LABEL_JSPDF_FONT.style);
        doc.text(r.reference.slice(0, 8), qrX + qrCap / 2, pageH / 2, { align: "center" });
      }
    }

    doc.setFont(REPAIR_LABEL_JSPDF_FONT.family, REPAIR_LABEL_JSPDF_FONT.style);
    y = pad + opts.fontSizePt * 0.45;

    const serial =
      (r.serialNumber || r.devices?.find((d) => d.serialNumber)?.serialNumber || "").trim() || "—";

    const drawProblemBlock = () => {
      if (!opts.showProblemType) return;
      doc.setFontSize(repairLabelFieldFontPt(opts, "problemType"));
      const problem = (r.problemType ?? r.devices?.[0]?.problemType ?? "—").replace(/\n/g, " ").slice(0, 80);
      const problemLines = doc.splitTextToSize(problem, wrapTextWidthMm).slice(0, opts.maxProblemLines);
      const tight = Math.max(lineStep - 0.15, repairLabelFieldFontPt(opts, "problemType") * 0.45);
      for (const pl of problemLines) {
        if (y > bottom) break;
        drawLabelText(pl, textXForLine(), y, { align: opts.textAlign, maxWidth: wrapTextWidthMm });
        y += tight;
      }
    };

    const paintField = (fieldId: RepairLabelTextFieldId) => {
      switch (fieldId) {
        case "reference":
          if (opts.showReferenceText) drawLine(r.reference, "reference");
          break;
        case "customerName":
          if (opts.showCustomerName) drawLine((r.customerName || "—").slice(0, 40), "customerName");
          break;
        case "contactPhone":
          if (opts.showContactPhone) drawLine((r.contactPhone || "—").slice(0, 28), "contactPhone");
          break;
        case "contactEmail":
          if (opts.showContactEmail && r.contactEmail?.trim()) {
            drawLine(r.contactEmail.trim().slice(0, 40), "contactEmail");
          }
          break;
        case "deviceDescription":
          if (opts.showDeviceDescription) drawLine((r.deviceDescription || "—").slice(0, 40), "deviceDescription");
          break;
        case "serialNumber":
          if (opts.showSerialNumber) drawLine(serial.slice(0, 36), "serialNumber");
          break;
        case "problemType":
          drawProblemBlock();
          break;
        case "estimatedCost":
          if (opts.showEstimatedCost && r.estimatedCost != null) {
            drawLine(`Est: ${formatMoney(r.estimatedCost)}`, "estimatedCost");
          }
          break;
        default:
          break;
      }
    };

    for (const fieldId of opts.textFieldOrder) {
      paintField(fieldId);
    }
  };

  const devicesToRender: RepairForPrint[] =
    (repair.devices?.length ?? 0) > 1 && repair.devices
      ? repair.devices.map((d) => projectRepairForDevice(repair, d))
      : [repair];

  for (let i = 0; i < devicesToRender.length; i++) {
    if (i > 0) {
      doc.addPage([widthMm, heightMm], landscape ? "landscape" : "portrait");
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(0, 0, 0);
    }
    drawDevicePage(devicesToRender[i]);
  }

  const outBlob = doc.output("blob") as Blob;
  const raw = new Uint8Array(await outBlob.arrayBuffer());
  // Do not run pdf-lib normalize here: PDFDocument.load/save can break jsPDF-embedded TTF streams so
  // pdf.js + canvas on the print agent renders QR (image) but not text. Browser print still uses this PDF.
  const base64 = uint8ToBase64(raw);
  const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(raw)], { type: "application/pdf" }));
  return { objectUrl, base64 };
}

const REPAIR_LABEL_PRINT_LOG = "[repair-label-print]";

/** How a repair label was produced when using {@link printRepairLabel57x32} or silent-or-preview helpers. */
export type RepairLabelPrintRuntimePath = "label-png" | "pdf-silent" | "browser";

/**
 * Try browser PNG → agent GDI, then PDF → agent raster; if both fail, yields a blob URL for browser print.
 * Used by the repair edit "Print label" action and `/repairs/print` label flow.
 */
export async function repairLabelSilentOrBrowserObjectUrl(
  repair: RepairForPrint
): Promise<
  | { kind: "silent"; path: "label-png" | "pdf-silent" }
  | { kind: "preview"; objectUrl: string }
> {
  const labelPrint = await getRepairLabelPrintSettings();
  const printingSettings =
    typeof window !== "undefined" ? await loadPrintingSettings() : null;
  if (!isLabelSilentPrintingConfigured(printingSettings)) {
    const browserPdf = await buildRepairLabel57x32Pdf(repair, labelPrint, {
      applySilentColumnSwap: false,
    });
    return { kind: "preview", objectUrl: browserPdf.objectUrl };
  }

  const job = `repair-label-${(repair.reference || "ticket").replace(/[^\w.-]+/g, "_")}`;
  const useSilentColumnSwap = labelPrint.silentPrintLayoutMode === "swap_columns";
  const multiDevice = (repair.devices?.length ?? 0) > 1 && !!repair.devices;

  if (multiDevice) {
    // PNG path renders a single image — skip and let multi-device print one PNG per device.
    let allSent = true;
    for (const d of repair.devices!) {
      const perDeviceRepair = projectRepairForDevice(repair, d);
      try {
        const pngPayload = await buildRepairLabelPngForDymoAgent(perDeviceRepair, labelPrint, {
          applySilentColumnSwap: useSilentColumnSwap,
        });
        const pngOk = await printRepairLabelCanvasPngToAgent(
          pngPayload.pngBase64,
          `${job}-d${d.serialNumber || d.deviceDescription || "x"}`,
          pngPayload.gdiWidthMm,
          pngPayload.gdiHeightMm
        );
        if (!pngOk) {
          allSent = false;
          break;
        }
      } catch (e) {
        console.info(REPAIR_LABEL_PRINT_LOG, "PNG canvas/build error (multi-device); PDF silent fallback:", e);
        allSent = false;
        break;
      }
    }
    if (allSent) {
      console.info(REPAIR_LABEL_PRINT_LOG, "chosen: label-png (multi-device)");
      return { kind: "silent", path: "label-png" };
    }
    // fall through to PDF silent path with multi-page PDF
  } else {
    try {
      const pngPayload = await buildRepairLabelPngForDymoAgent(repair, labelPrint, {
        applySilentColumnSwap: useSilentColumnSwap,
      });
      const pngOk = await printRepairLabelCanvasPngToAgent(
        pngPayload.pngBase64,
        job,
        pngPayload.gdiWidthMm,
        pngPayload.gdiHeightMm
      );
      if (pngOk) {
        console.info(REPAIR_LABEL_PRINT_LOG, "chosen: label-png");
        return { kind: "silent", path: "label-png" };
      }
      console.info(REPAIR_LABEL_PRINT_LOG, "PNG agent did not complete; trying PDF silent (raster) fallback");
    } catch (e) {
      console.info(REPAIR_LABEL_PRINT_LOG, "PNG canvas/build error; PDF silent fallback:", e);
    }
  }

  const silentPdf = await buildRepairLabel57x32Pdf(repair, labelPrint, {
    applySilentColumnSwap: useSilentColumnSwap,
  });
  if ((await printLabelsPdf(silentPdf.base64, job)).sent) {
    URL.revokeObjectURL(silentPdf.objectUrl);
    console.info(REPAIR_LABEL_PRINT_LOG, "chosen: pdf-silent (agent raster fallback)");
    return { kind: "silent", path: "pdf-silent" };
  }
  console.info(REPAIR_LABEL_PRINT_LOG, "PDF silent failed; browser preview PDF");

  let objectUrl: string;
  if (useSilentColumnSwap) {
    URL.revokeObjectURL(silentPdf.objectUrl);
    const browserPdf = await buildRepairLabel57x32Pdf(repair, labelPrint, {
      applySilentColumnSwap: false,
    });
    objectUrl = browserPdf.objectUrl;
  } else {
    objectUrl = silentPdf.objectUrl;
  }
  return { kind: "preview", objectUrl };
}

/** Project a repair onto a single device so per-device print produces one device's label. */
function projectRepairForDevice(
  repair: RepairForPrint,
  device: NonNullable<RepairForPrint["devices"]>[number]
): RepairForPrint {
  return {
    ...repair,
    deviceDescription: device.deviceDescription || repair.deviceDescription,
    serialNumber: device.serialNumber ?? repair.serialNumber,
    problemType: device.problemType ?? repair.problemType,
    devicePassword: device.devicePassword ?? repair.devicePassword,
    devices: undefined,
  };
}

/** Try label-png → agent GDI, then PDF silent → agent raster, else open PDF for browser print. */
export async function printRepairLabel57x32(repair: RepairForPrint): Promise<RepairLabelPrintRuntimePath> {
  const labelPrint = await getRepairLabelPrintSettings();
  let objectUrl: string;

  if (typeof window !== "undefined") {
    const r = await repairLabelSilentOrBrowserObjectUrl(repair);
    if (r.kind === "silent") {
      return r.path;
    }
    objectUrl = r.objectUrl;
  } else {
    const r = await buildRepairLabel57x32Pdf(repair, labelPrint, { applySilentColumnSwap: false });
    objectUrl = r.objectUrl;
  }

  console.info(REPAIR_LABEL_PRINT_LOG, "chosen: browser (PDF preview / print dialog)");

  if (typeof window === "undefined") {
    URL.revokeObjectURL(objectUrl);
    return "browser";
  }

  // Do not pass noopener: with it, many browsers return null even when a tab opened, which then
  // triggers the fallback and causes a duplicate tab or an unwanted file download.
  const w = window.open(objectUrl, "_blank");
  if (w) {
    w.onload = () => {
      w.focus();
      w.print();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    };
    setTimeout(() => {
      try {
        if (w && !w.closed) {
          w.focus();
          w.print();
        }
      } catch {
        // ignore
      }
    }, 800);
  } else {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  }
  return "browser";
}

/** Fetch settings, build 80mm repair ticket with QR, open in new tab and trigger print dialog. */
export async function printRepairTicket80mm(repair: RepairForPrint): Promise<void> {
  const [settings, location] = await Promise.all([
    getInvoiceSettings(),
    fetchLocationHeaderById(repair.locationId),
  ]);
  const url = await buildRepairTicket80mmPdf(repair, settings, location);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => {
      w.focus();
      w.print();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    setTimeout(() => {
      try {
        if (w && !w.closed) {
          w.focus();
          w.print();
        }
      } catch {
        // ignore
      }
    }, 800);
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/** Fetch settings, build A4 invoice, open in new tab and trigger print dialog. */
export async function printInvoiceA4(sale: SaleForPrint): Promise<void> {
  const [settings, context] = await Promise.all([
    getInvoiceSettings(),
    getSalePrintContext(sale._id).catch((): Awaited<ReturnType<typeof getSalePrintContext>> => ({
      sale,
      location: null,
      fallbackLabel: null,
      variantAttributeSlugsOrderBySku: {},
    })),
  ]);
  const url = await buildInvoicePdf(
    sale,
    settings,
    context.location,
    context.variantAttributeSlugsOrderBySku ?? {}
  );
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => {
      w.focus();
      w.print();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    setTimeout(() => {
      try {
        if (w && !w.closed) {
          w.focus();
          w.print();
        }
      } catch {
        // ignore
      }
    }, 800);
  } else {
    // Popup blocked: open in new tab (no download) so user can print from there
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

const safeInvoiceFilename = (reference: string) =>
  String(reference || "invoice").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "invoice";

/** Same PDF as A4 print, but save as file (wholesale modal). */
export async function downloadInvoiceA4(sale: SaleForPrint): Promise<void> {
  const [settings, context] = await Promise.all([
    getInvoiceSettings(),
    getSalePrintContext(sale._id).catch((): Awaited<ReturnType<typeof getSalePrintContext>> => ({
      sale,
      location: null,
      fallbackLabel: null,
      variantAttributeSlugsOrderBySku: {},
    })),
  ]);
  const url = await buildInvoicePdf(
    sale,
    settings,
    context.location,
    context.variantAttributeSlugsOrderBySku ?? {}
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${safeInvoiceFilename(sale.reference)}.pdf`;
  a.rel = "noopener";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Fetch settings, build 80mm receipt, open in new tab and trigger print dialog. */
export async function printReceipt80mm(sale: SaleForPrint): Promise<void> {
  const [settings, context] = await Promise.all([
    getInvoiceSettings(),
    getSalePrintContext(sale._id).catch((): Awaited<ReturnType<typeof getSalePrintContext>> => ({
      sale,
      location: null,
      fallbackLabel: null,
      variantAttributeSlugsOrderBySku: {},
    })),
  ]);
  const url = await buildReceipt80mmPdf(
    sale,
    settings,
    context.location,
    context.variantAttributeSlugsOrderBySku ?? {}
  );
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => {
      w.focus();
      w.print();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    setTimeout(() => {
      try {
        if (w && !w.closed) {
          w.focus();
          w.print();
        }
      } catch {
        // ignore
      }
    }, 800);
  } else {
    // Popup blocked: open in new tab (no download) so user can print from there
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

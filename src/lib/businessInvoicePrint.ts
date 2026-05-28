/**
 * Professional A4 business invoice PDF (separate from dispatch / legacy A4 template).
 */
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { mergeBusinessInvoicePdfPrintOptions } from "./businessInvoicePdfPrintOptions";
import type { BusinessInvoicePdfPrintOptions } from "./businessInvoicePdfPrintOptions";
import {
  getInvoiceSettings,
  getSalePrintContext,
  mergeSaleTaxSnapshot,
  saleHasTaxSnapshot,
  saleInvoiceDisplayDate,
  invoiceItemDescriptionForPrint,
  taxForPrintLine,
  type InvoiceSettings,
  type LocationForHeader,
  type SaleForPrint,
  type TaxForPrint,
} from "./invoicePrint";

const NAVY = { r: 26, g: 35, b: 64 };
const SLATE = NAVY;
const MUTED = { r: 100, g: 116, b: 139 };
const BORDER = { r: 226, g: 232, b: 240 };
const PANEL_BG = { r: 247, g: 248, b: 250 };
const GREEN = { r: 5, g: 150, b: 105 };
const GREEN_BG = { r: 236, g: 253, b: 245 };
const MONEY_EPS = 0.004;

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getLocationHeaderLines(loc: LocationForHeader | null): string[] {
  if (!loc) return [];
  const lines: string[] = [];
  if (loc.address?.trim()) lines.push(loc.address.trim());
  if (loc.city?.trim()) lines.push(loc.city.trim());
  if (loc.postcode?.trim()) lines.push(loc.postcode.trim());
  if (loc.country?.trim()) lines.push(loc.country.trim());
  if (loc.phone?.trim()) lines.push(`Tel: ${loc.phone.trim()}`);
  if (loc.email?.trim()) lines.push(loc.email.trim());
  return lines.slice(0, 8);
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

/** Location branch details override company-wide About settings when set. */
function resolveRegistrationSource(
  about: { companyNumber?: string; vatNumber?: string },
  location?: LocationForHeader | null
): { companyNumber?: string; vatNumber?: string } {
  const co = (location?.companyNumber ?? about.companyNumber ?? "").trim();
  const vat = (location?.vatNumber ?? about.vatNumber ?? "").trim();
  return {
    companyNumber: co || undefined,
    vatNumber: vat || undefined,
  };
}

function companyRegistrationLines(
  legal: { companyNumber?: string; vatNumber?: string },
  io: BusinessInvoicePdfPrintOptions
): string[] {
  const lines: string[] = [];
  const co = (legal.companyNumber ?? "").trim();
  const vat = (legal.vatNumber ?? "").trim();
  if (io.showCompanyNumber && co) lines.push(`Company no. ${co}`);
  if (io.showVatNumber && vat) lines.push(`VAT no. ${vat}`);
  return lines;
}

function footerLegalText(
  companyName: string,
  legal: { companyNumber?: string; vatNumber?: string },
  io: BusinessInvoicePdfPrintOptions
): string | null {
  if (!io.showFooterLegalLine) return null;
  const parts: string[] = [companyName];
  const co = (legal.companyNumber ?? "").trim();
  const vat = (legal.vatNumber ?? "").trim();
  if (io.showCompanyNumber && co) parts.push(`Company no. ${co}`);
  if (io.showVatNumber && vat) parts.push(`VAT no. ${vat}`);
  if (parts.length === 1 && !co && !vat) return companyName;
  return parts.join("   ·   ");
}

function drawPanel(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  doc.setFillColor(PANEL_BG.r, PANEL_BG.g, PANEL_BG.b);
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
}

function formatTaxLineLabel(tax: TaxForPrint | null): string {
  if (!tax) return "VAT";
  const name = tax.name.trim() || "VAT";
  if (tax.type === "percentage") {
    const rateStr = Number.isInteger(tax.rate) ? String(tax.rate) : tax.rate.toFixed(2).replace(/\.?0+$/, "");
    if (tax.code) return `${name} (${tax.code}) @ ${rateStr}%`;
    return `${name} @ ${rateStr}%`;
  }
  if (tax.code) return `${name} (${tax.code})`;
  return name;
}

function resolveSaleTaxAmount(sale: SaleForPrint): number {
  const stored = Number(sale.tax);
  if (!Number.isFinite(stored) || stored <= 0) return 0;
  return Math.round(stored * 100) / 100;
}

function drawMutedLabel(doc: jsPDF, text: string, x: number, y: number, pt: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(pt);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(text, x, y);
  doc.setTextColor(0, 0, 0);
}

function isMeaningfulAddressLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^n\/?a$/i.test(t) || t === "—" || t === "-") return false;
  return true;
}

function computeWholesaleBalanceDue(sale: SaleForPrint): number {
  const prevBal = Math.max(0, Number(sale.previousBalance) || 0);
  const invTotal = Math.max(0, (Number(sale.total) || 0) - (Number(sale.discount) || 0));
  const totalDueBeforePayments = prevBal + invTotal;
  const payments = sale.payments || {};
  const received =
    (Number(payments.cash) || 0) +
    (Number(payments.card) || 0) +
    (Number(payments.bank) || 0);
  return Math.max(0, Math.round((totalDueBeforePayments - received) * 100) / 100);
}

function drawStatusBadge(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  fill: { r: number; g: number; b: number },
  widthMm = 22
) {
  const w = widthMm;
  const h = 7;
  doc.setFillColor(fill.r, fill.g, fill.b);
  doc.roundedRect(x - w, y - h + 1, w, h, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(label.length > 8 ? 6.5 : 8);
  doc.setTextColor(255, 255, 255);
  doc.text(label, x - w / 2, y - 1.5, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

function drawPaidBadge(doc: jsPDF, x: number, y: number) {
  drawStatusBadge(doc, x, y, "PAID", GREEN);
}

function drawSectionRule(doc: jsPDF, left: number, right: number, y: number) {
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.25);
  doc.line(left, y, right, y);
}

function ensureSpace(
  doc: jsPDF,
  currentY: number,
  requiredMm: number,
  topMarginMm: number,
  bottomLimitMm = 268
) {
  if (currentY + requiredMm <= bottomLimitMm) return currentY;
  doc.addPage();
  return topMarginMm + 8;
}

export type BusinessInvoiceSettings = InvoiceSettings & {
  notesTerms: InvoiceSettings["notesTerms"] & {
    businessInvoicePdfPrint: BusinessInvoicePdfPrintOptions;
    businessInvoiceTerms: string;
  };
};

/** Build professional A4 business invoice PDF. Returns blob URL. */
export async function buildBusinessInvoicePdf(
  sale: SaleForPrint,
  settings: BusinessInvoiceSettings,
  location?: LocationForHeader | null,
  variantAttributeSlugsOrderBySku: Record<string, string[]> = {}
): Promise<string> {
  const io = mergeBusinessInvoicePdfPrintOptions(settings.notesTerms.businessInvoicePdfPrint);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const left = io.marginMm;
  const right = pageW - io.marginMm;
  const contentW = right - left;
  const textBlockW = contentW;
  let y = io.marginMm;

  const companyName = settings.about.appName ?? "Company";
  const tradingName = location?.name?.trim() || companyName;
  const headerAddressLines = location
    ? getLocationHeaderLines(location)
    : (settings.about.companyAddress || "").split("\n").filter(Boolean);
  const legalSource = resolveRegistrationSource(settings.about, location);
  const legalLines = companyRegistrationLines(legalSource, io);
  const taxLine = taxForPrintLine(sale, settings.defaultTax);
  const taxAmount = resolveSaleTaxAmount(sale);
  /** Show VAT lines for 0% schemes (e.g. marginal VAT) when a tax category is on the sale. */
  const showTaxBreakdown = io.showTax && (taxAmount > 0 || saleHasTaxSnapshot(sale));
  const docTitle = io.documentTitle || "INVOICE";

  // Top accent bar
  doc.setFillColor(SLATE.r, SLATE.g, SLATE.b);
  doc.rect(0, 0, pageW, 2.5, "F");

  y = io.marginMm;

  // —— Header: company (left) + invoice meta box (right) ——
  const metaBoxW = 62;
  const metaBoxX = right - metaBoxW;
  let headerLeftY = y;

  if (io.showLogo && settings.about.logo) {
    try {
      const format = (settings.about.logo as string).startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      const maxLogoW = io.logoWidthMm;
      const maxLogoH = io.logoHeightMm;
      const { width: natW, height: natH } = await loadImageDimensions(settings.about.logo as string);
      const aspect = natW > 0 && natH > 0 ? natW / natH : maxLogoW / maxLogoH;
      let logoW = maxLogoW;
      let logoH = logoW / aspect;
      if (logoH > maxLogoH) {
        logoH = maxLogoH;
        logoW = logoH * aspect;
      }
      doc.addImage(settings.about.logo, format, left, y, logoW, logoH);
      headerLeftY = y + logoH + 4;
    } catch {
      /* ignore */
    }
  }

  const nameBaselineY = headerLeftY > y + 2 ? headerLeftY : y + 6;
  let addrY = nameBaselineY;
  // Keep the invoice visually branded even if the print option was disabled accidentally.
  // Without this fallback, the left header starts with the address and looks broken.
  if (io.showCompanyName || !settings.about.logo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontCompanyNamePt);
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
    doc.text(tradingName, left, nameBaselineY);
    addrY = nameBaselineY + 7;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(Math.max(io.fontBodyPt - 1, 8));
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  headerAddressLines.forEach((line) => {
    doc.text(line.trim(), left, addrY);
    addrY += 4.2;
  });
  legalLines.forEach((line) => {
    doc.setFont("helvetica", "bold");
    doc.text(line, left, addrY);
    addrY += 4.2;
    doc.setFont("helvetica", "normal");
  });
  doc.setTextColor(0, 0, 0);

  const metaBoxY = y;
  const metaBoxH = 32;
  drawPanel(doc, metaBoxX, metaBoxY, metaBoxW, metaBoxH);
  doc.setFillColor(NAVY.r, NAVY.g, NAVY.b);
  doc.rect(metaBoxX, metaBoxY, metaBoxW, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.min(io.fontDocTitlePt, 14));
  doc.setTextColor(255, 255, 255);
  doc.text(docTitle.toUpperCase(), metaBoxX + metaBoxW / 2, metaBoxY + 6.2, { align: "center" });
  let metaInnerY = metaBoxY + 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(io.fontTablePt);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Invoice no.", metaBoxX + 4, metaInnerY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
  doc.text(sale.reference, metaBoxX + metaBoxW - 4, metaInnerY, { align: "right" });
  metaInnerY += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Date", metaBoxX + 4, metaInnerY);
  doc.setTextColor(40, 40, 40);
  doc.text(formatDate(saleInvoiceDisplayDate(sale)), metaBoxX + metaBoxW - 4, metaInnerY, {
    align: "right",
  });
  doc.setTextColor(0, 0, 0);

  const balanceDueForBadge = computeWholesaleBalanceDue(sale);
  if (balanceDueForBadge <= MONEY_EPS && sale.type === "wholesale") {
    drawPaidBadge(doc, right - 2, metaBoxY + 4);
  }

  let headerBottom = Math.max(addrY, metaBoxY + metaBoxH);
  const invoiceQrPayload = String(sale.reference || "").trim() || String(sale._id || "");
  if (io.showInvoiceReferenceQr && invoiceQrPayload) {
    try {
      const qrDataUrl = await QRCode.toDataURL(invoiceQrPayload, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      const qrMm = Math.min(io.invoiceReferenceQrSizeMm, 24);
      const qrX = right - qrMm;
      const qrY = metaBoxY + metaBoxH + 2;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrMm, qrMm);
      headerBottom = Math.max(headerBottom, qrY + qrMm + 3);
    } catch {
      /* ignore */
    }
  }

  y = headerBottom + 8;
  drawSectionRule(doc, left, right, y);
  y += 6;

  // —— Bill to / From panels ——
  if (io.showBillTo) {
    const panelW = (contentW - 6) / 2;
    const fromX = left + panelW + 6;
    const panelPadTop = 6;
    const lineStep = 4;

    let billContentH = panelPadTop + 6 + 5;
    let fromContentH = panelPadTop + 6 + 5;

    const retailLike = sale.type === "retail" || sale.type === "repair";
    const billToLines: string[] = [];
    if (sale.customerAddress?.trim()) {
      sale.customerAddress
        .trim()
        .split("\n")
        .filter(isMeaningfulAddressLine)
        .forEach((line) => billToLines.push(line.trim()));
    }
    if (sale.customerPhone?.trim()) billToLines.push(sale.customerPhone.trim());
    if (sale.customerEmail?.trim()) billToLines.push(sale.customerEmail.trim());
    billContentH += billToLines.length * lineStep;

    const fromLines = headerAddressLines.filter(isMeaningfulAddressLine);
    fromContentH += fromLines.length * lineStep;

    const panelH = Math.max(26, Math.max(billContentH, fromContentH) + 4);

    drawPanel(doc, left, y, panelW, panelH);
    drawPanel(doc, fromX, y, panelW, panelH);

    let billY = y + panelPadTop;
    let fromY = y + panelPadTop;
    drawMutedLabel(doc, "BILL TO", left + 4, billY, io.fontSectionHeadingPt - 1);
    drawMutedLabel(doc, "FROM", fromX + 4, fromY, io.fontSectionHeadingPt - 1);
    billY += 6;
    fromY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontBodyPt);
    doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
    doc.text(sale.customerName || (retailLike ? "Walk-in Customer" : "—"), left + 4, billY);
    billY += 5;
    // Always show the sender name in FROM. Otherwise the panel looks empty and starts with an address.
    doc.text(tradingName, fromX + 4, fromY);
    fromY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontTablePt);
    doc.setTextColor(60, 60, 60);
    billToLines.forEach((line) => {
      doc.splitTextToSize(line, panelW - 8).forEach((ln: string) => {
        doc.text(ln, left + 4, billY);
        billY += lineStep;
      });
    });
    fromLines.forEach((line) => {
      doc.text(line, fromX + 4, fromY);
      fromY += lineStep;
    });
    doc.setTextColor(0, 0, 0);

    y += panelH + 8;
    drawSectionRule(doc, left, right, y);
    y += 6;
  }

  // —— Line items ——
  if (io.showItemsSummary) {
    const tableLeft = left;
    const tableW = contentW;
    const colPad = 4;
    const colDesc = tableLeft + colPad;
    const colQty = right - 58;
    const colUnit = right - 36;
    const colAmt = right - 3;
    const descMaxW = colQty - colDesc - 6;
    const headerH = 8;
    const rowPadY = 2;
    const lineStep = 4.2;

    if (showTaxBreakdown) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(Math.max(io.fontTablePt - 1, 7));
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text("Prices exclude VAT.", colDesc, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 5;
    }

    type ItemRowLayout = {
      descLines: string[];
      rowH: number;
      qty: string;
      unit: string;
      amount: string;
    };

    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    const rowLayouts: ItemRowLayout[] = sale.items.map((item) => {
      const desc = invoiceItemDescriptionForPrint(item, variantAttributeSlugsOrderBySku);
      const descLines = doc.splitTextToSize(desc, descMaxW);
      const textBlockH = Math.max(descLines.length * lineStep, 5);
      const rowH = textBlockH + rowPadY * 2;
      return {
        descLines,
        rowH,
        qty: String(item.quantity),
        unit: formatMoney(item.price),
        amount: formatMoney(item.price * item.quantity),
      };
    });

    const tableTop = y;
    doc.setFillColor(SLATE.r, SLATE.g, SLATE.b);
    doc.rect(tableLeft, tableTop, tableW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontTablePt);
    doc.setTextColor(255, 255, 255);
    const headerBaseline = tableTop + 5.5;
    doc.text("Description", colDesc, headerBaseline);
    doc.text("Qty", colQty, headerBaseline, { align: "right" });
    doc.text("Unit price", colUnit, headerBaseline, { align: "right" });
    doc.text("Amount", colAmt, headerBaseline, { align: "right" });
    doc.setTextColor(0, 0, 0);

    doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
    doc.setLineWidth(0.15);
    doc.line(tableLeft, tableTop + headerH, tableLeft + tableW, tableTop + headerH);

    let rowTop = tableTop + headerH;
    rowLayouts.forEach((layout, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(PANEL_BG.r, PANEL_BG.g, PANEL_BG.b);
        doc.rect(tableLeft, rowTop, tableW, layout.rowH, "F");
      }
      rowTop += layout.rowH;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    rowTop = tableTop + headerH;

    rowLayouts.forEach((layout) => {
    
      // FIXED TEXT POSITION
      const textY = rowTop + rowPadY + 4.2;
    
      layout.descLines.forEach((line: string, i: number) => {
        doc.text(
          line,
          colDesc,
          textY + i * lineStep
        );
      });
    
      doc.text(layout.qty, colQty, textY, {
        align: "right",
      });
    
      doc.text(layout.unit, colUnit, textY, {
        align: "right",
      });
    
      doc.text(layout.amount, colAmt, textY, {
        align: "right",
      });
    
      rowTop += layout.rowH;
    
      doc.line(
        tableLeft,
        rowTop,
        tableLeft + tableW,
        rowTop
      );
    });

    doc.setLineWidth(0.25);
    doc.rect(tableLeft, tableTop, tableW, rowTop - tableTop, "S");
    y = rowTop + 8;
  }

  // —— Totals box ——
  if (io.showInvoiceSummary) {
    const boxW = 82;
    const boxX = right - boxW;
    const discountAmt = Number(sale.discount) || 0;
    const subtotal = Number(sale.subtotal) || 0;
    const netAfterDiscount = Math.max(0, subtotal - discountAmt);
    const totalIncVat = Number(sale.total) || subtotal + taxAmount;
    const amountDue = totalIncVat - discountAmt;

    let boxH = 24;
    if (discountAmt > 0) boxH += 5;
    if (showTaxBreakdown) boxH += 10;
    else boxH += 5;

    y = ensureSpace(doc, y, boxH + 10, io.marginMm);
    drawPanel(doc, boxX, y, boxW, boxH);
    let ty = y + 6;
    const labelX = boxX + 4;
    const valX = boxX + boxW - 4;

    const row = (label: string, value: string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(io.fontBodyPt);
    
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text(label, labelX, ty);
    
      doc.setTextColor(0, 0, 0);
      doc.text(value, valX, ty, { align: "right" });
    
      // Better vertical spacing between total rows
      ty += 6.5;
    };

    row(showTaxBreakdown ? "Net amount (ex. VAT)" : "Subtotal", formatMoney(subtotal));
    if (discountAmt > 0) {
      const discLabel =
        sale.discountType === "percent" && sale.discountValue
          ? `Discount (${Math.min(100, Number(sale.discountValue))}%)`
          : "Discount";
      row(discLabel, `-${formatMoney(discountAmt)}`);
      if (showTaxBreakdown) {
        row("Net after discount", formatMoney(netAfterDiscount));
      }
    }
    if (showTaxBreakdown) {
      row(formatTaxLineLabel(taxLine), formatMoney(taxAmount));
      ty += 1;
      doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
      doc.setLineWidth(0.2);
      doc.line(labelX, ty, valX, ty);
      ty += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(io.fontSectionHeadingPt);
      doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
      doc.text("Total (inc. VAT)", labelX, ty);
      doc.text(formatMoney(totalIncVat), valX, ty, { align: "right" });
      doc.setTextColor(0, 0, 0);
      ty += 6;
      if (discountAmt > 0 || amountDue !== totalIncVat) {
        doc.setFontSize(io.fontBodyPt);
        row("Amount due", formatMoney(Math.max(0, amountDue)), true);
      }
    } else {
      ty += 1;
      doc.setDrawColor(SLATE.r, SLATE.g, SLATE.b);
      doc.setLineWidth(0.35);
      doc.line(labelX, ty, valX, ty);
      ty += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(io.fontSectionHeadingPt + 1);
      doc.text("Amount due", labelX, ty);
      doc.text(formatMoney(Math.max(0, amountDue)), valX, ty, { align: "right" });
      ty += 6;
    }
    doc.setFont("helvetica", "normal");
    y += boxH + 10;
  }

  const isWholesale = sale.type === "wholesale";
  const summaryPrevBal = Number(sale.previousBalance) || 0;
  const summaryInvTotal = (Number(sale.total) || 0) - (Number(sale.discount) || 0);
  const summaryTotalDueBeforePayments = summaryPrevBal + summaryInvTotal;
  const summaryPayments = sale.payments || {};
  const summaryReceived =
    (Number(summaryPayments.cash) || 0) +
    (Number(summaryPayments.card) || 0) +
    (Number(summaryPayments.bank) || 0);
  const summaryCredit = Number(summaryPayments.credit) || 0;
  const summaryBalanceDue = Math.max(0, summaryTotalDueBeforePayments - summaryReceived);
  const hasMeaningfulWholesaleSummary =
    summaryPrevBal > MONEY_EPS ||
    summaryReceived > MONEY_EPS ||
    summaryCredit > MONEY_EPS ||
    summaryBalanceDue > MONEY_EPS;
  const shouldShowAccountSummary = io.showAccountSummary && isWholesale && hasMeaningfulWholesaleSummary;

  if (shouldShowAccountSummary) {
    const prevBal = summaryPrevBal;
    const totalDueBeforePayments = summaryTotalDueBeforePayments;
    const received = summaryReceived;
    const balanceDue = summaryBalanceDue;
    const summaryH = received > 0 ? 38 : 33;

    y = ensureSpace(doc, y, summaryH + 8, io.marginMm);
    drawPanel(doc, left, y, contentW, summaryH);
    let ay = y + 6;
    drawMutedLabel(doc, "ACCOUNT SUMMARY", left + 4, ay, io.fontSectionHeadingPt - 1);
    ay += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);

    const summaryRow = (label: string, value: string) => {
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text(label, left + 4, ay);
      doc.setTextColor(40, 40, 40);
      doc.text(value, right - 4, ay, { align: "right" });
      ay += 5;
    };

    summaryRow("Previous balance", formatMoney(prevBal));
    summaryRow("This invoice + previous balance", formatMoney(totalDueBeforePayments));
    if (received > 0) {
      summaryRow("Payments received", `-${formatMoney(received)}`);
    }
    ay += 1;
    doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
    doc.line(left + 4, ay, right - 4, ay);
    ay += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(io.fontSectionHeadingPt);
    doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
    doc.text("Balance due", left + 4, ay);
    doc.text(formatMoney(balanceDue), right - 4, ay, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    y += summaryH + 8;
  }

  if (io.showPayments && sale.payments) {
    const receivedLines: string[] = [];
    if (sale.payments.cash) receivedLines.push(`Cash — ${formatMoney(sale.payments.cash)}`);
    if (sale.payments.card) receivedLines.push(`Card — ${formatMoney(sale.payments.card)}`);
    if (sale.payments.bank) receivedLines.push(`Bank — ${formatMoney(sale.payments.bank)}`);

    const drawPaymentPanel = (
      title: string,
      lines: string[],
      accent: { r: number; g: number; b: number },
      bg: { r: number; g: number; b: number },
      textDark: { r: number; g: number; b: number }
    ) => {
      const payH = 10 + lines.length * 5;
      y = ensureSpace(doc, y, payH + 6, io.marginMm);
      doc.setFillColor(bg.r, bg.g, bg.b);
      doc.setDrawColor(accent.r, accent.g, accent.b);
      doc.setLineWidth(0.6);
      doc.roundedRect(left, y, contentW, payH, 2, 2, "FD");
      doc.setLineWidth(0.2);
      doc.setFillColor(accent.r, accent.g, accent.b);
      doc.rect(left, y, 1.2, payH, "F");
      let py = y + 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(io.fontSectionHeadingPt - 1);
      doc.setTextColor(accent.r, accent.g, accent.b);
      doc.text(title, left + 5, py);
      py += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(io.fontBodyPt);
      doc.setTextColor(textDark.r, textDark.g, textDark.b);
      lines.forEach((line) => {
        doc.text(line, left + 5, py);
        py += 5;
      });
      doc.setTextColor(0, 0, 0);
      y += payH + 6;
    };

    if (receivedLines.length > 0) {
      drawPaymentPanel(
        "PAYMENTS RECEIVED",
        receivedLines,
        GREEN,
        GREEN_BG,
        { r: 6, g: 95, b: 70 }
      );
    }
  }

  const termsText =
    (settings.notesTerms.businessInvoiceTerms || "").trim() ||
    (io.showPdfSalesTerms ? settings.notesTerms.pdfSalesTerms : "");
  if (termsText) {
    const termLines = doc.splitTextToSize(termsText, textBlockW);
    // Avoid orphaning the TERMS heading at the bottom of a page.
    // Reserve enough space for the rule, heading, and at least two lines of terms.
    y = ensureSpace(doc, y + 2, 5 + 6 + Math.min(termLines.length, 2) * 4 + 4, io.marginMm);
    drawSectionRule(doc, left, right, y);
    y += 5;
    drawMutedLabel(doc, "TERMS & CONDITIONS", left, y, io.fontSectionHeadingPt - 1);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontTermsPt);
    doc.setTextColor(55, 55, 55);
    termLines.forEach((line: string) => {
      y = ensureSpace(doc, y, 4, io.marginMm);
      doc.text(line, left, y);
      y += 4;
    });
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  if (io.showPaymentNote && settings.notesTerms.paymentNote) {
    doc.setFontSize(io.fontTermsPt);
    doc.splitTextToSize(settings.notesTerms.paymentNote, textBlockW).forEach((line: string) => {
      y = ensureSpace(doc, y, 4, io.marginMm);
      doc.text(line, left, y);
      y += 4;
    });
    y += 4;
  }

  const defaultBank = settings.bankAccounts.find((b) => b.isDefault) || settings.bankAccounts[0];
  if (io.showBankDetails && defaultBank) {
    y = ensureSpace(doc, y + 2, defaultBank.iban ? 20 : 15, io.marginMm);
    drawMutedLabel(doc, "PAYMENT DETAILS", left, y, io.fontSectionHeadingPt - 1);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(io.fontBodyPt);
    doc.text(`${defaultBank.bankName} — ${defaultBank.accountName}`, left, y);
    y += 4.5;
    doc.text(`Sort code: ${defaultBank.sortCode}   Account: ${defaultBank.accountNumber}`, left, y);
    if (defaultBank.iban) {
      y += 4.5;
      doc.text(`IBAN: ${defaultBank.iban}`, left, y);
    }
  }

  const footer = footerLegalText(tradingName, legalSource, io);
  if (footer) {
    const footerY = pageH - 12;
    doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
    doc.setLineWidth(0.2);
    doc.line(left, footerY - 4, right, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(Math.max(io.fontTermsPt, 7));
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(footer, pageW / 2, footerY, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

async function getBusinessInvoiceSettings(): Promise<BusinessInvoiceSettings> {
  return getInvoiceSettings() as Promise<BusinessInvoiceSettings>;
}

const safeFilename = (reference: string) =>
  String(reference || "invoice").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "invoice";

function openPdfUrl(url: string, forPrint: boolean) {
  const w = window.open(url, "_blank");
  if (w && forPrint) {
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
        /* ignore */
      }
    }, 800);
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    if (!forPrint) a.download = "";
    a.click();
    if (!forPrint) setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export async function printBusinessInvoiceA4(sale: SaleForPrint): Promise<void> {
  const [settings, context] = await Promise.all([
    getBusinessInvoiceSettings(),
    getSalePrintContext(sale._id).catch(() => ({
      sale,
      location: null as LocationForHeader | null,
      fallbackLabel: null,
      variantAttributeSlugsOrderBySku: {},
    })),
  ]);
  const saleForPdf = mergeSaleTaxSnapshot(sale, context.sale);
  const url = await buildBusinessInvoicePdf(
    saleForPdf,
    settings,
    context.location,
    context.variantAttributeSlugsOrderBySku ?? {}
  );
  openPdfUrl(url, true);
}

export async function downloadBusinessInvoiceA4(sale: SaleForPrint): Promise<void> {
  const [settings, context] = await Promise.all([
    getBusinessInvoiceSettings(),
    getSalePrintContext(sale._id).catch(() => ({
      sale,
      location: null as LocationForHeader | null,
      fallbackLabel: null,
      variantAttributeSlugsOrderBySku: {},
    })),
  ]);
  const saleForPdf = mergeSaleTaxSnapshot(sale, context.sale);
  const url = await buildBusinessInvoicePdf(
    saleForPdf,
    settings,
    context.location,
    context.variantAttributeSlugsOrderBySku ?? {}
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `business-invoice-${safeFilename(sale.reference)}.pdf`;
  a.rel = "noopener";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

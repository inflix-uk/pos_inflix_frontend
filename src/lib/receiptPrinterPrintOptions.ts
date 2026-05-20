/**
 * Receipt (80mm) print toggles from Settings → Notes & Terms.
 * Merged with defaults so missing API fields keep prior behaviour.
 */

import {
  normalizeRepairTicketSectionOrder,
  normalizeSalesReceiptSectionOrder,
  REPAIR_TICKET_FONT_SIZE_KEYS,
  SALES_RECEIPT_FONT_SIZE_KEYS,
  type RepairTicketFontSizeKey,
  type RepairTicketSectionId,
  type SalesReceiptFontSizeKey,
  type SalesReceiptSectionId,
} from "./receiptPrintLayout";

/** Legacy single toggle; merged API may still send it — see resolveShopVisibility in merge. */
export type ReceiptPrinterSalesPrintOptionsLegacy = {
  showShopHeader?: boolean;
};

export interface ReceiptPrinterSalesPrintOptions {
  showLogo: boolean;
  /** Trading / location name (section `shop_name`). */
  showShopName: boolean;
  /** Street, city, postcode lines (section `shop_address`). */
  showShopAddress: boolean;
  showReceiptTitle: boolean;
  showReferenceAndDate: boolean;
  /** Customer name (and address on ESC/POS). PDF historically omitted; default true matches thermal. */
  showCustomerNameAndAddress: boolean;
  /** From linked customer (sale.customerId → Customer phone/mobile). */
  showCustomerPhone: boolean;
  showCustomerEmail: boolean;
  /** Location / shop contact (from sale’s resolved location). */
  showLocationPhone: boolean;
  showLocationEmail: boolean;
  showLineItems: boolean;
  showItemSerials: boolean;
  showTotal: boolean;
  showTermsText: boolean;
  showThankYou: boolean;
  /** ESC/POS: open cash drawer when sale includes cash (retail or wholesale payments.cash). */
  openCashDrawerOnCashPayment: boolean;
  /** 0 = pin 2 (default); 1 = pin 5 if drawer does not open. */
  cashDrawerPin: 0 | 1;
  /** PDF: QR encoding sale reference; shown with ref/date or at slip end if ref section hidden. */
  showReceiptReferenceQr: boolean;
  /** Square QR size on 80mm PDF (mm). */
  receiptReferenceQrSizeMm: number;
  /** Order of sections on the 80mm slip (drag-reorder in settings). */
  sectionOrder: SalesReceiptSectionId[];
  /** 80mm PDF page width (mm). Common: 58, 72, 80. */
  paperWidthMm: number;
  /** Left/right inset for text (mm). */
  sideMarginMm: number;
  /** Shop name, “RECEIPT”, total row (bold). */
  fontHeadingPt: number;
  /** Most body lines (ref, customer, prices, thank you). */
  fontBodyPt: number;
  /** Terms, emails, IMEI under lines. */
  fontSmallPt: number;
  /** Line item descriptions. */
  fontLineItemPt: number;
  /**
   * Optional PDF font (pt) per receipt block. Empty value in settings = use default bucket
   * (heading / body / small / line items above).
   */
  sectionFontPt: Partial<Record<SalesReceiptFontSizeKey, number>>;
}

export interface ReceiptPrinterRepairPrintOptions {
  /** Same image as Settings → About; PDF only. */
  showLogo: boolean;
  showShopName: boolean;
  showShopAddress: boolean;
  showTicketTitle: boolean;
  showQrCode: boolean;
  showReferenceLine: boolean;
  showDate: boolean;
  showCustomerName: boolean;
  showContactPhone: boolean;
  showContactEmail: boolean;
  showDeviceDescription: boolean;
  showSerialNumber: boolean;
  showDevicePassword: boolean;
  showProblemType: boolean;
  showEstimatedCost: boolean;
  showRepairItems: boolean;
  showActualCost: boolean;
  showStatus: boolean;
  showNotes: boolean;
  showTermsText: boolean;
  showThankYou: boolean;
  showLocationPhone: boolean;
  showLocationEmail: boolean;
  sectionOrder: RepairTicketSectionId[];
  paperWidthMm: number;
  sideMarginMm: number;
  fontHeadingPt: number;
  fontBodyPt: number;
  fontSmallPt: number;
  /** QR square size on ticket PDF (mm). */
  qrSizeMm: number;
  /** Optional PDF font (pt) per ticket block; empty = use heading/body/small defaults. */
  sectionFontPt: Partial<Record<RepairTicketFontSizeKey, number>>;
}

const DEFAULT_SALES_ORDER = normalizeSalesReceiptSectionOrder(null);
const DEFAULT_REPAIR_TICKET_ORDER = normalizeRepairTicketSectionOrder(null);

/**
 * `showShopHeader: false` (legacy) turns both off. Otherwise use explicit flags when present; default both on.
 */
function resolveShopVisibility(p: {
  showShopHeader?: boolean;
  showShopName?: boolean;
  showShopAddress?: boolean;
}): { showShopName: boolean; showShopAddress: boolean } {
  if (p.showShopHeader === false) {
    return { showShopName: false, showShopAddress: false };
  }
  return {
    showShopName: p.showShopName !== false,
    showShopAddress: p.showShopAddress !== false,
  };
}

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeSalesSectionFontPt(
  partial: Partial<Record<SalesReceiptFontSizeKey, number>> | null | undefined
): Partial<Record<SalesReceiptFontSizeKey, number>> {
  if (!partial || typeof partial !== "object") return {};
  const out: Partial<Record<SalesReceiptFontSizeKey, number>> = {};
  for (const key of SALES_RECEIPT_FONT_SIZE_KEYS) {
    const v = partial[key];
    if (v == null || !Number.isFinite(Number(v))) continue;
    out[key] = clamp(Number(v), 6, 16, 8);
  }
  return out;
}

function normalizeRepairSectionFontPt(
  partial: Partial<Record<RepairTicketFontSizeKey, number>> | null | undefined
): Partial<Record<RepairTicketFontSizeKey, number>> {
  if (!partial || typeof partial !== "object") return {};
  const out: Partial<Record<RepairTicketFontSizeKey, number>> = {};
  for (const key of REPAIR_TICKET_FONT_SIZE_KEYS) {
    const v = partial[key];
    if (v == null || !Number.isFinite(Number(v))) continue;
    out[key] = clamp(Number(v), 6, 16, 8);
  }
  return out;
}

/** Default pt when `sectionFontPt[key]` is unset (matches previous single heading/body/small/line behaviour). */
export function salesReceiptFontPt(
  ro: ReceiptPrinterSalesPrintOptions,
  key: SalesReceiptFontSizeKey
): number {
  const custom = ro.sectionFontPt?.[key];
  if (custom != null && Number.isFinite(custom)) return custom;
  switch (key) {
    case "shop_name":
    case "receipt_title":
    case "total":
      return ro.fontHeadingPt;
    case "items":
      return ro.fontLineItemPt;
    case "items_serial":
      return ro.fontSmallPt;
    case "items_qty_price":
      return ro.fontBodyPt;
    case "location_email":
    case "customer_email":
    case "terms":
    case "reference_qr":
      return ro.fontSmallPt;
    default:
      return ro.fontBodyPt;
  }
}

export function repairTicketFontPt(
  rp: ReceiptPrinterRepairPrintOptions,
  key: RepairTicketFontSizeKey
): number {
  const custom = rp.sectionFontPt?.[key];
  if (custom != null && Number.isFinite(custom)) return custom;
  switch (key) {
    case "rt_shop_name":
    case "rt_ticket_title":
    case "rt_actual_cost":
      return rp.fontHeadingPt;
    case "rt_location_email":
    case "rt_email":
    case "rt_problem":
    case "rt_terms":
    case "rt_notes":
    case "rt_items":
      return rp.fontSmallPt;
    default:
      return rp.fontBodyPt;
  }
}

export const DEFAULT_RECEIPT_PRINTER_SALES_PRINT: ReceiptPrinterSalesPrintOptions = {
  showLogo: true,
  showShopName: true,
  showShopAddress: true,
  showReceiptTitle: true,
  showReferenceAndDate: true,
  showCustomerNameAndAddress: true,
  showCustomerPhone: true,
  showCustomerEmail: true,
  showLocationPhone: true,
  showLocationEmail: true,
  showLineItems: true,
  showItemSerials: true,
  showTotal: true,
  showTermsText: true,
  showThankYou: true,
  openCashDrawerOnCashPayment: true,
  cashDrawerPin: 0,
  showReceiptReferenceQr: true,
  receiptReferenceQrSizeMm: 22,
  sectionOrder: DEFAULT_SALES_ORDER,
  paperWidthMm: 80,
  sideMarginMm: 4,
  fontHeadingPt: 12,
  fontBodyPt: 8,
  fontSmallPt: 7,
  fontLineItemPt: 9,
  sectionFontPt: {},
};

export const DEFAULT_RECEIPT_PRINTER_REPAIR_PRINT: ReceiptPrinterRepairPrintOptions = {
  showLogo: true,
  showShopName: true,
  showShopAddress: true,
  showTicketTitle: true,
  showQrCode: true,
  showReferenceLine: true,
  showDate: true,
  showCustomerName: true,
  showContactPhone: true,
  showContactEmail: true,
  showDeviceDescription: true,
  showSerialNumber: true,
  showDevicePassword: false,
  showProblemType: true,
  showEstimatedCost: true,
  showRepairItems: true,
  showActualCost: true,
  showStatus: true,
  showNotes: false,
  showTermsText: true,
  showThankYou: true,
  showLocationPhone: true,
  showLocationEmail: true,
  sectionOrder: DEFAULT_REPAIR_TICKET_ORDER,
  paperWidthMm: 80,
  sideMarginMm: 4,
  fontHeadingPt: 12,
  fontBodyPt: 8,
  fontSmallPt: 7,
  qrSizeMm: 22,
  sectionFontPt: {},
};

export function mergeReceiptPrinterSalesPrintOptions(
  partial?: Partial<ReceiptPrinterSalesPrintOptions> | ReceiptPrinterSalesPrintOptionsLegacy | null
): ReceiptPrinterSalesPrintOptions {
  const p = (partial ?? {}) as Partial<ReceiptPrinterSalesPrintOptions> & ReceiptPrinterSalesPrintOptionsLegacy;
  const d = DEFAULT_RECEIPT_PRINTER_SALES_PRINT;
  const { showShopHeader: _legacyShop, ...pRest } = p;
  const shop = resolveShopVisibility(p);
  return {
    ...d,
    ...pRest,
    showShopName: shop.showShopName,
    showShopAddress: shop.showShopAddress,
    sectionOrder: normalizeSalesReceiptSectionOrder(p.sectionOrder),
    paperWidthMm: clamp(p.paperWidthMm ?? d.paperWidthMm, 58, 80, d.paperWidthMm),
    sideMarginMm: clamp(p.sideMarginMm ?? d.sideMarginMm, 2, 8, d.sideMarginMm),
    fontHeadingPt: clamp(p.fontHeadingPt ?? d.fontHeadingPt, 9, 16, d.fontHeadingPt),
    fontBodyPt: clamp(p.fontBodyPt ?? d.fontBodyPt, 6, 11, d.fontBodyPt),
    fontSmallPt: clamp(p.fontSmallPt ?? d.fontSmallPt, 6, 10, d.fontSmallPt),
    fontLineItemPt: clamp(p.fontLineItemPt ?? d.fontLineItemPt, 7, 12, d.fontLineItemPt),
    showReceiptReferenceQr: p.showReceiptReferenceQr !== false,
    receiptReferenceQrSizeMm: clamp(
      p.receiptReferenceQrSizeMm ?? d.receiptReferenceQrSizeMm,
      14,
      30,
      d.receiptReferenceQrSizeMm
    ),
    openCashDrawerOnCashPayment: p.openCashDrawerOnCashPayment !== false,
    cashDrawerPin: p.cashDrawerPin === 1 ? 1 : 0,
    sectionFontPt: normalizeSalesSectionFontPt(p.sectionFontPt),
  };
}

export function mergeReceiptPrinterRepairPrintOptions(
  partial?: Partial<ReceiptPrinterRepairPrintOptions> | ReceiptPrinterSalesPrintOptionsLegacy | null
): ReceiptPrinterRepairPrintOptions {
  const p = (partial ?? {}) as Partial<ReceiptPrinterRepairPrintOptions> & ReceiptPrinterSalesPrintOptionsLegacy;
  const d = DEFAULT_RECEIPT_PRINTER_REPAIR_PRINT;
  const { showShopHeader: _legacyShop, ...pRest } = p;
  const shop = resolveShopVisibility(p);
  return {
    ...d,
    ...pRest,
    showShopName: shop.showShopName,
    showShopAddress: shop.showShopAddress,
    sectionOrder: normalizeRepairTicketSectionOrder(p.sectionOrder),
    paperWidthMm: clamp(p.paperWidthMm ?? d.paperWidthMm, 58, 80, d.paperWidthMm),
    sideMarginMm: clamp(p.sideMarginMm ?? d.sideMarginMm, 2, 8, d.sideMarginMm),
    fontHeadingPt: clamp(p.fontHeadingPt ?? d.fontHeadingPt, 9, 16, d.fontHeadingPt),
    fontBodyPt: clamp(p.fontBodyPt ?? d.fontBodyPt, 6, 11, d.fontBodyPt),
    fontSmallPt: clamp(p.fontSmallPt ?? d.fontSmallPt, 6, 10, d.fontSmallPt),
    qrSizeMm: clamp(p.qrSizeMm ?? d.qrSizeMm, 14, 30, d.qrSizeMm),
    showLogo: p.showLogo !== false,
    showDate: p.showDate !== false,
    showDevicePassword: p.showDevicePassword === true,
    showRepairItems: p.showRepairItems !== false,
    showActualCost: p.showActualCost !== false,
    showStatus: p.showStatus !== false,
    showNotes: p.showNotes === true,
    sectionFontPt: normalizeRepairSectionFontPt(p.sectionFontPt),
  };
}

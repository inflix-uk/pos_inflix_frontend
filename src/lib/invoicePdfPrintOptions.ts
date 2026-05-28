/**
 * A4 dispatch / invoice PDF layout (Settings → Notes & Terms).
 * Company name, logo, address, and document title still come from Settings → About.
 */

export interface InvoicePdfPrintOptions {
  showLogo: boolean;
  /** Company / branch name in header and FROM block (from About or location). */
  showCompanyName: boolean;
  showBillTo: boolean;
  showItemsSummary: boolean;
  /** Extra table when line items have serials */
  showSerialDetails: boolean;
  showInvoiceSummary: boolean;
  /** Wholesale: previous balance, due, etc. */
  showAccountSummary: boolean;
  showPayments: boolean;
  showPdfSalesTerms: boolean;
  showPaymentNote: boolean;
  showBankDetails: boolean;
  /** QR beside title block encoding sale reference (e.g. INV-0001). */
  showInvoiceReferenceQr: boolean;
  /** Square QR size on A4 (mm). */
  invoiceReferenceQrSizeMm: number;
  /** Page margin (mm); used left, right, and top baseline. */
  marginMm: number;
  fontCompanyNamePt: number;
  fontDocTitlePt: number;
  fontSectionHeadingPt: number;
  fontBodyPt: number;
  fontTablePt: number;
  fontTermsPt: number;
  logoWidthMm: number;
  logoHeightMm: number;
}

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const DEFAULT_INVOICE_PDF_PRINT: InvoicePdfPrintOptions = {
  showLogo: true,
  showCompanyName: true,
  showBillTo: true,
  showItemsSummary: true,
  showSerialDetails: true,
  showInvoiceSummary: true,
  showAccountSummary: true,
  showPayments: true,
  showPdfSalesTerms: true,
  showPaymentNote: true,
  showBankDetails: true,
  showInvoiceReferenceQr: true,
  invoiceReferenceQrSizeMm: 22,
  marginMm: 18,
  fontCompanyNamePt: 22,
  fontDocTitlePt: 16,
  fontSectionHeadingPt: 12,
  fontBodyPt: 12,
  fontTablePt: 10,
  fontTermsPt: 9,
  logoWidthMm: 32,
  logoHeightMm: 13,
};

export function mergeInvoicePdfPrintOptions(
  partial?: Partial<InvoicePdfPrintOptions> | null
): InvoicePdfPrintOptions {
  const p = partial ?? {};
  const d = DEFAULT_INVOICE_PDF_PRINT;
  return {
    showLogo: p.showLogo !== false,
    showCompanyName: p.showCompanyName !== false,
    showBillTo: p.showBillTo !== false,
    showItemsSummary: p.showItemsSummary !== false,
    showSerialDetails: p.showSerialDetails !== false,
    showInvoiceSummary: p.showInvoiceSummary !== false,
    showAccountSummary: p.showAccountSummary !== false,
    showPayments: p.showPayments !== false,
    showPdfSalesTerms: p.showPdfSalesTerms !== false,
    showPaymentNote: p.showPaymentNote !== false,
    showBankDetails: p.showBankDetails !== false,
    showInvoiceReferenceQr: p.showInvoiceReferenceQr !== false,
    invoiceReferenceQrSizeMm: clamp(
      p.invoiceReferenceQrSizeMm ?? d.invoiceReferenceQrSizeMm,
      16,
      32,
      d.invoiceReferenceQrSizeMm
    ),
    marginMm: clamp(p.marginMm ?? d.marginMm, 12, 24, d.marginMm),
    fontCompanyNamePt: clamp(p.fontCompanyNamePt ?? d.fontCompanyNamePt, 14, 28, d.fontCompanyNamePt),
    fontDocTitlePt: clamp(p.fontDocTitlePt ?? d.fontDocTitlePt, 11, 22, d.fontDocTitlePt),
    fontSectionHeadingPt: clamp(p.fontSectionHeadingPt ?? d.fontSectionHeadingPt, 8, 16, d.fontSectionHeadingPt),
    fontBodyPt: clamp(p.fontBodyPt ?? d.fontBodyPt, 8, 15, d.fontBodyPt),
    fontTablePt: clamp(p.fontTablePt ?? d.fontTablePt, 7, 13, d.fontTablePt),
    fontTermsPt: clamp(p.fontTermsPt ?? d.fontTermsPt, 7, 13, d.fontTermsPt),
    logoWidthMm: clamp(p.logoWidthMm ?? d.logoWidthMm, 20, 45, d.logoWidthMm),
    logoHeightMm: clamp(p.logoHeightMm ?? d.logoHeightMm, 8, 22, d.logoHeightMm),
  };
}

/**
 * A4 business invoice PDF layout (Settings → Notes & Terms → Business invoice).
 * Separate from dispatch / legacy A4 invoice — own toggles and document title.
 */

import {
  mergeInvoicePdfPrintOptions,
  type InvoicePdfPrintOptions,
} from "./invoicePdfPrintOptions";

export interface BusinessInvoicePdfPrintOptions extends InvoicePdfPrintOptions {
  /** Large title on the PDF (e.g. INVOICE, TAX INVOICE). */
  documentTitle: string;
  /** Company registration no. from Settings → About (when filled in). */
  showCompanyNumber: boolean;
  /** VAT registration no. from Settings → About (when filled in). */
  showVatNumber: boolean;
  /** Footer line with company name and registration numbers. */
  showFooterLegalLine: boolean;
  /** VAT / tax breakdown (Settings → Tax + amount on the sale). */
  showTax: boolean;
}

function readBool(value: boolean | undefined, defaultValue: boolean): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

export function mergeBusinessInvoicePdfPrintOptions(
  partial?: Partial<BusinessInvoicePdfPrintOptions> | null
): BusinessInvoicePdfPrintOptions {
  const base = mergeInvoicePdfPrintOptions({
    showSerialDetails: false,
    showAccountSummary: true,
    marginMm: 20,
    fontDocTitlePt: 20,
    fontSectionHeadingPt: 11,
    fontTablePt: 9,
    ...partial,
  });
  const title = (partial?.documentTitle ?? "INVOICE").trim();
  return {
    ...base,
    documentTitle: title || "INVOICE",
    showCompanyNumber: readBool(partial?.showCompanyNumber, true),
    showVatNumber: readBool(partial?.showVatNumber, true),
    showFooterLegalLine: readBool(partial?.showFooterLegalLine, true),
    showTax: readBool(partial?.showTax, true),
  };
}

/** Full object for API/DB — every toggle is explicit (including `false`). */
export function toBusinessInvoicePdfPrintRecord(
  partial?: Partial<BusinessInvoicePdfPrintOptions> | null
): BusinessInvoicePdfPrintOptions {
  return { ...mergeBusinessInvoicePdfPrintOptions(partial) };
}

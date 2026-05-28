"use client";

import {
  BusinessInvoicePreviewShell,
  SAMPLE_BUSINESS_INVOICE,
} from "@/components/invoices/BusinessInvoiceDocument";

/** Design preview for the business invoice layout — open /business-invoice-preview */
export default function BusinessInvoicePreviewPage() {
  return <BusinessInvoicePreviewShell data={SAMPLE_BUSINESS_INVOICE} />;
}

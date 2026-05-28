"use client";

import React from "react";
import { Briefcase } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import type { BusinessInvoicePdfPrintOptions } from "@/lib/businessInvoicePdfPrintOptions";
import type { NotesTermsFormData } from "../types";

type ToggleKey = {
 [K in keyof BusinessInvoicePdfPrintOptions]-?: BusinessInvoicePdfPrintOptions[K] extends boolean ? K : never;
}[keyof BusinessInvoicePdfPrintOptions];

const PRINT_OPTIONS: { key: ToggleKey; label: string; hint?: string }[] = [
 { key: "showLogo", label: "Company logo", hint: "From Settings → About." },
 {
  key: "showCompanyName",
  label: "Company / trading name",
  hint: "Inflix LTD, branch name, etc. in the top-left header and in the FROM panel. Logo and address can stay visible when this is off.",
 },
 { key: "showBillTo", label: "Bill to (customer block)", hint: "Customer name, address, phone, and email when available." },
 { key: "showItemsSummary", label: "Line items table", hint: "Description, quantity, unit price, and amount." },
 { key: "showInvoiceSummary", label: "Amount due summary", hint: "Subtotal, discount, and total on the right." },
 { key: "showAccountSummary", label: "Wholesale account summary", hint: "Previous balance and balance due for wholesale sales." },
 {
  key: "showPayments",
  label: "Payment breakdown",
  hint: "Cash, card, and bank only (credit/on-account is not shown on the PDF).",
 },
 { key: "showPdfSalesTerms", label: "Fallback to PDF sales terms", hint: "Used when Business invoice terms (below) is empty." },
 { key: "showPaymentNote", label: "Payment note", hint: "From the Payment tab." },
 { key: "showBankDetails", label: "Bank details", hint: "Default bank account from Bank Account Details." },
 { key: "showInvoiceReferenceQr", label: "Invoice reference QR", hint: "Encodes the invoice reference beside the header." },
 { key: "showCompanyNumber", label: "Company number", hint: "From the sale’s location (Peoples → Locations), or Settings → About if the branch has none." },
 { key: "showVatNumber", label: "VAT number", hint: "From the sale’s location (Peoples → Locations), or Settings → About if the branch has none." },
 { key: "showFooterLegalLine", label: "Footer legal line", hint: "Company name, company no., and VAT at the bottom of the page." },
 {
  key: "showTax",
  label: "VAT / tax breakdown",
  hint: "Shows net, VAT from Settings → Tax (default rate), and total inc. VAT using the tax stored on the sale.",
 },
];

export function BusinessInvoiceSettingsPanel({
 formData,
 onChange,
}: {
 formData: NotesTermsFormData;
 onChange: React.ComponentProps<"input">["onChange"] & React.ComponentProps<"textarea">["onChange"];
}) {
 const io = formData.businessInvoicePdfPrint;

 return (
  <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
     <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 shadow-sm">
      <Briefcase className="h-4 w-4 text-white" aria-hidden />
     </span>
     Business invoice (A4)
    </div>
    <HelpTip
     ariaLabel="About business invoice PDF"
     align="end"
     iconClassName="h-4 w-4 text-slate-600"
     contentClassName="max-w-md text-left text-sm leading-relaxed"
    >
     <p className="text-slate-700">
      A separate professional A4 layout from the legacy <strong>dispatch / invoice</strong> template. Sales can
      print either format. Company name, logo, and address still come from Settings → About.
     </p>
    </HelpTip>
   </div>
   {formData.a4InvoiceTemplate !== "business" ? (
    <p
     className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
     role="status"
    >
     <strong>Not active for printing yet.</strong> Choose{" "}
     <strong>Business invoice (A4)</strong> in the template dropdown at the top of this page (or change any
     option here — we select it automatically when you save).
    </p>
   ) : (
    <p className="mb-4 text-sm font-medium text-slate-600">
     This layout is selected for printing and downloads. The dispatch template tab keeps its own settings.
    </p>
   )}

   <div className="mb-4 grid gap-3 @[640px]:grid-cols-2">
    <div>
     <label className="mb-1 block text-xs font-medium text-gray-600">Document title</label>
     <input
      type="text"
      name="businessInvoicePdfPrint.documentTitle"
      value={io.documentTitle}
      onChange={onChange}
      placeholder="INVOICE"
      maxLength={80}
      className="block w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-400/35"
     />
    </div>
   </div>

   <div className="mb-4">
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
     Business invoice terms
    </label>
    <textarea
     name="businessInvoiceTerms"
     value={formData.businessInvoiceTerms}
     onChange={onChange}
     rows={6}
     placeholder="Payment terms, warranty, returns policy…"
     className="block w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-400/35"
    />
    <p className="mt-1 text-xs text-gray-500">
     Shown under &quot;Terms &amp; conditions&quot; on the business invoice. If empty, PDF sales terms from the
     Terms tab are used when that fallback toggle is on.
    </p>
   </div>

   <div className="mb-4 border-b border-slate-200/60 pb-4">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Size &amp; typography</p>
    <div className="grid grid-cols-2 gap-3 @[640px]:grid-cols-3 @[1024px]:grid-cols-5">
     {(
      [
       ["marginMm", "Margin (mm)", 12, 24, 1],
       ["fontCompanyNamePt", "Company name (pt)", 14, 24, 0.5],
       ["fontDocTitlePt", "Title (pt)", 11, 22, 0.5],
       ["fontSectionHeadingPt", "Headings (pt)", 8, 14, 0.5],
       ["fontBodyPt", "Body (pt)", 8, 13, 0.5],
       ["fontTablePt", "Table (pt)", 7, 11, 0.5],
       ["fontTermsPt", "Terms (pt)", 7, 11, 0.5],
       ["logoWidthMm", "Logo width (mm)", 20, 45, 1],
       ["logoHeightMm", "Logo height (mm)", 8, 22, 1],
       ["invoiceReferenceQrSizeMm", "QR size (mm)", 16, 32, 1],
      ] as const
     ).map(([key, label, min, max, step]) => (
      <div key={key}>
       <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
       <input
        type="number"
        name={`businessInvoicePdfPrint.${key}`}
        value={io[key as keyof BusinessInvoicePdfPrintOptions] as number}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-400/35"
       />
      </div>
     ))}
    </div>
   </div>

   <div>
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">What to include</p>
    <div className="grid grid-cols-1 gap-2 @[640px]:grid-cols-2">
     {PRINT_OPTIONS.map(({ key, label, hint }) => (
      <label
       key={key}
       className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1.5 py-1.5 text-sm text-slate-900 transition hover:bg-slate-50 hover:ring-1 hover:ring-slate-200/80"
      >
       <input
        type="checkbox"
        name={`businessInvoicePdfPrint.${key}`}
        checked={Boolean(io[key])}
        onChange={onChange}
        className="mt-0.5 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
       />
       <span>
        {label}
        {hint && <span className="mt-0.5 block text-xs font-normal text-gray-500">{hint}</span>}
       </span>
      </label>
     ))}
    </div>
   </div>
  </div>
 );
}

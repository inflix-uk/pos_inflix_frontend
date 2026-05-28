"use client";

import React, { useCallback, useId, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
 Save,
 RotateCcw,
 Trash2,
 MapPin,
 FileText,
 Printer,
 Wrench,
 CreditCard,
 Tag,
 FileStack,
 Briefcase,
 type LucideIcon,
} from "lucide-react";
import { BusinessInvoiceSettingsPanel } from "./BusinessInvoiceSettingsPanel";
import { A4InvoiceTemplateSelector } from "./A4InvoiceTemplateSelector";
import { HelpTip } from "@/components/HelpTip";
import type { InvoicePdfPrintOptions } from "@/lib/invoicePdfPrintOptions";
import type {
 ReceiptPrinterRepairPrintOptions,
 ReceiptPrinterSalesPrintOptions,
} from "@/lib/receiptPrinterPrintOptions";
import {
 REPAIR_LABEL_TEXT_FIELD_IDS,
 REPAIR_LABEL_TEXT_FIELD_LABELS,
 REPAIR_TICKET_FONT_SIZE_KEYS,
 REPAIR_TICKET_FONT_SIZE_LABELS,
 REPAIR_TICKET_SECTION_LABELS,
 SALES_RECEIPT_FONT_SIZE_KEYS,
 SALES_RECEIPT_FONT_SIZE_LABELS,
 SALES_RECEIPT_SECTION_LABELS,
} from "@/lib/receiptPrintLayout";
import { NotesTermsFormProps } from "../types";
import { DraggableOrderList } from "./DraggableOrderList";
import {
 RepairLabelFieldsPreview,
 RepairTicketLayoutPreview,
 SalesReceiptLayoutPreview,
} from "./PrintLayoutPreview";

function SectionLabel({
 htmlFor,
 icon: Icon,
 children,
 tipAriaLabel,
 tip,
 tipAlign = "end",
}: {
 htmlFor: string;
 icon: LucideIcon;
 children: React.ReactNode;
 tipAriaLabel: string;
 tip: React.ReactNode;
 tipAlign?: "start" | "end";
}) {
 return (
 <div className="mb-1.5 flex items-center justify-between gap-2">
 <label
 htmlFor={htmlFor}
 className="flex min-w-0 cursor-pointer items-center gap-2.5 text-[11px] font-semibold text-gray-700"
 >
 <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 shadow-sm">
  <Icon className="h-3.5 w-3.5 text-white drop-shadow-sm" aria-hidden />
 </span>
 <span className="uppercase tracking-wide">{children}</span>
 </label>
 <HelpTip
 ariaLabel={tipAriaLabel}
 align={tipAlign}
 iconClassName="h-4 w-4 text-gray-400 hover:text-orange-500"
 contentClassName="text-left"
 >
 {tip}
 </HelpTip>
 </div>
 );
}

function InlineFieldTip({ ariaLabel, children }: { ariaLabel: string; children: React.ReactNode }) {
 return (
 <HelpTip
 ariaLabel={ariaLabel}
 align="end"
 iconClassName="h-3.5 w-3.5 text-gray-400 hover:text-orange-500"
 contentClassName="text-left"
 >
 {children}
 </HelpTip>
 );
}

type NotesTermsTabId =
 | "delivery"
 | "terms"
 | "receiptSales"
 | "receiptRepair"
 | "repairLabel"
 | "a4Invoice"
 | "businessInvoice"
 | "payment";

const VALID_TAB_IDS = new Set<string>([
 "delivery",
 "terms",
 "receiptSales",
 "receiptRepair",
 "repairLabel",
 "a4Invoice",
 "businessInvoice",
 "payment",
]);

function isValidTabId(value: string | null): value is NotesTermsTabId {
 return value !== null && VALID_TAB_IDS.has(value);
}

const TABS: {
 id: NotesTermsTabId;
 label: string;
 shortLabel: string;
 icon: typeof MapPin;
 description: string;
}[] = [
 {
 id: "delivery",
 label: "Delivery",
 shortLabel: "Delivery",
 icon: MapPin,
 description: "Address shown on documents",
 },
 {
 id: "terms",
 label: "Terms (purchase & PDF)",
 shortLabel: "Terms",
 icon: FileText,
 description: "Purchase terms and PDF sales wording",
 },
 {
 id: "receiptSales",
 label: "Receipt — sales",
 shortLabel: "Sale",
 icon: Printer,
 description: "80mm sale receipt text and what to print",
 },
 {
 id: "receiptRepair",
 label: "Receipt — repairs",
 shortLabel: "Rcp",
 icon: Wrench,
 description: "80mm repair ticket text and what to print",
 },
 {
 id: "repairLabel",
 label: "Repair label",
 shortLabel: "Label",
 icon: Tag,
 description: "Small PDF / Dymo-style repair device label",
 },
 {
 id: "a4Invoice",
 label: "A4 invoice / dispatch",
 shortLabel: "A4",
 icon: FileStack,
 description: "PDF layout for A4 dispatch note / invoice",
 },
 {
 id: "businessInvoice",
 label: "Business invoice (A4)",
 shortLabel: "Biz",
 icon: Briefcase,
 description: "Professional A4 invoice template (separate from dispatch)",
 },
 {
 id: "payment",
 label: "Payment",
 shortLabel: "Pay",
 icon: CreditCard,
 description: "Payment note text",
 },
];

const _tabUi = {
 panel:
 "space-y-4 rounded-lg border border-gray-200 bg-white p-3 @[640px]:p-4 shadow-sm",
 tabSelected:
 "border-orange-300 bg-white text-gray-900 shadow-[0_1px_0_0_white] ring-1 ring-orange-200/50",
 tabIconSelected: "text-orange-500",
 tabIconIdle: "text-gray-400",
 descriptionChip:
 "rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm",
};

const TAB_UI: Record<
 NotesTermsTabId,
 {
 panel: string;
 tabSelected: string;
 tabIconSelected: string;
 tabIconIdle: string;
 descriptionChip: string;
 }
> = {
 delivery: _tabUi,
 terms: _tabUi,
 receiptSales: _tabUi,
 receiptRepair: _tabUi,
 repairLabel: _tabUi,
 a4Invoice: _tabUi,
 businessInvoice: _tabUi,
 payment: _tabUi,
};

type SalesReceiptPrintToggleKey = {
 [K in keyof ReceiptPrinterSalesPrintOptions]-?: ReceiptPrinterSalesPrintOptions[K] extends boolean ? K : never;
}[keyof ReceiptPrinterSalesPrintOptions];

const RECEIPT_SALES_PRINT_OPTIONS: { key: SalesReceiptPrintToggleKey; label: string; hint?: string }[] = [
 {
 key: "showLogo",
 label: "Shop logo",
 hint: "Image from Settings → About. Shown on browser/PDF 80mm slips only; silent ESC/POS cannot render bitmaps.",
 },
 {
 key: "showShopName",
 label: "Shop name",
 hint: "Trading or branch name when the sale has a location (reorder under “Shop / location name” in section order).",
 },
 {
 key: "showShopAddress",
 label: "Shop address",
 hint: "Street, city, postcode from the location or company address fallback. Separate checkbox from shop name; reorder in section order.",
 },
 {
 key: "showReceiptTitle",
 label: '“RECEIPT” heading',
 hint: "Large title at the top of the slip. Turn off for a cleaner minimal layout.",
 },
 {
 key: "showReferenceAndDate",
 label: "Reference & date",
 hint: "Sale reference/invoice number and the date/time the slip was generated.",
 },
 {
 key: "showReceiptReferenceQr",
 label: "Invoice reference QR code",
 hint: "Encodes the sale reference (e.g. INV-0001). Position on the slip is set in Section order (“Invoice reference QR code”). PDF only; silent ESC/POS does not draw it.",
 },
 {
 key: "showCustomerNameAndAddress",
 label: "Customer name & address",
 hint: "Only when the sale has a linked customer; otherwise this block is empty and can be hidden.",
 },
 {
 key: "showCustomerPhone",
 label: "Customer phone",
 hint: "From the linked customer (phone or mobile). No customer on the sale means nothing prints here.",
 },
 {
 key: "showCustomerEmail",
 label: "Customer email",
 hint: "From the linked customer record when the sale has a customerId.",
 },
 {
 key: "showLocationPhone",
 label: "Location phone",
 hint: "Branch phone from the sale’s location—useful for “call the shop” on the slip, distinct from the customer.",
 },
 {
 key: "showLocationEmail",
 label: "Location email",
 hint: "Branch email from the location record when header/location details are included on the receipt.",
 },
 {
 key: "showLineItems",
 label: "Line items (qty × price)",
 hint: "The product/service lines with quantity and price. Usually leave on unless you need a totals-only slip.",
 },
 {
 key: "showItemSerials",
 label: "IMEI / serial under each line",
 hint: "Prints serial/IMEI rows under lines that have tracked serials. Hidden automatically when a line has none.",
 },
 { key: "showTotal", label: "Total", hint: "Grand total for the sale at the bottom of the line block." },
 {
 key: "showTermsText",
 label: "Terms text (box below)",
 hint: "Prints “Sales receipt terms text” from this tab. Both the toggle and non-empty text must be set.",
 },
 {
 key: "showThankYou",
 label: "“Thank you” footer",
 hint: "Short closing line after terms. Pair with minimal toggles for a compact slip.",
 },
];

type RepairTicketPrintToggleKey = {
 [K in keyof ReceiptPrinterRepairPrintOptions]-?: ReceiptPrinterRepairPrintOptions[K] extends boolean ? K : never;
}[keyof ReceiptPrinterRepairPrintOptions];

type InvoicePdfPrintToggleKey = {
 [K in keyof InvoicePdfPrintOptions]-?: InvoicePdfPrintOptions[K] extends boolean ? K : never;
}[keyof InvoicePdfPrintOptions];

const A4_INVOICE_PRINT_OPTIONS: { key: InvoicePdfPrintToggleKey; label: string; hint?: string }[] = [
 {
 key: "showLogo",
 label: "Logo (top right)",
 hint: "Renders the image from Settings → About at the logo width/height (mm) above. Hide for plain invoices.",
 },
 {
 key: "showCompanyName",
 label: "Company / trading name",
 hint: "Name from Settings → About or the sale location (e.g. Inflix LTD) in the header. Turn off to show only logo and address.",
 },
 {
 key: "showBillTo",
 label: "Bill To (customer name & address)",
 hint: "Customer block on the PDF when the sale has bill-to details; turn off for walk-in cash slips if you prefer.",
 },
 {
 key: "showItemsSummary",
 label: "Items summary table",
 hint: "Main lines table: description, qty, pricing—core of the dispatch/invoice.",
 },
 {
 key: "showSerialDetails",
 label: "Serial / IMEI detail table",
 hint: "Only appears when line items include serials.",
 },
 {
 key: "showInvoiceSummary",
 label: "Invoice summary (ruled total block)",
 hint: "Subtotal, tax, discounts, and grand total in the ruled summary area.",
 },
 {
 key: "showAccountSummary",
 label: "Account summary",
 hint: "Wholesale sales: previous balance, due, payments received.",
 },
 {
 key: "showPayments",
 label: "Payments list",
 hint: "Lists payments recorded against the sale (card, cash, transfer) when present.",
 },
 {
 key: "showPdfSalesTerms",
 label: "PDF sales terms",
 hint: "Same text as “PDF sales terms” on the Terms tab.",
 },
 {
 key: "showPaymentNote",
 label: "Payment note",
 hint: "Same text as the Payment tab in Notes & Terms.",
 },
 {
 key: "showBankDetails",
 label: "Bank details",
 hint: "Uses the default bank account from Settings → Bank Account Details.",
 },
 {
 key: "showInvoiceReferenceQr",
 label: "Invoice reference QR code",
 hint: "Encodes the sale reference beside the title block (top right). Handy for scanning to look up the invoice.",
 },
];

const RECEIPT_REPAIR_PRINT_OPTIONS: { key: RepairTicketPrintToggleKey; label: string; hint?: string }[] = [
 {
 key: "showLogo",
 label: "Shop logo",
 hint: "Image from Settings → About. Shown on the browser/PDF repair ticket only (not on silent thermal paths).",
 },
 {
 key: "showShopName",
 label: "Shop name",
 hint: "Branch trading name when the repair has a location.",
 },
 {
 key: "showShopAddress",
 label: "Shop address",
 hint: "Location address lines or company fallback. Separate from shop name; reorder in section order.",
 },
 {
 key: "showLocationPhone",
 label: "Location phone",
 hint: "Branch phone for callbacks—separate from the customer’s own contact fields.",
 },
 {
 key: "showLocationEmail",
 label: "Location email",
 hint: "Branch email shown with location header details.",
 },
 {
 key: "showTicketTitle",
 label: '“REPAIR TICKET” heading',
 hint: "Clear document title at the top; turn off if you prefer a minimal ticket.",
 },
 {
 key: "showQrCode",
 label: "QR code",
 hint: "Encodes a link or payload for scanning (e.g. job lookup). Size is set under Size & typography.",
 },
 {
 key: "showReferenceLine",
 label: "Reference line (under QR)",
 hint: "Human-readable ticket number; can stay on even if QR is disabled for manual lookup.",
 },
 { key: "showDate", label: "Date received", hint: "Date/time the device was received for repair." },
 { key: "showCustomerName", label: "Customer", hint: "Customer name from the repair record." },
 { key: "showContactPhone", label: "Phone", hint: "Contact phone captured on the repair." },
 { key: "showContactEmail", label: "Email", hint: "Contact email captured on the repair." },
 { key: "showDeviceDescription", label: "Device", hint: "Model/description of the device under repair." },
 { key: "showSerialNumber", label: "IMEI / serial", hint: "Device identifier when recorded on the job." },
 { key: "showDevicePassword", label: "Device password", hint: "PIN/password for the device; hidden by default for privacy." },
 { key: "showProblemType", label: "Problem / issue", hint: "Reported fault or category from the repair." },
 { key: "showEstimatedCost", label: "Estimated cost", hint: "Quote or estimate line when present on the ticket." },
 { key: "showRepairItems", label: "Repair items", hint: "Parts and labour charges listed on the ticket." },
 { key: "showActualCost", label: "Actual cost / total", hint: "Final cost with a bold total line and divider." },
 { key: "showStatus", label: "Status", hint: "Current repair status (Pending, In Progress, Completed, etc.)." },
 { key: "showNotes", label: "Notes", hint: "Customer-facing notes from the repair record; hidden by default." },
 {
 key: "showTermsText",
 label: "Terms text (box below)",
 hint: "Uses “Repair ticket terms text” on this tab; requires both toggle and non-empty text.",
 },
 {
 key: "showThankYou",
 label: "“Thank you” footer",
 hint: "Closing line after terms; layout adds a divider when content appears above.",
 },
];

export const NotesTermsForm: React.FC<NotesTermsFormProps> = ({
 formData,
 isSaving,
 hasExistingData,
 onChange,
 onReorderSalesReceiptSections,
 onReorderRepairTicketSections,
 onReorderRepairLabelFields,
 onSubmit,
 onReset,
 onDelete,
}) => {
 const searchParams = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();

 const tabFromUrl = searchParams.get("tab");
 const activeTab: NotesTermsTabId = isValidTabId(tabFromUrl) ? tabFromUrl : "delivery";

 const setActiveTab = useCallback(
 (id: NotesTermsTabId) => {
 const params = new URLSearchParams(searchParams.toString());
 params.set("tab", id);
 router.replace(`${pathname}?${params.toString()}`, { scroll: false });
 },
 [searchParams, router, pathname],
 );

 const tablistId = useId();

 const focusTab = (id: NotesTermsTabId) => {
 queueMicrotask(() => document.getElementById(`${tablistId}-${id}`)?.focus());
 };

 const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
 if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
 e.preventDefault();
 const delta = e.key === "ArrowRight" ? 1 : -1;
 const next = TABS[(index + delta + TABS.length) % TABS.length];
 setActiveTab(next.id);
 focusTab(next.id);
 } else if (e.key === "Home") {
 e.preventDefault();
 setActiveTab(TABS[0].id);
 focusTab(TABS[0].id);
 } else if (e.key === "End") {
 e.preventDefault();
 const last = TABS[TABS.length - 1];
 setActiveTab(last.id);
 focusTab(last.id);
 }
 };

 return (
 <form onSubmit={onSubmit}>
 <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
 <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
  <div className="flex flex-wrap items-start justify-between gap-2">
  <h2 className="text-sm font-bold tracking-tight text-gray-900">Terms & Notes</h2>
  <HelpTip
  ariaLabel="How this page works"
  align="end"
  className="mt-0.5"
  iconClassName="h-4 w-4 text-gray-400 hover:text-orange-500"
  contentClassName="max-w-md text-left text-sm leading-relaxed"
  >
  <p className="mb-2 text-slate-700">
  Use the tabs to focus on one area at a time.{" "}
  <strong className="font-medium text-slate-800">Save Settings</strong> sends the{" "}
  <em>entire</em> form—every tab—in one request. You can edit only the tabs you care about and still save.
  </p>
  <p className="mb-2 text-slate-700">
  <strong className="font-medium text-slate-800">Reset</strong> throws away unsaved changes and reloads the
  last values from the server (same as reopening the page without saving).
  </p>
  <p className="text-slate-700">
  <strong className="font-medium text-slate-800">Reset to Defaults</strong> (when visible) removes your
  stored Notes & Terms and recreates factory defaults—use only if you intentionally want to wipe custom
  wording and print layouts. For a longer map of each tab, use the help icon on the page title above.
  </p>
  </HelpTip>
  </div>
  <p className="mt-0.5 pr-1 text-xs font-medium text-gray-500">
  Switch tabs to edit each area. Save applies all sections at once.
  </p>
  <div className="mt-3">
  <A4InvoiceTemplateSelector value={formData.a4InvoiceTemplate} onChange={onChange} />
  </div>
 </div>

 <div
  role="tablist"
  aria-label="Settings sections"
  id={tablistId}
  className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-3 pt-2 @[640px]:px-4 [-webkit-overflow-scrolling:touch]"
 >
  {TABS.map((tab, index) => {
  const Icon = tab.icon;
  const selected = activeTab === tab.id;
  const ui = TAB_UI[tab.id];
  return (
  <button
  key={tab.id}
  type="button"
  role="tab"
  id={`${tablistId}-${tab.id}`}
  aria-selected={selected}
  aria-controls={`${tablistId}-panel-${tab.id}`}
  tabIndex={selected ? 0 : -1}
  onClick={() => setActiveTab(tab.id)}
  onKeyDown={(e) => handleTabKeyDown(e, index)}
  className={`
   group flex shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-2.5 py-2 text-xs font-semibold transition-all duration-200
   @[640px]:px-3
   ${
   selected
   ? ui.tabSelected
   : "border-transparent text-gray-500 hover:border-gray-200 hover:bg-white hover:text-gray-900"
   }
  `}
  >
  <Icon
   className={`h-4 w-4 shrink-0 transition-colors ${selected ? ui.tabIconSelected : ui.tabIconIdle}`}
   aria-hidden
  />
  <span className="hidden @[640px]:inline">{tab.label}</span>
  <span className="@[640px]:hidden">{tab.shortLabel}</span>
  </button>
  );
  })}
 </div>

 <div className="min-h-[10rem] bg-white p-3 @[640px]:p-4">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
  <span className={TAB_UI[activeTab].descriptionChip}>
  {TABS.find((t) => t.id === activeTab)?.description}
  </span>
  <HelpTip
  ariaLabel={`About the ${TABS.find((t) => t.id === activeTab)?.label ?? "current"} tab`}
  align="end"
  iconClassName={`h-4 w-4 ${TAB_UI[activeTab].tabIconSelected}`}
  contentClassName="max-w-md text-left text-sm leading-relaxed"
  >
  {activeTab === "delivery" && (
  <>
   <p className="mb-2 text-slate-700">
   A single free-text block used where the app needs a <strong className="font-medium text-slate-800">fixed</strong>{" "}
   delivery, returns, or correspondence address on generated documents.
   </p>
   <p className="text-slate-700">
   It does <em>not</em> replace per-branch addresses in Locations; use this when every document should show
   the same HQ or warehouse address. Leave blank if you rely only on location-specific headers.
   </p>
  </>
  )}
  {activeTab === "terms" && (
  <>
   <p className="mb-2 text-slate-700">
   <strong className="font-medium text-slate-800">Purchase terms &amp; conditions</strong> feed purchase
   flows (buying stock from suppliers). Edit the default block to match your warranty and buying policy.
   </p>
   <p className="mb-2 text-slate-700">
   <strong className="font-medium text-slate-800">PDF sales terms</strong> are the legal/footer wording on
   the <strong className="font-medium text-slate-800">A4 dispatch / invoice PDF</strong> when you enable
   &quot;PDF sales terms&quot; on the A4 tab—not the 80mm thermal slip.
   </p>
   <p className="text-slate-700">
   For short text at the bottom of 80mm sale or repair slips, use the{" "}
   <strong className="font-medium text-slate-800">Receipt — sales</strong> and{" "}
   <strong className="font-medium text-slate-800">Receipt — repairs</strong> tabs and turn on
   &quot;Terms text&quot; there.
   </p>
  </>
  )}
  {activeTab === "receiptSales" && (
  <>
   <p className="mb-2 text-slate-700">
   Configures the <strong className="font-medium text-slate-800">80mm sale receipt</strong>: what appears,
   in what order, and PDF/typography for browser printing.
   </p>
   <p className="mb-2 text-slate-700">
   Silent <strong className="font-medium text-slate-800">ESC/POS</strong> printing respects your toggles
   and section order but still uses the printer’s fixed font—paper width and pt sizes mainly affect the
   PDF preview/download path.
   </p>
   <p className="text-slate-700">
   Bottom <strong className="font-medium text-slate-800">terms</strong> only print when &quot;Terms
   text&quot; is checked and &quot;Sales receipt terms text&quot; above is not empty.
   </p>
  </>
  )}
  {activeTab === "receiptRepair" && (
  <>
   <p className="mb-2 text-slate-700">
   Configures the <strong className="font-medium text-slate-800">80mm repair ticket</strong> PDF (browser
   print): header, QR, job fields, terms, and thank-you line.
   </p>
   <p className="mb-2 text-slate-700">
   <strong className="font-medium text-slate-800">Location phone/email</strong> use the repair’s assigned
   branch when available. Drag <strong className="font-medium text-slate-800">section order</strong> to
   match how you want information to read top-to-bottom.
   </p>
   <p className="text-slate-700">
   This tab is separate from the <strong className="font-medium text-slate-800">Repair label</strong> tab,
   which is the small sticker layout for device identification.
   </p>
  </>
  )}
  {activeTab === "repairLabel" && (
  <>
   <p className="mb-2 text-slate-700">
   Small <strong className="font-medium text-slate-800">device label</strong> PDF (e.g. Dymo or similar):
   page size in millimetres should match your physical stock so browser print and silent agents align.
   </p>
   <p className="mb-2 text-slate-700">
   Choose which ticket fields print, the <strong className="font-medium text-slate-800">text line order</strong>, QR
   side, and optional <strong className="font-medium text-slate-800">swap columns</strong> for silent-only
   misalignment with Chrome.
   </p>
   <p className="text-slate-700">
   <strong className="font-medium text-slate-800">Invert silent print orientation</strong> is legacy; leave
   off unless you still rely on an older print agent workflow.
   </p>
  </>
  )}
  {activeTab === "a4Invoice" && (
  <>
   <p className="mb-2 text-slate-700">
   Controls the <strong className="font-medium text-slate-800">A4 dispatch note / invoice PDF</strong>{" "}
   from sales: margins, font sizes, logo dimensions on the page, and which sections (Bill To, tables,
   payments, terms, bank, etc.) appear.
   </p>
   <p className="mb-2 text-slate-700">
   Company name, document title, logo <em>file</em>, and default company block still come from{" "}
   <strong className="font-medium text-slate-800">Settings → About</strong>.{" "}
   <strong className="font-medium text-slate-800">Bank details</strong> use the default account from{" "}
   <strong className="font-medium text-slate-800">Bank Account Details</strong>.
   </p>
   <p className="text-slate-700">
   This is <em>not</em> the 80mm slip—that is under Receipt — sales. Wholesale-style{" "}
   <strong className="font-medium text-slate-800">Account summary</strong> only applies when the sale
   data supports it.
   </p>
  </>
  )}
  {activeTab === "payment" && (
  <>
   <p className="mb-2 text-slate-700">
   Free-text <strong className="font-medium text-slate-800">payment note</strong>: methods you accept,
   deposit rules, finance wording, or bank-pay instructions for customers.
   </p>
   <p className="text-slate-700">
   When enabled on the A4 tab (&quot;Payment note&quot;), this same text is appended to the PDF. Other
   screens may show it in footers depending on context—keep it concise and legally accurate for your
   region.
   </p>
  </>
  )}
  </HelpTip>
  </div>
  <div className="space-y-6">

  <div
  role="tabpanel"
  id={`${tablistId}-panel-delivery`}
  aria-labelledby={`${tablistId}-delivery`}
  hidden={activeTab !== "delivery"}
  className={activeTab === "delivery" ? TAB_UI.delivery.panel : "hidden"}
  >
  {/* Delivery Address */}
  <div>
  <SectionLabel
  htmlFor="notes-field-delivery"
  icon={MapPin}
  tipAriaLabel="About delivery address"
  tip={
  <>
   <p className="mb-2">
   Used when generated PDFs or prints need one consistent &quot;ship to / returns / correspondence&quot;
   address instead of repeating every branch address.
   </p>
   <p>
   If every document should show the active <strong className="font-medium text-slate-800">location</strong>{" "}
   instead, keep this empty and maintain addresses under your shop locations. Format with line breaks as
   you want them to appear on paper.
   </p>
  </>
  }
  >
  Delivery address
  </SectionLabel>
  <textarea
  id="notes-field-delivery"
  name="deliveryAddress"
  value={formData.deliveryAddress}
  onChange={onChange}
  rows={3}
  className="block w-full resize-none rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-0"
  placeholder="Enter delivery address..."
  />
  </div>
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-terms`}
  aria-labelledby={`${tablistId}-terms`}
  hidden={activeTab !== "terms"}
  className={activeTab === "terms" ? TAB_UI.terms.panel : "hidden"}
  >
  {/* Purchase Terms Conditions */}
  <div>
  <SectionLabel
  htmlFor="notes-field-purchase-terms"
  icon={FileText}
  tipAriaLabel="About purchase terms"
  tip={
  <>
   <p className="mb-2">
   Legal and operational wording for <strong className="font-medium text-slate-800">buying stock</strong>{" "}
   from suppliers: warranties, returns, liability, payment expectations, etc.
   </p>
   <p>
   A starter template is provided—replace it with text your lawyer or policy approves. This field is{" "}
   <em>not</em> the same as customer-facing PDF sales terms or 80mm receipt footers.
   </p>
  </>
  }
  >
  Purchase terms &amp; conditions
  </SectionLabel>
  <textarea
  id="notes-field-purchase-terms"
  name="purchaseTermsConditions"
  value={formData.purchaseTermsConditions}
  onChange={onChange}
  rows={6}
  className="block w-full resize-none rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-0"
  placeholder="Enter purchase terms and conditions..."
  />
  </div>

  {/* PDF Sales Terms */}
  <div>
  <SectionLabel
  htmlFor="notes-field-pdf-sales"
  icon={FileText}
  tipAriaLabel="About PDF sales terms"
  tip={
  <>
   <p className="mb-2">
   Longer-form terms and conditions shown on the <strong className="font-medium text-slate-800">A4
   dispatch / invoice PDF</strong> when you enable &quot;PDF sales terms&quot; on the A4 tab.
   </p>
   <p>
   Typical content: returns, warranties, consumer rights references, and limitation clauses. It does{" "}
   <em>not</em> automatically appear on 80mm receipts—use Receipt — sales for short thermal footers.
   </p>
  </>
  }
  >
  PDF sales terms
  </SectionLabel>
  <textarea
  id="notes-field-pdf-sales"
  name="pdfSalesTerms"
  value={formData.pdfSalesTerms}
  onChange={onChange}
  rows={6}
  className="block w-full resize-none rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-0"
  placeholder="Enter PDF sales terms..."
  />
  </div>
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-receiptSales`}
  aria-labelledby={`${tablistId}-receiptSales`}
  hidden={activeTab !== "receiptSales"}
  className={activeTab === "receiptSales" ? TAB_UI.receiptSales.panel : "hidden"}
  >
  <div>
  <SectionLabel
  htmlFor="notes-field-receipt-sales"
  icon={Printer}
  tipAriaLabel="About receipt printer sales terms"
  tip={
   <>
   <p className="mb-2">
   Short footer block on the <strong className="font-medium text-slate-800">80mm sale receipt</strong>{" "}
   when the &quot;Terms text&quot; checkbox is on under &quot;What to print&quot;.
   </p>
   <p>
   Optimised for narrow paper: use short lines, avoid long URLs, and remember silent thermal output
   wraps by character width. For full legal text, use PDF sales terms + the A4 invoice instead.
   </p>
   </>
  }
  >
  Sales receipt terms text
  </SectionLabel>
  <textarea
  id="notes-field-receipt-sales"
  name="receiptPrinterSalesTerms"
  value={formData.receiptPrinterSalesTerms}
  onChange={onChange}
  rows={4}
  className="block w-full resize-none rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-0"
  placeholder="Enter receipt printer sales terms..."
  />
  </div>
  <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
  <h3 className="text-sm font-bold text-gray-900">What to print (sale receipt)</h3>
  <HelpTip
   ariaLabel="About sale receipt print options"
   align="end"
   iconClassName="h-4 w-4 text-gray-400"
   contentClassName="max-w-md text-left text-sm leading-relaxed"
  >
   <p className="mb-2 text-slate-700">
   Each checkbox hides or shows a block on the slip. Order is controlled separately in{" "}
   <strong className="font-medium text-slate-800">Section order</strong> (drag the list).
   </p>
   <p className="mb-2 text-slate-700">
   <strong className="font-medium text-slate-800">Customer</strong> fields need a linked customer on the
   sale. <strong className="font-medium text-slate-800">Location phone/email</strong> always come from
   the sale’s branch record, not the customer card.
   </p>
   <p className="text-slate-700">
   Browser/PDF output can show the logo; <strong className="font-medium text-slate-800">silent ESC/POS</strong>{" "}
   follows toggles/order but cannot render images. Font point sizes under Size &amp; typography apply to
   the PDF path.
   </p>
  </HelpTip>
  </div>
  <div className="mb-4 border-b border-gray-200 pb-4">
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
   Size &amp; typography
   </span>
   <InlineFieldTip ariaLabel="About sale receipt size and fonts">
   <strong className="font-medium text-slate-800">Paper width</strong> (58–80&nbsp;mm) and{" "}
   <strong className="font-medium text-slate-800">side margin</strong> change how PDF text wraps.{" "}
   <strong className="font-medium text-slate-800">Reference QR size</strong> applies to the PDF slip when
   “Invoice reference QR code” is on (not drawn on silent ESC/POS).{" "}
   <strong className="font-medium text-slate-800">Heading / body / small / line items</strong> are default
   PDF point sizes; expand <strong className="font-medium text-slate-800">Per-section font</strong> to
   override each block. Silent ESC/POS still uses the printer&apos;s built-in font.
   </InlineFieldTip>
  </div>
  <div className="grid grid-cols-2 gap-3 @[640px]:grid-cols-3 @[1024px]:grid-cols-6">
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Paper width (mm)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.paperWidthMm"
   value={formData.receiptPrinterSalesPrint.paperWidthMm}
   onChange={onChange}
   min={58}
   max={80}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Side margin (mm)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.sideMarginMm"
   value={formData.receiptPrinterSalesPrint.sideMarginMm}
   onChange={onChange}
   min={2}
   max={8}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Reference QR size (mm)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.receiptReferenceQrSizeMm"
   value={formData.receiptPrinterSalesPrint.receiptReferenceQrSizeMm}
   onChange={onChange}
   min={14}
   max={30}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Heading (pt)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.fontHeadingPt"
   value={formData.receiptPrinterSalesPrint.fontHeadingPt}
   onChange={onChange}
   min={9}
   max={16}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Body (pt)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.fontBodyPt"
   value={formData.receiptPrinterSalesPrint.fontBodyPt}
   onChange={onChange}
   min={6}
   max={11}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Small (pt)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.fontSmallPt"
   value={formData.receiptPrinterSalesPrint.fontSmallPt}
   onChange={onChange}
   min={6}
   max={10}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Line items (pt)</label>
   <input
   type="number"
   name="receiptPrinterSalesPrint.fontLineItemPt"
   value={formData.receiptPrinterSalesPrint.fontLineItemPt}
   onChange={onChange}
   min={7}
   max={12}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
  </div>
  <details className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
   <summary className="cursor-pointer text-sm font-semibold text-gray-900">
   Per-section font (pt, optional)
   </summary>
   <p className="mt-2 text-xs text-gray-600">
   Leave blank to use the default heading / body / small / line sizes above. Applies to the browser/PDF
   80&nbsp;mm receipt only.
   </p>
   <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto @[640px]:grid-cols-2">
   {SALES_RECEIPT_FONT_SIZE_KEYS.map((fk) => (
   <div key={fk} className="flex min-w-0 items-center gap-2">
   <label
    className="min-w-0 flex-1 truncate text-xs text-gray-700"
    title={SALES_RECEIPT_FONT_SIZE_LABELS[fk]}
   >
    {SALES_RECEIPT_FONT_SIZE_LABELS[fk]}
   </label>
   <input
    type="number"
    name={`receiptPrinterSalesPrint.sectionFontPt.${fk}`}
    value={formData.receiptPrinterSalesPrint.sectionFontPt[fk] ?? ""}
    onChange={onChange}
    min={6}
    max={16}
    step={0.5}
    placeholder="—"
    className="w-20 shrink-0 rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-sm text-gray-800"
   />
   </div>
   ))}
   </div>
  </details>
  </div>
  <div className="grid grid-cols-1 gap-4 @[1024px]:grid-cols-2 @[1024px]:items-start">
  <div className="space-y-4">
   <div className="grid grid-cols-1 gap-2 @[640px]:grid-cols-2">
   {RECEIPT_SALES_PRINT_OPTIONS.map(({ key, label, hint }) => (
   <label
   key={key}
   className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1.5 py-1.5 text-sm text-gray-900 transition hover:bg-orange-50 hover:ring-1 hover:ring-orange-200"
   >
   <input
    type="checkbox"
    name={`receiptPrinterSalesPrint.${key}`}
    checked={formData.receiptPrinterSalesPrint[key]}
    onChange={onChange}
    className="mt-0.5 rounded border-orange-300 text-gray-400 focus:ring-orange-500"
   />
   <span>
    {label}
    {hint && <span className="mt-0.5 block text-xs font-normal text-gray-500">{hint}</span>}
   </span>
   </label>
   ))}
   </div>
   <div>
   <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
   Section order (drag to reorder)
   </p>
   <HelpTip
   ariaLabel="About sale receipt section order"
   align="end"
   iconClassName="h-3.5 w-3.5 text-gray-400"
   contentClassName="max-w-xs text-left text-xs leading-relaxed"
   >
   Drag blocks to change top-to-bottom order on the slip. Hidden sections (checkbox off) are skipped
   automatically. Put <strong className="font-medium text-slate-800">customer</strong> details before
   line items if you want name above the basket, or move{" "}
   <strong className="font-medium text-slate-800">totals/terms</strong> to the end.
   </HelpTip>
   </div>
   <DraggableOrderList
   accent="orange"
   ids={formData.receiptPrinterSalesPrint.sectionOrder}
   getLabel={(id) => SALES_RECEIPT_SECTION_LABELS[id]}
   onReorder={onReorderSalesReceiptSections}
   ariaLabel="Sale receipt section order"
   />
   </div>
  </div>
  <SalesReceiptLayoutPreview options={formData.receiptPrinterSalesPrint} />
  </div>
  </div>
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-receiptRepair`}
  aria-labelledby={`${tablistId}-receiptRepair`}
  hidden={activeTab !== "receiptRepair"}
  className={activeTab === "receiptRepair" ? TAB_UI.receiptRepair.panel : "hidden"}
  >
  <div>
  <SectionLabel
  htmlFor="notes-field-receipt-repair"
  icon={Wrench}
  tipAriaLabel="About receipt printer repair terms"
  tip={
   <>
   <p className="mb-2">
   Footer text on the <strong className="font-medium text-slate-800">80mm repair ticket PDF</strong>{" "}
   when &quot;Terms text&quot; is enabled in the print options below.
   </p>
   <p>
   Use for shop policies (warranty on repairs, liquid damage, collection deadlines). This is{" "}
   <em>not</em> the small Dymo-style label—that has its own tab.
   </p>
   </>
  }
  >
  Repair ticket terms text
  </SectionLabel>
  <textarea
  id="notes-field-receipt-repair"
  name="receiptPrinterRepairTerms"
  value={formData.receiptPrinterRepairTerms}
  onChange={onChange}
  rows={4}
  className="block w-full resize-none rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-0"
  placeholder="Enter receipt printer repair terms..."
  />
  </div>
  <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
  <h3 className="text-sm font-bold text-gray-900">What to print (repair ticket)</h3>
  <HelpTip
   ariaLabel="About repair ticket print options"
   align="end"
   iconClassName="h-4 w-4 text-gray-400"
   contentClassName="max-w-md text-left text-sm leading-relaxed"
  >
   <p className="mb-2 text-slate-700">
   Mirrors the sale receipt controls: each toggle removes a block;{" "}
   <strong className="font-medium text-slate-800">section order</strong> sets top-to-bottom flow on the PDF.
   </p>
   <p className="mb-2 text-slate-700">
   <strong className="font-medium text-slate-800">Location</strong> header/phone/email use the repair’s
   branch when set. A divider prints before terms/thank-you when something appears above.
   </p>
   <p className="text-slate-700">
   You can disable <strong className="font-medium text-slate-800">QR</strong> but keep the reference line
   for manual ticket lookup. <strong className="font-medium text-slate-800">QR size (mm)</strong> only affects
   the PDF layout.
   </p>
  </HelpTip>
  </div>
  <div className="mb-4 border-b border-gray-200 pb-4">
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
   Size &amp; typography
   </span>
   <InlineFieldTip ariaLabel="About repair ticket size and fonts">
   <strong className="font-medium text-slate-800">Paper width</strong> and{" "}
   <strong className="font-medium text-slate-800">margins</strong> match your physical roll (58&nbsp;mm vs
   80&nbsp;mm). <strong className="font-medium text-slate-800">Heading/body/small</strong> control PDF font
   sizes. <strong className="font-medium text-slate-800">QR size</strong> is the square footprint on the
   ticket—shrink on narrow rolls if the code gets clipped.
   </InlineFieldTip>
  </div>
  <div className="grid grid-cols-2 gap-3 @[640px]:grid-cols-3 @[1024px]:grid-cols-6">
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Paper width (mm)</label>
   <input
   type="number"
   name="receiptPrinterRepairPrint.paperWidthMm"
   value={formData.receiptPrinterRepairPrint.paperWidthMm}
   onChange={onChange}
   min={58}
   max={80}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Side margin (mm)</label>
   <input
   type="number"
   name="receiptPrinterRepairPrint.sideMarginMm"
   value={formData.receiptPrinterRepairPrint.sideMarginMm}
   onChange={onChange}
   min={2}
   max={8}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Heading (pt)</label>
   <input
   type="number"
   name="receiptPrinterRepairPrint.fontHeadingPt"
   value={formData.receiptPrinterRepairPrint.fontHeadingPt}
   onChange={onChange}
   min={9}
   max={16}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Body (pt)</label>
   <input
   type="number"
   name="receiptPrinterRepairPrint.fontBodyPt"
   value={formData.receiptPrinterRepairPrint.fontBodyPt}
   onChange={onChange}
   min={6}
   max={11}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Small (pt)</label>
   <input
   type="number"
   name="receiptPrinterRepairPrint.fontSmallPt"
   value={formData.receiptPrinterRepairPrint.fontSmallPt}
   onChange={onChange}
   min={6}
   max={10}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">QR size (mm)</label>
   <input
   type="number"
   name="receiptPrinterRepairPrint.qrSizeMm"
   value={formData.receiptPrinterRepairPrint.qrSizeMm}
   onChange={onChange}
   min={14}
   max={30}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
  </div>
  <details className="mt-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
   <summary className="cursor-pointer text-sm font-semibold text-gray-900">
   Per-section font (pt, optional)
   </summary>
   <p className="mt-2 text-xs text-gray-600">
   Blank = use heading/body/small defaults above. PDF repair ticket only (logo/QR unchanged).
   </p>
   <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto @[640px]:grid-cols-2">
   {REPAIR_TICKET_FONT_SIZE_KEYS.map((fk) => (
   <div key={fk} className="flex min-w-0 items-center gap-2">
   <label
    className="min-w-0 flex-1 truncate text-xs text-gray-700"
    title={REPAIR_TICKET_FONT_SIZE_LABELS[fk]}
   >
    {REPAIR_TICKET_FONT_SIZE_LABELS[fk]}
   </label>
   <input
    type="number"
    name={`receiptPrinterRepairPrint.sectionFontPt.${fk}`}
    value={formData.receiptPrinterRepairPrint.sectionFontPt[fk] ?? ""}
    onChange={onChange}
    min={6}
    max={16}
    step={0.5}
    placeholder="—"
    className="w-20 shrink-0 rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-sm text-gray-800"
   />
   </div>
   ))}
   </div>
  </details>
  </div>
  <div className="grid grid-cols-1 gap-4 @[1024px]:grid-cols-2 @[1024px]:items-start">
  <div className="space-y-4">
   <div className="grid grid-cols-1 gap-2 @[640px]:grid-cols-2">
   {RECEIPT_REPAIR_PRINT_OPTIONS.map(({ key, label, hint }) => (
   <label
   key={key}
   className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1.5 py-1.5 text-sm text-gray-900 transition hover:bg-orange-50 hover:ring-1 hover:ring-orange-200"
   >
   <input
    type="checkbox"
    name={`receiptPrinterRepairPrint.${key}`}
    checked={formData.receiptPrinterRepairPrint[key]}
    onChange={onChange}
    className="mt-0.5 rounded border-orange-300 text-gray-400 focus:ring-orange-500"
   />
   <span>
    {label}
    {hint && <span className="mt-0.5 block text-xs font-normal text-gray-500">{hint}</span>}
   </span>
   </label>
   ))}
   </div>
   <div>
   <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
   Section order (drag to reorder)
   </p>
   <HelpTip
   ariaLabel="About repair ticket section order"
   align="end"
   iconClassName="h-3.5 w-3.5 text-gray-400"
   contentClassName="max-w-xs text-left text-xs leading-relaxed"
   >
   Drag to reorder blocks such as logo, header, QR, customer, device, and terms. Disabled toggles skip
   those blocks. Many shops put <strong className="font-medium text-slate-800">QR + reference</strong>{" "}
   early so the ticket scans at intake.
   </HelpTip>
   </div>
   <DraggableOrderList
   accent="orange"
   ids={formData.receiptPrinterRepairPrint.sectionOrder}
   getLabel={(id) => REPAIR_TICKET_SECTION_LABELS[id]}
   onReorder={onReorderRepairTicketSections}
   ariaLabel="Repair ticket section order"
   />
   </div>
  </div>
  <RepairTicketLayoutPreview options={formData.receiptPrinterRepairPrint} />
  </div>
  </div>
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-repairLabel`}
  aria-labelledby={`${tablistId}-repairLabel`}
  hidden={activeTab !== "repairLabel"}
  className={activeTab === "repairLabel" ? TAB_UI.repairLabel.panel : "hidden"}
  >
  {/* Repair device label (PDF) */}
  <div className="pt-0">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
  <div className="flex min-w-0 items-center gap-3 text-sm font-semibold text-gray-900">
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-sm ">
   <Tag className="h-4 w-4 text-white drop-shadow-sm" aria-hidden />
  </span>
  <span className="uppercase tracking-wide">Repair device label (small PDF)</span>
  </div>
  <HelpTip
  ariaLabel="About repair device label settings"
  align="end"
  iconClassName="h-4 w-4 text-gray-400"
  contentClassName="max-w-md text-left text-sm leading-relaxed"
  >
  <p className="mb-2 text-slate-700">
   Generates a compact PDF sized to your label in <strong className="font-medium text-slate-800">mm</strong>.
   Match width/height to the roll or sheet you load—mis-sized pages cause cropping or wrong scaling in
   Chrome and silent agents.
  </p>
  <p className="mb-2 text-slate-700">
   Choose <strong className="font-medium text-slate-800">which fields</strong> print,{" "}
   <strong className="font-medium text-slate-800">text line order</strong>, and QR placement. If silent
   print flips columns versus the browser, use <strong className="font-medium text-slate-800">Swap columns</strong>{" "}
   (silent only) without changing the PDF you see in Chrome.
  </p>
  <p className="text-slate-700">
   This label is separate from the full <strong className="font-medium text-slate-800">80mm repair ticket</strong>{" "}
   on the Receipt — repairs tab.
  </p>
  </HelpTip>
  </div>
  <p className="mb-4 text-sm font-medium text-gray-600">
  Landscape label: <strong className="font-semibold">width</strong> is the long edge (default{" "}
  <strong className="font-semibold">57 mm wide × 32 mm high</strong>). If height is entered larger than width,
  we treat it as swapped when printing.
  </p>
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
  <span className="text-xs font-bold uppercase tracking-wide text-gray-700">Size &amp; typography</span>
  <InlineFieldTip ariaLabel="About label size and typography">
  <strong className="font-medium text-slate-800">Width and height</strong> should match the label you
  load in the printer.   <strong className="font-medium text-slate-800">Text size</strong> is the default for every line; expand{" "}
  <strong className="font-medium text-slate-800">Per-line text size</strong> to set pt per field.{" "}
  <strong className="font-medium text-slate-800">Line height</strong>, <strong className="font-medium text-slate-800">QR size</strong>, and{" "}
  <strong className="font-medium text-slate-800">max problem lines</strong> still apply globally.
  </InlineFieldTip>
  </div>
  <div className="grid grid-cols-1 @[640px]:grid-cols-2 @[1024px]:grid-cols-3 gap-4 mb-4">
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Label width (mm)</label>
  <input
   type="number"
   name="repairLabelPrint.labelWidthMm"
   value={formData.repairLabelPrint.labelWidthMm}
   onChange={onChange}
   min={30}
   max={120}
   step={1}
   className="block w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
  />
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Label height (mm)</label>
  <input
   type="number"
   name="repairLabelPrint.labelHeightMm"
   value={formData.repairLabelPrint.labelHeightMm}
   onChange={onChange}
   min={15}
   max={100}
   step={1}
   className="block w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
  />
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Text size (pt)</label>
  <input
   type="number"
   name="repairLabelPrint.fontSizePt"
   value={formData.repairLabelPrint.fontSizePt}
   onChange={onChange}
   min={4}
   max={14}
   step={0.5}
   className="block w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
  />
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Line height (mm)</label>
  <input
   type="number"
   name="repairLabelPrint.lineHeightMm"
   value={formData.repairLabelPrint.lineHeightMm}
   onChange={onChange}
   min={2.5}
   max={10}
   step={0.1}
   className="block w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
  />
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">QR size (mm)</label>
  <input
   type="number"
   name="repairLabelPrint.qrSizeMm"
   value={formData.repairLabelPrint.qrSizeMm}
   onChange={onChange}
   min={8}
   max={35}
   step={0.5}
   className="block w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
  />
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Max problem lines</label>
  <input
   type="number"
   name="repairLabelPrint.maxProblemLines"
   value={formData.repairLabelPrint.maxProblemLines}
   onChange={onChange}
   min={1}
   max={6}
   step={1}
   className="block w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
  />
  </div>
  </div>
  <details className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
  <summary className="cursor-pointer text-sm font-semibold text-gray-900">
  Per-line text size (pt, optional)
  </summary>
  <p className="mt-2 text-xs text-gray-600">
  Blank = use default <strong className="font-medium text-slate-800">Text size (pt)</strong> above. Applies
  to PDF and silent PNG label output.
  </p>
  <div className="mt-3 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto @[640px]:grid-cols-2">
  {REPAIR_LABEL_TEXT_FIELD_IDS.map((fid) => (
   <div key={fid} className="flex min-w-0 items-center gap-2">
   <label
   className="min-w-0 flex-1 truncate text-xs text-gray-700"
   title={REPAIR_LABEL_TEXT_FIELD_LABELS[fid]}
   >
   {REPAIR_LABEL_TEXT_FIELD_LABELS[fid]}
   </label>
   <input
   type="number"
   name={`repairLabelPrint.fieldFontPt.${fid}`}
   value={formData.repairLabelPrint.fieldFontPt[fid] ?? ""}
   onChange={onChange}
   min={4}
   max={14}
   step={0.5}
   placeholder="—"
   className="w-20 shrink-0 rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-sm text-gray-800"
   />
   </div>
  ))}
  </div>
  </details>
  <div className="grid grid-cols-1 @[640px]:grid-cols-2 gap-4 mb-4">
  <div>
  <div className="mb-1 flex items-center justify-between gap-1">
   <label className="text-xs font-medium text-gray-600">QR position</label>
   <InlineFieldTip ariaLabel="About QR position">
   Left and right match the on-screen PDF when you print from the browser. Set label width and height
   to your physical stock so DYMO or other silent print paths line up the same.
   </InlineFieldTip>
  </div>
  <select
   name="repairLabelPrint.qrPosition"
   value={formData.repairLabelPrint.qrPosition}
   onChange={onChange}
   className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 focus:ring-offset-0"
  >
   <option value="left">Left</option>
   <option value="right">Right</option>
  </select>
  </div>
  <div>
  <div className="mb-1 flex items-center justify-between gap-1">
   <label className="text-xs font-medium text-gray-600">Text alignment</label>
   <InlineFieldTip ariaLabel="About text alignment">
   How the text block is aligned on the label PDF. Does not mirror text; it only shifts alignment within
   the text column.
   </InlineFieldTip>
  </div>
  <select
   name="repairLabelPrint.textAlign"
   value={formData.repairLabelPrint.textAlign}
   onChange={onChange}
   className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 focus:ring-offset-0"
  >
   <option value="left">Left</option>
   <option value="center">Center</option>
   <option value="right">Right</option>
  </select>
  </div>
  </div>
  <div className="mb-4">
  <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
  <label className="text-xs font-medium text-gray-600">
   Silent print layout (Print Bridge / DYMO only)
  </label>
  <InlineFieldTip ariaLabel="About silent print layout">
   Browser and downloaded PDFs always follow <strong className="font-medium text-slate-800">QR position</strong>{" "}
   above. If the physical label shows QR and text on the opposite sides compared to Chrome, choose{" "}
   <strong className="font-medium text-slate-800">Swap columns</strong> so only the silent agent gets a
   PDF with columns exchanged (text stays readable, not mirrored).
  </InlineFieldTip>
  </div>
  <select
  name="repairLabelPrint.silentPrintLayoutMode"
  value={formData.repairLabelPrint.silentPrintLayoutMode}
  onChange={onChange}
  className="block w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 focus:ring-offset-0"
  >
  <option value="same_as_pdf">Same as browser PDF</option>
  <option value="swap_columns">Swap QR and text columns (silent only)</option>
  </select>
  </div>
  <div className="mb-4 rounded-xl border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
  <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-900">
  <input
   type="checkbox"
   name="repairLabelPrint.invertSilentPrintOrientation"
   checked={formData.repairLabelPrint.invertSilentPrintOrientation}
   onChange={onChange}
   className="mt-1 rounded border-orange-400 text-gray-400 focus:ring-orange-500"
  />
  <span className="min-w-0 flex-1">
   <span className="flex flex-wrap items-center gap-2">
   <span className="font-semibold text-gray-900">Invert silent print orientation (legacy)</span>
   <InlineFieldTip ariaLabel="About invert silent print orientation">
   Silent label print now uses the PDF page size only (no Sumatra orientation flag). Leave this off
   and match Chrome versus silent output using Windows printer layout and the label size in mm above.
   This option is kept for older saved settings and does not affect the current print agent path.
   </InlineFieldTip>
   </span>
  </span>
  </label>
  </div>
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
  <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Show on label</p>
  <InlineFieldTip ariaLabel="About fields on the repair label">
  Choose which ticket details appear on the small label. QR encodes a link or payload for scanning;
  reference helps staff find the job; customer and device fields help identify the device on the bench.
  </InlineFieldTip>
  </div>
  <div className="grid grid-cols-1 gap-4 @[1024px]:grid-cols-2 @[1024px]:items-start">
  <div className="space-y-4">
  <div className="grid grid-cols-1 gap-2 @[640px]:grid-cols-2">
   {(
   [
   ["showQr", "QR code"],
   ["showReferenceText", "Reference / ticket number"],
   ["showCustomerName", "Customer name"],
   ["showContactPhone", "Contact phone"],
   ["showContactEmail", "Contact email"],
   ["showDeviceDescription", "Device description"],
   ["showProblemType", "Problem / issue"],
   ["showSerialNumber", "IMEI / serial"],
   ["showEstimatedCost", "Estimated cost"],
   ] as const
   ).map(([key, label]) => (
   <label
   key={key}
   className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-gray-900/90 transition hover:bg-orange-50 hover:ring-1 hover:ring-orange-200"
   >
   <input
   type="checkbox"
   name={`repairLabelPrint.${key}`}
   checked={formData.repairLabelPrint[key]}
   onChange={onChange}
   className="rounded border-orange-400 text-gray-400 focus:ring-orange-500"
   />
   {label}
   </label>
   ))}
  </div>
  <div>
   <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
   Text line order (drag to reorder)
   </p>
   <HelpTip
   ariaLabel="About repair label text line order"
   align="end"
   iconClassName="h-3.5 w-3.5 text-gray-400"
   contentClassName="max-w-xs text-left text-xs leading-relaxed"
   >
   Only lines you enabled under &quot;Show on label&quot; appear. Drag to change reading order in the text
   column (e.g. reference first, then customer, then device). QR stays in its own column unless you use
   silent <strong className="font-medium text-slate-800">Swap columns</strong>.
   </HelpTip>
   </div>
   <DraggableOrderList
   accent="orange"
   ids={formData.repairLabelPrint.textFieldOrder}
   getLabel={(id) => REPAIR_LABEL_TEXT_FIELD_LABELS[id]}
   onReorder={onReorderRepairLabelFields}
   ariaLabel="Repair label text field order"
   />
  </div>
  </div>
  <RepairLabelFieldsPreview options={formData.repairLabelPrint} />
  </div>
  </div>
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-a4Invoice`}
  aria-labelledby={`${tablistId}-a4Invoice`}
  hidden={activeTab !== "a4Invoice"}
  className={activeTab === "a4Invoice" ? TAB_UI.a4Invoice.panel : "hidden"}
  >
  <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
  <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-blue-900">
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 shadow-sm">
   <FileStack className="h-4 w-4 text-white" aria-hidden />
   </span>
   A4 dispatch / invoice PDF
  </div>
  <HelpTip
   ariaLabel="About A4 invoice PDF settings"
   align="end"
   iconClassName="h-4 w-4 text-blue-600"
   contentClassName="max-w-md text-left text-sm leading-relaxed"
  >
   <p className="mb-2 text-slate-700">
   Applies when you open or print the <strong className="font-medium text-slate-800">A4 dispatch / invoice</strong>{" "}
   from a sale—not the narrow thermal receipt.
   </p>
   <p className="mb-2 text-slate-700">
   <strong className="font-medium text-slate-800">Settings → About</strong> supplies document title,
   company name, address block, and the logo image file. This tab chooses{" "}
   <strong className="font-medium text-slate-800">which sections</strong> render and the{" "}
   <strong className="font-medium text-slate-800">font sizes and margins</strong> on the page.
   </p>
   <p className="text-slate-700">
   Edit the actual wording for <strong className="font-medium text-slate-800">PDF sales terms</strong> on
   the Terms tab and <strong className="font-medium text-slate-800">Payment note</strong> on the Payment
   tab; then enable those blocks under &quot;What to include&quot; below.
   </p>
  </HelpTip>
  </div>
  <p className="mb-4 text-sm font-medium text-blue-900/75">
  Used when printing or opening the A4 invoice / dispatch note from sales (not the 80mm receipt).
  </p>
  <div className="mb-4 border-b border-blue-200/60 pb-4">
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs font-bold uppercase tracking-wide text-blue-800/90">
   Size &amp; typography
   </span>
   <InlineFieldTip ariaLabel="About A4 margins and fonts">
   <strong className="font-medium text-slate-800">Margin (mm)</strong> pads left, right, and top together
   (keeps content off the physical non-printable edge). Per-field <strong className="font-medium text-slate-800">pt</strong>{" "}
   sizes scale company name, title, section headings, body, tables, and the terms/payment footer.{" "}
   <strong className="font-medium text-slate-800">Logo width/height (mm)</strong> is the drawn size on the
   sheet (image still comes from About). <strong className="font-medium text-slate-800">Reference QR size</strong>{" "}
   sets the square code encoding the invoice reference when that option is enabled under What to include.
   </InlineFieldTip>
  </div>
  <div className="grid grid-cols-2 gap-3 @[640px]:grid-cols-3 @[1024px]:grid-cols-5">
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Margin (mm)</label>
   <input
   type="number"
   name="invoicePdfPrint.marginMm"
   value={formData.invoicePdfPrint.marginMm}
   onChange={onChange}
   min={12}
   max={24}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Company name (pt)</label>
   <input
   type="number"
   name="invoicePdfPrint.fontCompanyNamePt"
   value={formData.invoicePdfPrint.fontCompanyNamePt}
   onChange={onChange}
   min={14}
   max={24}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Document title (pt)</label>
   <input
   type="number"
   name="invoicePdfPrint.fontDocTitlePt"
   value={formData.invoicePdfPrint.fontDocTitlePt}
   onChange={onChange}
   min={11}
   max={20}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Section headings (pt)</label>
   <input
   type="number"
   name="invoicePdfPrint.fontSectionHeadingPt"
   value={formData.invoicePdfPrint.fontSectionHeadingPt}
   onChange={onChange}
   min={8}
   max={14}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Body (pt)</label>
   <input
   type="number"
   name="invoicePdfPrint.fontBodyPt"
   value={formData.invoicePdfPrint.fontBodyPt}
   onChange={onChange}
   min={8}
   max={13}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Table (pt)</label>
   <input
   type="number"
   name="invoicePdfPrint.fontTablePt"
   value={formData.invoicePdfPrint.fontTablePt}
   onChange={onChange}
   min={7}
   max={11}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Terms / notes (pt)</label>
   <input
   type="number"
   name="invoicePdfPrint.fontTermsPt"
   value={formData.invoicePdfPrint.fontTermsPt}
   onChange={onChange}
   min={7}
   max={11}
   step={0.5}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Logo width (mm)</label>
   <input
   type="number"
   name="invoicePdfPrint.logoWidthMm"
   value={formData.invoicePdfPrint.logoWidthMm}
   onChange={onChange}
   min={20}
   max={45}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Logo height (mm)</label>
   <input
   type="number"
   name="invoicePdfPrint.logoHeightMm"
   value={formData.invoicePdfPrint.logoHeightMm}
   onChange={onChange}
   min={8}
   max={22}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
   <div>
   <label className="mb-1 block text-xs font-medium text-gray-600">Reference QR size (mm)</label>
   <input
   type="number"
   name="invoicePdfPrint.invoiceReferenceQrSizeMm"
   value={formData.invoicePdfPrint.invoiceReferenceQrSizeMm}
   onChange={onChange}
   min={16}
   max={32}
   step={1}
   className="block w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35 focus:ring-offset-0"
   />
   </div>
  </div>
  </div>
  <div>
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <p className="text-xs font-bold uppercase tracking-wide text-blue-800/90">What to include</p>
   <HelpTip
   ariaLabel="About A4 PDF section toggles"
   align="end"
   iconClassName="h-3.5 w-3.5 text-blue-600"
   contentClassName="max-w-xs text-left text-xs leading-relaxed"
   >
   Each checkbox shows or hides a major block on the PDF. Some blocks need data (e.g. serial table only
   when lines have serials; account summary for wholesale-style sales). Bank and logo pull from other
   settings—see each line’s hint.
   </HelpTip>
  </div>
  <div className="grid grid-cols-1 gap-2 @[640px]:grid-cols-2">
   {A4_INVOICE_PRINT_OPTIONS.map(({ key, label, hint }) => (
   <label
   key={key}
   className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1.5 py-1.5 text-sm text-blue-950/90 transition hover:bg-blue-50/70 hover:ring-1 hover:ring-blue-200/50"
   >
   <input
   type="checkbox"
   name={`invoicePdfPrint.${key}`}
   checked={formData.invoicePdfPrint[key]}
   onChange={onChange}
   className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
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
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-businessInvoice`}
  aria-labelledby={`${tablistId}-businessInvoice`}
  hidden={activeTab !== "businessInvoice"}
  className={activeTab === "businessInvoice" ? TAB_UI.businessInvoice.panel : "hidden"}
  >
  <BusinessInvoiceSettingsPanel formData={formData} onChange={onChange} />
  </div>

  <div
  role="tabpanel"
  id={`${tablistId}-panel-payment`}
  aria-labelledby={`${tablistId}-payment`}
  hidden={activeTab !== "payment"}
  className={activeTab === "payment" ? TAB_UI.payment.panel : "hidden"}
  >
  {/* Payment Note */}
  <div>
  <SectionLabel
  htmlFor="notes-field-payment"
  icon={CreditCard}
  tipAriaLabel="About payment note"
  tip={
  <>
   <p className="mb-2">
   Short policy text: cards accepted, bank transfer details summary, deposits required before repair,
   finance partners, or &quot;payment due on collection&quot; reminders.
   </p>
   <p>
   When <strong className="font-medium text-slate-800">&quot;Payment note&quot;</strong> is enabled on the
   A4 tab, this paragraph is appended to the invoice/dispatch PDF. Keep wording consistent with your Terms
   tab and real banking data in <strong className="font-medium text-slate-800">Bank Account Details</strong>{" "}
   when you also print bank lines on the PDF.
   </p>
  </>
  }
  >
  Payment note
  </SectionLabel>
  <textarea
  id="notes-field-payment"
  name="paymentNote"
  value={formData.paymentNote}
  onChange={onChange}
  rows={4}
  className="block w-full resize-none rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-0"
  placeholder="Enter payment note..."
  />
  </div>
  </div>
  </div>
 </div>

 {/* Action Buttons */}
 <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
  <div className="flex flex-wrap items-center gap-2">
  {hasExistingData && (
  <button
  type="button"
  onClick={onDelete}
  className="inline-flex items-center rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-1.5 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100/90"
  >
  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
  Reset to Defaults
  </button>
  )}
  <HelpTip
  ariaLabel="About Save, Reset, and Reset to Defaults"
  align="start"
  iconClassName="h-4 w-4 text-gray-400"
  contentClassName="max-w-sm text-left text-sm leading-relaxed"
  >
  <p className="mb-2 text-slate-700">
  <strong className="font-medium text-slate-800">Save Settings</strong> persists the whole Notes &amp; Terms
  document (all tabs) to the server.
  </p>
  <p className="mb-2 text-slate-700">
  <strong className="font-medium text-slate-800">Reset</strong> reloads the last saved copy and drops anything
  you typed since the last successful save.
  </p>
  <p className="text-slate-700">
  <strong className="font-medium text-slate-800">Reset to Defaults</strong> removes your custom settings and
  recreates the template—irreversible without a backup; use when onboarding a new site or recovering from bad
  edits.
  </p>
  </HelpTip>
  </div>
  <div className="flex items-center gap-2">
  <button
  type="button"
  onClick={onReset}
  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
  >
  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
  Reset
  </button>
  <button
  type="submit"
  disabled={isSaving}
  className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-70"
  >
  <Save className="w-3.5 h-3.5 mr-1.5" />
  {isSaving ? "Saving..." : "Save Settings"}
  </button>
  </div>
 </div>
 </div>
 </form>
 );
};

"use client";

import React from "react";
import { FileText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";

export const PageHeader: React.FC = () => {
 return (
 <div className="mb-4">
 <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
 <div className="flex flex-wrap items-start justify-between gap-3">
  <div className="flex min-w-0 items-start gap-3">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 shadow-sm">
  <FileText className="h-5 w-5 text-white" />
  </div>
  <div className="min-w-0 pt-0.5">
  <h1 className="text-lg font-bold tracking-tight text-gray-900">Notes & Terms</h1>
  <p className="mt-0.5 text-xs text-gray-500">
  One place for delivery text, legal/PDF wording, 80mm receipts, repair tickets and labels, A4 invoice
  layouts, and payment notes. Pick which A4 template is active at the top of the form; use the tabs to
  configure each;{" "}
  <strong className="font-semibold text-gray-700">Save</strong> stores <em>all</em> tabs together.
  </p>
  </div>
  </div>
  <HelpTip
  ariaLabel="Complete guide: what each Notes and Terms area does"
  align="end"
  className="shrink-0"
  iconClassName="h-4 w-4 text-gray-400 hover:text-orange-500"
  contentClassName="max-w-md text-left text-xs leading-relaxed"
  >
  <p className="mb-2 font-semibold text-gray-900">What lives here</p>
  <ul className="mb-3 list-disc space-y-1 pl-4 text-gray-700">
  <li>
  <strong className="font-medium text-gray-800">Delivery</strong> — optional address block for documents
  that need a fixed "delivery / returns" address.
  </li>
  <li>
  <strong className="font-medium text-gray-800">Terms</strong> — purchase terms for buying flows, and{" "}
  <strong className="font-medium text-gray-800">PDF sales terms</strong> for the A4
  dispatch/invoice PDF.
  </li>
  <li>
  <strong className="font-medium text-gray-800">Receipt — sales</strong> — 80mm sale slip:
  terms text, paper size and fonts, what to print, drag order, and a live preview.
  </li>
  <li>
  <strong className="font-medium text-gray-800">Receipt — repairs</strong> — 80mm repair ticket PDF
  (plus QR size). Location header uses the repair's branch when set.
  </li>
  <li>
  <strong className="font-medium text-gray-800">Repair label</strong> — small sticker PDF (e.g. Dymo):
  dimensions, QR, which fields, column swap for silent print.
  </li>
  <li>
  <strong className="font-medium text-gray-800">A4 invoice / dispatch</strong> — legacy full-page dispatch
  PDF (unchanged). Title, company name, logo come from{" "}
  <strong className="font-medium text-gray-800">Settings → About</strong>.
  </li>
  <li>
  <strong className="font-medium text-gray-800">Business invoice (A4)</strong> — separate professional
  invoice template with its own layout toggles and terms.
  </li>
  <li>
  <strong className="font-medium text-gray-800">Payment</strong> — payment note text appended on PDFs.
  </li>
  </ul>
  <p className="mb-1 font-semibold text-gray-900">Saving</p>
  <p className="text-gray-700">
  <strong className="font-medium text-gray-800">Save Settings</strong> writes every tab in one POST.{" "}
  <strong className="font-medium text-gray-800">Reset</strong> reloads the last saved snapshot.{" "}
  <strong className="font-medium text-gray-800">Reset to Defaults</strong> wipes stored Notes & Terms
  and recreates defaults.
  </p>
  </HelpTip>
 </div>
 </div>
 </div>
 );
};

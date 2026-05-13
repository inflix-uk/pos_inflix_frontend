"use client";

import React from "react";
import { HelpTip } from "@/components/HelpTip";
import {
 SALES_RECEIPT_SECTION_LABELS,
 REPAIR_TICKET_SECTION_LABELS,
 REPAIR_LABEL_TEXT_FIELD_LABELS,
 type SalesReceiptSectionId,
 type RepairTicketSectionId,
 type RepairLabelTextFieldId,
} from "@/lib/receiptPrintLayout";
import type {
 ReceiptPrinterRepairPrintOptions,
 ReceiptPrinterSalesPrintOptions,
} from "@/lib/receiptPrinterPrintOptions";
import type { RepairLabelPrintSettings } from "@/lib/repairLabelPrintConfig";

function salesSectionVisible(id: SalesReceiptSectionId, o: ReceiptPrinterSalesPrintOptions): boolean {
 switch (id) {
 case "logo": return o.showLogo;
 case "shop_name": return o.showShopName;
 case "shop_address": return o.showShopAddress;
 case "location_phone": return o.showLocationPhone;
 case "location_email": return o.showLocationEmail;
 case "receipt_title": return o.showReceiptTitle;
 case "ref_date": return o.showReferenceAndDate;
 case "customer_name_address": return o.showCustomerNameAndAddress;
 case "customer_phone": return o.showCustomerPhone;
 case "customer_email": return o.showCustomerEmail;
 case "items": return o.showLineItems;
 case "total": return o.showTotal;
 case "terms": return o.showTermsText;
 case "thank_you": return o.showThankYou;
 default: return false;
 }
}

function repairTicketSectionVisible(id: RepairTicketSectionId, o: ReceiptPrinterRepairPrintOptions): boolean {
 switch (id) {
 case "rt_logo": return o.showLogo;
 case "rt_shop_name": return o.showShopName;
 case "rt_shop_address": return o.showShopAddress;
 case "rt_location_phone": return o.showLocationPhone;
 case "rt_location_email": return o.showLocationEmail;
 case "rt_ticket_title": return o.showTicketTitle;
 case "rt_qr": return o.showQrCode;
 case "rt_reference": return o.showReferenceLine;
 case "rt_date": return o.showDate;
 case "rt_customer": return o.showCustomerName;
 case "rt_phone": return o.showContactPhone;
 case "rt_email": return o.showContactEmail;
 case "rt_device": return o.showDeviceDescription;
 case "rt_serial": return o.showSerialNumber;
 case "rt_device_password": return o.showDevicePassword;
 case "rt_problem": return o.showProblemType;
 case "rt_estimated_cost": return o.showEstimatedCost;
 case "rt_items": return o.showRepairItems;
 case "rt_actual_cost": return o.showActualCost;
 case "rt_status": return o.showStatus;
 case "rt_notes": return o.showNotes;
 case "rt_terms": return o.showTermsText;
 case "rt_thank_you": return o.showThankYou;
 default: return false;
 }
}

function labelFieldVisible(id: RepairLabelTextFieldId, o: RepairLabelPrintSettings): boolean {
 switch (id) {
 case "reference": return o.showReferenceText;
 case "customerName": return o.showCustomerName;
 case "contactPhone": return o.showContactPhone;
 case "contactEmail": return o.showContactEmail;
 case "deviceDescription": return o.showDeviceDescription;
 case "serialNumber": return o.showSerialNumber;
 case "problemType": return o.showProblemType;
 case "estimatedCost": return o.showEstimatedCost;
 default: return false;
 }
}

export function SalesReceiptLayoutPreview({ options }: { options: ReceiptPrinterSalesPrintOptions }) {
 return (
 <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
 <div className="mb-2 flex items-center justify-center gap-1">
 <p className="text-center text-[10px] font-bold uppercase tracking-wide text-gray-600">Live order preview</p>
 <HelpTip
  ariaLabel="About the sale receipt live preview"
  align="end"
  iconClassName="h-3 w-3 text-gray-400"
  contentClassName="max-w-xs text-left text-xs leading-relaxed"
 >
  Shows blocks in <strong className="font-medium text-gray-800">section order</strong> after your toggles.
  Unchecked sections disappear here and on the printed/PDF slip. This is not pixel-perfect to the printer—use it
  to confirm order and visibility.
 </HelpTip>
 </div>
 <div className="mx-auto flex w-[180px] flex-col gap-1 border border-gray-800 bg-white px-2 py-2 font-mono text-[9px] leading-tight text-gray-900 shadow-sm">
 {options.sectionOrder.map((id) => {
  if (!salesSectionVisible(id, options)) return null;
  const label = SALES_RECEIPT_SECTION_LABELS[id];
  return (
  <div
  key={id}
  className={`rounded-sm px-1 py-0.5 ${
  id === "items" || id === "total" ? "bg-orange-50" : "bg-gray-50"
  }`}
  >
  {label}
  </div>
  );
 })}
 </div>
 </div>
 );
}

export function RepairTicketLayoutPreview({ options }: { options: ReceiptPrinterRepairPrintOptions }) {
 return (
 <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
 <div className="mb-2 flex items-center justify-center gap-1">
 <p className="text-center text-[10px] font-bold uppercase tracking-wide text-gray-600">Live order preview</p>
 <HelpTip
  ariaLabel="About the repair ticket live preview"
  align="end"
  iconClassName="h-3 w-3 text-gray-400"
  contentClassName="max-w-xs text-left text-xs leading-relaxed"
 >
  Same idea as the sale receipt preview: stacked blocks follow <strong className="font-medium text-gray-800">section order</strong>{" "}
  and checkboxes. QR and reference sit where you place them in the list.
 </HelpTip>
 </div>
 <div className="mx-auto flex w-[180px] flex-col gap-1 border border-gray-800 bg-white px-2 py-2 font-mono text-[9px] leading-tight text-gray-900 shadow-sm">
 {options.sectionOrder.map((id) => {
  if (!repairTicketSectionVisible(id, options)) return null;
  const label = REPAIR_TICKET_SECTION_LABELS[id];
  return (
  <div
  key={id}
  className={`rounded-sm px-1 py-0.5 ${
  id === "rt_qr" ? "bg-orange-50 text-center" : "bg-gray-50"
  }`}
  >
  {label}
  </div>
  );
 })}
 </div>
 </div>
 );
}

export function RepairLabelFieldsPreview({ options }: { options: RepairLabelPrintSettings }) {
 return (
 <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
 <div className="mb-2 flex items-center justify-center gap-1">
 <p className="text-center text-[10px] font-bold uppercase tracking-wide text-gray-600">Text column order</p>
 <HelpTip
  ariaLabel="About the repair label text column preview"
  align="end"
  iconClassName="h-3 w-3 text-gray-400"
  contentClassName="max-w-xs text-left text-xs leading-relaxed"
 >
  Lists only the <strong className="font-medium text-gray-800">text column</strong> lines you enabled under
  &quot;Show on label&quot;, top to bottom.
 </HelpTip>
 </div>
 <div className="mx-auto flex max-w-[240px] flex-col gap-1 border border-gray-800 bg-white px-2 py-2 font-mono text-[9px] leading-tight text-gray-900 shadow-sm">
 {options.textFieldOrder.map((id) => {
  if (!labelFieldVisible(id, options)) return null;
  return (
  <div key={id} className="rounded-sm bg-gray-50 px-1 py-0.5 ring-1 ring-gray-200">
  {REPAIR_LABEL_TEXT_FIELD_LABELS[id]}
  </div>
  );
 })}
 </div>
 </div>
 );
}

/**
 * Section order for 80mm receipts / repair tickets and text line order for repair device labels.
 * Keep backend defaults in sync (NotesTermsSettings sub-schemas).
 */

export const SALES_RECEIPT_SECTION_IDS = [
  "logo",
  "shop_name",
  "shop_address",
  "location_phone",
  "location_email",
  "receipt_title",
  "ref_date",
  "reference_qr",
  "customer_name_address",
  "customer_phone",
  "customer_email",
  "items",
  "total",
  "terms",
  "thank_you",
] as const;

export type SalesReceiptSectionId = (typeof SALES_RECEIPT_SECTION_IDS)[number];

export const SALES_RECEIPT_SECTION_LABELS: Record<SalesReceiptSectionId, string> = {
  logo: "Shop logo",
  shop_name: "Shop / location name",
  shop_address: "Address (street, city, postcode…)",
  location_phone: "Location phone",
  location_email: "Location email",
  receipt_title: "“RECEIPT” title",
  ref_date: "Reference & date",
  reference_qr: "Invoice reference QR code",
  customer_name_address: "Customer name & address",
  customer_phone: "Customer phone",
  customer_email: "Customer email",
  items: "Line items",
  total: "Total",
  terms: "Terms text",
  thank_you: "“Thank you”",
};

/** PDF font size (pt) per block — logo has no text size. */
export type SalesReceiptFontSizeKey =
  | Exclude<SalesReceiptSectionId, "logo">
  | "items_serial"
  | "items_qty_price";

export const SALES_RECEIPT_FONT_SIZE_KEYS: readonly SalesReceiptFontSizeKey[] = [
  "shop_name",
  "shop_address",
  "location_phone",
  "location_email",
  "receipt_title",
  "ref_date",
  "reference_qr",
  "customer_name_address",
  "customer_phone",
  "customer_email",
  "items",
  "items_serial",
  "items_qty_price",
  "total",
  "terms",
  "thank_you",
];

export const SALES_RECEIPT_FONT_SIZE_LABELS: Record<SalesReceiptFontSizeKey, string> = {
  shop_name: SALES_RECEIPT_SECTION_LABELS.shop_name,
  shop_address: SALES_RECEIPT_SECTION_LABELS.shop_address,
  location_phone: SALES_RECEIPT_SECTION_LABELS.location_phone,
  location_email: SALES_RECEIPT_SECTION_LABELS.location_email,
  receipt_title: SALES_RECEIPT_SECTION_LABELS.receipt_title,
  ref_date: SALES_RECEIPT_SECTION_LABELS.ref_date,
  reference_qr: SALES_RECEIPT_SECTION_LABELS.reference_qr,
  customer_name_address: SALES_RECEIPT_SECTION_LABELS.customer_name_address,
  customer_phone: SALES_RECEIPT_SECTION_LABELS.customer_phone,
  customer_email: SALES_RECEIPT_SECTION_LABELS.customer_email,
  items: SALES_RECEIPT_SECTION_LABELS.items,
  items_serial: "IMEI / serial (under line item)",
  items_qty_price: "Qty × price line",
  total: SALES_RECEIPT_SECTION_LABELS.total,
  terms: SALES_RECEIPT_SECTION_LABELS.terms,
  thank_you: SALES_RECEIPT_SECTION_LABELS.thank_you,
};

export const REPAIR_TICKET_SECTION_IDS = [
  "rt_logo",
  "rt_shop_name",
  "rt_shop_address",
  "rt_location_phone",
  "rt_location_email",
  "rt_ticket_title",
  "rt_qr",
  "rt_reference",
  "rt_date",
  "rt_customer",
  "rt_phone",
  "rt_email",
  "rt_device",
  "rt_serial",
  "rt_device_password",
  "rt_problem",
  "rt_estimated_cost",
  "rt_items",
  "rt_actual_cost",
  "rt_status",
  "rt_notes",
  "rt_terms",
  "rt_thank_you",
] as const;

export type RepairTicketSectionId = (typeof REPAIR_TICKET_SECTION_IDS)[number];

export const REPAIR_TICKET_SECTION_LABELS: Record<RepairTicketSectionId, string> = {
  rt_logo: "Shop logo",
  rt_shop_name: "Shop / location name",
  rt_shop_address: "Address",
  rt_location_phone: "Location phone",
  rt_location_email: "Location email",
  rt_ticket_title: "“REPAIR TICKET”",
  rt_qr: "QR code",
  rt_reference: "Reference line",
  rt_date: "Date received",
  rt_customer: "Customer",
  rt_phone: "Customer phone",
  rt_email: "Customer email",
  rt_device: "Device",
  rt_serial: "IMEI / serial",
  rt_device_password: "Device password",
  rt_problem: "Problem",
  rt_estimated_cost: "Estimated cost",
  rt_items: "Repair items",
  rt_actual_cost: "Actual cost",
  rt_status: "Status",
  rt_notes: "Notes",
  rt_terms: "Terms text",
  rt_thank_you: "“Thank you”",
};

/** PDF font size per block — logo and QR are not text. */
export type RepairTicketFontSizeKey = Exclude<RepairTicketSectionId, "rt_logo" | "rt_qr">;

export const REPAIR_TICKET_FONT_SIZE_KEYS: readonly RepairTicketFontSizeKey[] = [
  "rt_shop_name",
  "rt_shop_address",
  "rt_location_phone",
  "rt_location_email",
  "rt_ticket_title",
  "rt_reference",
  "rt_date",
  "rt_customer",
  "rt_phone",
  "rt_email",
  "rt_device",
  "rt_serial",
  "rt_device_password",
  "rt_problem",
  "rt_estimated_cost",
  "rt_items",
  "rt_actual_cost",
  "rt_status",
  "rt_notes",
  "rt_terms",
  "rt_thank_you",
];

export const REPAIR_TICKET_FONT_SIZE_LABELS: Record<RepairTicketFontSizeKey, string> = {
  rt_shop_name: REPAIR_TICKET_SECTION_LABELS.rt_shop_name,
  rt_shop_address: REPAIR_TICKET_SECTION_LABELS.rt_shop_address,
  rt_location_phone: REPAIR_TICKET_SECTION_LABELS.rt_location_phone,
  rt_location_email: REPAIR_TICKET_SECTION_LABELS.rt_location_email,
  rt_ticket_title: REPAIR_TICKET_SECTION_LABELS.rt_ticket_title,
  rt_reference: REPAIR_TICKET_SECTION_LABELS.rt_reference,
  rt_date: REPAIR_TICKET_SECTION_LABELS.rt_date,
  rt_customer: REPAIR_TICKET_SECTION_LABELS.rt_customer,
  rt_phone: REPAIR_TICKET_SECTION_LABELS.rt_phone,
  rt_email: REPAIR_TICKET_SECTION_LABELS.rt_email,
  rt_device: REPAIR_TICKET_SECTION_LABELS.rt_device,
  rt_serial: REPAIR_TICKET_SECTION_LABELS.rt_serial,
  rt_device_password: REPAIR_TICKET_SECTION_LABELS.rt_device_password,
  rt_problem: REPAIR_TICKET_SECTION_LABELS.rt_problem,
  rt_estimated_cost: REPAIR_TICKET_SECTION_LABELS.rt_estimated_cost,
  rt_items: REPAIR_TICKET_SECTION_LABELS.rt_items,
  rt_actual_cost: REPAIR_TICKET_SECTION_LABELS.rt_actual_cost,
  rt_status: REPAIR_TICKET_SECTION_LABELS.rt_status,
  rt_notes: REPAIR_TICKET_SECTION_LABELS.rt_notes,
  rt_terms: REPAIR_TICKET_SECTION_LABELS.rt_terms,
  rt_thank_you: REPAIR_TICKET_SECTION_LABELS.rt_thank_you,
};

/** Text lines in the repair device label (QR is separate column). */
export const REPAIR_LABEL_TEXT_FIELD_IDS = [
  "reference",
  "customerName",
  "contactPhone",
  "contactEmail",
  "deviceDescription",
  "serialNumber",
  "problemType",
  "estimatedCost",
] as const;

export type RepairLabelTextFieldId = (typeof REPAIR_LABEL_TEXT_FIELD_IDS)[number];

export const REPAIR_LABEL_TEXT_FIELD_LABELS: Record<RepairLabelTextFieldId, string> = {
  reference: "Reference / ticket #",
  customerName: "Customer name",
  contactPhone: "Contact phone",
  contactEmail: "Contact email",
  deviceDescription: "Device",
  serialNumber: "IMEI / serial",
  problemType: "Problem / issue",
  estimatedCost: "Estimated cost",
};

const SALES_SET = new Set<string>(SALES_RECEIPT_SECTION_IDS);
const REPAIR_TICKET_SET = new Set<string>(REPAIR_TICKET_SECTION_IDS);
const LABEL_SET = new Set<string>(REPAIR_LABEL_TEXT_FIELD_IDS);

function normalizeOrder<T extends string>(input: string[] | null | undefined, defaults: readonly T[], allowed: Set<string>): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const id of input ?? []) {
    if (allowed.has(id) && !seen.has(id)) {
      out.push(id as T);
      seen.add(id);
    }
  }
  for (const id of defaults) {
    if (!seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  return out;
}

export function normalizeSalesReceiptSectionOrder(input?: string[] | null): SalesReceiptSectionId[] {
  const raw = Array.isArray(input) ? input : [];
  const hadReferenceQrInInput = raw.includes("reference_qr");
  let normalized = normalizeOrder(raw, SALES_RECEIPT_SECTION_IDS, SALES_SET);
  /** Legacy saved orders without this section: place QR right after Reference & date once. */
  if (!hadReferenceQrInInput) {
    const qr: SalesReceiptSectionId = "reference_qr";
    const base: SalesReceiptSectionId[] = normalized.filter((id) => id !== qr);
    const iRef = base.indexOf("ref_date");
    if (iRef !== -1) {
      base.splice(iRef + 1, 0, qr);
      normalized = base;
    }
  }
  return normalized;
}

export function normalizeRepairTicketSectionOrder(input?: string[] | null): RepairTicketSectionId[] {
  const arr = Array.isArray(input) ? input : [];
  const hadLogoInInput = arr.includes("rt_logo");
  const normalized = normalizeOrder(input, REPAIR_TICKET_SECTION_IDS, REPAIR_TICKET_SET);
  /** Legacy saved orders without rt_logo: append put logo last — move to top to match sale receipt. */
  if (!hadLogoInInput) {
    const rest = normalized.filter((id) => id !== "rt_logo");
    return ["rt_logo", ...rest];
  }
  return normalized;
}

export function normalizeRepairLabelTextFieldOrder(input?: string[] | null): RepairLabelTextFieldId[] {
  return normalizeOrder(input, REPAIR_LABEL_TEXT_FIELD_IDS, LABEL_SET);
}

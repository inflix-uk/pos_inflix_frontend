/** Active A4 invoice PDF layout (Settings → Notes & Terms). */

export type A4InvoiceTemplateId = "dispatch" | "business";

export const A4_INVOICE_TEMPLATE_OPTIONS: { id: A4InvoiceTemplateId; label: string; description: string }[] = [
 {
  id: "dispatch",
  label: "A4 dispatch / invoice (original)",
  description: "Full dispatch note with serial details, items summary, and existing layout.",
 },
 {
  id: "business",
  label: "Business invoice (A4)",
  description: "Professional invoice layout with bill-to block and line-item table.",
 },
];

export function normalizeA4InvoiceTemplate(value: unknown): A4InvoiceTemplateId {
 return value === "business" ? "business" : "dispatch";
}

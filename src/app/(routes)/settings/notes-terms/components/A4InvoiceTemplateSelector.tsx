"use client";

import React from "react";
import { FileStack, Briefcase } from "lucide-react";
import { A4_INVOICE_TEMPLATE_OPTIONS } from "@/lib/a4InvoiceTemplate";
import type { A4InvoiceTemplateId } from "@/lib/a4InvoiceTemplate";

export function A4InvoiceTemplateSelector({
 value,
 onChange,
}: {
 value: A4InvoiceTemplateId;
 onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
 return (
  <div className="mb-4 rounded-xl border-2 border-orange-200/80 bg-orange-50/40 p-4 shadow-sm">
   <label htmlFor="a4-invoice-template-select" className="mb-2 block text-sm font-bold text-gray-900">
    A4 invoice template (used everywhere)
   </label>
   <p className="mb-3 text-xs text-gray-600">
    Sales, wholesale, and downloads use this layout. Configure each template on its tab below — only the
    selected one is printed.
   </p>
   <select
    id="a4-invoice-template-select"
    name="a4InvoiceTemplate"
    value={value}
    onChange={onChange}
    className="block w-full max-w-xl rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-400/35"
   >
    {A4_INVOICE_TEMPLATE_OPTIONS.map((opt) => (
     <option key={opt.id} value={opt.id}>
      {opt.label}
     </option>
    ))}
   </select>
   <p className="mt-2 flex items-start gap-2 text-xs text-gray-600">
    {value === "dispatch" ? (
     <FileStack className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
    ) : (
     <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
    )}
    <span>{A4_INVOICE_TEMPLATE_OPTIONS.find((o) => o.id === value)?.description}</span>
   </p>
  </div>
 );
}

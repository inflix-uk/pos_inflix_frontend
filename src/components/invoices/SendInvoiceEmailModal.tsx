"use client";

import React from "react";
import { Loader2, Mail, Send, X } from "lucide-react";
import type { SendableInvoice } from "./SendInvoiceWhatsappModal";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

export default function SendInvoiceEmailModal({
 invoice,
 email,
 onEmailChange,
 loading,
 prefillLoading,
 onCancel,
 onSend,
}: {
 invoice: SendableInvoice;
 email: string;
 onEmailChange: (v: string) => void;
 loading: boolean;
 prefillLoading: boolean;
 onCancel: () => void;
 onSend: () => void;
}) {
 return (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
   <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
     <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
      <Mail className="w-4 h-4 text-blue-600" />
      Email invoice <span className="font-mono">{invoice.reference}</span>
     </h3>
     <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50"
     >
      <X className="w-4 h-4" />
     </button>
    </div>
    <form
     className="p-4 space-y-3 text-sm"
     onSubmit={(e) => {
      e.preventDefault();
      onSend();
     }}
    >
     <p className="text-gray-600">
      Sends the same A4 PDF as <strong>Download PDF</strong> to the recipient. SMTP must be configured under{" "}
      <strong>Settings → Email</strong>.
     </p>
     <label className="block">
      <span className="text-xs font-medium text-gray-600 uppercase">Recipient email</span>
      <div className="relative mt-1">
       <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
       <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        disabled={loading || prefillLoading}
        placeholder="customer@example.com"
        className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
       />
      </div>
      {prefillLoading && (
       <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Looking up customer email…
       </p>
      )}
     </label>
     <div className="text-xs text-gray-500">
      Customer: <span className="font-medium text-gray-800">{invoice.customerName || "—"}</span>
      {" · "}
      Total: <span className="font-medium text-gray-800">{formatMoney(invoice.total)}</span>
     </div>
    </form>
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50 rounded-b-xl">
     <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-white disabled:opacity-50"
     >
      Cancel
     </button>
     <button
      type="button"
      onClick={onSend}
      disabled={loading || prefillLoading || !email.trim()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
     >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {loading ? "Sending…" : "Send email"}
     </button>
    </div>
   </div>
  </div>
 );
}

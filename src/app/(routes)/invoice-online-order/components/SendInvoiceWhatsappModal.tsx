"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, MessageCircle, Phone, Send, X } from "lucide-react";
import type { InvoiceRecord } from "../service/invoicesApi";
import type { WhatsappStatus } from "../../settings/whatsapp/service/whatsappApi";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

/** Default caption — matches the backend default when no message is supplied. */
export function defaultInvoiceWhatsappMessage(invoice: InvoiceRecord): string {
 return `Invoice ${invoice.reference} for ${invoice.customerName || "Customer"}. Total: ${formatMoney(Number(invoice.total) || 0)}.`;
}

export default function SendInvoiceWhatsappModal({
 invoice,
 phone,
 onPhoneChange,
 message,
 onMessageChange,
 connection,
 loading,
 prefillLoading,
 onCancel,
 onSend,
}: {
 invoice: InvoiceRecord;
 phone: string;
 onPhoneChange: (v: string) => void;
 message: string;
 onMessageChange: (v: string) => void;
 /** null while the connection status is being checked */
 connection: WhatsappStatus | null;
 loading: boolean;
 prefillLoading: boolean;
 onCancel: () => void;
 onSend: () => void;
}) {
 const connected = connection === "connected";
 const canSend = connected && !loading && !prefillLoading && !!phone.trim();

 return (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
   <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
     <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
      <MessageCircle className="w-4 h-4 text-green-600" />
      WhatsApp invoice <span className="font-mono">{invoice.reference}</span>
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
      if (canSend) onSend();
     }}
    >
     {connection === null ? (
      <p className="text-xs text-gray-500 inline-flex items-center gap-1">
       <Loader2 className="w-3 h-3 animate-spin" />
       Checking WhatsApp connection…
      </p>
     ) : !connected ? (
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
       <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
       <span>
        {connection === "connecting"
         ? "WhatsApp is reconnecting — try again in a moment."
         : "WhatsApp isn't connected."}{" "}
        Connect it in{" "}
        <Link href="/settings/whatsapp" className="font-medium underline">
         Settings → WhatsApp
        </Link>
        .
       </span>
      </div>
     ) : (
      <p className="text-gray-600">
       Sends the same A4 PDF as <strong>Download PDF</strong> from your connected WhatsApp. Messages are queued and
       paced by the WhatsApp safety limits, so delivery can take a few minutes.
      </p>
     )}
     <label className="block">
      <span className="text-xs font-medium text-gray-600 uppercase">Customer WhatsApp number</span>
      <div className="relative mt-1">
       <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
       <input
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        required
        disabled={loading || prefillLoading}
        placeholder="+44 7700 900000"
        className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
       />
      </div>
      {prefillLoading ? (
       <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Looking up customer number…
       </p>
      ) : (
       <p className="text-xs text-gray-500 mt-1">Include the country code. Numbers starting with 0 are treated as UK numbers.</p>
      )}
     </label>
     <label className="block">
      <span className="text-xs font-medium text-gray-600 uppercase">Message</span>
      <textarea
       value={message}
       onChange={(e) => onMessageChange(e.target.value)}
       rows={3}
       maxLength={1000}
       disabled={loading}
       className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
      />
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
      disabled={!canSend}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
     >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {loading ? "Queuing…" : "Send on WhatsApp"}
     </button>
    </div>
   </div>
  </div>
 );
}

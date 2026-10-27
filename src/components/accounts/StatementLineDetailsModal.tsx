"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import type { StatementLineDetails } from "@/app/(routes)/accounts/service/accountsApi";

interface StatementLineDetailsModalProps {
 details: StatementLineDetails;
 formatDate: (d: string) => string;
 formatMoney: (n: number) => string;
 onClose: () => void;
}

/** Quick view of the items on an invoice or return, opened from a ledger line. */
export function StatementLineDetailsModal({ details, formatDate, formatMoney, onClose }: StatementLineDetailsModalProps) {
 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
 }, [onClose]);

 const isReturn = details.kind === "return";
 const title = `${isReturn ? "Return" : "Invoice"} ${details.reference || ""}`.trim();
 const showDiscount = details.discount > 0.004;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
   <div className="absolute inset-0 bg-black/40" onClick={onClose} />
   <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200/80 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between gap-4">
     <div className="min-w-0">
      <h3 className="text-lg font-semibold text-gray-900">
       {title}
       {details.status === "voided" && (
        <span className="ml-2 align-middle rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Voided</span>
       )}
      </h3>
      <p className="text-sm text-gray-500">
       {details.date ? formatDate(details.date) : null}
       {isReturn && details.linkedInvoiceRef ? ` · from invoice ${details.linkedInvoiceRef}` : null}
      </p>
     </div>
     <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 transition-colors"
     >
      <X className="h-5 w-5" />
     </button>
    </div>

    <div className="overflow-auto">
     <table className="w-full text-sm">
      <thead>
       <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
        <th className="py-2 px-4 text-left font-medium">Item</th>
        <th className="py-2 px-4 text-right font-medium">Qty</th>
        <th className="py-2 px-4 text-right font-medium">Price</th>
        <th className="py-2 px-4 text-right font-medium">Total</th>
       </tr>
      </thead>
      <tbody>
       {details.items.length === 0 ? (
        <tr>
         <td colSpan={4} className="py-6 text-center text-gray-500">No items.</td>
        </tr>
       ) : (
        details.items.map((it, i) => (
         <tr key={i} className="border-b border-gray-100 align-top">
          <td className="py-2 px-4 text-gray-900">
           <div>{it.name}</div>
           {it.serialNumbers?.length ? (
            <div className="text-xs text-gray-500 break-all">S/N {it.serialNumbers.join(", ")}</div>
           ) : null}
          </td>
          <td className="py-2 px-4 text-right tabular-nums">{it.quantity}</td>
          <td className="py-2 px-4 text-right tabular-nums whitespace-nowrap">{formatMoney(it.price)}</td>
          <td className="py-2 px-4 text-right tabular-nums whitespace-nowrap">{formatMoney(it.total)}</td>
         </tr>
        ))
       )}
      </tbody>
      <tfoot>
       {showDiscount && (
        <>
         <tr>
          <td colSpan={3} className="py-1.5 px-4 text-right text-gray-600">Subtotal</td>
          <td className="py-1.5 px-4 text-right tabular-nums">{formatMoney(details.subtotal)}</td>
         </tr>
         <tr>
          <td colSpan={3} className="py-1.5 px-4 text-right text-gray-600">Discount</td>
          <td className="py-1.5 px-4 text-right tabular-nums">−{formatMoney(details.discount)}</td>
         </tr>
        </>
       )}
       <tr className="border-t-2 border-gray-300 font-semibold">
        <td colSpan={3} className="py-2 px-4 text-right text-gray-900">{isReturn ? "Total returned" : "Total"}</td>
        <td className="py-2 px-4 text-right tabular-nums">{formatMoney(details.total)}</td>
       </tr>
      </tfoot>
     </table>
    </div>
   </div>
  </div>
 );
}

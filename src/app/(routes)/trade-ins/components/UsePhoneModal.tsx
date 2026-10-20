"use client";

import React, { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, Circle, Copy, Loader2, RefreshCw, Smartphone, X } from "lucide-react";
import { tradeInApi } from "../service/tradeInApi";
import type { TradeInFileKind } from "../types";

interface UsePhoneModalProps {
 open: boolean;
 onClose: () => void;
 tradeInId: string | null;
 /** What has arrived so far (from the page's polling) — shown as a live checklist. */
 received: Partial<Record<TradeInFileKind, boolean>>;
 termsAccepted: boolean;
 termsRequired: boolean;
}

function phonePageBase(): string {
 if (typeof window === "undefined") return "";
 const { protocol, origin } = window.location;
 if (protocol === "http:" || protocol === "https:") return origin;
 return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
}

export function UsePhoneModal({ open, onClose, tradeInId, received, termsAccepted, termsRequired }: UsePhoneModalProps) {
 const [qr, setQr] = useState<string | null>(null);
 const [link, setLink] = useState("");
 const [expiresAt, setExpiresAt] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [copied, setCopied] = useState(false);

 const makeLink = useCallback(async () => {
  if (!tradeInId) return;
  setLoading(true);
  setError(null);
  try {
   const { token, expiresAt: exp, tenantId } = await tradeInApi.createUploadLink(tradeInId);
   const base = phonePageBase();
   if (!base) throw new Error("Can't build a phone link from this app. Open the POS in a web browser instead.");
   const url = `${base}/trade-in-upload/${encodeURIComponent(token)}?t=${encodeURIComponent(tenantId)}`;
   setLink(url);
   setExpiresAt(exp);
   setQr(await QRCode.toDataURL(url, { width: 280, margin: 1, errorCorrectionLevel: "M" }));
  } catch (e) {
   setError(e instanceof Error ? e.message : "Could not create the phone link.");
  } finally {
   setLoading(false);
  }
 }, [tradeInId]);

 useEffect(() => {
  if (open) makeLink();
  else {
   setQr(null);
   setLink("");
   setCopied(false);
  }
 }, [open, makeLink]);

 if (!open) return null;

 const steps: { label: string; done: boolean; optional?: boolean }[] = [
  { label: "ID front photo", done: !!received.id_front, optional: true },
  { label: "ID back photo", done: !!received.id_back, optional: true },
  ...(termsRequired ? [{ label: "Terms accepted", done: termsAccepted }] : []),
  { label: "Customer signature", done: !!received.signature },
 ];

 const copy = async () => {
  try {
   await navigator.clipboard.writeText(link);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  } catch {
   /* clipboard blocked — the link is visible to copy by hand */
  }
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="use-phone-title">
   <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
     <h2 id="use-phone-title" className="flex items-center gap-2 text-base font-semibold text-gray-900">
      <Smartphone className="h-5 w-5 text-lime-700" />
      Use a phone for photos &amp; signature
     </h2>
     <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
      <X className="h-5 w-5" />
     </button>
    </div>

    <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
     <div className="flex flex-col items-center">
      <div className="flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
       {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
       ) : qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR code to open the upload page on a phone" className="h-[196px] w-[196px] rounded-lg" />
       ) : (
        <span className="px-4 text-center text-xs text-gray-500">No QR code</span>
       )}
      </div>
      <button
       type="button"
       onClick={makeLink}
       disabled={loading}
       className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
      >
       <RefreshCw className="h-3.5 w-3.5" />
       New QR code
      </button>
     </div>

     <div className="min-w-0 space-y-3 text-sm">
      <ol className="list-decimal space-y-1 pl-4 text-gray-700">
       <li>Open the phone camera and scan the code.</li>
       <li>Take the ID photos, then let the customer read the terms and sign.</li>
       <li>Everything appears on this screen by itself.</li>
      </ol>
      {expiresAt && (
       <p className="text-xs text-gray-500">
        This code works for 30 minutes (until{" "}
        {new Date(expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}).
       </p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <ul className="space-y-1.5 rounded-xl bg-gray-50 p-3">
       {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-xs">
         {s.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
         <span className={s.done ? "text-gray-900" : "text-gray-500"}>
          {s.label}
          {s.optional ? " (optional)" : ""}
         </span>
        </li>
       ))}
      </ul>
      {link && (
       <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
       >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Link copied" : "Copy link instead"}
       </button>
      )}
     </div>
    </div>

    <div className="flex justify-end border-t border-gray-200 px-5 py-3">
     <button
      type="button"
      onClick={onClose}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
     >
      Done
     </button>
    </div>
   </div>
  </div>
 );
}

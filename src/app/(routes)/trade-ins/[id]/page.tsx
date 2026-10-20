"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Loader2, Printer, Smartphone } from "lucide-react";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { openTradeInPdf, downloadTradeInPdf } from "@/lib/tradeInPdf";
import { usePermissions } from "@/hooks/usePermissions";
import { tradeInApi } from "../service/tradeInApi";
import { FILE_LABELS, PAYOUT_LABELS, type TradeIn, type TradeInFileWithData, type TradeInMeta } from "../types";

const money = (n: number) => `£${(Number(n) || 0).toFixed(2)}`;

export default function TradeInDetailPage() {
 const params = useParams<{ id: string }>();
 const id = String(params?.id || "");
 const searchParams = useSearchParams();
 const justCreated = searchParams.get("created") === "1";
 const { can } = usePermissions();

 const [tradeIn, setTradeIn] = useState<TradeIn | null>(null);
 const [files, setFiles] = useState<TradeInFileWithData[]>([]);
 const [meta, setMeta] = useState<TradeInMeta | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  if (!id) return;
  let cancelled = false;
  (async () => {
   try {
    const [t, f, m] = await Promise.all([
     tradeInApi.get(id),
     tradeInApi.getFiles(id),
     tradeInApi.meta().catch(() => null),
    ]);
    if (cancelled) return;
    setTradeIn(t);
    setFiles(f);
    setMeta(m);
   } catch (e) {
    if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this trade-in.");
   } finally {
    if (!cancelled) setLoading(false);
   }
  })();
  return () => {
   cancelled = true;
  };
 }, [id]);

 const pdfInput = tradeIn ? { tradeIn, files, meta, location: tradeIn.location ?? null } : null;
 const fileOf = (kind: string) => files.find((f) => f.kind === kind);
 const staff = tradeIn && tradeIn.completedBy && typeof tradeIn.completedBy === "object" ? tradeIn.completedBy.name : "";

 if (loading) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
   </div>
  );
 }

 if (error || !tradeIn) {
  return (
   <div className="min-h-screen bg-gray-50 p-6">
    <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
     {error || "Trade-in not found."}{" "}
     <Link href="/trade-ins" className="font-medium underline">
      Back to trade-ins
     </Link>
    </div>
   </div>
  );
 }

 if (tradeIn.status !== "completed") {
  return (
   <div className="min-h-screen bg-gray-50 p-6">
    <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
     This trade-in hasn&apos;t been completed yet.{" "}
     <Link href={`/trade-ins/new?draft=${tradeIn._id}`} className="font-medium underline">
      Continue it
     </Link>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gray-50 p-6">
   <div className="mx-auto max-w-5xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div className="flex items-center gap-3">
      <Link href="/trade-ins" className="rounded-lg p-2 text-gray-600 hover:bg-white" aria-label="Back to trade-ins">
       <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
       <h1 className="text-xl font-semibold text-gray-900">Trade-in {tradeIn.reference}</h1>
       <p className="text-sm text-gray-500">
        {formatDateTimeLondon(tradeIn.completedAt)}
        {staff ? ` · by ${staff}` : ""}
       </p>
      </div>
     </div>
     <div className="flex flex-wrap gap-2">
      <button
       type="button"
       onClick={() => pdfInput && openTradeInPdf(pdfInput)}
       className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
       <Printer className="h-4 w-4" /> Print PDF
      </button>
      <button
       type="button"
       onClick={() => pdfInput && downloadTradeInPdf(pdfInput)}
       className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
       <Download className="h-4 w-4" /> Download
      </button>
     </div>
    </div>

    {justCreated && (
     <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      <CheckCircle2 className="h-5 w-5" />
      Trade-in completed. {tradeIn.totalUnits} item{tradeIn.totalUnits === 1 ? "" : "s"} added to stock — pay the customer{" "}
      <strong>{money(tradeIn.totalAmount)}</strong> by {PAYOUT_LABELS[tradeIn.payoutMethod] || tradeIn.payoutMethod}.
     </div>
    )}

    <div className="grid gap-4 md:grid-cols-3">
     <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</h2>
      <p className="font-medium text-gray-900">{tradeIn.customer.name}</p>
      <p className="text-sm text-gray-700">{tradeIn.customer.phone}</p>
      {tradeIn.customer.email && <p className="text-sm text-gray-700">{tradeIn.customer.email}</p>}
      {tradeIn.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{tradeIn.notes}</p>}
     </div>
     <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Paid to customer</h2>
      <p className="text-2xl font-semibold text-gray-900">{money(tradeIn.totalAmount)}</p>
      <p className="text-sm text-gray-700">by {PAYOUT_LABELS[tradeIn.payoutMethod] || tradeIn.payoutMethod}</p>
     </div>
     <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">In stock as</h2>
      <p className="font-medium text-gray-900">{tradeIn.purchaseNumber || "—"}</p>
      <p className="text-sm text-gray-700">Supplier account: Trade-in</p>
      {tradeIn.purchaseId && can("purchase.view") && (
       <Link
        href={`/purchases/view/${tradeIn.purchaseId}`}
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
       >
        Open purchase <ExternalLink className="h-3.5 w-3.5" />
       </Link>
      )}
     </div>
    </div>

    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
     <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
       <tr>
        <th className="px-4 py-2">Device</th>
        <th className="px-4 py-2">IMEI / Serial</th>
        <th className="px-4 py-2">Condition</th>
        <th className="px-4 py-2">Location</th>
        <th className="px-4 py-2 text-right">Paid</th>
        <th className="px-4 py-2 text-right">Sale price</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
       {tradeIn.items.map((it, i) => {
        const qty = it.isOtherItem ? it.quantity || 0 : it.imeis.length || 1;
        return (
         <tr key={i} className="align-top">
          <td className="px-4 py-2">
           <div className="font-medium text-gray-900">{it.description}</div>
           <div className="text-xs text-gray-500">{[it.grade && `Grade ${it.grade}`, it.category].filter(Boolean).join(" · ")}</div>
          </td>
          <td className="px-4 py-2 font-mono text-xs text-gray-800">
           {it.isOtherItem ? `${it.barcode ? `${it.barcode} · ` : ""}Qty ${it.quantity}` : it.imeis.map((s) => <div key={s}>{s}</div>)}
          </td>
          <td className="px-4 py-2 text-gray-700">{it.note || "—"}</td>
          <td className="px-4 py-2 text-gray-700">{it.locationName || "—"}</td>
          <td className="px-4 py-2 text-right text-gray-900">
           {money(it.purchasePrice * qty)}
           {qty > 1 && <div className="text-xs text-gray-500">{qty} × {money(it.purchasePrice)}</div>}
          </td>
          <td className="px-4 py-2 text-right text-gray-700">{money(it.salePrice)}</td>
         </tr>
        );
       })}
      </tbody>
     </table>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
     <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Terms &amp; signature</h2>
      {tradeIn.termsText ? (
       <>
        <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-700">{tradeIn.termsText}</div>
        {tradeIn.termsAccepted && (
         <p className="mt-2 flex items-center gap-1 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accepted {tradeIn.termsAcceptedVia === "phone" ? "on phone" : "in store"} · {formatDateTimeLondon(tradeIn.termsAcceptedAt)}
         </p>
        )}
       </>
      ) : (
       <p className="text-xs text-gray-500">No terms were set for this trade-in.</p>
      )}
      {fileOf("signature")?.dataUrl && (
       // eslint-disable-next-line @next/next/no-img-element
       <img src={fileOf("signature")!.dataUrl!} alt="Customer signature" className="mt-3 h-24 w-full rounded border border-gray-100 object-contain" />
      )}
     </div>
     <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">ID document</h2>
      {fileOf("id_front") || fileOf("id_back") ? (
       <div className="grid grid-cols-2 gap-3">
        {(["id_front", "id_back"] as const).map((k) => {
         const f = fileOf(k);
         return f?.dataUrl ? (
          <figure key={k}>
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={f.dataUrl} alt={FILE_LABELS[k]} className="aspect-[3/2] w-full rounded border border-gray-200 bg-gray-50 object-contain" />
           <figcaption className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            {FILE_LABELS[k]}
            {f.uploadedVia === "phone" && <Smartphone className="h-3 w-3" />}
           </figcaption>
          </figure>
         ) : null;
        })}
       </div>
      ) : (
       <p className="text-xs text-gray-500">No ID photos were added.</p>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}

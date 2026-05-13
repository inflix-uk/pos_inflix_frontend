"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { repairApi } from "../service/repairApi";
import { repairToForPrint } from "../lib/repairToForPrint";
import {
 getInvoiceSettings,
 buildRepairTicket80mmPdf,
 repairLabelSilentOrBrowserObjectUrl,
 fetchLocationHeaderById,
} from "@/lib/invoicePrint";

export default function RepairPrintPage() {
 const searchParams = useSearchParams();
 const type = searchParams.get("type") ?? "ticket";
 const id = searchParams.get("id");
 const [pdfUrl, setPdfUrl] = useState<string | null>(null);
 const [silentLabelSent, setSilentLabelSent] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);
 const iframeRef = useRef<HTMLIFrameElement>(null);
 const hasTriggeredPrint = useRef(false);

 useEffect(() => {
 document.title = type === "label" ? "Repair label print" : "Repair ticket print";
 return () => {
 document.title = "Repairs";
 };
 }, [type]);

 useEffect(() => {
 if (!id) {
 setError("Missing repair ID");
 setLoading(false);
 return;
 }
 let cancelled = false;
 setPdfUrl((prev) => {
 if (prev) URL.revokeObjectURL(prev);
 return null;
 });
 setSilentLabelSent(false);
 hasTriggeredPrint.current = false;
 setError(null);
 setLoading(true);
 (async () => {
 try {
 const res = await repairApi.getById(id);
 if (cancelled) return;
 if (!res.success || !res.data) {
  setError("Repair not found");
  setLoading(false);
  return;
 }
 const repair = res.data;
 const forPrint = repairToForPrint(repair);
 if (type === "label") {
  if (cancelled) return;
  const out = await repairLabelSilentOrBrowserObjectUrl(forPrint);
  if (cancelled) {
  if (out.kind === "preview") URL.revokeObjectURL(out.objectUrl);
  return;
  }
  if (out.kind === "silent") {
  setPdfUrl(null);
  setSilentLabelSent(true);
  setLoading(false);
  return;
  }
  setPdfUrl(out.objectUrl);
 } else {
  const [settings, location] = await Promise.all([
  getInvoiceSettings(),
  fetchLocationHeaderById(forPrint.locationId),
  ]);
  if (cancelled) return;
  const url = await buildRepairTicket80mmPdf(forPrint, settings, location);
  if (cancelled) {
  URL.revokeObjectURL(url);
  return;
  }
  setPdfUrl(url);
 }
 } catch (e) {
 if (!cancelled) {
  setError(e instanceof Error ? e.message : "Failed to load print");
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [id, type]);

 useEffect(() => {
 if (!pdfUrl || silentLabelSent || !iframeRef.current || hasTriggeredPrint.current) return;
 const iframe = iframeRef.current;
 const onLoad = () => {
 if (hasTriggeredPrint.current) return;
 hasTriggeredPrint.current = true;
 try {
 iframe.contentWindow?.focus();
 iframe.contentWindow?.print();
 } catch {
 window.print();
 }
 };
 iframe.addEventListener("load", onLoad);
 if (iframe.contentDocument?.readyState === "complete") {
 onLoad();
 }
 return () => iframe.removeEventListener("load", onLoad);
 }, [pdfUrl, silentLabelSent]);

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-100">
 <p className="text-gray-600">Preparing print…</p>
 </div>
 );
 }

 if (silentLabelSent) {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-100 px-6 text-center">
 <p className="text-gray-900 font-medium">Label sent to your label printer (silent print).</p>
 <p className="text-sm text-gray-600 max-w-md">
  If nothing printed, open Settings → Printing: enable silent printing, set the agent token, choose your DYMO under
  Label printer, then try again — the tab will fall back to the browser print dialog when silent print is off or
  unavailable.
 </p>
 <button
  type="button"
  onClick={() => window.close()}
  className="mt-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 print:hidden"
 >
  Close window
 </button>
 </div>
 );
 }

 if (error) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-100">
 <p className="text-red-600">{error}</p>
 </div>
 );
 }

 const handlePrint = () => {
 try {
 if (iframeRef.current?.contentWindow) {
 iframeRef.current.contentWindow.focus();
 iframeRef.current.contentWindow.print();
 } else {
 window.print();
 }
 } catch {
 window.print();
 }
 };

 return (
 <div className="fixed inset-0 flex flex-col bg-white">
 <div className="flex-shrink-0 flex items-center justify-end gap-2 p-2 bg-gray-100 border-b print:hidden">
 <button
  type="button"
  onClick={handlePrint}
  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
 >
  Print
 </button>
 </div>
 <iframe
 ref={iframeRef}
 src={pdfUrl ?? undefined}
 title="Repair print"
 className="flex-1 w-full border-0"
 />
 </div>
 );
}

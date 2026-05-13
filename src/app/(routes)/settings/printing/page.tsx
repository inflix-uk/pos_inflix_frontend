"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
 getPrintingSettings,
 updatePrintingSettings,
 type PrintingSettingsData,
} from "./service/printingSettingsApi";
import { getDeviceId, invalidatePrintingSettingsCache } from "@/services/printService";

const AGENT_TOKEN_KEY = "pos_print_agent_token";

/** Same-origin proxy avoids browser CORS (localhost:3001 → 127.0.0.1:9123 is cross-origin). */
function fetchStatus(agentUrl: string): Promise<{ tokenPresent?: boolean; token?: string } | null> {
 const q = encodeURIComponent(agentUrl.replace(/\/$/, ""));
 return fetch(`/api/print-agent/status?agentBase=${q}`, { method: "GET", signal: AbortSignal.timeout(8000) })
 .then((r) => (r.ok ? r.json() : null))
 .catch(() => null);
}

export default function PrintingSettingsPage() {
 const { can, loading: permLoading } = usePermissions();
 const canManage = can("settings.manage");
 const canView = can("settings.view");

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 const [enabled, setEnabled] = useState(false);
 const [agentUrl, setAgentUrl] = useState("http://127.0.0.1:9123");
 const [agentToken, setAgentToken] = useState("");
 const [receiptPrinterName, setReceiptPrinterName] = useState("");
 const [labelPrinterName, setLabelPrinterName] = useState("");
 const [a4PrinterName, setA4PrinterName] = useState("");

 const [printers, setPrinters] = useState<string[]>([]);
 const [printersLoading, setPrintersLoading] = useState(false);
 const [agentReachable, setAgentReachable] = useState<boolean | null>(null);
 const [tokenNotPaired, setTokenNotPaired] = useState(false);

 const deviceId = getDeviceId();

 const loadSettings = useCallback(async () => {
 if (!canView) return;
 setLoading(true);
 try {
 const res = await getPrintingSettings(deviceId);
 if (res.success && res.data) {
 const d = res.data;
 setEnabled(!!d.silentPrintingEnabled);
 setAgentUrl(d.agentUrl || "http://127.0.0.1:9123");
 setReceiptPrinterName(d.receiptPrinterName || "");
 setLabelPrinterName(d.labelPrinterName || "");
 setA4PrinterName(d.a4PrinterName || "");
 const stored = typeof window !== "undefined" ? localStorage.getItem(AGENT_TOKEN_KEY) : null;
 setAgentToken(stored || "");
 }
 } finally {
 setLoading(false);
 }
 }, [canView, deviceId]);

 useEffect(() => {
 loadSettings();
 }, [loadSettings]);

 const loadPrinters = useCallback(async () => {
 const token = agentToken || (typeof window !== "undefined" ? localStorage.getItem(AGENT_TOKEN_KEY) : null) || "";
 setPrintersLoading(true);
 setAgentReachable(null);
 setTokenNotPaired(false);
 try {
 const status = await fetchStatus(agentUrl);
 if (!status) {
 setAgentReachable(false);
 setPrinters([]);
 return;
 }
 setAgentReachable(true);
 if (status.tokenPresent && !token) {
 setTokenNotPaired(true);
 setPrinters([]);
 return;
 }
 const printersRes = await fetch(
 `/api/print-agent/printers?agentBase=${encodeURIComponent(agentUrl.replace(/\/$/, ""))}`,
 {
  method: "GET",
  headers: token ? { "X-Print-Token": token } : {},
  signal: AbortSignal.timeout(8000),
 }
 );
 if (printersRes.status === 401) {
 setTokenNotPaired(true);
 setPrinters([]);
 return;
 }
 const j = await printersRes.json().catch(() => ({}));
 setPrinters(Array.isArray(j.printers) ? j.printers : []);
 } catch {
 setAgentReachable(false);
 setPrinters([]);
 } finally {
 setPrintersLoading(false);
 }
 }, [agentUrl, agentToken]);

 useEffect(() => {
 if (!agentUrl.trim()) return;
 loadPrinters();
 }, [agentUrl, agentToken]);

 const handleSave = async () => {
 if (!canManage) return;
 setSaving(true);
 setMessage(null);
 try {
 if (agentToken) {
 if (typeof window !== "undefined") localStorage.setItem(AGENT_TOKEN_KEY, agentToken);
 }
 const payload: Parameters<typeof updatePrintingSettings>[1] = {
 silentPrintingEnabled: enabled,
 agentUrl: agentUrl.trim() || "http://127.0.0.1:9123",
 receiptPrinterName: receiptPrinterName.trim(),
 labelPrinterName: labelPrinterName.trim(),
 a4PrinterName: a4PrinterName.trim(),
 };
 if (agentToken !== undefined) payload.agentToken = agentToken;
 const res = await updatePrintingSettings(deviceId, payload);
 if (res.success) {
 invalidatePrintingSettingsCache();
 setMessage({ type: "success", text: "Printing settings saved." });
 setTimeout(() => setMessage(null), 3000);
 } else {
 setMessage({ type: "error", text: res.message || "Failed to save." });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to save." });
 } finally {
 setSaving(false);
 }
 };

 if (permLoading || !canView) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {!canView && <p className="text-gray-600">You do not have permission to view settings.</p>}
 {permLoading && canView && (
  <div className="flex items-center gap-2 text-gray-600">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
 )}
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="mb-6">
 <Link
  href="/settings"
  className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 text-sm mb-4"
 >
  <ArrowLeft className="h-4 w-4" />
  Back to Settings
 </Link>
 <div className="flex items-center gap-3">
  <div className="p-2 bg-orange-100 rounded-lg">
  <Printer className="h-6 w-6 text-orange-600" />
  </div>
  <div>
  <h1 className="text-2xl font-semibold text-gray-800">Printing</h1>
  <p className="text-gray-500 text-sm mt-1">
  Silent printing (receipt + labels) via local print agent. Per-device.
  </p>
  </div>
 </div>
 </div>

 {message && (
 <div
  className={`mb-4 px-4 py-3 rounded-lg text-sm ${
  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="max-w-xl bg-white rounded-lg shadow-sm border border-gray-200 p-6">
 {loading ? (
  <div className="flex items-center gap-2 text-gray-500 py-4">
  <Loader2 className="h-5 w-5 animate-spin" /> Loading settings…
  </div>
 ) : (
  <div className="space-y-5">
  <div className="flex items-center justify-between gap-4">
  <div>
  <p className="font-medium text-gray-800">Enable Silent Printing</p>
  <p className="text-sm text-gray-500 mt-0.5">
   When on, receipt and label print buttons send to the agent (no browser dialog). When off, use normal browser print.
  </p>
  </div>
  <button
  type="button"
  role="switch"
  aria-checked={enabled}
  disabled={!canManage}
  onClick={() => canManage && setEnabled((e) => !e)}
  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
   enabled ? "bg-orange-500" : "bg-gray-200"
  }`}
  >
  <span
   className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
   enabled ? "translate-x-5" : "translate-x-1"
   }`}
  />
  </button>
  </div>

  {!enabled && (
  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
  Disabled — Receipt and label printing will use the current browser/flow.
  </p>
  )}

  <p className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-neutral-200">
  Install POS Print Bridge on this PC (one-click installer), then click <strong>Refresh printers</strong> to test
  the connection. The app checks the agent through the Next.js server so the browser does not block the link to
  127.0.0.1 (CORS).
  </p>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Print Agent URL</label>
  <input
  type="url"
  value={agentUrl}
  onChange={(e) => setAgentUrl(e.target.value)}
  disabled={!canManage}
  placeholder="http://127.0.0.1:9123"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Print Agent Token (X-Print-Token)</label>
  <input
  type="password"
  value={agentToken}
  onChange={(e) => setAgentToken(e.target.value)}
  disabled={!canManage}
  placeholder="Optional; set if agent requires token"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
  />
  </div>

  {tokenNotPaired && (
  <p className="text-sm text-neutral-800 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
  Token not paired. Open{" "}
  <a href="http://127.0.0.1:9123/status" target="_blank" rel="noopener noreferrer" className="font-medium underline text-neutral-900 hover:text-neutral-700">
   Print Bridge Status
  </a>{" "}
  to copy the token, then paste it above and Save.
  </p>
  )}

  <div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">Agent:</span>
  {printersLoading ? (
  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
  ) : agentReachable === true ? (
  <span className="text-sm text-green-600">Reachable</span>
  ) : agentReachable === false ? (
  <span className="text-sm text-neutral-600">Not reachable</span>
  ) : null}
  <button
  type="button"
  onClick={loadPrinters}
  disabled={printersLoading || !agentUrl.trim()}
  className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50"
  >
  <RefreshCw className="h-4 w-4" /> Refresh printers
  </button>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Printer (ESC/POS)</label>
  <select
  value={receiptPrinterName}
  onChange={(e) => setReceiptPrinterName(e.target.value)}
  disabled={!canManage}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
  >
  <option value="">— Select printer —</option>
  {printers.map((name) => (
   <option key={name} value={name}>
   {name}
   </option>
  ))}
  </select>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Label Printer (e.g. DYMO)</label>
  <select
  value={labelPrinterName}
  onChange={(e) => setLabelPrinterName(e.target.value)}
  disabled={!canManage}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
  >
  <option value="">— Select printer —</option>
  {printers.map((name) => (
   <option key={name} value={name}>
   {name}
   </option>
  ))}
  </select>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">A4 Printer (optional, for invoice)</label>
  <select
  value={a4PrinterName}
  onChange={(e) => setA4PrinterName(e.target.value)}
  disabled={!canManage}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
  >
  <option value="">— None —</option>
  {printers.map((name) => (
   <option key={name} value={name}>
   {name}
   </option>
  ))}
  </select>
  </div>

  {canManage && (
  <div className="pt-2">
  <button
   type="button"
   onClick={handleSave}
   disabled={saving}
   className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
   {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Save
  </button>
  </div>
  )}
  </div>
 )}
 </div>
 </div>
 );
}

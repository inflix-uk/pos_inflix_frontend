"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Send } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
 getPrintingSettings,
 updatePrintingSettings,
 type PrintingSettingsData,
} from "./service/printingSettingsApi";
import {
  checkPrintAgentReachable,
  fetchPrintAgent,
} from "@/lib/printAgentClient";
import { getDeviceId, invalidatePrintingSettingsCache } from "@/services/printService";

const AGENT_TOKEN_KEY = "pos_print_agent_token";

function isLoopbackUrl(raw: string): boolean {
 try {
  const u = new URL(raw.trim().replace(/\/+$/, ""));
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
 } catch {
  return false;
 }
}

/** Build minimal ESC/POS test payload: init + text lines + feed + cut. Returns base64. */
function buildEscposTestPayload(): string {
 const ESC = 0x1b;
 const GS = 0x1d;
 const text = "POS PRINT BRIDGE\nTEST PRINT OK\n\nIf you see this,\nsilent printing works.\n\n\n";
 const textBytes = new TextEncoder().encode(text);
 const bytes = new Uint8Array(2 + textBytes.length + 3);
 let i = 0;
 bytes[i++] = ESC;
 bytes[i++] = 0x40; // ESC @ init
 bytes.set(textBytes, i);
 i += textBytes.length;
 bytes[i++] = GS;
 bytes[i++] = 0x56;
 bytes[i++] = 0x00; // GS V 0 — full cut
 let bin = "";
 for (let j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
 return btoa(bin);
}

/** Browser → Print Bridge (direct, or same-origin proxy if CORS blocks). */
async function fetchStatus(
 agentUrl: string
): Promise<{ tokenPresent?: boolean; token?: string } | null> {
 try {
  const r = await fetchPrintAgent(agentUrl, "GET", "/status", { timeoutMs: 8000 });
  return r.ok ? ((await r.json()) as { tokenPresent?: boolean; token?: string }) : null;
 } catch {
  return null;
 }
}

export default function PrintingSettingsPage() {
 const { can, loading: permLoading } = usePermissions();
 const canManage = can("settings.printing") || can("settings.manage");
 const canView = can("settings.view") || can("settings.printing") || can("settings.manage");

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
 const [testing, setTesting] = useState(false);
 const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

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
 const healthy = await checkPrintAgentReachable(agentUrl, token || undefined);
 if (!healthy) {
 setAgentReachable(false);
 setPrinters([]);
 return;
 }
 setAgentReachable(true);
 const status = await fetchStatus(agentUrl);
 if (status?.tokenPresent && !token) {
 setTokenNotPaired(true);
 setPrinters([]);
 return;
 }
 const printersRes = await fetchPrintAgent(agentUrl, "GET", "/printers", {
  token: token || undefined,
  timeoutMs: 8000,
 });
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

 const handleTestReceipt = async () => {
 setTesting(true);
 setTestResult(null);
 try {
  const token = agentToken || (typeof window !== "undefined" ? localStorage.getItem(AGENT_TOKEN_KEY) || "" : "");
  if (!isLoopbackUrl(agentUrl)) {
  setTestResult({ ok: false, text: "Agent URL must be http://127.0.0.1:PORT or http://localhost:PORT." });
  return;
  }
  if (!receiptPrinterName.trim()) {
  setTestResult({ ok: false, text: "Select a Receipt printer first." });
  return;
  }
  const res = await fetchPrintAgent(agentUrl, "POST", "/print/receipt/escpos", {
   token: token || undefined,
   timeoutMs: 15000,
   jsonBody: {
    printerName: receiptPrinterName.trim(),
    dataBase64: buildEscposTestPayload(),
    jobName: "print-bridge-test",
   },
  });
  const j = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
  if (res.ok && j.success) {
  setTestResult({ ok: true, text: "Test sent. Check the receipt printer." });
  } else if (res.status === 401) {
  setTestResult({ ok: false, text: "Agent token invalid. Copy it from Print Bridge Status and Save." });
  } else {
  setTestResult({ ok: false, text: j.message || `Agent error (${res.status}). Check printer name.` });
  }
 } catch (e) {
  const msg = e instanceof Error ? e.message : "Test print failed.";
  setTestResult({
  ok: false,
  text: msg.includes("fetch") || msg.includes("Failed to fetch")
   ? "Cannot reach Print Bridge from the browser. Is Print Bridge running on this PC, and does it allow CORS for this site?"
   : msg,
  });
 } finally {
  setTesting(false);
 }
 };

 const diagnostics = useMemo(() => {
 const token = agentToken || (typeof window !== "undefined" ? localStorage.getItem(AGENT_TOKEN_KEY) || "" : "");
 return [
  {
  label: "Silent printing toggle is ON",
  ok: enabled,
  hint: "Turn on the toggle above.",
  },
  {
  label: "Agent URL is loopback (127.0.0.1 / localhost)",
  ok: isLoopbackUrl(agentUrl),
  hint: "LAN IPs are blocked by the proxy. Use http://127.0.0.1:9123.",
  },
  {
  label: "Print Bridge is reachable from this browser",
  ok: agentReachable === true,
  hint:
   typeof window !== "undefined"
    ? `Install/start POS Print Bridge on this PC. If http://127.0.0.1:9123/status works in a tab but this fails, add "${window.location.origin}" to corsOrigin in %ProgramData%\\PosPrintAgent\\config.json and restart Print Bridge.`
    : "Install/start POS Print Bridge on this PC.",
  },
  {
  label: "Agent token is present on this device",
  ok: !!token.trim(),
  hint: "Open http://127.0.0.1:9123/status, copy the token, paste above and Save.",
  },
  {
  label: "Agent token is paired (no 401)",
  ok: !tokenNotPaired,
  hint: "The token does not match this Print Bridge install. Re-copy and Save.",
  },
  {
  label: "Receipt printer selected",
  ok: !!receiptPrinterName.trim(),
  hint: "Pick the receipt printer below.",
  },
  {
  label: "Label printer selected",
  ok: !!labelPrinterName.trim(),
  hint: "Pick the label printer below (e.g. DYMO).",
  },
 ];
 }, [enabled, agentUrl, agentReachable, agentToken, tokenNotPaired, receiptPrinterName, labelPrinterName]);

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
  the connection. The browser talks to Print Bridge directly at 127.0.0.1 (Chrome treats loopback as a secure
  origin even from HTTPS). Print Bridge must allow this site&apos;s origin via CORS.
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

  <div className="border-t border-gray-200 pt-4">
  <div className="flex items-center justify-between mb-3">
  <p className="font-medium text-gray-800">Silent Print Diagnostics</p>
  <button
   type="button"
   onClick={handleTestReceipt}
   disabled={testing || !receiptPrinterName.trim()}
   className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
   title="Sends a small ESC/POS test job to the selected receipt printer"
  >
   {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
   Send Test Receipt
  </button>
  </div>

  <ul className="space-y-1.5">
  {diagnostics.map((d) => (
   <li key={d.label} className="flex items-start gap-2 text-sm">
   {d.ok ? (
   <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
   ) : (
   <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
   )}
   <div>
   <span className={d.ok ? "text-gray-700" : "text-gray-900 font-medium"}>{d.label}</span>
   {!d.ok && <span className="text-gray-500"> — {d.hint}</span>}
   </div>
   </li>
  ))}
  </ul>

  {testResult && (
  <div
   className={`mt-3 px-3 py-2 rounded-lg text-sm flex items-start gap-2 ${
   testResult.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
   }`}
  >
   <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
   <span>{testResult.text}</span>
  </div>
  )}
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

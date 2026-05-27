"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Loader2, QrCode, LogOut, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { whatsappApi, type WhatsappStatePayload } from "./service/whatsappApi";

function normalizePhone(raw: string): string | null {
 const trimmed = (raw || "").trim();
 if (!trimmed) return null;
 if (trimmed.startsWith("+")) {
  const digits = trimmed.slice(1).replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
 }
 const digits = trimmed.replace(/\D/g, "");
 if (digits.startsWith("00")) {
  const intl = digits.slice(2);
  return intl.length >= 8 ? intl : null;
 }
 return digits.length >= 8 ? digits : null;
}

export default function WhatsappSettingsPage() {
 const [state, setState] = useState<WhatsappStatePayload>({ status: "disconnected", qrDataUrl: null, jid: null });
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [phone, setPhone] = useState("");
 const [sendMsg, setSendMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const [sending, setSending] = useState(false);
 const [waLinkMode, setWaLinkMode] = useState(false);
 const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

 const refresh = useCallback(async () => {
  try {
   const s = await whatsappApi.getStatus();
   setState(s);
   setError(s.lastError || null);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to read status");
  }
 }, []);

 useEffect(() => {
  refresh();
 }, [refresh]);

 useEffect(() => {
  if (state.status === "qr" || state.status === "connecting") {
   if (pollRef.current) clearInterval(pollRef.current);
   pollRef.current = setInterval(refresh, 2000);
   return () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
   };
  }
  if (pollRef.current) {
   clearInterval(pollRef.current);
   pollRef.current = null;
  }
 }, [state.status, refresh]);

 const handleStart = async () => {
  setBusy(true);
  setError(null);
  try {
   const s = await whatsappApi.start();
   setState(s);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to start session");
  } finally {
   setBusy(false);
  }
 };

 const handleLogout = async () => {
  setBusy(true);
  setError(null);
  try {
   await whatsappApi.logout();
   setState({ status: "disconnected", qrDataUrl: null, jid: null });
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to logout");
  } finally {
   setBusy(false);
  }
 };

 const handleSend = async () => {
  setSendMsg(null);
  const e164 = normalizePhone(phone);
  if (!e164) {
   setSendMsg({ type: "error", text: "Enter the full number with country code, e.g. +447700900000." });
   return;
  }
  if (waLinkMode || state.status !== "connected") {
   const url = `https://wa.me/${e164}?text=${encodeURIComponent("Test message from your POS.")}`;
   if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
   setSendMsg({ type: "success", text: "Opened WhatsApp Web in a new tab." });
   return;
  }
  setSending(true);
  try {
   const out = await whatsappApi.send(e164, "Test message from your POS — WhatsApp gateway is working.");
   setSendMsg({ type: "success", text: `Sent to ${out.sentTo.split("@")[0]}.` });
  } catch (e) {
   setSendMsg({ type: "error", text: e instanceof Error ? e.message : "Send failed" });
  } finally {
   setSending(false);
  }
 };

 const statusBadge = (() => {
  const map: Record<WhatsappStatePayload["status"], { label: string; cls: string; icon: React.ReactNode }> = {
   disconnected: {
    label: "Disconnected",
    cls: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
   },
   connecting: {
    label: "Connecting…",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
   },
   qr: {
    label: "Waiting for scan",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <QrCode className="h-3.5 w-3.5" />,
   },
   connected: {
    label: "Connected",
    cls: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
   },
  };
  const m = map[state.status];
  return (
   <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${m.cls}`}>
    {m.icon}
    {m.label}
   </span>
  );
 })();

 return (
  <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
   <div className="mb-3 @[768px]:mb-4">
    <Link
     href="/settings"
     className="inline-flex items-center gap-1 text-xs @[768px]:text-sm font-medium text-gray-600 hover:text-gray-900"
    >
     <ArrowLeft className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4" /> Back to Settings
    </Link>
   </div>

   <header className="mb-4 @[768px]:mb-6 flex items-start gap-3">
    <div className="p-2 bg-green-100 rounded-lg">
     <MessageCircle className="h-5 w-5 @[768px]:h-6 @[768px]:w-6 text-green-600" />
    </div>
    <div className="flex-1 min-w-0">
     <h1 className="text-xl @[768px]:text-2xl font-semibold text-gray-800">WhatsApp</h1>
     <p className="text-gray-500 text-xs @[768px]:text-sm mt-0.5">
      Pair your WhatsApp account by scanning a QR code from your phone, then send a test message.
     </p>
    </div>
   </header>

   <div className="grid grid-cols-1 @[1024px]:grid-cols-2 gap-4 @[768px]:gap-6">
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 @[768px]:p-6">
     <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
       <QrCode className="h-5 w-5 text-green-600" />
       Connect device
      </h2>
      {statusBadge}
     </div>

     {error && (
      <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
       {error}
      </div>
     )}

     {state.status === "connected" ? (
      <div className="flex flex-col gap-3">
       <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        Connected as <span className="font-mono">{state.jid || "—"}</span>
       </div>
       <div className="flex gap-2">
        <button
         type="button"
         onClick={handleLogout}
         disabled={busy}
         className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
         <LogOut className="h-4 w-4" /> Logout / Re-pair
        </button>
        <button
         type="button"
         onClick={refresh}
         className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
         <RefreshCw className="h-4 w-4" /> Refresh
        </button>
       </div>
      </div>
     ) : state.status === "qr" && state.qrDataUrl ? (
      <div className="flex flex-col items-center gap-3">
       <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
         src={state.qrDataUrl}
         alt="WhatsApp pairing QR"
         className="block h-56 w-56 @[768px]:h-64 @[768px]:w-64"
        />
       </div>
       <ol className="text-xs text-gray-600 list-decimal pl-5 space-y-0.5">
        <li>Open WhatsApp on your phone.</li>
        <li>Tap <span className="font-medium">Settings → Linked devices → Link a device</span>.</li>
        <li>Point your phone camera at this QR.</li>
       </ol>
       <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
       >
        Cancel pairing
       </button>
      </div>
     ) : state.status === "connecting" ? (
      <div className="flex flex-col items-center gap-3 py-8">
       <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
       <p className="text-sm text-gray-600">Starting WhatsApp session…</p>
      </div>
     ) : (
      <div className="flex flex-col gap-3">
       <p className="text-sm text-gray-600">
        Click below to start a new session. A QR code will appear here for you to scan with your phone.
       </p>
       <button
        type="button"
        onClick={handleStart}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
       >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
        Generate QR code
       </button>
      </div>
     )}
    </section>

    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 @[768px]:p-6">
     <h2 className="text-lg font-medium text-gray-800 mb-1 flex items-center gap-2">
      <MessageCircle className="h-5 w-5 text-green-600" />
      Send test message
     </h2>
     <p className="text-sm text-gray-500 mb-4">
      {state.status === "connected"
       ? "Sends from the connected WhatsApp account."
       : "Not connected yet — falls back to opening wa.me in a new tab."}
     </p>

     <label htmlFor="wa-phone" className="block text-sm font-medium text-gray-800 mb-1.5">
      Phone Number <span className="text-gray-400 font-normal">(with country code, e.g. +44)</span>
     </label>
     <div className="flex flex-wrap items-stretch gap-2">
      <input
       id="wa-phone"
       type="tel"
       inputMode="tel"
       autoComplete="tel"
       placeholder="e.g. +447700900000"
       value={phone}
       onChange={(e) => {
        setPhone(e.target.value);
        if (sendMsg) setSendMsg(null);
       }}
       onKeyDown={(e) => {
        if (e.key === "Enter") {
         e.preventDefault();
         handleSend();
        }
       }}
       className="flex-1 min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <button
       type="button"
       onClick={handleSend}
       disabled={sending}
       className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
      >
       {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
       ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
         <path d="M19.11 4.91A9.84 9.84 0 0 0 12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 1.74.46 3.44 1.32 4.94L2.05 22l5.31-1.39a9.86 9.86 0 0 0 4.68 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.84-6.99zM12.05 20.13h-.01a8.21 8.21 0 0 1-4.18-1.15l-.3-.18-3.15.83.84-3.07-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.2 8.2 0 0 1 2.41 5.82c.01 4.54-3.69 8.24-8.21 8.24zm4.51-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.39.11-.51.12-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42l-.47-.01c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.04 0 1.21.88 2.37 1.01 2.53.12.16 1.74 2.66 4.22 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.14-1.17-.07-.11-.23-.17-.48-.29z" />
        </svg>
       )}
       Send Test
      </button>
     </div>
     <p className="mt-1.5 text-xs text-gray-500">
      Type the full international number (no spaces). Leading + is optional.
     </p>

     {state.status === "connected" && (
      <label className="mt-3 inline-flex items-center gap-2 text-xs text-gray-600 select-none">
       <input
        type="checkbox"
        checked={waLinkMode}
        onChange={(e) => setWaLinkMode(e.target.checked)}
        className="rounded border-gray-300"
       />
       Use wa.me link instead of the connected gateway
      </label>
     )}

     {sendMsg && (
      <div
       className={`mt-3 rounded-md border px-3 py-2 text-xs ${
        sendMsg.type === "success"
         ? "border-green-200 bg-green-50 text-green-700"
         : "border-red-200 bg-red-50 text-red-700"
       }`}
      >
       {sendMsg.text}
      </div>
     )}
    </section>
   </div>
  </div>
 );
}

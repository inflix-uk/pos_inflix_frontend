"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Loader2, RefreshCw, Pencil, Save, X, RotateCcw } from "lucide-react";
import {
 whatsappApi,
 formatDuration,
 type WhatsappSafetySettings,
 type WhatsappSettingsPayload,
} from "../service/whatsappApi";

const FIELDS: (keyof WhatsappSafetySettings)[] = [
 "messageDelayMinSeconds",
 "messageDelayMaxSeconds",
 "hourlyLimit",
 "dailyLimit",
 "dailyCapPerRecipient",
 "duplicateWindowMinutes",
];

const REFRESH_MS = 15000;

export default function SafetyLimitsCard({ canEdit, refreshKey }: { canEdit: boolean; refreshKey: number }) {
 const [data, setData] = useState<WhatsappSettingsPayload | null>(null);
 const [loadedAt, setLoadedAt] = useState(() => Date.now());
 const [now, setNow] = useState(() => Date.now());
 const [error, setError] = useState<string | null>(null);
 const [editing, setEditing] = useState(false);
 const [draft, setDraft] = useState<Record<keyof WhatsappSafetySettings, string> | null>(null);
 const [saving, setSaving] = useState(false);
 const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

 const load = useCallback(async () => {
  try {
   const payload = await whatsappApi.getSettings();
   setData(payload);
   setLoadedAt(Date.now());
   setError(null);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load WhatsApp limits");
  }
 }, []);

 useEffect(() => {
  load();
  const poll = setInterval(load, REFRESH_MS);
  return () => clearInterval(poll);
 }, [load, refreshKey]);

 // 1s ticker so countdowns move between polls.
 useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(t);
 }, []);

 const startEditing = () => {
  if (!data) return;
  const next = {} as Record<keyof WhatsappSafetySettings, string>;
  for (const f of FIELDS) next[f] = String(data.settings[f]);
  setDraft(next);
  setSaveMsg(null);
  setEditing(true);
 };

 const handleSave = async () => {
  if (!draft) return;
  const payload = {} as WhatsappSafetySettings;
  for (const f of FIELDS) payload[f] = Number(draft[f]);
  setSaving(true);
  setSaveMsg(null);
  try {
   const updated = await whatsappApi.updateSettings(payload);
   setData(updated);
   setLoadedAt(Date.now());
   setEditing(false);
   setSaveMsg({ type: "success", text: "Safety limits saved." });
  } catch (e) {
   setSaveMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to save limits" });
  } finally {
   setSaving(false);
  }
 };

 const elapsed = Math.max(0, Math.floor((now - loadedAt) / 1000));
 const s = data?.settings;
 const usage = data?.usage;
 const cooldownLeft = usage ? Math.max(0, usage.cooldown.remainingSeconds - elapsed) : 0;
 const hourlyFreesIn = usage ? Math.max(0, usage.hourly.resetInSeconds - elapsed) : 0;
 const dailyResetsIn = usage ? Math.max(0, usage.daily.resetInSeconds - elapsed) : 0;

 return (
  <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 @[768px]:p-6">
   <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
    <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
     <ShieldCheck className="h-5 w-5 text-green-600" />
     Sending safety limits
    </h2>
    <div className="flex items-center gap-2">
     <button
      type="button"
      onClick={load}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
     >
      <RefreshCw className="h-4 w-4" /> Refresh
     </button>
     {canEdit && data && !editing && (
      <button
       type="button"
       onClick={startEditing}
       className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
       <Pencil className="h-4 w-4" /> Edit limits
      </button>
     )}
    </div>
   </div>
   <p className="text-sm text-gray-500 mb-4">
    Every WhatsApp message (invoices and tests) is queued and sent one at a time within these limits, so the linked
    number isn&apos;t flagged by WhatsApp for automated sending.
   </p>

   {error && (
    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
   )}
   {saveMsg && (
    <div
     className={`mb-3 rounded-md border px-3 py-2 text-xs ${
      saveMsg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
     }`}
    >
     {saveMsg.text}
    </div>
   )}

   {!data || !s || !usage ? (
    <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
     <Loader2 className="h-4 w-4 animate-spin" /> Loading limits…
    </div>
   ) : (
    <>
     <div className="grid grid-cols-1 @[640px]:grid-cols-3 gap-3 mb-4">
      <UsageTile
       label="Hourly usage"
       used={usage.hourly.used}
       limit={usage.hourly.limit}
       caption={usage.hourly.used > 0 && hourlyFreesIn > 0 ? `Oldest send leaves the hour in ${formatDuration(hourlyFreesIn)}` : "Rolling 60 minutes"}
      />
      <UsageTile
       label="Daily usage"
       used={usage.daily.used}
       limit={usage.daily.limit}
       caption={`Resets at midnight (UK) — in ${formatDuration(dailyResetsIn)}`}
      />
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
       <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Next send</div>
       <div className="mt-1 text-2xl font-bold text-amber-900">{cooldownLeft > 0 ? formatDuration(cooldownLeft) : "Ready"}</div>
       <div className="mt-1 text-xs text-amber-800/80">
        {usage.queue.pending + usage.queue.sending} queued
        {usage.queue.blocked ? ` · ${usage.queue.blocked} blocked` : ""}
        {usage.queue.failed ? ` · ${usage.queue.failed} failed` : ""}
       </div>
      </div>
     </div>

     {editing && draft ? (
      <div className="rounded-lg border border-gray-200 p-4">
       <div className="grid grid-cols-1 @[640px]:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
         <label key={f} className="block">
          <span className="block text-xs font-medium text-gray-700">{data.bounds[f].label}</span>
          <input
           type="number"
           min={data.bounds[f].min}
           max={data.bounds[f].max}
           step={1}
           value={draft[f]}
           onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
           disabled={saving}
           className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
          />
          <span className="mt-0.5 block text-[11px] text-gray-400">
           {data.bounds[f].min}–{data.bounds[f].max} · default {data.defaults[f]}
          </span>
         </label>
        ))}
       </div>
       <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
         type="button"
         onClick={() => {
          const next = {} as Record<keyof WhatsappSafetySettings, string>;
          for (const f of FIELDS) next[f] = String(data.defaults[f]);
          setDraft(next);
         }}
         disabled={saving}
         className="mr-auto inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
         <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
        </button>
        <button
         type="button"
         onClick={() => setEditing(false)}
         disabled={saving}
         className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
         <X className="h-4 w-4" /> Cancel
        </button>
        <button
         type="button"
         onClick={handleSave}
         disabled={saving}
         className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
         {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
         Save limits
        </button>
       </div>
      </div>
     ) : (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
       <div className="text-sm font-semibold text-slate-700 mb-2">Technical Configuration</div>
       <dl className="grid grid-cols-2 gap-y-1.5 text-sm text-slate-700 @[640px]:grid-cols-[max-content_1fr] @[640px]:gap-x-8">
        <dt>Message delay:</dt>
        <dd className="font-mono">
         {s.messageDelayMinSeconds}–{s.messageDelayMaxSeconds}s
        </dd>
        <dt>Hourly limit:</dt>
        <dd className="font-mono">{s.hourlyLimit}</dd>
        <dt>Daily limit:</dt>
        <dd className="font-mono">{s.dailyLimit}</dd>
        <dt>Per-recipient daily cap:</dt>
        <dd className="font-mono">{s.dailyCapPerRecipient}</dd>
        <dt>Duplicate window:</dt>
        <dd className="font-mono">{s.duplicateWindowMinutes} min</dd>
       </dl>
      </div>
     )}
    </>
   )}
  </section>
 );
}

function UsageTile({ label, used, limit, caption }: { label: string; used: number; limit: number; caption: string }) {
 const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
 const full = used >= limit;
 return (
  <div className={`rounded-lg border p-4 ${full ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
   <div className={`text-xs font-semibold uppercase tracking-wide ${full ? "text-red-800" : "text-green-800"}`}>{label}</div>
   <div className={`mt-1 text-2xl font-bold ${full ? "text-red-900" : "text-green-900"}`}>
    {used} <span className="text-base font-medium opacity-70">/ {limit}</span>
   </div>
   <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
    <div className={`h-full rounded-full ${full ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
   </div>
   <div className={`mt-2 text-xs ${full ? "text-red-800/80" : "text-green-800/80"}`}>{caption}</div>
  </div>
 );
}

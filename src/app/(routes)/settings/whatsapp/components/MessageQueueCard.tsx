"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ListOrdered, Loader2, RefreshCw, RotateCw, Ban, FileText, MessageSquare } from "lucide-react";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { whatsappApi, type WhatsappMessageStatus, type WhatsappQueueMessage } from "../service/whatsappApi";

const REFRESH_MS = 15000;

const STATUS_STYLES: Record<WhatsappMessageStatus, { label: string; cls: string }> = {
 pending: { label: "Queued", cls: "bg-amber-50 text-amber-700 border-amber-200" },
 sending: { label: "Sending", cls: "bg-blue-50 text-blue-700 border-blue-200" },
 sent: { label: "Sent", cls: "bg-green-50 text-green-700 border-green-200" },
 failed: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200" },
 blocked: { label: "Blocked", cls: "bg-orange-50 text-orange-700 border-orange-200" },
 cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const FILTERS: { value: "" | WhatsappMessageStatus; label: string }[] = [
 { value: "", label: "All" },
 { value: "pending", label: "Queued" },
 { value: "sent", label: "Sent" },
 { value: "failed", label: "Failed" },
 { value: "blocked", label: "Blocked" },
 { value: "cancelled", label: "Cancelled" },
];

export default function MessageQueueCard({ canEdit, refreshKey }: { canEdit: boolean; refreshKey: number }) {
 const [messages, setMessages] = useState<WhatsappQueueMessage[] | null>(null);
 const [filter, setFilter] = useState<"" | WhatsappMessageStatus>("");
 const [error, setError] = useState<string | null>(null);
 const [busyId, setBusyId] = useState<string | null>(null);

 const load = useCallback(async () => {
  try {
   setMessages(await whatsappApi.getQueue({ status: filter || undefined, limit: 50 }));
   setError(null);
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load messages");
  }
 }, [filter]);

 useEffect(() => {
  load();
  const poll = setInterval(load, REFRESH_MS);
  return () => clearInterval(poll);
 }, [load, refreshKey]);

 const act = async (id: string, action: "retry" | "cancel") => {
  setBusyId(id);
  setError(null);
  try {
   if (action === "retry") await whatsappApi.retryMessage(id);
   else await whatsappApi.cancelMessage(id);
   await load();
  } catch (e) {
   setError(e instanceof Error ? e.message : `Failed to ${action} message`);
  } finally {
   setBusyId(null);
  }
 };

 return (
  <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 @[768px]:p-6">
   <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
    <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
     <ListOrdered className="h-5 w-5 text-green-600" />
     Message queue
    </h2>
    <div className="flex items-center gap-2">
     <select
      value={filter}
      onChange={(e) => setFilter(e.target.value as "" | WhatsappMessageStatus)}
      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
     >
      {FILTERS.map((f) => (
       <option key={f.value} value={f.value}>
        {f.label}
       </option>
      ))}
     </select>
     <button
      type="button"
      onClick={load}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
     >
      <RefreshCw className="h-4 w-4" /> Refresh
     </button>
    </div>
   </div>

   {error && (
    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
   )}

   {messages === null ? (
    <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
     <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
    </div>
   ) : messages.length === 0 ? (
    <p className="py-6 text-center text-sm text-gray-500">No WhatsApp messages yet.</p>
   ) : (
    <div className="overflow-x-auto">
     <table className="w-full text-sm">
      <thead>
       <tr className="border-b border-gray-200 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <th className="px-3 py-2">Recipient</th>
        <th className="px-3 py-2">Message</th>
        <th className="px-3 py-2">Status</th>
        <th className="px-3 py-2">Time</th>
        {canEdit && <th className="px-3 py-2 text-right">Actions</th>}
       </tr>
      </thead>
      <tbody>
       {messages.map((m) => {
        const style = STATUS_STYLES[m.status];
        const canRetry = m.status === "failed" || m.status === "blocked";
        const canCancel = m.status === "pending" || canRetry;
        return (
         <tr key={m._id} className="border-b border-gray-100 align-top">
          <td className="px-3 py-2.5">
           <div className="font-medium text-gray-900">{m.recipientName || "—"}</div>
           <div className="font-mono text-xs text-gray-500">+{m.recipientPhone}</div>
          </td>
          <td className="px-3 py-2.5 max-w-[320px]">
           <div className="flex items-center gap-1.5 text-gray-800">
            {m.attachment ? (
             <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            ) : (
             <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            )}
            <span className="truncate">
             {m.source === "invoice" ? `Invoice ${m.sourceRef?.reference || ""}` : "Test message"}
            </span>
           </div>
           {m.text && <div className="mt-0.5 truncate text-xs text-gray-500">{m.text}</div>}
           {m.error && (m.status === "failed" || m.status === "blocked" || m.status === "pending") && (
            <div className={`mt-0.5 text-xs ${m.status === "pending" ? "text-amber-700" : "text-red-600"}`}>{m.error}</div>
           )}
          </td>
          <td className="px-3 py-2.5">
           <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${style.cls}`}>{style.label}</span>
           {m.attempts > 1 && <div className="mt-0.5 text-[11px] text-gray-400">{m.attempts} attempts</div>}
          </td>
          <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-600">
           {m.status === "sent" ? formatDateTimeLondon(m.sentAt) : formatDateTimeLondon(m.createdAt)}
          </td>
          {canEdit && (
           <td className="px-3 py-2.5">
            <div className="flex justify-end gap-1.5">
             {canRetry && (
              <button
               type="button"
               onClick={() => act(m._id, "retry")}
               disabled={busyId === m._id}
               className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
               <RotateCw className="h-3.5 w-3.5" /> Retry
              </button>
             )}
             {canCancel && (
              <button
               type="button"
               onClick={() => act(m._id, "cancel")}
               disabled={busyId === m._id}
               className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
               <Ban className="h-3.5 w-3.5" /> Cancel
              </button>
             )}
            </div>
           </td>
          )}
         </tr>
        );
       })}
      </tbody>
     </table>
    </div>
   )}
  </section>
 );
}

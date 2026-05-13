"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
 History,
 Search,
 Filter,
 Download,
 ChevronLeft,
 ChevronRight,
 X,
 ExternalLink,
} from "lucide-react";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { activityLogApi, type ActivityLogEvent, type ActivityLogFilters } from "./service/activityLogApi";

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function ActivityLogPage() {
 const [data, setData] = useState<ActivityLogEvent[]>([]);
 const [total, setTotal] = useState(0);
 const [page, setPage] = useState(1);
 const [pages, setPages] = useState(1);
 const [limit, setLimit] = useState(25);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [options, setOptions] = useState<{ actions: string[]; entityTypes: string[]; sources: string[] } | null>(null);

 const [fromDate, setFromDate] = useState("");
 const [toDate, setToDate] = useState("");
 const [imei, setImei] = useState("");
 const [customerId, setCustomerId] = useState("");
 const [userId, setUserId] = useState("");
 const [invoiceNo, setInvoiceNo] = useState("");
 const [saleId, setSaleId] = useState("");
 const [action, setAction] = useState("");
 const [entityType, setEntityType] = useState("");
 const [successFilter, setSuccessFilter] = useState<string>("");
 const [source, setSource] = useState("");
 const [search, setSearch] = useState("");

 const [drawerEvent, setDrawerEvent] = useState<ActivityLogEvent | null>(null);
 const [drawerLoading, setDrawerLoading] = useState(false);

 const buildParams = useCallback((): ActivityLogFilters => {
 const params: ActivityLogFilters = { page, limit, sort: "desc" };
 if (fromDate) params.fromUtc = `${fromDate}T00:00:00.000Z`;
 if (toDate) params.toUtc = `${toDate}T23:59:59.999Z`;
 if (imei.trim()) params.imei = imei.trim();
 if (customerId.trim()) params.customerId = customerId.trim();
 if (userId.trim()) params.userId = userId.trim();
 if (invoiceNo.trim()) params.invoiceNo = invoiceNo.trim();
 if (saleId.trim()) params.saleId = saleId.trim();
 if (action) params.action = action;
 if (entityType) params.entityType = entityType;
 if (successFilter === "true") params.success = true;
 if (successFilter === "false") params.success = false;
 if (source) params.source = source;
 if (search.trim()) params.search = search.trim();
 return params;
 }, [
 page,
 limit,
 fromDate,
 toDate,
 imei,
 customerId,
 userId,
 invoiceNo,
 saleId,
 action,
 entityType,
 successFilter,
 source,
 search,
 ]);

 const fetchLog = useCallback(async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await activityLogApi.getList(buildParams());
 setData(res.data);
 setTotal(res.total);
 setPages(res.pages);
 setPage(res.page);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load activity log");
 setData([]);
 } finally {
 setLoading(false);
 }
 }, [buildParams]);

 useEffect(() => {
 fetchLog();
 }, [fetchLog]);

 useEffect(() => {
 activityLogApi.getOptions().then((r) => setOptions(r.data)).catch(() => {});
 }, []);

 const handleExportCsv = useCallback(async () => {
 try {
 const res = await activityLogApi.getList({ ...buildParams(), limit: 10000 });
 const rows = res.data;
 const headers = [
 "Time (London)",
 "Actor",
 "Role",
 "Action",
 "Entity Type",
 "Entity ID",
 "Success",
 "Message",
 "Invoice",
 "IMEI",
 "Amount",
 "Source",
 ];
 const escape = (v: string | number | boolean | null | undefined) => {
 const s = String(v ?? "");
 if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
 return s;
 };
 const lines = [
 headers.join(","),
 ...rows.map((e) =>
  [
  formatDateTimeLondon(e.occurredAtUtc),
  escape(e.actorName),
  escape(e.actorRole),
  escape(e.action),
  escape(e.entityType),
  escape(e.entityId),
  e.success ? "Yes" : "No",
  escape(e.message),
  escape(e.invoiceNo),
  escape(e.imei),
  e.amount != null ? e.amount : "",
  escape(e.source),
  ].join(",")
 ),
 ];
 const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Export failed");
 }
 }, [buildParams]);

 const openDrawer = useCallback((event: ActivityLogEvent) => {
 setDrawerEvent(event);
 setDrawerLoading(true);
 activityLogApi
 .getById(event.id)
 .then((r) => {
 setDrawerEvent(r.data);
 })
 .finally(() => setDrawerLoading(false));
 }, []);

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center gap-3">
  <div className="p-2 bg-neutral-100 rounded-lg">
  <History className="h-6 w-6 text-neutral-600" />
  </div>
  <div>
  <h1 className="text-2xl font-semibold text-gray-800">Activity Log</h1>
  <p className="text-gray-500 text-sm mt-1">
  System-wide audit trail. All times in Europe/London (24h). Admin/manager only.
  </p>
  </div>
 </div>
 <button
  type="button"
  onClick={handleExportCsv}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
 >
  <Download className="h-4 w-4" />
  Export CSV
 </button>
 </div>

 {error && (
 <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
 )}

 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
 <div className="p-4 border-b border-gray-200 bg-gray-50/80">
  <div className="flex flex-wrap items-center gap-2 mb-3">
  <Filter className="h-4 w-4 text-gray-500" />
  <span className="text-sm font-medium text-gray-700">Filters</span>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
  <div>
  <label className="block text-xs text-gray-500 mb-1">From (date)</label>
  <input
  type="date"
  value={fromDate}
  onChange={(e) => setFromDate(e.target.value)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">To (date)</label>
  <input
  type="date"
  value={toDate}
  onChange={(e) => setToDate(e.target.value)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">IMEI / Serial</label>
  <input
  type="text"
  value={imei}
  onChange={(e) => setImei(e.target.value)}
  placeholder="e.g. 123456"
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Invoice no</label>
  <input
  type="text"
  value={invoiceNo}
  onChange={(e) => setInvoiceNo(e.target.value)}
  placeholder="e.g. INV-260302"
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Action</label>
  <select
  value={action}
  onChange={(e) => setAction(e.target.value)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  >
  <option value="">All</option>
  {options?.actions.map((a) => (
   <option key={a} value={a}>
   {a}
   </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Entity type</label>
  <select
  value={entityType}
  onChange={(e) => setEntityType(e.target.value)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  >
  <option value="">All</option>
  {options?.entityTypes.map((t) => (
   <option key={t} value={t}>
   {t}
   </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Success</label>
  <select
  value={successFilter}
  onChange={(e) => setSuccessFilter(e.target.value)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  >
  <option value="">All</option>
  <option value="true">Yes</option>
  <option value="false">No</option>
  </select>
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Source</label>
  <select
  value={source}
  onChange={(e) => setSource(e.target.value)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
  >
  <option value="">All</option>
  {options?.sources.map((s) => (
   <option key={s} value={s}>
   {s}
   </option>
  ))}
  </select>
  </div>
  <div className="sm:col-span-2">
  <label className="block text-xs text-gray-500 mb-1">Global search</label>
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
   type="text"
   value={search}
   onChange={(e) => setSearch(e.target.value)}
   placeholder="Message, invoice, IMEI, actor..."
   className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
  />
  </div>
  </div>
  </div>
 </div>

 <div className="overflow-x-auto">
  <table className="w-full min-w-[900px]">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time (London)</th>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actor</th>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity</th>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Message</th>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Success</th>
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
  {loading ? (
  <tr>
   <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
   Loading…
   </td>
  </tr>
  ) : data.length === 0 ? (
  <tr>
   <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
   No events match your filters.
   </td>
  </tr>
  ) : (
  data.map((event) => (
   <tr key={event.id} className="hover:bg-orange-50/30">
   <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
   {formatDateTimeLondon(event.occurredAtUtc)}
   </td>
   <td className="px-4 py-3 text-sm text-gray-700">
   <span className="font-medium">{event.actorName || "—"}</span>
   {event.actorRole && (
   <span className="ml-1 text-gray-500 text-xs">({event.actorRole})</span>
   )}
   </td>
   <td className="px-4 py-3 text-sm text-gray-700">{event.action}</td>
   <td className="px-4 py-3 text-sm text-gray-700">
   {event.entityType} {event.invoiceNo ? `· ${event.invoiceNo}` : ""}
   </td>
   <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={event.message}>
   {event.message || "—"}
   </td>
   <td className="px-4 py-3">
   <span
   className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
    event.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
   }`}
   >
   {event.success ? "Yes" : "No"}
   </span>
   </td>
   <td className="px-4 py-3">
   <button
   type="button"
   onClick={() => openDrawer(event)}
   className="text-orange-600 hover:text-orange-700 text-sm font-medium"
   >
   View details
   </button>
   </td>
   </tr>
  ))
  )}
  </tbody>
  </table>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
  <div className="flex items-center gap-4">
  <span className="text-sm text-gray-600">
  {total} result{total !== 1 ? "s" : ""}
  </span>
  <select
  value={limit}
  onChange={(e) => setLimit(Number(e.target.value))}
  className="px-2 py-1 border border-gray-200 rounded text-sm"
  >
  {LIMIT_OPTIONS.map((n) => (
  <option key={n} value={n}>
   {n} per page
  </option>
  ))}
  </select>
  </div>
  <div className="flex items-center gap-2">
  <button
  type="button"
  onClick={() => setPage((p) => Math.max(1, p - 1))}
  disabled={page <= 1}
  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
  >
  <ChevronLeft className="h-4 w-4" />
  </button>
  <span className="text-sm text-gray-600">
  Page {page} of {pages || 1}
  </span>
  <button
  type="button"
  onClick={() => setPage((p) => Math.min(pages || 1, p + 1))}
  disabled={page >= pages}
  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
  >
  <ChevronRight className="h-4 w-4" />
  </button>
  </div>
 </div>
 </div>

 {drawerEvent && (
 <div className="fixed inset-0 z-50 flex justify-end">
  <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerEvent(null)} />
  <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
  <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
  <h2 className="text-lg font-semibold text-gray-800">Event details</h2>
  <button
  type="button"
  onClick={() => setDrawerEvent(null)}
  className="p-2 rounded-lg hover:bg-gray-100"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <div className="p-4 space-y-4">
  {drawerLoading ? (
  <p className="text-gray-500">Loading…</p>
  ) : (
  <>
   <div className="grid grid-cols-2 gap-2 text-sm">
   <span className="text-gray-500">Time (London)</span>
   <span>{formatDateTimeLondon(drawerEvent.occurredAtUtc)}</span>
   <span className="text-gray-500">Actor</span>
   <span>{drawerEvent.actorName || "—"} {drawerEvent.actorRole && `(${drawerEvent.actorRole})`}</span>
   <span className="text-gray-500">Action</span>
   <span>{drawerEvent.action}</span>
   <span className="text-gray-500">Entity</span>
   <span>{drawerEvent.entityType} · {drawerEvent.entityId ?? "—"}</span>
   <span className="text-gray-500">Success</span>
   <span>{drawerEvent.success ? "Yes" : "No"}</span>
   <span className="text-gray-500">Message</span>
   <span className="col-span-1">{drawerEvent.message || "—"}</span>
   {drawerEvent.invoiceNo && (
   <>
   <span className="text-gray-500">Invoice</span>
   <span>
    <a
    href={`/sales-online-orders/edit/${drawerEvent.saleId}`}
    className="text-orange-600 hover:underline inline-flex items-center gap-1"
    >
    {drawerEvent.invoiceNo}
    <ExternalLink className="h-3 w-3" />
    </a>
   </span>
   </>
   )}
   {drawerEvent.saleId && !drawerEvent.invoiceNo && (
   <>
   <span className="text-gray-500">Sale</span>
   <span>
    <a
    href={`/sales-online-orders/edit/${drawerEvent.saleId}`}
    className="text-orange-600 hover:underline"
    >
    View sale
    </a>
   </span>
   </>
   )}
   </div>
   {(drawerEvent.beforeJson || drawerEvent.afterJson || drawerEvent.diffJson || drawerEvent.metaJson) && (
   <div className="border-t border-gray-200 pt-4">
   <h3 className="text-sm font-medium text-gray-700 mb-2">Change / payload</h3>
   <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-64">
   {JSON.stringify(
    {
    ...(drawerEvent.beforeJson != null ? { before: drawerEvent.beforeJson } : {}),
    ...(drawerEvent.afterJson != null ? { after: drawerEvent.afterJson } : {}),
    ...(drawerEvent.diffJson != null ? { diff: drawerEvent.diffJson } : {}),
    ...(drawerEvent.metaJson != null ? { meta: drawerEvent.metaJson } : {}),
    },
    null,
    2
   )}
   </pre>
   </div>
   )}
   {drawerEvent.hash && (
   <div className="text-xs text-gray-500">
   <span className="font-medium">Hash:</span> {drawerEvent.hash.slice(0, 16)}…
   </div>
   )}
  </>
  )}
  </div>
  </div>
 </div>
 )}
 </div>
 );
}

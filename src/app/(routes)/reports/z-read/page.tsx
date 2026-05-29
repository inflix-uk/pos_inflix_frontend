"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 ChevronLeft,
 MapPin,
 RefreshCw,
 Receipt,
 Printer,
 Loader2,
 Sun,
 Clock,
 ArrowLeft,
} from "lucide-react";
import {
 getTakingsDashboard,
 getTodayLondon,
 formatDateLabel,
 type TakingsDashboardData,
} from "../takings/service/takingsDashboardApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import {
 clearPosShift,
 ensurePosShift,
 formatShiftRangeLabel,
 getShiftStartedAt,
} from "@/lib/posShift";
import { buildZReadEscposBase64, type ZReadReportKind } from "@/lib/zReadReceiptEscpos";
import { printZReadPdfManual } from "@/lib/zReadPdf";
import {
 isReceiptPrinterConfigured,
 loadPrintingSettings,
 openCashDrawer,
 printZReadEscpos,
} from "@/services/printService";

const STORAGE_KEY = "z-read-dashboard-locationId";

type Step = "choose" | "report";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(n);
}

export default function ZReadDashboardPage() {
 const router = useRouter();
 const { user } = usePermissionsContext();
 const [step, setStep] = useState<Step>("choose");
 const [reportKind, setReportKind] = useState<ZReadReportKind | null>(null);
 const [allLocations, setAllLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
 const [data, setData] = useState<TakingsDashboardData | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [from, setFrom] = useState(() => getTodayLondon());
 const [to, setTo] = useState(() => getTodayLondon());
 const [periodLabel, setPeriodLabel] = useState("Today");
 const [rangeText, setRangeText] = useState("");
 const [printing, setPrinting] = useState(false);
 const [printMessage, setPrintMessage] = useState<string | null>(null);
 const [shiftStartedAt, setShiftStartedAt] = useState<Date | null>(null);

 useEffect(() => {
  if (typeof window !== "undefined") {
   const stored = localStorage.getItem(STORAGE_KEY);
   if (stored) setSelectedLocationId(stored);
  }
  setShiftStartedAt(getShiftStartedAt() ?? ensurePosShift());
 }, []);

 const allowedLocationIds = useMemo(
  () => (user?.assignedLocationIds?.length ? new Set(user.assignedLocationIds) : null),
  [user?.assignedLocationIds]
 );
 const locations = useMemo(() => {
  if (!allowedLocationIds) return allLocations;
  return allLocations.filter((l) => allowedLocationIds.has(l._id));
 }, [allLocations, allowedLocationIds]);

 useEffect(() => {
  let cancelled = false;
  locationApi
   .getLocations({ isActive: true, limit: 500 })
   .then((res) => {
    if (cancelled || !res.success || !Array.isArray(res.data)) return;
    setAllLocations(
     (res.data as Array<{ _id: string; name: string }>).map((l) => ({
      _id: l._id,
      name: l.name,
     }))
    );
   })
   .catch(() => {});
  return () => {
   cancelled = true;
  };
 }, []);

 const handleLocationChange = (value: string) => {
  setSelectedLocationId(value);
  try {
   if (value && value !== "all") localStorage.setItem(STORAGE_KEY, value);
   else localStorage.removeItem(STORAGE_KEY);
  } catch {
   // ignore
  }
 };

 const locationName = useMemo(() => {
  if (selectedLocationId === "all") return "All locations";
  const loc = allLocations.find((l) => l._id === selectedLocationId);
  return loc?.name ?? "—";
 }, [selectedLocationId, allLocations]);

 const cashierName = useMemo(() => {
  const u = user as { name?: string; email?: string } | null;
  return u?.name?.trim() || u?.email?.trim() || undefined;
 }, [user]);

 const loadReport = useCallback(
  async (kind: ZReadReportKind) => {
   setLoading(true);
   setError(null);
   setPrintMessage(null);
   const locId = selectedLocationId === "all" ? "all" : selectedLocationId;
   try {
    if (kind === "day") {
     const today = getTodayLondon();
     const result = await getTakingsDashboard({ from: today, to: today, locationId: locId });
     setFrom(today);
     setTo(today);
     setPeriodLabel("End of day");
     setRangeText(formatDateLabel(today, today));
     setData(result);
    } else {
     const start = getShiftStartedAt() ?? ensurePosShift();
     const end = new Date();
     setShiftStartedAt(start);
     const result = await getTakingsDashboard({
      from: getTodayLondon(),
      to: getTodayLondon(),
      locationId: locId,
      fromUtc: start.toISOString(),
      toUtc: end.toISOString(),
     });
     setFrom(start.toISOString().slice(0, 10));
     setTo(end.toISOString().slice(0, 10));
     setPeriodLabel("End of shift");
     setRangeText(formatShiftRangeLabel(start, end));
     setData(result);
    }
    setReportKind(kind);
    setStep("report");
   } catch (e) {
    setError(e instanceof Error ? e.message : "Failed to generate Z-Report");
   } finally {
    setLoading(false);
   }
  },
  [selectedLocationId]
 );

 const handleBack = () => {
  setStep("choose");
  setReportKind(null);
  setData(null);
  setError(null);
  setPrintMessage(null);
 };

 const handlePrintReceipt = async () => {
  if (!data || !reportKind) return;
  setPrinting(true);
  setPrintMessage(null);
  const pdfParams = {
   data,
   locationName,
   dateRangeLabel: periodLabel,
   rangeText,
   reportKind,
   cashierName,
  };
  try {
   const settings = await loadPrintingSettings();
   const useThermal = isReceiptPrinterConfigured(settings);
   let thermalOk = false;

   if (useThermal) {
    const escpos = buildZReadEscposBase64({
     kind: reportKind,
     data,
     locationName,
     periodLabel,
     rangeText,
     cashierName,
    });
    const printResult = await printZReadEscpos(
     escpos,
     reportKind === "day" ? "z-read-eod" : "z-read-shift"
    );
    if (printResult.sent) {
     thermalOk = true;
     const drawer = await openCashDrawer({ tryBothPins: true });
     if (!drawer.sent) {
      setPrintMessage(
       `Receipt printed. Cash drawer: ${drawer.error || "could not open — check printer."}`
      );
     }
    }
   }

   if (!thermalOk) {
    await printZReadPdfManual(pdfParams);
   }

   if (reportKind === "shift") {
    clearPosShift();
   }
   router.push("/logout");
  } catch (e) {
   setPrintMessage(e instanceof Error ? e.message : "Print failed");
  } finally {
   setPrinting(false);
  }
 };

 const shiftLabel = shiftStartedAt
  ? formatShiftRangeLabel(shiftStartedAt, new Date())
  : "Not started";

 return (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
   <div className="mb-4">
    <Link
     href="/dashboard"
     className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
     <ChevronLeft className="h-4 w-4" /> Back to Dashboard
    </Link>
   </div>

   <header className="mb-6 max-w-3xl">
    <h1 className="text-2xl font-bold text-gray-900">Z-Report</h1>
    <p className="mt-1 text-sm text-gray-600">
     Close the till with an end-of-day or end-of-shift reading. Print an 80mm receipt, open the drawer, and sign out.
    </p>
   </header>

   <div className="mb-6 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex items-center gap-2 flex-1 min-w-0">
     <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
     <select
      value={selectedLocationId}
      onChange={(e) => handleLocationChange(e.target.value)}
      disabled={loading || printing}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
     >
      <option value="all">All locations</option>
      {locations.map((loc) => (
       <option key={loc._id} value={loc._id}>
        {loc.name}
       </option>
      ))}
     </select>
    </div>
    {step === "report" && data && (
     <button
      type="button"
      onClick={() => void loadReport(reportKind!)}
      disabled={loading || printing}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
     >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Refresh
     </button>
    )}
   </div>

   {error && (
    <div className="mb-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
     {error}
    </div>
   )}

   {printMessage && (
    <div className="mb-4 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
     {printMessage}
    </div>
   )}

   {step === "choose" && (
    <div className="max-w-3xl space-y-4">
     <p className="text-sm font-medium text-gray-700">Choose report type</p>
     <div className="grid gap-4 sm:grid-cols-2">
      <button
       type="button"
       onClick={() => void loadReport("day")}
       disabled={loading}
       className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-orange-200 bg-white p-6 text-left shadow-sm hover:border-orange-400 hover:bg-orange-50/50 active:scale-[0.99] transition-all disabled:opacity-50 touch-manipulation min-h-[140px]"
      >
       <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sun className="h-6 w-6" />}
       </span>
       <span>
        <span className="block text-lg font-bold text-gray-900">End of Day Report</span>
        <span className="mt-1 block text-sm text-gray-600">
         Full trading day (today, London). Use when closing the shop for the night.
        </span>
       </span>
      </button>
      <button
       type="button"
       onClick={() => void loadReport("shift")}
       disabled={loading}
       className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-blue-200 bg-white p-6 text-left shadow-sm hover:border-blue-400 hover:bg-blue-50/50 active:scale-[0.99] transition-all disabled:opacity-50 touch-manipulation min-h-[140px]"
      >
       <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Clock className="h-6 w-6" />}
       </span>
       <span>
        <span className="block text-lg font-bold text-gray-900">End of Shift Report</span>
        <span className="mt-1 block text-sm text-gray-600">
         Since you signed in: <span className="font-medium text-gray-800">{shiftLabel}</span>
        </span>
       </span>
      </button>
     </div>
    </div>
   )}

   {step === "report" && loading && !data && <ZReadSkeleton />}

   {step === "report" && data && reportKind && (
    <div className="max-w-3xl space-y-4">
     <div className="flex flex-wrap items-center gap-2">
      <button
       type="button"
       onClick={handleBack}
       disabled={printing}
       className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
      >
       <ArrowLeft className="h-4 w-4" /> Change report
      </button>
      <span
       className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        reportKind === "day" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
       }`}
      >
       {reportKind === "day" ? "End of day" : "End of shift"}
      </span>
     </div>

     <ZReadReceipt
      data={data}
      locationName={locationName}
      reportKind={reportKind}
      periodLabel={periodLabel}
      rangeText={rangeText}
      from={from}
      to={to}
     />

     <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-t border-gray-200 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:mx-0">
      <button
       type="button"
       onClick={() => void handlePrintReceipt()}
       disabled={printing}
       className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-orange-600 text-white text-base font-semibold hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 touch-manipulation shadow-lg"
      >
       {printing ? (
        <>
         <Loader2 className="h-5 w-5 animate-spin" />
         Printing…
        </>
       ) : (
        <>
         <Printer className="h-5 w-5" />
         Print receipt &amp; sign out
        </>
       )}
      </button>
     </div>
    </div>
   )}
  </div>
 );
}

function ZReadReceipt({
 data,
 locationName,
 reportKind,
 periodLabel,
 rangeText,
 from,
 to,
}: {
 data: TakingsDashboardData;
 locationName: string;
 reportKind: ZReadReportKind;
 periodLabel: string;
 rangeText: string;
 from: string;
 to: string;
}) {
 const { takings } = data;
 const pb = takings.paymentBreakdown;
 const totalIn = pb.cash.in + pb.card.in + pb.bank.in + pb.credit.in;
 const totalOut = pb.cash.out + pb.card.out + pb.bank.out + pb.credit.out;
 const totalNet = pb.cash.net + pb.card.net + pb.bank.net + pb.credit.net;

 const printedAt = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
 });

 const title =
  reportKind === "day" ? "END OF DAY Z-REPORT" : "END OF SHIFT Z-REPORT";

 return (
  <section className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 sm:p-6 shadow-sm">
   <header className="border-b border-dashed border-gray-300 pb-3 mb-4 text-center">
    <h2 className="text-lg sm:text-xl font-bold tracking-wide text-gray-900 flex items-center justify-center gap-2">
     <Receipt className="h-5 w-5" />
     {title}
    </h2>
    <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">Z-Report</p>
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs">
     <div>
      <span className="font-medium text-gray-500">Location:</span>{" "}
      <span className="text-gray-900">{locationName}</span>
     </div>
     <div className="sm:text-right">
      <span className="font-medium text-gray-500">Period:</span>{" "}
      <span className="text-gray-900">{periodLabel}</span>
     </div>
     <div>
      <span className="font-medium text-gray-500">Range:</span>{" "}
      <span className="text-gray-900">{rangeText || formatDateLabel(from, to)}</span>
     </div>
     <div className="sm:text-right">
      <span className="font-medium text-gray-500">Printed:</span>{" "}
      <span className="text-gray-900">{printedAt}</span>
     </div>
    </div>
   </header>

   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pb-4 border-b border-dashed border-gray-200">
    <ZStat label="Sales #" value={String(takings.salesCount)} />
    <ZStat label="Refunds #" value={String(takings.refundsCount)} negative />
    <ZStat label="Voids #" value={String(takings.voidsCount)} negative />
    <ZStat label="Gross sales" value={formatCurrency(takings.grossSales)} />
    <ZStat label="Refunds" value={formatCurrency(takings.refundsGross)} negative />
    <ZStat label="Net revenue" value={formatCurrency(takings.netRevenue)} highlight />
   </div>

   <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
     <thead>
      <tr className="text-gray-500">
       <th className="px-2 py-1.5 text-left font-medium">Method</th>
       <th className="px-2 py-1.5 text-right font-medium">In</th>
       <th className="px-2 py-1.5 text-right font-medium">Out</th>
       <th className="px-2 py-1.5 text-right font-medium">Net</th>
      </tr>
     </thead>
     <tbody>
      {(["cash", "card", "bank", "credit"] as const).map((m) => (
       <tr key={m} className="border-t border-gray-100">
        <td className="px-2 py-2 capitalize font-medium text-gray-900">{m}</td>
        <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(pb[m].in)}</td>
        <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(pb[m].out)}</td>
        <td
         className={`px-2 py-2 text-right font-medium tabular-nums ${
          pb[m].net < 0 ? "text-red-600" : "text-gray-900"
         }`}
        >
         {formatCurrency(pb[m].net)}
        </td>
       </tr>
      ))}
      <tr className="border-t-2 border-gray-400 bg-orange-50/40">
       <td className="px-2 py-2 font-bold uppercase text-orange-700">Total</td>
       <td className="px-2 py-2 text-right font-bold tabular-nums">{formatCurrency(totalIn)}</td>
       <td className="px-2 py-2 text-right font-bold tabular-nums">{formatCurrency(totalOut)}</td>
       <td className="px-2 py-2 text-right font-bold tabular-nums">{formatCurrency(totalNet)}</td>
      </tr>
     </tbody>
    </table>
   </div>

   {data.takings.accountBreakdown && data.takings.accountBreakdown.length > 0 && (
    <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
     <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">By account</h3>
     <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
       <thead>
        <tr className="text-gray-500">
         <th className="px-2 py-1 text-left font-medium">Account</th>
         <th className="px-2 py-1 text-right font-medium">Net</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {data.takings.accountBreakdown.map((row) => (
         <tr key={row.accountId}>
          <td className="px-2 py-1.5 text-gray-900">{row.accountName}</td>
          <td
           className={`px-2 py-1.5 text-right font-medium tabular-nums ${
            row.net < 0 ? "text-red-600" : "text-gray-900"
           }`}
          >
           {formatCurrency(row.net)}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   )}

   <footer className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center">
    <p className="text-xs uppercase tracking-widest text-gray-500">— End of Z-Report —</p>
   </footer>
  </section>
 );
}

function ZStat({
 label,
 value,
 negative,
 highlight,
}: {
 label: string;
 value: string;
 negative?: boolean;
 highlight?: boolean;
}) {
 return (
  <div>
   <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
   <p
    className={`mt-0.5 text-base font-bold tabular-nums ${
     negative ? "text-red-600" : highlight ? "text-orange-700" : "text-gray-900"
    }`}
   >
    {value}
   </p>
  </div>
 );
}

function ZReadSkeleton() {
 return (
  <div className="max-w-3xl rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 shadow-sm">
   <div className="h-6 w-2/3 mx-auto bg-gray-100 animate-pulse rounded mb-4" />
   <div className="grid grid-cols-3 gap-3 mb-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
     <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
    ))}
   </div>
   <div className="h-40 bg-gray-100 animate-pulse rounded" />
  </div>
 );
}

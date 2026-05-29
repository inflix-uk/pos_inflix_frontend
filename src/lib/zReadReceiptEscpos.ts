import type { TakingsDashboardData } from "@/app/(routes)/reports/takings/service/takingsDashboardApi";

export type ZReadReportKind = "day" | "shift";

export interface ZReadReceiptPrintParams {
 kind: ZReadReportKind;
 data: TakingsDashboardData;
 locationName: string;
 periodLabel: string;
 rangeText: string;
 cashierName?: string;
}

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const COLS = 48;

function escposSafeText(str: string): string {
 return String(str || "")
  .replace(/^\uFEFF+/, "")
  .replace(/\u2014/g, "-")
  .replace(/\u2013/g, "-")
  .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
  .trim();
}

function bytes(...arr: number[]): Uint8Array {
 return Uint8Array.from(arr);
}

function concat(...parts: Uint8Array[]): Uint8Array {
 const total = parts.reduce((s, p) => s + p.length, 0);
 const out = new Uint8Array(total);
 let off = 0;
 for (const p of parts) {
  out.set(p, off);
  off += p.length;
 }
 return out;
}

function textLine(str: string): Uint8Array {
 return concat(bytes(...Array.from(escposSafeText(str), (c) => c.charCodeAt(0))), bytes(LF));
}

function alignCenter(): Uint8Array {
 return bytes(ESC, 0x61, 1);
}
function alignLeft(): Uint8Array {
 return bytes(ESC, 0x61, 0);
}
function boldOn(): Uint8Array {
 return bytes(ESC, 0x45, 1);
}
function boldOff(): Uint8Array {
 return bytes(ESC, 0x45, 0);
}
function init(): Uint8Array {
 return bytes(ESC, 0x40);
}
function cut(): Uint8Array {
 return bytes(GS, 0x56, 0);
}
function feed(n: number): Uint8Array {
 return bytes(...Array(Math.min(8, Math.max(0, n))).fill(LF));
}

function divider(): Uint8Array {
 return textLine("-".repeat(COLS));
}

function padLine(left: string, right: string): string {
 const l = escposSafeText(left);
 const r = escposSafeText(right);
 const gap = COLS - l.length - r.length;
 if (gap >= 1) return l + " ".repeat(gap) + r;
 return `${l.slice(0, Math.max(0, COLS - r.length - 1))} ${r}`.slice(0, COLS);
}

function formatMoney(n: number): string {
 return new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(n);
}

function toBase64(u8: Uint8Array): string {
 let bin = "";
 for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!);
 return btoa(bin);
}

export function buildZReadEscposBase64(params: ZReadReceiptPrintParams): string {
 const { kind, data, locationName, periodLabel, rangeText, cashierName } = params;
 const { takings } = data;
 const pb = takings.paymentBreakdown;
 const title = kind === "day" ? "END OF DAY Z-REPORT" : "END OF SHIFT Z-REPORT";
 const printedAt = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
 });

 const chunks: Uint8Array[] = [
  init(),
  alignCenter(),
  boldOn(),
  textLine(title),
  boldOff(),
  textLine("Z-REPORT"),
  feed(1),
  alignLeft(),
  textLine(padLine("Location", locationName)),
  textLine(padLine("Period", periodLabel)),
  textLine(padLine("Range", rangeText.slice(0, COLS))),
  textLine(padLine("Printed", printedAt)),
 ];
 if (cashierName) chunks.push(textLine(padLine("Cashier", cashierName)));
 chunks.push(divider(), feed(1));

 const stats: Array<[string, string]> = [
  ["Sales #", String(takings.salesCount)],
  ["Refunds #", String(takings.refundsCount)],
  ["Voids #", String(takings.voidsCount)],
  ["Gross sales", formatMoney(takings.grossSales)],
  ["Refunds", formatMoney(takings.refundsGross)],
  ["Net revenue", formatMoney(takings.netRevenue)],
 ];
 for (const [label, value] of stats) {
  chunks.push(textLine(padLine(label, value)));
 }

 chunks.push(feed(1), divider(), boldOn(), textLine("PAYMENTS"), boldOff());

 const methods = ["cash", "card", "bank", "credit"] as const;
 let totalIn = 0;
 let totalOut = 0;
 let totalNet = 0;
 for (const m of methods) {
  const row = pb[m];
  totalIn += row.in;
  totalOut += row.out;
  totalNet += row.net;
  const name = m.charAt(0).toUpperCase() + m.slice(1);
  chunks.push(
   textLine(padLine(name, formatMoney(row.net))),
   textLine(
    `  In ${formatMoney(row.in)}  Out ${formatMoney(row.out)}`.slice(0, COLS)
   )
  );
 }
 chunks.push(divider(), boldOn(), textLine(padLine("TOTAL NET", formatMoney(totalNet))), boldOff());
 chunks.push(
  textLine(`  In ${formatMoney(totalIn)}  Out ${formatMoney(totalOut)}`.slice(0, COLS))
 );

 if (takings.accountBreakdown && takings.accountBreakdown.length > 0) {
  chunks.push(feed(1), divider(), boldOn(), textLine("ACCOUNTS"), boldOff());
  for (const row of takings.accountBreakdown.slice(0, 12)) {
   const name = (row.accountName || "Account").slice(0, 20);
   chunks.push(textLine(padLine(name, formatMoney(row.net))));
  }
  if (takings.accountBreakdown.length > 12) {
   chunks.push(textLine(`+${takings.accountBreakdown.length - 12} more accounts`));
  }
 }

 chunks.push(
  feed(2),
  alignCenter(),
  textLine("- END OF Z-REPORT -"),
  feed(3),
  cut()
 );

 return toBase64(concat(...chunks));
}

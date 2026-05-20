import { jsPDF } from "jspdf";
import type { TakingsDashboardData } from "@/app/(routes)/reports/takings/service/takingsDashboardApi";

function formatCurrency(n: number): string {
 return new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(n);
}

export interface ZReadPdfParams {
 data: TakingsDashboardData;
 locationName: string;
 dateRangeLabel: string;
 rangeText: string;
}

export function buildZReadPdf(params: ZReadPdfParams): jsPDF {
 const { data, locationName, dateRangeLabel, rangeText } = params;
 const { takings } = data;
 const pb = takings.paymentBreakdown;
 const totalIn = pb.cash.in + pb.card.in + pb.bank.in + pb.credit.in;
 const totalOut = pb.cash.out + pb.card.out + pb.bank.out + pb.credit.out;
 const totalNet = pb.cash.net + pb.card.net + pb.bank.net + pb.credit.net;

 const doc = new jsPDF({ unit: "mm", format: "a4" });
 const pageW = doc.internal.pageSize.getWidth();
 const margin = 14;
 let y = 18;

 doc.setFont("helvetica", "bold");
 doc.setFontSize(16);
 doc.text("DAILY CLOSING TILL READING", pageW / 2, y, { align: "center" });
 y += 6;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(10);
 doc.setTextColor(120);
 doc.text("Z-READ", pageW / 2, y, { align: "center" });
 doc.setTextColor(0);
 y += 8;

 const printedAt = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
 });

 doc.setFontSize(9);
 const colW = (pageW - margin * 2) / 2;
 doc.setFont("helvetica", "bold");
 doc.text("Location:", margin, y);
 doc.text("Period:", margin + colW, y);
 doc.setFont("helvetica", "normal");
 doc.text(locationName, margin + 18, y);
 doc.text(dateRangeLabel, margin + colW + 14, y);
 y += 5;
 doc.setFont("helvetica", "bold");
 doc.text("Range:", margin, y);
 doc.text("Printed:", margin + colW, y);
 doc.setFont("helvetica", "normal");
 doc.text(rangeText, margin + 18, y);
 doc.text(printedAt, margin + colW + 14, y);
 y += 8;

 doc.setDrawColor(180);
 doc.line(margin, y, pageW - margin, y);
 y += 6;

 const stats: Array<[string, string]> = [
  ["Sales #", String(takings.salesCount)],
  ["Refunds #", String(takings.refundsCount)],
  ["Voids #", String(takings.voidsCount)],
  ["Gross sales", formatCurrency(takings.grossSales)],
  ["Refunds", formatCurrency(takings.refundsGross)],
  ["Net revenue", formatCurrency(takings.netRevenue)],
 ];
 const statColW = (pageW - margin * 2) / 3;
 stats.forEach(([label, value], i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = margin + col * statColW;
  const yy = y + row * 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(label.toUpperCase(), x, yy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(value, x, yy + 5);
 });
 y += 12 * Math.ceil(stats.length / 3) + 4;

 doc.setDrawColor(180);
 doc.line(margin, y, pageW - margin, y);
 y += 6;

 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 const colMethod = margin;
 const colIn = margin + 60;
 const colOut = margin + 100;
 const colNet = margin + 140;
 doc.setTextColor(120);
 doc.text("Method", colMethod, y);
 doc.text("In", colIn, y, { align: "right" });
 doc.text("Out", colOut, y, { align: "right" });
 doc.text("Net", colNet, y, { align: "right" });
 doc.setTextColor(0);
 y += 2;
 doc.line(margin, y, pageW - margin, y);
 y += 5;

 doc.setFont("helvetica", "normal");
 (["cash", "card", "bank", "credit"] as const).forEach((m) => {
  doc.text(m.charAt(0).toUpperCase() + m.slice(1), colMethod, y);
  doc.text(formatCurrency(pb[m].in), colIn, y, { align: "right" });
  doc.text(formatCurrency(pb[m].out), colOut, y, { align: "right" });
  if (pb[m].net < 0) doc.setTextColor(200, 0, 0);
  doc.text(formatCurrency(pb[m].net), colNet, y, { align: "right" });
  doc.setTextColor(0);
  y += 6;
 });

 y += 1;
 doc.setDrawColor(80);
 doc.line(margin, y, pageW - margin, y);
 y += 5;
 doc.setFont("helvetica", "bold");
 doc.text("TOTAL", colMethod, y);
 doc.text(formatCurrency(totalIn), colIn, y, { align: "right" });
 doc.text(formatCurrency(totalOut), colOut, y, { align: "right" });
 doc.text(formatCurrency(totalNet), colNet, y, { align: "right" });
 y += 8;

 if (takings.accountBreakdown && takings.accountBreakdown.length > 0) {
  doc.setDrawColor(180);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("BY ACCOUNT (POTS)", margin, y);
  doc.setTextColor(0);
  y += 5;

  doc.setFontSize(9);
  const acctCols = {
   name: margin,
   type: margin + 60,
   in: margin + 100,
   out: margin + 135,
   net: margin + 170,
  };
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120);
  doc.text("Account", acctCols.name, y);
  doc.text("Type", acctCols.type, y);
  doc.text("In", acctCols.in, y, { align: "right" });
  doc.text("Out", acctCols.out, y, { align: "right" });
  doc.text("Net", acctCols.net, y, { align: "right" });
  doc.setTextColor(0);
  y += 2;
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  takings.accountBreakdown.forEach((row) => {
   const pageH = doc.internal.pageSize.getHeight();
   if (y > pageH - 30) {
    doc.addPage();
    y = 18;
   }
   doc.text(String(row.accountName).slice(0, 32), acctCols.name, y);
   doc.text(String(row.type).replace(/_/g, " "), acctCols.type, y);
   doc.text(formatCurrency(row.in), acctCols.in, y, { align: "right" });
   doc.text(formatCurrency(row.out), acctCols.out, y, { align: "right" });
   if (row.net < 0) doc.setTextColor(200, 0, 0);
   doc.text(formatCurrency(row.net), acctCols.net, y, { align: "right" });
   doc.setTextColor(0);
   y += 5;
  });
  y += 4;
 }

 const pageH = doc.internal.pageSize.getHeight();
 if (y > pageH - 30) {
  doc.addPage();
  y = 18;
 }

 doc.setDrawColor(180);
 doc.line(margin, y, pageW - margin, y);
 y += 6;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 doc.setTextColor(120);
 doc.text("— End of Z-Read —", pageW / 2, y, { align: "center" });
 doc.setTextColor(0);
 y += 14;

 const sigW = (pageW - margin * 2 - 10) / 2;
 doc.line(margin, y, margin + sigW, y);
 doc.line(margin + sigW + 10, y, pageW - margin, y);
 doc.setFontSize(8);
 doc.setTextColor(120);
 doc.text("Cashier signature", margin, y + 4);
 doc.text("Manager signature", margin + sigW + 10, y + 4);

 return doc;
}

export function openZReadPdfInNewTab(params: ZReadPdfParams) {
 const doc = buildZReadPdf(params);
 const blob = doc.output("blob");
 const url = URL.createObjectURL(blob);
 const win = window.open(url, "_blank", "noopener,noreferrer");
 if (!win) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener,noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
 }
 setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

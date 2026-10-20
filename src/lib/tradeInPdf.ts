/**
 * Trade-in receipt / agreement PDF (A4, built in the browser with jsPDF like the invoices).
 * Page 1: shop header, customer, devices, amount paid, terms + customer signature.
 * Page 2 (when present): ID document photos — shop copy.
 */
import { jsPDF } from "jspdf";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import type {
 PayoutMethod,
 TradeIn,
 TradeInFileWithData,
 TradeInLocation,
 TradeInMeta,
} from "@/app/(routes)/trade-ins/types";
import { PAYOUT_LABELS } from "@/app/(routes)/trade-ins/types";

export interface TradeInPdfInput {
 tradeIn: TradeIn;
 files: TradeInFileWithData[];
 meta: TradeInMeta | null;
 location?: TradeInLocation | null;
}

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14; // margin
const CONTENT_W = PAGE_W - M * 2;

const money = (n: number) => `£${(Number(n) || 0).toFixed(2)}`;

function imageFormat(dataUrl: string | null | undefined): "PNG" | "JPEG" | null {
 if (!dataUrl) return null;
 if (dataUrl.startsWith("data:image/png")) return "PNG";
 if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
 return null;
}

/** Draw an image inside a box, keeping its aspect ratio. Returns the drawn height. */
function drawImageFit(doc: jsPDF, dataUrl: string, x: number, y: number, maxW: number, maxH: number, alignRight = false): number {
 const fmt = imageFormat(dataUrl);
 if (!fmt) return 0;
 try {
  const props = doc.getImageProperties(dataUrl);
  const ratio = Math.min(maxW / props.width, maxH / props.height);
  const w = props.width * ratio;
  const h = props.height * ratio;
  doc.addImage(dataUrl, fmt, alignRight ? x + maxW - w : x, y, w, h, undefined, "FAST");
  return h;
 } catch {
  return 0;
 }
}

function personName(v: TradeIn["completedBy"]): string {
 if (!v) return "";
 if (typeof v === "string") return "";
 return v.name || "";
}

export function buildTradeInPdf({ tradeIn, files, meta, location }: TradeInPdfInput): jsPDF {
 const doc = new jsPDF({ unit: "mm", format: "a4" });
 const about = meta?.about;
 const fileOf = (kind: string) => files.find((f) => f.kind === kind && f.dataUrl)?.dataUrl || null;
 let y = M;

 const ensureSpace = (h: number) => {
  if (y + h > PAGE_H - M - 8) {
   doc.addPage();
   y = M;
  }
 };

 // ── Header ──
 let headerLeftY = y;
 if (about?.logo && imageFormat(about.logo)) {
  const h = drawImageFit(doc, about.logo, M, y, 45, 18);
  if (h > 0) headerLeftY = y + h + 3;
 }
 const shopName = location?.name || about?.appName || "Trade-in";
 doc.setFont("helvetica", "bold");
 doc.setFontSize(13);
 doc.setTextColor(17, 24, 39);
 doc.text(shopName, M, headerLeftY + 4);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8.5);
 doc.setTextColor(75, 85, 99);
 const addrLines: string[] = [];
 if (location && (location.address || location.city || location.postcode)) {
  [location.address, location.city, location.postcode, location.country].forEach((l) => l && addrLines.push(String(l)));
 } else if (about?.companyAddress) {
  addrLines.push(...about.companyAddress.split(/\r?\n/));
 }
 if (location?.phone) addrLines.push(`Tel: ${location.phone}`);
 if (location?.email) addrLines.push(location.email);
 const companyNumber = location?.companyNumber || about?.companyNumber;
 if (companyNumber) addrLines.push(`Company no: ${companyNumber}`);
 let ly = headerLeftY + 9;
 addrLines.slice(0, 7).forEach((l) => {
  doc.text(l, M, ly);
  ly += 3.8;
 });

 doc.setFont("helvetica", "bold");
 doc.setFontSize(16);
 doc.setTextColor(17, 24, 39);
 doc.text("TRADE-IN RECEIPT", PAGE_W - M, y + 6, { align: "right" });
 doc.setFontSize(9);
 doc.setFont("helvetica", "normal");
 doc.setTextColor(55, 65, 81);
 const rightLines = [
  `Ref: ${tradeIn.reference || "—"}`,
  `Date: ${formatDateTimeLondon(tradeIn.completedAt || tradeIn.date || tradeIn.createdAt)}`,
  tradeIn.purchaseNumber ? `Stock ref: ${tradeIn.purchaseNumber}` : "",
 ].filter(Boolean);
 rightLines.forEach((l, i) => doc.text(l, PAGE_W - M, y + 12 + i * 4.5, { align: "right" }));

 y = Math.max(ly, y + 12 + rightLines.length * 4.5) + 3;
 doc.setDrawColor(209, 213, 219);
 doc.line(M, y, PAGE_W - M, y);
 y += 6;

 // ── Customer ──
 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 doc.setTextColor(17, 24, 39);
 doc.text("Customer (seller)", M, y);
 y += 5;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9.5);
 const cust = tradeIn.customer || { name: "", phone: "", email: "" };
 const custRows: [string, string][] = [
  ["Name", cust.name || "—"],
  ["Mobile", cust.phone || "—"],
 ];
 if (cust.email) custRows.push(["Email", cust.email]);
 custRows.forEach(([k, v]) => {
  doc.setTextColor(107, 114, 128);
  doc.text(k, M, y);
  doc.setTextColor(17, 24, 39);
  doc.text(v, M + 22, y);
  y += 5;
 });
 y += 3;

 // ── Items table ──
 const cols = [
  { key: "no", label: "#", w: 8 },
  { key: "device", label: "Device", w: 68 },
  { key: "imei", label: "IMEI / Serial", w: 44 },
  { key: "cond", label: "Condition / notes", w: 42 },
  { key: "price", label: "Paid", w: CONTENT_W - 8 - 68 - 44 - 42 },
 ];
 const drawHeaderRow = () => {
  doc.setFillColor(243, 244, 246);
  doc.rect(M, y - 4, CONTENT_W, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  let x = M + 1.5;
  cols.forEach((c) => {
   if (c.key === "price") doc.text(c.label, x + c.w - 3, y, { align: "right" });
   else doc.text(c.label, x, y);
   x += c.w;
  });
  y += 6;
 };
 ensureSpace(20);
 drawHeaderRow();
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8.5);
 (tradeIn.items || []).forEach((it, idx) => {
  const deviceLines = doc.splitTextToSize(it.description || "Item", cols[1].w - 3);
  const sub = [it.grade ? `Grade ${it.grade}` : "", it.category].filter(Boolean).join(" · ");
  const deviceAll = sub ? [...deviceLines, sub] : deviceLines;
  const imeiText = it.isOtherItem
   ? [`${it.barcode ? `${it.barcode} · ` : ""}Qty ${it.quantity}`]
   : (it.imeis || []).flatMap((s) => doc.splitTextToSize(s, cols[2].w - 3));
  const condLines = it.note ? doc.splitTextToSize(it.note, cols[3].w - 3) : ["—"];
  const qty = it.isOtherItem ? it.quantity || 0 : (it.imeis || []).length || 1;
  const lineTotal = (Number(it.purchasePrice) || 0) * qty;
  const priceLines = qty > 1 ? [money(lineTotal), `${qty} × ${money(it.purchasePrice)}`] : [money(lineTotal)];
  const rowLines = Math.max(deviceAll.length, imeiText.length, condLines.length, priceLines.length);
  const rowH = rowLines * 3.8 + 2.5;
  if (y + rowH > PAGE_H - M - 8) {
   doc.addPage();
   y = M + 4;
   drawHeaderRow();
   doc.setFont("helvetica", "normal");
   doc.setFontSize(8.5);
  }
  let x = M + 1.5;
  doc.setTextColor(17, 24, 39);
  doc.text(String(idx + 1), x, y);
  x += cols[0].w;
  deviceAll.forEach((l: string, i: number) => {
   doc.setTextColor(i < deviceLines.length ? 17 : 107, i < deviceLines.length ? 24 : 114, i < deviceLines.length ? 39 : 128);
   doc.text(l, x, y + i * 3.8);
  });
  x += cols[1].w;
  doc.setTextColor(17, 24, 39);
  doc.setFont("courier", "normal");
  imeiText.forEach((l: string, i: number) => doc.text(l, x, y + i * 3.8));
  doc.setFont("helvetica", "normal");
  x += cols[2].w;
  doc.setTextColor(55, 65, 81);
  condLines.forEach((l: string, i: number) => doc.text(l, x, y + i * 3.8));
  x += cols[3].w;
  doc.setTextColor(17, 24, 39);
  priceLines.forEach((l, i) => {
   if (i > 0) doc.setTextColor(107, 114, 128);
   doc.text(l, x + cols[4].w - 3, y + i * 3.8, { align: "right" });
  });
  y += rowH;
  doc.setDrawColor(229, 231, 235);
  doc.line(M, y - 3, PAGE_W - M, y - 3);
 });

 // ── Total ──
 ensureSpace(16);
 y += 2;
 doc.setFont("helvetica", "bold");
 doc.setFontSize(11);
 doc.setTextColor(17, 24, 39);
 doc.text("Total paid to customer", PAGE_W - M - 40, y, { align: "right" });
 doc.text(money(tradeIn.totalAmount), PAGE_W - M - 1.5, y, { align: "right" });
 y += 5;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 doc.setTextColor(75, 85, 99);
 const payout = PAYOUT_LABELS[(tradeIn.payoutMethod || "cash") as PayoutMethod] || tradeIn.payoutMethod;
 doc.text(`Paid by: ${payout}   ·   Items: ${tradeIn.totalUnits || (tradeIn.items || []).length}`, PAGE_W - M - 1.5, y, { align: "right" });
 y += 8;

 // ── Notes ──
 if (tradeIn.notes) {
  const noteLines = doc.splitTextToSize(tradeIn.notes, CONTENT_W);
  ensureSpace(8 + noteLines.length * 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Notes", M, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(noteLines, M, y);
  y += noteLines.length * 3.8 + 4;
 }

 // ── Terms ──
 const termsText = (tradeIn.termsText || "").trim();
 if (termsText) {
  const termLines = doc.splitTextToSize(termsText, CONTENT_W);
  ensureSpace(12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Terms & conditions", M, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  termLines.forEach((l: string) => {
   ensureSpace(4);
   doc.text(l, M, y);
   y += 3.5;
  });
  y += 1.5;
  if (tradeIn.termsAccepted) {
   ensureSpace(5);
   doc.setFontSize(8);
   doc.setTextColor(21, 128, 61);
   const via = tradeIn.termsAcceptedVia === "phone" ? "on phone" : "in store";
   doc.text(`Accepted by the customer ${via} on ${formatDateTimeLondon(tradeIn.termsAcceptedAt)}.`, M, y);
   y += 5;
  }
 }

 // ── Signature ──
 const signature = fileOf("signature");
 ensureSpace(38);
 y += 3;
 const sigTop = y;
 if (signature) drawImageFit(doc, signature, M, sigTop, 70, 24);
 doc.setDrawColor(156, 163, 175);
 doc.line(M, sigTop + 26, M + 75, sigTop + 26);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8.5);
 doc.setTextColor(75, 85, 99);
 doc.text(`Customer signature — ${cust.name || ""}`, M, sigTop + 30);
 const staff = personName(tradeIn.completedBy);
 doc.line(PAGE_W - M - 65, sigTop + 26, PAGE_W - M, sigTop + 26);
 doc.text(`Staff${staff ? ` — ${staff}` : ""}`, PAGE_W - M - 65, sigTop + 30);
 y = sigTop + 36;

 // ── ID photos ──
 const idFront = fileOf("id_front");
 const idBack = fileOf("id_back");
 if (idFront || idBack) {
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("Customer ID document", M, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text(`${tradeIn.reference || ""} · ${cust.name || ""} · shop copy — keep securely`, M, y + 9);
  y += 16;
  const boxH = (PAGE_H - y - M - 16) / 2;
  [
   ["Front", idFront],
   ["Back", idBack],
  ].forEach(([label, url]) => {
   if (!url) return;
   doc.setFontSize(9);
   doc.setTextColor(55, 65, 81);
   doc.text(String(label), M, y);
   const h = drawImageFit(doc, String(url), M, y + 2, CONTENT_W, boxH);
   y += h + 10;
  });
 }

 // Footer page numbers
 const pages = doc.getNumberOfPages();
 for (let i = 1; i <= pages; i++) {
  doc.setPage(i);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(`${tradeIn.reference || "Trade-in"} · page ${i} of ${pages}`, PAGE_W / 2, PAGE_H - 7, { align: "center" });
 }
 return doc;
}

export function tradeInPdfFileName(tradeIn: TradeIn): string {
 return `${tradeIn.reference || "trade-in"}.pdf`;
}

/** Open the PDF in a new tab (browser print dialog from there). Falls back to download if pop-ups are blocked. */
export function openTradeInPdf(input: TradeInPdfInput): void {
 const doc = buildTradeInPdf(input);
 const url = URL.createObjectURL(doc.output("blob"));
 const w = window.open(url, "_blank");
 if (!w) {
  const a = document.createElement("a");
  a.href = url;
  a.download = tradeInPdfFileName(input.tradeIn);
  document.body.appendChild(a);
  a.click();
  a.remove();
 }
 setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadTradeInPdf(input: TradeInPdfInput): void {
 const doc = buildTradeInPdf(input);
 doc.save(tradeInPdfFileName(input.tradeIn));
}

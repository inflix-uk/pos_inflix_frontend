"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
 Search,
 Plus,
 Trash2,
 Package,
 Smartphone,
 MapPin,
 Printer,
 Eye,
 X,
 ArrowLeft,
 HelpCircle,
 QrCode,
} from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { buildQrPayload } from "@/lib/qrPayload";
import { labelsApi } from "./service/labelsApi";
import {
 type ProductLabelRow,
 type SerialLabelRow,
 type LocationLabelRow,
 type LabelTemplate,
 type TabId,
 type CodeKind,
 type LabelTypography,
 THERMAL_LABEL_57x32,
 DEFAULT_LABEL_TYPOGRAPHY,
} from "./types";
import { jsPDF } from "jspdf";
import { printLabelsPdf } from "@/services/printService";

const MM_TO_PX = 3.78; // ~96 dpi
const MM_PER_PT_LINE = 0.3527;

const LABEL_TEMPLATE = THERMAL_LABEL_57x32;

function FieldLabel({
 htmlFor,
 label,
 tip,
 className = "",
}: {
 htmlFor?: string;
 label: string;
 tip?: string;
 className?: string;
}) {
 return (
 <div className={`flex flex-wrap items-center gap-1 ${className}`}>
 <label htmlFor={htmlFor} className="text-xs font-semibold text-neutral-700">
 {label}
 </label>
 {tip ? (
 <span className="relative inline-flex shrink-0 group">
  <button
  type="button"
  className="rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1"
  aria-label={tip}
  >
  <HelpCircle className="h-3.5 w-3.5" strokeWidth={2} />
  </button>
  <span
  role="tooltip"
  className="pointer-events-none absolute left-1/2 z-[100] -translate-x-1/2 bottom-[calc(100%+8px)] w-60 max-w-[min(15rem,calc(100vw-2rem))] rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left text-[11px] font-normal leading-snug text-neutral-600 shadow-lg opacity-0 invisible transition-all duration-150 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible"
  >
  {tip}
  </span>
 </span>
 ) : null}
 </div>
 );
}

type FlatLabelItem =
 | {
 type: "product";
 id: string;
 name: string;
 sku: string;
 barcode?: string;
 salePrice?: number;
 categoryName?: string;
 variantDisplay?: string;
 variantAttributes?: { name: string }[];
 }
 | {
 type: "serial";
 id: string;
 name: string;
 sku: string;
 barcode?: string;
 salePrice?: number;
 categoryName?: string;
 variantDisplay?: string;
 }
 | { type: "location"; id: string; name: string };

function normalizeLabelSpaces(s: string): string {
 return s.replace(/\s*·\s*/g, " ").replace(/\s+/g, " ").trim();
}

function collapseConsecutiveTokens(s: string): string {
 const tokens = normalizeLabelSpaces(s).split(/\s+/).filter(Boolean);
 const out: string[] = [];
 let prevLower = "";
 for (const t of tokens) {
 const tl = t.toLowerCase();
 if (tl === prevLower) continue;
 out.push(t);
 prevLower = tl;
 }
 return out.join(" ");
}

function getLabelDisplayTitle(item: FlatLabelItem): string {
 if (item.type === "location") return item.name || "—";
 const primary = item.type === "serial" ? item.name || item.id : item.name || "—";

 if (item.type === "product") {
 if (item.variantDisplay?.trim()) {
 return collapseConsecutiveTokens(item.variantDisplay);
 }
 if (item.variantAttributes?.length) {
 return collapseConsecutiveTokens(item.variantAttributes.map((a) => a.name).filter(Boolean).join(" "));
 }
 return primary;
 }
 if (item.type === "serial") {
 if (item.variantDisplay?.trim()) {
 return collapseConsecutiveTokens(item.variantDisplay);
 }
 return primary;
 }
 return primary;
}

function getEncodeValue(item: FlatLabelItem): string {
 const itemBarcode = item.type === "product" ? item.barcode : item.type === "serial" ? item.barcode : undefined;
 if (item.type === "serial") return item.id;
 if (item.type === "product") return String(itemBarcode || item.sku || item.id);
 return item.id;
}

function getQrPayloadForItem(item: FlatLabelItem, qrEncodesBarcodeOnly: boolean): string {
 const enc = getEncodeValue(item);
 if (qrEncodesBarcodeOnly && (item.type === "product" || item.type === "serial") && enc) return enc;
 if (item.type === "product") return buildQrPayload("product", item.id);
 if (item.type === "serial") return buildQrPayload("serial", item.id);
 return buildQrPayload("location", item.id);
}

async function barcodeToPngDataUrl(
 value: string,
 barHeightPx: number
): Promise<{ dataUrl: string; wPx: number; hPx: number } | null> {
 if (!value || typeof document === "undefined") return null;
 const canvas = document.createElement("canvas");
 try {
 JsBarcode(canvas, value, {
 format: "CODE128",
 width: 1.2,
 height: barHeightPx,
 displayValue: false,
 margin: 2,
 });
 return { dataUrl: canvas.toDataURL("image/png"), wPx: canvas.width, hPx: canvas.height };
 } catch {
 return null;
 }
}

async function buildLabelsPdf(
 items: FlatLabelItem[],
 template: LabelTemplate,
 opts: {
 codeKind: CodeKind;
 qrEncodesBarcodeOnly: boolean;
 includeSku: boolean;
 includePrice: boolean;
 typography: LabelTypography;
 qrSizeMm: number;
 }
): Promise<string> {
 const doc = new jsPDF({ unit: "mm", format: [template.pageWidth, template.pageHeight], hotfixes: ["px_scaling"] });
 const pad = 1;
 const innerW = template.labelWidth - pad * 2;
 const innerH = template.labelHeight - pad * 2;

 for (let i = 0; i < items.length; i++) {
 const col = i % template.cols;
 const row = Math.floor(i / template.cols);
 if (row > 0 && row % template.rows === 0) {
 doc.addPage([template.pageWidth, template.pageHeight], "p");
 }
 const pageRow = row % template.rows;
 const lx = template.marginLeft + col * (template.labelWidth + template.gapX);
 const ly = template.marginTop + pageRow * (template.labelHeight + template.gapY);

 const item = items[i];
 const payload = getQrPayloadForItem(item, opts.qrEncodesBarcodeOnly);
 const barValue = String(getEncodeValue(item) || payload).slice(0, 80);
 const itemBarcode = item.type === "product" ? item.barcode : item.type === "serial" ? item.barcode : undefined;

 let textX = lx + pad;
 let textYStart = ly + pad;
 let textW = innerW;

 if (opts.codeKind === "qr") {
 const qrMm = Math.min(Math.max(8, opts.qrSizeMm), innerH - 1, innerW * 0.55);
 try {
 const qrDataUrl = await QRCode.toDataURL(payload, { width: 240, margin: 1 });
 doc.addImage(qrDataUrl, "PNG", lx + pad, ly + pad, qrMm, qrMm);
 } catch {
 doc.setFontSize(opts.typography.metaPt);
 doc.text(payload.slice(0, 28), lx + pad, ly + innerH / 2);
 }
 textX = lx + pad + qrMm + 1.2;
 textW = Math.max(10, lx + pad + innerW - textX);
 } else {
 const barMaxH = Math.min(7, innerH * 0.4);
 const barCanvas = await barcodeToPngDataUrl(barValue, 48);
 if (barCanvas) {
 const { dataUrl, wPx, hPx } = barCanvas;
 let drawW = innerW;
 let drawH = (hPx / wPx) * drawW;
 if (drawH > barMaxH) {
  drawH = barMaxH;
  drawW = (wPx / hPx) * drawH;
 }
 const bx = lx + pad + (innerW - drawW) / 2;
 doc.addImage(dataUrl, "PNG", bx, ly + pad, drawW, drawH);
 textYStart = ly + pad + drawH + 1;
 } else {
 doc.setFontSize(opts.typography.metaPt);
 doc.text("Invalid barcode", lx + pad, ly + 5);
 textYStart = ly + 8;
 }
 textX = lx + pad;
 textW = innerW;
 }

 let ty = textYStart + opts.typography.titlePt * MM_PER_PT_LINE;
 doc.setFontSize(opts.typography.titlePt);
 const titleText = getLabelDisplayTitle(item).slice(0, 400);
 const nameLines = doc.splitTextToSize(titleText || "—", textW);
 doc.text(nameLines, textX, ty);
 ty += Math.max(nameLines.length, 1) * opts.typography.titlePt * MM_PER_PT_LINE * 1.12;

 doc.setFontSize(opts.typography.serialPt);
 if (item.type === "serial") {
 const lines = doc.splitTextToSize(item.id.slice(0, 100), textW);
 doc.text(lines, textX, ty);
 ty += lines.length * opts.typography.serialPt * MM_PER_PT_LINE * 1.12;
 } else if (item.type === "product" && itemBarcode) {
 const lines = doc.splitTextToSize(String(itemBarcode).slice(0, 100), textW);
 doc.text(lines, textX, ty);
 ty += lines.length * opts.typography.serialPt * MM_PER_PT_LINE * 1.12;
 }

 doc.setFontSize(opts.typography.metaPt);
 if (opts.includeSku && item.type === "product" && item.sku) {
 const skuLines = doc.splitTextToSize(`SKU: ${item.sku}`.slice(0, 100), textW);
 if (ty < ly + template.labelHeight - pad - 2) {
 doc.text(skuLines, textX, ty);
 ty += skuLines.length * opts.typography.metaPt * MM_PER_PT_LINE * 1.1;
 }
 }
 if (opts.includePrice && item.type !== "location" && item.salePrice != null) {
 if (ty < ly + template.labelHeight - pad - 1) {
 doc.text(`£${Number(item.salePrice).toFixed(2)}`, textX, ty);
 }
 }
 }
 return doc.output("datauristring").split(",")[1] || "";
}

function QrImage({ payload, sizePx }: { payload: string; sizePx: number }) {
 const [src, setSrc] = useState<string | null>(null);
 useEffect(() => {
 if (!payload) return;
 QRCode.toDataURL(payload, { width: sizePx, margin: 1 }).then(setSrc).catch(() => setSrc(""));
 }, [payload, sizePx]);
 if (!src) return <div className="bg-neutral-100 animate-pulse rounded" style={{ width: sizePx, height: sizePx }} />;
 return <img src={src} alt="QR" className="rounded" width={sizePx} height={sizePx} />;
}

function BarcodeImage({ value, heightPx = 36, width = 1 }: { value: string; heightPx?: number; width?: number }) {
 const svgRef = useRef<SVGSVGElement>(null);
 useEffect(() => {
 if (!svgRef.current || !value) return;
 try {
 svgRef.current.innerHTML = "";
 JsBarcode(svgRef.current, value, {
 format: "CODE128",
 width,
 height: heightPx,
 displayValue: false,
 margin: 2,
 });
 } catch {
 // invalid chars etc – leave empty
 }
 }, [value, heightPx, width]);
 if (!value) return null;
 return <svg ref={svgRef} className="max-w-full" />;
}

export default function PrintQrCodePage() {
 const [activeTab, setActiveTab] = useState<TabId>("product");
 const [codeKind, setCodeKind] = useState<CodeKind>("qr");
 const [typography, setTypography] = useState<LabelTypography>(() => ({ ...DEFAULT_LABEL_TYPOGRAPHY }));
 const [includePrice, setIncludePrice] = useState(false);
 const [includeSku, setIncludeSku] = useState(true);
 const [qrEncodesBarcodeOnly, setQrEncodesBarcodeOnly] = useState(true);
 const [labelQrSizeMm, setLabelQrSizeMm] = useState(13);
 const [fullProductWithVariants, setFullProductWithVariants] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const [showPreview, setShowPreview] = useState(false);

 const [productSearch, setProductSearch] = useState("");
 const [productSearchResults, setProductSearchResults] = useState<
 {
 productId: string;
 name: string;
 sku: string;
 barcode?: string;
 salePrice?: number;
 categoryName?: string;
 variantDisplay?: string;
 variantAttributes?: { name: string; slug: string }[];
 }[]
 >([]);
 const [productRows, setProductRows] = useState<ProductLabelRow[]>([]);

 const [serialInput, setSerialInput] = useState("");
 const [serialRows, setSerialRows] = useState<SerialLabelRow[]>([]);
 const serialInputRef = useRef<HTMLTextAreaElement>(null);

 const [locationRows, setLocationRows] = useState<LocationLabelRow[]>([]);
 const [locations, setLocations] = useState<LocationLabelRow[]>([]);

 const showMsg = useCallback((type: "success" | "error", text: string) => {
 setMessage({ type, text });
 setTimeout(() => setMessage(null), 3000);
 }, []);

 useEffect(() => {
 if (activeTab === "location") {
 labelsApi.getLocations().then(setLocations).catch(() => setLocations([]));
 }
 }, [activeTab]);

 const searchProducts = useCallback(() => {
 if (!productSearch.trim()) return;
 labelsApi.getProducts(productSearch.trim(), fullProductWithVariants).then((data) => {
 setProductSearchResults(data);
 }).catch(() => showMsg("error", "Failed to search products"));
 }, [productSearch, fullProductWithVariants, showMsg]);

 const addProduct = useCallback((p: {
 productId: string;
 name: string;
 sku: string;
 barcode?: string;
 salePrice?: number;
 categoryName?: string;
 variantDisplay?: string;
 variantAttributes?: { name: string; slug: string }[];
 }) => {
 setProductRows((prev) => {
 const existing = prev.find((r) => r.productId === p.productId);
 if (existing) return prev.map((r) => r.productId === p.productId ? { ...r, quantity: r.quantity + 1 } : r);
 return [...prev, { ...p, quantity: 1 }];
 });
 setProductSearch("");
 setProductSearchResults([]);
 }, []);

 const setProductQty = useCallback((productId: string, quantity: number) => {
 setProductRows((prev) => prev.map((r) => r.productId === productId ? { ...r, quantity: Math.max(0, quantity) } : r).filter((r) => r.quantity > 0));
 }, []);

 const addSerial = useCallback(async () => {
 const raw = serialInput.trim();
 if (!raw) return;
 const lines = raw.split(/\n/).map((s) => s.trim()).filter(Boolean);
 if (lines.length === 0) return;
 try {
 const data = await labelsApi.resolveSerials(lines);
 setSerialRows((prev) => {
 const seen = new Set(prev.map((r) => r.serial));
 const added: SerialLabelRow[] = data.filter((r: SerialLabelRow) => !seen.has(r.serial));
 return [...prev, ...added];
 });
 setSerialInput("");
 serialInputRef.current?.focus();
 if (lines.length > 1) showMsg("success", `Resolved ${lines.length} serials`);
 } catch {
 showMsg("error", "Failed to resolve serials");
 }
 }, [serialInput, showMsg]);

 const removeSerial = useCallback((serial: string) => {
 setSerialRows((prev) => prev.filter((r) => r.serial !== serial));
 }, []);

 const toggleLocation = useCallback((loc: LocationLabelRow) => {
 setLocationRows((prev) => {
 const has = prev.some((r) => r.locationId === loc.locationId);
 if (has) return prev.filter((r) => r.locationId !== loc.locationId);
 return [...prev, loc];
 });
 }, []);

 const getFlatLabels = useCallback(() => {
 if (activeTab === "product") {
 return productRows.flatMap((r) =>
 Array.from({ length: r.quantity }, () => ({
  type: "product" as const,
  id: r.productId,
  name: r.name,
  sku: r.sku,
  barcode: r.barcode,
  salePrice: r.salePrice,
  categoryName: r.categoryName,
  variantDisplay: r.variantDisplay,
  variantAttributes: r.variantAttributes,
 }))
 );
 }
 if (activeTab === "serial") {
 return serialRows.map((r) => ({
 type: "serial" as const,
 id: r.serial,
 name: r.productName || r.serial,
 sku: r.sku || "",
 barcode: r.barcode ?? undefined,
 salePrice: r.purchasePrice ?? undefined,
 categoryName: r.categoryName ?? undefined,
 variantDisplay: r.variantDisplay ?? undefined,
 }));
 }
 return locationRows.map((r) => ({ type: "location" as const, id: r.locationId, name: r.name }));
 }, [activeTab, productRows, serialRows, locationRows]);

 const flatLabels = getFlatLabels();
 const toPrint = flatLabels;

 const handlePrint = useCallback(async () => {
 if (toPrint.length === 0) {
 showMsg("error", "No labels to print");
 return;
 }
 try {
 const pdfBase64 = await buildLabelsPdf(toPrint, LABEL_TEMPLATE, {
 codeKind,
 qrEncodesBarcodeOnly,
 includeSku,
 includePrice,
 typography,
 qrSizeMm: labelQrSizeMm,
 });
 const printResult = pdfBase64
 ? await printLabelsPdf(pdfBase64, "inventory-qr-labels")
 : { sent: false as boolean };
 if (printResult.sent) {
 showMsg("success", "Labels sent to printer");
 } else {
 if (printResult.error) {
  showMsg("error", printResult.error);
 }
 setShowPreview(true);
 requestAnimationFrame(() => {
  requestAnimationFrame(() => {
  window.print();
  });
 });
 }
 await labelsApi.logPrint({
 type: activeTab,
 counts: { product: activeTab === "product" ? toPrint.length : 0, serial: activeTab === "serial" ? toPrint.length : 0, location: activeTab === "location" ? toPrint.length : 0 },
 template: LABEL_TEMPLATE.id,
 });
 } catch {
 setShowPreview(true);
 requestAnimationFrame(() => {
 requestAnimationFrame(() => {
  window.print();
 });
 });
 try {
 await labelsApi.logPrint({
  type: activeTab,
  counts: { product: activeTab === "product" ? toPrint.length : 0, serial: activeTab === "serial" ? toPrint.length : 0, location: activeTab === "location" ? toPrint.length : 0 },
  template: LABEL_TEMPLATE.id,
 });
 } catch {
 // non-blocking
 }
 }
 }, [activeTab, toPrint, qrEncodesBarcodeOnly, codeKind, includeSku, includePrice, typography, labelQrSizeMm, showMsg]);

 return (
 <div className="@container min-h-screen bg-neutral-50 p-3 @[640px]:p-4">
 <div className="print:hidden max-w-7xl mx-auto">
 {message && (
 <div
  className={`fixed top-4 right-4 z-50 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 rounded-lg shadow-md border text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-green-50 text-green-700 border-green-200"
  : "bg-red-50 text-red-700 border-red-200"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Header */}
 <div className="mb-3 @[640px]:mb-4">
 <Link
  href="/inventory"
  className="inline-flex items-center gap-1 @[640px]:gap-1.5 text-[11px] @[640px]:text-xs text-neutral-500 hover:text-orange-600 mb-2 @[640px]:mb-3 transition-colors"
 >
  <ArrowLeft className="h-3 w-3 @[640px]:h-3.5 @[640px]:w-3.5" />
  Back to inventory
 </Link>
 <div className="flex items-center gap-2 @[640px]:gap-3">
  <div className="flex h-8 w-8 @[640px]:h-9 @[640px]:w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500">
  <QrCode className="h-4 w-4 @[640px]:h-4.5 @[640px]:w-4.5 text-white" strokeWidth={2} />
  </div>
  <div>
  <h1 className="text-base @[640px]:text-lg font-semibold text-neutral-900">Print QR & labels</h1>
  <p className="text-[11px] @[640px]:text-xs text-neutral-500">
  57x32 mm thermal labels — QR or Code128. Hover <HelpCircle className="inline h-3 w-3 text-neutral-400 align-text-bottom" /> icons for tips.
  </p>
  </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 p-1 mb-3 @[640px]:mb-4 rounded-lg bg-neutral-100 border border-neutral-200 w-fit">
 {(["product", "serial", "location"] as TabId[]).map((tab) => (
  <button
  key={tab}
  type="button"
  onClick={() => setActiveTab(tab)}
  className={`inline-flex items-center gap-1 @[640px]:gap-1.5 px-2.5 @[640px]:px-3 py-1 @[640px]:py-1.5 text-[11px] @[640px]:text-xs font-medium rounded-md transition-all ${
  activeTab === tab
  ? "bg-orange-500 text-white shadow-sm"
  : "text-neutral-600 hover:bg-white hover:text-neutral-900"
  }`}
  >
  {tab === "product" && <Package className="w-3 h-3 @[640px]:w-3.5 @[640px]:h-3.5" />}
  {tab === "serial" && <Smartphone className="w-3 h-3 @[640px]:w-3.5 @[640px]:h-3.5" />}
  {tab === "location" && <MapPin className="w-3 h-3 @[640px]:w-3.5 @[640px]:h-3.5" />}
  {tab === "product" && "Product labels"}
  {tab === "serial" && "IMEI / Serial"}
  {tab === "location" && "Locations"}
  </button>
 ))}
 </div>

 <div className="grid grid-cols-1 @[1024px]:grid-cols-2 gap-3 @[640px]:gap-4">
 {/* Left Panel */}
 <div className="rounded-lg border border-neutral-200 bg-white p-4 print:hidden">
  {activeTab === "product" && (
  <>
  <div className="mb-1.5">
  <FieldLabel
   label="Find products"
   tip="Search catalog products by name or SKU, or match a purchase line by barcode. Turn on 'Full product (with variants)' below to load category variant order for catalog items."
  />
  </div>
  <div className="flex gap-2 mb-3">
  <input
   id="product-search"
   type="text"
   placeholder="Name, SKU, or purchase barcode..."
   value={productSearch}
   onChange={(e) => setProductSearch(e.target.value)}
   onKeyDown={(e) => e.key === "Enter" && searchProducts()}
   className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
  />
  <button
   type="button"
   onClick={searchProducts}
   className="rounded-lg bg-orange-500 text-white px-3 py-2 hover:bg-orange-600 transition-colors"
   aria-label="Search"
  >
   <Search className="w-4 h-4" />
  </button>
  </div>
  {productSearchResults.length > 0 && (
  <ul className="border border-neutral-200 rounded-lg mb-3 max-h-40 overflow-y-auto bg-white divide-y divide-neutral-100">
   {productSearchResults.map((p) => (
   <li key={p.productId}>
   <button
   type="button"
   onClick={() => addProduct(p)}
   className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-sm flex justify-between items-center gap-2 transition-colors"
   >
   <span className="font-medium text-neutral-800">{p.name}</span>
   <span className="text-xs text-neutral-400 font-mono shrink-0">{p.sku}</span>
   <Plus className="w-4 h-4 text-orange-500 shrink-0" />
   </button>
   </li>
   ))}
  </ul>
  )}
  <div className="space-y-1.5">
  {productRows.length === 0 && (
   <p className="text-xs text-neutral-400 italic py-4 text-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
   No products in the print queue yet.
   </p>
  )}
  {productRows.map((r) => (
   <div
   key={r.productId}
   className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
   >
   <span className="font-medium text-neutral-800">{r.name} <span className="text-orange-600">x{r.quantity}</span></span>
   <div className="flex items-center gap-0.5">
   <button type="button" onClick={() => setProductQty(r.productId, r.quantity - 1)} className="h-7 w-7 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm">-</button>
   <span className="w-7 text-center font-semibold text-neutral-800 text-xs">{r.quantity}</span>
   <button type="button" onClick={() => setProductQty(r.productId, r.quantity + 1)} className="h-7 w-7 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-sm">+</button>
   <button type="button" onClick={() => setProductQty(r.productId, 0)} className="p-1.5 ml-0.5 rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
   </div>
   </div>
  ))}
  </div>
  </>
  )}

  {activeTab === "serial" && (
  <>
  <div className="mb-3">
  <div className="mb-1.5">
   <FieldLabel
   htmlFor="serial-input"
   label="Scan or paste IMEI / serial"
   tip="One value per line or press Enter to add. We match each serial to stock so the label can show product and location."
   />
  </div>
  <textarea
   id="serial-input"
   ref={serialInputRef}
   placeholder="Scan or paste serials..."
   value={serialInput}
   onChange={(e) => setSerialInput(e.target.value)}
   onKeyDown={(e) => {
   if (e.key === "Enter" && !e.shiftKey) {
   e.preventDefault();
   addSerial();
   }
   }}
   rows={2}
   className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
  />
  <div className="flex gap-2 mt-2">
   <button
   type="button"
   onClick={addSerial}
   className="rounded-lg bg-orange-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-orange-600 transition-colors"
   >
   Add serials
   </button>
   <button
   type="button"
   onClick={() => {
   setSerialRows([]);
   setSerialInput("");
   serialInputRef.current?.focus();
   }}
   className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
   >
   Clear list
   </button>
  </div>
  </div>
  <ul className="space-y-1.5 max-h-44 overflow-y-auto">
  {serialRows.length === 0 && (
   <li className="text-xs text-neutral-400 italic py-4 text-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
   No serials yet — add from the field above.
   </li>
  )}
  {serialRows.map((r) => (
   <li
   key={r.serial}
   className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
   >
   <span className="font-mono text-neutral-900 shrink-0 min-w-0 truncate text-xs">{r.serial}</span>
   <span
   className={`text-[11px] font-medium ml-auto shrink-0 ${r.found ? "text-green-600" : "text-red-500"}`}
   >
   {r.found ? r.locationName || r.productName || "OK" : r.invalidReason || "Invalid"}
   </span>
   <button
   type="button"
   onClick={() => removeSerial(r.serial)}
   className="p-1 rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 shrink-0"
   aria-label="Remove serial"
   >
   <X className="w-3.5 h-3.5" />
   </button>
   </li>
  ))}
  </ul>
  </>
  )}

  {activeTab === "location" && (
  <div className="space-y-1.5">
  <div className="mb-1.5">
  <FieldLabel
   label="Locations"
   tip="Add each shelf or bin you want a sticker for. The code on the label identifies the location for scanning in the app."
  />
  </div>
  {locations.length === 0 ? (
  <p className="text-xs text-neutral-400 py-6 text-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
   No locations loaded.
  </p>
  ) : (
  locations.map((loc) => {
   const added = locationRows.some((r) => r.locationId === loc.locationId);
   return (
   <div
   key={loc.locationId}
   className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
   added
    ? "border-orange-300 bg-orange-50"
    : "border-neutral-200 bg-white hover:border-neutral-300"
   }`}
   >
   <span className="font-medium text-neutral-800 text-xs">
   {loc.name}{" "}
   {loc.type && <span className="text-neutral-400 font-normal">({loc.type})</span>}
   </span>
   <button
   type="button"
   onClick={() => toggleLocation(loc)}
   className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
    added
    ? "bg-orange-500 text-white"
    : "bg-neutral-100 text-neutral-600 hover:bg-orange-50 hover:text-orange-700"
   }`}
   >
   {added ? "Added" : "Add"}
   </button>
   </div>
   );
  })
  )}
  </div>
  )}

  {/* Options */}
  <div className="mt-4 pt-4 border-t border-neutral-100 print:hidden space-y-3">
  <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-500">
  <span className="font-semibold text-neutral-700">Label size:</span> {LABEL_TEMPLATE.pageWidth}x{LABEL_TEMPLATE.pageHeight} mm
  </div>
  <div>
  <div className="mb-1.5">
  <FieldLabel
   htmlFor="code-kind-select"
   label="Print as"
   tip="QR works well with phones and 2D scanners. Code128 is a linear barcode for traditional laser scanners."
  />
  </div>
  <select
  id="code-kind-select"
  value={codeKind}
  onChange={(e) => setCodeKind(e.target.value as CodeKind)}
  className="w-full max-w-xs rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
  >
  <option value="qr">QR code</option>
  <option value="barcode">Barcode (Code128)</option>
  </select>
  </div>

  {/* Typography */}
  <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
  <div className="flex flex-wrap items-center gap-2 mb-2">
  <FieldLabel
   label="Typography (pt)"
   tip="Title uses variant order when available. Serial shows IMEI or product barcode. Presets are a quick start."
  />
  <div className="flex gap-1.5 @[640px]:ml-auto">
   {(
   [
   ["Compact", { titlePt: 4, serialPt: 5, metaPt: 3.5 }],
   ["Default", { titlePt: 5, serialPt: 6, metaPt: 4 }],
   ["Large", { titlePt: 6, serialPt: 7, metaPt: 5 }],
   ] as const
   ).map(([label, preset]) => (
   <button
   key={label}
   type="button"
   onClick={() => setTypography({ titlePt: preset.titlePt, serialPt: preset.serialPt, metaPt: preset.metaPt })}
   className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 hover:border-orange-300 hover:text-orange-700 transition-colors"
   >
   {label}
   </button>
   ))}
  </div>
  </div>
  <div className="grid grid-cols-3 gap-2">
  <div>
   <FieldLabel htmlFor="typo-title" label="Title" tip="Product name and variants. Smaller fits longer titles." />
   <input
   id="typo-title"
   type="number"
   min={3}
   max={10}
   step={0.5}
   value={typography.titlePt}
   onChange={(e) =>
   setTypography((t) => ({ ...t, titlePt: Math.min(10, Math.max(3, parseFloat(e.target.value) || t.titlePt)) }))
   }
   className="mt-1 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-orange-500 outline-none"
   />
  </div>
  <div>
   <FieldLabel htmlFor="typo-serial" label="Serial" tip="Font size for the IMEI line or product barcode." />
   <input
   id="typo-serial"
   type="number"
   min={3}
   max={11}
   step={0.5}
   value={typography.serialPt}
   onChange={(e) =>
   setTypography((t) => ({ ...t, serialPt: Math.min(11, Math.max(3, parseFloat(e.target.value) || t.serialPt)) }))
   }
   className="mt-1 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-orange-500 outline-none"
   />
  </div>
  <div>
   <FieldLabel htmlFor="typo-meta" label="SKU / price" tip="Secondary line for SKU and price." />
   <input
   id="typo-meta"
   type="number"
   min={3}
   max={9}
   step={0.5}
   value={typography.metaPt}
   onChange={(e) =>
   setTypography((t) => ({ ...t, metaPt: Math.min(9, Math.max(3, parseFloat(e.target.value) || t.metaPt)) }))
   }
   className="mt-1 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-orange-500 outline-none"
   />
  </div>
  </div>
  </div>

  {codeKind === "qr" && (
  <div>
  <div className="mb-1">
   <FieldLabel
   label={`QR size (${labelQrSizeMm} mm)`}
   tip="Larger QR codes scan more easily but use more horizontal space."
   />
  </div>
  <input
   type="range"
   min={8}
   max={16}
   step={0.5}
   value={labelQrSizeMm}
   onChange={(e) => setLabelQrSizeMm(parseFloat(e.target.value) || 13)}
   className="w-full max-w-xs h-1.5 rounded-full accent-orange-500 bg-neutral-200 cursor-pointer"
  />
  </div>
  )}

  {(activeTab === "product" || activeTab === "serial") && (
  <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
  <div className="flex items-center gap-2">
   <input
   id="include-price"
   type="checkbox"
   className="w-3.5 h-3.5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
   checked={includePrice}
   onChange={(e) => setIncludePrice(e.target.checked)}
   />
   <FieldLabel htmlFor="include-price" label="Include price" tip="Shows sale price on the label when space allows." />
  </div>
  <div className="flex items-center gap-2">
   <input
   id="include-sku"
   type="checkbox"
   className="w-3.5 h-3.5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
   checked={includeSku}
   onChange={(e) => setIncludeSku(e.target.checked)}
   />
   <FieldLabel htmlFor="include-sku" label="Include SKU" tip="Prints the product SKU under the title." />
  </div>
  {codeKind === "qr" && (
   <div className="flex items-center gap-2">
   <input
   id="qr-plain"
   type="checkbox"
   className="w-3.5 h-3.5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
   checked={qrEncodesBarcodeOnly}
   onChange={(e) => setQrEncodesBarcodeOnly(e.target.checked)}
   />
   <FieldLabel htmlFor="qr-plain" label="QR encodes plain value only" tip="When on, the QR holds only barcode/SKU (products) or the serial (IMEI)." />
   </div>
  )}
  </div>
  )}
  {activeTab === "product" && (
  <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
  <div className="flex items-center gap-2">
   <input
   id="full-variants"
   type="checkbox"
   className="w-3.5 h-3.5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
   checked={fullProductWithVariants}
   onChange={(e) => setFullProductWithVariants(e.target.checked)}
   />
   <FieldLabel htmlFor="full-variants" label="Full product (with variants)" tip="Loads category variant order for the title (e.g. brand, model, storage)." />
  </div>
  </div>
  )}

  {/* Action Buttons */}
  <div className="flex gap-2 pt-1">
  <button
  type="button"
  onClick={() => setShowPreview(true)}
  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5"
  >
  <Eye className="w-3.5 h-3.5" /> Preview
  </button>
  <button
  type="button"
  onClick={handlePrint}
  disabled={toPrint.length === 0}
  className="rounded-lg bg-orange-500 text-white px-4 py-2 text-xs font-medium hover:bg-orange-600 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
  >
  <Printer className="w-3.5 h-3.5" /> Print
  </button>
  </div>
  </div>
 </div>

 {/* Right Panel - Preview */}
 <div
  className={`rounded-lg border border-neutral-200 bg-white p-3 @[640px]:p-4 ${
  showPreview ? "" : "hidden @[1024px]:block"
  }`}
 >
  <div className="flex justify-between items-center mb-3 print:hidden">
  <div className="flex items-center gap-2">
  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100">
  <Eye className="w-3.5 h-3.5 text-neutral-600" />
  </span>
  <div>
  <span className="text-xs font-semibold text-neutral-900">Live preview</span>
  <p className="text-[11px] text-neutral-400">Updates from your queue</p>
  </div>
  </div>
  {showPreview && (
  <button
  type="button"
  onClick={() => setShowPreview(false)}
  className="text-xs font-medium text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded-md hover:bg-neutral-50"
  >
  Close
  </button>
  )}
  </div>
  <div
  className="border border-neutral-200 rounded-lg bg-white overflow-auto"
  style={{
  width: LABEL_TEMPLATE.pageWidth * MM_TO_PX,
  height: LABEL_TEMPLATE.pageHeight * MM_TO_PX,
  maxWidth: "100%",
  }}
  >
  <div
  className="grid gap-0 p-0"
  style={{
  gridTemplateColumns: `repeat(${LABEL_TEMPLATE.cols}, ${LABEL_TEMPLATE.labelWidth * MM_TO_PX}px)`,
  gridTemplateRows: `repeat(${LABEL_TEMPLATE.rows}, ${LABEL_TEMPLATE.labelHeight * MM_TO_PX}px)`,
  paddingTop: LABEL_TEMPLATE.marginTop * MM_TO_PX,
  paddingLeft: LABEL_TEMPLATE.marginLeft * MM_TO_PX,
  gap: LABEL_TEMPLATE.gapX * MM_TO_PX,
  }}
  >
  {toPrint.slice(0, LABEL_TEMPLATE.cols * LABEL_TEMPLATE.rows).map((item, idx) => {
  const itemBarcode = item.type === "product" ? item.barcode : item.type === "serial" && "barcode" in item ? item.barcode : undefined;
  const payload = getQrPayloadForItem(item, qrEncodesBarcodeOnly);
  const barVal = getEncodeValue(item);
  const itemPrice = item.type === "product" ? item.salePrice : item.type === "serial" && "salePrice" in item ? item.salePrice : undefined;
  const qrPx = Math.min(Math.max(8, labelQrSizeMm), LABEL_TEMPLATE.labelHeight - 2, LABEL_TEMPLATE.labelWidth * 0.55) * MM_TO_PX;
  return (
   <div
   key={idx}
   className="flex flex-row items-start border border-neutral-200 bg-white overflow-hidden"
   style={{
   width: LABEL_TEMPLATE.labelWidth * MM_TO_PX,
   height: LABEL_TEMPLATE.labelHeight * MM_TO_PX,
   padding: `${1 * MM_TO_PX}px`,
   gap: `${1 * MM_TO_PX}px`,
   }}
   >
   {codeKind === "qr" && (
   <div className="shrink-0">
   <QrImage payload={payload} sizePx={qrPx} />
   </div>
   )}
   <div className={`min-w-0 flex-1 flex flex-col justify-center leading-tight ${codeKind === "barcode" ? "w-full items-stretch" : ""}`}>
   {codeKind === "barcode" && barVal && (
   <div className="flex justify-center w-full mb-0.5">
    <BarcodeImage value={String(barVal)} heightPx={22} width={1.1} />
   </div>
   )}
   <span
   style={{ fontSize: `${typography.titlePt}pt` }}
   className="font-medium w-full break-words [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical] overflow-hidden leading-tight"
   >
   {getLabelDisplayTitle(item)}
   </span>
   {item.type === "serial" && (
   <span style={{ fontSize: `${typography.serialPt}pt` }} className="font-mono truncate w-full">
    {item.id}
   </span>
   )}
   {item.type === "product" && itemBarcode && (
   <span style={{ fontSize: `${typography.serialPt}pt` }} className="font-mono truncate w-full">
    {itemBarcode}
   </span>
   )}
   {includeSku && item.type === "product" && item.sku && (
   <span style={{ fontSize: `${typography.metaPt}pt` }} className="text-neutral-500 truncate w-full">
    SKU: {item.sku}
   </span>
   )}
   {includePrice && itemPrice != null && item.type !== "location" && (
   <span style={{ fontSize: `${typography.metaPt}pt` }} className="font-medium">
    £{Number(itemPrice).toFixed(2)}
   </span>
   )}
   </div>
   </div>
  );
  })}
  </div>
  </div>
 </div>
 </div>
 </div>

 {/* Print-only area */}
 <div className="hidden print:block print:absolute print:inset-0 print:p-0 print:bg-white">
 <div
  className="grid gap-0"
  style={{
  gridTemplateColumns: `repeat(${LABEL_TEMPLATE.cols}, ${LABEL_TEMPLATE.labelWidth}mm)`,
  gridTemplateRows: `repeat(${Math.ceil(toPrint.length / LABEL_TEMPLATE.cols)}, ${LABEL_TEMPLATE.labelHeight}mm)`,
  paddingTop: `${LABEL_TEMPLATE.marginTop}mm`,
  paddingLeft: `${LABEL_TEMPLATE.marginLeft}mm`,
  gap: 0,
  }}
 >
  {toPrint.map((item, idx) => {
  const itemBarcode = item.type === "product" ? item.barcode : item.type === "serial" && "barcode" in item ? item.barcode : undefined;
  const payload = getQrPayloadForItem(item, qrEncodesBarcodeOnly);
  const barVal = getEncodeValue(item);
  const itemPrice = item.type === "product" ? item.salePrice : item.type === "serial" && "salePrice" in item ? item.salePrice : undefined;
  const qrPx = Math.min(Math.max(8, labelQrSizeMm), LABEL_TEMPLATE.labelHeight - 2, LABEL_TEMPLATE.labelWidth * 0.55) * 8;
  return (
  <div
  key={idx}
  className="flex flex-row items-start border border-gray-300 bg-white overflow-hidden"
  style={{
   width: `${LABEL_TEMPLATE.labelWidth}mm`,
   height: `${LABEL_TEMPLATE.labelHeight}mm`,
   padding: "1mm",
   gap: "1mm",
  }}
  >
  {codeKind === "qr" && (
   <div className="shrink-0">
   <QrImage payload={payload} sizePx={qrPx} />
   </div>
  )}
  <div className={`min-w-0 flex-1 flex flex-col justify-center leading-tight ${codeKind === "barcode" ? "w-full" : ""}`}>
   {codeKind === "barcode" && barVal && (
   <div className="flex justify-center w-full">
   <BarcodeImage value={String(barVal)} heightPx={20} width={1} />
   </div>
   )}
   <span
   style={{ fontSize: `${typography.titlePt}pt` }}
   className="font-medium w-full break-words [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical] overflow-hidden leading-tight"
   >
   {getLabelDisplayTitle(item)}
   </span>
   {item.type === "serial" && (
   <span style={{ fontSize: `${typography.serialPt}pt` }} className="font-mono truncate w-full">
   {item.id}
   </span>
   )}
   {item.type === "product" && itemBarcode && (
   <span style={{ fontSize: `${typography.serialPt}pt` }} className="font-mono truncate w-full">
   {itemBarcode}
   </span>
   )}
   {includeSku && item.type === "product" && item.sku && (
   <span style={{ fontSize: `${typography.metaPt}pt` }} className="text-gray-600 truncate w-full">
   SKU: {item.sku}
   </span>
   )}
   {includePrice && itemPrice != null && item.type !== "location" && (
   <span style={{ fontSize: `${typography.metaPt}pt` }} className="font-medium">
   £{Number(itemPrice).toFixed(2)}
   </span>
   )}
  </div>
  </div>
  );
  })}
 </div>
 </div>
 </div>
 );
}

"use client";

import React, { useState, useMemo } from "react";
import { X, Loader2, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { salesApi, primeSerialCache } from "../../sales-dashboard/service/salesApi";
import type { POSProduct } from "../../sales-dashboard/types";

function parseSerials(text: string): string[] {
 const raw = text
 .split(/[\n,\s]+/)
 .map((s) => s.trim())
 .filter(Boolean);
 return [...new Set(raw)];
}

export type BulkImeiResult = "added" | "duplicate_in_paste" | "already_in_cart" | "already_sold" | "returned_to_supplier" | "not_found";

interface BulkImeiDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 addBulkSerialsToCart: (products: POSProduct[]) => void;
 showMessage: (type: "success" | "error", text: string) => void;
 cartSerials?: Set<string>;
 disabled?: boolean;
}

export function BulkImeiDrawer({
 isOpen,
 onClose,
 addBulkSerialsToCart,
 showMessage,
 cartSerials = new Set(),
 disabled = false,
}: BulkImeiDrawerProps) {
 const [imeisList, setImeisList] = useState("");
 const [adding, setAdding] = useState(false);
 const [lastResult, setLastResult] = useState<{
 added: number;
 skipped: { reason: BulkImeiResult; count: number; examples: string[] }[];
 } | null>(null);

 const serials = useMemo(() => parseSerials(imeisList), [imeisList]);
 const duplicateInPaste = useMemo(() => {
 const seen = new Set<string>();
 const dupes: string[] = [];
 const raw = imeisList.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);
 for (const s of raw) {
 if (seen.has(s)) dupes.push(s);
 else seen.add(s);
 }
 return dupes;
 }, [imeisList]);

 const handleAddItems = async () => {
 if (serials.length === 0) {
 showMessage("error", "Enter at least one serial / IMEI.");
 return;
 }
 if (disabled) {
 showMessage("error", "Select customer first to add items.");
 return;
 }
 setAdding(true);
 setLastResult(null);
 const toAdd: POSProduct[] = [];
 const skippedByReason: Record<BulkImeiResult, { count: number; examples: string[] }> = {
 added: { count: 0, examples: [] },
 duplicate_in_paste: { count: 0, examples: [] },
 already_in_cart: { count: 0, examples: [] },
 already_sold: { count: 0, examples: [] },
 returned_to_supplier: { count: 0, examples: [] },
 not_found: { count: 0, examples: [] },
 };

 const addExample = (reason: BulkImeiResult, serial: string) => {
 const r = skippedByReason[reason];
 if (r.examples.length < 3) r.examples.push(serial);
 r.count++;
 };

 for (const serial of serials) {
 if (duplicateInPaste.includes(serial)) {
 addExample("duplicate_in_paste", serial);
 continue;
 }
 if (cartSerials.has(serial)) {
 addExample("already_in_cart", serial);
 continue;
 }
 }

 const serialsToLookup = serials.filter(
 (s) => !duplicateInPaste.includes(s) && !cartSerials.has(s)
 );

 if (serialsToLookup.length > 0) {
 try {
 const res = await salesApi.getFindInStockSerialsBatch(serialsToLookup);
 const results = res.data?.results ?? [];
 primeSerialCache(results);
 for (const r of results) {
  if (r.status === "in_stock" && r.product) {
  const d = r.product;
  toAdd.push({
  sku: d.sku,
  name: d.name,
  category: d.category ?? "",
  brand: d.brand ?? "",
  price: `£${Number(d.price).toFixed(2)}`,
  unit: "piece",
  qty: 1,
  iconColor: "text-orange-600",
  serialNumber: d.serial,
  grade: d.grade,
  colour: d.colour,
  brandModel: d.brandModel,
  capacity: d.capacity,
  inventoryDate: d.purchaseDate ?? undefined,
  unitCost: d.unitCost != null ? Number(d.unitCost) : undefined,
  purchaseId: d.purchaseId ?? undefined,
  purchaseItemId: d.purchaseItemId ?? undefined,
  });
  } else if (r.status === "already_sold") {
  addExample("already_sold", r.serial);
  } else if (r.status === "returned_to_supplier") {
  addExample("returned_to_supplier", r.serial);
  } else {
  addExample("not_found", r.serial);
  }
 }
 } catch {
 for (const serial of serialsToLookup) {
  addExample("not_found", serial);
 }
 }
 }

 if (toAdd.length > 0) {
 addBulkSerialsToCart(toAdd);
 showMessage("success", `Added ${toAdd.length} item${toAdd.length === 1 ? "" : "s"} to cart.`);
 setImeisList("");
 setLastResult({ added: toAdd.length, skipped: [] });
 setAdding(false);
 onClose();
 return;
 }

 const skipped = (
 ["duplicate_in_paste", "already_in_cart", "already_sold", "returned_to_supplier", "not_found"] as BulkImeiResult[]
 )
 .filter((r) => skippedByReason[r].count > 0)
 .map((reason) => ({
 reason,
 count: skippedByReason[reason].count,
 examples: skippedByReason[reason].examples,
 }));

 setLastResult({ added: toAdd.length, skipped });
 setAdding(false);
 if (toAdd.length === 0 && skipped.length > 0) {
 showMessage("error", "No items could be added. Check the summary below.");
 }
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = () => {
 const text = String(reader.result ?? "");
 setImeisList((prev) => (prev ? `${prev}\n${text}` : text));
 };
 reader.readAsText(file);
 e.target.value = "";
 };

 const handleClose = () => {
 if (!adding) {
 setImeisList("");
 setLastResult(null);
 onClose();
 }
 };

 const reasonLabels: Record<BulkImeiResult, string> = {
 added: "Added",
 duplicate_in_paste: "Duplicate in paste",
 already_in_cart: "Already in cart",
 already_sold: "Already sold",
 returned_to_supplier: "Returned to supplier",
 not_found: "Not in stock / unknown",
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex justify-end">
 <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden />
 <div
 className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col max-h-full overflow-hidden"
 role="dialog"
 aria-labelledby="bulk-imeis-drawer-title"
 aria-modal="true"
 >
 <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-gray-200">
  <h2 id="bulk-imeis-drawer-title" className="text-lg font-semibold text-gray-900">
  Bulk IMEIs
  </h2>
  <button
  type="button"
  onClick={handleClose}
  disabled={adding}
  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
  aria-label="Close"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-4">
  <p className="text-sm text-gray-600">
  Paste IMEIs/serials (one per line or comma-separated), or upload a CSV/text file. We’ll validate and add only in-stock items.
  </p>
  <div>
  <label htmlFor="bulk-imeis-paste" className="block text-sm font-medium text-gray-700 mb-1">
  IMEIs / serials
  </label>
  <textarea
  id="bulk-imeis-paste"
  value={imeisList}
  onChange={(e) => setImeisList(e.target.value)}
  placeholder="Paste or type one per line (or comma-separated). Duplicates in the list are ignored."
  rows={12}
  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[240px] font-mono text-sm"
  disabled={adding || disabled}
  aria-describedby="bulk-imeis-count"
  />
  <p id="bulk-imeis-count" className="mt-1 text-sm text-gray-500">
  {serials.length} unique serial(s)
  {duplicateInPaste.length > 0 && (
  <span className="text-neutral-600 ml-1">· {duplicateInPaste.length} duplicate(s) in paste</span>
  )}
  </p>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Or upload file</label>
  <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
  <FileUp className="h-4 w-4" />
  Choose CSV / text
  <input type="file" accept=".csv,.txt,text/plain" onChange={handleFileUpload} className="sr-only" />
  </label>
  </div>

  {lastResult && (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
  <h3 className="text-sm font-semibold text-gray-900">Result</h3>
  <div className="flex flex-wrap items-center gap-4">
  {lastResult.added > 0 && (
   <span className="inline-flex items-center gap-1.5 text-green-700">
   <CheckCircle className="h-4 w-4" />
   Added {lastResult.added}
   </span>
  )}
  {lastResult.skipped.map(({ reason, count, examples }) => (
   <span key={reason} className="inline-flex items-center gap-1.5 text-neutral-700">
   <AlertCircle className="h-4 w-4" />
   {reasonLabels[reason]}: {count}
   {examples.length > 0 && (
   <span className="text-gray-500 font-mono text-xs">e.g. {examples.slice(0, 2).join(", ")}</span>
   )}
   </span>
  ))}
  </div>
  </div>
  )}
 </div>

 <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
  <button
  type="button"
  onClick={handleClose}
  disabled={adding}
  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
  >
  Close
  </button>
  <button
  type="button"
  onClick={handleAddItems}
  disabled={adding || serials.length === 0 || disabled}
  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
  aria-label="Add valid IMEIs to cart"
  >
  {adding ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
  Add valid IMEIs to cart
  </button>
 </div>
 </div>
 </div>
 );
}

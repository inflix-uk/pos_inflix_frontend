"use client";

import React, { useState, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { salesApi, primeSerialCache } from "../../sales-dashboard/service/salesApi";
import type { POSProduct } from "../../sales-dashboard/types";

function parseSerials(text: string): string[] {
 const raw = text
 .split(/[\n,\s]+/)
 .map((s) => s.trim())
 .filter(Boolean);
 return [...new Set(raw)];
}

interface BulkSerialsModalProps {
 isOpen: boolean;
 onClose: () => void;
 addToCart: (product: POSProduct, qty?: number) => void;
 /** Add multiple serial products in one update (used for bulk IMEI) */
 addBulkSerialsToCart: (products: POSProduct[]) => void;
 showMessage: (type: "success" | "error", text: string) => void;
 /** Serials already in cart (skip adding again) */
 cartSerials?: Set<string>;
}

export function BulkSerialsModal({
 isOpen,
 onClose,
 addToCart,
 addBulkSerialsToCart,
 showMessage,
 cartSerials = new Set(),
}: BulkSerialsModalProps) {
 const [imeisList, setImeisList] = useState("");
 const [adding, setAdding] = useState(false);

 const serials = useMemo(() => parseSerials(imeisList), [imeisList]);
 const total = serials.length;

 const handleAddItems = async () => {
 if (total === 0) {
 showMessage("error", "Enter at least one serial / IMEI.");
 return;
 }
 setAdding(true);
 const toAdd: POSProduct[] = [];
 const failed: { serial: string; reason: string }[] = [];

 const inCart = serials.filter((s) => cartSerials.has(s));
 for (const serial of inCart) {
 failed.push({ serial, reason: "Already in cart" });
 }
 const serialsToLookup = serials.filter((s) => !cartSerials.has(s));

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
  failed.push({
  serial: r.serial,
  reason: r.soldInfo
  ? `Already sold — ${r.soldInfo.reference || "—"} (${r.soldInfo.customerName || "Walk-in"})`
  : "Already sold",
  });
  } else if (r.status === "returned_to_supplier") {
  failed.push({ serial: r.serial, reason: "Returned to supplier" });
  } else {
  failed.push({ serial: r.serial, reason: "Not found in inventory" });
  }
 }
 } catch {
 for (const serial of serialsToLookup) {
  failed.push({ serial, reason: "Not found in inventory" });
 }
 }
 }

 if (toAdd.length > 0) {
 addBulkSerialsToCart(toAdd);
 showMessage("success", `Added ${toAdd.length} item${toAdd.length === 1 ? "" : "s"} to cart.`);
 setImeisList("");
 if (failed.length === 0) onClose();
 }
 setAdding(false);
 if (failed.length > 0 && toAdd.length === 0) {
 showMessage("error", failed.length === 1 ? failed[0].reason : `${failed.length} serials could not be added.`);
 }
 if (failed.length > 0 && toAdd.length > 0) {
 showMessage("success", `Added ${toAdd.length}. ${failed.length} skipped (already sold or not found).`);
 }
 };

 const handleClose = () => {
 if (!adding) {
 setImeisList("");
 onClose();
 }
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
 <div
 className="relative w-full max-w-lg bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]"
 role="dialog"
 aria-labelledby="bulk-imeis-title"
 >
 <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-gray-200">
  <h2 id="bulk-imeis-title" className="text-lg font-semibold text-gray-900">
  Sell Bulk IMEIs
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
  <div>
  <label htmlFor="bulk-imeis-list" className="block text-sm font-medium text-gray-700 mb-1">
  IMEIs List
  </label>
  <textarea
  id="bulk-imeis-list"
  value={imeisList}
  onChange={(e) => setImeisList(e.target.value)}
  placeholder="Paste or type one serial / IMEI per line (or comma-separated)"
  rows={10}
  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[200px]"
  disabled={adding}
  />
  </div>
  <p className="text-sm font-medium text-gray-700">
  Total: {total}
  </p>
 </div>

 <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
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
  disabled={adding || total === 0}
  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
  >
  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
  Add Items
  </button>
 </div>
 </div>
 </div>
 );
}

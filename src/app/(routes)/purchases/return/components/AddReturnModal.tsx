"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Package, Loader2, Search } from "lucide-react";
import { CreatePurchaseReturnPayload, PurchaseReturnItemInput } from "../types";
import { purchaseApi } from "../../list/service/purchaseApi";

interface PurchaseOption {
 _id: string;
 purchaseNumber: string;
 date?: string;
 status?: string;
 supplier?: { _id: string; name: string };
 account?: { _id: string; name: string };
}

interface PurchaseItemRow {
 _id: string;
 name?: string;
 brand?: string;
 brandModel?: string;
 isOtherItem?: boolean;
 quantity?: number;
 imeis?: string[];
 purchasePrice?: number;
}

interface AddReturnModalProps {
 open: boolean;
 onClose: () => void;
 onAdd: (payload: CreatePurchaseReturnPayload) => void;
}

export const AddReturnModal: React.FC<AddReturnModalProps> = ({ open, onClose, onAdd }) => {
 const [step, setStep] = useState<1 | 2>(1);
 const [purchases, setPurchases] = useState<PurchaseOption[]>([]);
 const [loadingPurchases, setLoadingPurchases] = useState(false);
 const [selectedPurchaseId, setSelectedPurchaseId] = useState("");
 const [purchaseItems, setPurchaseItems] = useState<PurchaseItemRow[]>([]);
 const [loadingPurchase, setLoadingPurchase] = useState(false);
 const [returnLines, setReturnLines] = useState<Record<string, { quantityReturned: number; imeisReturned: string[] }>>({});
 const [note, setNote] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [serialSearch, setSerialSearch] = useState("");
 const [serialSearching, setSerialSearching] = useState(false);
 const [serialSearchError, setSerialSearchError] = useState<string | null>(null);
 const [serialPreSelect, setSerialPreSelect] = useState<{ purchaseItemId: string; serial: string } | null>(null);

 useEffect(() => {
 if (!open) return;
 setStep(1);
 setSelectedPurchaseId("");
 setPurchaseItems([]);
 setReturnLines({});
 setNote("");
 setSerialSearch("");
 setSerialSearchError(null);
 setSerialPreSelect(null);
 setLoadingPurchases(true);
 purchaseApi
 .getPurchases({ status: "Received", limit: 100 })
 .then((res) => {
 if (res.success && res.data) {
  setPurchases(res.data as unknown as PurchaseOption[]);
 } else {
  setPurchases([]);
 }
 })
 .catch(() => setPurchases([]))
 .finally(() => setLoadingPurchases(false));
 }, [open]);

 const loadPurchase = useCallback((purchaseId: string, preSelect?: { purchaseItemId: string; serial: string }) => {
 if (!purchaseId) {
 setPurchaseItems([]);
 return;
 }
 setLoadingPurchase(true);
 setSerialSearchError(null);
 purchaseApi
 .getPurchaseById(purchaseId)
 .then((res) => {
 if (res.success && res.data && res.data.items) {
  const items = (res.data.items as PurchaseItemRow[]).map((i) => ({
  ...i,
  _id: (i as { _id?: string })._id ?? (i as unknown as { id: string }).id ?? "",
  }));
  setPurchaseItems(items);
  const initial: Record<string, { quantityReturned: number; imeisReturned: string[] }> = {};
  items.forEach((it) => {
  const imeisReturned = preSelect && preSelect.purchaseItemId === it._id ? [preSelect.serial] : [];
  initial[it._id] = { quantityReturned: 0, imeisReturned };
  });
  setReturnLines(initial);
  if (preSelect) setStep(2);
 } else {
  setPurchaseItems([]);
 }
 })
 .catch(() => setPurchaseItems([]))
 .finally(() => setLoadingPurchase(false));
 }, []);

 const handleSelectPurchase = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const id = e.target.value;
 setSelectedPurchaseId(id);
 setSerialPreSelect(null);
 loadPurchase(id);
 };

 const handleSerialSearch = useCallback(async () => {
 const serial = serialSearch.trim();
 if (!serial) {
 setSerialSearchError("Enter a serial number");
 return;
 }
 setSerialSearching(true);
 setSerialSearchError(null);
 try {
 const res = await purchaseApi.findInStockBySerial(serial);
 if (res.success && res.data) {
 const d = res.data as { purchaseId?: string; purchaseItemId?: string; serial?: string; name?: string };
 if (d.purchaseId && d.purchaseItemId) {
  setSelectedPurchaseId(d.purchaseId);
  setSerialPreSelect({ purchaseItemId: d.purchaseItemId, serial: d.serial ?? serial });
  loadPurchase(d.purchaseId, { purchaseItemId: d.purchaseItemId, serial: d.serial ?? serial });
  setSerialSearch("");
 } else {
  setSerialSearchError("Serial found but cannot return (missing purchase info)");
 }
 } else {
 setSerialSearchError(res.message || "Serial not found or already sold/returned");
 }
 } catch {
 setSerialSearchError("Search failed");
 } finally {
 setSerialSearching(false);
 }
 }, [serialSearch, loadPurchase]);

 const goToStep2 = () => {
 if (selectedPurchaseId && purchaseItems.length > 0) setStep(2);
 };

 const setQuantity = (itemId: string, value: number) => {
 setReturnLines((prev) => ({
 ...prev,
 [itemId]: { ...prev[itemId], quantityReturned: Math.max(0, value), imeisReturned: prev[itemId]?.imeisReturned ?? [] },
 }));
 };

 const toggleImei = (itemId: string, imei: string) => {
 setReturnLines((prev) => {
 const current = prev[itemId]?.imeisReturned ?? [];
 const next = current.includes(imei) ? current.filter((x) => x !== imei) : [...current, imei];
 return { ...prev, [itemId]: { ...prev[itemId], quantityReturned: prev[itemId]?.quantityReturned ?? 0, imeisReturned: next } };
 });
 };

 const buildPayload = (): CreatePurchaseReturnPayload | null => {
 const items: PurchaseReturnItemInput[] = [];
 for (const [itemId, line] of Object.entries(returnLines)) {
 const qty = line.quantityReturned ?? 0;
 const imeis = line.imeisReturned ?? [];
 if (qty > 0 || imeis.length > 0) {
 items.push({ purchaseItemId: itemId, quantityReturned: qty, imeisReturned: imeis.length ? imeis : undefined });
 }
 }
 if (items.length === 0) return null;
 return {
 purchaseId: selectedPurchaseId,
 note: note.trim() || undefined,
 items,
 };
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const payload = buildPayload();
 if (!payload) return;
 setSubmitting(true);
 try {
 await onAdd(payload);
 onClose();
 } finally {
 setSubmitting(false);
 }
 };

 if (!open) return null;

 const hasAnyReturn = Object.entries(returnLines).some(
 ([_, v]) => (v.quantityReturned ?? 0) > 0 || (v.imeisReturned ?? []).length > 0
 );

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">
  Return to supplier
  {step === 2 && (
  <span className="ml-2 text-sm font-normal text-gray-500">
  — Select items to return (faulty stock)
  </span>
  )}
  </h2>
  <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
  <X size={24} />
  </button>
 </div>

 {step === 1 && (
  <div className="p-6 space-y-4">
  <p className="text-sm text-gray-600">
  Select the purchase you received that contains faulty items you want to return to the supplier.
  </p>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Search by serial number</label>
  <div className="flex gap-2">
  <input
   type="text"
   value={serialSearch}
   onChange={(e) => { setSerialSearch(e.target.value); setSerialSearchError(null); }}
   onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSerialSearch())}
   placeholder="Enter IMEI/serial to find and return"
   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
   disabled={serialSearching}
  />
  <button
   type="button"
   onClick={handleSerialSearch}
   disabled={serialSearching || !serialSearch.trim()}
   className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
  >
   {serialSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
   Search
  </button>
  </div>
  {serialSearchError && (
  <p className="mt-1 text-sm text-red-600">{serialSearchError}</p>
  )}
  </div>
  <div className="relative">
  <div className="absolute inset-0 flex items-center">
  <span className="w-full border-t border-gray-200" />
  </div>
  <div className="relative flex justify-center text-xs">
  <span className="bg-white px-2 text-gray-500">or select purchase</span>
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase</label>
  <select
  value={selectedPurchaseId}
  onChange={handleSelectPurchase}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">Select a purchase…</option>
  {loadingPurchases ? (
   <option disabled>Loading…</option>
  ) : (
   purchases.map((p) => {
   const name = (p.supplier && typeof p.supplier === "object" && "name" in p.supplier && (p.supplier as { name: string }).name)
   || (p.account && typeof p.account === "object" && "name" in p.account && (p.account as { name: string }).name)
   || "";
   return (
   <option key={p._id} value={p._id}>
   {p.purchaseNumber}
   {name ? ` — ${name}` : ""}
   {p.date ? ` — ${p.date}` : ""}
   </option>
   );
   })
  )}
  </select>
  </div>
  {selectedPurchaseId && (
  <>
  {loadingPurchase ? (
   <div className="flex items-center gap-2 text-gray-500 py-4">
   <Loader2 className="w-5 h-5 animate-spin" />
   Loading items…
   </div>
  ) : (
   <p className="text-sm text-gray-600">
   {purchaseItems.length} item line(s). Click Next to choose what to return.
   </p>
  )}
  </>
  )}
  <div className="flex justify-end gap-2 pt-4">
  <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  type="button"
  onClick={goToStep2}
  disabled={!selectedPurchaseId || loadingPurchase || purchaseItems.length === 0}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  Next
  </button>
  </div>
  </div>
 )}

 {step === 2 && (
  <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
  <Package className="w-4 h-4" />
  <span>Purchase: {purchases.find((p) => p._id === selectedPurchaseId)?.purchaseNumber ?? selectedPurchaseId}</span>
  </div>
  <div className="border border-gray-200 rounded-lg overflow-hidden">
  <table className="w-full text-sm">
  <thead className="bg-gray-50 border-b border-gray-200">
   <tr>
   <th className="text-left px-3 py-2 font-medium text-gray-700">Item</th>
   <th className="text-right px-3 py-2 font-medium text-gray-700">Available</th>
   <th className="text-right px-3 py-2 font-medium text-gray-700">Return</th>
   </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
   {purchaseItems.map((item) => {
   const isOther = item.isOtherItem === true;
   const maxQty = isOther ? Math.max(0, Number(item.quantity) || 0) : 0;
   const imeis = (item.imeis || []).filter(Boolean);
   const line = returnLines[item._id] ?? { quantityReturned: 0, imeisReturned: [] };
   const name =
   [item.name, item.brand, item.brandModel].filter(Boolean).join(" ") || "Item";

   return (
   <tr key={item._id} className="hover:bg-gray-50">
   <td className="px-3 py-2 text-gray-900">{name}</td>
   <td className="px-3 py-2 text-right text-gray-600">
    {isOther ? `${maxQty} units` : `${imeis.length} serial(s)`}
   </td>
   <td className="px-3 py-2">
    {isOther ? (
    <input
    type="number"
    min={0}
    max={maxQty}
    value={line.quantityReturned}
    onChange={(e) => setQuantity(item._id, parseInt(e.target.value, 10) || 0)}
    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
    />
    ) : (
    <div className="flex flex-wrap gap-1">
    {imeis.slice(0, 10).map((imei) => (
    <label key={imei} className="inline-flex items-center gap-1 text-xs">
     <input
     type="checkbox"
     checked={line.imeisReturned.includes(imei)}
     onChange={() => toggleImei(item._id, imei)}
     className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
     />
     {imei}
    </label>
    ))}
    {imeis.length > 10 && (
    <span className="text-gray-400 text-xs">+{imeis.length - 10} more</span>
    )}
    </div>
    )}
   </td>
   </tr>
   );
   })}
  </tbody>
  </table>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
  <textarea
  value={note}
  onChange={(e) => setNote(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  rows={2}
  placeholder="e.g. Faulty batch, wrong model"
  />
  </div>
  <div className="flex justify-end gap-2 pt-4">
  <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Back
  </button>
  <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  type="submit"
  disabled={!hasAnyReturn || submitting}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
  Create return
  </button>
  </div>
  </form>
 )}
 </div>
 </div>
 );
};

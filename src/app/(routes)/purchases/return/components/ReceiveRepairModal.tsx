"use client";

import React, { useState } from "react";
import { X, Package, Loader2 } from "lucide-react";
import { PurchaseReturn } from "../types";

interface ReceiveRepairModalProps {
 open: boolean;
 onClose: () => void;
 onReceive: (id: string, imeis: string[]) => Promise<void>;
 purchaseReturn: PurchaseReturn | null;
}

export const ReceiveRepairModal: React.FC<ReceiveRepairModalProps> = ({
 open,
 onClose,
 onReceive,
 purchaseReturn,
}) => {
 const [imeiInput, setImeiInput] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 if (!open || !purchaseReturn) return null;

 const parseImeis = (text: string): string[] => {
 return text
 .split(/[\n,\s]+/)
 .map((s) => s.trim())
 .filter(Boolean);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const imeis = parseImeis(imeiInput);
 if (imeis.length === 0) {
 setError("Enter at least one IMEI/serial (one per line or comma-separated)");
 return;
 }
 setError(null);
 setSubmitting(true);
 try {
 await onReceive(purchaseReturn._id, imeis);
 setImeiInput("");
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to receive repair");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Receive from repair</h2>
  <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
  <X size={24} />
  </button>
 </div>
 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <div className="flex items-center gap-2 text-sm text-gray-600">
  <Package className="w-4 h-4" />
  <span>
  Return <strong>{purchaseReturn.returnNumber}</strong>
  {purchaseReturn.purchaseNumber && ` (Purchase ${purchaseReturn.purchaseNumber})`}
  </span>
  </div>
  <p className="text-sm text-gray-600">
  Enter the IMEI(s) or serial number(s) that have come back from the supplier after repair. They will be put back in stock.
  </p>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">IMEI / Serial numbers</label>
  <textarea
  value={imeiInput}
  onChange={(e) => { setImeiInput(e.target.value); setError(null); }}
  placeholder="One per line or comma-separated"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
  rows={4}
  />
  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
  <div className="flex justify-end gap-2 pt-2">
  <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  type="submit"
  disabled={submitting || !imeiInput.trim()}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
  >
  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
  Put back in stock
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

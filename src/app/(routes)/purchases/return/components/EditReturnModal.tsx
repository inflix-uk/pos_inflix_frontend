"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PurchaseReturn } from "../types";

interface EditReturnModalProps {
 open: boolean;
 onClose: () => void;
 onUpdate: (id: string, data: { status?: string; note?: string }) => void | Promise<void>;
 purchaseReturn: PurchaseReturn | null;
}

const STATUS_OPTIONS = ["Pending", "Sent", "Received by Supplier"] as const;

export const EditReturnModal: React.FC<EditReturnModalProps> = ({
 open,
 onClose,
 onUpdate,
 purchaseReturn,
}) => {
 const [status, setStatus] = useState<string>("Pending");
 const [note, setNote] = useState("");
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
 if (purchaseReturn) {
 setStatus(purchaseReturn.status ?? "Pending");
 setNote(purchaseReturn.note ?? "");
 }
 }, [purchaseReturn]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!purchaseReturn) return;
 setSubmitting(true);
 try {
 await onUpdate(purchaseReturn._id, { status, note });
 onClose();
 } finally {
 setSubmitting(false);
 }
 };

 if (!open || !purchaseReturn) return null;

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Edit purchase return</h2>
  <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
  <X size={24} />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <p className="text-sm text-gray-600">
  Return <strong>{purchaseReturn.returnNumber}</strong>
  {purchaseReturn.purchaseNumber && (
  <> (Purchase {purchaseReturn.purchaseNumber})</>
  )}
  </p>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
  <select
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  {STATUS_OPTIONS.map((s) => (
  <option key={s} value={s}>{s}</option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
  <textarea
  value={note}
  onChange={(e) => setNote(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  rows={2}
  />
  </div>

  <div className="flex justify-end gap-2 pt-2">
  <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  type="submit"
  disabled={submitting}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {submitting ? "Saving…" : "Update"}
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

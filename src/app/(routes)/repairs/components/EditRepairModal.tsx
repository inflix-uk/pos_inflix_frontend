"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Repair, RepairFormData } from "../types";

const STATUS_OPTIONS: { value: RepairFormData["status"]; label: string }[] = [
 { value: "pending", label: "Pending" },
 { value: "in_progress", label: "In progress" },
 { value: "waiting_parts", label: "Waiting parts" },
 { value: "completed", label: "Completed" },
 { value: "cancelled", label: "Cancelled" },
 { value: "collected", label: "Collected" },
 { value: "redo", label: "REDO" },
];

function toForm(repair: Repair): RepairFormData {
 return {
 customerName: repair.customerName ?? "",
 contactPhone: repair.contactPhone ?? "",
 contactEmail: repair.contactEmail ?? "",
 deviceDescription: repair.deviceDescription ?? "",
 serialNumber: repair.serialNumber ?? "",
 status: repair.status ?? "pending",
 receivedAt: repair.receivedAt ? new Date(repair.receivedAt).toISOString().slice(0, 10) : undefined,
 completedAt: repair.completedAt ? new Date(repair.completedAt).toISOString().slice(0, 10) : null,
 collectedAt: repair.collectedAt ? new Date(repair.collectedAt).toISOString().slice(0, 10) : null,
 estimatedCost: repair.estimatedCost ?? null,
 actualCost: repair.actualCost ?? null,
 notes: repair.notes ?? "",
 internalNotes: repair.internalNotes ?? "",
 };
}

interface EditRepairModalProps {
 open: boolean;
 repair: Repair | null;
 onClose: () => void;
 onSubmit: (id: string, data: Partial<RepairFormData>) => void;
 isLoading: boolean;
}

export const EditRepairModal: React.FC<EditRepairModalProps> = ({
 open,
 repair,
 onClose,
 onSubmit,
 isLoading,
}) => {
 const [form, setForm] = useState<RepairFormData | null>(null);

 useEffect(() => {
 if (open && repair) setForm(toForm(repair));
 else setForm(null);
 }, [open, repair]);

 if (!open || !repair || !form) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 onSubmit(repair._id, form);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/20" aria-hidden onClick={onClose} />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
  <h2 className="text-xl font-semibold text-gray-900">Edit repair - {repair.reference}</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} />
  </button>
 </div>
 <form onSubmit={handleSubmit} className="p-4 space-y-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Customer name *</label>
  <input
  type="text"
  required
  value={form.customerName}
  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
  <input
  type="tel"
  value={form.contactPhone ?? ""}
  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
  <input
  type="email"
  value={form.contactEmail ?? ""}
  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Device description *</label>
  <input
  type="text"
  required
  value={form.deviceDescription}
  onChange={(e) => setForm({ ...form, deviceDescription: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">IMEI / Serial number</label>
  <input
  type="text"
  value={form.serialNumber ?? ""}
  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
  <select
  value={form.status}
  onChange={(e) => setForm({ ...form, status: e.target.value as RepairFormData["status"] })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  >
  {STATUS_OPTIONS.map((o) => (
  <option key={o.value} value={o.value}>{o.label}</option>
  ))}
  </select>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Received date</label>
  <input
  type="date"
  value={form.receivedAt ?? ""}
  onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Completed date</label>
  <input
  type="date"
  value={form.completedAt ?? ""}
  onChange={(e) => setForm({ ...form, completedAt: e.target.value || null })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated cost (GBP)</label>
  <input
  type="number"
  step="0.01"
  min="0"
  value={form.estimatedCost ?? ""}
  onChange={(e) => setForm({ ...form, estimatedCost: e.target.value ? Number(e.target.value) : null })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Actual cost (GBP)</label>
  <input
  type="number"
  step="0.01"
  min="0"
  value={form.actualCost ?? ""}
  onChange={(e) => setForm({ ...form, actualCost: e.target.value ? Number(e.target.value) : null })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
  <textarea
  value={form.notes ?? ""}
  onChange={(e) => setForm({ ...form, notes: e.target.value })}
  rows={2}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Internal notes</label>
  <textarea
  value={form.internalNotes ?? ""}
  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
  rows={2}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  </div>
  <div className="flex justify-end gap-3 pt-2">
  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
  Cancel
  </button>
  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">
  {isLoading ? "Saving..." : "Save changes"}
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

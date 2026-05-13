"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { RepairFormData } from "../types";
import { locationApi } from "../../peoples/locations/service/locationApi";

const STATUS_OPTIONS: { value: RepairFormData["status"]; label: string }[] = [
 { value: "pending", label: "Pending" },
 { value: "in_progress", label: "In progress" },
 { value: "waiting_parts", label: "Waiting parts" },
 { value: "completed", label: "Completed" },
 { value: "cancelled", label: "Cancelled" },
 { value: "collected", label: "Collected" },
 { value: "redo", label: "REDO" },
];

const getInitialForm = (): RepairFormData => ({
 customerName: "",
 contactPhone: "",
 contactEmail: "",
 deviceDescription: "",
 serialNumber: "",
 status: "pending",
 receivedAt: new Date().toISOString().slice(0, 10),
 notes: "",
 internalNotes: "",
});

interface AddRepairModalProps {
 open: boolean;
 onClose: () => void;
 onSubmit: (data: RepairFormData) => void;
 isLoading: boolean;
}

export const AddRepairModal: React.FC<AddRepairModalProps> = ({
 open,
 onClose,
 onSubmit,
 isLoading,
}) => {
 const [form, setForm] = useState<RepairFormData>(getInitialForm());
 const [locations, setLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

 useEffect(() => {
 if (!open) return;
 setForm({ ...getInitialForm(), receivedAt: new Date().toISOString().slice(0, 10) });
 let cancelled = false;
 locationApi.getLocations({ isActive: true, limit: 200 }).then((res) => {
 if (cancelled || !res.success || !Array.isArray(res.data)) return;
 const list = (res.data as Array<{ _id: string; name: string }>).map((l) => ({ _id: l._id, name: l.name }));
 setLocations(list);
 if (list.length > 0) setSelectedLocationId(list[0]._id);
 }).catch(() => {});
 return () => { cancelled = true; };
 }, [open]);

 if (!open) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 onSubmit({ ...form, ...(selectedLocationId ? { locationId: selectedLocationId } : {}) });
 setForm(getInitialForm());
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/20" aria-hidden onClick={onClose} />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
  <h2 className="text-xl font-semibold text-gray-900">Add repair</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} />
  </button>
 </div>
 <form onSubmit={handleSubmit} className="p-4 space-y-4">
  {locations.length > 1 && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
  <select
  value={selectedLocationId ?? ""}
  onChange={(e) => setSelectedLocationId(e.target.value || null)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  >
  {locations.map((l) => (
   <option key={l._id} value={l._id}>{l.name}</option>
  ))}
  </select>
  </div>
  )}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Customer name *</label>
  <input
  type="text"
  required
  value={form.customerName}
  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  placeholder="Customer or company name"
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
  placeholder="Contact phone"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
  <input
  type="email"
  value={form.contactEmail ?? ""}
  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  placeholder="Contact email"
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
  placeholder="e.g. iPhone 15 256GB Green"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">IMEI / Serial number</label>
  <input
  type="text"
  value={form.serialNumber ?? ""}
  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono"
  placeholder="Optional"
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
  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated cost (GBP)</label>
  <input
  type="number"
  step="0.01"
  min="0"
  value={form.estimatedCost ?? ""}
  onChange={(e) => setForm({ ...form, estimatedCost: e.target.value ? Number(e.target.value) : null })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  placeholder="Optional"
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
  placeholder="Fault description, etc."
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Internal notes</label>
  <textarea
  value={form.internalNotes ?? ""}
  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
  rows={2}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
  placeholder="Staff only"
  />
  </div>
  <div className="flex justify-end gap-3 pt-2">
  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
  Cancel
  </button>
  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">
  {isLoading ? "Adding..." : "Add repair"}
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

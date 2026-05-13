"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { stockAdjustmentApi } from "../service/stockAdjustmentApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import type { Location } from "@/app/(routes)/peoples/locations/types";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
 COUNT_CORRECTION: "Count correction",
 DAMAGED: "Damaged",
 LOST_STOLEN: "Lost/Stolen",
 SUPPLIER_DISCREPANCY: "Supplier discrepancy",
 DATA_FIX: "Data fix",
 OTHER: "Other",
};

export default function AddStockAdjustmentPage() {
 const { can } = usePermissions();
 const router = useRouter();
 const [locations, setLocations] = useState<Location[]>([]);
 const [reasonCodes, setReasonCodes] = useState<string[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [locationId, setLocationId] = useState("");
 const [reasonCode, setReasonCode] = useState("");
 const [notes, setNotes] = useState("");

 useEffect(() => {
 locationApi.getLocations({ limit: 500, isActive: true }).then((res) => {
 if (res.success && Array.isArray((res as { data?: Location[] }).data)) {
 setLocations((res as { data: Location[] }).data);
 }
 });
 stockAdjustmentApi.getReasonCodes().then(setReasonCodes).catch(() => {});
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!can("stock_adjustment.create")) return;
 if (!locationId || !reasonCode) {
 setError("Select location and reason");
 return;
 }
 if (reasonCode === "OTHER" && !notes.trim()) {
 setError("Notes are required when reason is Other");
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const created = await stockAdjustmentApi.create({
 locationId,
 reasonCode,
 notes: notes.trim() || undefined,
 });
 router.push(`/stock/adjustment/${created._id}`);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to create adjustment");
 } finally {
 setLoading(false);
 }
 };

 if (!can("stock_adjustment.create")) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-red-600">You do not have permission to create stock adjustments.</p>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="max-w-lg mx-auto">
 <Link
  href="/stock/adjustment"
  className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm mb-4"
 >
  <ArrowLeft className="h-4 w-4" />
  Back to list
 </Link>
 <h1 className="text-2xl font-bold text-gray-900 mb-2">New stock adjustment</h1>
 <p className="text-sm text-gray-500 mb-6">
  Select location and reason. You can add qty lines and scan serials on the next screen.
 </p>

 <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
  {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
  <select
  value={locationId}
  onChange={(e) => setLocationId(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  required
  >
  <option value="">Select location</option>
  {locations.map((loc) => (
  <option key={loc._id} value={loc._id}>
   {loc.name} ({loc.type})
  </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
  <select
  value={reasonCode}
  onChange={(e) => setReasonCode(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  required
  >
  <option value="">Select reason</option>
  {reasonCodes.map((r) => (
  <option key={r} value={r}>
   {REASON_LABELS[r] ?? r}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Notes {reasonCode === "OTHER" ? "*" : ""}
  </label>
  <textarea
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  rows={3}
  required={reasonCode === "OTHER"}
  />
  </div>
  <div className="flex gap-3 pt-2">
  <button
  type="submit"
  disabled={loading}
  className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
  >
  {loading ? "Creating…" : "Create and add items"}
  </button>
  <Link
  href="/stock/adjustment"
  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
  >
  Cancel
  </Link>
  </div>
 </form>
 </div>
 </div>
 );
}

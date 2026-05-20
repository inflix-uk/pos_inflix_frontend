"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ArrowLeft, Plus, Trash2, MapPin, ChevronDown, RotateCcw } from "lucide-react";
import { repairApi } from "../service/repairApi";
import { customerApi } from "../../peoples/customers/service/customerApi";
import { locationApi } from "../../peoples/locations/service/locationApi";
import { AddCustomerModal } from "../../peoples/customers/components/AddCustomerModal";
import { NewDeviceModal } from "./components/NewDeviceModal";
import type { Customer } from "../../peoples/customers/types";
import type { CustomerFormData } from "../../peoples/customers/types";
import type { RepairFormData } from "../types";

const DEFAULT_PROBLEMS = [
 "Cracked screen",
 "Won't turn on",
 "Battery issue",
 "Water damage",
 "Charging port fault",
 "Speaker not working",
 "Camera not working",
 "Other",
];

const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1";
const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30";

export default function AddRepairTicketPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Customer
 const [customerSearch, setCustomerSearch] = useState("");
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [customerOpen, setCustomerOpen] = useState(false);
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
 const [customersLoading, setCustomersLoading] = useState(false);

 // Devices
 type DeviceEntry = {
 id: string;
 deviceDescription: string;
 serialNumber: string;
 problemTypes: string[];
 estimatedPrice: string;
 devicePassword: string;
 notes: string;
 };
 const [devices, setDevices] = useState<DeviceEntry[]>([]);
 const [newDeviceModalOpen, setNewDeviceModalOpen] = useState(false);
 const [problemOptions, setProblemOptions] = useState<string[]>(DEFAULT_PROBLEMS);
 const [newProblemModalOpen, setNewProblemModalOpen] = useState(false);
 const [newProblemInput, setNewProblemInput] = useState("");
 const [problemTargetDeviceId, setProblemTargetDeviceId] = useState<string | null>(null);

 const addDevice = (deviceDescription: string, serialNumber: string) => {
 setDevices((prev) => [
 ...prev,
 { id: `d-${Date.now()}-${prev.length}`, deviceDescription: deviceDescription.trim(), serialNumber: serialNumber.trim(), problemTypes: [], estimatedPrice: "", devicePassword: "", notes: "" },
 ]);
 };
 const updateDevice = (id: string, updates: Partial<Omit<DeviceEntry, "id">>) => {
 setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
 };
 const removeDevice = (id: string) => {
 setDevices((prev) => prev.filter((d) => d.id !== id));
 };
 const toggleProblem = (deviceId: string, problem: string) => {
 setDevices((prev) => prev.map((d) => {
 if (d.id !== deviceId) return d;
 const has = d.problemTypes.includes(problem);
 return { ...d, problemTypes: has ? d.problemTypes.filter((p) => p !== problem) : [...d.problemTypes, problem] };
 }));
 };
 const removeProblem = (deviceId: string, problem: string) => {
 setDevices((prev) => prev.map((d) => d.id === deviceId ? { ...d, problemTypes: d.problemTypes.filter((p) => p !== problem) } : d));
 };

 // Options
 const [internalNotes, setInternalNotes] = useState("");
 const [notifyViaEmail, setNotifyViaEmail] = useState(true);

 // Location
 const [locations, setLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
 useEffect(() => {
 let cancelled = false;
 locationApi.getLocations({ isActive: true, limit: 200 }).then((res) => {
 if (cancelled || !res.success || !Array.isArray(res.data)) return;
 const list = (res.data as Array<{ _id: string; name: string }>).map((l) => ({ _id: l._id, name: l.name }));
 setLocations(list);
 if (list.length > 0 && !selectedLocationId) setSelectedLocationId(list[0]._id);
 }).catch(() => {});
 return () => { cancelled = true; };
 }, []);

 // Pre-fill customer from query
 useEffect(() => {
 const customerId = searchParams.get("customerId");
 if (!customerId || selectedCustomer) return;
 let cancelled = false;
 customerApi.getById(customerId).then((res) => {
 if (!cancelled && res.success && res.data) setSelectedCustomer(res.data as Customer);
 }).catch(() => {});
 return () => { cancelled = true; };
 }, [searchParams, selectedCustomer]);

 // Fetch customers
 useEffect(() => {
 if (!customerOpen) return;
 let cancelled = false;
 setCustomersLoading(true);
 const search = customerSearch.trim() || undefined;
 customerApi.getAll({ search, limit: 500, status: "active" }).then((res) => {
 if (!cancelled && res.success && Array.isArray(res.data)) setCustomers(res.data);
 }).catch(() => { if (!cancelled) setCustomers([]); }).finally(() => { if (!cancelled) setCustomersLoading(false); });
 return () => { cancelled = true; };
 }, [customerOpen, customerSearch]);

 const addNewProblemFromModal = () => {
 const v = newProblemInput.trim();
 if (!v) return;
 if (!problemOptions.includes(v)) setProblemOptions((prev) => [...prev, v]);
 if (problemTargetDeviceId) {
 setDevices((prev) => prev.map((d) => {
 if (d.id !== problemTargetDeviceId) return d;
 if (d.problemTypes.includes(v)) return d;
 return { ...d, problemTypes: [...d.problemTypes, v] };
 }));
 }
 setNewProblemInput("");
 setNewProblemModalOpen(false);
 setProblemTargetDeviceId(null);
 };

 const handleCreateRepair = async () => {
 if (!selectedCustomer) { setMessage({ type: "error", text: "Please select a customer." }); return; }
 if (devices.length === 0) { setMessage({ type: "error", text: "Please add at least one device." }); return; }
 const invalid = devices.find((d) => !d.deviceDescription.trim() || d.problemTypes.length === 0);
 if (invalid) { setMessage({ type: "error", text: "Each device must have a description and at least one problem selected." }); return; }
 setIsSubmitting(true);
 setMessage({ type: "success", text: "" });
 try {
 const first = devices[0];
 const firstEstimated = first.estimatedPrice.trim() ? (parseFloat(first.estimatedPrice) || null) : null;
 const deviceList = devices.map((d) => ({
  deviceDescription: d.deviceDescription.trim(),
  serialNumber: d.serialNumber.trim(),
  problemType: d.problemTypes.join(", "),
  devicePassword: d.devicePassword.trim(),
  estimatedCost: d.estimatedPrice.trim() ? (parseFloat(d.estimatedPrice) || null) : null,
  notes: d.notes.trim(),
 }));
 const combinedNotes = devices
  .map((d, i) => {
  const head = devices.length > 1 ? `Device ${i + 1}: ` : "";
  const body = [d.problemTypes.join(", "), d.notes].filter(Boolean).join(" · ");
  return body ? `${head}${body}` : "";
  })
  .filter(Boolean)
  .join("\n");
 const payload: RepairFormData = {
  customerName: selectedCustomer.name,
  contactPhone: selectedCustomer.phone ?? "",
  contactEmail: selectedCustomer.email ?? "",
  deviceDescription: first.deviceDescription.trim(),
  serialNumber: first.serialNumber.trim() || undefined,
  devices: deviceList,
  status: "pending",
  notes: combinedNotes || undefined,
  internalNotes: internalNotes || undefined,
  devicePassword: first.devicePassword.trim() || undefined,
  estimatedCost: firstEstimated ?? undefined,
  problemType: first.problemTypes.join(", "),
  notifyViaEmail,
  ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
 };
 const res = await repairApi.create(payload);
 if (res.success && res.data) {
 router.push(`/repairs/edit/${res.data._id}`);
 } else {
 setMessage({ type: "error", text: "Failed to create repair ticket." });
 }
 } catch (e) {
 setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to create repair ticket." });
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleAddCustomer = async (data: CustomerFormData) => {
 try {
 const res = await customerApi.create(data);
 if (res.success && res.data && res.data._id) {
 const full = await customerApi.getById(res.data._id);
 if (full.success && full.data) setSelectedCustomer(full.data as Customer);
 setAddCustomerModalOpen(false);
 }
 } catch { /* ignore */ }
 };

 const canCreateRepair = Boolean(selectedCustomer) && devices.length > 0 && devices.every((d) => d.deviceDescription.trim() && d.problemTypes.length > 0);

 return (
 <div className="min-h-screen bg-gray-50 p-4">
 {message.text && (
 <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg text-sm ${message.type === "success" ? "bg-green-100 text-green-700 border border-green-400" : "bg-red-100 text-red-700 border border-red-400"}`}>
  {message.text}
 </div>
 )}

 <div className="mx-auto max-w-5xl">
 <div className="mb-3 flex flex-col gap-1">
  <Link href="/repairs" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800">
  <ArrowLeft className="h-4 w-4" />
  Back to repairs
  </Link>
  <p className="text-xs text-gray-500">Select a customer, add devices with problems, then create. All devices are bundled under a single repair reference.</p>
 </div>

 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
  {/* Section 1: Customer & Location */}
  <div className="p-4 border-b border-gray-200">
  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Customer & Location</h2>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  {/* Customer search */}
  <div className="lg:col-span-2">
  <label className={labelCls}>Customer <span className="text-red-500">*</span></label>
  <div className="flex gap-2">
   <div className="relative flex-1">
   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
   <input
   type="text"
   value={selectedCustomer ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}` : customerSearch}
   onChange={(e) => { if (!selectedCustomer) setCustomerSearch(e.target.value); }}
   onFocus={() => { setCustomerOpen(true); if (!selectedCustomer) setCustomerSearch(""); }}
   placeholder="Search by name or phone"
   className={`${inputCls} pl-9 pr-10`}
   />
   {selectedCustomer && (
   <button type="button" onClick={() => setSelectedCustomer(null)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
   <X className="h-4 w-4" />
   </button>
   )}
   {customerOpen && !selectedCustomer && (
   <>
   <div className="fixed inset-0 z-10" onClick={() => setCustomerOpen(false)} />
   <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white py-0.5 shadow-lg">
    {customersLoading ? (
    <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
    ) : customers.length === 0 ? (
    <div className="px-3 py-2 text-sm text-gray-500">
    {customerSearch.trim() ? "No customers found." : "No customers available for repairs."}
    </div>
    ) : (
    customers.map((c) => (
    <button key={c._id} type="button" onClick={() => { setSelectedCustomer(c); setCustomerOpen(false); setCustomerSearch(""); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-800 hover:bg-orange-50">
    {c.name}{c.phone ? ` (${c.phone})` : ""}
    </button>
    ))
    )}
   </div>
   </>
   )}
   </div>
   <button type="button" onClick={() => setAddCustomerModalOpen(true)} className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
   + New
   </button>
  </div>
  {selectedCustomer && (
   <div className="mt-2 flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-sm">
   <span className="font-semibold text-gray-900">{selectedCustomer.name}</span>
   <span className="text-xs text-gray-500">{[selectedCustomer.phone, selectedCustomer.email].filter(Boolean).join(" · ")}</span>
   </div>
  )}
  </div>

  {/* Location */}
  {locations.length > 0 && (
  <div>
   <label className={labelCls}>Location</label>
   <div className="relative">
   <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
   <select
   value={selectedLocationId ?? ""}
   onChange={(e) => setSelectedLocationId(e.target.value || null)}
   className={`${inputCls} pl-9 pr-8 appearance-none bg-white`}
   >
   {locations.map((loc) => (
   <option key={loc._id} value={loc._id}>{loc.name}</option>
   ))}
   </select>
   <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
   </div>
  </div>
  )}
  </div>
  </div>

  {/* Section 2: Devices */}
  <div className="p-4 border-b border-gray-200">
  <div className="flex items-center justify-between mb-3">
  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
  Devices <span className="text-red-500">*</span>
  {devices.length > 0 && <span className="ml-1.5 text-gray-600 normal-case tracking-normal">({devices.length})</span>}
  </h2>
  <button type="button" onClick={() => setNewDeviceModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition">
  <Plus className="h-3.5 w-3.5" /> Add device
  </button>
  </div>

  {devices.length === 0 ? (
  <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
  <p className="text-sm text-gray-500">No devices added yet</p>
  <p className="text-xs text-gray-400 mt-1">Click "Add device" to pick brand, model, and optional IMEI</p>
  </div>
  ) : (
  <div className="space-y-3">
  {devices.map((d, index) => (
   <div key={d.id} className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
   {/* Device header */}
   <div className="flex items-center justify-between bg-white px-3 py-2 border-b border-gray-100">
   <div className="flex items-center gap-2">
   <span className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[10px] font-bold text-white">{index + 1}</span>
   <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{d.deviceDescription || "Untitled device"}</span>
   {d.serialNumber && <span className="text-[11px] text-gray-400 font-mono">{d.serialNumber}</span>}
   </div>
   <button type="button" onClick={() => removeDevice(d.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Remove device">
   <Trash2 className="h-3.5 w-3.5" />
   </button>
   </div>

   {/* Device fields */}
   <div className="p-3 grid gap-3 sm:grid-cols-2">
   <div>
   <label className={labelCls}>Device description</label>
   <input type="text" value={d.deviceDescription} onChange={(e) => updateDevice(d.id, { deviceDescription: e.target.value })} placeholder="e.g. Apple iPhone 15" className={inputCls} />
   </div>
   <div>
   <label className={labelCls}>IMEI / Serial</label>
   <input type="text" value={d.serialNumber} onChange={(e) => updateDevice(d.id, { serialNumber: e.target.value })} placeholder="Optional" className={`${inputCls} font-mono text-xs`} />
   </div>
   <div className="sm:col-span-2">
   <label className={labelCls}>Problems <span className="text-red-500">*</span> <span className="text-gray-400 normal-case font-normal">(select one or more)</span></label>
   {d.problemTypes.length > 0 && (
    <div className="flex flex-wrap gap-1.5 mb-2">
    {d.problemTypes.map((p) => (
    <span key={p} className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 text-xs font-medium">
    {p}
    <button type="button" onClick={() => removeProblem(d.id, p)} className="hover:text-orange-900" title="Remove">
    <X className="h-3 w-3" />
    </button>
    </span>
    ))}
    </div>
   )}
   <div className="flex flex-wrap gap-1.5 mb-2">
    {problemOptions.map((p) => {
    const selected = d.problemTypes.includes(p);
    return (
    <button
    key={p}
    type="button"
    onClick={() => toggleProblem(d.id, p)}
    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${selected ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
    >
    {selected ? "✓ " : "+ "}{p}
    </button>
    );
    })}
    <button type="button" onClick={() => { setProblemTargetDeviceId(d.id); setNewProblemModalOpen(true); }} className="rounded-full border border-dashed border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
    + New problem
    </button>
   </div>
   </div>
   <div>
   <label className={labelCls}>Est. price (£)</label>
   <input type="number" min="0" step="0.01" value={d.estimatedPrice} onChange={(e) => updateDevice(d.id, { estimatedPrice: e.target.value })} placeholder="0.00" className={inputCls} />
   </div>
   <div>
   <label className={labelCls}>Device password</label>
   <input type="text" value={d.devicePassword} onChange={(e) => updateDevice(d.id, { devicePassword: e.target.value })} placeholder="Passcode / pattern" className={inputCls} />
   </div>
   <div className="sm:col-span-2">
   <label className={labelCls}>Notes (customer-facing)</label>
   <textarea value={d.notes} onChange={(e) => updateDevice(d.id, { notes: e.target.value })} rows={2} placeholder="Extra symptom detail for this device" className={`${inputCls} resize-y`} />
   </div>
   </div>
   </div>
  ))}
  </div>
  )}
  </div>

  {/* Section 3: Options — notes + notifications inline */}
  <div className="p-4 border-b border-gray-200">
  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Options</h2>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  <div className="lg:col-span-2">
  <label className={labelCls}>Internal notes (staff only)</label>
  <textarea
   value={internalNotes}
   onChange={(e) => setInternalNotes(e.target.value)}
   rows={2}
   placeholder="e.g. VIP customer, warranty claim reference…"
   className={`${inputCls} resize-y`}
  />
  <p className="text-[11px] text-gray-400 mt-1">Visible to staff only.</p>
  </div>
  <div>
  <label className={labelCls}>Notifications</label>
  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50 transition">
   <input
   type="checkbox"
   checked={notifyViaEmail}
   onChange={(e) => setNotifyViaEmail(e.target.checked)}
   className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
   <span className="text-sm text-gray-900">Email customer</span>
  </label>
  </div>
  </div>
  </div>

  {/* Footer: actions */}
  <div className="p-4 flex flex-wrap items-center justify-between gap-3">
  <Link href="/repairs" className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors">
  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
  Cancel
  </Link>
  <button
  type="button"
  onClick={handleCreateRepair}
  disabled={isSubmitting || !canCreateRepair}
  className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {isSubmitting ? "Creating..." : `Create ticket${devices.length > 1 ? ` (${devices.length} devices)` : ""}`}
  </button>
  </div>
 </div>
 </div>

 <NewDeviceModal
 open={newDeviceModalOpen}
 onClose={() => setNewDeviceModalOpen(false)}
 initialSerialNumber=""
 initialDeviceDescription=""
 onSave={({ deviceDescription: desc, serialNumber: serial }) => { addDevice(desc, serial); setNewDeviceModalOpen(false); }}
 />

 {newProblemModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/30" onClick={() => { setNewProblemModalOpen(false); setProblemTargetDeviceId(null); setNewProblemInput(""); }} />
  <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
  <h3 className="text-sm font-bold text-gray-900 mb-3">Add problem type</h3>
  <input type="text" value={newProblemInput} onChange={(e) => setNewProblemInput(e.target.value)} placeholder="e.g. Cracked screen" className={`${inputCls} mb-3`} />
  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => { setNewProblemModalOpen(false); setProblemTargetDeviceId(null); setNewProblemInput(""); }} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
  <button type="button" onClick={addNewProblemFromModal} className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600">Add</button>
  </div>
  </div>
 </div>
 )}

 <AddCustomerModal open={addCustomerModalOpen} onClose={() => setAddCustomerModalOpen(false)} onAdd={handleAddCustomer} isLoading={false} />
 </div>
 );
}

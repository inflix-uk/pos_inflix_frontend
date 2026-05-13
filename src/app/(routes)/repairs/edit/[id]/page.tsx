"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
 ArrowLeft,
 User,
 Wrench,
 ChevronDown,
 ChevronRight,
 Plus,
 Trash2,
 Pencil,
 Search,
 X,
 Banknote,
 CheckCircle,
 Smartphone,
 Printer,
 Loader2,
} from "lucide-react";
import { repairApi } from "../../service/repairApi";
import { repairToForPrint } from "../../lib/repairToForPrint";
import { printRepairLabel57x32, printRepairTicket80mm } from "@/lib/invoicePrint";
import { customerApi } from "../../../peoples/customers/service/customerApi";
import { AddCustomerModal } from "../../../peoples/customers/components/AddCustomerModal";
import type { Customer } from "../../../peoples/customers/types";
import type { CustomerFormData } from "../../../peoples/customers/types";
import type { Repair, RepairFormData, RepairStatus, RepairDevice } from "../../types";

const STATUS_OPTIONS: { value: RepairStatus; label: string }[] = [
 { value: "pending", label: "Pending" },
 { value: "in_progress", label: "In progress" },
 { value: "waiting_parts", label: "Waiting parts" },
 { value: "completed", label: "Completed" },
 { value: "cancelled", label: "Cancelled" },
 { value: "collected", label: "Collected" },
 { value: "redo", label: "REDO" },
];

const STATUS_COLORS: Record<string, string> = {
 pending: "bg-neutral-100 border-neutral-400 text-neutral-900",
 in_progress: "bg-blue-100 border-blue-400 text-blue-900",
 waiting_parts: "bg-orange-100 border-orange-400 text-orange-900",
 completed: "bg-green-100 border-green-400 text-green-900",
 cancelled: "bg-gray-100 border-gray-400 text-gray-700",
 collected: "bg-emerald-100 border-emerald-400 text-emerald-900",
 redo: "bg-neutral-100 border-neutral-400 text-neutral-800",
};

/** Per-option colors inside dropdown (background + text only) */
const STATUS_OPTION_COLORS: Record<string, string> = {
 pending: "bg-neutral-50 text-neutral-900 hover:bg-neutral-100",
 in_progress: "bg-blue-50 text-blue-900 hover:bg-blue-100",
 waiting_parts: "bg-orange-50 text-orange-900 hover:bg-orange-100",
 completed: "bg-green-50 text-green-900 hover:bg-green-100",
 cancelled: "bg-gray-50 text-gray-700 hover:bg-gray-100",
 collected: "bg-neutral-50 text-emerald-900 hover:bg-emerald-100",
 redo: "bg-neutral-50 text-neutral-800 hover:bg-neutral-100",
};

export default function RepairEditPage() {
 const router = useRouter();
 const params = useParams();
 const id = params?.id as string | undefined;

 const [repair, setRepair] = useState<Repair | null>(null);
 const [loading, setLoading] = useState(true);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });

 // Form state (synced from repair)
 const [form, setForm] = useState<RepairFormData & { internalNotes?: string } | null>(null);
 const [repairItems, setRepairItems] = useState<{ description: string; amount: number }[]>([]);
 const [devices, setDevices] = useState<RepairDevice[]>([]);
 const [addingDevice, setAddingDevice] = useState(false);
 const [formsExpanded, setFormsExpanded] = useState(true);
 const [newItemDesc, setNewItemDesc] = useState("");
 const [newItemAmount, setNewItemAmount] = useState("");
 const [addingItem, setAddingItem] = useState(false);
 const [descSuggestions, setDescSuggestions] = useState<Array<{ description: string; amount: number }>>([]);
 const [descSuggestOpen, setDescSuggestOpen] = useState(false);
 const [descSuggestLoading, setDescSuggestLoading] = useState(false);
 const [descActiveIndex, setDescActiveIndex] = useState<number>(-1);
 const [descDropdownRect, setDescDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
 const descContainerRef = useRef<HTMLDivElement>(null);
 const descInputRef = useRef<HTMLInputElement>(null);
 const descSearchSeqRef = useRef(0);
 const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (descContainerRef.current && !descContainerRef.current.contains(e.target as Node)) {
    setDescSuggestOpen(false);
   }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 // Recompute the fixed-position dropdown geometry whenever it opens or the page reflows.
 // The dropdown lives inside a card with `overflow-hidden` for rounded corners, which would
 // otherwise clip the absolute-positioned popup — `position: fixed` escapes the clip.
 useEffect(() => {
  if (!descSuggestOpen) return;
  const updateRect = () => {
   const el = descInputRef.current;
   if (!el) return;
   const r = el.getBoundingClientRect();
   setDescDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  updateRect();
  window.addEventListener("scroll", updateRect, true);
  window.addEventListener("resize", updateRect);
  return () => {
   window.removeEventListener("scroll", updateRect, true);
   window.removeEventListener("resize", updateRect);
  };
 }, [descSuggestOpen]);

 const runDescSearch = useCallback((q: string) => {
  const trimmed = q.trim();
  if (trimmed.length < 3) {
   setDescSuggestions([]);
   setDescSuggestLoading(false);
   return;
  }
  const seq = ++descSearchSeqRef.current;
  setDescSuggestLoading(true);
  repairApi.searchItems(trimmed, 10)
   .then((res) => {
    if (seq !== descSearchSeqRef.current) return;
    const data = Array.isArray(res?.data) ? res.data : [];
    setDescSuggestions(data);
    setDescActiveIndex(data.length > 0 ? 0 : -1);
   })
   .catch(() => {
    if (seq !== descSearchSeqRef.current) return;
    setDescSuggestions([]);
   })
   .finally(() => {
    if (seq === descSearchSeqRef.current) setDescSuggestLoading(false);
   });
 }, []);

 const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const next = e.target.value;
  setNewItemDesc(next);
  setDescSuggestOpen(true);
  if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
  descDebounceRef.current = setTimeout(() => runDescSearch(next), 200);
 };

 const handleDescSelect = (s: { description: string; amount: number }) => {
  setNewItemDesc(s.description);
  if (Number.isFinite(s.amount)) setNewItemAmount(String(s.amount));
  setDescSuggestOpen(false);
  setDescSuggestions([]);
 };
 /** When set, this field is in edit mode (click-to-edit). */
 const [editingField, setEditingField] = useState<string | null>(null);

 // Customer – fetch/list like add form; link to actual customer record
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [customerSearch, setCustomerSearch] = useState("");
 const [customerOpen, setCustomerOpen] = useState(false);
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [customersLoading, setCustomersLoading] = useState(false);
 const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);

 const [labelPrintLoading, setLabelPrintLoading] = useState(false);
 const [ticketPrintLoading, setTicketPrintLoading] = useState(false);

 // Take payment modal (amount < due = recorded as deposit)
 const [takePaymentModalOpen, setTakePaymentModalOpen] = useState(false);
 const [paymentAmount, setPaymentAmount] = useState("");
 const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit" | "bank">("cash");
 const [paymentSubmitting, setPaymentSubmitting] = useState(false);

 // Refs for auto-save (always use latest form/repairItems/selectedCustomer)
 const formRef = useRef<typeof form>(null);
 const repairItemsRef = useRef(repairItems);
 const devicesRef = useRef(devices);
 const selectedCustomerRef = useRef(selectedCustomer);
 useEffect(() => {
 formRef.current = form;
 repairItemsRef.current = repairItems;
 devicesRef.current = devices;
 selectedCustomerRef.current = selectedCustomer;
 }, [form, repairItems, devices, selectedCustomer]);

 // Header status dropdown (custom so each option has its own color)
 const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
 const [savingStatus, setSavingStatus] = useState(false);

 const loadRepair = useCallback(async () => {
 if (!id) return;
 setLoading(true);
 try {
 const res = await repairApi.getById(id);
 if (res.success && res.data) {
 const r = res.data;
 setRepair(r);
 setForm({
  customerName: r.customerName ?? "",
  contactPhone: r.contactPhone ?? "",
  contactEmail: r.contactEmail ?? "",
  deviceDescription: r.deviceDescription ?? "",
  serialNumber: r.serialNumber ?? "",
  status: r.status ?? "pending",
  receivedAt: r.receivedAt ? new Date(r.receivedAt).toISOString().slice(0, 10) : undefined,
  completedAt: r.completedAt ? new Date(r.completedAt).toISOString().slice(0, 10) : null,
  collectedAt: r.collectedAt ? new Date(r.collectedAt).toISOString().slice(0, 10) : null,
  estimatedCost: r.estimatedCost ?? null,
  actualCost: r.actualCost ?? null,
  notes: r.notes ?? "",
  internalNotes: r.internalNotes ?? "",
  devicePassword: r.devicePassword ?? "",
  problemType: r.problemType ?? "",
 });
 setRepairItems(Array.isArray(r.repairItems) && r.repairItems.length > 0 ? [...r.repairItems] : []);
 setDevices(
  Array.isArray(r.devices) && r.devices.length > 0
  ? r.devices.map((d) => ({
  deviceDescription: d.deviceDescription ?? "",
  serialNumber: d.serialNumber ?? "",
  problemType: d.problemType ?? "",
  devicePassword: d.devicePassword ?? "",
  estimatedCost: d.estimatedCost ?? null,
  notes: d.notes ?? "",
  }))
  : [
  {
   deviceDescription: r.deviceDescription ?? "",
   serialNumber: r.serialNumber ?? "",
   problemType: r.problemType ?? "",
   devicePassword: r.devicePassword ?? "",
   estimatedCost: r.estimatedCost ?? null,
   notes: r.notes ?? "",
  },
  ]
 );
 setSelectedCustomer(null);
 const customerId =
  typeof r.customerId === "string" ? r.customerId : (r.customerId && typeof r.customerId === "object" && "_id" in r.customerId ? (r.customerId as { _id: string })._id : undefined);
 if (customerId) {
  customerApi
  .getById(customerId)
  .then((res) => {
  if (res.success && res.data) {
  const c = res.data;
  setSelectedCustomer(c);
  setForm((prev) =>
   prev
   ? {
   ...prev,
   customerName: c.name ?? prev.customerName,
   contactPhone: c.phone ?? prev.contactPhone ?? "",
   contactEmail: c.email ?? prev.contactEmail ?? "",
   }
   : null
  );
  }
  })
  .catch(() => {});
 }
 } else {
 setMessage({ type: "error", text: "Repair not found" });
 }
 } catch {
 setMessage({ type: "error", text: "Failed to load repair" });
 } finally {
 setLoading(false);
 }
 }, [id]);

 useEffect(() => {
 loadRepair();
 }, [loadRepair]);

 // Fetch customers when dropdown is open (same as add form)
 useEffect(() => {
 if (!customerOpen) return;
 let cancelled = false;
 setCustomersLoading(true);
 const search = customerSearch.trim() || undefined;
 customerApi
 .getAll({ search, limit: 500, status: "active" })
 .then((res) => {
 if (!cancelled && res.success && Array.isArray(res.data)) setCustomers(res.data);
 })
 .catch(() => {
 if (!cancelled) setCustomers([]);
 })
 .finally(() => {
 if (!cancelled) setCustomersLoading(false);
 });
 return () => {
 cancelled = true;
 };
 }, [customerOpen, customerSearch]);

 const grandTotal = repairItems.reduce((sum, i) => sum + i.amount, 0);
 const devicesEstTotal = devices.reduce((s, d) => s + (Number(d.estimatedCost) || 0), 0);
 const amountDue = grandTotal > 0 ? grandTotal : (devicesEstTotal || (form?.estimatedCost ?? form?.actualCost ?? 0));
 const totalTaken =
 repair?.totalTaken ??
 (repair?.payments?.length
 ? repair.payments.reduce((s, p) => s + (p.total ?? 0), 0)
 : repair?.sale
 ? Number(repair.sale.total)
 : 0);
 const amountRemaining = Math.max(0, amountDue - totalTaken);

 const openTakePaymentModal = () => {
 setPaymentAmount(amountRemaining > 0 ? String(amountRemaining.toFixed(2)) : "");
 setPaymentMethod("cash");
 setTakePaymentModalOpen(true);
 };

 const handlePrintTicket = useCallback(async () => {
 if (!repair) return;
 setTicketPrintLoading(true);
 try {
 await printRepairTicket80mm(repairToForPrint(repair));
 } catch (e) {
 setMessage({
 type: "error",
 text: e instanceof Error ? e.message : "Failed to open repair ticket for print",
 });
 } finally {
 setTicketPrintLoading(false);
 }
 }, [repair]);

 const handlePrintLabel = useCallback(async () => {
 if (!repair) return;
 setLabelPrintLoading(true);
 try {
 const path = await printRepairLabel57x32(repairToForPrint(repair));
 if (path === "label-png" || path === "pdf-silent") {
 setMessage({ type: "success", text: "Label sent to label printer." });
 }
 } catch (e) {
 setMessage({
 type: "error",
 text: e instanceof Error ? e.message : "Failed to print label",
 });
 } finally {
 setLabelPrintLoading(false);
 }
 }, [repair]);

 const handleTakePaymentComplete = async () => {
 if (!id) return;
 const amount = parseFloat(paymentAmount);
 if (Number.isNaN(amount) || amount <= 0) {
 setMessage({ type: "error", text: "Enter a valid payment amount." });
 return;
 }
 const isDeposit = amount < amountRemaining || repairItems.length === 0;
 setPaymentSubmitting(true);
 setMessage({ type: "success", text: "" });
 try {
 const res = await repairApi.takePayment(id, { amount, paymentMethod, isDeposit });
 if (res.success) {
 const msg = (res as { message?: string }).message ?? (isDeposit ? "Deposit recorded" : "Payment recorded");
 setMessage({ type: "success", text: msg });
 setTakePaymentModalOpen(false);
 loadRepair();
 }
 } catch (e) {
 setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to record payment" });
 } finally {
 setPaymentSubmitting(false);
 }
 };

 const autoSave = useCallback(async () => {
 const f = formRef.current;
 if (!id || !f) return;
 const items = repairItemsRef.current;
 const devs = devicesRef.current;
 const customer = selectedCustomerRef.current;
 try {
 const payload: Partial<RepairFormData> & { customerId?: string | null } = {
 ...f,
 repairItems: items,
 devices: devs,
 receivedAt: f.receivedAt || undefined,
 completedAt: f.completedAt || null,
 collectedAt: f.collectedAt || null,
 customerId: customer?._id ?? null,
 };
 const res = await repairApi.update(id, payload);
 if (res.success && res.data) {
 setRepair((prev) => ({
  ...res.data,
  totalTaken: res.data.totalTaken ?? prev?.totalTaken,
  payments: (res.data.payments && res.data.payments.length > 0) ? res.data.payments : (prev?.payments ?? res.data.payments),
  sale: res.data.sale ?? prev?.sale,
 }));
 setRepairItems(Array.isArray(res.data.repairItems) ? [...res.data.repairItems] : items);
 if (Array.isArray(res.data.devices) && res.data.devices.length > 0) setDevices(res.data.devices);
 const r = res.data;
 setForm((prev) =>
  prev
  ? {
  ...prev,
  receivedAt: r.receivedAt ? new Date(r.receivedAt).toISOString().slice(0, 10) : undefined,
  completedAt: r.completedAt ? new Date(r.completedAt).toISOString().slice(0, 10) : null,
  collectedAt: r.collectedAt ? new Date(r.collectedAt).toISOString().slice(0, 10) : null,
  }
  : null
 );
 }
 } catch {
 setMessage({ type: "error", text: "Failed to save" });
 }
 }, [id]);

 const handleStatusChange = async (newStatus: string) => {
 const f = formRef.current;
 if (!id || !f || f.status === newStatus) return;
 const prevStatus = f.status;
 setForm((prev) => (prev ? { ...prev, status: newStatus as RepairStatus } : null));
 setStatusDropdownOpen(false);
 setEditingField(null);
 setSavingStatus(true);
 setMessage({ type: "success", text: "" });
 try {
 const payload: Partial<RepairFormData> & { customerId?: string | null } = {
 ...f,
 status: newStatus as RepairStatus,
 repairItems: repairItemsRef.current,
 devices: devicesRef.current,
 receivedAt: f.receivedAt || undefined,
 completedAt: f.completedAt || null,
 collectedAt: f.collectedAt || null,
 customerId: selectedCustomerRef.current?._id ?? null,
 };
 const res = await repairApi.update(id, payload);
 if (res.success && res.data) {
 const updated = res.data;
 if (Array.isArray(updated.devices) && updated.devices.length > 0) setDevices(updated.devices);
 setRepair((prev) => ({
  ...updated,
  totalTaken: updated.totalTaken ?? prev?.totalTaken,
  payments: (updated.payments && updated.payments.length > 0) ? updated.payments : (prev?.payments ?? updated.payments),
  sale: updated.sale ?? prev?.sale,
 }));
 setForm((prev) =>
  prev
  ? {
  ...prev,
  status: updated.status ?? prev.status,
  receivedAt: updated.receivedAt ? new Date(updated.receivedAt).toISOString().slice(0, 10) : undefined,
  completedAt: updated.completedAt ? new Date(updated.completedAt).toISOString().slice(0, 10) : null,
  collectedAt: updated.collectedAt ? new Date(updated.collectedAt).toISOString().slice(0, 10) : null,
  }
  : null
 );
 setMessage({ type: "success", text: "Status updated" });
 } else {
 setForm((f) => (f ? { ...f, status: prevStatus } : null));
 setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to update status" });
 }
 } catch (e) {
 setForm((f) => (f ? { ...f, status: prevStatus } : null));
 setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to update status" });
 } finally {
 setSavingStatus(false);
 }
 };

 const addItem = async () => {
 const desc = newItemDesc.trim();
 const amount = parseFloat(newItemAmount);
 if (!desc || Number.isNaN(amount) || amount < 0) return;
 if (!id || !form) return;
 const newItems = [...repairItems, { description: desc, amount }];
 setRepairItems(newItems);
 setNewItemDesc("");
 setNewItemAmount("");
 setAddingItem(true);
 setMessage({ type: "success", text: "" });
 try {
 const res = await repairApi.update(id, {
 ...form,
 repairItems: newItems,
 devices: devicesRef.current,
 customerId: selectedCustomer?._id ?? null,
 });
 if (res.success && res.data) {
 setRepair((prev) => ({
  ...res.data,
  totalTaken: res.data.totalTaken ?? prev?.totalTaken,
  payments: (res.data.payments && res.data.payments.length > 0) ? res.data.payments : (prev?.payments ?? res.data.payments),
  sale: res.data.sale ?? prev?.sale,
 }));
 setRepairItems(Array.isArray(res.data.repairItems) ? [...res.data.repairItems] : newItems);
 if (Array.isArray(res.data.devices) && res.data.devices.length > 0) setDevices(res.data.devices);
 setMessage({ type: "success", text: "Repair item added" });
 } else {
 setRepairItems(repairItems);
 setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to add item" });
 }
 } catch (e) {
 setRepairItems(repairItems);
 setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to add item" });
 } finally {
 setAddingItem(false);
 }
 };

 const addDevice = async () => {
 if (!id || !formRef.current) return;
 const newDevices: RepairDevice[] = [
 ...devices,
 { deviceDescription: "", serialNumber: "", problemType: "", devicePassword: "", estimatedCost: null, notes: "" },
 ];
 setDevices(newDevices);
 devicesRef.current = newDevices;
 setAddingDevice(true);
 setMessage({ type: "success", text: "" });
 try {
 const res = await repairApi.update(id, {
 ...formRef.current,
 repairItems: repairItemsRef.current,
 devices: newDevices,
 customerId: selectedCustomerRef.current?._id ?? null,
 });
 if (res.success && res.data) {
 setRepair((prev) => ({
  ...res.data,
  totalTaken: res.data.totalTaken ?? prev?.totalTaken,
  payments: (res.data.payments && res.data.payments.length > 0) ? res.data.payments : (prev?.payments ?? res.data.payments),
  sale: res.data.sale ?? prev?.sale,
 }));
 if (Array.isArray(res.data.devices) && res.data.devices.length > 0) setDevices(res.data.devices);
 setMessage({ type: "success", text: "Device added to ticket" });
 } else {
 setDevices(devices);
 devicesRef.current = devices;
 setMessage({ type: "error", text: "Failed to add device" });
 }
 } catch {
 setDevices(devices);
 devicesRef.current = devices;
 setMessage({ type: "error", text: "Failed to add device" });
 } finally {
 setAddingDevice(false);
 }
 };

 const removeDevice = async (index: number) => {
 if (devices.length <= 1 || !id || !formRef.current) return;
 const newDevices = devices.filter((_, i) => i !== index);
 setDevices(newDevices);
 devicesRef.current = newDevices;
 try {
 const res = await repairApi.update(id, {
 ...formRef.current,
 repairItems: repairItemsRef.current,
 devices: newDevices,
 customerId: selectedCustomerRef.current?._id ?? null,
 });
 if (res.success && res.data) {
 setRepair((prev) => ({
  ...res.data,
  totalTaken: res.data.totalTaken ?? prev?.totalTaken,
  payments: (res.data.payments && res.data.payments.length > 0) ? res.data.payments : (prev?.payments ?? res.data.payments),
  sale: res.data.sale ?? prev?.sale,
 }));
 if (Array.isArray(res.data.devices) && res.data.devices.length > 0) setDevices(res.data.devices);
 } else {
 setDevices(devices);
 devicesRef.current = devices;
 setMessage({ type: "error", text: "Failed to remove device" });
 }
 } catch {
 setDevices(devices);
 devicesRef.current = devices;
 setMessage({ type: "error", text: "Failed to remove device" });
 }
 };

 const updateDeviceField = (deviceIndex: number, field: keyof RepairDevice, value: string | number | null) => {
 setDevices((prev) =>
 prev.map((d, i) => (i === deviceIndex ? { ...d, [field]: value } : d))
 );
 };

 const removeItem = async (index: number) => {
 const f = formRef.current;
 if (!id || !f) return;
 const prev = repairItems;
 const newItems = prev.filter((_, i) => i !== index);
 setRepairItems(newItems);
 repairItemsRef.current = newItems;
 try {
 const res = await repairApi.update(id, {
 ...f,
 repairItems: newItems,
 devices: devicesRef.current,
 customerId: selectedCustomerRef.current?._id ?? null,
 });
 if (res.success && res.data) {
 setRepair((prev) => ({
  ...res.data,
  totalTaken: res.data.totalTaken ?? prev?.totalTaken,
  payments: (res.data.payments && res.data.payments.length > 0) ? res.data.payments : (prev?.payments ?? res.data.payments),
  sale: res.data.sale ?? prev?.sale,
 }));
 setRepairItems(Array.isArray(res.data.repairItems) ? res.data.repairItems : newItems);
 if (Array.isArray(res.data.devices) && res.data.devices.length > 0) setDevices(res.data.devices);
 } else {
 setRepairItems(prev);
 repairItemsRef.current = prev;
 setMessage({ type: "error", text: "Failed to remove item" });
 }
 } catch {
 setRepairItems(prev);
 repairItemsRef.current = prev;
 setMessage({ type: "error", text: "Failed to remove item" });
 }
 };

 const handleAddCustomer = async (data: CustomerFormData) => {
 try {
 const res = await customerApi.create(data);
 if (res.success && res.data) {
 const c = res.data as Customer;
 setSelectedCustomer(c);
 setForm((f) =>
  f
  ? {
  ...f,
  customerName: c.name ?? f.customerName,
  contactPhone: c.phone ?? f.contactPhone ?? "",
  contactEmail: c.email ?? f.contactEmail ?? "",
  }
  : null
 );
 setAddCustomerModalOpen(false);
 setTimeout(() => autoSave(), 150);
 }
 } catch {
 // Modal may show error
 }
 };

 if (loading || !id) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-gray-500">Loading repair...</div>
 </div>
 );
 }

 if (!repair || !form) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <Link href="/repairs" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
  <ArrowLeft className="h-4 w-4" /> Back to repairs
 </Link>
 <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">{message.text || "Repair not found"}</div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 <div className="mx-auto max-w-6xl p-4 sm:p-6">
 <Link
  href="/repairs"
  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
 >
  <ArrowLeft className="h-4 w-4" />
  Back to repairs
 </Link>

 {message.text && (
  <div
  className={`mb-4 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-neutral-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
  >
  {message.text}
  </div>
 )}

 <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
  <h1 className="text-2xl font-bold text-gray-900">Repair ticket</h1>
  <p className="mt-1 text-sm text-gray-500">View details. Click a field to edit.</p>
  </div>
  <div className="flex items-center gap-2 shrink-0 flex-wrap">
  {repair && (
  <>
  <button
   type="button"
   onClick={() => void handlePrintTicket()}
   disabled={ticketPrintLoading}
   className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  >
   {ticketPrintLoading ? (
   <>
   Opening ticket…
   <Loader2 className="h-4 w-4 animate-spin" />
   </>
   ) : (
   <>
   Print ticket (80mm)
   <Printer className="h-4 w-4" />
   </>
   )}
  </button>
  <button
   type="button"
   onClick={handlePrintLabel}
   disabled={labelPrintLoading}
   className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  >
   {labelPrintLoading ? (
   <>
   Printing…
   <Loader2 className="h-4 w-4 animate-spin" />
   </>
   ) : (
   <>
   Print label (57×32mm)
   <Printer className="h-4 w-4" />
   </>
   )}
  </button>
  <button
   type="button"
   onClick={openTakePaymentModal}
   className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
  >
   Take payment
  </button>
  </>
  )}
  <div className="relative">
  <button
  type="button"
  onClick={() => !savingStatus && setStatusDropdownOpen((open) => !open)}
  disabled={savingStatus}
  className={`inline-flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium min-w-[140px] focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-70 ${STATUS_COLORS[form.status] ?? "bg-white border-gray-300 text-gray-900"}`}
  >
  <span>{savingStatus ? "Saving..." : (STATUS_OPTIONS.find((o) => o.value === form.status)?.label ?? form.status)}</span>
  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
  </button>
  {statusDropdownOpen && (
  <>
   <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusDropdownOpen(false)} />
   <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
   {STATUS_OPTIONS.map((o) => (
   <button
   key={o.value}
   type="button"
   onClick={() => handleStatusChange(o.value)}
   disabled={savingStatus}
   className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg mx-1 transition-colors disabled:opacity-50 ${o.value === form.status ? "ring-2 ring-blue-400 ring-inset " : ""}${STATUS_OPTION_COLORS[o.value] ?? "bg-white text-gray-900 hover:bg-gray-50"}`}
   >
   {o.label}
   </button>
   ))}
   </div>
  </>
  )}
  </div>
  <Link
  href="/repairs"
  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
  >
  Back to list
  </Link>
  </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Column 1: Ticket & customer details (view mode, click to edit) */}
  <div className="space-y-4">
  {/* Ticket & customer details – same layout as add form */}
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
  <User className="h-4 w-4 text-blue-600" />
  <span className="font-semibold text-gray-900 text-sm">Ticket & customer details</span>
  </div>
  <div className="px-4 py-3 space-y-3">
  {/* Reference + dates: one compact row */}
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
   <span className="font-medium text-slate-600">Ref</span>
   <span className="font-mono font-semibold text-slate-800">#{repair.reference}</span>
   <span className="text-gray-300">|</span>
   <span className="text-gray-500">Received</span>
   <span className="font-mono text-gray-800">{form.receivedAt || "—"}</span>
   <span className="text-gray-500">Completed</span>
   <span className="font-mono text-gray-800">{form.completedAt || "—"}</span>
   <span className="text-gray-500">Collected</span>
   <span className="font-mono text-gray-800">{form.collectedAt || "—"}</span>
   {repair.locationId && typeof repair.locationId === "object" && repair.locationId.name && (
   <>
   <span className="text-gray-300">|</span>
   <span className="text-gray-500">Location</span>
   <span className="font-medium text-slate-800">{repair.locationId.name}</span>
   </>
   )}
  </div>

  {/* Customer – compact */}
  <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 space-y-2">
   <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</span>
   <div className="flex flex-col gap-2 sm:flex-row">
   <div className="relative flex-1">
   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
   <input
   type="text"
   value={
    selectedCustomer
    ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}`
    : customerOpen
    ? customerSearch
    : `${form.customerName}${form.contactPhone ? ` (${form.contactPhone})` : ""}`.trim() || ""
   }
   onChange={(e) => {
    if (!selectedCustomer) setCustomerSearch(e.target.value);
   }}
   onFocus={() => {
    setCustomerOpen(true);
    if (!selectedCustomer) setCustomerSearch("");
   }}
   placeholder="Search customer by name or phone"
   className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
   />
   {selectedCustomer && (
   <button
    type="button"
    onClick={() => {
    setSelectedCustomer(null);
    setTimeout(() => autoSave(), 150);
    }}
    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
   >
    <X className="h-4 w-4" />
   </button>
   )}
   {customerOpen && !selectedCustomer && (
   <>
    <div
    className="absolute inset-0 z-10"
    onClick={() => setCustomerOpen(false)}
    aria-hidden
    />
    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto py-1">
    {customersLoading ? (
    <div className="px-4 py-3 text-sm text-gray-500">Loading customers...</div>
    ) : customers.length === 0 ? (
    <div className="px-4 py-3 text-sm text-gray-500">
    {customerSearch.trim()
     ? "No customers found. Try a different search or add a new customer."
     : "No customers available. Add a customer first."}
    </div>
    ) : (
    customers.map((c) => (
    <button
     key={c._id}
     type="button"
     onClick={() => {
     setSelectedCustomer(c);
     setCustomerOpen(false);
     setCustomerSearch("");
     setForm((f) =>
     f
     ? {
      ...f,
      customerName: c.name ?? f.customerName,
      contactPhone: c.phone ?? f.contactPhone ?? "",
      contactEmail: c.email ?? f.contactEmail ?? "",
      }
     : null
     );
     setTimeout(() => autoSave(), 150);
     }}
     className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
    >
     {c.name}
     {c.phone ? ` (${c.phone})` : ""}
    </button>
    ))
    )}
    </div>
   </>
   )}
   </div>
   <button
   type="button"
   onClick={() => setAddCustomerModalOpen(true)}
   className="shrink-0 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
   >
   + New Customer
   </button>
   </div>
   {(selectedCustomer || form.customerName || form.contactPhone || form.contactEmail) && (
   <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 space-y-2">
   <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
   <span className="text-gray-500 font-medium">Name</span>
   <span className="text-gray-900 font-medium">
    {(selectedCustomer?.name ?? form.customerName) || "—"}
   </span>
   <span className="text-gray-500 font-medium">Phone</span>
   <span className="text-gray-900">
    {(selectedCustomer?.phone ?? form.contactPhone) || "—"}
   </span>
   <span className="text-gray-500 font-medium">Email</span>
   <span className="text-gray-900">
    {(selectedCustomer?.email ?? form.contactEmail) || "—"}
   </span>
   </div>
   </div>
   )}
  </div>

  {/* Devices – multiple per ticket */}
  <div className="space-y-3">
   <div className="flex items-center justify-between gap-2">
   <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Devices</div>
   <button
   type="button"
   onClick={addDevice}
   disabled={addingDevice}
   className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50"
   >
   <Smartphone className="h-4 w-4" />
   {addingDevice ? "Adding…" : "Add another device"}
   </button>
   </div>
   {devices.map((device, idx) => (
   <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 space-y-1.5">
   <div className="flex items-center justify-between gap-2 mb-1.5">
   <span className="text-xs font-medium text-slate-600">Device {devices.length > 1 ? idx + 1 : ""}</span>
   {devices.length > 1 && (
    <button
    type="button"
    onClick={() => removeDevice(idx)}
    className="p-1 rounded text-red-600 hover:bg-red-50"
    title="Remove device"
    >
    <Trash2 className="h-4 w-4" />
    </button>
   )}
   </div>
   <div className="flex items-center gap-2 min-w-0">
   <span className="text-xs text-gray-500 shrink-0 w-16">Device</span>
   {editingField === `d-${idx}-deviceDescription` ? (
    <input
    type="text"
    value={device.deviceDescription}
    onChange={(e) => updateDeviceField(idx, "deviceDescription", e.target.value)}
    onBlur={() => { setEditingField(null); autoSave(); }}
    onKeyDown={(e) => e.key === "Enter" && (setEditingField(null), autoSave())}
    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    autoFocus
    />
   ) : (
    <button type="button" onClick={() => setEditingField(`d-${idx}-deviceDescription`)} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-sm font-medium text-blue-800 flex items-center justify-between gap-1 group">
    <span className={device.deviceDescription ? "truncate" : "text-gray-400"}>{device.deviceDescription || "—"}</span>
    <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
   )}
   </div>
   <div className="grid grid-cols-2 gap-x-4">
   <div className="flex items-center gap-2 min-w-0">
    <span className="text-xs text-gray-500 shrink-0 w-14">Serial</span>
    {editingField === `d-${idx}-serialNumber` ? (
    <input
    type="text"
    value={device.serialNumber ?? ""}
    onChange={(e) => updateDeviceField(idx, "serialNumber", e.target.value)}
    onBlur={() => { setEditingField(null); autoSave(); }}
    onKeyDown={(e) => e.key === "Enter" && (setEditingField(null), autoSave())}
    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500"
    autoFocus
    />
    ) : (
    <button type="button" onClick={() => setEditingField(`d-${idx}-serialNumber`)} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-sm font-mono font-medium text-neutral-800 flex items-center justify-between gap-1 group">
    <span className={device.serialNumber ? "truncate" : "text-gray-400"}>{device.serialNumber || "—"}</span>
    <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
    )}
   </div>
   <div className="flex items-center gap-2 min-w-0">
    <span className="text-xs text-gray-500 shrink-0 w-14">Password</span>
    {editingField === `d-${idx}-devicePassword` ? (
    <input
    type="text"
    value={device.devicePassword ?? ""}
    onChange={(e) => updateDeviceField(idx, "devicePassword", e.target.value)}
    onBlur={() => { setEditingField(null); autoSave(); }}
    onKeyDown={(e) => e.key === "Enter" && (setEditingField(null), autoSave())}
    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    autoFocus
    />
    ) : (
    <button type="button" onClick={() => setEditingField(`d-${idx}-devicePassword`)} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between gap-1 group">
    <span className={device.devicePassword ? "" : "text-gray-400"}>{device.devicePassword ? "••••••••" : "—"}</span>
    <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
    )}
   </div>
   </div>
   <div className="flex items-center gap-2 min-w-0 pt-1.5 mt-1.5 border-t border-slate-200/60">
   <span className="text-xs text-gray-500 shrink-0 w-16">Problem</span>
   {editingField === `d-${idx}-problemType` ? (
    <input
    type="text"
    value={device.problemType ?? ""}
    onChange={(e) => updateDeviceField(idx, "problemType", e.target.value)}
    onBlur={() => { setEditingField(null); autoSave(); }}
    onKeyDown={(e) => e.key === "Enter" && (setEditingField(null), autoSave())}
    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    autoFocus
    />
   ) : (
    <button type="button" onClick={() => setEditingField(`d-${idx}-problemType`)} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-sm font-medium text-neutral-800 flex items-center justify-between gap-1 group">
    <span className={device.problemType ? "truncate" : "text-gray-400"}>{device.problemType || "—"}</span>
    <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
   )}
   </div>
   <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-slate-200/60">
   <span className="text-xs text-gray-500 shrink-0 w-16">Est. cost</span>
   {editingField === `d-${idx}-estimatedCost` ? (
    <input
    type="number"
    min={0}
    step={0.01}
    value={device.estimatedCost ?? ""}
    onChange={(e) => updateDeviceField(idx, "estimatedCost", e.target.value ? Number(e.target.value) : null)}
    onBlur={() => { setEditingField(null); autoSave(); }}
    onKeyDown={(e) => e.key === "Enter" && (setEditingField(null), autoSave())}
    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    autoFocus
    />
   ) : (
    <button type="button" onClick={() => setEditingField(`d-${idx}-estimatedCost`)} className="px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-sm font-medium text-slate-800 flex items-center gap-1 group">
    <span>{device.estimatedCost != null ? `£${Number(device.estimatedCost).toFixed(2)}` : "—"}</span>
    <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
   )}
   </div>
   <div className="flex items-start gap-2 pt-1.5 mt-1.5 border-t border-slate-200/60">
   <span className="text-xs text-gray-500 shrink-0 w-16 pt-0.5">Notes</span>
   {editingField === `d-${idx}-notes` ? (
    <textarea
    value={device.notes ?? ""}
    onChange={(e) => updateDeviceField(idx, "notes", e.target.value)}
    onBlur={() => { setEditingField(null); autoSave(); }}
    rows={2}
    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    autoFocus
    />
   ) : (
    <button type="button" onClick={() => setEditingField(`d-${idx}-notes`)} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 text-sm text-slate-700 flex items-center justify-between gap-1 group">
    <span className={device.notes ? "line-clamp-2" : "text-gray-400"}>{device.notes || "—"}</span>
    <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
   )}
   </div>
   </div>
   ))}
  </div>

  {/* Notes – customer-facing vs internal */}
  <div className="space-y-1.5">
   <div className="flex items-start gap-2">
   <span className="text-xs text-gray-500 shrink-0 w-24 pt-0.5">Customer notes</span>
   {editingField === "notes" ? (
   <textarea
   value={form.notes ?? ""}
   onChange={(e) => setForm((f) => (f ? { ...f, notes: e.target.value } : null))}
   onBlur={() => { setEditingField(null); autoSave(); }}
   rows={2}
   className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
   autoFocus
   />
   ) : (
   <button type="button" onClick={() => setEditingField("notes")} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 text-sm text-slate-700 flex items-start justify-between gap-1 group">
   <span className={form.notes ? "line-clamp-2" : "text-gray-400"}>{form.notes || "—"}</span>
   <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
   </button>
   )}
   </div>
   <div className="flex items-start gap-2">
   <span className="text-xs text-gray-500 shrink-0 w-24 pt-0.5">Internal notes</span>
   {editingField === "internalNotes" ? (
   <textarea
   value={form.internalNotes ?? ""}
   onChange={(e) => setForm((f) => (f ? { ...f, internalNotes: e.target.value } : null))}
   onBlur={() => { setEditingField(null); autoSave(); }}
   rows={2}
   className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
   autoFocus
   />
   ) : (
   <button type="button" onClick={() => setEditingField("internalNotes")} className="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 text-sm text-slate-600 flex items-start justify-between gap-1 group">
   <span className={form.internalNotes ? "line-clamp-2" : "text-gray-400"}>{form.internalNotes || "—"}</span>
   <Pencil className="h-3 w-4 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
   </button>
   )}
   </div>
  </div>
  </div>
  </div>

  {/* Items total */}
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Items total</span>
  <span className="font-semibold text-gray-900">£{grandTotal.toFixed(2)}</span>
  </div>
  </div>
  </div>

  {/* Column 2: Amount due / Payment + Repair items + Notes */}
  <div className="space-y-4">
  {/* Payments recorded and/or amount due */}
  {(repair.payments && repair.payments.length > 0) || repair.sale ? (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
  <div className="flex items-center gap-2 text-emerald-800 font-medium">
   <CheckCircle className="h-5 w-5 shrink-0" />
   Payment(s) recorded
  </div>
  <ul className="space-y-2">
   {(repair.payments && repair.payments.length > 0 ? repair.payments : repair.sale ? [repair.sale] : []).map((p, i) => (
   <li key={p._id || i} className="flex justify-between items-center text-sm">
   <span className="text-emerald-800">
   {p.paymentKind === "deposit" ? "Deposit" : "Payment"} – {p.reference ?? "—"}
   {p.createdAt && (
    <span className="text-emerald-600 ml-1">
    {new Date(p.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    })}
    </span>
   )}
   </span>
   <span className="font-semibold text-emerald-900">£{Number(p.total).toFixed(2)}</span>
   </li>
   ))}
  </ul>
  <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm">
   <span className="text-emerald-700">Total due</span>
   <span className="font-semibold text-emerald-900">£{amountDue.toFixed(2)}</span>
  </div>
  <div className="flex justify-between text-sm">
   <span className="text-emerald-700">Total taken</span>
   <span className="font-semibold text-emerald-900">£{totalTaken.toFixed(2)}</span>
  </div>
  {amountRemaining > 0 && (
   <div className="pt-2 border-t border-neutral-200/50">
   <p className="text-xs text-neutral-800 font-medium">Amount remaining</p>
   <p className="text-lg font-bold text-neutral-900">£{amountRemaining.toFixed(2)}</p>
   </div>
  )}
  </div>
  ) : null}
  {(!repair.payments || repair.payments.length === 0) && !repair.sale && (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
  <div className="flex items-center gap-2 text-neutral-800 font-medium mb-1">
   <Banknote className="h-5 w-5 shrink-0" />
   Total due
  </div>
  <p className="text-2xl font-bold text-neutral-900">£{amountDue.toFixed(2)}</p>
  {amountDue <= 0 && (
   <p className="mt-1 text-xs text-neutral-700">Add repair items or set estimated cost, then take payment or deposit.</p>
  )}
  </div>
  )}

  {/* Repair items */}
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
  <button
  type="button"
  onClick={() => setFormsExpanded((e) => !e)}
  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
  >
  <div className="flex items-center gap-3">
   <Wrench className="h-5 w-5 text-neutral-600" />
   <span className="font-semibold text-gray-900">Repair items</span>
   {repairItems.length > 0 && (
   <span className="text-sm font-medium text-gray-500">({repairItems.length} items)</span>
   )}
  </div>
  {formsExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
  </button>
  {formsExpanded && (
  <div className="px-5 pb-5 pt-0 border-t border-gray-100">
   <div className="overflow-x-auto mt-4">
   <table className="w-full text-sm">
   <thead>
   <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
    <th className="pb-2 pr-4">#</th>
    <th className="pb-2 pr-4">Description</th>
    <th className="pb-2 pr-4 text-right">Qty</th>
    <th className="pb-2 pr-4 text-right">Unit price</th>
    <th className="pb-2 text-right">Total</th>
    <th className="pb-2 w-10" />
   </tr>
   </thead>
   <tbody>
   {repairItems.map((item, i) => (
    <tr key={i} className="border-b border-gray-100">
    <td className="py-2.5 pr-4 text-gray-500">{i + 1}</td>
    <td className="py-2.5 pr-4 text-gray-900">{item.description}</td>
    <td className="py-2.5 pr-4 text-right">1</td>
    <td className="py-2.5 pr-4 text-right font-medium">£{item.amount.toFixed(2)}</td>
    <td className="py-2.5 text-right font-medium">£{item.amount.toFixed(2)}</td>
    <td className="py-2.5">
    <button
    type="button"
    onClick={() => removeItem(i)}
    className="p-1 text-gray-400 hover:text-red-600 rounded"
    >
    <Trash2 className="h-4 w-4" />
    </button>
    </td>
    </tr>
   ))}
   </tbody>
   </table>
   </div>
   {repairItems.length === 0 && (
   <p className="text-sm text-gray-500 py-4">No items yet. Add labour or parts below.</p>
   )}
   <div className="mt-4 flex flex-wrap gap-2">
   <div ref={descContainerRef} className="relative flex-1 min-w-[180px]">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <Wrench className="h-4 w-4 text-gray-400" />
   </div>
   <input
   ref={descInputRef}
   type="text"
   value={newItemDesc}
   onChange={handleDescChange}
   onFocus={() => {
    if (newItemDesc.trim()) {
    setDescSuggestOpen(true);
    if (descSuggestions.length === 0) runDescSearch(newItemDesc);
    }
   }}
   onKeyDown={(e) => {
    if (descSuggestOpen && descSuggestions.length > 0) {
    if (e.key === "ArrowDown") {
     e.preventDefault();
     setDescActiveIndex((i) => (i + 1) % descSuggestions.length);
     return;
    }
    if (e.key === "ArrowUp") {
     e.preventDefault();
     setDescActiveIndex((i) => (i - 1 + descSuggestions.length) % descSuggestions.length);
     return;
    }
    if (e.key === "Escape") {
     setDescSuggestOpen(false);
     return;
    }
    if (e.key === "Enter" && descActiveIndex >= 0 && descActiveIndex < descSuggestions.length) {
     e.preventDefault();
     handleDescSelect(descSuggestions[descActiveIndex]);
     return;
    }
    }
    if (e.key === "Enter") {
    e.preventDefault();
    addItem();
    }
   }}
   placeholder="Description (type 3+ letters to search existing)"
   className="block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
   autoComplete="off"
   />
   {descSuggestOpen && descDropdownRect && (descSuggestLoading || descSuggestions.length > 0 || newItemDesc.trim().length > 0) && (
   <div
    className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
    style={{ top: descDropdownRect.top, left: descDropdownRect.left, width: descDropdownRect.width }}
   >
    {newItemDesc.trim().length > 0 && newItemDesc.trim().length < 3 && (
    <div className="px-3 py-2 text-xs text-gray-500">Type at least 3 letters to search…</div>
    )}
    {descSuggestLoading && descSuggestions.length === 0 && newItemDesc.trim().length >= 3 && (
    <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
    )}
    {!descSuggestLoading && descSuggestions.length === 0 && newItemDesc.trim().length >= 3 && (
    <div className="px-3 py-2 text-xs text-gray-500">No matches — will be added as new.</div>
    )}
    {descSuggestions.map((s, idx) => (
    <button
     key={`${s.description}-${idx}`}
     type="button"
     onMouseEnter={() => setDescActiveIndex(idx)}
     onClick={() => handleDescSelect(s)}
     className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
     idx === descActiveIndex ? "bg-blue-50" : "bg-white hover:bg-gray-50"
     }`}
    >
     <div className="font-medium text-gray-800 truncate">{s.description}</div>
     <div className="text-[11px] text-gray-500 truncate">£{Number(s.amount || 0).toFixed(2)}</div>
    </button>
    ))}
   </div>
   )}
   </div>
   <input
   type="number"
   min="0"
   step="0.01"
   value={newItemAmount}
   onChange={(e) => setNewItemAmount(e.target.value)}
   onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
   placeholder="£"
   className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
   />
   <button
   type="button"
   onClick={() => addItem()}
   disabled={addingItem}
   className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   <Plus className="h-4 w-4" />
   {addingItem ? "Saving..." : "Add"}
   </button>
   </div>
  </div>
  )}
  </div>

  </div>
 </div>
 </div>

 <AddCustomerModal
 open={addCustomerModalOpen}
 onClose={() => setAddCustomerModalOpen(false)}
 onAdd={handleAddCustomer}
 isLoading={false}
 />

 {/* Take payment – amount less than due is recorded as deposit; collection is separate */}
 {takePaymentModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => !paymentSubmitting && setTakePaymentModalOpen(false)} />
  <div role="dialog" aria-modal="true" aria-labelledby="take-payment-title" className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
  <div className="bg-gray-800 px-5 py-4 text-center">
  <h2 id="take-payment-title" className="text-lg font-semibold text-white">Take payment</h2>
  <p className="mt-0.5 text-sm text-gray-300">Record payment or deposit. Mark as collected later when the customer collects.</p>
  </div>
  <div className="p-5 space-y-5">
  <div className="text-center py-2">
  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount remaining</p>
  <p className="text-3xl font-bold text-gray-900 mt-0.5">£{amountRemaining.toFixed(2)}</p>
  <p className="mt-2 text-xs text-gray-500">
   {repairItems.length === 0
   ? "No repair items yet — will be recorded as a deposit."
   : "Less than amount due is recorded as a deposit."}
  </p>
  {amountDue <= 0 && (
   <p className="mt-2 text-sm text-neutral-600">Add repair items or set actual cost first.</p>
  )}
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Payment method</label>
  <select
   value={paymentMethod}
   onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card" | "credit" | "bank")}
   className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
  >
   <option value="cash">Cash</option>
   <option value="card">Card</option>
   <option value="credit">Credit</option>
   <option value="bank">Bank</option>
  </select>
  </div>

  <div>
  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Amount (£)</label>
  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
   <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 text-sm border-r border-gray-300">£</span>
   <input
   type="number"
   min="0"
   step="0.01"
   value={paymentAmount}
   onChange={(e) => setPaymentAmount(e.target.value)}
   placeholder="0.00"
   className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
   />
  </div>
  </div>

  <div className="flex gap-3 pt-1">
  <button
   type="button"
   onClick={() => !paymentSubmitting && setTakePaymentModalOpen(false)}
   disabled={paymentSubmitting}
   className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
  >
   Cancel
  </button>
  <button
   type="button"
   onClick={handleTakePaymentComplete}
   disabled={paymentSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
   className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
   {paymentSubmitting ? "Processing..." : "Complete"}
  </button>
  </div>
  </div>
  </div>
 </div>
 )}
 </div>
 );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, FileText, Receipt, RotateCcw, Trash2, PanelRightOpen, Package } from "lucide-react";
import {
 ProductGrid,
 CartPanel,
 AddManualItemModal,
} from "../../../sales-dashboard/components";
import {
 UnifiedAddInput,
 WholesalePaymentModal,
 CustomerAccountSelect,
 type AccountForSale,
} from "../../../wholesale-dashboard/components";
import { customerApi } from "../../../peoples/customers/service/customerApi";
import { supplierApi } from "../../../peoples/suppliers/service/supplierApi";
import { AddCustomerModal } from "../../../peoples/customers/components";
import type { CustomerFormData } from "../../../peoples/customers/types";
import type { WholesalePaymentDetails } from "../../../wholesale-dashboard/components/WholesalePaymentModal";
import { salesApi, formatCustomerAddressForInvoice } from "../../../sales-dashboard/service/salesApi";
import type { SaleRecord, SaleItemPayload, SaleItemRecord } from "../../../sales-dashboard/service/salesApi";
import { printInvoiceA4, printReceipt80mm } from "@/lib/invoicePrint";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import type { CartLineItem } from "../../../sales-dashboard/types";
import type { POSProduct } from "../../../sales-dashboard/types";
import { useInventoryProductsForSales } from "../../../sales-dashboard/hooks/useInventoryProductsForSales";
import { categoryApi } from "../../../inventory/category/service/categoryApi";

const parsePrice = (priceStr: string): number => {
 const num = parseFloat(priceStr.replace(/[^0-9.-]/g, ""));
 return isNaN(num) ? 0 : num;
};

function toItemPayload(item: SaleItemRecord): SaleItemPayload {
 return {
 sku: item.sku,
 name: item.name,
 price: item.price,
 quantity: item.quantity,
 unit: item.unit,
 serialNumbers: item.serialNumbers,
 serialColours: item.serialColours,
 grade: item.grade,
 brand: item.brand,
 colour: item.colour,
 brandModel: item.brandModel,
 capacity: item.capacity,
 };
}

function toCartLineItem(item: SaleItemPayload): CartLineItem {
 return {
 sku: item.sku,
 name: item.name,
 price: typeof item.price === "number" ? item.price.toFixed(2) : String(item.price),
 quantity: item.quantity,
 unit: item.unit,
 serialNumbers: item.serialNumbers,
 serialColours: item.serialColours,
 grade: item.grade,
 brand: item.brand,
 colour: item.colour,
 brandModel: item.brandModel,
 capacity: item.capacity,
 };
}

export default function EditSalePage() {
 const params = useParams();
 const router = useRouter();
 const id = params?.id as string;
 const { user } = usePermissionsContext();
 /** Matches backend: only legacy admin may hard-delete (not everyone with sale.delete). */
 const canHardDelete = (user?.role || "").toLowerCase() === "admin";

 const [sale, setSale] = useState<SaleRecord | null>(null);
 const [items, setItems] = useState<SaleItemPayload[]>([]);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [saveError, setSaveError] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);
 const [manualItemOpen, setManualItemOpen] = useState(false);
 const [productPanelOpen, setProductPanelOpen] = useState(false);
 const [orderSummaryCollapsed, setOrderSummaryCollapsed] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [printLoading, setPrintLoading] = useState<"invoice" | "receipt" | null>(null);
 const [paymentModalOpen, setPaymentModalOpen] = useState(false);
 const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
 const [deleting, setDeleting] = useState(false);
 const [hardDeleteConfirmRef, setHardDeleteConfirmRef] = useState("");
 const [hardDeleting, setHardDeleting] = useState(false);
 const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
 const [note, setNote] = useState("");
 const [selectedCustomer, setSelectedCustomer] = useState<AccountForSale | null>(null);
 const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
 const [addCustomerLoading, setAddCustomerLoading] = useState(false);

 const customerPricingGroupId =
  selectedCustomer && "pricingGroupId" in selectedCustomer && selectedCustomer.pricingGroupId
   ? String(selectedCustomer.pricingGroupId)
   : undefined;

 useEffect(() => {
 let cancelled = false;
 categoryApi.getCategories({ limit: 500, isActive: true }).then((res) => {
 if (cancelled || !res.success || !Array.isArray(res.data)) return;
 const map: Record<string, string> = {};
 (res.data as { name: string; icon?: string }[]).forEach((c) => {
 if (c.name && c.icon) map[c.name] = c.icon;
 });
 setCategoryIcons(map);
 }).catch(() => {});
 return () => { cancelled = true; };
 }, []);

 const {
 products: inventoryProducts,
 loading: productsLoading,
 error: productsError,
 refetch: refetchProducts,
 } = useInventoryProductsForSales({ pricingGroupId: customerPricingGroupId });
 const [search, setSearch] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("all");

 useEffect(() => {
 if (!id) return;
 const stored = typeof window !== "undefined" ? sessionStorage.getItem(`editSale_${id}`) : null;
 if (stored) {
 try {
 const parsed = JSON.parse(stored) as SaleRecord;
 setSale(parsed);
 setItems((parsed.items ?? []).map(toItemPayload));
 setNote(parsed.note ?? "");
 setLoadError(null);
 sessionStorage.removeItem(`editSale_${id}`);
 } catch (_) {}
 }
 let cancelled = false;
 (async () => {
 try {
 const res = await salesApi.getSaleById(id);
 if (cancelled) return;
 setSale(res.data);
 setItems((res.data?.items ?? []).map(toItemPayload));
 setNote(res.data?.note ?? "");
 setLoadError(null);
 } catch (e) {
 if (cancelled) return;
 setLoadError(e instanceof Error ? e.message : "Failed to load sale");
 setSale(null);
 setItems([]);
 }
 })();
 return () => { cancelled = true; };
 }, [id]);

 useEffect(() => {
 if (!sale || sale.type !== "wholesale") {
 setSelectedCustomer(null);
 return;
 }
 let cancelled = false;
 const cid =
 typeof sale.customerId === "object" && sale.customerId
 ? sale.customerId._id
 : typeof sale.customerId === "string"
 ? sale.customerId
 : null;
 (async () => {
 if (cid) {
  try {
  const custRes = await customerApi.getById(cid);
  if (!cancelled && custRes.success && custRes.data) {
   setSelectedCustomer(custRes.data as AccountForSale);
   return;
  }
  } catch {}
  try {
  const supRes = await supplierApi.getSupplier(cid);
  if (!cancelled && supRes.success && supRes.data) {
   setSelectedCustomer(supRes.data as AccountForSale);
   return;
  }
  } catch {}
 }
 if (!cancelled) {
  if (sale.customerName) {
  setSelectedCustomer({
   _id: cid || "",
   name: sale.customerName,
  } as AccountForSale);
  } else {
  setSelectedCustomer(null);
  }
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [sale]);

 const cartLineItems: CartLineItem[] = items.map(toCartLineItem);
 const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
 const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
 const originalDiscount = sale?.discount ?? 0;
 const originalTax = sale?.tax ?? 0;
 const discount = originalDiscount;
 const tax = originalTax;
 const total = Math.max(0, subtotal - discount + tax);

 const addToCart = useCallback((product: POSProduct, qty = 1) => {
 const price = parsePrice(product.price);
 const serial = product.serialNumber ? String(product.serialNumber).trim() : "";
 const isSerialItem = !!serial;
 // Serial items always add 1 (one IMEI = one unit). Non-serial respects requested qty.
 const quantity = isSerialItem ? 1 : (qty > 0 ? qty : 1);
 setItems((prev) => {
 // For serial items: skip if this exact IMEI is already on any line
 if (isSerialItem && prev.some((i) => (i.serialNumbers ?? []).includes(serial))) {
 return prev;
 }
 const existing = prev.find((i) => i.sku === product.sku);
 if (existing) {
 return prev.map((i) => {
  if (i.sku !== product.sku) return i;
  const nextSerials = isSerialItem
  ? [...(i.serialNumbers ?? []), serial]
  : i.serialNumbers;
  const nextQty = isSerialItem
  ? (nextSerials?.length ?? i.quantity + 1)
  : i.quantity + quantity;
  return { ...i, quantity: nextQty, serialNumbers: nextSerials };
 });
 }
 return [
 ...prev,
 {
  sku: product.sku,
  name: product.name,
  price,
  quantity,
  unit: product.unit,
  serialNumbers: isSerialItem ? [serial] : undefined,
  grade: product.grade,
  brand: product.brand,
  colour: product.colour,
  brandModel: product.brandModel,
  capacity: product.capacity,
 },
 ];
 });
 }, []);

 const addManualItem = useCallback((name: string, priceStr: string, quantity: number) => {
 const price = parseFloat(priceStr.replace(/[^0-9.-]/g, "")) || 0;
 if (!name.trim() || quantity < 1) return false;
 const sku = `MANUAL-${Date.now()}`;
 setItems((prev) => [...prev, { sku, name: name.trim(), price, quantity, unit: "piece" }]);
 return true;
 }, []);

 const updateQuantity = useCallback((sku: string, delta: number) => {
 setItems((prev) =>
 prev.map((i) => {
 if (i.sku !== sku) return i;
 const next = i.quantity + delta;
 return { ...i, quantity: next <= 0 ? 0 : next };
 }).filter((i) => i.quantity > 0)
 );
 }, []);

 const updatePrice = useCallback((sku: string, priceStr: string, serial?: string, wholeLine?: boolean) => {
 const price = parseFloat(priceStr.replace(/[^0-9.-]/g, ""));
 if (isNaN(price) || price < 0) return;

 // Items-summary whole-line update or no serial: change price on the matched line
 if (wholeLine || serial == null) {
 setItems((prev) =>
 prev.map((i) => {
  if (i.sku !== sku) return i;
  if (serial != null && (i.serialNumbers ?? []).includes(serial)) return { ...i, price };
  if (serial == null) return { ...i, price };
  return i;
 })
 );
 return;
 }

 // Per-serial price change in Serial Items Details → split into separate line
 setItems((prev) => {
 const result: SaleItemPayload[] = [];
 for (const item of prev) {
 if (item.sku !== sku || !(item.serialNumbers ?? []).includes(serial)) {
  result.push(item);
  continue;
 }
 // Same price → no split needed, just update
 if (item.price === price) {
  result.push(item);
  continue;
 }
 // Only 1 serial on this line → just update price directly
 if ((item.serialNumbers ?? []).length <= 1) {
  result.push({ ...item, price });
  continue;
 }
 // Multiple serials: remove this serial from original line
 const remainingSerials = (item.serialNumbers ?? []).filter((s) => s !== serial);
 result.push({
  ...item,
  serialNumbers: remainingSerials,
  quantity: remainingSerials.length,
 });
 // Check if a line with same sku and this price already exists → merge
 const existingIdx = result.findIndex(
  (r) => r.sku === sku && r.price === price && (r.serialNumbers ?? []).length > 0
 );
 if (existingIdx !== -1) {
  const existing = result[existingIdx];
  result[existingIdx] = {
  ...existing,
  serialNumbers: [...(existing.serialNumbers ?? []), serial],
  quantity: (existing.serialNumbers ?? []).length + 1,
  };
 } else {
  // Create a new line for this serial at the new price
  result.push({
  ...item,
  serialNumbers: [serial],
  quantity: 1,
  price,
  });
 }
 }
 return result;
 });
 }, []);

 const removeLine = useCallback((sku: string, serial?: string) => {
 setItems((prev) => {
 if (serial != null) {
 const result: SaleItemPayload[] = [];
 for (const i of prev) {
  if (i.sku !== sku || !(i.serialNumbers ?? []).includes(serial)) {
  result.push(i);
  continue;
  }
  // Remove only this serial from the line; keep the line if other serials remain
  const restSerials = (i.serialNumbers ?? []).filter((s) => s !== serial);
  if (restSerials.length > 0) {
  result.push({ ...i, serialNumbers: restSerials, quantity: restSerials.length });
  }
  // else: last serial on this line — drop the whole line
 }
 return result;
 }
 // Remove only the first item matching this SKU (not all — online orders can have duplicate SKUs)
 let removed = false;
 return prev.filter((i) => {
 if (!removed && i.sku === sku) {
  removed = true;
  return false;
 }
 return true;
 });
 });
 }, []);

 const clearCart = useCallback(() => setItems([]), []);

 const save = useCallback(async () => {
 if (!sale || items.length === 0) return;
 if (sale.type === "wholesale") {
 setPaymentModalOpen(true);
 return;
 }
 setSaving(true);
 setSaveError(null);
 try {
 await salesApi.updateSale(sale._id, {
 items,
 subtotal,
 tax,
 total,
 discount,
 note: note.trim(),
 });
 router.push("/sales-online-orders");
 } catch (e) {
 const msg = e instanceof Error ? e.message : "Failed to save";
 setSaveError(msg);
 } finally {
 setSaving(false);
 }
 }, [sale, items, subtotal, tax, total, discount, note, router]);

 const handlePaymentComplete = useCallback(
 async (details: WholesalePaymentDetails) => {
 if (!sale || sale.type !== "wholesale" || items.length === 0) return;
 setSaving(true);
 setSaveError(null);
 try {
 await salesApi.updateSale(sale._id, {
  items,
  subtotal,
  tax,
  total,
  discount: details.discount,
  discountType: details.discountType,
  discountValue: details.discountValue,
  amountDue: details.amountDue,
  payments: details.payments,
  note: note.trim(),
  customerId: selectedCustomer?._id || null,
  customerName: selectedCustomer?.name,
 });
 setPaymentModalOpen(false);
 router.push("/sales-online-orders");
 } catch (e) {
 const msg = e instanceof Error ? e.message : "Failed to save";
 setSaveError(msg);
 } finally {
 setSaving(false);
 }
 },
 [sale, items, subtotal, tax, total, discount, note, selectedCustomer, router]
 );

 const categories = React.useMemo(() => {
 const set = new Set(inventoryProducts.map((p) => p.category));
 return ["all", ...Array.from(set).sort()];
 }, [inventoryProducts]);

 const posProducts: POSProduct[] = React.useMemo(
 () =>
 inventoryProducts.map((p) => ({
 sku: p.sku,
 name: p.name,
 category: p.category,
 brand: p.brand ?? "",
 price: p.price,
 unit: p.unit,
 qty: p.qty,
 iconColor: p.iconColor,
 serialNumber: p.serialNumber,
 barcode: p.barcode,
 })),
 [inventoryProducts]
 );

 const filteredPosProducts = React.useMemo(() => {
 let list = posProducts;
 if (categoryFilter !== "all") list = list.filter((p) => p.category === categoryFilter);
 if (search.trim()) {
 const term = search.toLowerCase();
 list = list.filter(
 (p) =>
  p.name.toLowerCase().includes(term) ||
  p.sku.toLowerCase().includes(term) ||
  (p.brand ?? "").toLowerCase().includes(term)
 );
 }
 return list;
 }, [posProducts, categoryFilter, search]);

 const addBySku = useCallback((sku: string): boolean => {
 const term = sku.trim().toLowerCase();
 if (!term) return false;
 const product = posProducts.find(
 (p) => p.sku.toLowerCase() === term || p.name.toLowerCase().includes(term)
 );
 if (!product) return false;
 addToCart(product, 1);
 return true;
 }, [posProducts, addToCart]);

 const looksLikeSerial = (t: string) => /^\d{8,}$/.test(t) || (t.length >= 8 && /^[A-Za-z0-9]+$/.test(t));

 const handleAddByTerm = useCallback(
 async (term: string): Promise<boolean> => {
 const t = term.trim();
 if (!t) return false;
 if (looksLikeSerial(t)) {
 try {
  const res = await salesApi.getFindBySerial(t);
  const { saleId: foundSaleId, reference: invRef, line } = res.data;
  if (foundSaleId === id) {
  setMessage({ type: "error", text: `Serial ${t} is already on this invoice.` });
  return true;
  }
  setMessage({
  type: "error",
  text: `Already sold — Invoice ${invRef}. Sold to ${res.data.customerName || "Walk-in"}.`,
  });
  return true;
 } catch {
  // Not sold yet — look up the in-stock product matching this serial.
  try {
  const stockRes = await salesApi.getFindInStockSerial(t, customerPricingGroupId);
  const d = stockRes.data;
  const product: POSProduct = {
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
  };
  addToCart(product, 1);
  setMessage({ type: "success", text: `Added ${d.name} (serial)` });
  return true;
  } catch {
  // Long numeric barcodes can also match looksLikeSerial — try SKU as last resort.
  if (addBySku(t)) return true;
  setMessage({ type: "error", text: "Product or serial not found" });
  return true;
  }
 }
 }
 if (addBySku(t)) return true;
 setMessage({ type: "error", text: "Product not found" });
 return true;
 },
 [id, addToCart, addBySku, customerPricingGroupId]
 );

 const cartSearchSuggestions = React.useMemo(() => (search.trim() ? filteredPosProducts.slice(0, 8) : []), [search, filteredPosProducts]);

 if (!id) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <p className="text-gray-600">Missing sale ID.</p>
 <Link href="/sales-online-orders" className="text-orange-500 hover:underline mt-2 inline-block">
  ← Back to Sales
 </Link>
 </div>
 );
 }

 const retryLoad = useCallback(async () => {
 if (!id) return;
 setLoadError(null);
 try {
 const res = await salesApi.getSaleById(id);
 setSale(res.data);
 setItems((res.data?.items ?? []).map(toItemPayload));
 } catch (e) {
 setLoadError(e instanceof Error ? e.message : "Failed to load sale");
 }
 }, [id]);

 if (loadError && !sale) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-w-lg">
  <p className="text-neutral-800 font-medium">Could not load sale</p>
  <p className="text-neutral-700 text-sm mt-1">{loadError}</p>
  <p className="text-neutral-700 text-sm mt-2">
  Try: (1) Open from the Sales list — click the ⋮ menu on a row and choose Edit. (2) If you opened this page directly, ensure the backend is running and restart it so the edit API is available.
  </p>
  <div className="flex flex-wrap gap-2 mt-4">
  <button type="button" onClick={retryLoad} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
  Retry
  </button>
  <Link href="/sales-online-orders" className="inline-flex items-center gap-2 px-3 py-2 text-orange-600 hover:underline">
  <ArrowLeft size={18} /> Back to Sales
  </Link>
  </div>
 </div>
 </div>
 );
 }

 if (!sale) {
 return (
 <div className="min-h-screen bg-gray-100 flex items-center justify-center">
 <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
 </div>
 );
 }

 return (
 <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100">
 {message.text && (
 <div
  className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
  message.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 overflow-hidden">
 {/* Header: back + title + badge (like create-sales) */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
  <div className="flex items-center gap-3">
  <button
  type="button"
  onClick={() => router.push("/sales-online-orders")}
  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 hover:bg-blue-700"
  aria-label="Back to sales"
  >
  <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
  </button>
  <div className="min-w-0">
  <div className="flex items-center gap-2 flex-wrap">
  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Edit sale — {sale.reference}</h1>
  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide">Edit</span>
  </div>
  <p className="text-gray-500 text-xs sm:text-sm truncate mt-0.5">
  {cartItemCount > 0 ? `${cartItemCount} item${cartItemCount === 1 ? "" : "s"} in order` : "Add or remove items, then save"}
  </p>
  {(() => {
  const loc = typeof sale.locationId === "object" && sale.locationId ? sale.locationId : null;
  const locationName = loc?.name ?? (sale.locationId ? "—" : "Unknown location");
  return (
   <p className="text-gray-500 text-xs mt-0.5">
   Branch: {locationName}
   </p>
  );
  })()}
  </div>
  </div>
  <div className="flex flex-wrap items-center gap-2">
  <button
  type="button"
  onClick={() => router.push(`/sales-return/start/${sale._id}`)}
  disabled={!!sale.hasReturn}
  className="inline-flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
  >
  <RotateCcw className="h-4 w-4" /> Start return
  </button>
  <button
  type="button"
  onClick={() => setDeleteConfirmOpen(true)}
  disabled={deleting || !!sale.hasReturn}
  className="inline-flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
  >
  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Void sale
  </button>
  </div>
 </div>

 {saveError && (
  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between gap-2">
  <span>{saveError}</span>
  <button type="button" onClick={() => setSaveError(null)} className="text-red-600 hover:underline shrink-0">
  Dismiss
  </button>
  </div>
 )}

 {sale.hasReturn && (
  <div className="flex-shrink-0 p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
  <RotateCcw className="h-5 w-5 text-neutral-600 shrink-0" />
  <p className="text-sm font-medium text-neutral-800">
  This sale has been returned. Editing and deleting are disabled.
  </p>
  </div>
 )}

 {sale.type === "wholesale" && !sale.hasReturn && (
  <div className="flex-shrink-0 max-w-md">
  <label className="block text-xs font-medium text-gray-700 mb-1">Customer / account</label>
  <CustomerAccountSelect
   value={selectedCustomer}
   onChange={setSelectedCustomer}
   required={false}
   placeholder="Select customer or supplier"
   onAddCustomerClick={() => setAddCustomerModalOpen(true)}
   className="w-full"
  />
  </div>
 )}

 {/* Payment breakdown */}
 {sale.payments && (sale.payments.cash || sale.payments.card || sale.payments.bank || sale.payments.credit) && (
  <div className="flex-shrink-0">
  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
  <h3 className="text-sm font-semibold text-gray-900 mb-2">Payments</h3>
  <div className="flex flex-wrap gap-3">
  {sale.payments.cash ? (
   <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">Cash — £{sale.payments.cash.toFixed(2)}</span>
  ) : null}
  {sale.payments.card ? (
   <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">Card — £{sale.payments.card.toFixed(2)}</span>
  ) : null}
  {sale.payments.bank ? (
   <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">Bank — £{sale.payments.bank.toFixed(2)}</span>
  ) : null}
  {sale.payments.credit ? (
   <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">Balance to pay — £{sale.payments.credit.toFixed(2)}</span>
  ) : null}
  </div>
  </div>
  </div>
 )}

 {/* Always-visible add bar: search + action buttons (pinned at top, like create-sales) */}
 <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm px-2.5 py-2 sm:px-3">
  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
  <div className="flex-1 min-w-0">
  <UnifiedAddInput
  value={search}
  onChange={setSearch}
  onAdd={handleAddByTerm}
  disabled={!!sale.hasReturn}
  autoFocus
  placeholder="Scan IMEI / barcode or search by name or SKU…"
  suggestions={cartSearchSuggestions}
  onSuggestionSelect={(product) => {
   addToCart(product);
   setSearch("");
   setMessage({ type: "success", text: `Added ${product.name}` });
  }}
  id="edit-sale-unified-add"
  aria-label="Add item by scan or search. Press Enter to add."
  className="h-10 text-sm sm:h-11 sm:text-base"
  />
  </div>
  <div className="flex flex-wrap gap-1.5 shrink-0">
  <button
   type="button"
   onClick={async () => {
   setPrintLoading("invoice");
   try {
   await printInvoiceA4({
   _id: sale._id,
   reference: sale.reference,
   type: sale.type,
   createdAt: sale.createdAt,
   customerName: sale.customerName,
   customerAddress: formatCustomerAddressForInvoice(sale),
   items: items.map((i) => ({ name: i.name, sku: i.sku, price: i.price, quantity: i.quantity, unit: i.unit, serialNumbers: i.serialNumbers, grade: i.grade })),
   subtotal,
   tax,
   discount,
   total,
   paymentMethod: sale.paymentMethod,
   payments: sale.payments,
   previousBalance: sale.previousBalance,
   amountDue: sale.amountDue,
   balanceAfter: (sale as { balanceAfter?: number }).balanceAfter,
   });
   } finally {
   setPrintLoading(null);
   }
   }}
   disabled={printLoading !== null || !!sale.hasReturn}
   className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-2.5 sm:text-sm"
  >
   {printLoading === "invoice" ? <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" /> : <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />} Invoice A4
  </button>
  <button
   type="button"
   onClick={async () => {
   setPrintLoading("receipt");
   try {
   await printReceipt80mm({
   _id: sale._id,
   reference: sale.reference,
   type: sale.type,
   createdAt: sale.createdAt,
   customerName: sale.customerName,
   customerAddress: formatCustomerAddressForInvoice(sale),
   items: items.map((i) => ({ name: i.name, sku: i.sku, price: i.price, quantity: i.quantity, unit: i.unit, serialNumbers: i.serialNumbers, grade: i.grade })),
   subtotal,
   tax,
   discount,
   total,
   paymentMethod: sale.paymentMethod,
   payments: sale.payments,
   previousBalance: sale.previousBalance,
   amountDue: sale.amountDue,
   });
   } finally {
   setPrintLoading(null);
   }
   }}
   disabled={printLoading !== null || !!sale.hasReturn}
   className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-2.5 sm:text-sm"
  >
   {printLoading === "receipt" ? <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" /> : <Receipt className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />} Receipt 80mm
  </button>
  <button
   type="button"
   onClick={() => setProductPanelOpen((v) => !v)}
   className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:px-2.5 sm:text-sm"
   aria-label={productPanelOpen ? "Hide product grid" : "Show product grid"}
  >
   <PanelRightOpen className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />{" "}
   {productPanelOpen ? "Hide products" : "Show products"}
  </button>
  <button
   type="button"
   onClick={() => setManualItemOpen(true)}
   disabled={!!sale.hasReturn}
   className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100/80 disabled:cursor-not-allowed disabled:opacity-50 sm:px-2.5 sm:text-sm"
  >
   <Package className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Manual item
  </button>
  </div>
  </div>
 </div>

 {/* Two-column layout: left = products grid, right = cart */}
 <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
  {productPanelOpen && (
  <div className="min-h-0 overflow-hidden flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm flex-1 min-w-0">
  <div className="flex-1 min-h-0 overflow-auto p-3">
  {productsLoading ? (
   <div className="flex flex-col items-center justify-center py-16">
   <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
   <p className="text-gray-600">Loading products…</p>
   </div>
  ) : productsError ? (
   <div className="flex flex-col items-center justify-center p-6">
   <p className="text-red-600 text-center mb-3">{productsError}</p>
   <button type="button" onClick={() => refetchProducts()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
   <RefreshCw className="h-4 w-4" /> Retry
   </button>
   </div>
  ) : (
   <ProductGrid
   products={filteredPosProducts}
   categories={categories}
   search={search}
   categoryFilter={categoryFilter}
   onSearch={setSearch}
   onCategoryChange={setCategoryFilter}
   onAddToCart={addToCart}
   onAddManualItem={() => setManualItemOpen(true)}
   hideSearch
   categoryIcons={categoryIcons}
   />
  )}
  </div>
  </div>
  )}

  <div className="min-h-0 flex-1 min-w-0 flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm min-w-0">
  <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100">
  <h2 className="text-sm font-semibold text-gray-900">Current order</h2>
  <button
  type="button"
  onClick={() => setOrderSummaryCollapsed((v) => !v)}
  className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100"
  aria-label={orderSummaryCollapsed ? "Expand order" : "Collapse order"}
  >
  {orderSummaryCollapsed ? "Expand" : "Collapse"}
  </button>
  </div>
  <div className="flex-1 min-h-0 overflow-auto flex flex-col">
  <div className="px-3 pt-2 pb-1 border-b border-gray-100">
  <label htmlFor="edit-sale-note" className="block text-[11px] font-medium text-gray-600 mb-1">
   Note
  </label>
  <textarea
   id="edit-sale-note"
   value={note}
   onChange={(e) => setNote(e.target.value.slice(0, 2000))}
   placeholder="Add a note for this order (optional)"
   rows={2}
   className="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-y"
  />
  </div>
  <CartPanel
  title=""
  emptyHint={"Tap products or use \"Add manual item\" above"}
  items={cartLineItems}
  subtotal={subtotal}
  tax={tax}
  total={total}
  onUpdateQty={updateQuantity}
  onUpdatePrice={updatePrice}
  onRemove={removeLine}
  onClear={clearCart}
  onPay={save}
  payDisabled={saving || items.length === 0 || !!sale?.hasReturn}
  payDisabledLabel={
  sale?.hasReturn ? "Sale has been returned—editing disabled" : items.length === 0 ? "Add at least one item" : saving ? "Saving…" : undefined
  }
  accent="blue"
  collapsibleLines
  showItemsSummaryAndDetail
  primaryButtonLabel={saving ? "Saving…" : "Save changes"}
  />
  </div>
  </div>
 </div>
 </div>

 <AddManualItemModal
 open={manualItemOpen}
 onClose={() => setManualItemOpen(false)}
 onAdd={(name, price, quantity) => {
  const ok = addManualItem(name, price, quantity);
  if (ok) {
  setMessage({ type: "success", text: "Item added to order" });
  setManualItemOpen(false);
  }
  return ok;
 }}
 />

 {deleteConfirmOpen && sale && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && !hardDeleting && (setDeleteConfirmOpen(false), setHardDeleteConfirmRef(""))} aria-hidden />
  <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6" role="dialog" aria-labelledby="void-sale-title">
  <h3 id="void-sale-title" className="text-lg font-semibold text-gray-900 mb-2">Void this sale?</h3>
  <p className="text-sm text-gray-600 mb-4">
  Items will be returned to inventory and the sale will be marked voided.
  </p>
  <div className="flex flex-col gap-4">
  <div className="flex justify-end gap-2">
  <button
   type="button"
   onClick={() => !deleting && !hardDeleting && (setDeleteConfirmOpen(false), setHardDeleteConfirmRef(""))}
   disabled={deleting || hardDeleting}
   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
  >
   Cancel
  </button>
  <button
   type="button"
   onClick={async () => {
   if (!sale._id || deleting) return;
   setDeleting(true);
   try {
   await salesApi.deleteSale(sale._id);
   setMessage({ type: "success", text: "Sale voided; items returned to inventory" });
   setDeleteConfirmOpen(false);
   setHardDeleteConfirmRef("");
   router.push("/sales-online-orders");
   } catch (e) {
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to void sale" });
   setDeleting(false);
   }
   }}
   disabled={deleting || hardDeleting}
   className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 inline-flex items-center gap-2"
  >
   {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Void
  </button>
  </div>
  {canHardDelete && (
  <div className="border-t border-gray-200 pt-4">
   <p className="text-sm font-medium text-gray-700 mb-2">Permanently delete (admin only)</p>
   <p className="text-xs text-gray-500 mb-2">
   Type <strong>{sale.reference}</strong> to confirm. This cannot be undone.
   </p>
   <div className="flex gap-2">
   <input
   type="text"
   value={hardDeleteConfirmRef}
   onChange={(e) => setHardDeleteConfirmRef(e.target.value)}
   placeholder={sale.reference}
   className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
   disabled={hardDeleting}
   />
   <button
   type="button"
   onClick={async () => {
   if (!sale._id || hardDeleting || hardDeleteConfirmRef.trim() !== sale.reference) return;
   setHardDeleting(true);
   try {
    await salesApi.hardDeleteSale(sale._id, hardDeleteConfirmRef.trim());
    setMessage({ type: "success", text: "Sale permanently deleted" });
    setDeleteConfirmOpen(false);
    setHardDeleteConfirmRef("");
    router.push("/sales-online-orders");
   } catch (e) {
    setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to permanently delete sale" });
   } finally {
    setHardDeleting(false);
   }
   }}
   disabled={hardDeleting || hardDeleteConfirmRef.trim() !== sale.reference}
   className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
   >
   {hardDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
   Permanently delete
   </button>
   </div>
  </div>
  )}
  </div>
  </div>
 </div>
 )}

 {addCustomerModalOpen && (
 <AddCustomerModal
  open={addCustomerModalOpen}
  onClose={() => setAddCustomerModalOpen(false)}
  isLoading={addCustomerLoading}
  onAdd={async (data: CustomerFormData) => {
  setAddCustomerLoading(true);
  try {
   const res = await customerApi.create(data);
   if (res.success && res.data) {
   setSelectedCustomer(res.data as AccountForSale);
   setAddCustomerModalOpen(false);
   setMessage({ type: "success", text: `Customer "${res.data.name}" added and selected.` });
   }
  } catch (e) {
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to create customer" });
  } finally {
   setAddCustomerLoading(false);
  }
  }}
 />
 )}

 {sale?.type === "wholesale" && (
 <WholesalePaymentModal
  open={paymentModalOpen}
  total={total}
  customerName={selectedCustomer?.name ?? sale.customerName}
  previousBalance={sale.previousBalance ?? 0}
  initialDiscount={discount}
  initialDiscountType={sale.discountType}
  initialDiscountValue={sale.discountValue}
  initialPayments={
  sale.payments
  ? {
   cash: sale.payments.cash ?? 0,
   card: sale.payments.card ?? 0,
   credit: sale.payments.credit ?? 0,
   bank: sale.payments.bank ?? 0,
  }
  : undefined
  }
  primaryButtonLabel="Save changes"
  onClose={() => setPaymentModalOpen(false)}
  onComplete={handlePaymentComplete}
 />
 )}
 </div>
 );
}

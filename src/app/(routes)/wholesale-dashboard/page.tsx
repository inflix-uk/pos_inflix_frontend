"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useSalesDashboard } from "../sales-dashboard/hooks/useSalesDashboard";
import { useInventoryProductsForSales } from "../sales-dashboard/hooks/useInventoryProductsForSales";
import { useSalesItemTypeahead } from "../sales-dashboard/hooks/useSalesItemTypeahead";
import {
 ProductGrid,
 CartPanel,
 AddManualItemModal,
} from "../sales-dashboard/components";
import {
 CustomerAccountSelect,
 type CustomerAccountSelectRef,
 type AccountForSale,
 WholesalePaymentModal,
 BulkImeiDrawer,
 WholesaleStepper,
 type WholesaleStep,
 UnifiedAddInput,
 looksLikeSerial,
 EmptyCartQuickActions,
 CustomerContextStrip,
} from "./components";
import { useOrderWriter } from "./components/OrderWriterContext";
import { emitInventoryEvent } from "@/lib/inventoryEvents";
import type { CartLineItem } from "../sales-dashboard/types";
import { salesApi, formatAddressForInvoice } from "../sales-dashboard/service/salesApi";
import { customerApi } from "../peoples/customers/service/customerApi";
import { supplierApi } from "../peoples/suppliers/service/supplierApi";
import { AddCustomerModal } from "../peoples/customers/components";
import { getGeneralSettings } from "../settings/sales/service/generalSettingsApi";
import { getInventorySettings } from "../settings/general/service/inventorySettingsApi";
import type { Customer, CustomerFormData } from "../peoples/customers/types";
import { FileText, ChevronDown, Package, PanelRightOpen, MapPin, Trash2, Building2 } from "lucide-react";
import { categoryApi } from "../inventory/category/service/categoryApi";
import { locationApi } from "../peoples/locations/service/locationApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { HelpTip } from "@/components/HelpTip";

const CUSTOMER_DRAFT_KEY = "wholesale-selected-customer-v1";
const DRAFTS_STORAGE_KEY = "wholesale-drafts-v1";
const CREATE_SALES_LOCATION_KEY = "create-sales-locationId";
const MAX_DRAFTS = 3;

type SavedDraft = {
 id: string;
 savedAt: string;
 customer: AccountForSale | null;
 cart: CartLineItem[];
};

function getTodayDateString(): string {
 return new Date().toISOString().slice(0, 10);
}

function loadDraftsFromStorage(): SavedDraft[] {
 if (typeof window === "undefined") return [];
 try {
 const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
 if (!raw) return [];
 const parsed = JSON.parse(raw) as SavedDraft[];
 if (!Array.isArray(parsed)) return [];
 const today = getTodayDateString();
 const fromToday = parsed.filter((d) => (d.savedAt || "").slice(0, 10) === today);
 if (fromToday.length !== parsed.length) {
 window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(fromToday));
 }
 return fromToday;
 } catch {
 return [];
 }
}

function saveDraftToStorage(customer: AccountForSale | null, cart: CartLineItem[]): void {
 if (typeof window === "undefined") return;
 try {
 const today = getTodayDateString();
 const existing = loadDraftsFromStorage();
 const next: SavedDraft = {
 id: `draft-${Date.now()}`,
 savedAt: new Date().toISOString(),
 customer,
 cart: [...cart],
 };
 const merged = [...existing, next].sort(
 (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
 );
 const keep = merged.slice(-MAX_DRAFTS);
 window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(keep));
 } catch {
 // ignore
 }
}

const parsePrice = (priceStr: string): number => {
 const num = parseFloat(priceStr.replace(/[^0-9.-]/g, ""));
 return isNaN(num) ? 0 : num;
};

/** Align cart line / per-serial prices with current inventory list (e.g. after pricing group or rate list change). */
function syncCartLinePricesFromInventory(
 lines: CartLineItem[],
 inventory: Array<{ sku: string; serialNumber?: string; price: string }>
): CartLineItem[] {
 return lines.map((line) => {
 const serials = line.serialNumbers ?? [];
 if (serials.length > 0) {
 const sp = { ...(line.serialPrices ?? {}) };
 let changed = false;
 for (const sn of serials) {
 const inv = inventory.find((p) => p.serialNumber === sn);
 if (inv && sp[sn] !== inv.price) {
  sp[sn] = inv.price;
  changed = true;
 }
 }
 if (!changed) return line;
 const serialPrices = Object.keys(sp).length ? sp : undefined;
 const head = serials[0];
 const newLinePrice = (head && sp[head]) || line.price;
 return { ...line, serialPrices, price: newLinePrice };
 }
 const match =
 inventory.find((p) => p.sku === line.sku && !p.serialNumber) ??
 inventory.find((p) => p.sku === line.sku);
 if (match && match.price !== line.price) return { ...line, price: match.price };
 return line;
 });
}

function loadDraftCustomer(): AccountForSale | null {
 if (typeof window === "undefined") return null;
 try {
 const raw = window.localStorage.getItem(CUSTOMER_DRAFT_KEY);
 if (!raw) return null;
 return JSON.parse(raw) as AccountForSale;
 } catch {
 return null;
 }
}

type SaleForPrint = {
 _id: string;
 reference: string;
 type: "wholesale";
 createdAt: string;
 customerName?: string;
 customerAddress?: string;
 items: Array<{ name: string; sku?: string; price: number; quantity: number; unit?: string; serialNumbers?: string[]; serialColours?: Record<string, string>; grade?: string; brand?: string; colour?: string; brandModel?: string; capacity?: string }>;
 subtotal: number;
 tax: number;
 discount: number;
 discountType?: "flat" | "percent";
 discountValue?: number;
 total: number;
 payments?: { cash?: number; card?: number; credit?: number; bank?: number };
 previousBalance?: number;
 amountDue?: number;
 balanceAfter?: number;
};


const Page = () => {
 const orderWriter = useOrderWriter();
 const [manualItemModalOpen, setManualItemModalOpen] = useState(false);
 const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
 const [selectedCustomer, setSelectedCustomerState] = useState<AccountForSale | null>(null);
 const [previousBalanceForModal, setPreviousBalanceForModal] = useState<number | null>(null);
 const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
 const [orderSummaryCollapsed, setOrderSummaryCollapsed] = useState(false);
 const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
 const [addCustomerLoading, setAddCustomerLoading] = useState(false);
 const [notFoundModal, setNotFoundModal] = useState<{ open: boolean; term: string; message: string }>({ open: false, term: "", message: "" });
 const [alreadySoldModal, setAlreadySoldModal] = useState<{ open: boolean; term: string; reference: string; customerName: string }>({ open: false, term: "", reference: "", customerName: "" });
 const [serialLookupLoading, setSerialLookupLoading] = useState(false);
 const [saleNote, setSaleNote] = useState("");
 const [customReference, setCustomReference] = useState("");
 const [refStatus, setRefStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
 const refCheckSeqRef = useRef(0);
 const customerSelectRef = useRef<CustomerAccountSelectRef>(null);

 // Live invoice-number availability check (debounced). Empty input → idle (server will auto-generate).
 useEffect(() => {
 const raw = customReference.trim().toUpperCase();
 if (!raw) {
  setRefStatus("idle");
  return;
 }
 if (!/^[A-Z0-9\-\/_]{1,32}$/.test(raw)) {
  setRefStatus("invalid");
  return;
 }
 setRefStatus("checking");
 const seq = ++refCheckSeqRef.current;
 const controller = new AbortController();
 const timer = window.setTimeout(async () => {
  try {
  const res = await orderWriter.checkReference(raw, controller.signal);
  if (seq !== refCheckSeqRef.current) return;
  if (!res.success) { setRefStatus("idle"); return; }
  if (!res.data.valid) { setRefStatus("invalid"); return; }
  setRefStatus(res.data.exists ? "taken" : "available");
  } catch {
  if (seq === refCheckSeqRef.current) setRefStatus("idle");
  }
 }, 350);
 return () => {
  window.clearTimeout(timer);
  controller.abort();
 };
 }, [customReference, orderWriter]);

 useEffect(() => {
 if (typeof window === "undefined") return;
 if (selectedCustomer) {
 try {
 window.localStorage.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify(selectedCustomer));
 } catch {
 // ignore
 }
 }
 // When null we do not removeItem — migration effect needs to read it on refresh and move to drafts
 }, [selectedCustomer]);

 const setSelectedCustomer = setSelectedCustomerState;
 const [drafts, setDrafts] = useState<SavedDraft[]>([]);
 const [draftsOpen, setDraftsOpen] = useState(false);
 const draftsRef = useRef<HTMLDivElement>(null);

 // On load: move auto-saved session (cart + customer) into Drafts list so user restores from Drafts instead of auto-loading
 useEffect(() => {
 if (typeof window === "undefined") return;
 try {
 const rawCart = window.localStorage.getItem("wholesale-cart-v1");
 const rawCustomer = window.localStorage.getItem(CUSTOMER_DRAFT_KEY);
 let cart: CartLineItem[] = [];
 let customer: AccountForSale | null = null;
 if (rawCart) {
 try {
  const parsed = JSON.parse(rawCart);
  if (Array.isArray(parsed)) cart = parsed as CartLineItem[];
 } catch {}
 }
 if (rawCustomer) {
 try {
  customer = JSON.parse(rawCustomer) as AccountForSale;
 } catch {}
 }
 if (cart.length > 0 || customer) {
 const existing = loadDraftsFromStorage();
 const recovered: SavedDraft = {
  id: `draft-${Date.now()}`,
  savedAt: new Date().toISOString(),
  customer,
  cart: cart.length > 0 ? cart : [],
 };
 const merged = [...existing, recovered].sort(
  (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
 );
 const keep = merged.slice(-MAX_DRAFTS);
 window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(keep));
 window.localStorage.removeItem("wholesale-cart-v1");
 window.localStorage.removeItem(CUSTOMER_DRAFT_KEY);
 setDrafts(loadDraftsFromStorage());
 } else {
 setDrafts(loadDraftsFromStorage());
 }
 } catch {
 setDrafts(loadDraftsFromStorage());
 }
 }, []);

 const [retailModeEnabled, setRetailModeEnabled] = useState(() => {
 if (typeof window === "undefined") return false;
 try { return sessionStorage.getItem("create-sales-retailMode") === "1"; } catch { return false; }
 });
 const [blockNegativeStock, setBlockNegativeStock] = useState(() => {
 if (typeof window === "undefined") return false;
 try { return sessionStorage.getItem("create-sales-blockNegStock") === "1"; } catch { return false; }
 });
 const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
 const [categoryNames, setCategoryNames] = useState<string[]>([]);
 const [categoryVariantSlugOrderByCategoryId, setCategoryVariantSlugOrderByCategoryId] = useState<
 Record<string, string[]>
 >({});
 const [locations, setLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() => {
 if (typeof window === "undefined") return null;
 try {
 return localStorage.getItem(CREATE_SALES_LOCATION_KEY);
 } catch {
 return null;
 }
 });
 const [syncAllLocations, setSyncAllLocations] = useState<boolean>(() => {
 if (typeof window === "undefined") return false;
 try { return sessionStorage.getItem("create-sales-syncAllLocations") === "1"; } catch { return false; }
 });

 useEffect(() => {
 let cancelled = false;
 getInventorySettings()
 .then((res) => {
 if (cancelled) return;
 if (res?.success && res.data) {
  const v = res.data.syncAllLocations === true;
  setSyncAllLocations(v);
  try { sessionStorage.setItem("create-sales-syncAllLocations", v ? "1" : "0"); } catch {}
 }
 })
 .catch(() => {});
 return () => { cancelled = true; };
 }, []);

 // When syncAllLocations is on, ignore the per-location filter so all inventory is visible.
 const inventoryLocationId = syncAllLocations ? null : selectedLocationId;

 // ── Locations: own fast-path so selectedLocationId is set ASAP (products depend on it) ──
 useEffect(() => {
 if (typeof window === "undefined") return;
 let cancelled = false;

 // Instant hydrate from sessionStorage so locationId is available before the API responds
 try {
 const cached = sessionStorage.getItem("create-sales-locations-v1");
 if (cached) {
 const list = JSON.parse(cached) as Array<{ _id: string; name: string }>;
 if (list.length > 0) {
  setLocations(list);
  setSelectedLocationId((prev) => {
  if (prev && list.some((l) => l._id === prev)) return prev;
  const stored = localStorage.getItem(CREATE_SALES_LOCATION_KEY);
  return stored && list.some((l) => l._id === stored) ? stored : list[0]._id;
  });
 }
 }
 } catch { /* ignore */ }

 locationApi.getLocations({ isActive: true, limit: 200 })
 .then((locRes) => {
 if (cancelled) return;
 if (locRes?.success && Array.isArray(locRes.data)) {
  const list = (locRes.data as Array<{ _id: string; name: string }>).map((l) => ({ _id: l._id, name: l.name }));
  setLocations(list);
  try { sessionStorage.setItem("create-sales-locations-v1", JSON.stringify(list)); } catch {}
  if (list.length > 0) {
  setSelectedLocationId((prev) => {
  if (prev && list.some((l) => l._id === prev)) return prev;
  const stored = localStorage.getItem(CREATE_SALES_LOCATION_KEY);
  const id = stored && list.some((l) => l._id === stored) ? stored : list[0]._id;
  try { localStorage.setItem(CREATE_SALES_LOCATION_KEY, id); } catch {}
  return id;
  });
  }
 }
 })
 .catch(() => {});

 return () => { cancelled = true; };
 }, []);

 // ── Categories: own fast-path so category buttons appear instantly ──
 useEffect(() => {
 if (typeof window === "undefined") return;
 let cancelled = false;

 // Helper to process category response into names + icons + slug-order maps
 const processCategories = (data: { _id?: string; name: string; icon?: string; variantAttributes?: { slug?: string }[] }[]) => {
 const names: string[] = [];
 const map: Record<string, string> = {};
 const slugOrderMap: Record<string, string[]> = {};
 data.forEach((c) => {
 if (c.name) names.push(c.name);
 if (c.name && c.icon) map[c.name] = c.icon;
 if (c._id && Array.isArray(c.variantAttributes) && c.variantAttributes.length > 0) {
  slugOrderMap[String(c._id)] = c.variantAttributes
  .map((v) => String(v.slug ?? "").trim())
  .filter(Boolean);
 }
 });
 return { names, map, slugOrderMap };
 };

 // Instant hydrate from sessionStorage
 try {
 const cached = sessionStorage.getItem("create-sales-categories-v1");
 if (cached) {
 const data = JSON.parse(cached);
 if (Array.isArray(data) && data.length > 0) {
  const { names, map, slugOrderMap } = processCategories(data);
  setCategoryNames(names);
  setCategoryIcons(map);
  setCategoryVariantSlugOrderByCategoryId(slugOrderMap);
 }
 }
 } catch { /* ignore */ }

 categoryApi.getCategories({ limit: 500, isActive: true, slim: true })
 .then((catRes) => {
 if (cancelled) return;
 if (catRes?.success && Array.isArray(catRes.data)) {
  const data = catRes.data as { _id?: string; name: string; icon?: string; variantAttributes?: { slug?: string }[] }[];
  const { names, map, slugOrderMap } = processCategories(data);
  setCategoryNames(names);
  setCategoryIcons(map);
  setCategoryVariantSlugOrderByCategoryId(slugOrderMap);
  try { sessionStorage.setItem("create-sales-categories-v1", JSON.stringify(data)); } catch {}
 }
 })
 .catch(() => {});

 return () => { cancelled = true; };
 }, []);

 // ── Settings + walk-in (secondary — does NOT block locations, categories, or products) ──
 useEffect(() => {
 if (typeof window === "undefined") return;
 let cancelled = false;

 const settingsP = getGeneralSettings().catch(() => null);
 const walkInP = customerApi.getWalkIn().catch(() => null);

 Promise.all([settingsP, walkInP]).then(async ([setRes, walkInRes]) => {
 if (cancelled) return;

 if (setRes && setRes.success && setRes.data) {
 const isRetail = !!setRes.data.retailModeEnabled;
 setRetailModeEnabled(isRetail);
 try { sessionStorage.setItem("create-sales-retailMode", isRetail ? "1" : "0"); } catch {}

 const blockNeg = setRes.data.allowNegativeStock === false;
 setBlockNegativeStock(blockNeg);
 try { sessionStorage.setItem("create-sales-blockNegStock", blockNeg ? "1" : "0"); } catch {}

 const params = new URLSearchParams(window.location.search);
 const hasUrlAccount = params.has("customerId") || params.has("accountId");

 if (!hasUrlAccount) {
  if (setRes.data.salesAutoSelectAccountEnabled && setRes.data.defaultSalesAccountId) {
  const id = setRes.data.defaultSalesAccountId;
  const [custSettled, supSettled] = await Promise.allSettled([
  customerApi.getById(id),
  supplierApi.getSupplier(id),
  ]);
  if (cancelled) return;
  const cust = custSettled.status === "fulfilled" && custSettled.value?.success && custSettled.value?.data ? custSettled.value.data : null;
  const sup = supSettled.status === "fulfilled" && supSettled.value?.success && supSettled.value?.data ? supSettled.value.data : null;
  if (cust) setSelectedCustomerState(cust as AccountForSale);
  else if (sup) setSelectedCustomerState(sup as AccountForSale);
  } else if (isRetail && walkInRes && walkInRes.success && walkInRes.data) {
  setSelectedCustomerState(walkInRes.data as AccountForSale);
  }
 }
 }
 });

 return () => { cancelled = true; };
 }, []);

 const clearCartRef = useRef<() => void>(() => {});

 const handleLocationChange = useCallback((id: string) => {
 const value = id === "" ? null : id;
 setSelectedLocationId(value);
 try {
 if (value) localStorage.setItem(CREATE_SALES_LOCATION_KEY, value);
 else localStorage.removeItem(CREATE_SALES_LOCATION_KEY);
 } catch {}
 // Reset current order when location changes
 clearCartRef.current();
 }, []);

 // Re-fetch walk-in if retail mode was set but customer got cleared after init
 useEffect(() => {
 if (!retailModeEnabled || selectedCustomer) return;
 let cancelled = false;
 customerApi
 .getWalkIn()
 .then((res) => {
 if (!cancelled && res.success && res.data) setSelectedCustomerState(res.data as AccountForSale);
 })
 .catch(() => {});
 return () => { cancelled = true; };
 }, [retailModeEnabled, selectedCustomer]);

 useEffect(() => {
 if (!draftsOpen) return;
 const handleClickOutside = (e: MouseEvent) => {
 if (draftsRef.current && !draftsRef.current.contains(e.target as Node)) setDraftsOpen(false);
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [draftsOpen]);

 const [productPanelOpen, setProductPanelOpen] = useState(retailModeEnabled);

 // Keep product panel default in sync when mode changes from API
 const prevRetailModeRef = useRef(retailModeEnabled);
 useEffect(() => {
 if (prevRetailModeRef.current !== retailModeEnabled) {
 setProductPanelOpen(retailModeEnabled);
 prevRetailModeRef.current = retailModeEnabled;
 }
 }, [retailModeEnabled]);

 const [showInvoiceStep, setShowInvoiceStep] = useState(false);
 const [saleForPrint, setSaleForPrint] = useState<SaleForPrint | null>(null);
 const customerPricingGroupId = selectedCustomer && "pricingGroupId" in selectedCustomer ? (selectedCustomer as Customer).pricingGroupId ?? undefined : undefined;
 const prevPricingGroupIdRef = useRef<string | undefined>(undefined);

 // When switching to a customer with NO pricing group, clear serial lookup cache so no stale group price is reused.
 useEffect(() => {
 const hadGroup = Boolean(prevPricingGroupIdRef.current);
 const hasGroup = Boolean(customerPricingGroupId);
 prevPricingGroupIdRef.current = customerPricingGroupId;
 if (hadGroup && !hasGroup) salesApi.clearSerialCache();
 }, [customerPricingGroupId]);

 const { products: inventoryProducts, soldInfoMap, loading: productsLoading, error: productsError, refetch: refetchProducts } = useInventoryProductsForSales({
 pricingGroupId: customerPricingGroupId,
 locationId: inventoryLocationId,
 });

 // On mount: clear serial lookup cache so first add-by-serial uses latest price (e.g. after returning from Rate List).
 useEffect(() => {
 salesApi.clearSerialCache();
 }, []);

 // Refetch product list and clear serial cache when tab becomes visible so Rate List price updates are reflected (grid, serial scan, and cart).
 useEffect(() => {
 if (typeof document === "undefined") return;
 const onVisibility = () => {
 if (document.visibilityState === "visible") {
 salesApi.clearSerialCache();
 refetchProducts();
 }
 };
 document.addEventListener("visibilitychange", onVisibility);
 return () => document.removeEventListener("visibilitychange", onVisibility);
 }, [refetchProducts]);

 // Always use inventory (parcels) only — never fall back to demo/context products so only real stock is shown
 const posProductsOverride = useMemo(
 () =>
 inventoryProducts.map((p) => ({
 sku: p.sku,
 name: p.name,
 category: p.category,
 brand: p.brand,
 price: p.price,
 unit: p.unit,
 qty: p.qty,
 iconColor: p.iconColor,
 serialNumber: p.serialNumber,
 barcode: p.barcode,
 grade: p.grade,
 colour: p.colour,
 brandModel: p.brandModel,
 capacity: p.capacity,
 categoryId: p.categoryId,
 variantValues: p.variantValues,
 unitCost: p.unitCost,
 purchaseId: p.purchaseId,
 purchaseItemId: p.purchaseItemId,
 inventoryDate: p.inventoryDate,
 })),
 [inventoryProducts]
 );
 const {
 cart,
 filteredProducts,
 categories,
 search,
 categoryFilter,
 setSearch,
 setCategoryFilter,
 addToCart,
 addBulkSerialsToCart,
 addBySku,
 addManualItem,
 updateQuantity,
 updateLinePrice,
 removeLine,
 clearCart,
 replaceCart,
 subtotal,
 tax,
 total,
 paymentModalOpen,
 openPaymentModal,
 closePaymentModal,
 message,
 showMessage,
 } = useSalesDashboard({
 productsOverride: posProductsOverride ?? null,
 soldInfoMap: soldInfoMap ?? null,
 draftStorageKey: "wholesale-cart-v1",
 locationId: selectedLocationId,
 pricingGroupId: customerPricingGroupId,
 categoriesOverride: categoryNames.length > 0 ? categoryNames : null,
 blockNegativeStock,
 });

 const cartRef = useRef(cart);
 cartRef.current = cart;
 clearCartRef.current = clearCart;

 const handleSaveDraft = () => {
 saveDraftToStorage(selectedCustomer, cart);
 setDraftSavedAt(new Date());
 setDrafts(loadDraftsFromStorage());
 showMessage("success", "Draft saved. You can retrieve it from Drafts.");
 };

 const handleRestoreDraft = (draft: SavedDraft) => {
 if (cart.length > 0 && !window.confirm("Replace current order with this draft?")) return;
 replaceCart(syncCartLinePricesFromInventory(draft.cart, inventoryProducts));
 setSelectedCustomerState(draft.customer);
 setDraftsOpen(false);
 showMessage("success", "Draft restored.");
 };

 // When pricing group or inventory list changes, sync cart prices (per-serial first). Avoid depending on `cart` to prevent feedback loops.
 useEffect(() => {
 const lines = cartRef.current;
 if (lines.length === 0 || inventoryProducts.length === 0) return;
 const updated = syncCartLinePricesFromInventory(lines, inventoryProducts);
 const hasChange = updated.some((line, i) => {
 const prev = lines[i];
 if (!prev || line.sku !== prev.sku) return true;
 if (line.price !== prev.price) return true;
 return (
 JSON.stringify(line.serialPrices ?? {}) !== JSON.stringify(prev.serialPrices ?? {})
 );
 });
 if (hasChange) replaceCart(updated);
 }, [customerPricingGroupId, inventoryProducts, replaceCart]);

 // When payment modal opens, fetch latest customer balance so Previous Balance is correct (e.g. after draft restore or stale list)
 useEffect(() => {
 if (!paymentModalOpen || !selectedCustomer?._id) {
 setPreviousBalanceForModal(null);
 return;
 }
 const isCustomer = "contactName" in selectedCustomer;
 if (!isCustomer) {
 setPreviousBalanceForModal("balance" in selectedCustomer && typeof (selectedCustomer as { balance?: number }).balance === "number" ? (selectedCustomer as { balance: number }).balance : 0);
 return;
 }
 let cancelled = false;
 customerApi
 .getById(selectedCustomer._id)
 .then((res) => {
 if (!cancelled && res?.data && typeof (res.data as { balance?: number }).balance === "number") {
  setPreviousBalanceForModal((res.data as { balance: number }).balance);
 } else {
  setPreviousBalanceForModal(selectedCustomer && "balance" in selectedCustomer && typeof selectedCustomer.balance === "number" ? selectedCustomer.balance : 0);
 }
 })
 .catch(() => {
 if (!cancelled) setPreviousBalanceForModal(selectedCustomer && "balance" in selectedCustomer && typeof selectedCustomer.balance === "number" ? selectedCustomer.balance : 0);
 });
 return () => {
 cancelled = true;
 };
 }, [paymentModalOpen, selectedCustomer?._id]);

 const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

 const handleAddByTerm = useCallback(
 async (term: string): Promise<boolean> => {
 const t = term.trim();
 if (!t) return false;
 setSerialLookupLoading(true);
 try {
 if (looksLikeSerial(t)) {
 // Always use API for serial add so price is from backend (Rate List updates SerialIndex; grid can be stale).
 // In-stock first: one round trip for the common case (serial in stock)
 try {
  const res = await salesApi.getFindInStockSerial(t, customerPricingGroupId);
  const d = res.data;
  const product = {
  sku: d.sku,
  name: d.name,
  category: d.category ?? "",
  brand: d.brand ?? "",
  price: `£${Number(d.price).toFixed(2)}`,
  unit: "piece" as const,
  qty: 1,
  iconColor: "text-orange-600",
  serialNumber: d.serial,
  grade: (d as { grade?: string }).grade,
  colour: (d as { colour?: string }).colour,
  brandModel: (d as { brandModel?: string }).brandModel,
  capacity: (d as { capacity?: string }).capacity,
  inventoryDate: (d as { purchaseDate?: string | null }).purchaseDate ?? undefined,
  categoryId: (d as { categoryId?: string }).categoryId,
  variantValues: (d as { variantValues?: { slug?: string; value?: string }[] }).variantValues,
  };
  addToCart(product, 1);
  showMessage("success", `Added ${d.name} (serial)`);
  return true;
 } catch (err) {
  const e = err as Error & { status?: string; soldInfo?: { reference?: string; customerName?: string } | null };
  // Backend already tells us the serial is sold and includes soldInfo — no extra round-trip needed.
  if (e?.status === "already_sold") {
  const ref = e.soldInfo?.reference || "";
  const cust = e.soldInfo?.customerName || "";
  if (ref || cust) {
   setAlreadySoldModal({ open: true, term: t, reference: ref, customerName: cust });
   return true;
  }
  // Fallback: backend didn't include soldInfo (legacy) — fetch it
  const soldRes = await salesApi.getFindBySerial(t).catch(() => null);
  const { reference = "", customerName = "" } = soldRes?.data || {};
  setAlreadySoldModal({ open: true, term: t, reference, customerName });
  return true;
  }
  // Long numeric barcodes (EAN/UPC) also match looksLikeSerial; race SKU/barcode lookup
  // against the already-sold check so the warning appears in one round-trip instead of two.
  const [skuOk, soldRes] = await Promise.all([
  addBySku(t),
  salesApi.getFindBySerial(t).then((r) => r).catch(() => null),
  ]);
  if (skuOk) return true;
  if (soldRes?.data) {
  const { reference, customerName } = soldRes.data;
  setAlreadySoldModal({ open: true, term: t, reference: reference || "", customerName: customerName || "" });
  } else {
  setNotFoundModal({ open: true, term: t, message: "Serial not found or returned to supplier." });
  }
  return true;
 }
 }
 const ok = await addBySku(t);
 if (ok) return true;
 try {
 const res = await salesApi.getFindInStockSerial(t, customerPricingGroupId);
 const d = res.data;
 const product = {
  sku: d.sku,
  name: d.name,
  category: d.category ?? "",
  brand: d.brand ?? "",
  price: `£${Number(d.price).toFixed(2)}`,
  unit: "piece" as const,
  qty: 1,
  iconColor: "text-orange-600",
  serialNumber: d.serial,
  grade: (d as { grade?: string }).grade,
  colour: (d as { colour?: string }).colour,
  brandModel: (d as { brandModel?: string }).brandModel,
  capacity: (d as { capacity?: string }).capacity,
  inventoryDate: (d as { purchaseDate?: string | null }).purchaseDate ?? undefined,
  categoryId: (d as { categoryId?: string }).categoryId,
  variantValues: (d as { variantValues?: { slug?: string; value?: string }[] }).variantValues,
 };
 addToCart(product, 1);
 showMessage("success", `Added ${d.name} (serial)`);
 return true;
 } catch {
 const soldRes = await salesApi.getFindBySerial(t).catch(() => null);
 if (soldRes?.data) {
  const { reference, customerName } = soldRes.data;
  setAlreadySoldModal({ open: true, term: t, reference: reference || "", customerName: customerName || "" });
 } else {
  setNotFoundModal({ open: true, term: t, message: "Product or serial not found" });
 }
 }
 return true;
 } finally {
 setSerialLookupLoading(false);
 }
 },
 [addToCart, addBySku, showMessage, inventoryProducts, customerPricingGroupId]
 );

 useEffect(() => {
 if (!selectedCustomer && cart.length === 0) return;
 const t = setTimeout(() => {
 saveDraftToStorage(selectedCustomer, cart);
 setDraftSavedAt(new Date());
 setDrafts(loadDraftsFromStorage());
 }, 2000);
 return () => clearTimeout(t);
 }, [selectedCustomer, cart]);

 useEffect(() => {
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
 e.preventDefault();
 (document.getElementById("wholesale-unified-add") as HTMLInputElement)?.focus();
 }
 if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
 if (selectedCustomer && cart.length > 0) {
  e.preventDefault();
  openPaymentModal();
 }
 }
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [selectedCustomer, cart.length, openPaymentModal]);
 const cartSerials = useMemo(
 () =>
 new Set(
 cart.flatMap((i) => i.serialNumbers ?? []).filter(Boolean)
 ),
 [cart]
 );
 // Server-side typeahead: hits /api/purchases/sales-typeahead (indexed) so the
 // suggestion dropdown is instant even before the bulk inventory fetch finishes.
 const { results: typeaheadResults } = useSalesItemTypeahead({
 query: search,
 pricingGroupId: customerPricingGroupId,
 locationId: inventoryLocationId,
 limit: 12,
 });
 const cartSearchSuggestions = useMemo(() => {
 const term = search.trim();
 if (!term) return [];
 // Prefer server results when available; fall back to the in-memory filter while loading.
 if (typeaheadResults.length > 0) return typeaheadResults.slice(0, 8);
 return filteredProducts.slice(0, 8);
 }, [search, typeaheadResults, filteredProducts]);

 const currentStep: WholesaleStep = !selectedCustomer ? 1 : cartItemCount === 0 ? 2 : 3;
 const canComplete = Boolean(cartItemCount > 0 && (retailModeEnabled || selectedCustomer));
 const completeDisabledReason: "none" | "no_customer" | "no_items" =
 retailModeEnabled
 ? cartItemCount === 0
 ? "no_items"
 : "none"
 : !selectedCustomer
 ? "no_customer"
 : cartItemCount === 0
  ? "no_items"
  : "none";

 return (
 <div className={`@container h-full min-h-0 flex flex-col overflow-hidden ${retailModeEnabled ? "bg-[#f1f1f9]" : "bg-gray-100"}`}>
 {message.text && (
 <div
  className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-lg shadow-lg text-xs @[640px]:text-sm font-medium max-w-[calc(100vw-1rem)] break-words text-center ${
  message.type === "success"
  ? "bg-green-600 text-white"
  : "bg-red-600 text-white"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="flex-1 min-h-0 flex flex-col p-1.5 @[480px]:p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-5 gap-1.5 @[640px]:gap-2 @[768px]:gap-3 overflow-hidden">
 {/* Top customer-context toolbar removed — context info available inline in the toolbar and Complete Order modal. */}

 {/* ── Always-visible add bar: search + action buttons (pinned at top) ── */}
 <div className="flex-shrink-0 rounded-lg border border-gray-200 bg-white shadow-sm px-1.5 py-1 @[640px]:px-2 @[640px]:py-1.5">
  <div className="flex flex-wrap items-center gap-1 @[640px]:gap-1.5">
  <div className="flex-1 min-w-[120px] max-w-[40%]">
  <UnifiedAddInput
   value={search}
   onChange={setSearch}
   onAdd={handleAddByTerm}
   disabled={!selectedCustomer && !retailModeEnabled}
   autoFocus
   suggestions={cartSearchSuggestions}
   onSuggestionSelect={(product) => {
   if (product.serialNumber && cart.some((i) => i.sku === product.sku)) {
   showMessage("error", "Serial item already in cart (one per order)");
   return;
   }
   addToCart(product);
   setSearch("");
   showMessage("success", `Added ${product.name}`);
   }}
   id="wholesale-unified-add"
   aria-label="Add item by scan or search. Press Enter to add. Ctrl+K to focus."
   className="h-7 text-[11px] @[640px]:h-8 @[640px]:text-xs rounded-md"
  />
  </div>
  {!retailModeEnabled && (
  <div className="relative shrink-0 w-20 @[640px]:w-28">
  <input
   id="wholesale-invoice-number"
   type="text"
   value={customReference}
   onChange={(e) => setCustomReference(e.target.value.slice(0, 32))}
   placeholder="Inv #"
   autoComplete="off"
   spellCheck={false}
   title={
   refStatus === "available" ? "Available"
   : refStatus === "taken" ? "Already used — pick another"
   : refStatus === "invalid" ? "Invalid format (A-Z 0-9 - / _, max 32)"
   : refStatus === "checking" ? "Checking…"
   : "Leave empty to auto-generate INV-XXXXXX"
   }
   className={`h-7 @[640px]:h-8 w-full text-[11px] @[640px]:text-xs uppercase tracking-wide text-gray-900 placeholder-gray-400 placeholder:normal-case placeholder:tracking-normal border rounded-md px-1.5 pr-5 focus:outline-none focus:ring-1 ${
   refStatus === "available"
   ? "border-green-500 ring-green-200 focus:ring-green-400 focus:border-green-500 bg-green-50"
   : refStatus === "taken" || refStatus === "invalid"
   ? "border-red-500 ring-red-200 focus:ring-red-400 focus:border-red-500 bg-red-50"
   : "border-gray-300 focus:ring-blue-400 focus:border-blue-400"
   }`}
  />
  <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px]">
   {refStatus === "checking" && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
   {refStatus === "available" && <span className="text-green-600 font-bold">✓</span>}
   {(refStatus === "taken" || refStatus === "invalid") && <span className="text-red-600 font-bold">✕</span>}
  </div>
  </div>
  )}
  <CustomerAccountSelect
   ref={customerSelectRef}
   value={selectedCustomer}
   onChange={setSelectedCustomer}
   required={!retailModeEnabled}
   placeholder={retailModeEnabled ? "Walk-in Customer" : "Customer *"}
   onAddCustomerClick={() => setAddCustomerModalOpen(true)}
   compact
   className={retailModeEnabled ? "ml-auto min-w-[160px] @[640px]:min-w-[180px] max-w-[220px] @[768px]:max-w-[240px]" : "min-w-[90px] @[640px]:min-w-[110px] max-w-[140px] @[768px]:max-w-[160px]"}
  />
  {locations.length > 0 && (
   <div className="relative shrink-0 h-7 @[640px]:h-8">
   <MapPin className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
   <select
    value={selectedLocationId ?? ""}
    onChange={(e) => handleLocationChange(e.target.value)}
    className={`h-full appearance-none rounded-md border border-gray-300 bg-white pl-6 pr-5 text-[11px] @[640px]:text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${retailModeEnabled ? "min-w-[120px] @[640px]:min-w-[140px]" : ""}`}
    aria-label="Sale location"
   >
    {locations.map((loc) => (
    <option key={loc._id} value={loc._id}>
     {loc.name}
    </option>
    ))}
   </select>
   <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
   </div>
  )}
  {!retailModeEnabled && (
  <button
   type="button"
   onClick={() => setBulkDrawerOpen(true)}
   disabled={!selectedCustomer && !retailModeEnabled}
   className="inline-flex items-center justify-center gap-1 h-7 @[640px]:h-8 rounded-md border border-gray-300 bg-white px-1.5 @[640px]:px-2 text-[11px] @[640px]:text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
   title={
   selectedCustomer || retailModeEnabled
   ? "Paste or upload bulk IMEIs"
   : "Select customer to load pricing/terms."
   }
   aria-label="Bulk IMEIs"
  >
   <Package className="h-3 w-3 shrink-0" />
   <span>Bulk</span>
  </button>
  )}
  {!retailModeEnabled && (
  <button
   type="button"
   onClick={() => setProductPanelOpen((v) => !v)}
   className="inline-flex items-center justify-center gap-1 h-7 @[640px]:h-8 rounded-md border border-gray-300 bg-white px-1.5 @[640px]:px-2 text-[11px] @[640px]:text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-50 shrink-0"
   aria-label={productPanelOpen ? "Hide product grid" : "Show product grid"}
   title={productPanelOpen ? "Hide products" : "Show products"}
  >
   <PanelRightOpen className="h-3 w-3 shrink-0" />
   <span>{productPanelOpen ? "Hide" : "Show"}</span>
  </button>
  )}
  {!retailModeEnabled && (
  <button
   type="button"
   onClick={handleSaveDraft}
   className="inline-flex items-center justify-center gap-1 h-7 @[640px]:h-8 rounded-md border border-gray-300 bg-white px-1.5 @[640px]:px-2 text-[11px] @[640px]:text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-50 shrink-0"
   aria-label="Save draft"
   title="Save current cart as a draft"
  >
   <FileText className="h-3 w-3 shrink-0" />
   <span>Save</span>
  </button>
  )}
  {!retailModeEnabled && (
  <div className="relative shrink-0" ref={draftsRef}>
   <button
    type="button"
    onClick={() => {
    setDrafts(loadDraftsFromStorage());
    setDraftsOpen((v) => !v);
    }}
    className="inline-flex items-center justify-center gap-1 h-7 @[640px]:h-8 rounded-md border border-gray-300 bg-white px-1.5 @[640px]:px-2 text-[11px] @[640px]:text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-50"
    aria-label="Open drafts"
    title="Open saved drafts"
   >
    <span>Drafts{drafts.length > 0 ? ` (${drafts.length})` : ""}</span>
    <ChevronDown className="h-3 w-3 shrink-0" />
   </button>
   {draftsOpen && (
    <>
    <div
     className="fixed inset-0 z-40 bg-black/30 sm:hidden"
     onClick={() => setDraftsOpen(false)}
     aria-hidden="true"
    />
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-auto bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 sm:absolute sm:left-auto sm:top-full sm:right-0 sm:translate-x-0 sm:translate-y-0 sm:mt-1 sm:w-72 sm:max-w-[calc(100vw-1rem)] sm:max-h-64 sm:shadow-lg sm:z-20">
    {drafts.length === 0 ? (
    <div className="px-3 @[640px]:px-4 py-2 @[640px]:py-3 flex items-start gap-2 text-xs @[640px]:text-sm text-gray-600">
    <span>No drafts from today.</span>
    <HelpTip align="end" ariaLabel="About drafts" iconClassName="h-3.5 w-3.5">
     Save draft to store this order. Drafts are kept for today only and clear at midnight (max 3).
    </HelpTip>
    </div>
    ) : (
    <>
    {drafts.map((d) => {
     const itemCount = d.cart.reduce((s, i) => s + i.quantity, 0);
     const draftTotal = d.cart.reduce(
     (s, i) => s + parseFloat(String(i.price).replace(/[^0-9.-]/g, "")) * i.quantity,
     0
     );
     const timeStr = d.savedAt ? formatDateTimeLondon(d.savedAt) : "";
     return (
     <button
     key={d.id}
     type="button"
     role="option"
     onClick={() => handleRestoreDraft(d)}
     className="w-full text-left px-3 @[640px]:px-4 py-2 @[640px]:py-3 hover:bg-gray-50 text-xs @[640px]:text-sm border-b border-gray-100 last:border-b-0"
     >
     <span className="font-medium text-gray-900 block truncate">
     {d.customer?.name ?? "No customer"}
     </span>
     <span className="text-gray-500 text-[10px] @[640px]:text-xs block mt-0.5">
     {itemCount} item{itemCount === 1 ? "" : "s"} · £{draftTotal.toFixed(2)} · {timeStr}
     </span>
     </button>
     );
    })}
    <div className="px-4 py-2 border-t border-gray-100 mt-1 flex items-center justify-end">
     <HelpTip align="end" ariaLabel="Draft retention" iconClassName="h-3.5 w-3.5 text-gray-400">
     Drafts are from today only: cleared at midnight, maximum 3 saved.
     </HelpTip>
    </div>
    </>
    )}
    </div>
    </>
   )}
  </div>
  )}
  {cart.length > 0 && (
   <button
   type="button"
   onClick={clearCart}
   className="inline-flex items-center justify-center gap-1 h-7 @[640px]:h-8 rounded-md border border-red-200 bg-red-50/80 px-1.5 @[640px]:px-2 text-[11px] @[640px]:text-xs font-medium text-red-600 whitespace-nowrap hover:bg-red-100/80 shrink-0"
   aria-label="Clear cart"
   title="Clear cart"
   >
   <Trash2 className="h-3 w-3 shrink-0" />
   <span>Clear</span>
   </button>
  )}
  </div>
 </div>

 <div className="flex-1 min-h-0 flex flex-col @[1024px]:flex-row gap-2 @[640px]:gap-3 overflow-hidden">
  {/* Left panel: Product grid — toggled by "Show/Hide products" */}
  {productPanelOpen && (
  <div className={`flex-1 min-w-0 ${retailModeEnabled ? "@[1024px]:basis-[60%] @[1024px]:flex-[6]" : "@[1024px]:basis-0"} min-h-0 overflow-hidden flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm`}>
  <div className="min-h-0 flex-1 overflow-auto p-2 @[640px]:p-2.5 relative">
  {productsLoading && (
   <div className="absolute inset-0 z-10 flex items-center justify-center bg-white rounded-xl">
   <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
   </div>
  )}
  {productsError ? (
   <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
   <p className="text-red-600 text-center mb-3">{productsError}</p>
   <div className="flex justify-center mb-4">
   <HelpTip ariaLabel="Offline products" contentClassName="text-center">
   Using offline product list if the live request failed. Retry to refresh from the server.
   </HelpTip>
   </div>
   <button
   type="button"
   onClick={() => refetchProducts()}
   className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
   >
   <RefreshCw className="h-4 w-4" /> Retry
   </button>
   </div>
  ) : (
   <ProductGrid
   products={filteredProducts}
   categories={categories}
   search={search}
   categoryFilter={categoryFilter}
   onSearch={setSearch}
   onCategoryChange={setCategoryFilter}
   onAddToCart={addToCart}
   onAddManualItem={() => setManualItemModalOpen(true)}
   onSearchSuggestionSelect={(product) => {
   addToCart(product);
   setSearch("");
   }}
   hideSearch
   categoryIcons={categoryIcons}
   loading={productsLoading}
   tileStyle="icon"
   showStock={blockNegativeStock}
   />
  )}
  </div>
  </div>
  )}

  {/* Right panel: Cart / Current order */}
  <div className={`flex min-h-0 min-w-0 flex-1 ${retailModeEnabled ? "@[1024px]:basis-[40%] @[1024px]:flex-[4]" : "@[1024px]:basis-0"} flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm`}>
  <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1 border-b border-gray-100">
  <h2 className="text-[11px] @[640px]:text-xs font-semibold text-gray-900">
  Current order{cartItemCount > 0 ? ` (${cartItemCount})` : ""}
  </h2>
  <button
  type="button"
  onClick={() => setOrderSummaryCollapsed((v) => !v)}
  className="@[1024px]:hidden text-[10px] @[640px]:text-xs px-1.5 @[640px]:px-2 py-0.5 @[640px]:py-1 rounded text-gray-600 hover:bg-gray-100 border border-gray-200"
  aria-label={orderSummaryCollapsed ? "Expand order" : "Collapse order"}
  aria-expanded={!orderSummaryCollapsed}
  >
  {orderSummaryCollapsed ? "Expand" : "Collapse"}
  </button>
  </div>
  <div className={`flex-1 min-h-0 overflow-auto flex flex-col ${orderSummaryCollapsed ? "hidden @[1024px]:flex" : ""}`}>
  <div className="px-2.5 pt-1 pb-1 border-b border-gray-100 flex items-stretch gap-1.5">
  <textarea
   id="wholesale-sale-note"
   value={saleNote}
   onChange={(e) => setSaleNote(e.target.value.slice(0, 2000))}
   placeholder="Add a note (optional)"
   rows={1}
   className="flex-1 min-w-0 text-[11px] @[640px]:text-xs text-gray-900 placeholder-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-y"
  />
  <button
   type="button"
   onClick={() => setManualItemModalOpen(true)}
   disabled={!selectedCustomer && !retailModeEnabled}
   className="shrink-0 inline-flex items-center justify-center gap-1 h-7 @[640px]:h-8 rounded-md border border-neutral-200 bg-neutral-50/80 px-2 text-[11px] @[640px]:text-xs font-medium text-neutral-900 whitespace-nowrap hover:bg-neutral-100/80 disabled:cursor-not-allowed disabled:opacity-50"
   title={selectedCustomer || retailModeEnabled ? "Add MISC item" : "Select customer first."}
   aria-label="Add MISC item"
  >
   + MISC
  </button>
  </div>
  {cart.length === 0 ? (
  <div className="p-3">
   <EmptyCartQuickActions
   hasCustomer={!!selectedCustomer || retailModeEnabled}
   retailMode={retailModeEnabled}
   onFocusAddInput={() =>
   (document.getElementById("wholesale-unified-add") as HTMLInputElement)?.focus()
   }
   onPasteImeis={() => setBulkDrawerOpen(true)}
   onShowProducts={() => setProductPanelOpen(true)}
   onAddManualItem={() => setManualItemModalOpen(true)}
   onLoadDraft={() => setDraftsOpen(true)}
   hasDrafts={drafts.length > 0}
   showProductGridAction
   />
  </div>
  ) : (
  <CartPanel
   title=""
   emptyHint=""
   items={cart}
   subtotal={subtotal}
   tax={tax}
   total={total}
   onUpdateQty={updateQuantity}
   onUpdatePrice={updateLinePrice}
   onRemove={removeLine}
   onClear={clearCart}
   onPay={() => {
   if (!retailModeEnabled && !selectedCustomer) {
   showMessage("error", "Please select a customer account");
   return;
   }
   openPaymentModal();
   }}
   payDisabled={!canComplete}
   payDisabledLabel={
   completeDisabledReason === "no_customer"
   ? "Select customer to continue"
   : "Add items to continue"
   }
   accent="blue"
   collapsibleLines
   showItemsSummaryAndDetail={!retailModeEnabled}
   prominentTotals={retailModeEnabled}
   primaryButtonLabel={retailModeEnabled ? "Pay" : "Complete order"}
   onHold={retailModeEnabled ? handleSaveDraft : undefined}
   categoryVariantSlugOrderByCategoryId={categoryVariantSlugOrderByCategoryId}
  />
  )}
  </div>
  </div>
 </div>
 </div>

 <WholesalePaymentModal
 open={paymentModalOpen}
 total={total}
 saleForPrint={saleForPrint}
 retailMode={retailModeEnabled}
 onClose={() => {
  setShowInvoiceStep(false);
  setSaleForPrint(null);
  closePaymentModal();
 }}
 onComplete={async (details) => {
  // Re-check user-supplied invoice number right before save (race-condition guard).
  const trimmedRef = customReference.trim().toUpperCase();
  if (trimmedRef) {
  if (!/^[A-Z0-9\-\/_]{1,32}$/.test(trimmedRef)) {
   showMessage("error", "Invoice number format is invalid.");
   setRefStatus("invalid");
   return;
  }
  try {
   const check = await orderWriter.checkReference(trimmedRef);
   if (check.success && check.data.valid && check.data.exists) {
   setRefStatus("taken");
   showMessage("error", `Invoice number "${trimmedRef}" is already in use.`);
   return;
   }
  } catch {
   // Network blip: let backend make the final call (it re-checks inside the transaction).
  }
  }
  const createOrderStart = performance.now();
  const items = cart.map((i) => {
  const cost = i.unit_cost_at_sale;
  const unit_cost_at_sale =
  typeof cost === "number" && !Number.isNaN(cost) && cost >= 0 ? cost : 0;
  return {
  sku: i.sku,
  name: i.name,
  price: parsePrice(i.price),
  quantity: i.quantity,
  unit: i.unit,
  serialNumbers: i.serialNumbers,
  serialColours: i.serialColours,
  grade: i.grade,
  brand: i.brand,
  colour: i.colour,
  brandModel: i.brandModel,
  capacity: i.capacity,
  unit_cost_at_sale,
  purchaseId: i.purchaseId,
  purchaseItemId: i.purchaseItemId,
  cost_missing: i.cost_missing,
  };
  });
  const payload = {
  type: "wholesale" as const,
  items,
  subtotal,
  tax,
  total,
  discount: details.discount,
  discountType: details.discountType,
  discountValue: details.discountValue,
  previousBalance: details.previousBalance,
  amountDue: details.amountDue,
  customerId: selectedCustomer?._id,
  customerName: selectedCustomer?.name,
  payments: details.payments,
  bankAccount: details.bankAccount,
  note: saleNote.trim(),
  ...(trimmedRef ? { reference: trimmedRef } : {}),
  ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
  ...(details.clientRequestId ? { clientRequestId: details.clientRequestId } : {}),
  };
  const result = await orderWriter.createSale(payload);
  const createOrderMs = Math.round(performance.now() - createOrderStart);
  if (process.env.NODE_ENV === "development") {
  console.info("[Create Order]", createOrderMs, "ms", result.success ? "success" : "failed");
  }
  if (result.success) {
  clearCart();
  setShowInvoiceStep(true);
  showMessage(
  "success",
  result.data?.reference
  ? `Order saved for ${selectedCustomer?.name ?? "customer"} (${result.data.reference})`
  : selectedCustomer
   ? `Order completed for ${selectedCustomer.name}`
   : "Order completed"
  );
  if (result.data?._id && result.data?.reference) {
  const paymentSum =
  (details.payments?.cash ?? 0) +
  (details.payments?.card ?? 0) +
  (details.payments?.credit ?? 0) +
  (details.payments?.bank ?? 0);
  setSaleForPrint({
  _id: result.data._id,
  reference: result.data.reference,
  type: "wholesale",
  createdAt: new Date().toISOString(),
  customerName: selectedCustomer?.name,
  customerAddress: formatAddressForInvoice(selectedCustomer?.address),
  items: items.map((i) => ({
   name: i.name,
   sku: i.sku,
   price: i.price,
   quantity: i.quantity,
   unit: i.unit,
   serialNumbers: i.serialNumbers,
   serialColours: i.serialColours,
   grade: i.grade,
   brand: i.brand,
   colour: i.colour,
   brandModel: i.brandModel,
   capacity: i.capacity,
  })),
  subtotal,
  tax,
  discount: details.discount,
  discountType: details.discountType,
  discountValue: details.discountValue,
  total,
  payments: details.payments,
  previousBalance: details.previousBalance,
  amountDue: details.amountDue,
  balanceAfter: details.amountDue != null ? details.amountDue - paymentSum : undefined,
  });
  } else {
  setSaleForPrint(null);
  }
  setSelectedCustomer(null);
  setSaleNote("");
  setCustomReference("");
  setRefStatus("idle");
  try {
  if (typeof window !== "undefined") window.localStorage.removeItem(CUSTOMER_DRAFT_KEY);
  } catch {}
  // Refresh inventory grid so qty reflects what was just sold (otherwise the picker
  // still shows the pre-sale stock and you can try to re-sell an already-sold unit).
  refetchProducts();
  // Broadcast to other tabs (e.g. /inventory/products) so their stock displays refresh too.
  emitInventoryEvent({ type: "sale-created", saleId: result.data?._id });
  } else {
  showMessage("error", result.message || "Failed to save order");
  }
 }}
 customerName={selectedCustomer?.name}
 customerEmail={selectedCustomer?.email}
 previousBalance={
  previousBalanceForModal != null
  ? previousBalanceForModal
  : selectedCustomer
  ? ("balance" in selectedCustomer && typeof selectedCustomer.balance === "number"
   ? selectedCustomer.balance
   : 0)
  : 0
 }
 showInvoiceStep={showInvoiceStep}
 onDone={() => {
  setShowInvoiceStep(false);
  setSaleForPrint(null);
  closePaymentModal();
 }}
 onMessage={showMessage}
 />

 <AddManualItemModal
 open={manualItemModalOpen}
 onClose={() => setManualItemModalOpen(false)}
 onAdd={(name, price, quantity, costPrice) => {
  const ok = addManualItem(name, price, quantity, costPrice);
  if (ok) showMessage("success", "Item added to order");
  return ok;
 }}
 />

 <BulkImeiDrawer
 isOpen={bulkDrawerOpen}
 onClose={() => setBulkDrawerOpen(false)}
 addBulkSerialsToCart={addBulkSerialsToCart}
 showMessage={showMessage}
 cartSerials={cartSerials}
 disabled={!selectedCustomer}
 />

 <AddCustomerModal
 open={addCustomerModalOpen}
 onClose={() => setAddCustomerModalOpen(false)}
 onAdd={async (data: CustomerFormData) => {
  setAddCustomerLoading(true);
  try {
  const res = await customerApi.create(data);
  if (res?.success && res?.data) {
  setSelectedCustomer(res.data as AccountForSale);
  setAddCustomerModalOpen(false);
  customerSelectRef.current?.refetch();
  showMessage("success", `Customer "${res.data.name}" added and selected.`);
  } else {
  showMessage("error", (res as { message?: string })?.message || "Failed to create customer");
  }
  } catch (e) {
  showMessage("error", e instanceof Error ? e.message : "Failed to create customer");
  } finally {
  setAddCustomerLoading(false);
  }
 }}
 isLoading={addCustomerLoading}
 />

 {serialLookupLoading && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" aria-live="polite" aria-busy="true">
  <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-8 py-6 shadow-2xl ring-1 ring-black/5">
  <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
  <p className="text-sm font-medium text-gray-700">Looking up serial…</p>
  </div>
 </div>
 )}

 {alreadySoldModal.open && (
 <div
  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-in fade-in"
  onClick={() => setAlreadySoldModal({ open: false, term: "", reference: "", customerName: "" })}
 >
  <div
  className="w-full max-w-md overflow-hidden rounded-xl border-4 border-red-600 bg-white shadow-2xl ring-4 ring-red-300/60"
  onClick={(e) => e.stopPropagation()}
  role="alertdialog"
  aria-modal="true"
  >
  <div className="flex items-center gap-3 bg-red-600 px-5 py-4">
   <svg
   xmlns="http://www.w3.org/2000/svg"
   viewBox="0 0 24 24"
   fill="currentColor"
   className="h-8 w-8 text-white"
   aria-hidden="true"
   >
   <path
    fillRule="evenodd"
    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
    clipRule="evenodd"
   />
   </svg>
   <h3 className="text-xl font-bold uppercase tracking-wide text-white">
   Already sold
   </h3>
  </div>
  <div className="space-y-3 bg-red-50 px-5 py-5">
   <p className="text-base font-semibold text-red-900">
   This serial has already been sold and cannot be added again.
   </p>
   {alreadySoldModal.term && (
   <div className="rounded-md border border-red-200 bg-white px-3 py-2">
    <p className="text-xs uppercase tracking-wide text-red-600">Serial / IMEI</p>
    <p className="font-mono text-base font-semibold text-gray-900 break-all">
    {alreadySoldModal.term}
    </p>
   </div>
   )}
   <div className="grid grid-cols-2 gap-2">
   <div className="rounded-md border border-red-200 bg-white px-3 py-2">
    <p className="text-xs uppercase tracking-wide text-red-600">Invoice</p>
    <p className="font-mono text-sm font-semibold text-gray-900 break-all">
    {alreadySoldModal.reference || "—"}
    </p>
   </div>
   <div className="rounded-md border border-red-200 bg-white px-3 py-2">
    <p className="text-xs uppercase tracking-wide text-red-600">Customer</p>
    <p className="text-sm font-semibold text-gray-900 break-words">
    {alreadySoldModal.customerName || "Walk-in"}
    </p>
   </div>
   </div>
  </div>
  <div className="flex justify-end gap-2 border-t-2 border-red-200 bg-white px-5 py-3">
   <button
   type="button"
   onClick={() => setAlreadySoldModal({ open: false, term: "", reference: "", customerName: "" })}
   className="rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
   autoFocus
   >
   Close
   </button>
  </div>
  </div>
 </div>
 )}

 {notFoundModal.open && (
 <div
  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-in fade-in"
  onClick={() => setNotFoundModal({ open: false, term: "", message: "" })}
 >
  <div
  className="w-full max-w-md overflow-hidden rounded-xl border-4 border-red-600 bg-white shadow-2xl ring-4 ring-red-300/60"
  onClick={(e) => e.stopPropagation()}
  role="alertdialog"
  aria-modal="true"
  >
  <div className="flex items-center gap-3 bg-red-600 px-5 py-4">
   <svg
   xmlns="http://www.w3.org/2000/svg"
   viewBox="0 0 24 24"
   fill="currentColor"
   className="h-8 w-8 text-white"
   aria-hidden="true"
   >
   <path
    fillRule="evenodd"
    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
    clipRule="evenodd"
   />
   </svg>
   <h3 className="text-xl font-bold uppercase tracking-wide text-white">
   Item not found
   </h3>
  </div>
  <div className="space-y-3 bg-red-50 px-5 py-5">
   <p className="text-base font-semibold text-red-900">{notFoundModal.message}</p>
   {notFoundModal.term && (
   <div className="rounded-md border border-red-200 bg-white px-3 py-2">
    <p className="text-xs uppercase tracking-wide text-red-600">Searched for</p>
    <p className="font-mono text-base font-semibold text-gray-900 break-all">
    {notFoundModal.term}
    </p>
   </div>
   )}
  </div>
  <div className="flex justify-end gap-2 border-t-2 border-red-200 bg-white px-5 py-3">
   <button
   type="button"
   onClick={() => setNotFoundModal({ open: false, term: "", message: "" })}
   className="rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
   autoFocus
   >
   Close
   </button>
  </div>
  </div>
 </div>
 )}
 </div>
 );
};

export default Page;

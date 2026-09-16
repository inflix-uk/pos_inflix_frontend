"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 Package,
 PlusSquare,
 TrendingDown,
 Grid,
 FileText,
 QrCode,
 ChevronRight,
 MapPin,
 RefreshCw,
} from "lucide-react";
import { stockViewApi } from "../stock/view/services/stockViewApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface InventoryItem {
 title: string;
 description: string;
 icon: React.ElementType;
 path: string;
 color: string;
}

const inventoryItems: InventoryItem[] = [
 {
 title: "Products",
 description: "View and manage all products in inventory",
 icon: Package,
 path: "/inventory/products",
 color: "bg-blue-100 text-blue-600",
 },
 {
 title: "Create Product",
 description: "Add new products to inventory",
 icon: PlusSquare,
 path: "/inventory/create-product",
 color: "bg-green-100 text-green-600",
 },
 {
 title: "Low Stocks",
 description: "Monitor products with low stock levels",
 icon: TrendingDown,
 path: "/inventory/low-stocks",
 color: "bg-orange-100 text-orange-600",
 },
 {
 title: "Category",
 description: "Manage product categories",
 icon: Grid,
 path: "/inventory/category",
 color: "bg-neutral-100 text-neutral-600",
 },
 {
 title: "Variant Attributes",
 description: "Manage variants, brands, and units",
 icon: FileText,
 path: "/inventory/variant-attributes",
 color: "bg-neutral-100 text-neutral-600",
 },
 {
 title: "Print QR Code",
 description: "Generate and print product QR codes",
 icon: QrCode,
 path: "/inventory/print-qr-code",
 color: "bg-slate-100 text-slate-600",
 },
 {
 title: "Stock Adjustment",
 description: "Adjust stock quantities and correct discrepancies",
 icon: TrendingDown,
 path: "/stock/adjustment",
 color: "bg-neutral-100 text-neutral-600",
 },
];

const STORAGE_KEY = "inventory-hub-locationId";

function formatStockMoney(amount: number, currency = "GBP"): string {
 try {
  return new Intl.NumberFormat("en-GB", {
   style: "currency",
   currency: currency || "GBP",
   minimumFractionDigits: 2,
   maximumFractionDigits: 2,
  }).format(amount || 0);
 } catch {
  return `${currency || "GBP"} ${(amount || 0).toFixed(2)}`;
 }
}

const InventoryPage = () => {
 const { user, can } = usePermissionsContext();
 const [stockValue, setStockValue] = useState<{
  serial: number;
  nonSerial: number;
  currency: string;
 }>({ serial: 0, nonSerial: 0, currency: "GBP" });
 const [stockValueLoading, setStockValueLoading] = useState(true);
 const [allLocations, setAllLocations] = useState<Array<{ _id: string; name: string }>>([]);
 const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
 const [dateFrom, setDateFrom] = useState("");
 const [dateTo, setDateTo] = useState("");

 const hasUnrestrictedLocationAccess =
  user?.role === "admin" || can("user.manage") || !user?.assignedLocationIds?.length;
 const canSelectAll = hasUnrestrictedLocationAccess;
 const allowedLocationIds = useMemo(() => {
  if (hasUnrestrictedLocationAccess) return null;
  return user?.assignedLocationIds?.length ? new Set(user.assignedLocationIds) : null;
 }, [hasUnrestrictedLocationAccess, user?.assignedLocationIds]);
 const locations = useMemo(() => {
  if (!allowedLocationIds) return allLocations;
  return allLocations.filter((l) => allowedLocationIds.has(l._id));
 }, [allLocations, allowedLocationIds]);

 useEffect(() => {
  let cancelled = false;
  locationApi
   .getLocations({ isActive: true, limit: 500 })
   .then((res) => {
    if (cancelled || !res.success || !Array.isArray(res.data)) return;
    setAllLocations(
     (res.data as Array<{ _id: string; name: string }>).map((l) => ({
      _id: l._id,
      name: l.name,
     }))
    );
   })
   .catch(() => {});
  try {
   const stored = localStorage.getItem(STORAGE_KEY);
   if (stored) setSelectedLocationId(stored);
  } catch {
   /* ignore */
  }
  return () => {
   cancelled = true;
  };
 }, []);

 useEffect(() => {
  if (locations.length === 0) return;
  if (canSelectAll) {
   if (!selectedLocationId) setSelectedLocationId("all");
   return;
  }
  const allowed = new Set(locations.map((l) => l._id));
  if (selectedLocationId && selectedLocationId !== "all" && allowed.has(selectedLocationId)) return;
  const defaultId =
   user?.defaultLocationId && allowed.has(user.defaultLocationId)
    ? user.defaultLocationId
    : locations[0]?._id;
  if (defaultId) setSelectedLocationId(defaultId);
 }, [locations, canSelectAll, selectedLocationId, user?.defaultLocationId]);

 const handleLocationChange = (value: string) => {
  setSelectedLocationId(value);
  try {
   if (value && value !== "all") localStorage.setItem(STORAGE_KEY, value);
   else localStorage.removeItem(STORAGE_KEY);
  } catch {
   /* ignore */
  }
 };

 const fetchStockValue = useCallback(async () => {
  if (!canSelectAll && !selectedLocationId) return;
  setStockValueLoading(true);
  try {
   const res = await stockViewApi.getStockViewRows({
    page: 1,
    limit: 1,
    excludeSold: true,
    statusFilter: "available",
    productType: "all",
    locationId: selectedLocationId === "all" ? undefined : selectedLocationId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
   });
   if (res.success && res.stockValue) {
    setStockValue({
     serial: Number(res.stockValue.serial) || 0,
     nonSerial: Number(res.stockValue.nonSerial) || 0,
     currency: res.stockValue.currency || "GBP",
    });
   } else {
    setStockValue({ serial: 0, nonSerial: 0, currency: "GBP" });
   }
  } catch {
   setStockValue({ serial: 0, nonSerial: 0, currency: "GBP" });
  } finally {
   setStockValueLoading(false);
  }
 }, [canSelectAll, selectedLocationId, dateFrom, dateTo]);

 useEffect(() => {
  fetchStockValue();
 }, [fetchStockValue]);

 const locationLabel =
  selectedLocationId === "all"
   ? "All locations"
   : locations.find((l) => l._id === selectedLocationId)?.name || "Selected location";

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6">
 <div className="flex flex-wrap items-center justify-between gap-2 @[640px]:gap-3 mb-3 @[640px]:mb-4">
  <div className="flex items-center gap-2 @[640px]:gap-3">
  <div className="p-1.5 @[640px]:p-2 bg-orange-100 rounded-lg">
  <Package className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 text-orange-500" />
  </div>
  <div>
  <h1 className="text-lg @[640px]:text-xl @[768px]:text-2xl font-semibold text-gray-800">Inventory</h1>
  <p className="text-gray-500 text-xs @[640px]:text-sm mt-0.5 @[640px]:mt-1">
  Manage products, categories, and inventory settings
  </p>
  </div>
  </div>
  <div className="flex flex-wrap items-center gap-1.5 @[640px]:gap-2">
  <div className="flex items-center gap-1.5 @[640px]:gap-2">
  <MapPin className="h-3.5 w-3.5 @[768px]:h-4 @[768px]:w-4 shrink-0 text-gray-500" />
  <label htmlFor="inventory-hub-location" className="sr-only">Location</label>
  <select
  id="inventory-hub-location"
  value={selectedLocationId}
  onChange={(e) => handleLocationChange(e.target.value)}
  disabled={stockValueLoading || (!hasUnrestrictedLocationAccess && locations.length === 0)}
  className="rounded-xl border border-gray-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50 min-w-[10rem] max-w-[14rem]"
  >
  {canSelectAll ? <option value="all">All locations</option> : null}
  {locations.map((loc) => (
   <option key={loc._id} value={loc._id}>
   {loc.name}
   </option>
  ))}
  </select>
  </div>
  <input
  type="date"
  value={dateFrom}
  onChange={(e) => setDateFrom(e.target.value)}
  disabled={stockValueLoading}
  className="rounded-xl border border-gray-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50"
  title="From date (purchase/received)"
  />
  <span className="text-gray-400 text-[11px] @[640px]:text-xs @[768px]:text-sm">to</span>
  <input
  type="date"
  value={dateTo}
  onChange={(e) => setDateTo(e.target.value)}
  disabled={stockValueLoading}
  className="rounded-xl border border-gray-200 px-2.5 @[640px]:px-3 @[768px]:px-4 py-1.5 @[640px]:py-2 @[768px]:py-2.5 text-[11px] @[640px]:text-xs @[768px]:text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-50"
  title="To date (purchase/received)"
  />
  <button
  type="button"
  onClick={fetchStockValue}
  disabled={stockValueLoading}
  className="p-1.5 @[640px]:p-2 @[768px]:p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
  title="Refresh"
  >
  <RefreshCw className={`h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-gray-600 ${stockValueLoading ? "animate-spin" : ""}`} />
  </button>
  </div>
 </div>

 {(selectedLocationId !== "all" || dateFrom || dateTo) && (
  <div className="mb-3 @[640px]:mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] @[640px]:text-xs text-sky-900">
  Stock value for <span className="font-semibold">{locationLabel}</span>
  {(dateFrom || dateTo) && (
  <>
   {" "}
   · purchases received
   {dateFrom ? ` from ${dateFrom}` : ""}
   {dateTo ? ` to ${dateTo}` : ""}
  </>
  )}
  . Empty dates = all time.
  </div>
 )}

 <div className="flex flex-wrap items-stretch gap-2 @[640px]:gap-3">
  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 @[640px]:px-4 @[640px]:py-2.5 min-w-[150px]">
  <p className="text-[10px] @[640px]:text-xs font-medium uppercase tracking-wide text-gray-500">
   Serial stock value
  </p>
  <p className="mt-0.5 text-sm @[640px]:text-base font-semibold text-gray-900 tabular-nums">
   {stockValueLoading ? "…" : formatStockMoney(stockValue.serial, stockValue.currency)}
  </p>
  </div>
  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 @[640px]:px-4 @[640px]:py-2.5 min-w-[150px]">
  <p className="text-[10px] @[640px]:text-xs font-medium uppercase tracking-wide text-gray-500">
   Non-serial stock value
  </p>
  <p className="mt-0.5 text-sm @[640px]:text-base font-semibold text-gray-900 tabular-nums">
   {stockValueLoading ? "…" : formatStockMoney(stockValue.nonSerial, stockValue.currency)}
  </p>
  </div>
 </div>
 </div>

 <div className="grid grid-cols-1 @[480px]:grid-cols-2 @[768px]:grid-cols-2 @[1024px]:grid-cols-3 @[1280px]:grid-cols-4 gap-3 @[640px]:gap-4">
 {inventoryItems.map((item, index) => (
  <Link
  key={index}
  href={item.path}
  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 @[640px]:p-5 @[768px]:p-6 hover:shadow-md hover:border-orange-200 transition-all group"
  >
  <div className="flex items-start justify-between">
  <div className={`p-2 @[640px]:p-3 rounded-lg ${item.color}`}>
  <item.icon className="h-5 w-5 @[640px]:h-6 @[640px]:w-6" />
  </div>
  <ChevronRight className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
  </div>
  <h3 className="text-base @[640px]:text-lg font-medium text-gray-800 mt-3 @[640px]:mt-4">{item.title}</h3>
  <p className="text-xs @[640px]:text-sm text-gray-500 mt-0.5 @[640px]:mt-1">{item.description}</p>
  </Link>
 ))}
 </div>
 </div>
 );
};

export default InventoryPage;

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
 Package,
 PlusSquare,
 TrendingDown,
 Grid,
 FileText,
 QrCode,
 ChevronRight,
} from "lucide-react";
import { stockViewApi } from "../stock/view/services/stockViewApi";

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
 const [stockValue, setStockValue] = useState<{
  serial: number;
  nonSerial: number;
  currency: string;
 }>({ serial: 0, nonSerial: 0, currency: "GBP" });
 const [stockValueLoading, setStockValueLoading] = useState(true);

 useEffect(() => {
  let cancelled = false;
  (async () => {
   setStockValueLoading(true);
   try {
    const res = await stockViewApi.getStockViewRows({
     page: 1,
     limit: 1,
     excludeSold: true,
     statusFilter: "available",
     productType: "all",
    });
    if (cancelled) return;
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
    if (!cancelled) setStockValue({ serial: 0, nonSerial: 0, currency: "GBP" });
   } finally {
    if (!cancelled) setStockValueLoading(false);
   }
  })();
  return () => {
   cancelled = true;
  };
 }, []);

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 {/* Page Header */}
 <div className="mb-4 @[640px]:mb-5 @[768px]:mb-6">
 <div className="flex flex-col gap-3 @[768px]:flex-row @[768px]:items-start @[768px]:justify-between">
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
 </div>

 {/* Inventory Grid */}
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

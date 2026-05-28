"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
 ArrowLeft,
 Package,
 Calendar,
 Truck,
 Hash,
 FileText,
 DollarSign,
 Edit,
 Loader2,
 CreditCard,
 ClipboardList,
 Smartphone,
 Copy,
 Check,
 Layers,
 BadgePercent,
} from "lucide-react";
import { Purchase } from "../../list/types";
import { formatPurchasePartyDisplay } from "@/lib/formatSupplierDisplay";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
 "Content-Type": "application/json",
 Authorization: `Bearer ${token}`,
 };
};

type NameMap = Record<string, string>;

const ViewPurchasePage = () => {
 const params = useParams();
 const router = useRouter();
 const id = params.id as string;

 const [purchase, setPurchase] = useState<Purchase | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState("");
 const [variantNames, setVariantNames] = useState<NameMap>({});
 const [copiedImei, setCopiedImei] = useState<string | null>(null);

 useEffect(() => {
 const fetchVariantBySlug = async (slug: string): Promise<{ _id: string; name: string; models?: { _id: string; name: string }[] }[]> => {
 try {
 const response = await fetch(`${API_URL}/api/variant-attributes/slug/${slug}`, {
  headers: getAuthHeaders(),
 });
 const result = await response.json();
 if (result.success && result.data && result.data.values) {
  return result.data.values;
 }
 } catch {
 // ignore
 }
 return [];
 };

 const fetchAllVariants = async () => {
 const [gradesData, brandsData, storageData, colorData] = await Promise.all([
 fetchVariantBySlug("grade"),
 fetchVariantBySlug("brands"),
 fetchVariantBySlug("storage"),
 fetchVariantBySlug("color"),
 ]);

 const map: NameMap = {};
 for (const v of gradesData) map[v._id] = v.name;
 for (const v of brandsData) {
 map[v._id] = v.name;
 if (v.models) {
  for (const m of v.models) map[m._id] = m.name;
 }
 }
 for (const v of storageData) map[v._id] = v.name;
 for (const v of colorData) map[v._id] = v.name;
 setVariantNames(map);
 };

 fetchAllVariants();
 }, []);

 useEffect(() => {
 const fetchPurchase = async () => {
 try {
 const response = await fetch(`${API_URL}/api/purchases/${id}`, {
  headers: getAuthHeaders(),
 });
 const result = await response.json();
 if (result.success && result.data) {
  setPurchase(result.data);
 } else {
  setError(result.message || "Purchase not found");
 }
 } catch {
 setError("Failed to fetch purchase");
 } finally {
 setIsLoading(false);
 }
 };
 fetchPurchase();
 }, [id]);

 const resolveName = (value: string | undefined) => {
 if (!value) return "—";
 return variantNames[value] || value;
 };

 const getStatusConfig = (status: string) => {
 switch (status) {
 case "Received":
 return { bg: "bg-neutral-50", text: "text-emerald-700", dot: "bg-neutral-500", border: "border-neutral-200" };
 case "Pending":
 return { bg: "bg-neutral-50", text: "text-neutral-700", dot: "bg-neutral-500", border: "border-neutral-200" };
 case "Ordered":
 return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" };
 default:
 return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200" };
 }
 };

 const getPaymentStatusConfig = (status: string) => {
 switch (status) {
 case "Paid":
 return { bg: "bg-neutral-50", text: "text-emerald-700", dot: "bg-neutral-500", border: "border-neutral-200" };
 case "Unpaid":
 return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" };
 case "Partial":
 return { bg: "bg-neutral-50", text: "text-neutral-700", dot: "bg-neutral-500", border: "border-neutral-200" };
 default:
 return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200" };
 }
 };

 const copyImei = (imei: string) => {
 navigator.clipboard.writeText(imei);
 setCopiedImei(imei);
 setTimeout(() => setCopiedImei(null), 2000);
 };

 const supplierName = purchase ? formatPurchasePartyDisplay(purchase.supplier, purchase.account) : "—";

 const currencySymbol =
 purchase?.currency === "EUR" ? "€" : "£";

 const grandTotal = purchase?.grandTotal ?? 0;
 const paid = purchase?.paid ?? 0;
 const due = grandTotal - paid;
 const paidPercent = grandTotal > 0 ? Math.min((paid / grandTotal) * 100, 100) : 0;

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="flex flex-col items-center gap-3">
  <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
  <p className="text-sm text-gray-500">Loading purchase details...</p>
 </div>
 </div>
 );
 }

 if (error || !purchase) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
 <div className="text-center max-w-md">
  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  <Package className="h-8 w-8 text-red-500" />
  </div>
  <h2 className="text-lg font-semibold text-gray-800 mb-2">Purchase not found</h2>
  <p className="text-gray-500 mb-6">{error || "The purchase you're looking for doesn't exist or has been removed."}</p>
  <button
  onClick={() => router.push("/purchases/list")}
  className="inline-flex items-center px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
  >
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back to Purchases
  </button>
 </div>
 </div>
 );
 }

 const statusConfig = getStatusConfig(purchase.status);
 const paymentConfig = getPaymentStatusConfig(purchase.paymentStatus);

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Top Bar */}
 <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
 <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
  <div className="flex items-center gap-4">
  <button
  onClick={() => router.push("/purchases/list")}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
  <ArrowLeft className="h-5 w-5 text-gray-600" />
  </button>
  <div className="h-6 w-px bg-gray-200" />
  <div className="flex items-center gap-3">
  <div className="p-2 bg-orange-100 rounded-lg">
  <Package className="h-5 w-5 text-orange-600" />
  </div>
  <div>
  <h1 className="text-lg font-semibold text-gray-900">
   {purchase.purchaseNumber}
  </h1>
  <p className="text-xs text-gray-500">Reference</p>
  </div>
  </div>
  <div className={`ml-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
  {purchase.status}
  </div>
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${paymentConfig.bg} ${paymentConfig.text} ${paymentConfig.border}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${paymentConfig.dot}`} />
  {purchase.paymentStatus}
  </div>
  </div>
  <button
  onClick={() => router.push(`/purchases/edit/${purchase._id}`)}
  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
  >
  <Edit className="w-4 h-4" />
  Edit
  </button>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
 {/* Top Summary Cards Row */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Supplier Card */}
  <div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center gap-3 mb-3">
  <div className="p-2 bg-blue-50 rounded-lg">
  <Truck className="h-4 w-4 text-blue-600" />
  </div>
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Supplier</span>
  </div>
  <p className="text-sm font-semibold text-gray-900">{supplierName}</p>
  </div>

  {/* Date Card */}
  <div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center gap-3 mb-3">
  <div className="p-2 bg-neutral-50 rounded-lg">
  <Calendar className="h-4 w-4 text-neutral-600" />
  </div>
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</span>
  </div>
  <p className="text-sm font-semibold text-gray-900">
  {new Date(purchase.date).toLocaleDateString("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  })}
  </p>
  </div>

  {/* Parcel Number Card */}
  <div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center gap-3 mb-3">
  <div className="p-2 bg-orange-50 rounded-lg">
  <Hash className="h-4 w-4 text-orange-600" />
  </div>
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purchase Number</span>
  </div>
  <p className="text-sm font-semibold text-gray-900">{purchase.parcelNumber || "—"}</p>
  </div>

  {/* Currency Card */}
  <div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center gap-3 mb-3">
  <div className="p-2 bg-neutral-50 rounded-lg">
  <DollarSign className="h-4 w-4 text-emerald-600" />
  </div>
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</span>
  </div>
  <p className="text-sm font-semibold text-gray-900">{purchase.currency || "GBP"}</p>
  </div>
 </div>

 {/* Financial Summary + Quantity Stats */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Financial Summary */}
  <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
  <CreditCard className="h-4 w-4 text-gray-400" />
  <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Financial Summary</h2>
  </div>
  <div className="p-6">
  <div className="grid grid-cols-3 gap-6 mb-6">
  <div className="text-center">
   <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Grand Total</p>
   <p className="text-2xl font-bold text-gray-900">{currencySymbol}{grandTotal.toFixed(2)}</p>
  </div>
  <div className="text-center">
   <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paid</p>
   <p className="text-2xl font-bold text-emerald-600">{currencySymbol}{paid.toFixed(2)}</p>
  </div>
  <div className="text-center">
   <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Balance Due</p>
   <p className={`text-2xl font-bold ${due > 0 ? "text-red-600" : "text-gray-900"}`}>
   {currencySymbol}{due.toFixed(2)}
   </p>
  </div>
  </div>
  {/* Payment Progress Bar */}
  <div>
  <div className="flex items-center justify-between mb-2">
   <span className="text-xs text-gray-500">Payment Progress</span>
   <span className="text-xs font-medium text-gray-700">{paidPercent.toFixed(0)}%</span>
  </div>
  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
   <div
   className={`h-full rounded-full transition-all duration-500 ${
   paidPercent >= 100 ? "bg-neutral-500" : paidPercent > 0 ? "bg-orange-500" : "bg-gray-200"
   }`}
   style={{ width: `${paidPercent}%` }}
   />
  </div>
  </div>
  </div>
  </div>

  {/* Quantity Stats */}
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
  <Layers className="h-4 w-4 text-gray-400" />
  <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Quantities</h2>
  </div>
  <div className="p-6 space-y-5">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
   <div className="p-2 bg-blue-50 rounded-lg">
   <Smartphone className="h-4 w-4 text-blue-600" />
   </div>
   <span className="text-sm text-gray-600">IMEI Qty</span>
  </div>
  <span className="text-lg font-bold text-gray-900">{purchase.imeiQuantity ?? 0}</span>
  </div>
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
   <div className="p-2 bg-neutral-50 rounded-lg">
   <ClipboardList className="h-4 w-4 text-neutral-600" />
   </div>
   <span className="text-sm text-gray-600">Other Qty</span>
  </div>
  <span className="text-lg font-bold text-gray-900">{purchase.otherQuantity ?? 0}</span>
  </div>
  <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
   <div className="p-2 bg-orange-50 rounded-lg">
   <BadgePercent className="h-4 w-4 text-orange-600" />
   </div>
   <span className="text-sm font-medium text-gray-700">Total IMEIs</span>
  </div>
  <span className="text-xl font-bold text-orange-600">{purchase.totalIMEIs ?? 0}</span>
  </div>
  </div>
  </div>
 </div>

 {/* Note */}
 {purchase.note && (
  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
  <div className="flex items-start gap-3">
  <FileText className="h-5 w-5 text-neutral-600 mt-0.5 flex-shrink-0" />
  <div>
  <p className="text-xs font-medium text-neutral-700 uppercase tracking-wide mb-1">Note</p>
  <p className="text-sm text-neutral-900">{purchase.note}</p>
  </div>
  </div>
  </div>
 )}

 {/* Items Table */}
 {purchase.items && purchase.items.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
  <div className="flex items-center gap-2">
  <Package className="h-4 w-4 text-gray-400" />
  <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Items</h2>
  </div>
  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
  {purchase.items.length} {purchase.items.length === 1 ? "item" : "items"}
  </span>
  </div>
  <div className="overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
   <tr className="bg-gray-50/80">
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Send To</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub Category</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Condition</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
   <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Colour</th>
   <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
   <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
   <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">IMEIs</th>
   </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
   {purchase.items.map((item, idx) => {
   const sendToName =
   item.sendTo && typeof item.sendTo === "object" ? item.sendTo.name : item.sendTo || "—";
   const categoryName =
   item.category && typeof item.category === "object" ? item.category.name : item.category || "—";
   const subCategoryName =
   item.subCategory && typeof item.subCategory === "object" ? item.subCategory.name : item.subCategory || "—";
   return (
   <tr key={item._id || idx} className="hover:bg-orange-50/40 transition-colors">
   <td className="px-6 py-4 text-gray-400 font-medium">{idx + 1}</td>
   <td className="px-6 py-4 text-gray-900 font-medium">{sendToName}</td>
   <td className="px-6 py-4 text-gray-700">{categoryName}</td>
   <td className="px-6 py-4 text-gray-700">{subCategoryName}</td>
   <td className="px-6 py-4">
    <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
    {resolveName(item.grade)}
    </span>
   </td>
   <td className="px-6 py-4 text-gray-700 font-medium">{resolveName(item.brand)}</td>
   <td className="px-6 py-4 text-gray-700">{resolveName(item.brandModel)}</td>
   <td className="px-6 py-4 text-gray-700">{resolveName(item.capacity)}</td>
   <td className="px-6 py-4">
    <span className="inline-flex items-center gap-1.5">
    <span
    className="w-3 h-3 rounded-full border border-gray-200"
    style={{
    backgroundColor:
     resolveName(item.colour)?.toLowerCase() === "black" ? "#000" :
     resolveName(item.colour)?.toLowerCase() === "white" ? "#fff" :
     resolveName(item.colour)?.toLowerCase() === "red" ? "#ef4444" :
     resolveName(item.colour)?.toLowerCase() === "blue" ? "#3b82f6" :
     resolveName(item.colour)?.toLowerCase() === "green" ? "#22c55e" :
     resolveName(item.colour)?.toLowerCase() === "gold" ? "#eab308" :
     resolveName(item.colour)?.toLowerCase() === "silver" ? "#9ca3af" :
     resolveName(item.colour)?.toLowerCase() === "pink" ? "#ec4899" :
     resolveName(item.colour)?.toLowerCase() === "purple" ? "#a855f7" :
     "#d1d5db"
    }}
    />
    <span className="text-gray-700">{resolveName(item.colour)}</span>
    </span>
   </td>
   <td className="px-6 py-4 text-right font-semibold text-gray-900">
    {currencySymbol}{(item.purchasePrice ?? 0).toFixed(2)}
   </td>
   <td className="px-6 py-4 text-right font-semibold text-emerald-600">
    {currencySymbol}{(item.salePrice ?? 0).toFixed(2)}
   </td>
   <td className="px-6 py-4 text-center">
    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
    {item.imeis?.length ?? 0}
    </span>
   </td>
   </tr>
   );
   })}
  </tbody>
  </table>
  </div>

  {/* IMEI Numbers */}
  {purchase.items.some((item) => item.imeis && item.imeis.length > 0) && (
  <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
  <div className="flex items-center gap-2 mb-4">
   <Smartphone className="h-4 w-4 text-gray-400" />
   <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">IMEI Numbers</h3>
   <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
   {purchase.items.reduce((sum, item) => sum + (item.imeis?.length ?? 0), 0)}
   </span>
  </div>
  <div className="flex flex-wrap gap-2">
   {purchase.items.flatMap((item) =>
   (item.imeis || []).map((imei, i) => (
   <button
   key={`${item._id}-${i}`}
   onClick={() => copyImei(imei)}
   className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
   title="Click to copy"
   >
   {imei}
   {copiedImei === imei ? (
    <Check className="w-3 h-3 text-emerald-500" />
   ) : (
    <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
   )}
   </button>
   ))
   )}
  </div>
  </div>
  )}
  </div>
 )}
 </div>
 </div>
 );
};

export default ViewPurchasePage;

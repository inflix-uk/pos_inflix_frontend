"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Barcode, Loader2, FileText } from "lucide-react";
import { productApi } from "../../products/service/productApi";

const formatDate = (iso: string) =>
 new Date(iso).toLocaleString("en-US", {
 dateStyle: "medium",
 timeStyle: "short",
 });
const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

export default function SerialHistoryPage() {
 const params = useParams();
 const serial = (params?.serial as string) || "";
 const [data, setData] = useState<{
 serialNumber: string;
 count: number;
 data: Array<{
 _id: string;
 reference: string;
 type: string;
 customerName?: string;
 total: number;
 createdAt: string;
 items: Array<{ sku: string; name: string; quantity: number; price: number; serialNumbers?: string[] }>;
 }>;
 } | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!serial) {
 setLoading(false);
 setError("No serial number provided");
 return;
 }
 let cancelled = false;
 productApi
 .getSerialHistory(decodeURIComponent(serial))
 .then((res) => {
 if (!cancelled) {
  setData({ serialNumber: res.serialNumber, count: res.count, data: res.data || [] });
  setError(null);
 }
 })
 .catch((e) => {
 if (!cancelled) {
  setError(e instanceof Error ? e.message : "Failed to load history");
  setData(null);
 }
 })
 .finally(() => {
 if (!cancelled) setLoading(false);
 });
 return () => {
 cancelled = true;
 };
 }, [serial]);

 if (!serial) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <Link href="/inventory/products" className="inline-flex items-center gap-2 text-orange-600 hover:underline mb-4">
  <ArrowLeft size={18} /> Back to Products
 </Link>
 <p className="text-gray-600">No serial number in URL.</p>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="mb-6 flex items-center justify-between">
 <div className="flex items-center gap-3">
  <Link
  href="/inventory/products"
  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
  aria-label="Back to products"
  >
  <ArrowLeft size={20} />
  </Link>
  <div className="flex items-center gap-2">
  <Barcode className="h-6 w-6 text-orange-500" />
  <h1 className="text-xl font-semibold text-gray-900">Serial number history</h1>
  </div>
  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{decodeURIComponent(serial)}</span>
 </div>
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-16">
  <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
 </div>
 ) : error ? (
 <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
  {error}
 </div>
 ) : data && data.data.length === 0 ? (
 <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
  <p className="text-gray-600">No sales found for this serial number.</p>
  <p className="text-sm text-gray-500 mt-1">It may not have been sold yet or the serial was not recorded.</p>
 </div>
 ) : data ? (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200">
  <p className="text-sm text-gray-600">
  Found in <strong>{data.count}</strong> sale{data.count === 1 ? "" : "s"}
  </p>
  </div>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {data.data.map((sale) =>
   sale.items.map((item, idx) => (
   <tr key={`${sale._id}-${idx}`} className="hover:bg-gray-50">
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {formatDate(sale.createdAt)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
   {sale.reference}
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <span
    className={`px-2 py-0.5 rounded text-xs font-medium ${
    sale.type === "wholesale" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
    }`}
   >
    {sale.type}
   </span>
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
   {sale.customerName || "—"}
   </td>
   <td className="px-6 py-4 text-sm text-gray-900">
   {item.name}
   <span className="text-gray-500 ml-1">({item.sku})</span>
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
   {formatMoney(sale.total)}
   </td>
   </tr>
   ))
  )}
  </tbody>
  </table>
  </div>
 </div>
 ) : null}
 </div>
 );
}

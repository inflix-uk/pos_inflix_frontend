"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, History } from "lucide-react";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

interface SerialHistoryResponse {
 success: boolean;
 serialNumber: string;
 status: string;
 origin: {
 purchaseId: string;
 purchaseNumber: string;
 item?: { name?: string; purchasePrice?: number; salePrice?: number };
 } | null;
 sales: unknown[];
 movements: { type: string; date: string; reference?: string; to?: string }[];
}

export default function SerialDetailPage() {
 const params = useParams();
 const router = useRouter();
 const serial = (params?.serial as string) || "";
 const [data, setData] = useState<SerialHistoryResponse | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!serial) {
 setLoading(false);
 setError("No serial in URL");
 return;
 }
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 fetch(`${API_URL}/api/products/serial-history/${encodeURIComponent(decodeURIComponent(serial))}`, {
 headers: { Authorization: `Bearer ${token}` },
 })
 .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
 .then((res) => setData(res))
 .catch(() => setError("Failed to load serial or not found"))
 .finally(() => setLoading(false));
 }, [serial]);

 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <span className="text-gray-500">Loading...</span>
 </div>
 );
 }

 if (error || !data) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
  <p className="text-red-600 mb-4">{error || "Serial not found"}</p>
  <Link href="/inventory" className="text-orange-600 hover:underline inline-flex items-center gap-1">
  <ArrowLeft className="w-4 h-4" /> Back to Inventory
  </Link>
 </div>
 </div>
 );
 }

 const statusLabel = data.status === "sold" ? "Sold" : data.status === "returned" ? "Returned" : "In stock";

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="max-w-lg mx-auto">
 <button
  onClick={() => router.back()}
  className="mb-4 inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
 >
  <ArrowLeft className="w-4 h-4" /> Back
 </button>
 <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
  <h1 className="text-lg font-semibold text-gray-900">Serial / IMEI</h1>
  <p className="font-mono text-gray-700 mt-1">{data.serialNumber}</p>
  <span
  className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
  data.status === "sold"
   ? "bg-blue-100 text-blue-800"
   : data.status === "returned"
   ? "bg-neutral-100 text-neutral-800"
   : "bg-green-100 text-green-800"
  }`}
  >
  {statusLabel}
  </span>
  </div>
  <div className="px-6 py-4 space-y-4">
  {data.origin && (
  <div>
  <div className="flex items-center gap-2 text-gray-700">
   <Package className="w-4 h-4 text-gray-400" />
   <span>
   {data.origin.item?.name || "Product"} — Purchase{" "}
   <Link
   href={`/purchases/view?id=${data.origin.purchaseId}`}
   className="text-orange-600 hover:underline font-medium"
   >
   {data.origin.purchaseNumber}
   </Link>
   </span>
  </div>
  </div>
  )}
  {data.movements && data.movements.length > 0 && (
  <div>
  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
   <History className="w-4 h-4" /> Timeline
  </div>
  <ul className="space-y-1 text-sm text-gray-600">
   {data.movements.slice(0, 10).map((m, i) => (
   <li key={i}>
   {m.type} {m.reference && `— ${m.reference}`} {m.to && `→ ${m.to}`}
   </li>
   ))}
  </ul>
  </div>
  )}
  </div>
 </div>
 </div>
 </div>
 );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { platformApi, type FeatureCatalogItem } from "../service/platformApi";

export default function FeatureCatalogPage() {
 const [items, setItems] = useState<FeatureCatalogItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 platformApi
 .getFeatureCatalog(false)
 .then(setItems)
 .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
 .finally(() => setLoading(false));
 }, []);

 if (loading) {
 return (
 <div className="flex items-center gap-2 text-gray-500">
 <Loader2 className="h-5 w-5 animate-spin" /> Loading feature catalog...
 </div>
 );
 }

 if (error) {
 return (
 <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
 {error}
 <Link href="/platform" className="block mt-2 text-orange-600 hover:underline">← Back to Platform</Link>
 </div>
 );
 }

 return (
 <div className="@container">
 <div className="flex items-center justify-between mb-4 @[640px]:mb-6">
 <Link href="/platform" className="inline-flex items-center gap-1 text-xs @[640px]:text-sm text-gray-600 hover:text-orange-600">
  <ArrowLeft className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" /> Back
 </Link>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 border-b border-gray-100 flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-1 @[640px]:gap-2">
  <h2 className="text-sm @[640px]:text-base font-semibold text-gray-900">Feature Catalog</h2>
  <p className="text-xs @[640px]:text-sm text-gray-500">New features added here appear in plan matrix and tenant overrides.</p>
 </div>
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead>
  <tr className="bg-gray-50 border-b border-gray-200">
  <th className="text-left px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-medium text-gray-700">Key</th>
  <th className="text-left px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-medium text-gray-700">Name</th>
  <th className="text-left px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-medium text-gray-700">Category</th>
  <th className="text-left px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-medium text-gray-700">Default</th>
  <th className="text-left px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm font-medium text-gray-700">Active</th>
  </tr>
  </thead>
  <tbody>
  {items.map((f) => (
  <tr key={f._id} className="border-b border-gray-100 hover:bg-gray-50">
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 font-mono text-xs @[640px]:text-sm">{f.key}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm">{f.name}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm text-gray-600">{f.category}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm">{f.defaultEnabled ? "Yes" : "No"}</td>
   <td className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 text-xs @[640px]:text-sm">{f.isActive ? "Yes" : "No"}</td>
  </tr>
  ))}
  </tbody>
  </table>
 </div>
 {items.length === 0 && (
  <div className="px-3 @[640px]:px-4 py-6 @[640px]:py-8 text-center text-xs @[640px]:text-sm text-gray-500">No features. Run the entitlements seed on the backend.</div>
 )}
 </div>
 </div>
 );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseQrPayload } from "@/lib/qrPayload";
import { AlertCircle, QrCode } from "lucide-react";

export default function ScanPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [input, setInput] = useState("");
 const [error, setError] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 const payload = searchParams.get("payload") || searchParams.get("q") || searchParams.get("data");
 if (payload) {
 setInput(payload);
 handlePayload(payload);
 } else {
 inputRef.current?.focus();
 }
 }, [searchParams]);

 const handlePayload = (raw: string) => {
 setError(null);
 const parsed = parseQrPayload(raw);
 if (!parsed) {
 setError("Invalid or unknown QR payload. Use format: POSv1|product|id or POSv1|serial|imei or POSv1|location|id");
 return;
 }
 if (parsed.type === "product") {
 router.replace(`/edit-product/${parsed.id}`);
 return;
 }
 if (parsed.type === "serial") {
 router.replace(`/inventory/serials/${encodeURIComponent(parsed.id)}`);
 return;
 }
 if (parsed.type === "location") {
 router.replace(`/peoples/locations?id=${encodeURIComponent(parsed.id)}`);
 return;
 }
 setError("Unknown type: " + (parsed as { type: string }).type);
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!input.trim()) {
 setError("Enter or paste a QR payload.");
 return;
 }
 handlePayload(input.trim());
 };

 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
 <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-6">
 <div className="flex items-center gap-3 mb-6">
  <div className="p-2 rounded-lg bg-orange-100">
  <QrCode className="w-8 h-8 text-orange-600" />
  </div>
  <div>
  <h1 className="text-xl font-semibold text-gray-900">Scan / Enter QR</h1>
  <p className="text-sm text-gray-500">Paste payload or scan to open the correct record</p>
  </div>
 </div>
 <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label htmlFor="payload" className="block text-sm font-medium text-gray-700 mb-1">
  QR payload
  </label>
  <input
  id="payload"
  ref={inputRef}
  type="text"
  value={input}
  onChange={(e) => {
  setInput(e.target.value);
  setError(null);
  }}
  placeholder="POSv1|product|..."
  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  </div>
  {error && (
  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
  <span>{error}</span>
  </div>
  )}
  <div className="flex gap-2">
  <button
  type="submit"
  className="flex-1 rounded-lg bg-orange-500 text-white py-2.5 text-sm font-medium hover:bg-orange-600"
  >
  Go
  </button>
  <button
  type="button"
  onClick={() => {
  setInput("");
  setError(null);
  inputRef.current?.focus();
  }}
  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
  >
  Clear
  </button>
  </div>
 </form>
 <p className="mt-4 text-xs text-gray-500">
  Examples: POSv1|product|id — product edit. POSv1|serial|IMEI — serial detail. POSv1|location|id — locations.
 </p>
 </div>
 </div>
 );
}

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, RotateCcw, TrendingUp, Plus, Download, Barcode } from "lucide-react";

interface HeaderProps {
 totalProducts: number;
}

export default function Header({ totalProducts }: HeaderProps) {
 const router = useRouter();
 const [serialInput, setSerialInput] = useState("");

 const handleSerialSearch = (e: React.FormEvent) => {
 e.preventDefault();
 const serial = serialInput.trim();
 if (!serial) return;
 router.push(`/inventory/serial-history/${encodeURIComponent(serial)}`);
 setSerialInput("");
 };

 return (
 <div className="mb-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
  <h1 className="text-2xl font-semibold text-gray-900">Product List</h1>
  <p className="text-gray-600 mt-1">
  Manage your products ({totalProducts} total)
  </p>
 </div>

 {/* Serial number search - scan or type to open history */}
 <form onSubmit={handleSerialSearch} className="flex items-center gap-2 flex-shrink-0">
  <div className="relative">
  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
  <input
  type="text"
  value={serialInput}
  onChange={(e) => setSerialInput(e.target.value)}
  placeholder="Scan or type serial number"
  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  aria-label="Serial number for history"
  />
  </div>
  <button
  type="submit"
  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg whitespace-nowrap"
  >
  History
  </button>
 </form>
 </div>

 <div className="flex items-center gap-3 mt-4 flex-wrap">
 {/* Action Buttons */}
  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
  <RotateCcw size={20} />
  </button>
  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
  <TrendingUp size={20} />
  </button>
  <Link
  href="/inventory/create-product"
  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
  >
  <Plus size={20} />
  Add Product
  </Link>
  <button className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
  <Download size={20} />
  Import Product
  </button>
 </div>
 </div>
 );
}

"use client";

import React from "react";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";

export default function ProductPageHeader() {
 return (
 <div className="flex items-center gap-3">
 <Link
 href="/inventory/products"
 className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
 aria-label="Back to products"
 >
 <ArrowLeft className="h-5 w-5 text-gray-600" />
 </Link>
 <div className="p-2 bg-orange-100 rounded-lg">
 <Package className="h-6 w-6 text-orange-500" />
 </div>
 <div>
 <h1 className="text-2xl font-semibold text-gray-800">Create product</h1>
 <p className="text-gray-500 text-sm mt-1">Add a new product to inventory</p>
 </div>
 </div>
 );
}

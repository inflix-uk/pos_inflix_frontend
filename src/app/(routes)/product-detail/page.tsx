"use client";

import { Printer } from "lucide-react";

export default function Component() {
 return (
 <div className="min-h-screen bg-gray-50 p-4 md:p-6">
 <div className="">
 {/* Header */}
 <div className="mb-8">
  <h1 className="text-2xl font-semibold text-gray-900">
  Product Details
  </h1>
  <p className="text-sm text-gray-600">Full details of a product</p>
 </div>

 {/* Main Content */}
 <div className="grid gap-8 lg:grid-cols-2">
  {/* Left Column */}
  <div className="space-y-6">
  {/* Barcode Section */}
  <div className="rounded-lg bg-white p-6 shadow-sm">
  <div className="relative border border-gray-300 rounded-lg p-6 bg-white">
  {/* Print Icon */}
  <button className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600">
   <Printer className="h-5 w-5" />
  </button>

  {/* Barcode */}
  <div className="flex flex-col items-center">
   <div className="mb-3">
   <svg width="200" height="60" viewBox="0 0 200 60">
   {/* Generate barcode pattern */}
   {Array.from({ length: 50 }, (_, i) => (
   <rect
    key={i}
    x={i * 4}
    y={10}
    width={Math.random() > 0.5 ? 2 : 1}
    height={40}
    fill="black"
   />
   ))}
   </svg>
   </div>
   <div className="text-sm font-mono text-gray-700">
   86102192
   </div>
  </div>
  </div>
  </div>

  {/* Product Details Table */}
  <div className="rounded-lg bg-white shadow-sm overflow-hidden">
  <div className="divide-y divide-gray-200">
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">
   Product
   </div>
   <div className="text-sm text-gray-900">Macbook pro</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6 bg-gray-50">
   <div className="text-sm font-medium text-gray-700">
   Category
   </div>
   <div className="text-sm text-gray-900">Computers</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">
   Sub Category
   </div>
   <div className="text-sm text-gray-900">None</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6 bg-gray-50">
   <div className="text-sm font-medium text-gray-700">Brand</div>
   <div className="text-sm text-gray-900">None</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">Unit</div>
   <div className="text-sm text-gray-900">Piece</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6 bg-gray-50">
   <div className="text-sm font-medium text-gray-700">SKU</div>
   <div className="text-sm text-gray-900">PT0001</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">
   Minimum Qty
   </div>
   <div className="text-sm text-gray-900">5</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6 bg-gray-50">
   <div className="text-sm font-medium text-gray-700">
   Quantity
   </div>
   <div className="text-sm text-gray-900">50</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">Tax</div>
   <div className="text-sm text-gray-900">0.00 %</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6 bg-gray-50">
   <div className="text-sm font-medium text-gray-700">
   Discount Type
   </div>
   <div className="text-sm text-gray-900">Percentage</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">Price</div>
   <div className="text-sm text-gray-900">1500.00</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6 bg-gray-50">
   <div className="text-sm font-medium text-gray-700">
   Status
   </div>
   <div className="text-sm text-gray-900">Active</div>
  </div>
  <div className="grid grid-cols-2 py-3 px-6">
   <div className="text-sm font-medium text-gray-700">
   Description
   </div>
   <div className="text-sm text-gray-900">
   Lorem Ipsum is simply dummy text of the printing and
   typesetting industry. Lorem Ipsum has been the industry&apos;s
   standard dummy text ever since the 1500s.
   </div>
  </div>
  </div>
  </div>
  </div>

  {/* Right Column */}
  <div className="space-y-6">
  {/* Product Image */}
  <div className="rounded-lg bg-white p-6 shadow-sm">
  <div className="flex flex-col items-center">
  {/* MacBook Image */}
  <div className="relative mb-4">
   <div className="w-80 h-60 bg-gray-900 rounded-lg overflow-hidden relative">
   {/* MacBook Frame */}
   <div className="absolute inset-2 bg-black rounded-md">
   {/* Screen */}
   <div className="absolute inset-1 rounded-sm overflow-hidden">
   <img
    src="/placeholder.svg?height=240&width=320"
    alt="MacBook Screen"
    className="w-full h-full object-cover"
    style={{
    background:
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
    }}
   />
   {/* Simulated mountain landscape */}
   <div className="absolute inset-0 bg-neutral-200 opacity-80"></div>
   <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-neutral-400"></div>
   {/* Mountain silhouettes */}
   <svg
    className="absolute bottom-0 w-full h-full"
    viewBox="0 0 320 240"
    preserveAspectRatio="none"
   >
    <polygon
    points="0,240 80,120 160,180 240,100 320,160 320,240"
    fill="rgba(0,0,0,0.3)"
    />
    <polygon
    points="0,240 60,140 120,200 180,120 240,180 320,140 320,240"
    fill="rgba(0,0,0,0.2)"
    />
   </svg>
   </div>
   </div>
   {/* MacBook Base */}
   <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-72 h-4 bg-gray-300 rounded-full"></div>
   <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gray-400 rounded-full"></div>
   </div>
  </div>

  {/* File Info */}
  <div className="text-center">
   <div className="text-sm font-medium text-gray-900">
   macbookpro.jpg
   </div>
   <div className="text-sm text-gray-500">581kb</div>
  </div>
  </div>
  </div>
  </div>
 </div>
 </div>
 </div>
 );
}

"use client";

import React from "react";
import { Banknote } from "lucide-react";

export default function CashFlowPage() {
 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 <div className="max-w-2xl mx-auto text-center py-10 @[640px]:py-12 @[768px]:py-16">
 <div className="p-2.5 @[640px]:p-3 @[768px]:p-4 rounded-xl bg-orange-100 inline-flex mb-3 @[640px]:mb-4">
  <Banknote className="h-7 w-7 @[640px]:h-8 @[640px]:w-8 @[768px]:h-10 @[768px]:w-10 text-orange-600" />
 </div>
 <h1 className="text-base @[640px]:text-lg @[768px]:text-xl @[1024px]:text-2xl font-bold text-gray-900 mb-1.5 @[640px]:mb-2">Cash Flow</h1>
 <p className="text-gray-500 text-[11px] @[640px]:text-xs @[768px]:text-sm @[1024px]:text-base">
  Cash flow report (in/out by period) can be added here. Use Balance Sheet and Account Statement
  for receivables, payables, and recording payments.
 </p>
 </div>
 </div>
 );
}

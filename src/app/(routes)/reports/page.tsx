"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, Calculator, Scale, Banknote, Landmark, ArrowLeftRight, TrendingUp } from "lucide-react";

export default function ReportsPage() {
 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 @[640px]:mb-6 @[768px]:mb-8">
 <h1 className="text-lg @[480px]:text-xl @[768px]:text-2xl font-bold text-gray-900">Reports</h1>
 <p className="text-[11px] @[480px]:text-xs @[768px]:text-sm text-gray-500 mt-0.5">
  Dashboard and financial reports. Data in Europe/London time where applicable.
 </p>
 </div>

 <div className="grid gap-2.5 @[480px]:gap-3 @[768px]:gap-4 @[640px]:grid-cols-2 @[1024px]:grid-cols-3 max-w-4xl">
 <Link
  href="/reports/dashboard"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200">
  <LayoutDashboard className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Dashboard</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Sales, repairs, stock and activity overview</p>
  </div>
 </Link>

 <Link
  href="/reports/takings"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200">
  <TrendingUp className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Takings Dashboard</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Takings by payment method and P&L for the period</p>
  </div>
 </Link>

 <Link
  href="/balance-sheet"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
  <Calculator className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Balance Sheet</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Assets, liabilities and equity</p>
  </div>
 </Link>

 <Link
  href="/trial-balance"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
  <Scale className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Trial Balance</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Debits and credits summary</p>
  </div>
 </Link>

 <Link
  href="/profit-and-loss"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
  <FileText className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Profit and Loss</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Income and expenses statement</p>
  </div>
 </Link>

 <Link
  href="/cash-flow"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
  <Banknote className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Cash Flow</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Cash in and out by period</p>
  </div>
 </Link>

 <Link
  href="/bank-accounts"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
  <Landmark className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Bank Accounts</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Bank account balances</p>
  </div>
 </Link>

 <Link
  href="/money-transfer"
  className="flex items-center gap-3 @[480px]:gap-4 p-3.5 @[480px]:p-4 @[768px]:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-colors group"
 >
  <div className="p-2 @[480px]:p-2.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
  <ArrowLeftRight className="h-5 w-5 @[480px]:h-6 @[480px]:w-6" />
  </div>
  <div>
  <h2 className="font-semibold text-gray-900 text-sm @[480px]:text-base">Money Transfer</h2>
  <p className="text-xs @[480px]:text-sm text-gray-500">Transfers between accounts</p>
  </div>
 </Link>
 </div>
 </div>
 );
}

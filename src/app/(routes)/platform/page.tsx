"use client";

import Link from "next/link";
import { Layers, Package, Users, Settings, Shield, ArrowRight } from "lucide-react";

export default function PlatformPage() {
 return (
 <div className="@container">
 <div className="mb-4 @[640px]:mb-6 @[768px]:mb-8">
 <h2 className="text-base @[480px]:text-lg @[640px]:text-xl font-semibold text-gray-900">Platform</h2>
 <p className="text-xs @[640px]:text-sm @[768px]:text-base text-gray-600 mt-1">Manage platform settings, catalogs, and tenants.</p>
 </div>
 <div className="grid gap-3 @[480px]:gap-4 @[640px]:gap-5 @[640px]:grid-cols-2 @[1024px]:grid-cols-4">
 <Link
  href="/platform/admin-accounts"
  className="group flex flex-col p-4 @[480px]:p-5 @[640px]:p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
 >
  <span className="inline-flex w-10 h-10 @[640px]:w-12 @[640px]:h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-3 @[640px]:mb-4 group-hover:bg-orange-200 transition-colors">
  <Shield className="h-5 w-5 @[640px]:h-6 @[640px]:w-6" />
  </span>
  <h3 className="text-sm @[640px]:text-base font-semibold text-gray-900">Admin Accounts</h3>
  <p className="text-xs @[640px]:text-sm text-gray-600 mt-1 flex-1">Create, edit, or delete platform admin accounts (all roles)</p>
  <span className="inline-flex items-center gap-1 text-xs @[640px]:text-sm font-medium text-orange-600 mt-2 @[640px]:mt-3 group-hover:gap-2 transition-all">
  Open <ArrowRight className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  </span>
 </Link>
 <Link
  href="/platform/feature-catalog"
  className="group flex flex-col p-4 @[480px]:p-5 @[640px]:p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
 >
  <span className="inline-flex w-10 h-10 @[640px]:w-12 @[640px]:h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-3 @[640px]:mb-4 group-hover:bg-orange-200 transition-colors">
  <Layers className="h-5 w-5 @[640px]:h-6 @[640px]:w-6" />
  </span>
  <h3 className="text-sm @[640px]:text-base font-semibold text-gray-900">Feature Catalog</h3>
  <p className="text-xs @[640px]:text-sm text-gray-600 mt-1 flex-1">Manage features (repairs, reports, etc.)</p>
  <span className="inline-flex items-center gap-1 text-xs @[640px]:text-sm font-medium text-orange-600 mt-2 @[640px]:mt-3 group-hover:gap-2 transition-all">
  Open <ArrowRight className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  </span>
 </Link>
 <Link
  href="/platform/plan-catalog"
  className="group flex flex-col p-4 @[480px]:p-5 @[640px]:p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
 >
  <span className="inline-flex w-10 h-10 @[640px]:w-12 @[640px]:h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-3 @[640px]:mb-4 group-hover:bg-orange-200 transition-colors">
  <Package className="h-5 w-5 @[640px]:h-6 @[640px]:w-6" />
  </span>
  <h3 className="text-sm @[640px]:text-base font-semibold text-gray-900">Plan Catalog</h3>
  <p className="text-xs @[640px]:text-sm text-gray-600 mt-1 flex-1">Starter, Pro, Enterprise plans</p>
  <span className="inline-flex items-center gap-1 text-xs @[640px]:text-sm font-medium text-orange-600 mt-2 @[640px]:mt-3 group-hover:gap-2 transition-all">
  Open <ArrowRight className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  </span>
 </Link>
 <Link
  href="/platform/tenants"
  className="group flex flex-col p-4 @[480px]:p-5 @[640px]:p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
 >
  <span className="inline-flex w-10 h-10 @[640px]:w-12 @[640px]:h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-3 @[640px]:mb-4 group-hover:bg-orange-200 transition-colors">
  <Users className="h-5 w-5 @[640px]:h-6 @[640px]:w-6" />
  </span>
  <h3 className="text-sm @[640px]:text-base font-semibold text-gray-900">Tenants</h3>
  <p className="text-xs @[640px]:text-sm text-gray-600 mt-1 flex-1">Tenant list and subscriptions</p>
  <span className="inline-flex items-center gap-1 text-xs @[640px]:text-sm font-medium text-orange-600 mt-2 @[640px]:mt-3 group-hover:gap-2 transition-all">
  Open <ArrowRight className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  </span>
 </Link>
 <Link
  href="/settings"
  className="group flex flex-col p-4 @[480px]:p-5 @[640px]:p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200"
 >
  <span className="inline-flex w-10 h-10 @[640px]:w-12 @[640px]:h-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600 mb-3 @[640px]:mb-4 group-hover:bg-gray-200 transition-colors">
  <Settings className="h-5 w-5 @[640px]:h-6 @[640px]:w-6" />
  </span>
  <h3 className="text-sm @[640px]:text-base font-semibold text-gray-900">Back to Settings</h3>
  <p className="text-xs @[640px]:text-sm text-gray-600 mt-1 flex-1">Return to app settings</p>
  <span className="inline-flex items-center gap-1 text-xs @[640px]:text-sm font-medium text-gray-600 mt-2 @[640px]:mt-3 group-hover:gap-2 transition-all">
  Open <ArrowRight className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  </span>
 </Link>
 </div>
 </div>
 );
}

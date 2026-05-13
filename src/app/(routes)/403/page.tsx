"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
 <div className="max-w-md w-full text-center">
 <div className="p-4 rounded-full bg-red-100 inline-flex mb-4">
  <ShieldX className="h-16 w-16 text-red-600" />
 </div>
 <h1 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h1>
 <p className="text-gray-600 mb-6">
  You do not have permission to view this page.
 </p>
 <Link
  href="/dashboard"
  className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
 >
  Back to Dashboard
 </Link>
 </div>
 </div>
 );
}

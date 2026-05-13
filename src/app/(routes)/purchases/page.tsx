"use client";

import React from "react";
import Link from "next/link";
import {
 ShoppingCart,
 PlusSquare,
 Undo,
 ChevronRight,
} from "lucide-react";

interface PurchasesItem {
 title: string;
 description: string;
 icon: React.ElementType;
 path: string;
 color: string;
}

const purchasesItems: PurchasesItem[] = [
 {
 title: "Purchases List",
 description: "View and manage all purchase orders",
 icon: ShoppingCart,
 path: "/purchases/list",
 color: "bg-blue-100 text-blue-600",
 },
 {
 title: "Add Purchase",
 description: "Create a new purchase entry",
 icon: PlusSquare,
 path: "/purchases/add",
 color: "bg-green-100 text-green-600",
 },
 {
 title: "Purchase Return",
 description: "Manage purchase returns and refunds",
 icon: Undo,
 path: "/purchases/return",
 color: "bg-neutral-100 text-neutral-600",
 },
];

const PurchasesPage = () => {
 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[480px]:p-3 @[640px]:p-4 @[1024px]:p-6">
 {/* Page Header */}
 <div className="mb-3 @[640px]:mb-4 @[1024px]:mb-6">
 <div className="flex items-center gap-2 @[640px]:gap-3">
  <div className="p-1.5 @[640px]:p-2 bg-orange-100 rounded-lg">
  <ShoppingCart className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 @[1024px]:h-6 @[1024px]:w-6 text-orange-500" />
  </div>
  <div>
  <h1 className="text-base @[480px]:text-lg @[640px]:text-xl @[1024px]:text-2xl font-semibold text-gray-800">Purchases</h1>
  <p className="text-gray-500 text-[11px] @[480px]:text-xs @[640px]:text-sm mt-0.5 @[640px]:mt-1">
  Manage purchases, orders, and returns
  </p>
  </div>
 </div>
 </div>

 {/* Purchases Grid */}
 <div className="grid grid-cols-1 @[640px]:grid-cols-2 @[768px]:grid-cols-2 @[1024px]:grid-cols-4 gap-2 @[480px]:gap-3 @[640px]:gap-4">
 {purchasesItems.map((item, index) => (
  <Link
  key={index}
  href={item.path}
  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 @[480px]:p-4 @[640px]:p-5 @[1024px]:p-6 hover:shadow-md hover:border-orange-200 transition-all group"
  >
  <div className="flex items-start justify-between">
  <div className={`p-2 @[640px]:p-3 rounded-lg ${item.color}`}>
  <item.icon className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 @[1024px]:h-6 @[1024px]:w-6" />
  </div>
  <ChevronRight className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
  </div>
  <h3 className="text-sm @[480px]:text-base @[1024px]:text-lg font-medium text-gray-800 mt-3 @[640px]:mt-4">{item.title}</h3>
  <p className="text-[11px] @[480px]:text-xs @[640px]:text-sm text-gray-500 mt-0.5 @[640px]:mt-1">{item.description}</p>
  </Link>
 ))}
 </div>
 </div>
 );
};

export default PurchasesPage;

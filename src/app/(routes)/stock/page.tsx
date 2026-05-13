"use client";

import React from "react";
import Link from "next/link";
import { Eye, TrendingDown, ArrowRight } from "lucide-react";

interface StockItem {
 title: string;
 description: string;
 path: string;
 icon: React.ElementType;
 iconBg: string;
 iconColor: string;
} 
 
const stockItems: StockItem[] = [
 {
 title: "Stock",
 description: "View your stock levels and inventory",
 path: "/stock/view",
 icon: Eye,
 iconBg: "bg-blue-100",
 iconColor: "text-blue-600",
 },
 {
 title: "Stock Adjustment",
 description: "Adjust stock quantities and correct discrepancies",
 path: "/stock/adjustment",
 icon: TrendingDown,
 iconBg: "bg-neutral-100",
 iconColor: "text-neutral-600",
 },
];

const StockPage = () => {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
 <p className="text-gray-600 mt-1">
  View inventory, adjust stock, and manage transfers
 </p>
 </div>

 {/* Stock Items Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {stockItems.map((item) => (
  <Link
  key={item.path}
  href={item.path}
  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
  >
  <div className="flex items-start justify-between">
  <div className={`w-12 h-12 ${item.iconBg} rounded-lg flex items-center justify-center`}>
  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
  </div>
  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mt-4">
  {item.title}
  </h3>
  <p className="text-sm text-gray-500 mt-2">{item.description}</p>
  </Link>
 ))}
 </div>
 </div>
 );
};

export default StockPage;

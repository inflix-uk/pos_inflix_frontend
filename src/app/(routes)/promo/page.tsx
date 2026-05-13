"use client";

import React from "react";
import Link from "next/link";
import { Tag, Gift, Percent, ClipboardList, ArrowRight } from "lucide-react";

interface PromoItem {
 title: string;
 description: string;
 path: string;
 icon: React.ElementType;
 iconBg: string;
 iconColor: string;
}

const promoItems: PromoItem[] = [
 {
 title: "Coupons",
 description: "Manage your promotional coupons and discount codes",
 path: "/promo/coupons",
 icon: Tag,
 iconBg: "bg-orange-100",
 iconColor: "text-orange-600",
 },
 {
 title: "Gift Cards",
 description: "Create and manage gift cards for customers",
 path: "/promo/gift-cards",
 icon: Gift,
 iconBg: "bg-neutral-100",
 iconColor: "text-neutral-600",
 },
 {
 title: "Discount Plan",
 description: "Set up discount plans for different customer segments",
 path: "/promo/discount-plan",
 icon: ClipboardList,
 iconBg: "bg-blue-100",
 iconColor: "text-blue-600",
 },
 {
 title: "Discount List",
 description: "View and manage all active discounts",
 path: "/promo/discount-list",
 icon: Percent,
 iconBg: "bg-green-100",
 iconColor: "text-green-600",
 },
];

const PromoPage = () => {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-2xl font-bold text-gray-900">Promo</h1>
 <p className="text-gray-600 mt-1">
  Manage your promotional offers, coupons, gift cards, and discounts
 </p>
 </div>

 {/* Promo Items Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {promoItems.map((item) => (
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

export default PromoPage;

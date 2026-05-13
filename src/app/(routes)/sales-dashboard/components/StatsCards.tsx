"use client";

import React from "react";
import type { StatCard } from "../types";

interface StatsCardsProps {
 cards: StatCard[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ cards }) => {
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
 {cards.map((card, index) => (
 <div
  key={index}
  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
 >
  <div className="p-4 sm:p-5">
  <div className="flex justify-between items-start gap-2">
  <div className="min-w-0 flex-1">
  <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">
   {card.title}
  </p>
  <p className="text-gray-900 text-lg sm:text-xl font-bold mt-0.5 truncate">
   {card.amount}
  </p>
  {card.subtitle && (
   <p className="text-gray-400 text-xs mt-1 truncate">
   {card.subtitle}
   </p>
  )}
  {card.trend && card.trendValue && (
   <span
   className={`inline-flex items-center text-xs font-medium mt-1 ${
   card.trend === "up"
   ? "text-green-600"
   : "text-red-600"
   }`}
   >
   {card.trend === "up" ? "↑" : "↓"} {card.trendValue}
   </span>
  )}
  </div>
  <div
  className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-xl ${card.bgColor} text-white`}
  aria-hidden
  >
  {card.icon}
  </div>
  </div>
  <div className="mt-3 pt-3 border-t border-gray-100">
  <p className="text-gray-600 text-sm font-semibold">{card.value}</p>
  </div>
  </div>
 </div>
 ))}
 </div>
 );
};

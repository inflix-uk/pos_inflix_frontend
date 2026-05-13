"use client";

import React from "react";
import { User } from "lucide-react";
import type { AccountForSale } from "./CustomerAccountSelect";

interface CustomerContextStripProps {
 customer: AccountForSale;
 /** Previous balance if available (wholesale) */
 previousBalance?: number;
 className?: string;
}

export function CustomerContextStrip({ customer, previousBalance, className = "" }: CustomerContextStripProps) {
 const balance = "balance" in customer && typeof (customer as { balance?: number }).balance === "number"
 ? (customer as { balance: number }).balance
 : previousBalance ?? 0;

 return (
 <div
 className={`flex items-center gap-2 @[640px]:gap-3 px-2.5 @[640px]:px-3 py-2 min-h-[36px] min-w-0 max-w-full @[640px]:max-w-[320px] rounded-lg bg-neutral-50 border border-neutral-200 text-xs @[640px]:text-sm ${className}`}
 role="status"
 aria-label={`Customer: ${customer.name}`}
 >
 <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
 <User className="h-3.5 w-3.5 text-blue-600" aria-hidden />
 </div>
 <span className="font-medium text-gray-900 truncate min-w-0 flex-1">{customer.name}</span>
 {balance > 0 && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100/80 text-neutral-700 text-xs font-medium shrink-0">
  Balance: £{balance.toFixed(2)}
 </span>
 )}
 </div>
 );
}

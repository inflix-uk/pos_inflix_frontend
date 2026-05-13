"use client";

import React from "react";
import { User, Phone, Mail } from "lucide-react";
import type { AccountForSale } from "./CustomerAccountSelect";

interface CustomerSummaryCardProps {
 customer: AccountForSale;
}

export const CustomerSummaryCard: React.FC<CustomerSummaryCardProps> = ({
 customer,
}) => {
 return (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
 <User className="h-5 w-5 text-blue-600" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-gray-900 truncate">
  {customer.name}
 </p>
 {"contactName" in customer && customer.contactName ? (
  <p className="text-xs text-gray-600 mt-0.5">{customer.contactName}</p>
 ) : "contactPerson" in customer && customer.contactPerson ? (
  <p className="text-xs text-gray-600 mt-0.5">{customer.contactPerson}</p>
 ) : null}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-600">
  {customer.phone && (
  <span className="flex items-center gap-1">
  <Phone className="h-3.5 w-3.5" />
  {customer.phone}
  </span>
  )}
  {customer.email && (
  <span className="flex items-center gap-1 truncate">
  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
  <span className="truncate">{customer.email}</span>
  </span>
  )}
 </div>
 </div>
 </div>
 );
};

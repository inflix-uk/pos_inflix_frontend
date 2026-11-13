"use client";

import React from "react";
import { CreditCard } from "lucide-react";

/** Quick picks for the maximum credit a customer may owe. */
export const CREDIT_LIMIT_PRESETS = [1000, 5000, 10000, 50000] as const;

const formatGBP = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

interface CustomerCreditFieldsProps {
 /** Whether the customer may buy on credit. Undefined is treated as allowed (legacy customers). */
 creditAllowed: boolean | undefined;
 /** Maximum outstanding balance. 0 / undefined = no limit. */
 creditLimit: number | undefined;
 onChange: (next: { creditAllowed: boolean; creditLimit: number }) => void;
 /** Prefix for input ids so two forms on one page don't clash. */
 idPrefix?: string;
 /** Current balance owed (positive = customer owes). Shown as context when editing. */
 currentBalance?: number;
}

/**
 * "Allow credit" switch + "Maximum credit" amount with quick picks (£1,000 / £5,000 / £10,000 / £50,000).
 * Used on the add / edit customer forms. The backend enforces both at checkout.
 */
export function CustomerCreditFields({
 creditAllowed,
 creditLimit,
 onChange,
 idPrefix = "customer",
 currentBalance,
}: CustomerCreditFieldsProps) {
 const allowed = creditAllowed !== false;
 const limit = Math.max(0, Number(creditLimit) || 0);
 const owing = Math.max(0, Number(currentBalance) || 0);
 const available = limit > 0 ? Math.max(0, limit - owing) : null;

 return (
 <fieldset className="rounded-lg border border-gray-200 p-4 space-y-3">
 <legend className="px-1 text-sm font-semibold text-gray-800 inline-flex items-center gap-1.5">
 <CreditCard className="h-4 w-4 text-orange-500" aria-hidden />
 Credit
 </legend>

 <div className="flex items-start gap-2">
 <input
  type="checkbox"
  id={`${idPrefix}-creditAllowed`}
  checked={allowed}
  onChange={(e) => onChange({ creditAllowed: e.target.checked, creditLimit: limit })}
  className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
 />
 <label htmlFor={`${idPrefix}-creditAllowed`} className="text-sm text-gray-700">
  Allow credit
  <span className="block text-xs text-gray-500">
  {allowed
   ? "Sales can be left part-paid on this customer's account."
   : "Full payment is required — credit sales will be blocked with a warning."}
  </span>
 </label>
 </div>

 {allowed && (
 <div>
  <label htmlFor={`${idPrefix}-creditLimit`} className="block text-sm font-medium text-gray-700 mb-1">
  Maximum credit
  </label>
  <div className="flex flex-wrap items-center gap-2">
  <div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">£</span>
  <input
   id={`${idPrefix}-creditLimit`}
   type="number"
   min={0}
   step="1"
   inputMode="decimal"
   value={limit > 0 ? String(limit) : ""}
   onChange={(e) => {
   const n = parseFloat(e.target.value);
   onChange({ creditAllowed: true, creditLimit: Number.isFinite(n) && n > 0 ? n : 0 });
   }}
   placeholder="No limit"
   className="w-36 pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
  </div>
  {CREDIT_LIMIT_PRESETS.map((amount) => (
  <button
   key={amount}
   type="button"
   onClick={() => onChange({ creditAllowed: true, creditLimit: amount })}
   className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
   limit === amount
    ? "bg-orange-500 border-orange-500 text-white"
    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
   }`}
  >
   {formatGBP(amount)}
  </button>
  ))}
  <button
  type="button"
  onClick={() => onChange({ creditAllowed: true, creditLimit: 0 })}
  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
   limit === 0
   ? "bg-orange-500 border-orange-500 text-white"
   : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
  }`}
  >
  No limit
  </button>
  </div>
  <p className="mt-1.5 text-xs text-gray-500">
  {limit > 0
  ? `The account balance can't go above ${formatGBP(limit)}.${
   available != null && currentBalance != null ? ` Available now: ${formatGBP(available)}.` : ""
   }`
  : "No maximum — any amount can be left on credit."}
  </p>
 </div>
 )}
 </fieldset>
 );
}

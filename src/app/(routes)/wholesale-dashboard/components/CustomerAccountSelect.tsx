"use client";

import React, { useState, useEffect, useImperativeHandle, useRef, useCallback, forwardRef } from "react";
import { User, ChevronDown, Loader2, RefreshCw, UserPlus } from "lucide-react";
import type { Customer } from "../../peoples/customers/types";
import type { Supplier } from "../../peoples/suppliers/types";
import { getAccountsForSales } from "./accountsForSalesApi";

/** Returns the secondary contact/person name on an account (Customer.contactName or Supplier.contactPerson). */
const getContactName = (a: Customer | Supplier): string => {
 const raw =
 ("contactName" in a ? (a as Customer).contactName : undefined) ??
 ("contactPerson" in a ? (a as Supplier).contactPerson : undefined);
 return (raw ?? "").trim();
};

/** Same accounts as /customers page: customers and suppliers (suppliers can be used as customer for sales) */
export type AccountForSale = Customer | Supplier;

export interface CustomerAccountSelectRef {
 refetch: () => void;
}

interface CustomerAccountSelectProps {
 value: AccountForSale | null;
 onChange: (account: AccountForSale | null) => void;
 required?: boolean;
 placeholder?: string;
 className?: string;
 /** When provided, shows "Add customer" and calls this when clicked (parent opens modal) */
 onAddCustomerClick?: () => void;
 /** Hide the label row for compact inline usage */
 compact?: boolean;
}

const isWalkIn = (a: Customer | Supplier): boolean =>
 a.name.trim().toLowerCase() === "walk-in customer";

const walkInFirst = (a: AccountForSale, b: AccountForSale): number => {
 const aw = isWalkIn(a);
 const bw = isWalkIn(b);
 if (aw && !bw) return -1;
 if (!aw && bw) return 1;
 return 0;
};

const searchable = (a: Customer | Supplier, q: string): boolean => {
 const qq = q.toLowerCase();
 return Boolean(
 a.name.toLowerCase().includes(qq) ||
 (a.phone && a.phone.includes(q)) ||
 (a.email && a.email.toLowerCase().includes(qq)) ||
 ("contactName" in a && (a as Customer).contactName && (a as Customer).contactName!.toLowerCase().includes(qq)) ||
 ("contactPerson" in a && (a as Supplier).contactPerson && (a as Supplier).contactPerson!.toLowerCase().includes(qq))
 );
};

const CustomerAccountSelectComponent: React.ForwardRefRenderFunction<
 CustomerAccountSelectRef,
 CustomerAccountSelectProps
> = (
 {
 value,
 onChange,
 required = true,
 placeholder = "Select account *",
 className = "",
 onAddCustomerClick,
 compact = false,
 },
 ref
) => {
 const [accounts, setAccounts] = useState<AccountForSale[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState("");

 // Single shared fetch helper — used by initial load, imperative refetch, and dropdown open.
 // Hits one combined endpoint (was two parallel calls). Pass `fresh:true` to bypass server cache.
 const fetchAccounts = useCallback(
 (opts?: { showLoading?: boolean; fresh?: boolean }) => {
 if (opts?.showLoading !== false) {
 setError(null);
 setLoading(true);
 }
 return getAccountsForSales({ fresh: opts?.fresh })
 .then((r) => {
 const customers = (r.customers || []) as Customer[];
 const suppliers = (r.suppliers || []) as Supplier[];
 setAccounts([...customers, ...suppliers]);
 })
 .catch(() => { if (opts?.showLoading !== false) setError("Could not load accounts"); })
 .finally(() => { if (opts?.showLoading !== false) setLoading(false); });
 },
 []
 );

 const fetchAccountsRef = useRef(fetchAccounts);
 fetchAccountsRef.current = fetchAccounts;
 useImperativeHandle(ref, () => ({
 refetch: () => fetchAccountsRef.current({ fresh: true }),
 }), []);

 useEffect(() => {
 let cancelled = false;
 fetchAccounts().finally(() => { if (cancelled) return; });
 return () => { cancelled = true; };
 }, [fetchAccounts]);

 const handleOpenDropdown = () => {
 setOpen((prev) => {
 if (!prev) fetchAccounts({ showLoading: false }); // background refresh
 return !prev;
 });
 };

 const filtered = (
 search.trim() === "" ? accounts : accounts.filter((a) => searchable(a, search.trim()))
 ).slice().sort(walkInFirst);

 return (
 <div className={`relative ${className}`}>
 {!compact && (
 <div className="flex items-center justify-between gap-2 mb-1">
  <label className="block text-sm font-medium text-gray-700">
  Customer account {required && <span className="text-red-500">*</span>}
  </label>
  {onAddCustomerClick && (
  <button
  type="button"
  onClick={() => {
  setOpen(false);
  onAddCustomerClick();
  }}
  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
  >
  <UserPlus className="h-4 w-4" />
  Add customer
  </button>
  )}
 </div>
 )}
 <button
 type="button"
 onClick={handleOpenDropdown}
 className={`w-full flex items-center gap-2 border text-left bg-white touch-manipulation transition-colors ${
  compact ? "px-3 py-2 min-h-[40px] rounded-lg text-sm" : "px-4 py-3 min-h-[44px] rounded-xl"
 } ${
  value
  ? "border-gray-300 text-gray-900 hover:border-gray-400"
  : "border-blue-300 bg-blue-50/40 text-gray-600"
 } ${required && !value ? "ring-1 ring-blue-300" : ""}`}
 aria-haspopup="listbox"
 aria-expanded={open}
 aria-label={value ? `Customer: ${value.name}` : placeholder}
 >
 {loading ? (
  <Loader2 className="h-5 w-5 animate-spin text-gray-400 flex-shrink-0" />
 ) : (
  <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
 )}
 <span className="flex-1 truncate">
  {value
  ? (() => {
   const contact = getContactName(value);
   return contact && contact !== value.name
    ? `${value.name} · ${contact}`
    : value.name;
  })()
  : placeholder}
 </span>
 <ChevronDown
  className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
 />
 </button>

 {error && (
 <div className="mt-1 flex items-center gap-2 flex-wrap">
  <p className="text-sm text-red-600">{error}</p>
  <button
  type="button"
  onClick={() => fetchAccounts()}
  className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
  >
  <RefreshCw className="h-4 w-4" /> Retry
  </button>
 </div>
 )}

 {open && (
 <>
  <div
  className="fixed inset-0 z-40"
  aria-hidden
  onClick={() => setOpen(false)}
  />
  <div
  role="listbox"
  className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-[520px] overflow-hidden flex flex-col"
  >
  <div className="p-2 border-b border-gray-100">
  <input
  type="search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search by name, phone, email, contact name..."
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  autoFocus
  />
  </div>
  <ul className="overflow-y-auto touch-scroll flex-1 py-1">
  {filtered.length === 0 ? (
  <li className="px-4 py-3 text-sm text-gray-500">
   {loading ? (
   <span className="inline-flex items-center gap-2">
   <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" aria-hidden />
   Loading…
   </span>
  ) : (
   "No accounts found"
  )}
  </li>
  ) : (
  filtered.map((a) => (
   <li key={a._id}>
   <button
   type="button"
   role="option"
   aria-selected={value?._id === a._id}
   onClick={() => {
   onChange(a);
   setOpen(false);
   setSearch("");
   }}
   className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex flex-col items-start touch-manipulation min-h-[44px] ${
   value?._id === a._id ? "bg-blue-50 text-blue-700" : ""
   }`}
   >
   <span className="font-medium text-gray-900 truncate w-full">{a.name}</span>
   {(() => {
   const contact = getContactName(a);
   return contact && contact !== a.name ? (
    <span className="text-xs text-gray-500 truncate w-full">{contact}</span>
   ) : null;
   })()}
   </button>
   </li>
  ))
  )}
  </ul>
  </div>
 </>
 )}
 </div>
 );
};

export const CustomerAccountSelect = forwardRef(CustomerAccountSelectComponent);

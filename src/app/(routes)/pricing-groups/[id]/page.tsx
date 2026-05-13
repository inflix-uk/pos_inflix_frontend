"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Users, List, Plus, X, DollarSign, RefreshCw } from "lucide-react";
import { pricingGroupsApi } from "../service/pricingGroupsApi";
import { customerApi } from "../../peoples/customers/service/customerApi";
import type { Customer } from "../../peoples/customers/types";
import { stockViewApi, type StockViewRowsResponse } from "../../stock/view/services/stockViewApi";
import { ProductsRateTable, groupRowsByVariant } from "../../inventory/products/components/ProductsRateTable";
import type { StockViewRow } from "../../stock/view/types";

type TabId = "rate-list" | "customers";

export default function PricingGroupDetailPage() {
 const params = useParams();
 const id = (params?.id as string) ?? "";
 const [group, setGroup] = useState<{ _id: string; name: string } | null>(null);
 const [loading, setLoading] = useState(true);
 const [tab, setTab] = useState<TabId>("rate-list");
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 // Rate list state: same data source as Inventory -> Serial Products -> Rate list
 const [rateListRows, setRateListRows] = useState<StockViewRow[]>([]);
 const [rateListLoading, setRateListLoading] = useState(false);
 const [groupPricesByVariantKey, setGroupPricesByVariantKey] = useState<Record<string, number>>({});
 const [rateSearch, setRateSearch] = useState("");
 const [rateCategory, setRateCategory] = useState("");
 const [rateBrand, setRateBrand] = useState("");
 const [rateCapacity, setRateCapacity] = useState("");
 const [rateFilterOptions, setRateFilterOptions] = useState<{
 categories: string[];
 brands: string[];
 capacities: string[];
 colours: string[];
 }>({ categories: [], brands: [], capacities: [], colours: [] });

 // Customers state
 const [customersInGroup, setCustomersInGroup] = useState<Customer[]>([]);
 const [customersLoading, setCustomersLoading] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [searchResults, setSearchResults] = useState<Customer[]>([]);
 const [searching, setSearching] = useState(false);
 const [assigningId, setAssigningId] = useState<string | null>(null);
 const [removingId, setRemovingId] = useState<string | null>(null);

 const showMsg = (type: "success" | "error", text: string) => {
 setMessage({ type, text });
 setTimeout(() => setMessage(null), 3000);
 };

 useEffect(() => {
 if (!id) return;
 let cancelled = false;
 setLoading(true);
 pricingGroupsApi.getById(id).then((res) => {
 if (!cancelled && res.success && res.data) setGroup(res.data);
 if (!cancelled) setLoading(false);
 });
 return () => { cancelled = true; };
 }, [id]);

 const loadRateList = useCallback(async (overrides?: { search?: string; category?: string; brand?: string; capacity?: string }) => {
 if (!id) return;
 const search = overrides?.search !== undefined ? overrides.search : rateSearch;
 const category = overrides?.category !== undefined ? overrides.category : rateCategory;
 const brand = overrides?.brand !== undefined ? overrides.brand : rateBrand;
 const capacity = overrides?.capacity !== undefined ? overrides.capacity : rateCapacity;
 if (overrides) {
 setRateSearch(overrides.search ?? rateSearch);
 setRateCategory(overrides.category ?? rateCategory);
 setRateBrand(overrides.brand ?? rateBrand);
 setRateCapacity(overrides.capacity ?? rateCapacity);
 }
 setRateListLoading(true);
 try {
 const [rowsRes, variantPriceRes] = await Promise.all([
 stockViewApi.getStockViewRows({
  page: 1,
  limit: 10000,
  excludeSold: true,
  statusFilter: "available",
  productType: "serial",
  search: search.trim() || undefined,
  category: category || undefined,
  brand: brand || undefined,
  capacity: capacity || undefined,
 }),
 pricingGroupsApi.getVariantPricesForGroup(id),
 ]);

 const rows: StockViewRow[] = rowsRes.success && Array.isArray(rowsRes.data) ? rowsRes.data : [];
 setRateListRows(rows);
 if (rowsRes.success && (rowsRes as StockViewRowsResponse).filterOptions) {
 setRateFilterOptions((rowsRes as StockViewRowsResponse).filterOptions ?? { categories: [], brands: [], capacities: [], colours: [] });
 }

 const variantToPrice: Record<string, number> = variantPriceRes.success && variantPriceRes.data ? { ...variantPriceRes.data } : {};
 setGroupPricesByVariantKey(variantToPrice);
 } finally {
 setRateListLoading(false);
 }
 }, [id, rateSearch, rateCategory, rateBrand, rateCapacity]);

 useEffect(() => {
 if (tab === "rate-list" && id) loadRateList();
 }, [tab, id, loadRateList]);

 const loadCustomersInGroup = useCallback(async () => {
 if (!id) return;
 setCustomersLoading(true);
 try {
 const res = await customerApi.getAll({ pricingGroupId: id, limit: 500 });
 if (res.success && Array.isArray(res.data)) setCustomersInGroup(res.data);
 else setCustomersInGroup([]);
 } finally {
 setCustomersLoading(false);
 }
 }, [id]);

 useEffect(() => {
 if (tab === "customers" && id) loadCustomersInGroup();
 }, [tab, id, loadCustomersInGroup]);

 const handleVariantGroupPriceChange = useCallback(
 async (variantKey: string, price: number | null) => {
 try {
 await pricingGroupsApi.setVariantGroupPrice(id, variantKey, price);
 setGroupPricesByVariantKey((prev) => {
  const next = { ...prev };
  if (price != null) next[variantKey] = price;
  else delete next[variantKey];
  return next;
 });
 showMsg("success", "Price saved");
 } catch (err) {
 showMsg("error", err instanceof Error ? err.message : "Failed to save");
 throw err;
 }
 },
 [id]
 );

 const handleSearchCustomers = async () => {
 const q = searchQuery.trim();
 if (!q) {
 setSearchResults([]);
 return;
 }
 setSearching(true);
 try {
 const res = await customerApi.getAll({ search: q, limit: 50 });
 if (res.success && Array.isArray(res.data)) setSearchResults(res.data);
 else setSearchResults([]);
 } finally {
 setSearching(false);
 }
 };

 const addCustomerToGroup = async (customer: Customer) => {
 setAssigningId(customer._id!);
 try {
 const res = await customerApi.update(customer._id!, { pricingGroupId: id });
 if (res.success) {
 setCustomersInGroup((prev) => (prev.some((c) => c._id === customer._id) ? prev : [...prev, { ...customer, pricingGroupId: id }]));
 setSearchResults((prev) => prev.filter((c) => c._id !== customer._id));
 showMsg("success", `${customer.name} added to group`);
 } else {
 showMsg("error", (res as { message?: string }).message || "Failed to add");
 }
 } catch {
 showMsg("error", "Failed to add");
 } finally {
 setAssigningId(null);
 }
 };

 const removeCustomerFromGroup = async (customer: Customer) => {
 setRemovingId(customer._id!);
 try {
 const res = await customerApi.update(customer._id!, { pricingGroupId: null });
 if (res.success) {
 setCustomersInGroup((prev) => prev.filter((c) => c._id !== customer._id));
 showMsg("success", "Customer removed from group");
 } else {
 showMsg("error", (res as { message?: string }).message || "Failed to remove");
 }
 } catch {
 showMsg("error", "Failed to remove");
 } finally {
 setRemovingId(null);
 }
 };

 if (!id) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-gray-500">Invalid group</p>
 </div>
 );
 }

 if (loading || !group) {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {message && (
 <div
  className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow ${
  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="max-w-[1400px] mx-auto">
 <div className="mb-4">
  <Link href="/pricing-groups" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
  <ArrowLeft className="h-4 w-4" />
  Back to Pricing Groups
  </Link>
 </div>
 <h1 className="text-xl font-semibold text-gray-900 mb-6">{group.name}</h1>

 <div className="flex gap-2 border-b border-gray-200 mb-4">
  <button
  type="button"
  onClick={() => setTab("rate-list")}
  className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
  tab === "rate-list" ? "bg-white border border-b-0 border-gray-200 -mb-px text-orange-600" : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  <span className="inline-flex items-center gap-2">
  <List className="h-4 w-4" />
  Rate List
  </span>
  </button>
  <button
  type="button"
  onClick={() => setTab("customers")}
  className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
  tab === "customers" ? "bg-white border border-b-0 border-gray-200 -mb-px text-orange-600" : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  <span className="inline-flex items-center gap-2">
  <Users className="h-4 w-4" />
  Customers
  </span>
  </button>
 </div>

 {tab === "rate-list" && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[560px] flex flex-col">
  <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 bg-gray-50/50">
  <div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-orange-100">
   <DollarSign className="h-5 w-5 text-orange-600" />
  </div>
  <div>
   <h2 className="text-lg font-semibold text-gray-900">Rate list</h2>
   <p className="text-xs text-gray-500 mt-0.5">Update sale prices by SKU — serial items grouped by purchase line. Edits save as this group&apos;s custom price only.</p>
  </div>
  </div>
  <div className="flex items-center gap-2">
  <button
   type="button"
   onClick={() => loadRateList()}
   disabled={rateListLoading}
   className="p-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-white hover:border-orange-200 hover:text-orange-600 disabled:opacity-50 transition-colors"
   aria-label="Refresh"
  >
   <RefreshCw className={`h-4 w-4 ${rateListLoading ? "animate-spin" : ""}`} />
  </button>
  </div>
  </div>
  <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200 bg-gray-50/30 flex flex-wrap items-center gap-3">
  <input
  type="text"
  value={rateSearch}
  onChange={(e) => setRateSearch(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && loadRateList()}
  placeholder="Search name, brand, model…"
  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  <select
  value={rateCategory}
  onChange={(e) => setRateCategory(e.target.value)}
  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">All categories</option>
  {rateFilterOptions.categories.map((c) => (
   <option key={c} value={c}>{c}</option>
  ))}
  </select>
  <select
  value={rateBrand}
  onChange={(e) => setRateBrand(e.target.value)}
  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">All brands</option>
  {rateFilterOptions.brands.map((b) => (
   <option key={b} value={b}>{b}</option>
  ))}
  </select>
  <select
  value={rateCapacity}
  onChange={(e) => setRateCapacity(e.target.value)}
  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[100px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="">All capacities</option>
  {rateFilterOptions.capacities.map((c) => (
   <option key={c} value={c}>{c}</option>
  ))}
  </select>
  <button
  type="button"
  onClick={() => loadRateList()}
  disabled={rateListLoading}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
  >
  Apply filters
  </button>
  {(rateSearch || rateCategory || rateBrand || rateCapacity) && (
  <button
   type="button"
   onClick={() => loadRateList({ search: "", category: "", brand: "", capacity: "" })}
   disabled={rateListLoading}
   className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
  >
   Clear filters
  </button>
  )}
  </div>
  <div className="flex-1 overflow-auto p-5">
  <ProductsRateTable
  rows={rateListRows}
  isLoading={rateListLoading}
  groupMode
  groupPricesByVariantKey={groupPricesByVariantKey}
  onVariantGroupPriceChange={handleVariantGroupPriceChange}
  refetch={loadRateList}
  />
  </div>
  <p className="px-5 py-3 text-xs text-gray-500 border-t border-gray-200">
  Same items as Inventory → Serial Products → Rate list. Edit price to set this group&apos;s custom price; leave blank or clear to fall back to default.
  </p>
  </div>
 )}

 {tab === "customers" && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <div className="p-4 border-b border-gray-200">
  <div className="flex flex-wrap gap-2">
  <input
   type="text"
   value={searchQuery}
   onChange={(e) => setSearchQuery(e.target.value)}
   onKeyDown={(e) => e.key === "Enter" && handleSearchCustomers()}
   placeholder="Search customers to add…"
   className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[200px]"
  />
  <button type="button" onClick={handleSearchCustomers} disabled={searching} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50">
   {searching ? "Searching…" : "Search"}
  </button>
  </div>
  {searchResults.length > 0 && (
  <div className="mt-3">
   <p className="text-sm font-medium text-gray-700 mb-2">Add to group:</p>
   <ul className="space-y-1">
   {searchResults.filter((c) => !customersInGroup.some((g) => g._id === c._id)).slice(0, 10).map((c) => (
   <li key={c._id} className="flex items-center justify-between py-1">
   <span className="text-sm">{c.name} {c.phone ? ` · ${c.phone}` : ""}</span>
   <button
    type="button"
    onClick={() => addCustomerToGroup(c)}
    disabled={assigningId === c._id}
    className="text-sm text-orange-600 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
   >
    {assigningId === c._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
    Add
   </button>
   </li>
   ))}
   </ul>
  </div>
  )}
  </div>
  {customersLoading ? (
  <div className="p-12 flex justify-center">
  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
  ) : customersInGroup.length === 0 ? (
  <div className="p-12 text-center text-gray-500">No customers in this group. Search above to add customers.</div>
  ) : (
  <div className="overflow-x-auto">
  <table className="w-full">
   <thead className="bg-gray-50 border-b border-gray-200">
   <tr>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Phone</th>
   <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Action</th>
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-200">
   {customersInGroup.map((c) => (
   <tr key={c._id} className="hover:bg-gray-50">
   <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
   <td className="py-3 px-4 text-gray-600">{c.phone ?? "-"}</td>
   <td className="py-3 px-4 text-right">
    <button
    type="button"
    onClick={() => removeCustomerFromGroup(c)}
    disabled={removingId === c._id}
    className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline disabled:opacity-50"
    >
    {removingId === c._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
    Remove from group
    </button>
   </td>
   </tr>
   ))}
   </tbody>
  </table>
  </div>
  )}
  </div>
 )}
 </div>
 </div>
 );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
 ArrowLeft,
 Loader2,
 Pencil,
 KeyRound,
 ShoppingBag,
 DollarSign,
 Phone,
 Mail,
 MapPin,
 Building2,
} from "lucide-react";
import { customerApi } from "../../peoples/customers/service/customerApi";
import type { CustomerSummary } from "../../peoples/customers/types";
import { CustomerStatementPanel } from "../components/CustomerStatementPanel";
import { CustomerSalesTab } from "../components/CustomerSalesTab";
import { EditCustomerModal } from "../../peoples/customers/components/EditCustomerModal";
import { SetPasswordModal } from "../components/SetPasswordModal";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { Customer, CustomerFormData } from "../../peoples/customers/types";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type TabId = "overview" | "statement" | "sales";

export default function CustomerDetailPage() {
 const params = useParams();
 const router = useRouter();
 const searchParams = useSearchParams();
 const customerId = typeof params.id === "string" ? params.id : "";

 const { can } = usePermissionsContext();
 const { data: entitlements } = useEntitlements();
 const isInvoicingEnabled = entitlements?.enabledFeatures?.["customer invoicing"] === true;

 const tabParam = searchParams.get("tab");
 const initialTab: TabId =
  tabParam === "statement" || tabParam === "sales" ? tabParam : "overview";
 const [activeTab, setActiveTab] = useState<TabId>(initialTab);

 const [summary, setSummary] = useState<CustomerSummary | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [editOpen, setEditOpen] = useState(false);
 const [passwordOpen, setPasswordOpen] = useState(false);
 const [saving, setSaving] = useState(false);

 const loadSummary = useCallback(async () => {
  if (!customerId) return;
  setLoading(true);
  setError(null);
  try {
   const res = await customerApi.getSummary(customerId);
   if (res.success && res.data) setSummary(res.data);
   else setError("Customer not found");
  } catch (e) {
   setError(e instanceof Error ? e.message : "Failed to load customer");
  } finally {
   setLoading(false);
  }
 }, [customerId]);

 useEffect(() => {
  loadSummary();
 }, [loadSummary]);

 useEffect(() => {
  if (tabParam === "statement" || tabParam === "sales" || tabParam === "overview") {
   setActiveTab(tabParam);
  }
 }, [tabParam]);

 const setTab = (tab: TabId) => {
  setActiveTab(tab);
  const url = tab === "overview" ? `/customers/${customerId}` : `/customers/${customerId}?tab=${tab}`;
  router.replace(url, { scroll: false });
 };

 const customer = summary?.customer;
 const balance = summary?.stats.openBalance ?? customer?.balance ?? 0;
 const isStoreCredit = balance < 0;

 const handleSaveCustomer = async (id: string, _accountType: "customer" | "supplier", data: CustomerFormData) => {
  setSaving(true);
  try {
   await customerApi.update(id, data);
   setEditOpen(false);
   loadSummary();
  } finally {
   setSaving(false);
  }
 };

 const tabs: { id: TabId; label: string; show: boolean }[] = [
  { id: "overview", label: "Overview", show: true },
  { id: "statement", label: "Statement", show: can("accounts.view") },
  { id: "sales", label: "Sales", show: can("sale.view") },
 ];

 if (loading && !summary) {
  return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-2 text-gray-500">
    <Loader2 className="h-6 w-6 animate-spin" />
    Loading customer…
   </div>
  );
 }

 if (error || !customer) {
  return (
   <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-lg mx-auto text-center py-16">
     <p className="text-gray-700 mb-4">{error || "Customer not found"}</p>
     <Link href="/customers" className="text-orange-600 hover:underline text-sm font-medium">
      Back to customers
     </Link>
    </div>
   </div>
  );
 }

 const addressParts = [
  customer.address?.street,
  customer.address?.city,
  customer.address?.zipCode,
  customer.address?.country,
 ].filter(Boolean);

 return (
  <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-4 @[1024px]:p-6">
   <div className="max-w-6xl mx-auto space-y-4">
    <nav className="text-sm text-gray-500">
     <Link href="/customers" className="hover:text-orange-600">
      Customers
     </Link>
     <span className="mx-2">/</span>
     <span className="text-gray-900 font-medium">{customer.name}</span>
    </nav>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 @[640px]:p-6">
     <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
       <Link
        href="/customers"
        className="mt-1 p-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"
        aria-label="Back"
       >
        <ArrowLeft className="h-5 w-5" />
       </Link>
       <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
         <h1 className="text-xl @[640px]:text-2xl font-bold text-gray-900 truncate">{customer.name}</h1>
         <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
           customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
         >
          {customer.isActive ? "Active" : "Inactive"}
         </span>
        </div>
        {customer.contactName && customer.contactName !== customer.name && (
         <p className="text-sm text-gray-600 mt-0.5">{customer.contactName}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
         {customer.phone && (
          <span className="inline-flex items-center gap-1">
           <Phone className="h-3.5 w-3.5" />
           {customer.phone}
          </span>
         )}
         {customer.email && (
          <span className="inline-flex items-center gap-1">
           <Mail className="h-3.5 w-3.5" />
           {customer.email}
          </span>
         )}
        </div>
       </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
       <div className="text-right mr-2">
        <p className="text-xs text-gray-500 uppercase">{isStoreCredit ? "Store credit" : "Balance"}</p>
        <p className={`text-xl font-bold ${isStoreCredit ? "text-blue-700" : "text-emerald-700"}`}>
         {formatMoney(Math.abs(balance))}
        </p>
       </div>
       {can("sale.create") && (
        <Link
         href={`/create-sales?customerId=${encodeURIComponent(customerId)}`}
         className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
        >
         <ShoppingBag className="h-4 w-4" />
         New sale
        </Link>
       )}
       {can("accounts.payment") && balance > 0 && (
        <button
         type="button"
         onClick={() => setTab("statement")}
         className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
        >
         <DollarSign className="h-4 w-4" />
         Record payment
        </button>
       )}
       {can("customer.edit") && (
        <button
         type="button"
         onClick={() => setEditOpen(true)}
         className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
        >
         <Pencil className="h-4 w-4" />
         Edit
        </button>
       )}
       {can("customer.edit") && isInvoicingEnabled && customer.email && (
        <button
         type="button"
         onClick={() => setPasswordOpen(true)}
         className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
         title="Set portal password"
        >
         <KeyRound className="h-4 w-4" />
         Portal
        </button>
       )}
      </div>
     </div>

     <div className="flex gap-1 mt-6 border-b border-gray-200">
      {tabs
       .filter((t) => t.show)
       .map((tab) => (
        <button
         key={tab.id}
         type="button"
         onClick={() => setTab(tab.id)}
         className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
          activeTab === tab.id
           ? "border-orange-500 text-orange-600"
           : "border-transparent text-gray-500 hover:text-gray-800"
         }`}
        >
         {tab.label}
        </button>
       ))}
     </div>
    </div>

    {activeTab === "overview" && (
     <div className="grid gap-4 @[768px]:grid-cols-3">
      <div className="@[768px]:col-span-2 space-y-4">
       <div className="grid grid-cols-2 @[640px]:grid-cols-4 gap-3">
        <KpiCard label="Balance" value={formatMoney(Math.abs(balance))} highlight={!isStoreCredit} />
        <KpiCard
         label="Total purchases"
         value={formatMoney(customer.totalPurchases ?? 0)}
        />
        <KpiCard label="Loyalty points" value={String(customer.loyaltyPoints ?? 0)} />
        <KpiCard
         label="Sales count"
         value={String(summary.stats.saleCount)}
         sub={
          summary.stats.lastSaleAt
           ? `Last: ${formatDate(summary.stats.lastSaleAt)}`
           : undefined
         }
        />
       </div>

       <div className="bg-white rounded-xl border border-gray-200 p-4 @[640px]:p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Profile</h2>
        <dl className="grid gap-3 text-sm @[640px]:grid-cols-2">
         {customer.companyNumber && (
          <DetailRow icon={Building2} label="Company no." value={customer.companyNumber} />
         )}
         {customer.vatNumber && (
          <DetailRow icon={Building2} label="VAT" value={customer.vatNumber} />
         )}
         {summary.pricingGroup && (
          <DetailRow label="Pricing group" value={summary.pricingGroup.name} />
         )}
         {isInvoicingEnabled && (
          <DetailRow
           label="Customer portal"
           value={customer.portalEnabled ? "Enabled" : "Not enabled"}
          />
         )}
         {addressParts.length > 0 && (
          <DetailRow icon={MapPin} label="Address" value={addressParts.join(", ")} className="@[640px]:col-span-2" />
         )}
        </dl>
       </div>
      </div>

      {can("sale.view") && summary.stats.saleCount > 0 && (
       <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
         <h2 className="font-semibold text-gray-900">Recent activity</h2>
         <button
          type="button"
          onClick={() => setTab("sales")}
          className="text-xs text-orange-600 hover:underline font-medium"
         >
          View all sales
         </button>
        </div>
        {summary.stats.lastSaleReference && (
         <p className="text-sm text-gray-600">
          Last sale: <span className="font-medium">{summary.stats.lastSaleReference}</span>
         </p>
        )}
       </div>
      )}
     </div>
    )}

    {activeTab === "statement" && can("accounts.view") && (
     <CustomerStatementPanel
      customerId={customerId}
      customerName={customer.name}
      onBalanceChange={() => loadSummary()}
     />
    )}

    {activeTab === "sales" && can("sale.view") && (
     <CustomerSalesTab customerId={customerId} />
    )}
   </div>

   <EditCustomerModal
    open={editOpen}
    customer={customer as Customer}
    onClose={() => setEditOpen(false)}
    onSave={handleSaveCustomer}
    isLoading={saving}
   />

   {customer.email && (
    <SetPasswordModal
     open={passwordOpen}
     onClose={() => setPasswordOpen(false)}
     customerId={customerId}
     customerName={customer.name}
     customerEmail={customer.email}
     onSuccess={() => setPasswordOpen(false)}
    />
   )}
  </div>
 );
}

function KpiCard({
 label,
 value,
 sub,
 highlight,
}: {
 label: string;
 value: string;
 sub?: string;
 highlight?: boolean;
}) {
 return (
  <div className="bg-white rounded-xl border border-gray-200 p-3 @[640px]:p-4">
   <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
   <p className={`text-lg font-bold mt-1 ${highlight ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
   {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
 );
}

function DetailRow({
 icon: Icon,
 label,
 value,
 className = "",
}: {
 icon?: React.ComponentType<{ className?: string }>;
 label: string;
 value: string;
 className?: string;
}) {
 return (
  <div className={className}>
   <dt className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {label}
   </dt>
   <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
  </div>
 );
}

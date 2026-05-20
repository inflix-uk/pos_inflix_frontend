"use client";

import { useEntitlements } from "@/hooks/useEntitlements";
import { usePermissions } from "@/hooks/usePermissions";
import { normalizeEntitlements, USAGE_LIMIT_ROWS } from "@/lib/entitlements";
import { Loader2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const BILLING_PERMS = ["settings.manage", "user.manage", "role.manage", "audit.view"] as const;

export default function BillingPage() {
 const router = useRouter();
 const { can, loading: permLoading } = usePermissions();
 const canViewBilling = BILLING_PERMS.some((p) => can(p));
 const { data: rawData, loading, error } = useEntitlements();
 const data = normalizeEntitlements(rawData ?? undefined);

 useEffect(() => {
 if (permLoading) return;
 if (!canViewBilling) {
  router.replace("/403");
  return;
 }
 if (!loading && data?.status === "suspended") {
 router.replace("/suspended");
 }
 }, [loading, data?.status, router, permLoading, canViewBilling]);

 if (permLoading || !canViewBilling) {
 return (
  <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6 flex items-center gap-2 text-gray-500">
   <Loader2 className="h-5 w-5 animate-spin" /> Loading…
  </div>
 );
 }

 if (loading) {
 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6 flex items-center gap-2 text-gray-500">
 <Loader2 className="h-5 w-5 animate-spin" /> Loading plan and usage...
 </div>
 );
 }

 if (error) {
 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 <div className="max-w-2xl mx-auto p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800">
  {error}
  <Link href="/settings" className="block mt-2 text-orange-600 hover:underline">← Back to Settings</Link>
 </div>
 </div>
 );
 }

 const subscriptionType = data?.subscriptionType ?? "plan";
 const planKey = data?.planKey ?? "—";
 const accountStatus = data?.status ?? "active";
 const features = data?.enabledFeatures ?? {};
 const limits = data?.limits ?? {};
 const usage = data?.usage ?? {};
 const billingAmount = data?.billingAmount;
 const billingCycle = data?.billingCycle ?? "monthly";
 const currency = data?.currency ?? "GBP";
 const billingEmail = data?.billingEmail ?? "";
 const billingAddress = data?.billingAddress ?? "";
 const startDate = data?.startDate;
 const expireDate = data?.expireDate;
 const expiresInText =
 expireDate
 ? (() => {
  const exp = new Date(expireDate);
  const now = new Date();
  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
 })()
 : null;

 const formatDate = (d: string | null | undefined) =>
 d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[480px]:p-4 @[768px]:p-6">
 <div className="max-w-2xl mx-auto">
 <div className="flex items-center gap-2 text-xs @[768px]:text-sm text-gray-500 mb-4 @[768px]:mb-6">
  <Link href="/settings" className="hover:text-orange-600">Settings</Link>
  <span>/</span>
  <span className="text-gray-700">Billing & plan</span>
 </div>
 <h1 className="text-xl @[768px]:text-2xl font-semibold text-gray-900 mb-4 @[768px]:mb-6 flex items-center gap-2">
  <CreditCard className="h-5 w-5 @[768px]:h-6 @[768px]:w-6" />
  Billing & plan
 </h1>
 <p className="text-xs @[768px]:text-sm text-gray-500 mb-4 @[768px]:mb-6">
  Your current plan and usage. Contact your platform administrator to change plan or limits.
 </p>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
  <div className="px-6 py-4">
  <h2 className="font-medium text-gray-900">Subscription type</h2>
  <div className="flex items-center gap-3 mt-1">
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${subscriptionType === "custom" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
  {subscriptionType === "custom" ? "Custom Billing" : "Plan"}
  </span>
  {subscriptionType === "plan" && planKey && planKey !== "—" && (
  <p className="text-2xl font-semibold text-orange-600 capitalize">{planKey}</p>
  )}
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${accountStatus === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
  {accountStatus === "active" ? "Active" : "Suspended"}
  </span>
  </div>
  </div>
  <div className="px-6 py-4">
  <h2 className="font-medium text-gray-900 mb-2">Billing details</h2>
  <p className="text-sm text-gray-500 mb-3">Amount and period as set by your platform administrator.</p>
  <dl className="grid gap-2 @[640px]:grid-cols-2 text-sm">
  <div>
  <dt className="text-gray-500">Amount</dt>
  <dd className="font-medium text-gray-900">
   {billingAmount != null ? `${currency} ${billingAmount} / ${billingCycle}` : "—"}
  </dd>
  </div>
  <div>
  <dt className="text-gray-500">Start date</dt>
  <dd className="font-medium text-gray-900">{formatDate(startDate ?? undefined)}</dd>
  </div>
  <div>
  <dt className="text-gray-500">Expire date</dt>
  <dd className="font-medium text-gray-900">{formatDate(expireDate ?? undefined)}</dd>
  </div>
  {expiresInText && (
  <div>
   <dt className="text-gray-500">Expires in</dt>
   <dd className="font-medium text-gray-900">{expiresInText}</dd>
  </div>
  )}
  {billingEmail && (
  <div className="@[640px]:col-span-2">
   <dt className="text-gray-500">Billing contact</dt>
   <dd className="font-medium text-gray-900">
   <a href={`mailto:${billingEmail}`} className="text-orange-600 hover:underline">{billingEmail}</a>
   </dd>
  </div>
  )}
  {billingAddress && (
  <div className="@[640px]:col-span-2">
   <dt className="text-gray-500">Billing address</dt>
   <dd className="font-medium text-gray-900 text-gray-700">{billingAddress}</dd>
  </div>
  )}
  </dl>
  </div>
  <div className="px-6 py-4">
  <h2 className="font-medium text-gray-900 mb-3">Enabled features</h2>
  <ul className="flex flex-wrap gap-2">
  {Object.entries(features)
  .filter(([, on]) => on)
  .map(([key]) => (
   <li key={key} className="px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm">
   {key.replace(/_/g, " ")}
   </li>
  ))}
  {Object.values(features).filter(Boolean).length === 0 && (
  <li className="text-gray-500 text-sm">None</li>
  )}
  </ul>
  </div>
  <div className="px-6 py-4">
  <h2 className="font-medium text-gray-900 mb-3">Usage vs limits</h2>
  <p className="text-sm text-gray-500 mb-3">Current usage counts for your tenant vs plan limits.</p>
  <table className="w-full text-sm">
  <thead>
  <tr className="text-left text-gray-500 border-b border-gray-100">
   <th className="pb-2">Metric</th>
   <th className="pb-2">Used</th>
   <th className="pb-2">Limit</th>
  </tr>
  </thead>
  <tbody>
  {USAGE_LIMIT_ROWS.map(({ limitKey, usageKey, label }) => {
   const used = Number(usage[usageKey]) ?? 0;
   const limit = limits[limitKey];
   const atLimit = limit != null && used >= limit;
   return (
   <tr key={limitKey} className="border-b border-gray-50">
   <td className="py-2 font-medium text-gray-900">{label}</td>
   <td className="py-2">{used}</td>
   <td className={`py-2 ${atLimit ? "text-neutral-600 font-medium" : ""}`}>
   {limit != null ? limit : "Unlimited"}
   </td>
   </tr>
   );
  })}
  </tbody>
  </table>
  </div>
 </div>
 </div>
 </div>
 );
}

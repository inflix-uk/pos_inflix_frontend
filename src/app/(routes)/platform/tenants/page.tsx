"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronRight, Plus, Trash2 } from "lucide-react";
import { platformApi, type TenantListItem } from "../service/platformApi";

export default function TenantsPage() {
 const [tenants, setTenants] = useState<TenantListItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [addOpen, setAddOpen] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState<TenantListItem | null>(null);
 const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

 function load() {
 setLoading(true);
 platformApi
 .getTenants()
 .then(setTenants)
 .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
 .finally(() => setLoading(false));
 }

 useEffect(() => {
 load();
 }, []);

 if (loading && tenants.length === 0) {
 return (
 <div className="flex items-center gap-2 text-gray-500">
 <Loader2 className="h-5 w-5 animate-spin" /> Loading tenants...
 </div>
 );
 }

 if (error && tenants.length === 0) {
 return (
 <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
 {error}
 <Link href="/platform" className="block mt-2 text-orange-600 hover:underline">← Back to Platform</Link>
 </div>
 );
 }

 return (
 <div className="@container">
 {toast && (
 <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
  {toast.message}
  <button className="ml-2" onClick={() => setToast(null)}>×</button>
 </div>
 )}
 <Link href="/platform" className="inline-flex items-center gap-1 text-xs @[640px]:text-sm text-gray-600 hover:text-orange-600 mb-4 @[640px]:mb-6">
 <ArrowLeft className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" /> Back
 </Link>
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 py-2.5 @[640px]:py-3 border-b border-gray-100 flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-2 @[640px]:gap-3">
  <div>
  <h2 className="text-sm @[640px]:text-base font-semibold text-gray-900">Tenants</h2>
  <p className="text-xs @[640px]:text-sm text-gray-500">Add tenants, set details and billing, then manage plan and accounts.</p>
  </div>
  <button
  onClick={() => setAddOpen(true)}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 text-xs @[640px]:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  <Plus className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" /> Add tenant
  </button>
 </div>
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-600">Name</th>
  <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-600">Contact</th>
  <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-600">Billing</th>
  <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-600">Plan</th>
  <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-600">Start date</th>
  <th className="text-right py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-600"></th>
  </tr>
  </thead>
  <tbody>
  {tenants.map((t) => (
  <tr key={t.tenantId} className="border-b border-gray-100 hover:bg-gray-50">
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4">
   <div className="text-xs @[640px]:text-sm font-medium text-gray-900">{t.name || t.tenantId}</div>
   <div className="text-[10px] @[640px]:text-xs text-gray-500 font-mono">{t.tenantId}</div>
   </td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm text-gray-600">
   {t.email || "—"}
   {t.phone && <span className="block text-[10px] @[640px]:text-xs">{t.phone}</span>}
   </td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm text-gray-600">
   {t.billingAmount != null
   ? `${t.currency || "GBP"} ${t.billingAmount} / ${t.billingCycle || "monthly"}`
   : "—"}
   </td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm text-gray-600">{t.planKey ?? "No plan"}</td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm text-gray-600">
   {t.startDate ? new Date(t.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
   </td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-right">
   <div className="flex items-center justify-end gap-1.5 @[640px]:gap-2">
   <Link
   href={`/platform/tenants/${encodeURIComponent(t.tenantId)}`}
   className="text-xs @[640px]:text-sm text-orange-600 hover:underline inline-flex items-center gap-1"
   >
   Manage <ChevronRight className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
   </Link>
   <button
   type="button"
   onClick={() => setDeleteConfirm(t)}
   className="p-1 @[640px]:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
   title="Delete tenant"
   aria-label="Delete tenant"
   >
   <Trash2 className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
   </button>
   </div>
   </td>
  </tr>
  ))}
  </tbody>
  </table>
 </div>
 {tenants.length === 0 && (
  <div className="px-3 @[640px]:px-4 py-6 @[640px]:py-8 text-center text-xs @[640px]:text-sm text-gray-500">No tenants yet. Click &quot;Add tenant&quot; to create one.</div>
 )}
 </div>

 {addOpen && (
 <AddTenantModal
  onClose={() => setAddOpen(false)}
  onCreated={() => {
  load();
  setAddOpen(false);
  }}
 />
 )}

 {deleteConfirm && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold text-gray-800">Delete tenant</h2>
  <p className="text-sm text-gray-500 mt-1">
  Remove <strong>{deleteConfirm.name || deleteConfirm.tenantId}</strong>? This removes the tenant and its subscription. Users and data for this tenant remain in the database but will no longer have an active subscription.
  </p>
  <div className="mt-6 flex justify-end gap-2">
  <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button
  onClick={async () => {
   try {
   await platformApi.deleteTenant(deleteConfirm.tenantId);
   setToast({ message: "Tenant deleted" });
   load();
   setDeleteConfirm(null);
   } catch (e) {
   setToast({ message: e instanceof Error ? e.message : "Failed to delete tenant", error: true });
   }
  }}
  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
  >
  Delete
  </button>
  </div>
  </div>
 </div>
 )}
 </div>
 );
}

function AddTenantModal({
 onClose,
 onCreated,
}: {
 onClose: () => void;
 onCreated: () => void;
}) {
 const [name, setName] = useState("");
 const [companyName, setCompanyName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [billingAddress, setBillingAddress] = useState("");
 const [billingEmail, setBillingEmail] = useState("");
 const [billingAmount, setBillingAmount] = useState("");
 const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
 const [currency, setCurrency] = useState("GBP");
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");

 async function submit() {
 const displayName = (name || companyName || "").trim() || "New Tenant";
 setError("");
 setSaving(true);
 try {
 await platformApi.createTenant({
 name: displayName,
 companyName: companyName.trim() || undefined,
 email: email.trim() || undefined,
 phone: phone.trim() || undefined,
 billingAddress: billingAddress.trim() || undefined,
 billingEmail: billingEmail.trim() || undefined,
 billingAmount: billingAmount === "" ? undefined : Number(billingAmount),
 billingCycle,
 currency: currency.trim() || "GBP",
 });
 onCreated();
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to create tenant");
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
 <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
 <h2 className="text-lg font-semibold text-gray-800">Add tenant</h2>
 <p className="text-sm text-gray-500 mt-1">Name, contact, and billing information.</p>
 {error && (
  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
 )}
 <div className="mt-4 space-y-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
  <label className="block text-xs text-gray-500">Name</label>
  <input
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Acme Ltd"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Company name</label>
  <input
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Acme Ltd"
  />
  </div>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="billing@acme.com"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Phone</label>
  <input
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="+44 …"
  />
  </div>
  </div>
  <div>
  <label className="block text-xs text-gray-500">Billing address</label>
  <input
  value={billingAddress}
  onChange={(e) => setBillingAddress(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Street, city, postcode"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Billing email</label>
  <input
  type="email"
  value={billingEmail}
  onChange={(e) => setBillingEmail(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="invoices@acme.com"
  />
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div>
  <label className="block text-xs text-gray-500">Amount</label>
  <input
  type="number"
  min={0}
  step={0.01}
  value={billingAmount}
  onChange={(e) => setBillingAmount(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="0"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Currency</label>
  <select
  value={currency}
  onChange={(e) => setCurrency(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  >
  <option value="GBP">GBP</option>
  <option value="USD">USD</option>
  <option value="EUR">EUR</option>
  </select>
  </div>
  <div>
  <label className="block text-xs text-gray-500">Billing cycle</label>
  <select
  value={billingCycle}
  onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  >
  <option value="monthly">Monthly</option>
  <option value="yearly">Yearly</option>
  </select>
  </div>
  </div>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  onClick={submit}
  disabled={saving}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {saving ? "Creating…" : "Create tenant"}
  </button>
 </div>
 </div>
 </div>
 );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DropdownMenu } from "@/components/DropdownMenu";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Plus, MoreHorizontal, Pencil, Trash2, Key } from "lucide-react";
import {
 platformApi,
 type TenantSubscriptionDetail,
 type TenantDetail,
 type TenantUser,
 type FeatureCatalogItem,
 type LimitCatalogItem,
} from "../../service/platformApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

export default function TenantDetailPage() {
 const params = useParams();
 const router = useRouter();
 const tenantId = params?.tenantId as string;
 const [tenant, setTenant] = useState<TenantDetail | null>(null);
 const [detail, setDetail] = useState<TenantSubscriptionDetail | null>(null);
 const [features, setFeatures] = useState<FeatureCatalogItem[]>([]);
 const [limits, setLimits] = useState<LimitCatalogItem[]>([]);
 const [users, setUsers] = useState<TenantUser[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
 const [planKey, setPlanKey] = useState("");
 const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
 const [subscriptionExpireDate, setSubscriptionExpireDate] = useState("");
 const [overrides, setOverrides] = useState<{ features: Record<string, boolean>; limits: Record<string, number | null> }>({ features: {}, limits: {} });
 const [userMenuOpenId, setUserMenuOpenId] = useState<string | null>(null);
 const [createUserOpen, setCreateUserOpen] = useState(false);
 const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
 const [deleteUserConfirm, setDeleteUserConfirm] = useState<TenantUser | null>(null);
 const [deleteTenantConfirm, setDeleteTenantConfirm] = useState(false);
 const rowMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

 // Tenant details form state
 const [name, setName] = useState("");
 const [companyName, setCompanyName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [billingAddress, setBillingAddress] = useState("");
 const [billingEmail, setBillingEmail] = useState("");
 const [billingAmount, setBillingAmount] = useState<string>("");
 const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
 const [currency, setCurrency] = useState("GBP");
 const [status, setStatus] = useState("active");

 function loadUsers() {
 if (!tenantId) return;
 platformApi.listTenantUsers(tenantId).then(setUsers).catch(() => setUsers([]));
 }

 useEffect(() => {
 if (!tenantId) return;
 setLoading(true);
 Promise.all([
 platformApi.getTenant(tenantId).catch(() => null),
 platformApi.getTenantSubscription(tenantId),
 platformApi.getFeatureCatalog(false),
 platformApi.getLimitCatalog(false),
 platformApi.listTenantUsers(tenantId).catch(() => []),
 ])
 .then(([t, sub, feats, lims, userList]) => {
 if (t) {
  setTenant(t);
  setName(t.name || "");
  setCompanyName(t.companyName || "");
  setEmail(t.email || "");
  setPhone(t.phone || "");
  setBillingAddress(t.billingAddress || "");
  setBillingEmail(t.billingEmail || "");
  setBillingAmount(t.billingAmount != null ? String(t.billingAmount) : "");
  setBillingCycle(t.billingCycle || "monthly");
  setCurrency(t.currency || "GBP");
  setStatus(t.status || "active");
 }
 setDetail(sub);
 setFeatures(feats);
 setLimits(lims);
 setUsers(Array.isArray(userList) ? userList : []);
 setPlanKey(sub.planKey || "starter");
 setSubscriptionStartDate(sub.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : "");
 setSubscriptionExpireDate(sub.expireDate ? new Date(sub.expireDate).toISOString().slice(0, 10) : "");
 setOverrides({
  features: sub.overrides?.features || {},
  limits: sub.overrides?.limits || {},
 });
 })
 .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
 .finally(() => setLoading(false));
 }, [tenantId]);

 const handleSaveSubscription = async () => {
 if (!tenantId) return;
 setSaving(true);
 try {
 const updated = await platformApi.updateTenantSubscription(tenantId, {
 planKey,
 overrides,
 startDate: subscriptionStartDate || null,
 expireDate: subscriptionExpireDate || null,
 });
 setDetail(updated);
 setOverrides({ features: updated.overrides.features, limits: updated.overrides.limits });
 setSubscriptionStartDate(updated.startDate ? new Date(updated.startDate).toISOString().slice(0, 10) : "");
 setSubscriptionExpireDate(updated.expireDate ? new Date(updated.expireDate).toISOString().slice(0, 10) : "");
 setToast({ message: "Subscription saved" });
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true });
 } finally {
 setSaving(false);
 }
 };

 const handleSaveTenantDetails = async () => {
 if (!tenantId) return;
 setSaving(true);
 try {
 await platformApi.updateTenant(tenantId, {
 name: name.trim(),
 companyName: companyName.trim(),
 email: email.trim(),
 phone: phone.trim(),
 billingAddress: billingAddress.trim(),
 billingEmail: billingEmail.trim(),
 billingAmount: billingAmount === "" ? null : Number(billingAmount),
 billingCycle,
 currency: currency.trim() || "GBP",
 status,
 });
 setToast({ message: "Tenant details saved" });
 const t = await platformApi.getTenant(tenantId);
 setTenant(t);
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true });
 } finally {
 setSaving(false);
 }
 };

 const setFeatureOverride = (key: string, value: boolean | undefined) => {
 setOverrides((prev) => {
 const next = { ...prev, features: { ...prev.features } };
 if (value === undefined) delete next.features[key];
 else next.features[key] = value;
 return next;
 });
 };

 const setLimitOverride = (key: string, value: number | null) => {
 setOverrides((prev) => ({
 ...prev,
 limits: { ...prev.limits, [key]: value },
 }));
 };

 if (loading || !tenantId) {
 return (
 <div className="flex items-center gap-2 text-gray-500">
 <Loader2 className="h-5 w-5 animate-spin" /> Loading...
 </div>
 );
 }

 if (error && !detail) {
 return (
 <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
 {error}
 <Link href="/platform/tenants" className="block mt-2 text-orange-600 hover:underline">← Back to Tenants</Link>
 </div>
 );
 }

 const effectiveFeatures = detail?.effective?.enabledFeatures || {};
 const effectiveLimits = detail?.effective?.limits || {};
 const usage = detail?.usage || {};

 return (
 <div>
 {toast && (
 <div
  className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
  toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
  }`}
 >
  {toast.message}
  <button className="ml-2" onClick={() => setToast(null)}>×</button>
 </div>
 )}
 <Link href="/platform/tenants" className="inline-flex items-center gap-1 text-gray-600 hover:text-orange-600 mb-6">
 <ArrowLeft className="h-4 w-4" /> Back to Tenants
 </Link>
 <div className="space-y-6">
 {/* Tenant details */}
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
  <div>
  <h2 className="font-semibold text-gray-900">Tenant details</h2>
  <p className="text-sm text-gray-500 mt-1">Name, contact, and billing. Used when client forgets account.</p>
  </div>
  <div className="flex items-center gap-3">
  <span className="text-sm text-gray-600">
  Account: <strong className={status === "active" ? "text-green-700" : "text-neutral-700"}>{status === "active" ? "Active" : "Suspended"}</strong>
  </span>
  <button
  type="button"
  onClick={async () => {
   const newStatus = status === "active" ? "suspended" : "active";
   setSaving(true);
   try {
   await platformApi.updateTenant(tenantId, { status: newStatus });
   setStatus(newStatus);
   setToast({ message: newStatus === "suspended" ? "Tenant account disabled" : "Tenant account enabled" });
   const t = await platformApi.getTenant(tenantId);
   setTenant(t);
   } catch (e) {
   setToast({ message: e instanceof Error ? e.message : "Failed to update", error: true });
   } finally {
   setSaving(false);
   }
  }}
  disabled={saving}
  className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
   status === "active"
   ? "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300"
   : "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
  }`}
  >
  {status === "active" ? "Disable account" : "Enable account"}
  </button>
  </div>
  </div>
  <div className="grid gap-4 sm:grid-cols-2">
  <div>
  <label className="block text-xs text-gray-500">Name</label>
  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Company name</label>
  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Phone</label>
  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div className="sm:col-span-2">
  <label className="block text-xs text-gray-500">Billing address</label>
  <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Billing email</label>
  <input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Billing amount</label>
  <input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Billing cycle</label>
  <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
  <option value="monthly">Monthly</option>
  <option value="yearly">Yearly</option>
  </select>
  </div>
  <div>
  <label className="block text-xs text-gray-500">Currency</label>
  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
  <option value="GBP">GBP</option>
  <option value="USD">USD</option>
  <option value="EUR">EUR</option>
  </select>
  </div>
  <div>
  <label className="block text-xs text-gray-500">Status</label>
  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
  <option value="active">Active</option>
  <option value="suspended">Suspended</option>
  </select>
  </div>
  </div>
  <div className="mt-4">
  <button onClick={handleSaveTenantDetails} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
  Save tenant details
  </button>
  </div>
 </div>

 {/* Tenant account management */}
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 className="font-semibold text-gray-900 mb-2">Tenant account management</h2>
  <p className="text-sm text-gray-500 mb-4">Create admin, edit password, or delete accounts when client forgets. Only for admins.</p>
  <div className="flex justify-end mb-3">
  <button onClick={() => setCreateUserOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
  <Plus className="h-4 w-4" /> Create admin account
  </button>
  </div>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Name</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Email</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Roles</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Status</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Last login</th>
   <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Actions</th>
  </tr>
  </thead>
  <tbody>
  {users.map((u) => (
   <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
   <td className="py-2 px-3 font-medium text-gray-800">{u.name}</td>
   <td className="py-2 px-3 text-sm text-gray-600">{u.email}</td>
   <td className="py-2 px-3">
   {(u.roles && u.roles.length) ? (u.roles as { name: string }[]).map((r) => r.name).join(", ") : "—"}
   </td>
   <td className="py-2 px-3">
   {u.isActive ? <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Active</span> : <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">Disabled</span>}
   </td>
   <td className="py-2 px-3 text-sm text-gray-500">{u.lastLogin ? formatDateTimeLondon(u.lastLogin) : "—"}</td>
   <td className="py-2 px-3 text-right">
   <button
   type="button"
   onClick={(e) => {
    rowMenuTriggerRef.current = e.currentTarget;
    setUserMenuOpenId(userMenuOpenId === u._id ? null : u._id);
   }}
   className="p-1.5 rounded hover:bg-gray-200"
   aria-label="Open actions menu"
   >
   <MoreHorizontal className="h-4 w-4 text-gray-600" />
   </button>
   <DropdownMenu
   open={userMenuOpenId === u._id}
   onClose={() => setUserMenuOpenId(null)}
   triggerRef={rowMenuTriggerRef}
   align="right"
   className="w-44"
   >
   <button type="button" onClick={() => { setEditingUser(u); setUserMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
    <Pencil className="h-3.5 w-3.5" /> Edit
   </button>
   <button type="button" onClick={() => { setUserMenuOpenId(null); const pwd = window.prompt("New password (min 8 chars, upper, lower, number, special):"); if (pwd) platformApi.resetTenantUserPassword(tenantId, u._id, pwd).then(() => { setToast({ message: "Password reset" }); loadUsers(); }).catch((e) => setToast({ message: e instanceof Error ? e.message : "Failed", error: true })); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
    <Key className="h-3.5 w-3.5" /> Reset password
   </button>
   <button type="button" onClick={() => { setDeleteUserConfirm(u); setUserMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
    <Trash2 className="h-3.5 w-3.5" /> Delete
   </button>
   </DropdownMenu>
   </td>
   </tr>
  ))}
  </tbody>
  </table>
  </div>
  {users.length === 0 && <p className="py-4 text-center text-gray-500 text-sm">No users. Create an admin account for this tenant.</p>}
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 className="font-semibold text-gray-900 mb-4">Subscription</h2>
  <p className="text-sm text-gray-500 mb-4">Plan, billing period and dates. Shown on tenant billing page (/settings/billing).</p>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
  <select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
  <option value="starter">Starter</option>
  <option value="pro">Pro</option>
  <option value="enterprise">Enterprise</option>
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
  <input
  type="date"
  value={subscriptionStartDate}
  onChange={(e) => setSubscriptionStartDate(e.target.value)}
  className="w-full border border-gray-300 rounded-lg px-3 py-2"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Expire date</label>
  <input
  type="date"
  value={subscriptionExpireDate}
  onChange={(e) => setSubscriptionExpireDate(e.target.value)}
  className="w-full border border-gray-300 rounded-lg px-3 py-2"
  />
  </div>
  {(detail?.expireDate || subscriptionExpireDate) && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Expires in</label>
  <p className="text-sm text-gray-700 pt-2">
   {(() => {
   const expStr = subscriptionExpireDate || (detail?.expireDate ?? "");
   const exp = new Date(expStr);
   if (Number.isNaN(exp.getTime())) return "—";
   const now = new Date();
   const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
   if (days < 0) return <span className="text-neutral-700">Expired {Math.abs(days)} days ago</span>;
   if (days === 0) return <span className="text-neutral-700">Expires today</span>;
   return <span>{days} day{days !== 1 ? "s" : ""}</span>;
   })()}
  </p>
  </div>
  )}
  </div>
  <div className="mt-4">
  <button onClick={handleSaveSubscription} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
  Save subscription
  </button>
  </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 className="font-semibold text-gray-900 mb-4">Feature overrides</h2>
  <p className="text-sm text-gray-500 mb-4">Override plan defaults per tenant. Effective: plan + overrides.</p>
  {features.length === 0 ? (
  <p className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
  No features in catalog. Run the entitlements seed on the backend: <code className="bg-neutral-100 px-1 rounded">npm run seed:entitlements</code>
  </p>
  ) : (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((f) => (
  <div key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <div>
   <span className="font-medium text-gray-900">{f.name}</span>
   <span className="ml-2 text-xs text-gray-500">({f.key})</span>
   <p className="text-xs text-gray-500 mt-0.5">Effective: {effectiveFeatures[f.key] ? "On" : "Off"}</p>
  </div>
  <select
   value={overrides.features[f.key] === undefined ? "" : overrides.features[f.key] ? "true" : "false"}
   onChange={(e) => {
   const v = e.target.value;
   setFeatureOverride(f.key, v === "" ? undefined : v === "true");
   }}
   className="border border-gray-300 rounded px-2 py-1 text-sm"
  >
   <option value="">Plan default</option>
   <option value="true">On</option>
   <option value="false">Off</option>
  </select>
  </div>
  ))}
  </div>
  )}
 </div>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 className="font-semibold text-gray-900 mb-4">Limit overrides</h2>
  <p className="text-sm text-gray-500 mb-4">Override plan limits. Blank = use plan default. Effective column shows current value.</p>
  {limits.length === 0 ? (
  <p className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
  No limits in catalog. Run the entitlements seed on the backend: <code className="bg-neutral-100 px-1 rounded">npm run seed:entitlements</code>
  </p>
  ) : (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {limits.map((l) => (
  <div key={l.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <div>
   <span className="font-medium text-gray-900">{l.name}</span>
   <span className="ml-2 text-xs text-gray-500">({l.key})</span>
   <p className="text-xs text-gray-500 mt-0.5">
   Effective: {effectiveLimits[l.key] ?? "—"} · Usage: {usage[l.key] ?? 0}
   </p>
  </div>
  <input
   type="number"
   min={0}
   placeholder="Plan default"
   value={overrides.limits[l.key] ?? ""}
   onChange={(e) => setLimitOverride(l.key, e.target.value === "" ? null : parseInt(e.target.value, 10))}
   className="border border-gray-300 rounded px-2 py-1 w-24 text-sm"
  />
  </div>
  ))}
  </div>
  )}
 </div>

 <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
  <h2 className="font-semibold text-red-800 mb-2">Danger zone</h2>
  <p className="text-sm text-gray-500 mb-4">Permanently remove this tenant and its subscription. Users and data for this tenant remain in the database but will no longer have an active subscription.</p>
  <button
  type="button"
  onClick={() => setDeleteTenantConfirm(true)}
  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
  >
  Delete tenant
  </button>
 </div>
 </div>

 {deleteTenantConfirm && tenantId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold text-gray-800">Delete tenant</h2>
  <p className="text-sm text-gray-500 mt-1">
  Remove <strong>{name || tenantId}</strong>? This removes the tenant and its subscription. This cannot be undone.
  </p>
  <div className="mt-6 flex justify-end gap-2">
  <button onClick={() => setDeleteTenantConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button
  onClick={async () => {
   try {
   await platformApi.deleteTenant(tenantId);
   setToast({ message: "Tenant deleted" });
   router.push("/platform/tenants");
   } catch (e) {
   setToast({ message: e instanceof Error ? e.message : "Failed to delete tenant", error: true });
   setDeleteTenantConfirm(false);
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

 {createUserOpen && tenantId && (
 <CreateTenantUserModal
  tenantId={tenantId}
  onClose={() => setCreateUserOpen(false)}
  onCreated={() => {
  loadUsers();
  setCreateUserOpen(false);
  setToast({ message: "Admin account created" });
  }}
  setToast={setToast}
 />
 )}
 {editingUser && tenantId && (
 <EditTenantUserModal
  tenantId={tenantId}
  user={editingUser}
  onClose={() => setEditingUser(null)}
  onSaved={() => {
  loadUsers();
  setEditingUser(null);
  setToast({ message: "User updated" });
  }}
  setToast={setToast}
 />
 )}
 {deleteUserConfirm && tenantId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold text-gray-800">Delete user</h2>
  <p className="text-sm text-gray-500 mt-1">
  Remove <strong>{deleteUserConfirm.email}</strong>? They will no longer be able to sign in.
  </p>
  <div className="mt-6 flex justify-end gap-2">
  <button onClick={() => setDeleteUserConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button
  onClick={async () => {
   try {
   await platformApi.deleteTenantUser(tenantId, deleteUserConfirm._id);
   setToast({ message: "User deleted" });
   loadUsers();
   } catch (e) {
   setToast({ message: e instanceof Error ? e.message : "Failed to delete", error: true });
   }
   setDeleteUserConfirm(null);
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

function CreateTenantUserModal({
 tenantId,
 onClose,
 onCreated,
 setToast,
}: {
 tenantId: string;
 onClose: () => void;
 onCreated: () => void;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [assignAllRoles, setAssignAllRoles] = useState(true);
 const [saving, setSaving] = useState(false);

 async function submit() {
 const trimmedEmail = email.trim().toLowerCase();
 if (!trimmedEmail) {
 setToast({ message: "Email is required", error: true });
 return;
 }
 if (password.length < 8) {
 setToast({ message: "Password must be at least 8 characters (upper, lower, number, special)", error: true });
 return;
 }
 setSaving(true);
 try {
 await platformApi.createTenantUser(tenantId, {
 name: name.trim() || trimmedEmail.split("@")[0],
 email: trimmedEmail,
 password,
 assignAllRoles,
 isActive: true,
 });
 onCreated();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to create user", error: true });
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
 <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">Create admin account</h2>
 <p className="text-sm text-gray-500 mt-1">Create a user for this tenant with all roles (admin). Use when client forgets.</p>
 <div className="mt-4 space-y-4">
  <div>
  <label className="block text-xs text-gray-500">Name</label>
  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Admin" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="admin@tenant.com" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Password (min 8 chars, upper, lower, number, special)</label>
  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" />
  </div>
  <label className="flex items-center gap-2">
  <input type="checkbox" checked={assignAllRoles} onChange={(e) => setAssignAllRoles(e.target.checked)} />
  <span className="text-sm">Assign all roles (admin)</span>
  </label>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button onClick={submit} disabled={saving || !email.trim() || password.length < 8} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? "Creating…" : "Create"}
  </button>
 </div>
 </div>
 </div>
 );
}

function EditTenantUserModal({
 tenantId,
 user,
 onClose,
 onSaved,
 setToast,
}: {
 tenantId: string;
 user: TenantUser;
 onClose: () => void;
 onSaved: () => void;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [name, setName] = useState(user.name);
 const [email, setEmail] = useState(user.email);
 const [isActive, setIsActive] = useState(user.isActive);
 const [newPassword, setNewPassword] = useState("");
 const [saving, setSaving] = useState(false);

 async function submit() {
 const trimmedEmail = email.trim().toLowerCase();
 if (!trimmedEmail) {
 setToast({ message: "Email is required", error: true });
 return;
 }
 setSaving(true);
 try {
 await platformApi.updateTenantUser(tenantId, user._id, {
 name: name.trim(),
 email: trimmedEmail,
 isActive,
 });
 if (newPassword.length >= 8) {
 await platformApi.resetTenantUserPassword(tenantId, user._id, newPassword);
 }
 onSaved();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to update", error: true });
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
 <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">Edit user</h2>
 <p className="text-sm text-gray-500 mt-1">Update name, email, status, or set a new password.</p>
 <div className="mt-4 space-y-4">
  <div>
  <label className="block text-xs text-gray-500">Name</label>
  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <label className="flex items-center gap-2">
  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
  <span className="text-sm">Active (can sign in)</span>
  </label>
  <div>
  <label className="block text-xs text-gray-500">New password (leave blank to keep)</label>
  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Min 8 characters" />
  </div>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button onClick={submit} disabled={saving || !email.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? "Saving…" : "Save"}
  </button>
 </div>
 </div>
 </div>
 );
}

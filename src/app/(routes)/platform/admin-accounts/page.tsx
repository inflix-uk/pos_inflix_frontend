"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DropdownMenu } from "@/components/DropdownMenu";
import { ArrowLeft, Loader2, Plus, MoreHorizontal, Pencil, Trash2, RefreshCw } from "lucide-react";
import {
 platformApi,
 type PlatformAdminAccount,
} from "../service/platformApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

export default function PlatformAdminAccountsPage() {
 const [accounts, setAccounts] = useState<PlatformAdminAccount[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
 const [createOpen, setCreateOpen] = useState(false);
 const [editing, setEditing] = useState<PlatformAdminAccount | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<PlatformAdminAccount | null>(null);
 const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
 const rowMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

 function load() {
 setLoading(true);
 platformApi
 .listAdminAccounts()
 .then(setAccounts)
 .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
 .finally(() => setLoading(false));
 }

 useEffect(() => {
 load();
 }, []);

 if (loading && accounts.length === 0) {
 return (
 <div className="flex items-center gap-2 text-gray-500">
 <Loader2 className="h-5 w-5 animate-spin" /> Loading admin accounts...
 </div>
 );
 }

 if (error && accounts.length === 0) {
 return (
 <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
 {error}
 <Link href="/platform" className="block mt-2 text-orange-600 hover:underline">
  ← Back to Platform
 </Link>
 </div>
 );
 }

 return (
 <div>
 {toast && (
 <div
  className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
  toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
  }`}
 >
  {toast.message}
  <button className="ml-2" onClick={() => setToast(null)}>
  ×
  </button>
 </div>
 )}

 <Link
 href="/platform"
 className="inline-flex items-center gap-1 text-gray-600 hover:text-orange-600 mb-6"
 >
 <ArrowLeft className="h-4 w-4" /> Back
 </Link>

 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div>
  <h2 className="font-semibold text-gray-900">Platform Admin Accounts</h2>
  <p className="text-sm text-gray-500">
  Create and manage accounts that can sign in to the Platform Owner Console (with all roles).
  </p>
  </div>
  <div className="flex gap-2">
  <button
  onClick={() => { setError(null); load(); }}
  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <RefreshCw className="h-4 w-4" /> Refresh
  </button>
  <button
  onClick={() => setCreateOpen(true)}
  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  <Plus className="h-4 w-4" /> Create admin
  </button>
  </div>
 </div>

 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Updated</th>
  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
  </tr>
  </thead>
  <tbody>
  {accounts.map((a) => (
  <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50">
   <td className="py-3 px-4 font-medium text-gray-800">{a.email}</td>
   <td className="py-3 px-4">
   <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
   {a.role}
   </span>
   </td>
   <td className="py-3 px-4">
   {a.isActive ? (
   <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
   Active
   </span>
   ) : (
   <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
   Disabled
   </span>
   )}
   </td>
   <td className="py-3 px-4 text-sm text-gray-600">
   {a.updatedAtUtc ? formatDateTimeLondon(a.updatedAtUtc) : "—"}
   </td>
   <td className="py-3 px-4 text-right">
   <button
   type="button"
   onClick={(e) => {
   rowMenuTriggerRef.current = e.currentTarget;
   setMenuOpenId(menuOpenId === a._id ? null : a._id);
   }}
   className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
   aria-label="Actions"
   >
   <MoreHorizontal className="h-4 w-4" />
   </button>
   <DropdownMenu
   open={menuOpenId === a._id}
   onClose={() => setMenuOpenId(null)}
   triggerRef={rowMenuTriggerRef}
   align="right"
   className="w-40"
   >
   <button
   type="button"
   onClick={() => {
    setEditing(a);
    setMenuOpenId(null);
   }}
   className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
   >
   <Pencil className="h-3.5 w-3.5" /> Edit
   </button>
   <button
   type="button"
   onClick={() => {
    setDeleteConfirm(a);
    setMenuOpenId(null);
   }}
   className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
   >
   <Trash2 className="h-3.5 w-3.5" /> Delete
   </button>
   </DropdownMenu>
   </td>
  </tr>
  ))}
  </tbody>
  </table>
 </div>

 {accounts.length === 0 && (
  <div className="px-4 py-8 text-center">
  <p className="text-gray-500">No platform admin accounts in the list.</p>
  <p className="text-sm text-gray-400 mt-2">
  If you signed in here, your account exists in the database. Click <strong>Refresh</strong> to reload, or create a new account below.
  </p>
  <p className="text-xs text-gray-400 mt-3 max-w-md mx-auto">
  To add an account via CLI (same DB as backend):{" "}
  <code className="bg-gray-100 px-1 rounded">cd pos_inflix_backend && node src/seeders/seedPlatformAdmin.js --email you@example.com --password &quot;YourPassword1!&quot;</code>
  </p>
  </div>
 )}
 </div>

 {createOpen && (
 <CreateAdminModal
  onClose={() => setCreateOpen(false)}
  onSaved={() => {
  load();
  setCreateOpen(false);
  setToast({ message: "Admin account created" });
  }}
  setToast={setToast}
 />
 )}

 {editing && (
 <EditAdminModal
  account={editing}
  onClose={() => setEditing(null)}
  onSaved={() => {
  load();
  setEditing(null);
  setToast({ message: "Admin account updated" });
  }}
  setToast={setToast}
 />
 )}

 {deleteConfirm && (
 <div
  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  role="dialog"
  aria-modal="true"
 >
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold text-gray-800">Delete platform admin</h2>
  <p className="text-sm text-gray-500 mt-1">
  Remove <strong>{deleteConfirm.email}</strong>? They will no longer be able to sign in to the Platform Owner Console. You cannot delete the last active admin.
  </p>
  <div className="mt-6 flex justify-end gap-2">
  <button
  onClick={() => setDeleteConfirm(null)}
  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  onClick={async () => {
   try {
   await platformApi.deleteAdminAccount(deleteConfirm._id);
   setToast({ message: "Admin account deleted" });
   load();
   } catch (e) {
   setToast({
   message: e instanceof Error ? e.message : "Failed to delete",
   error: true,
   });
   }
   setDeleteConfirm(null);
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

function CreateAdminModal({
 onClose,
 onSaved,
 setToast,
}: {
 onClose: () => void;
 onSaved: () => void;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [saving, setSaving] = useState(false);

 async function submit() {
 const trimmed = email.trim().toLowerCase();
 if (!trimmed) {
 setToast({ message: "Email is required", error: true });
 return;
 }
 if (password.length < 8) {
 setToast({ message: "Password must be at least 8 characters (upper, lower, number, special)", error: true });
 return;
 }
 setSaving(true);
 try {
 await platformApi.createAdminAccount({
 email: trimmed,
 password,
 role: "platform_admin",
 });
 onSaved();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to create", error: true });
 } finally {
 setSaving(false);
 }
 }

 return (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
 role="dialog"
 aria-modal="true"
 >
 <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">Create platform admin</h2>
 <p className="text-sm text-gray-500 mt-1">
  New account will have full access to the Platform Owner Console (all roles).
 </p>
 <div className="mt-4 space-y-4">
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="admin@inflix.co.uk"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">
  Password (min 8 chars, upper, lower, number, special)
  </label>
  <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="••••••••"
  />
  </div>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  onClick={submit}
  disabled={saving || !email.trim() || password.length < 8}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {saving ? "Creating…" : "Create"}
  </button>
 </div>
 </div>
 </div>
 );
}

function EditAdminModal({
 account,
 onClose,
 onSaved,
 setToast,
}: {
 account: PlatformAdminAccount;
 onClose: () => void;
 onSaved: () => void;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [email, setEmail] = useState(account.email);
 const [isActive, setIsActive] = useState(account.isActive);
 const [newPassword, setNewPassword] = useState("");
 const [saving, setSaving] = useState(false);

 async function submit() {
 const trimmed = email.trim().toLowerCase();
 if (!trimmed) {
 setToast({ message: "Email is required", error: true });
 return;
 }
 setSaving(true);
 try {
 await platformApi.updateAdminAccount(account._id, {
 email: trimmed,
 isActive,
 ...(newPassword.length >= 8 ? { newPassword } : {}),
 });
 onSaved();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to update", error: true });
 } finally {
 setSaving(false);
 }
 }

 return (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
 role="dialog"
 aria-modal="true"
 >
 <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">Edit platform admin</h2>
 <p className="text-sm text-gray-500 mt-1">Update email, status, or set a new password.</p>
 <div className="mt-4 space-y-4">
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  />
  </div>
  <div className="flex items-center gap-2">
  <input
  type="checkbox"
  id="edit-active"
  checked={isActive}
  onChange={(e) => setIsActive(e.target.checked)}
  />
  <label htmlFor="edit-active">Active (can sign in)</label>
  </div>
  <div>
  <label className="block text-xs text-gray-500">New password (leave blank to keep current)</label>
  <input
  type="password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Min 8 characters"
  />
  </div>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button
  onClick={submit}
  disabled={saving || !email.trim()}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {saving ? "Saving…" : "Save"}
  </button>
 </div>
 </div>
 </div>
 );
}

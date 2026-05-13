"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DropdownMenu } from "@/components/DropdownMenu";
import {
 Search,
 Plus,
 MoreHorizontal,
 Shield,
 Users,
 ClipboardList,
 ChevronRight,
 History,
} from "lucide-react";
import { formatDateTimeLondon } from "@/lib/dateUtils";
import { usePermissions } from "@/hooks/usePermissions";
import { adminApi, type User, type Role, type Permission, type Location } from "./service/adminApi";
import { activityLogApi, type ActivityLogEvent } from "../activity-log/service/activityLogApi";

type Tab = "users" | "roles" | "audit";

const VALID_TABS: ReadonlyArray<Tab> = ["users", "roles", "audit"];

/**
 * Order of permission groups in the Permissions panel — mirrors the left sidebar
 * (NAV_CONFIG) so admins find a permission where they expect to see the feature.
 * Groups not listed here are appended alphabetically at the end so newly added
 * categories never disappear from the UI.
 */
const PERMISSION_GROUP_ORDER: string[] = [
 "Dashboard",
 "Sales",
 "Returns & Refunds",
 "Repairs",
 "Customers",
 "Accounts",
 "Products",
 "Inventory",
 "Stock Transfers",
 "Stock Adjustments",
 "Parcels",
 "Purchases",
 "Expenses",
 "Reports",
 "Settings",
 "Admin",
];

export default function AdminRBACPage() {
 const { can, loading: permissionsLoading } = usePermissions();
 const canUser = can("user.manage");
 const canRole = can("role.manage");
 const canAudit = can("audit.view");
 const hasAnyAdminAccess = canUser || canRole || canAudit;

 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const initialTab = (() => {
 const t = (searchParams.get("tab") || "").toLowerCase();
 return (VALID_TABS as ReadonlyArray<string>).includes(t) ? (t as Tab) : "users";
 })();
 const [tab, setTabState] = useState<Tab>(initialTab);
 const setTab = useCallback(
 (next: Tab) => {
 setTabState(next);
 const params = new URLSearchParams(Array.from(searchParams.entries()));
 if (next === "users") params.delete("tab");
 else params.set("tab", next);
 const qs = params.toString();
 router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
 },
 [searchParams, router, pathname]
 );
 const [users, setUsers] = useState<User[]>([]);
 const [roles, setRoles] = useState<Role[]>([]);
 const [permissions, setPermissions] = useState<Permission[]>([]);
 const [loading, setLoading] = useState(true);
 const [userSearch, setUserSearch] = useState("");
 const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
 const [rolePermKeys, setRolePermKeys] = useState<Set<string>>(new Set());
 const [roleSaving, setRoleSaving] = useState(false);
 const [audit, setAudit] = useState<ActivityLogEvent[]>([]);
 const [auditLoading, setAuditLoading] = useState(false);
 const [auditFilters, setAuditFilters] = useState({ search: "", action: "", entityType: "" });
 const [userDialogOpen, setUserDialogOpen] = useState(false);
 const [editingUser, setEditingUser] = useState<User | null>(null);
 const [roleDialogOpen, setRoleDialogOpen] = useState(false);
 const [roleEditDialogOpen, setRoleEditDialogOpen] = useState(false);
 const [editingRole, setEditingRole] = useState<Role | null>(null);
 const [roleDeleteConfirm, setRoleDeleteConfirm] = useState<Role | null>(null);
 const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

 useEffect(() => {
 if (!hasAnyAdminAccess && !permissionsLoading) return;
 if (!hasAnyAdminAccess) return;
 let cancelled = false;
 (async () => {
 setLoading(true);
 try {
 const usersP: Promise<{ data?: User[] }> = canUser ? adminApi.listUsers({ limit: 500 }) : Promise.resolve({ data: [] });
 const rolesP: Promise<{ data?: Role[] }> = canRole ? adminApi.listRoles() : Promise.resolve({ data: [] });
 const permsP: Promise<{ data?: Permission[] }> = (canRole || canUser) ? adminApi.listPermissions() : Promise.resolve({ data: [] });
 const [uRes, rRes, pRes] = await Promise.all([
  usersP.catch(() => ({ data: [] })),
  rolesP.catch(() => ({ data: [] })),
  permsP.catch(() => ({ data: [] })),
 ]);
 if (!cancelled) {
  if (uRes?.data) setUsers(uRes.data);
  if (rRes?.data) {
  setRoles(rRes.data);
  if (rRes.data.length > 0) setSelectedRoleId(rRes.data[0]._id);
  }
  setPermissions(pRes?.data || []);
 }
 } catch (e) {
 if (!cancelled) setToast({ message: e instanceof Error ? e.message : "Failed to load", error: true });
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();
 return () => { cancelled = true; };
 }, [hasAnyAdminAccess, permissionsLoading, canUser, canRole]);

 useEffect(() => {
 if (permissionsLoading || !hasAnyAdminAccess) return;
 const firstTab: Tab = canUser ? "users" : canRole ? "roles" : "audit";
 const currentTabAllowed =
 (tab === "users" && canUser) || (tab === "roles" && canRole) || (tab === "audit" && canAudit);
 if (!currentTabAllowed) setTab(firstTab);
 }, [permissionsLoading, hasAnyAdminAccess, canUser, canRole, canAudit, tab]);

 useEffect(() => {
 if (!selectedRoleId) return;
 adminApi.getRolePermissions(selectedRoleId).then((res) => {
 setRolePermKeys(new Set(res.data || []));
 }).catch(() => {});
 }, [selectedRoleId]);

 const permissionGroups = useMemo(() => {
 const grouped: Record<string, Permission[]> = {};
 for (const p of permissions) {
 const g = p.group ?? "Other";
 grouped[g] = grouped[g] ?? [];
 grouped[g].push(p);
 }
 Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.key.localeCompare(b.key)));
 const orderedKeys = new Set(PERMISSION_GROUP_ORDER);
 const knownEntries = PERMISSION_GROUP_ORDER
 .filter((g) => grouped[g])
 .map((g) => [g, grouped[g]] as [string, Permission[]]);
 const unknownEntries = Object.entries(grouped)
 .filter(([g]) => !orderedKeys.has(g))
 .sort((a, b) => a[0].localeCompare(b[0]));
 return [...knownEntries, ...unknownEntries];
 }, [permissions]);

 const filteredUsers = useMemo(() => {
 const q = userSearch.trim().toLowerCase();
 if (!q) return users;
 return users.filter((u) => {
 const rolesStr = (u.roles || []).map((r: Role) => r.name).join(" ").toLowerCase();
 return (
 u.name.toLowerCase().includes(q) ||
 u.email.toLowerCase().includes(q) ||
 rolesStr.includes(q)
 );
 });
 }, [users, userSearch]);

 async function refreshUsers() {
 try {
 const res = await adminApi.listUsers({ limit: 500 });
 setUsers(res.data || []);
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to refresh", error: true });
 }
 }

 async function loadAudit() {
 setAuditLoading(true);
 try {
 const res = await activityLogApi.getList({
 search: auditFilters.search || undefined,
 action: auditFilters.action || undefined,
 entityType: auditFilters.entityType || undefined,
 limit: 100,
 });
 setAudit(res.data || []);
 } catch (e) {
 setAudit([]);
 } finally {
 setAuditLoading(false);
 }
 }

 function toggleRolePermission(key: string) {
 setRolePermKeys((prev) => {
 const next = new Set(prev);
 if (next.has(key)) next.delete(key);
 else next.add(key);
 return next;
 });
 }

 async function saveRolePermissions() {
 if (!selectedRoleId) return;
 setRoleSaving(true);
 try {
 await adminApi.saveRolePermissions(selectedRoleId, Array.from(rolePermKeys));
 setToast({ message: "Permissions saved" });
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true });
 } finally {
 setRoleSaving(false);
 }
 }

 if (permissionsLoading) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
  <p className="text-gray-500">Checking access…</p>
 </div>
 </div>
 );
 }

 if (!hasAnyAdminAccess) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
  <h2 className="text-lg font-semibold text-gray-800">Access denied</h2>
  <p className="text-gray-500 mt-1">You don’t have permission to view any admin section.</p>
  <Link href="/settings" className="inline-block mt-4 text-orange-600 hover:underline">
  ← Back to Settings
  </Link>
 </div>
 </div>
 );
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
  <p className="text-gray-500">Loading…</p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-6 space-y-6">
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

 <div className="flex items-center justify-between gap-3">
 <div>
  <h1 className="text-2xl font-semibold tracking-tight text-gray-800">Admin</h1>
  <p className="text-sm text-gray-500">Users, roles & permissions, and activity log.</p>
 </div>
 </div>

 {/* Tabs – only show tabs the user has permission for */}
 <div className="flex gap-2 border-b border-gray-200">
 {canUser && (
  <button
  onClick={() => setTab("users")}
  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition ${
  tab === "users" ? "border-orange-500 text-orange-600 bg-white" : "border-transparent text-gray-600 hover:bg-gray-100"
  }`}
  >
  <Users className="h-4 w-4" /> Users
  </button>
 )}
 {canRole && (
  <button
  onClick={() => setTab("roles")}
  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition ${
  tab === "roles" ? "border-orange-500 text-orange-600 bg-white" : "border-transparent text-gray-600 hover:bg-gray-100"
  }`}
  >
  <Shield className="h-4 w-4" /> Roles & Permissions
  </button>
 )}
 {canAudit && (
  <button
  onClick={() => setTab("audit")}
  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition ${
  tab === "audit" ? "border-orange-500 text-orange-600 bg-white" : "border-transparent text-gray-600 hover:bg-gray-100"
  }`}
  >
  <ClipboardList className="h-4 w-4" /> Activity Log
  </button>
 )}
 </div>

 {/* Users tab */}
 {tab === "users" && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="p-4 flex flex-col sm:flex-row gap-3 justify-between border-b border-gray-100">
  <div className="relative flex-1 max-w-md">
  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
  <input
  type="text"
  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  placeholder="Search name, email, role…"
  value={userSearch}
  onChange={(e) => setUserSearch(e.target.value)}
  />
  </div>
  <button
  onClick={() => { setEditingUser(null); setUserDialogOpen(true); }}
  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  <Plus className="h-4 w-4" /> New user
  </button>
  </div>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Roles</th>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last login</th>
   <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
  </tr>
  </thead>
  <tbody>
  {filteredUsers.map((u) => (
   <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
   <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
   <td className="py-3 px-4 text-gray-600">{u.email}</td>
   <td className="py-3 px-4">
   <div className="flex flex-wrap gap-1">
   {(u.roles && u.roles.length) ? (
    (u.roles as Role[]).map((r) => (
    <span key={r._id} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
    {r.name}
    </span>
    ))
   ) : (
    <span className="text-gray-400">—</span>
   )}
   </div>
   </td>
   <td className="py-3 px-4">
   {u.isActive ? (
   <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Active</span>
   ) : (
   <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">Disabled</span>
   )}
   </td>
   <td className="py-3 px-4 text-sm text-gray-600">{formatDateTimeLondon(u.lastLogin)}</td>
   <td className="py-3 px-4 text-right">
   <UserActionsMenu
   user={u}
   roles={roles}
   onEdit={async () => { 
    try {
    // Fetch full user details including location fields
    const fullUser = await adminApi.getUser(u._id);
    setEditingUser(fullUser.data);
    setUserDialogOpen(true);
    } catch (e) {
    // Fallback to list data if getUser fails
    setEditingUser(u);
    setUserDialogOpen(true);
    }
   }}
   onRefresh={refreshUsers}
   setToast={setToast}
   />
   </td>
   </tr>
  ))}
  </tbody>
  </table>
  </div>
 </div>
 )}

 {/* Roles tab */}
 {tab === "roles" && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <div className="flex justify-between items-center mb-3">
  <h2 className="font-semibold text-gray-800">Roles</h2>
  <button
  onClick={() => setRoleDialogOpen(true)}
  className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  <Plus className="h-4 w-4 inline mr-1" /> New role
  </button>
  </div>
  <div className="space-y-2">
  {roles.map((r) => (
  <div
   key={r._id}
   className={`flex items-center gap-2 p-3 rounded-xl border transition ${
   selectedRoleId === r._id ? "bg-orange-50 border-orange-200" : "hover:bg-gray-50 border-gray-200"
   }`}
  >
   <button
   type="button"
   onClick={() => setSelectedRoleId(r._id)}
   className="flex-1 min-w-0 text-left"
   >
   <div className="font-medium text-gray-800">{r.name}</div>
   <div className="text-xs text-gray-500 truncate">{r.description || "—"}</div>
   </button>
   <RoleActionsMenu
   role={r}
   onEdit={() => { setEditingRole(r); setRoleEditDialogOpen(true); }}
   onDelete={() => setRoleDeleteConfirm(r)}
   />
  </div>
  ))}
  </div>
  </div>
  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <div className="flex justify-between items-center mb-4">
  <div>
  <h2 className="font-semibold text-gray-800">Permissions</h2>
  <p className="text-sm text-gray-500">Select a role and tick the permissions it should have.</p>
  </div>
  <button
  onClick={saveRolePermissions}
  disabled={!selectedRoleId || roleSaving}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {roleSaving ? "Saving…" : "Save"}
  </button>
  </div>
  {!selectedRoleId ? (
  <p className="text-gray-500">Select a role to manage permissions.</p>
  ) : permissionGroups.length === 0 ? (
  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-neutral-800">
  <p className="font-medium">No permissions to select</p>
  <p className="text-sm mt-1">
   The permission catalog is empty. Seed it on the backend so roles can be assigned permissions.
  </p>
  <p className="text-sm mt-2 font-mono bg-white px-2 py-1 rounded border border-neutral-200 inline-block">
   cd pos_inflix_backend && npm run seed:rbac
  </p>
  </div>
  ) : (
  <div className="space-y-5 max-h-[60vh] overflow-y-auto">
  {permissionGroups.map(([groupName, perms]) => (
   <div key={groupName}>
   <div className="font-medium text-gray-700 mb-2">{groupName}</div>
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
   {perms.map((perm) => (
   <label
    key={perm._id}
    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
   >
    <input
    type="checkbox"
    checked={rolePermKeys.has(perm.key)}
    onChange={() => toggleRolePermission(perm.key)}
    className="mt-1 rounded border-gray-300"
    />
    <div>
    <div className="text-sm font-medium text-gray-800">{perm.key}</div>
    <div className="text-xs text-gray-500">{perm.description || "—"}</div>
    </div>
   </label>
   ))}
   </div>
   </div>
  ))}
  </div>
  )}
  </div>
 </div>
 )}

 {/* Activity Log tab */}
 {tab === "audit" && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <div className="flex flex-col sm:flex-row gap-3 mb-4">
  <input
  type="text"
  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Search (message, action, entity…)"
  value={auditFilters.search}
  onChange={(e) => setAuditFilters((f) => ({ ...f, search: e.target.value }))}
  />
  <select
  className="px-3 py-2 border border-gray-300 rounded-lg"
  value={auditFilters.action}
  onChange={(e) => setAuditFilters((f) => ({ ...f, action: e.target.value }))}
  >
  <option value="">All actions</option>
  <option value="LOGIN">LOGIN</option>
  <option value="LOGIN_FAILED">LOGIN_FAILED</option>
  <option value="USER_CREATED">USER_CREATED</option>
  <option value="USER_UPDATED">USER_UPDATED</option>
  <option value="ROLE_PERMISSIONS_CHANGED">ROLE_PERMISSIONS_CHANGED</option>
  </select>
  <button
  onClick={loadAudit}
  disabled={auditLoading}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
  >
  {auditLoading ? "Loading…" : "Apply"}
  </button>
  </div>
  <p className="text-sm text-gray-500 mb-2">
  For full filters and export, use the{" "}
  <Link href="/settings/activity-log" className="text-orange-600 hover:underline inline-flex items-center gap-1">
  Activity Log <ChevronRight className="h-4 w-4" />
  </Link>
  page.
  </p>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Time (London)</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">User</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Action</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Entity</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Status</th>
   <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Summary</th>
  </tr>
  </thead>
  <tbody>
  {audit.map((e) => (
   <tr key={e.id} className="border-b border-gray-100">
   <td className="py-2 px-3 text-sm whitespace-nowrap">{formatDateTimeLondon(e.occurredAtUtc)}</td>
   <td className="py-2 px-3 text-sm">{e.actorName || "—"}</td>
   <td className="py-2 px-3 text-sm"><span className="px-2 py-0.5 rounded bg-gray-100">{e.action}</span></td>
   <td className="py-2 px-3 text-sm">{e.entityType}{e.entityId ? ` #${String(e.entityId).slice(-6)}` : ""}</td>
   <td className="py-2 px-3 text-sm">{e.success ? "Success" : "Failed"}</td>
   <td className="py-2 px-3 text-sm truncate max-w-[200px]">{e.message || "—"}</td>
   </tr>
  ))}
  </tbody>
  </table>
  </div>
 </div>
 )}

 {userDialogOpen && (
 <UserUpsertModal
  roles={roles}
  editingUser={editingUser}
  onClose={() => { setUserDialogOpen(false); setEditingUser(null); }}
  onSaved={async () => { await refreshUsers(); setUserDialogOpen(false); setEditingUser(null); }}
  setToast={setToast}
 />
 )}
 {roleDialogOpen && (
 <RoleCreateModal
  onClose={() => setRoleDialogOpen(false)}
  onCreated={async () => {
  const res = await adminApi.listRoles();
  setRoles(res.data || []);
  setRoleDialogOpen(false);
  }}
  setToast={setToast}
 />
 )}
 {roleEditDialogOpen && editingRole && (
 <RoleEditModal
  role={editingRole}
  onClose={() => { setRoleEditDialogOpen(false); setEditingRole(null); }}
  onSaved={async () => {
  const res = await adminApi.listRoles();
  setRoles(res.data || []);
  setRoleEditDialogOpen(false);
  setEditingRole(null);
  }}
  setToast={setToast}
 />
 )}
 {roleDeleteConfirm && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold text-gray-800">Delete role</h2>
  <p className="text-sm text-gray-500 mt-1">
  Delete the role &quot;{roleDeleteConfirm.name}&quot;? This cannot be undone. You cannot delete a role that is assigned to any user.
  </p>
  <div className="mt-6 flex justify-end gap-2">
  <button
  onClick={() => setRoleDeleteConfirm(null)}
  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  onClick={async () => {
   try {
   await adminApi.deleteRole(roleDeleteConfirm._id);
   setToast({ message: "Role deleted" });
   const res = await adminApi.listRoles();
   setRoles(res.data || []);
   if (selectedRoleId === roleDeleteConfirm._id) setSelectedRoleId(null);
   } catch (e) {
   setToast({ message: e instanceof Error ? e.message : "Failed to delete role", error: true });
   }
   setRoleDeleteConfirm(null);
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

function UserActionsMenu({
 user,
 roles,
 onEdit,
 onRefresh,
 setToast,
}: {
 user: User;
 roles: Role[];
 onEdit: () => void;
 onRefresh: () => void;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [open, setOpen] = useState(false);
 const [resetting, setResetting] = useState(false);
 const triggerRef = useRef<HTMLButtonElement | null>(null);

 async function handleSetActive(active: boolean) {
 try {
 await adminApi.updateUser(user._id, { isActive: active });
 setToast({ message: active ? "User enabled" : "User disabled" });
 onRefresh();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed", error: true });
 }
 setOpen(false);
 }

 async function handleResetPassword() {
 const pwd = window.prompt("New password (min 8 chars, upper, lower, number, special):");
 if (!pwd) return;
 setResetting(true);
 try {
 await adminApi.resetUserPassword(user._id, pwd);
 setToast({ message: "Password reset" });
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed to reset", error: true });
 } finally {
 setResetting(false);
 setOpen(false);
 }
 }

 return (
 <>
 <button
 type="button"
 onClick={(e) => {
  triggerRef.current = e.currentTarget;
  setOpen((prev) => !prev);
 }}
 className="p-1 rounded hover:bg-gray-200"
 aria-label="User actions"
 >
 <MoreHorizontal className="h-4 w-4 text-gray-600" />
 </button>
 <DropdownMenu open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} align="right" className="w-48">
 <button type="button" onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
  Edit user
 </button>
 <button type="button" onClick={handleResetPassword} disabled={resetting} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
  Reset password
 </button>
 <button
  type="button"
  onClick={() => handleSetActive(!user.isActive)}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
 >
  {user.isActive ? "Disable" : "Enable"}
 </button>
 </DropdownMenu>
 </>
 );
}

function RoleActionsMenu({
 role,
 onEdit,
 onDelete,
}: {
 role: Role;
 onEdit: () => void;
 onDelete: () => void;
}) {
 const [open, setOpen] = useState(false);
 const triggerRef = useRef<HTMLButtonElement | null>(null);
 return (
 <div className="shrink-0">
 <button
 type="button"
 onClick={(e) => {
  triggerRef.current = e.currentTarget;
  setOpen((prev) => !prev);
 }}
 className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
 aria-label="Role actions"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 <DropdownMenu open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} align="right" className="w-40">
 <button
  type="button"
  onClick={() => { onEdit(); setOpen(false); }}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
 >
  Edit
 </button>
 <button
  type="button"
  onClick={() => { onDelete(); setOpen(false); }}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
 >
  Delete
 </button>
 </DropdownMenu>
 </div>
 );
}

function UserUpsertModal({
 roles,
 editingUser,
 onClose,
 onSaved,
 setToast,
}: {
 roles: Role[];
 editingUser: User | null;
 onClose: () => void;
 onSaved: () => Promise<void>;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const isEdit = !!editingUser;
 const [name, setName] = useState(editingUser?.name ?? "");
 const [email, setEmail] = useState(editingUser?.email ?? "");
 const [password, setPassword] = useState("");
 const [isActive, setIsActive] = useState(editingUser?.isActive ?? true);
 const [roleIds, setRoleIds] = useState<string[]>(editingUser?.roles ? (editingUser.roles as Role[]).map((r) => r._id) : []);
 const [assignAllRoles, setAssignAllRoles] = useState(false);
 const [saving, setSaving] = useState(false);
 const [locations, setLocations] = useState<Location[]>([]);
 const [locationsLoading, setLocationsLoading] = useState(true);
 const [assignedLocationIds, setAssignedLocationIds] = useState<string[]>(editingUser?.assignedLocationIds ?? []);
 const [defaultLocationId, setDefaultLocationId] = useState<string>(editingUser?.defaultLocationId ?? "");

 useEffect(() => {
 setName(editingUser?.name ?? "");
 setEmail(editingUser?.email ?? "");
 setPassword("");
 setIsActive(editingUser?.isActive ?? true);
 const initialRoleIds = editingUser?.roles ? (editingUser.roles as Role[]).map((r) => r._id) : [];
 setRoleIds(initialRoleIds);
 setAssignAllRoles(roles.length > 0 && initialRoleIds.length === roles.length);
 setAssignedLocationIds(editingUser?.assignedLocationIds ?? []);
 setDefaultLocationId(editingUser?.defaultLocationId ?? "");
 }, [editingUser, roles]);

 useEffect(() => {
 let cancelled = false;
 (async () => {
 setLocationsLoading(true);
 try {
 const res = await adminApi.listLocations();
 if (!cancelled) {
  setLocations(res.data || []);
 }
 } catch (e) {
 if (!cancelled) {
  setToast({ message: e instanceof Error ? e.message : "Failed to load locations", error: true });
 }
 } finally {
 if (!cancelled) setLocationsLoading(false);
 }
 })();
 return () => { cancelled = true; };
 }, [setToast]);

 function toggleRole(id: string) {
 setRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
 setAssignAllRoles(false);
 }

 function toggleAssignAllRoles() {
 if (assignAllRoles) {
 setRoleIds([]);
 setAssignAllRoles(false);
 } else {
 setRoleIds(roles.map((r) => r._id));
 setAssignAllRoles(true);
 }
 }

 function toggleLocation(locationId: string) {
 setAssignedLocationIds((prev) => {
 if (prev.includes(locationId)) {
 const updated = prev.filter((id) => id !== locationId);
 // Clear default location if it was removed
 if (defaultLocationId === locationId) {
  setDefaultLocationId(updated.length > 0 ? updated[0] : "");
 }
 return updated;
 } else {
 return [...prev, locationId];
 }
 });
 }

 async function save() {
 setSaving(true);
 try {
 const locationPayload: { assignedLocationIds?: string[]; defaultLocationId?: string | null } = {};
 if (assignedLocationIds.length > 0) {
 locationPayload.assignedLocationIds = assignedLocationIds;
 locationPayload.defaultLocationId = defaultLocationId || (assignedLocationIds.length > 0 ? assignedLocationIds[0] : null);
 } else {
 // Empty array means clear assignments (user gets access to all locations)
 locationPayload.assignedLocationIds = [];
 locationPayload.defaultLocationId = null;
 }

 if (isEdit) {
 await adminApi.updateUser(editingUser!._id, { 
  name: name.trim(), 
  email: email.trim(), 
  isActive, 
  roleIds,
  ...locationPayload
 });
 setToast({ message: "User updated" });
 } else {
 if (password.length < 8) { setToast({ message: "Password at least 8 characters", error: true }); return; }
 await adminApi.createUser({ 
  name: name.trim(), 
  email: email.trim(), 
  password, 
  roleIds, 
  isActive,
  ...(locationPayload.assignedLocationIds !== undefined && { assignedLocationIds: locationPayload.assignedLocationIds }),
  ...(locationPayload.defaultLocationId !== null && locationPayload.defaultLocationId !== undefined && { defaultLocationId: locationPayload.defaultLocationId })
 });
 setToast({ message: "User created" });
 }
 await onSaved();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed", error: true });
 } finally {
 setSaving(false);
 }
 }

 const canSave = name.trim() && email.trim() && (isEdit || password.length >= 8);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
 <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">{isEdit ? "Edit user" : "Create user"}</h2>
 <p className="text-sm text-gray-500 mt-1">
  {isEdit ? "Update user details, roles, and active status." : "Create a new staff user and assign roles."}
 </p>
 <div className="mt-4 space-y-4">
  <div>
  <label className="block text-xs text-gray-500">Name</label>
  <input
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="e.g. Sarah"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Email</label>
  <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="e.g. sarah@shop.com"
  disabled={isEdit}
  />
  </div>
  {!isEdit && (
  <div>
  <label className="block text-xs text-gray-500">Password (min 8 chars, upper, lower, number, special)</label>
  <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Min 8 characters"
  />
  </div>
  )}
  <div className="flex items-center gap-2">
  <input type="checkbox" id="active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
  <label htmlFor="active">Active</label>
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Roles</label>
  {roles.length > 0 && (
  <label className="flex items-center gap-2 mb-2 cursor-pointer">
  <input
   type="checkbox"
   checked={assignAllRoles}
   onChange={toggleAssignAllRoles}
  />
  <span className="text-sm font-medium text-gray-800">Assign all roles (admin)</span>
  </label>
  )}
  <div className="mt-2 grid grid-cols-2 gap-2">
  {roles.map((r) => (
  <label key={r._id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
   <input type="checkbox" checked={roleIds.includes(r._id)} onChange={() => toggleRole(r._id)} />
   <span className="text-sm font-medium">{r.name}</span>
  </label>
  ))}
  </div>
  {roleIds.length > 0 && (
  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-xs font-medium text-blue-800 mb-1">Location inheritance from roles:</p>
  {roleIds.map((roleId) => {
   const role = roles.find((r) => r._id === roleId);
   if (!role || !role.assignedLocationIds || (Array.isArray(role.assignedLocationIds) && role.assignedLocationIds.length === 0)) {
   return null;
   }
   const roleLocIds = role.assignedLocationIds.map((loc: any) => typeof loc === 'object' && loc._id ? loc._id : String(loc));
   const roleLocs = locations.filter((l) => roleLocIds.includes(l._id));
   if (roleLocs.length === 0) return null;
   return (
   <div key={roleId} className="text-xs text-blue-700 mt-1">
   <span className="font-medium">{role.name}:</span> {roleLocs.map((l) => l.name).join(", ")}
   </div>
   );
  })}
  {roleIds.every((roleId) => {
   const role = roles.find((r) => r._id === roleId);
   return !role || !role.assignedLocationIds || (Array.isArray(role.assignedLocationIds) && role.assignedLocationIds.length === 0);
  }) && (
   <p className="text-xs text-blue-600">Selected roles do not have location restrictions.</p>
  )}
  </div>
  )}
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Assigned Locations</label>
  <p className="text-xs text-gray-400 mb-2">
  {assignedLocationIds.length === 0 
  ? "No locations selected = user has access to all locations (admin-like). Locations can also come from assigned roles."
  : "Select locations this user can access. These are merged with locations from assigned roles. Leave empty for access to all locations."}
  </p>
  {locationsLoading ? (
  <p className="text-sm text-gray-500">Loading locations...</p>
  ) : locations.length === 0 ? (
  <p className="text-sm text-gray-500">No locations available. Create locations first.</p>
  ) : (
  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
  {locations.map((loc) => (
   <label key={loc._id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
   <input
   type="checkbox"
   checked={assignedLocationIds.includes(loc._id)}
   onChange={() => toggleLocation(loc._id)}
   className="rounded border-gray-300"
   />
   <span className="text-sm font-medium text-gray-800">{loc.name}</span>
   {loc.type && (
   <span className="text-xs text-gray-500">({loc.type})</span>
   )}
   </label>
  ))}
  </div>
  )}
  </div>
  {assignedLocationIds.length > 0 && (
  <div>
  <label className="block text-xs text-gray-500 mb-1">Default Location</label>
  <p className="text-xs text-gray-400 mb-2">
  Default location for new sales/repairs. Must be one of the assigned locations.
  </p>
  <select
  value={defaultLocationId}
  onChange={(e) => setDefaultLocationId(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  >
  <option value="">Select default location</option>
  {assignedLocationIds.map((locId) => {
   const loc = locations.find((l) => l._id === locId);
   return loc ? (
   <option key={locId} value={locId}>
   {loc.name}
   </option>
   ) : null;
  })}
  </select>
  </div>
  )}
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
  Cancel
  </button>
  <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? "Saving…" : "Save"}
  </button>
 </div>
 </div>
 </div>
 );
}

function RoleCreateModal({
 onClose,
 onCreated,
 setToast,
}: {
 onClose: () => void;
 onCreated: () => Promise<void>;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [name, setName] = useState("");
 const [desc, setDesc] = useState("");
 const [saving, setSaving] = useState(false);
 const [locations, setLocations] = useState<Location[]>([]);
 const [locationsLoading, setLocationsLoading] = useState(true);
 const [assignedLocationIds, setAssignedLocationIds] = useState<string[]>([]);

 useEffect(() => {
 let cancelled = false;
 (async () => {
 setLocationsLoading(true);
 try {
 const res = await adminApi.listLocations();
 if (!cancelled) {
  setLocations(res.data || []);
 }
 } catch (e) {
 if (!cancelled) {
  setToast({ message: e instanceof Error ? e.message : "Failed to load locations", error: true });
 }
 } finally {
 if (!cancelled) setLocationsLoading(false);
 }
 })();
 return () => { cancelled = true; };
 }, [setToast]);

 function toggleLocation(locationId: string) {
 setAssignedLocationIds((prev) => (prev.includes(locationId) ? prev.filter((id) => id !== locationId) : [...prev, locationId]));
 }

 async function create() {
 if (!name.trim()) return;
 setSaving(true);
 try {
 await adminApi.createRole({ 
 name: name.trim(), 
 description: desc.trim() || undefined,
 assignedLocationIds: assignedLocationIds.length > 0 ? assignedLocationIds : undefined
 });
 setToast({ message: "Role created" });
 await onCreated();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed", error: true });
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
 <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">Create role</h2>
 <p className="text-sm text-gray-500 mt-1">Create a new role, then assign permissions in the Roles tab.</p>
 <div className="mt-4 space-y-3">
  <div>
  <label className="block text-xs text-gray-500">Role name</label>
  <input
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="e.g. Warehouse"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Description</label>
  <input
  value={desc}
  onChange={(e) => setDesc(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="e.g. Can receive stock and pack purchases"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Assigned Locations (Optional)</label>
  <p className="text-xs text-gray-400 mb-2">
  Users with this role will inherit these location assignments. Leave empty if role should not restrict locations.
  </p>
  {locationsLoading ? (
  <p className="text-sm text-gray-500">Loading locations...</p>
  ) : locations.length === 0 ? (
  <p className="text-sm text-gray-500">No locations available. Create locations first.</p>
  ) : (
  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
  {locations.map((loc) => (
   <label key={loc._id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
   <input
   type="checkbox"
   checked={assignedLocationIds.includes(loc._id)}
   onChange={() => toggleLocation(loc._id)}
   className="rounded border-gray-300"
   />
   <span className="text-sm font-medium text-gray-800">{loc.name}</span>
   {loc.type && (
   <span className="text-xs text-gray-500">({loc.type})</span>
   )}
   </label>
  ))}
  </div>
  )}
  </div>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button onClick={create} disabled={!name.trim() || saving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? "Creating…" : "Create"}
  </button>
 </div>
 </div>
 </div>
 );
}

function RoleEditModal({
 role,
 onClose,
 onSaved,
 setToast,
}: {
 role: Role;
 onClose: () => void;
 onSaved: () => Promise<void>;
 setToast: (t: { message: string; error?: boolean } | null) => void;
}) {
 const [name, setName] = useState(role.name);
 const [desc, setDesc] = useState(role.description ?? "");
 const [saving, setSaving] = useState(false);
 const [locations, setLocations] = useState<Location[]>([]);
 const [locationsLoading, setLocationsLoading] = useState(true);
 const [assignedLocationIds, setAssignedLocationIds] = useState<string[]>(() => {
 // Extract location IDs from role (can be objects if populated or strings)
 if (!role.assignedLocationIds) return [];
 return role.assignedLocationIds.map((loc: any) => 
 typeof loc === 'object' && loc._id ? loc._id : String(loc)
 );
 });

 useEffect(() => {
 setName(role.name);
 setDesc(role.description ?? "");
 // Update location IDs when role changes
 const locIds = role.assignedLocationIds 
 ? role.assignedLocationIds.map((loc: any) => typeof loc === 'object' && loc._id ? loc._id : String(loc))
 : [];
 setAssignedLocationIds(locIds);
 }, [role]);

 useEffect(() => {
 let cancelled = false;
 (async () => {
 setLocationsLoading(true);
 try {
 const res = await adminApi.listLocations();
 if (!cancelled) {
  setLocations(res.data || []);
 }
 } catch (e) {
 if (!cancelled) {
  setToast({ message: e instanceof Error ? e.message : "Failed to load locations", error: true });
 }
 } finally {
 if (!cancelled) setLocationsLoading(false);
 }
 })();
 return () => { cancelled = true; };
 }, [setToast]);

 function toggleLocation(locationId: string) {
 setAssignedLocationIds((prev) => (prev.includes(locationId) ? prev.filter((id) => id !== locationId) : [...prev, locationId]));
 }

 async function save() {
 if (!name.trim()) return;
 setSaving(true);
 try {
 await adminApi.updateRole(role._id, { 
 name: name.trim(), 
 description: desc.trim() || undefined,
 assignedLocationIds: assignedLocationIds.length > 0 ? assignedLocationIds : []
 });
 setToast({ message: "Role updated" });
 await onSaved();
 } catch (e) {
 setToast({ message: e instanceof Error ? e.message : "Failed", error: true });
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
 <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
 <h2 className="text-lg font-semibold text-gray-800">Edit role</h2>
 <p className="text-sm text-gray-500 mt-1">Change the role name, description, and location assignments. Use the permissions panel to change what this role can do.</p>
 <div className="mt-4 space-y-3">
  <div>
  <label className="block text-xs text-gray-500">Role name</label>
  <input
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="e.g. Warehouse"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500">Description</label>
  <input
  value={desc}
  onChange={(e) => setDesc(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="e.g. Can receive stock and pack purchases"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-500 mb-1">Assigned Locations (Optional)</label>
  <p className="text-xs text-gray-400 mb-2">
  Users with this role will inherit these location assignments. Leave empty if role should not restrict locations.
  </p>
  {locationsLoading ? (
  <p className="text-sm text-gray-500">Loading locations...</p>
  ) : locations.length === 0 ? (
  <p className="text-sm text-gray-500">No locations available. Create locations first.</p>
  ) : (
  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
  {locations.map((loc) => (
   <label key={loc._id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
   <input
   type="checkbox"
   checked={assignedLocationIds.includes(loc._id)}
   onChange={() => toggleLocation(loc._id)}
   className="rounded border-gray-300"
   />
   <span className="text-sm font-medium text-gray-800">{loc.name}</span>
   {loc.type && (
   <span className="text-xs text-gray-500">({loc.type})</span>
   )}
   </label>
  ))}
  </div>
  )}
  </div>
 </div>
 <div className="mt-6 flex justify-end gap-2">
  <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
  <button onClick={save} disabled={!name.trim() || saving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {saving ? "Saving…" : "Save"}
  </button>
 </div>
 </div>
 </div>
 );
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
}

export interface Role {
 _id: string;
 name: string;
 description?: string;
 permissions?: { _id: string; key: string; description?: string; group?: string }[];
 assignedLocationIds?: string[] | Location[];
}

export interface Permission {
 _id: string;
 key: string;
 description?: string;
 group?: string;
}

export interface User {
 _id: string;
 name: string;
 email: string;
 isActive: boolean;
 role?: string;
 roles?: Role[];
 lastLogin?: string;
 createdAt?: string;
 updatedAt?: string;
 phone?: string;
 assignedLocationIds?: string[];
 defaultLocationId?: string;
}

export const adminApi = {
 async listUsers(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  if (params?.isActive !== undefined) q.set("isActive", String(params.isActive));
  const res = await fetch(`${API_BASE}/admin/users?${q.toString()}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load users");
  return json;
 },

 async getUser(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load user");
  return json;
 },

 async createUser(payload: { name: string; email: string; password: string; roleIds?: string[]; isActive?: boolean; phone?: string; assignedLocationIds?: string[]; defaultLocationId?: string }) {
  const res = await fetch(`${API_BASE}/admin/users`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to create user");
  return json;
 },

 async updateUser(id: string, payload: { name?: string; email?: string; roleIds?: string[]; isActive?: boolean; phone?: string; assignedLocationIds?: string[]; defaultLocationId?: string | null }) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to update user");
  return json;
 },

 async resetUserPassword(id: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify({ newPassword }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to reset password");
  return json;
 },

 async listRoles() {
  const res = await fetch(`${API_BASE}/admin/roles`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load roles");
  return json;
 },

 async getRole(id: string) {
  const res = await fetch(`${API_BASE}/admin/roles/${id}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load role");
  return json;
 },

 async getRolePermissions(roleId: string) {
  const res = await fetch(`${API_BASE}/admin/roles/${roleId}/permissions`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load role permissions");
  return json;
 },

 async saveRolePermissions(roleId: string, permissionKeys: string[]) {
  const res = await fetch(`${API_BASE}/admin/roles/${roleId}/permissions`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify({ permissionKeys }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to save permissions");
  return json;
 },

 async createRole(payload: { name: string; description?: string; permissionIds?: string[]; assignedLocationIds?: string[] }) {
  const res = await fetch(`${API_BASE}/admin/roles`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to create role");
  return json;
 },

 async updateRole(id: string, payload: { name?: string; description?: string; assignedLocationIds?: string[] }) {
  const res = await fetch(`${API_BASE}/admin/roles/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to update role");
  return json;
 },

 async deleteRole(id: string) {
  const res = await fetch(`${API_BASE}/admin/roles/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to delete role");
  return json;
 },

 async listPermissions() {
  const res = await fetch(`${API_BASE}/admin/permissions`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load permissions");
  return json;
 },

 async listLocations() {
  const res = await fetch(`${API_BASE}/locations?isActive=true&limit=100`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load locations");
  return json;
 },
};

export interface Location {
 _id: string;
 name: string;
 type?: string;
 isActive?: boolean;
}

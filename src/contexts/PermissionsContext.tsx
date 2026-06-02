"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface CurrentUser {
  _id: string;  
  name: string;
  email: string;
  role?: string;  
  roles?: { _id: string; name: string; description?: string }[];
  permissionKeys?: string[];
  assignedLocationIds?: string[];
  defaultLocationId?: string | null;
  isPlatformAdmin?: boolean;
  tenantId?: string;
  preferredRetailModeEnabled?: boolean | null;
  effectiveRetailModeEnabled?: boolean;
}

interface PermissionsContextValue {
  user: CurrentUser | null;
  loading: boolean;
  suspended: boolean;
  permissionKeys: string[];
  can: (key: string) => boolean;
  refreshUser: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Fetches /api/auth/me once on mount and provides user + can() to the tree.
 * Use this at the root of (routes) so all pages share a single RBAC load.
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspended, setSuspended] = useState(false);

  const fetchMe = useCallback(async (opts?: { setLoadingFlag?: boolean }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      if (opts?.setLoadingFlag) setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403 && json.code === "TENANT_SUSPENDED") {
        setSuspended(true);
        return;
      }
      if (json.success && json.data) {
        setUser(json.data);
        setSuspended(false);
        try {
          localStorage.setItem("user", JSON.stringify(json.data));
          if (typeof json.data.effectiveRetailModeEnabled === "boolean") {
            sessionStorage.setItem(
              "create-sales-retailMode",
              json.data.effectiveRetailModeEnabled ? "1" : "0"
            );
          }
        } catch {}
      }
    } catch {
      // Network error — keep current user state intact (offline-tolerant)
    } finally {
      if (opts?.setLoadingFlag) setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("user");
        if (cached) setUser(JSON.parse(cached));
      } catch {}
    }
    fetchMe({ setLoadingFlag: true });
    const interval = setInterval(() => fetchMe(), 60000);
    return () => clearInterval(interval);
  }, [fetchMe]);

  const permissionKeys = useMemo(
    () => (Array.isArray(user?.permissionKeys) ? user!.permissionKeys : []),
    [user?.permissionKeys]
  );
  const can = useCallback(
    (key: string) => {
      if (!key) return false;
      if (user?.role === "admin") return true;
      return permissionKeys.includes(key);
    },
    [user?.role, permissionKeys]
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({ user, loading, suspended, permissionKeys, can, refreshUser }),
    [user, loading, suspended, permissionKeys, can, refreshUser]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (ctx) return ctx;
  return {
    user: null,
    loading: true,
    suspended: false,
    permissionKeys: [],
    can: () => false,
    refreshUser: async () => {},
  };
}

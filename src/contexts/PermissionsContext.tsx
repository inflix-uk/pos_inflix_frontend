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
}

interface PermissionsContextValue {
  user: CurrentUser | null;
  loading: boolean;
  suspended: boolean;
  permissionKeys: string[];
  can: (key: string) => boolean;
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

  useEffect(() => {
    let cancelled = false;
    // Hydrate immediately from localStorage so a network blip never blanks the user
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("user");
        if (cached) setUser(JSON.parse(cached));
      } catch {}
    }
    function checkMe() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      // No token at all → genuine logged-out state
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (cancelled) return;
          if (res.status === 403 && json.code === "TENANT_SUSPENDED") {
            setSuspended(true);
            setLoading(false);
            return;
          }
          if (json.success && json.data) {
            setUser(json.data);
            setSuspended(false);
            try {
              localStorage.setItem("user", JSON.stringify(json.data));
            } catch {}
          }
          // Do NOT clear user on transient failure responses; only manual /logout clears the token.
        })
        .catch(() => {
          // Network error — keep current user state intact (offline-tolerant)
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    checkMe();
    const interval = setInterval(checkMe, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
    () => ({ user, loading, suspended, permissionKeys, can }),
    [user, loading, suspended, permissionKeys, can]
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
  };
}

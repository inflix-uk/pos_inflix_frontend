"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export interface EntitlementsData {
  subscriptionType: 'plan' | 'custom';
  planKey: string;
  enabledFeatures: Record<string, boolean>;
  limits: Record<string, number | null>;
  usage: Record<string, number>;
  status: 'active' | 'suspended';
  billingAmount: number | null;
  billingCycle: string;
  currency: string;
  billingEmail: string;
  billingAddress: string;
  startDate: string | null;
  expireDate: string | null;
}

export function useEntitlements(): {
  data: EntitlementsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<EntitlementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(() => {
    setLoading(true);
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${API_BASE}/entitlements`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load entitlements");
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) setData(json.data);
        else setData(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Error");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return { data, loading, error, refetch: fetchEntitlements };
}

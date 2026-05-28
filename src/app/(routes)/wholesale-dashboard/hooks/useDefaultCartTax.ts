"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/apiBase";
import type { CartTaxConfig } from "../../sales-dashboard/components/CartTaxSlotContext";

type TaxRow = {
  _id?: string;
  name?: string;
  rate?: number;
  type?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

/** Load default tax from Settings → Tax for wholesale / POS cart totals. */
export function useDefaultCartTax(): CartTaxConfig {
  const [config, setConfig] = useState<CartTaxConfig>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_BASE_URL}/api/settings/taxes`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const json = await res.json();
        const list: TaxRow[] = Array.isArray(json?.data) ? json.data : [];
        const active = list.filter((t) => t.isActive !== false);
        const pick =
          active.find((t) => t.isDefault) ??
          active.find((t) => String(t.name || "").toLowerCase().includes("vat")) ??
          active[0];
        if (!pick || cancelled) return;
        const rate = Number(pick.rate);
        if (!Number.isFinite(rate) || rate <= 0) return;
        const type: "percentage" | "flat" =
          pick.type === "fixed" || pick.type === "flat" ? "flat" : "percentage";
        setConfig({ rate, type, name: pick.name?.trim() || undefined });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}

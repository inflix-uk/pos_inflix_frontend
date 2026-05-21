"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { getMySalesMode, updateMySalesMode } from "./service/mySalesModeApi";

export default function MySalesModePage() {
  const { can, loading: permLoading, user, refreshUser } = usePermissions();
  const canEdit = can("settings.sales_mode");

  const [retailModeEnabled, setRetailModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!canEdit) return;
    setLoading(true);
    getMySalesMode()
      .then((res) => {
        if (res.success && res.data) {
          setRetailModeEnabled(!!res.data.effectiveRetailModeEnabled);
        } else if (typeof user?.effectiveRetailModeEnabled === "boolean") {
          setRetailModeEnabled(user.effectiveRetailModeEnabled);
        }
      })
      .finally(() => setLoading(false));
  }, [canEdit, user?.effectiveRetailModeEnabled]);

  const handleToggle = async (value: boolean) => {
    if (!canEdit || saving) return;
    setSaving(true);
    setMessage(null);
    const prev = retailModeEnabled;
    setRetailModeEnabled(value);
    try {
      const res = await updateMySalesMode({ retailModeEnabled: value });
      if (res.success && res.data) {
        setRetailModeEnabled(!!res.data.effectiveRetailModeEnabled);
        try {
          sessionStorage.setItem(
            "create-sales-retailMode",
            res.data.effectiveRetailModeEnabled ? "1" : "0"
          );
        } catch {}
        window.dispatchEvent(
          new CustomEvent("pos-user-sales-mode-change", {
            detail: res.data.effectiveRetailModeEnabled,
          })
        );
        await refreshUser?.();
        setMessage({
          type: "success",
          text: value ? "Retail (walk-in) mode saved for your account" : "Wholesale mode saved for your account",
        });
      } else {
        setRetailModeEnabled(prev);
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setRetailModeEnabled(prev);
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  if (permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-gray-600">You do not have permission to change sales mode.</p>
        <Link href="/settings" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Settings
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">My sales mode</h1>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Choose how Create Sales works for you: retail (walk-in, full payment) or wholesale (accounts and credit).
        This is saved to your user profile. Company-wide options (default account, header buttons) are set by an admin.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-4">Sales mode</p>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium ${!retailModeEnabled ? "text-gray-900" : "text-gray-500"}`}
            >
              Wholesale
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={retailModeEnabled}
              disabled={saving}
              onClick={() => handleToggle(!retailModeEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 ${
                retailModeEnabled ? "bg-orange-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                  retailModeEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${retailModeEnabled ? "text-gray-900" : "text-gray-500"}`}
            >
              Retail (walk-in)
            </span>
            {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {retailModeEnabled
              ? "Walk-in customer, compact checkout, full payment required."
              : "Select a customer, credit and split payments available."}
          </p>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === "success" ? "text-green-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

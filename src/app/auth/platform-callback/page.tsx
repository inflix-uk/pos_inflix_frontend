"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { startPosShift } from "@/lib/posShift";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PlatformCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing token. Use the platform to open this tenant.");
      return;
    }
    const url = `${API_BASE.replace(/\/$/, "")}/api/auth/platform-callback`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (data.success && data.token && data.data) {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.data));
            if (typeof data.data?.effectiveRetailModeEnabled === "boolean") {
              try {
                sessionStorage.setItem(
                  "create-sales-retailMode",
                  data.data.effectiveRetailModeEnabled ? "1" : "0"
                );
              } catch {}
            }
            startPosShift();
          }
          setStatus("ok");
          window.location.href = "/dashboard";
          return;
        }
        setStatus("error");
        if (res.status === 403 && data.code === "TENANT_SUSPENDED") {
          setMessage("Account suspended. Please contact Inflix - hello@inflix.co.uk");
        } else {
          setMessage(data.message || "Invalid or expired link. Please try again from the platform.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Unable to connect to the server. If you opened this from the platform, the tenant app may be misconfigured (check NEXT_PUBLIC_API_URL).");
      });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="mt-4 text-gray-700 font-medium">Signing you in…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
          <p className="text-gray-800 font-medium mb-2">Could not sign in</p>
          <p className="text-gray-600 text-sm mb-4">{message}</p>
          <a href="/" className="text-orange-600 hover:underline font-medium">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return null;
}

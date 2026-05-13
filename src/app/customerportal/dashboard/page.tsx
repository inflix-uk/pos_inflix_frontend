"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface StatementLine {
  _id: string;
  type: string;
  amount: number;
  referenceLabel: string;
  date: string;
  paymentMethod?: string;
  note?: string;
  isEdited?: boolean;
}

interface StatementData {
  customer: { _id: string; name: string };
  balance: number;
  lines: StatementLine[];
}

function getPortalHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("cp_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CustomerPortalStatement() {
  const router = useRouter();
  const [customer, setCustomer] = useState<{ _id: string; name: string } | null>(null);
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("cp_customer");
    const token = localStorage.getItem("cp_token");
    if (!stored || !token) {
      router.push("/customerportal");
      return;
    }
    try {
      setCustomer(JSON.parse(stored));
    } catch {
      router.push("/customerportal");
    }
  }, [router]);

  const fetchStatement = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (filterFrom) q.set("from", filterFrom);
      if (filterTo) q.set("to", filterTo);
      const res = await fetch(`${API_BASE}/api/customer-portal/statement?${q}`, {
        headers: getPortalHeaders(),
      });
      if (res.status === 401) {
        localStorage.removeItem("cp_token");
        localStorage.removeItem("cp_customer");
        router.push("/customerportal");
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load statement");
      setStatement(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load statement");
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo, router]);

  useEffect(() => {
    if (customer) fetchStatement();
  }, [customer, fetchStatement]);

  const displayAmount = (amount: number) => -amount;
  const balance = statement?.balance ?? 0;
  const isStoreCredit = balance < 0;
  const balanceLabel = isStoreCredit ? "Store credit" : "Amount receivable";
  const balanceDisplay = isStoreCredit ? Math.abs(balance) : balance;
  const lines = statement?.lines ?? [];
  const periodDescription =
    filterFrom || filterTo ? `${filterFrom || "..."} \u2192 ${filterTo || "..."}` : "Full history";

  const handleExportCsv = () => {
    if (!statement || lines.length === 0) return;
    const header = ["Date", "Type", "Reference", "Amount"];
    const rows = lines.map((l) => [
      formatDate(l.date),
      l.type.replace(/_/g, " "),
      l.referenceLabel || "",
      displayAmount(l.amount).toFixed(2),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${customer?.name || "customer"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Balance Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{balanceLabel}</p>
            <p className={`text-3xl font-bold ${isStoreCredit ? "text-green-600" : balance > 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatMoney(balanceDisplay)}
            </p>
            {isStoreCredit && (
              <p className="text-sm text-green-600 mt-1">You have store credit</p>
            )}
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Calendar size={18} className="text-gray-400 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
              />
            </div>
            {(filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterFrom(""); setFilterTo(""); }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400">{periodDescription}</span>
            <button
              onClick={handleExportCsv}
              disabled={lines.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Statement Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-sm text-gray-500">Loading statement...</span>
          </div>
        ) : lines.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No transactions found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line) => {
                  const amt = displayAmount(line.amount);
                  const isPositive = amt > 0;
                  return (
                    <tr key={line._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(line.date)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            line.type === "sale"
                              ? "bg-blue-50 text-blue-700"
                              : line.type === "payment_in"
                              ? "bg-green-50 text-green-700"
                              : line.type === "refund"
                              ? "bg-amber-50 text-amber-700"
                              : line.type === "opening_balance"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {line.type.replace(/_/g, " ")}
                          {line.isEdited && " (edited)"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {line.referenceLabel || "\u2014"}
                        {line.note && (
                          <span className="block text-xs text-gray-400">{line.note}</span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-3 text-sm font-medium text-right whitespace-nowrap ${
                          isPositive ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatMoney(amt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

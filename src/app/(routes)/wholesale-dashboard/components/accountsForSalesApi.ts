import type { Customer } from "../../peoples/customers/types";
import type { Supplier } from "../../peoples/suppliers/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export interface AccountsForSalesResponse {
 success: boolean;
 customers: Customer[];
 suppliers: Supplier[];
 counts: { customers: number; suppliers: number };
 tookMs?: number;
}

/**
 * Combined customers + suppliers list for the /create-sales account dropdown.
 * Single round-trip; backend caches for 30 s. Pass fresh=true after add-customer
 * to bypass the cache.
 */
export async function getAccountsForSales(opts?: { fresh?: boolean }): Promise<AccountsForSalesResponse> {
 const qs = opts?.fresh ? "?fresh=1" : "";
 const res = await fetch(`${API_URL}/api/accounts/for-sales${qs}`, {
  method: "GET",
  headers: getAuthHeaders(),
  credentials: "include",
 });
 if (!res.ok) {
  throw new Error(`Failed to fetch accounts (${res.status})`);
 }
 return res.json();
}

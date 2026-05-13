const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface PaymentAccountRow {
 _id: string;
 name: string;
 type: string;
 locationId: string | null;
 balance: number;
 in: number;
 out: number;
}

export async function getPaymentAccounts(locationId?: string | null): Promise<PaymentAccountRow[]> {
 const params = new URLSearchParams();
 if (locationId) params.set("locationId", locationId);
 const res = await fetch(`${API_URL}/api/accounts/payment-accounts?${params}`, {
  headers: getAuthHeaders(),
 });
 if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error((err as { message?: string }).message || "Failed to load payment accounts");
 }
 const json = await res.json();
 return json.data ?? [];
}

export async function createMoneyTransfer(body: {
 fromAccountId: string;
 toAccountId: string;
 amount: number;
 fee?: number;
 notes?: string;
}): Promise<{ transferId: string }> {
 const res = await fetch(`${API_URL}/api/accounts/money-transfer`, {
  method: "POST",
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
 });
 if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error((err as { message?: string }).message || "Transfer failed");
 }
 const json = await res.json();
 return json.data;
}

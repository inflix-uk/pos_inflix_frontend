const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 if (typeof window === "undefined") return { "Content-Type": "application/json" };
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface CustomerStatementLine {
 _id: string;
 type: string;
 amount: number;
 referenceLabel: string;
 date: string;
 paymentMethod?: string;
 note?: string;
 isEdited?: boolean;
}

export interface CustomerStatement {
 customer: { _id: string; name: string };
 balance: number;
 lines: CustomerStatementLine[];
}

export interface SupplierStatementLine {
 _id: string;
 type: string;
 amount: number;
 referenceLabel: string;
 referenceId?: string;
 date: string;
 paymentMethod?: string;
 note?: string;
 isEdited?: boolean;
}

export interface SupplierStatement {
 supplier: {
  _id: string;
  name: string;
  contactPerson?: string;
  displayLabel?: string;
 };
 balance: number;
 lines: SupplierStatementLine[];
}

export interface BalanceSheetData {
 asOf: string;
 receivables: number;
 payables: number;
 bankAccounts: { _id: string; accountName: string; bankName: string }[];
}

export interface TrialBalanceEntry {
 accountId: string;
 name?: string;
 balance: number;
}

export interface TrialBalanceData {
 asOf: string;
 customers: TrialBalanceEntry[];
 suppliers: TrialBalanceEntry[];
}

export interface DebtorsCreditorsRow {
 accountId: string;
 name: string;
 phone: string;
 email: string;
 debit: number;
 credit: number;
}

export interface DebtorsCreditorsData {
 asOf: string;
 debtors: DebtorsCreditorsRow[];
 creditors: DebtorsCreditorsRow[];
}

export interface ProfitAndLossCategoryRow {
 categoryId: string;
 categoryName: string;
 totalGross: number;
 count: number;
}

export interface ProfitAndLossProductRow {
 sku: string;
 name: string;
 revenue: number;
 cogs: number;
 grossProfit: number;
}

export interface ProfitAndLossData {
 from: string;
 to: string;
 revenue: number;
 salesRevenue?: number;
 returnRevenue?: number;
 cogs: number;
 cogsSales?: number;
 cogsReturnReversal?: number;
 grossProfit: number;
 totalExpenses: number;
 netProfit: number;
 topProductsByGrossProfit?: ProfitAndLossProductRow[];
 expensesByCategory: ProfitAndLossCategoryRow[];
 /** Number of sale lines in period with no cost snapshot (COGS may be understated). */
 missingCostLineCount?: number;
 /** Number of sales in period that have at least one line with missing cost. */
 missingCostSaleCount?: number;
}

export const accountsApi = {
 recordCustomerPayment: async (payload: {
  customerId: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
 }) => {
  const res = await fetch(`${API_BASE}/api/accounts/customer-payment`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to record payment");
  return data;
 },

 updateLedgerEntry: async (
  entryId: string,
  payload: { amount?: number; note?: string; paymentMethod?: string; date?: string }
 ) => {
  const res = await fetch(`${API_BASE}/api/accounts/ledger-entry/${entryId}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update entry");
  return data;
 },

 deleteLedgerEntry: async (entryId: string) => {
  const res = await fetch(`${API_BASE}/api/accounts/ledger-entry/${entryId}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete entry");
  return data;
 },

 recordBalanceAdjustment: async (payload: {
  accountType: "customer" | "supplier";
  accountId: string;
  amount: number;
  direction: "add" | "subtract";
  note?: string;
  date?: string;
 }) => {
  const res = await fetch(`${API_BASE}/api/accounts/balance-adjustment`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to adjust balance");
  return data;
 },

 recordCustomerRefund: async (payload: {
  customerId: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
 }) => {
  const res = await fetch(`${API_BASE}/api/accounts/customer-refund`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to record refund");
  return data;
 },

 getCustomerStatement: async (
  customerId: string,
  params?: { from?: string; to?: string }
 ): Promise<{ success: boolean; data: CustomerStatement }> => {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const res = await fetch(
   `${API_BASE}/api/accounts/customer/${customerId}/statement?${q}`,
   { headers: getAuthHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load statement");
  return data;
 },

 recordSupplierPayment: async (payload: {
  supplierId: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
 }) => {
  const res = await fetch(`${API_BASE}/api/accounts/supplier-payment`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to record payment");
  return data;
 },

 recordPurchasePayment: async (
  purchaseId: string,
  payload: { amount: number; paymentMethod?: string; note?: string; date?: string }
 ) => {
  const res = await fetch(`${API_BASE}/api/accounts/purchase/${purchaseId}/pay`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to record payment");
  return data;
 },

 getSupplierStatement: async (
  supplierId: string,
  params?: { from?: string; to?: string }
 ): Promise<{ success: boolean; data: SupplierStatement }> => {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const res = await fetch(
   `${API_BASE}/api/accounts/supplier/${supplierId}/statement?${q}`,
   { headers: getAuthHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load statement");
  return data;
 },

 getBalanceSheet: async (asOf?: string): Promise<{ success: boolean; data: BalanceSheetData }> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  const res = await fetch(`${API_BASE}/api/accounts/balance-sheet${q}`, {
   headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load balance sheet");
  return data;
 },

 getTrialBalance: async (asOf?: string): Promise<{ success: boolean; data: TrialBalanceData }> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  const res = await fetch(`${API_BASE}/api/accounts/trial-balance${q}`, {
   headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load trial balance");
  return data;
 },

 getDebtorsCreditors: async (
  asOf?: string
 ): Promise<{ success: boolean; data: DebtorsCreditorsData }> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  const res = await fetch(`${API_BASE}/api/accounts/debtors-creditors${q}`, {
   headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load debtors & creditors");
  return data;
 },

 getProfitAndLoss: async (params?: {
  from?: string;
  to?: string;
 }): Promise<{ success: boolean; data: ProfitAndLossData }> => {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const res = await fetch(`${API_BASE}/api/accounts/profit-and-loss?${q}`, {
   headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load profit and loss");
  return data;
 },

 /**
  * Email the account statement PDF (same layout as download). Uses Next.js route
  * `/api/account-statement/send-pdf` with SMTP from env — see route file for variables.
  */
 sendAccountStatementPdfEmail: async (payload: {
  to: string;
  pdfBase64: string;
  filename: string;
  accountName: string;
  accountType: "customer" | "supplier";
 }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch("/api/account-statement/send-pdf", {
   method: "POST",
   headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
   },
   body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
   throw new Error(
    typeof data.message === "string" ? data.message : "Failed to send statement email"
   );
  }
  return data as { success?: boolean; message?: string };
 },
};

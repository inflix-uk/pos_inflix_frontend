"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, Percent } from "lucide-react";
import WholesaleDashboardPage from "../wholesale-dashboard/page";
import { CartTaxSlotProvider, CartTaxConfigProvider, type CartTaxConfig } from "../sales-dashboard/components/CartTaxSlotContext";
import { SearchableSelect } from "../purchases/add/components/SearchableSelect";
import { OrderWriterProvider, type OrderWriter } from "../wholesale-dashboard/components/OrderWriterContext";
import { invoicesApi } from "../invoice-online-order/service/invoicesApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SELECTED_TAX_KEY = "create-invoice-selected-tax";

type TaxCategory = { _id: string; name: string; rate: number; type: string };

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchTaxesWithRetry(attempts = 3): Promise<TaxCategory[]> {
 let lastErr: unknown = new Error("Request failed");
 for (let i = 0; i < attempts; i++) {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes/active`, {
    headers: getAuthHeaders(),
   });
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const result = (await response.json()) as { success?: boolean; data?: TaxCategory[] };
   if (result.success && Array.isArray(result.data)) return result.data;
   throw new Error("Bad response shape");
  } catch (err) {
   lastErr = err;
   if (i < attempts - 1) await sleep(500 * Math.pow(2, i));
  }
 }
 throw lastErr;
}

function describeTax(t: TaxCategory): string {
 return t.type === "percentage" ? `${t.rate}%` : `£${t.rate} Flat`;
}

function CartTaxRow({
 taxes,
 loading,
 error,
 onRetry,
 selectedId,
 onSelect,
}: {
 taxes: TaxCategory[];
 loading: boolean;
 error: boolean;
 onRetry: () => void;
 selectedId: string;
 onSelect: (id: string) => void;
}) {
 const options = useMemo(
  () =>
   taxes.map((t) => ({
    _id: t._id,
    name: t.name,
    subtitle: describeTax(t),
    searchText: `${t.name} ${describeTax(t)}`.toLowerCase(),
   })),
  [taxes],
 );

 return (
  <div className="flex items-center justify-between text-sm gap-2">
   <span className="text-gray-600 shrink-0">Tax</span>
   <div className="flex-1 min-w-0 max-w-[60%]">
    {loading && options.length === 0 ? (
     <span className="inline-flex items-center gap-1 text-xs text-gray-500 justify-end w-full">
      <Loader2 className="w-3 h-3 animate-spin" />
      Loading…
     </span>
    ) : error && options.length === 0 ? (
     <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-800 justify-end w-full"
     >
      <AlertTriangle className="w-3 h-3" />
      Failed
      <RotateCcw className="w-3 h-3" />
     </button>
    ) : options.length === 0 ? (
     <span className="text-xs text-gray-500 italic block text-right">None configured</span>
    ) : (
     <SearchableSelect
      options={options}
      value={selectedId}
      onChange={onSelect}
      placeholder="Select tax"
      icon={<Percent className="h-3.5 w-3.5 text-gray-400" />}
      loading={loading}
      error={error}
      onRetry={onRetry}
     />
    )}
   </div>
  </div>
 );
}

export default function CreateInvoicePage() {
 const [taxes, setTaxes] = useState<TaxCategory[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const [selectedId, setSelectedId] = useState<string>("");

 const loadTaxes = async () => {
  setLoading(true);
  setError(false);
  try {
   const data = await fetchTaxesWithRetry();
   setTaxes(data);
   if (data.length > 0) {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_TAX_KEY) : null;
    const initial = stored && data.some((t) => t._id === stored) ? stored : data[0]._id;
    setSelectedId(initial);
   }
  } catch (e) {
   console.error("Failed to load tax categories", e);
   setError(true);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  loadTaxes();
 }, []);

 useEffect(() => {
  if (!selectedId || typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_TAX_KEY, selectedId);
 }, [selectedId]);

 const slot = useMemo(
  () => (
   <CartTaxRow
    taxes={taxes}
    loading={loading}
    error={error}
    onRetry={loadTaxes}
    selectedId={selectedId}
    onSelect={setSelectedId}
   />
  ),
  [taxes, loading, error, selectedId],
 );

 const writer = useMemo<OrderWriter>(
  () => ({
   entityLabel: "Invoice",
   entityNounLower: "invoice",
   referencePrefix: "INVC-",
   createSale: (payload) =>
    invoicesApi.createInvoice({
     ...payload,
     ...(selectedId ? { taxId: selectedId } : {}),
    }),
   checkReference: (reference, signal) => invoicesApi.checkReference(reference, signal),
  }),
  [selectedId],
 );

 const taxConfig = useMemo<CartTaxConfig>(() => {
  const selected = taxes.find((t) => t._id === selectedId);
  if (!selected) return null;
  const type: "percentage" | "flat" = selected.type === "fixed" || selected.type === "flat" ? "flat" : "percentage";
  return { rate: Number(selected.rate) || 0, type };
 }, [taxes, selectedId]);

 return (
  <OrderWriterProvider value={writer}>
   <CartTaxConfigProvider value={taxConfig}>
    <CartTaxSlotProvider value={slot}>
     <WholesaleDashboardPage />
    </CartTaxSlotProvider>
   </CartTaxConfigProvider>
  </OrderWriterProvider>
 );
}

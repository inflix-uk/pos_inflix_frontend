"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft,
 RotateCcw,
 ScanLine,
 ShoppingCart,
 Loader2,
 Plus,
 Trash2,
 FileText,
 ShieldCheck,
 X,
} from "lucide-react";
import { salesApi } from "../../../sales-dashboard/service/salesApi";
import type { SaleRecord } from "../../../sales-dashboard/service/salesApi";
import { salesReturnApi } from "../../service";
import { getPaymentAccounts } from "../../../money-transfer/service/paymentAccountApi";

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

type ReturnLine = {
 lineIndex: number;
 sku: string;
 name: string;
 price: number;
 quantity: number;
 qtyAlreadyReturned: number;
 qtyReturnable: number;
 serialNumbers: string[];
 returnableSerials: string[];
};

type ReturnDestination = "restock" | "damaged" | "refurb" | "return_to_supplier";

const DESTINATION_LABELS: Record<ReturnDestination, string> = {
 restock: "Restock (sellable)",
 damaged: "Damaged (scrap)",
 refurb: "Refurb / repair",
 return_to_supplier: "Return to supplier",
};

type BasketItem = {
 lineIndex: number;
 sku: string;
 name: string;
 price: number;
 qtyToReturn: number;
 serials?: string[];
 returnDestination: ReturnDestination;
};

export default function StartReturnPage() {
 const params = useParams();
 const router = useRouter();
 const saleId = params?.saleId as string;

 const [sale, setSale] = useState<SaleRecord | null>(null);
 const [returnLines, setReturnLines] = useState<ReturnLine[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<"select" | "scan">("select");
 const [basket, setBasket] = useState<BasketItem[]>([]);
 const [qtyInputs, setQtyInputs] = useState<Record<number, number>>({});
 const [scanValue, setScanValue] = useState("");
 const [scanError, setScanError] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [returnType, setReturnType] = useState<"store_credit" | "refund">("store_credit");
 const [refundMethod, setRefundMethod] = useState<"cash" | "card" | "bank">("cash");
 const [refundAccountId, setRefundAccountId] = useState("");
 const [paymentAccounts, setPaymentAccounts] = useState<Array<{ _id: string; name: string; type: string; balance: number }>>([]);
 const [otpModalOpen, setOtpModalOpen] = useState(false);
 const [otpThreshold, setOtpThreshold] = useState<number>(50);
 const [otpCode, setOtpCode] = useState("");
 const [otpError, setOtpError] = useState<string | null>(null);
 const [otpSubmitting, setOtpSubmitting] = useState(false);

 const reference = sale?.reference ?? "";
 const customerName = sale?.customerName ?? "";
 const customerId =
 sale?.customerId == null
 ? undefined
 : typeof sale.customerId === "string"
 ? sale.customerId
 : (sale.customerId as { _id?: string })?._id;

 const fetchSaleAndLines = useCallback(async () => {
 if (!saleId) return;
 setLoading(true);
 setError(null);
 try {
 const [saleRes, linesRes] = await Promise.all([
 salesApi.getSaleById(saleId),
 salesApi.getReturnLines(saleId),
 ]);
 setSale(saleRes.data);
 setReturnLines(linesRes.data?.lines ?? []);
 setQtyInputs({});
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load sale");
 setSale(null);
 setReturnLines([]);
 } finally {
 setLoading(false);
 }
 }, [saleId]);

 useEffect(() => {
 fetchSaleAndLines();
 }, [fetchSaleAndLines]);

 useEffect(() => {
 if (returnType !== "refund") return;
 getPaymentAccounts()
 .then((list) => setPaymentAccounts(list))
 .catch(() => setPaymentAccounts([]));
 }, [returnType]);

 const refundMethodToAccountType: Record<"cash" | "card" | "bank", string> = {
 cash: "cash_drawer",
 card: "card",
 bank: "bank",
 };
 const refundAccountOptions = paymentAccounts.filter(
 (a) => a.type === refundMethodToAccountType[refundMethod]
 );
 useEffect(() => {
 if (returnType !== "refund") {
 setRefundAccountId("");
 return;
 }
 const options = paymentAccounts.filter((a) => a.type === refundMethodToAccountType[refundMethod]);
 setRefundAccountId((prev) => {
 if (options.length === 0) return prev;
 if (options.some((a) => a._id === prev)) return prev;
 return options[0]._id;
 });
 }, [returnType, refundMethod, paymentAccounts]);

 const addToBasketFromSelect = (line: ReturnLine, qty: number) => {
 if (qty < 1 || qty > line.qtyReturnable) return;
 const serials = line.returnableSerials.length > 0 ? line.returnableSerials.slice(0, qty) : undefined;
 setBasket((prev) => {
 const existing = prev.find((b) => b.lineIndex === line.lineIndex);
 if (existing) {
 const newQty = Math.min(line.qtyReturnable, existing.qtyToReturn + qty);
 const newSerials = line.returnableSerials.length > 0 ? line.returnableSerials.slice(0, newQty) : undefined;
 return prev.map((b) =>
  b.lineIndex === line.lineIndex ? { ...b, qtyToReturn: newQty, serials: newSerials } : b
 );
 }
 return [...prev, { lineIndex: line.lineIndex, sku: line.sku, name: line.name, price: line.price, qtyToReturn: qty, serials, returnDestination: "restock" as ReturnDestination }];
 });
 };

 const handleScanSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const serial = scanValue.trim();
 if (!serial) return;
 setScanError(null);
 const alreadyInBasket = basket.some((b) => b.serials?.includes(serial));
 if (alreadyInBasket) {
 setScanError("This serial is already in the return basket.");
 return;
 }
 try {
 const res = await salesApi.getFindBySerial(serial);
 const { saleId: foundSaleId, lineIndex, line, serial: foundSerial } = res.data;
 if (foundSaleId !== saleId) {
 setScanError(`Serial is from invoice ${res.data.reference}. Open that invoice to return it.`);
 return;
 }
 const rl = returnLines.find((l) => l.lineIndex === lineIndex) ?? {
 lineIndex,
 sku: line.sku,
 name: line.name,
 price: line.price,
 quantity: line.quantity,
 qtyAlreadyReturned: 0,
 qtyReturnable: 1,
 serialNumbers: line.serialNumbers ?? [],
 returnableSerials: [foundSerial],
 };
 addToBasketFromSelect(rl, 1);
 setScanValue("");
 } catch {
 const bySku = returnLines.find((l) => l.sku === serial || l.sku.toUpperCase() === serial.toUpperCase());
 if (bySku && bySku.qtyReturnable >= 1) {
 addToBasketFromSelect(bySku, 1);
 setScanValue("");
 } else {
 setScanError("Serial not sold / already returned. Or scan a SKU from this invoice.");
 }
 }
 };

 const removeFromBasket = (lineIndex: number) => {
 setBasket((prev) => prev.filter((b) => b.lineIndex !== lineIndex));
 };

 const setBasketDestination = (lineIndex: number, returnDestination: ReturnDestination) => {
 setBasket((prev) => prev.map((b) => (b.lineIndex === lineIndex ? { ...b, returnDestination } : b)));
 };

 const basketSubtotal = basket.reduce((sum, b) => sum + b.price * b.qtyToReturn, 0);

 const submitReturn = async (adminOtpCode?: string) => {
 const items = basket.map((b) => ({
 id: `basket-${b.lineIndex}`,
 product: b.name,
 sku: b.sku,
 netUnitPrice: b.price,
 stock: 0,
 quantity: b.qtyToReturn,
 discount: 0,
 taxPercent: 0,
 subtotal: round2(b.price * b.qtyToReturn),
 serialNumbers: b.serials ?? [],
 returnDestination: b.returnDestination ?? "restock",
 }));
 const total = round2(items.reduce((s, i) => s + i.subtotal, 0));
 await salesReturnApi.create({
 customer: { name: customerName || "Walk-in", avatar: "user", color: "bg-gray-100" },
 date: new Date().toISOString().slice(0, 10),
 reference: "",
 linkedInvoiceRef: reference,
 status: "Received",
 paymentStatus: returnType === "store_credit" ? "Unpaid" : "Paid",
 items,
 orderTax: 0,
 discount: 0,
 shipping: 0,
 paid: 0,
 total,
 due: total,
 grandTotal: total,
 returnType,
 customerId,
 refundMethod: returnType === "refund" ? refundMethod : undefined,
 refundAccountId: returnType === "refund" ? refundAccountId || undefined : undefined,
 adminOtpCode,
 });
 };

 const handleCreateReturn = async () => {
 if (basket.length === 0) {
 setMessage({ type: "error", text: "Add at least one item to the return basket." });
 return;
 }
 if (returnType === "refund" && !refundAccountId) {
 setMessage({ type: "error", text: "Please select the account (pot) to refund from." });
 return;
 }
 setSubmitting(true);
 setMessage({ type: "success", text: "" });
 try {
 await submitReturn();
 setMessage({ type: "success", text: "Return created. Redirecting…" });
 setTimeout(() => router.push("/sales-return"), 1500);
 } catch (e) {
 const err = e as Error & { code?: string; refundOtpThreshold?: number };
 if (err.code === "ADMIN_OTP_REQUIRED") {
 setOtpThreshold(err.refundOtpThreshold ?? 50);
 setOtpCode("");
 setOtpError(null);
 setOtpModalOpen(true);
 } else if (err.code === "ADMIN_2FA_NOT_SETUP") {
 setMessage({ type: "error", text: err.message });
 } else {
 setMessage({ type: "error", text: err.message || "Failed to create return" });
 }
 } finally {
 setSubmitting(false);
 }
 };

 const handleSubmitOtp = async () => {
 if (otpCode.length !== 6) {
 setOtpError("Enter the 6-digit code from Google Authenticator");
 return;
 }
 setOtpSubmitting(true);
 setOtpError(null);
 try {
 await submitReturn(otpCode);
 setOtpModalOpen(false);
 setMessage({ type: "success", text: "Return created. Redirecting…" });
 setTimeout(() => router.push("/sales-return"), 1500);
 } catch (e) {
 const err = e as Error & { code?: string };
 if (err.code === "ADMIN_OTP_INVALID" || err.code === "ADMIN_OTP_REQUIRED") {
 setOtpError(err.message || "Invalid code");
 } else {
 setOtpError(err.message || "Failed to create return");
 }
 } finally {
 setOtpSubmitting(false);
 }
 };

 function round2(n: number) {
 return Math.round(n * 100) / 100;
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
 </div>
 );
 }

 if (error || !sale) {
 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <div className="max-w-lg mx-auto bg-white rounded-lg border border-gray-200 p-6">
  <p className="text-red-600 font-medium">{error || "Sale not found"}</p>
  <Link
  href="/sales-return"
  className="mt-4 inline-flex items-center gap-2 text-orange-600 hover:underline"
  >
  <ArrowLeft size={18} />
  Back to Sales Return
  </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
 <div className="max-w-5xl mx-auto">
 <div className="mb-6 flex flex-wrap items-center gap-4">
  <Link
  href={`/sales-online-orders/edit/${saleId}`}
  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
  >
  <ArrowLeft size={20} />
  Back to invoice
  </Link>
  <div className="flex-1 min-w-0">
  <h1 className="text-xl font-bold text-gray-900">Start return</h1>
  <p className="text-sm text-gray-500 font-mono">{reference}</p>
  {customerName && <p className="text-sm text-gray-600">{customerName}</p>}
  </div>
 </div>

 {message.text && (
  <div
  className={`mb-4 px-4 py-2 rounded-xl text-sm font-medium ${
  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }`}
  >
  {message.text}
  </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Tabs + content */}
  <div className="lg:col-span-2 space-y-4">
  <div className="flex rounded-xl border border-gray-200 bg-white p-1">
  <button
  type="button"
  onClick={() => setActiveTab("select")}
  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
   activeTab === "select" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  <FileText size={18} />
  Select from invoice
  </button>
  <button
  type="button"
  onClick={() => setActiveTab("scan")}
  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
   activeTab === "scan" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
  }`}
  >
  <ScanLine size={18} />
  Scan item / serial
  </button>
  </div>

  {activeTab === "select" && (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
   <table className="w-full text-sm">
   <thead className="bg-gray-50 border-b border-gray-200">
   <tr>
   <th className="text-left px-4 py-3 font-medium text-gray-700">Product</th>
   <th className="text-right px-4 py-3 font-medium text-gray-700">Price</th>
   <th className="text-right px-4 py-3 font-medium text-gray-700">Qty bought</th>
   <th className="text-right px-4 py-3 font-medium text-gray-700">Returnable</th>
   <th className="text-right px-4 py-3 font-medium text-gray-700">Qty to return</th>
   <th className="w-20 px-4 py-3" />
   </tr>
   </thead>
   <tbody className="divide-y divide-gray-100">
   {returnLines.map((line) => (
   <tr key={line.lineIndex} className="hover:bg-gray-50/50">
    <td className="px-4 py-3 font-medium text-gray-900">{line.name}</td>
    <td className="px-4 py-3 text-right text-gray-700">{formatMoney(line.price)}</td>
    <td className="px-4 py-3 text-right text-gray-700">{line.quantity}</td>
    <td className="px-4 py-3 text-right text-gray-700">{line.qtyReturnable}</td>
    <td className="px-4 py-3">
    <input
    type="number"
    min={0}
    max={line.qtyReturnable}
    value={qtyInputs[line.lineIndex] ?? ""}
    onChange={(e) =>
    setQtyInputs((prev) => ({
     ...prev,
     [line.lineIndex]: Math.max(0, parseInt(e.target.value, 10) || 0),
    }))
    }
    className="w-16 text-right border border-gray-200 rounded-lg px-2 py-1"
    />
    </td>
    <td className="px-4 py-3">
    <button
    type="button"
    onClick={() => addToBasketFromSelect(line, qtyInputs[line.lineIndex] || 1)}
    disabled={(qtyInputs[line.lineIndex] || 0) < 1 || (qtyInputs[line.lineIndex] || 0) > line.qtyReturnable}
    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-40 disabled:pointer-events-none"
    title="Add to basket"
    >
    <Plus size={18} />
    </button>
    </td>
   </tr>
   ))}
   </tbody>
   </table>
  </div>
  {returnLines.length === 0 && (
   <p className="p-6 text-center text-gray-500">No items on this invoice or all already returned.</p>
  )}
  </div>
  )}

  {activeTab === "scan" && (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
  <p className="text-sm text-gray-600 mb-3">Scan serial number or barcode to add the item to the return basket.</p>
  <form onSubmit={handleScanSubmit} className="flex gap-2">
   <input
   type="text"
   value={scanValue}
   onChange={(e) => { setScanValue(e.target.value); setScanError(null); }}
   placeholder="Scan or type serial / SKU"
   className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
   autoFocus
   />
   <button
   type="submit"
   className="px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
   >
   Add
   </button>
  </form>
  {scanError && <p className="mt-2 text-sm text-red-600">{scanError}</p>}
  </div>
  )}
  </div>

  {/* Basket */}
  <div className="lg:col-span-1">
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-4">
  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
  <ShoppingCart size={20} className="text-orange-500" />
  <span className="font-semibold text-gray-900">Return basket</span>
  {basket.length > 0 && (
   <span className="ml-auto text-sm text-gray-500">{basket.length} line{basket.length !== 1 ? "s" : ""}</span>
  )}
  </div>
  <div className="p-4 max-h-64 overflow-y-auto">
  {basket.length === 0 ? (
   <p className="text-sm text-gray-500">Add items from the invoice or by scanning.</p>
  ) : (
   <ul className="space-y-3">
   {basket.map((b) => (
   <li key={b.lineIndex} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
   <div className="flex items-start justify-between gap-2">
    <div className="min-w-0">
    <p className="font-medium text-gray-900 truncate">{b.name}</p>
    <p className="text-gray-500">Qty: {b.qtyToReturn} × {formatMoney(b.price)}</p>
    </div>
    <div className="shrink-0 flex items-center gap-1">
    <span className="font-medium text-gray-900">{formatMoney(b.price * b.qtyToReturn)}</span>
    <button
    type="button"
    onClick={() => removeFromBasket(b.lineIndex)}
    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
    aria-label="Remove"
    >
    <Trash2 size={16} />
    </button>
    </div>
   </div>
   <div className="mt-2">
    <label className="block text-xs font-medium text-gray-500 mb-1">Where does this go?</label>
    <select
    value={b.returnDestination ?? "restock"}
    onChange={(e) => setBasketDestination(b.lineIndex, e.target.value as ReturnDestination)}
    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
    >
    {(Object.keys(DESTINATION_LABELS) as ReturnDestination[]).map((d) => (
    <option key={d} value={d}>
    {DESTINATION_LABELS[d]}
    </option>
    ))}
    </select>
   </div>
   </li>
   ))}
   </ul>
  )}
  </div>
  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-4">
  {basket.length > 0 && (
   <div className="space-y-2">
   <p className="text-sm font-medium text-gray-700">Return type</p>
   <div className="flex gap-2">
   <button
   type="button"
   onClick={() => setReturnType("store_credit")}
   className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
    returnType === "store_credit"
    ? "bg-green-600 text-white"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
   }`}
   >
   Store credit
   </button>
   <button
   type="button"
   onClick={() => setReturnType("refund")}
   className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
    returnType === "refund"
    ? "bg-orange-500 text-white"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
   }`}
   >
   Refund
   </button>
   </div>
   {returnType === "store_credit" && (
   <p className="text-xs text-gray-500">
   Add {formatMoney(basketSubtotal)} to customer&apos;s store credit.
   </p>
   )}
   {returnType === "refund" && (
   <div className="space-y-2">
   <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">Refund method</label>
    <select
    value={refundMethod}
    onChange={(e) => setRefundMethod(e.target.value as "cash" | "card" | "bank")}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
    >
    <option value="cash">Cash</option>
    <option value="card">Card</option>
    <option value="bank">Bank transfer</option>
    </select>
   </div>
   <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">Refund from account (pot)</label>
    <select
    value={refundAccountId}
    onChange={(e) => setRefundAccountId(e.target.value)}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
    >
    <option value="">Select account</option>
    {refundAccountOptions.map((a) => (
    <option key={a._id} value={a._id}>
    {a.name} — {formatMoney(a.balance)}
    </option>
    ))}
    </select>
    {refundAccountOptions.length === 0 && paymentAccounts.length > 0 && (
    <p className="text-xs text-neutral-600 mt-0.5">No {refundMethod} account. Add one in settings or choose another method.</p>
    )}
   </div>
   </div>
   )}
   </div>
  )}
  <div className="flex justify-between text-sm font-medium text-gray-700">
   <span>Subtotal</span>
   <span>{formatMoney(basketSubtotal)}</span>
  </div>
  <button
   type="button"
   onClick={handleCreateReturn}
   disabled={basket.length === 0 || submitting}
   className="w-full py-3 px-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
  >
   {submitting ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20} />}
   {submitting ? "Creating…" : "Create return"}
  </button>
  </div>
  </div>
  </div>
 </div>
 </div>

 {otpModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
  <button
   type="button"
   onClick={() => { if (!otpSubmitting) { setOtpModalOpen(false); setOtpCode(""); setOtpError(null); } }}
   className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
   aria-label="Close"
  >
   <X size={20} />
  </button>
  <div className="flex items-center gap-3 mb-3">
   <div className="p-2 bg-orange-50 rounded-lg">
   <ShieldCheck className="h-6 w-6 text-orange-500" />
   </div>
   <div>
   <h3 className="text-lg font-semibold text-gray-900">Admin approval required</h3>
   <p className="text-xs text-gray-500">Refund of {formatMoney(basketSubtotal)} exceeds {formatMoney(otpThreshold)}.</p>
   </div>
  </div>
  <p className="text-sm text-gray-600 mb-4">
   Ask the admin to open <strong>Google Authenticator</strong> and enter the current 6-digit code.
  </p>
  <input
   type="text"
   inputMode="numeric"
   autoComplete="one-time-code"
   maxLength={6}
   autoFocus
   value={otpCode}
   onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }}
   onKeyDown={(e) => { if (e.key === "Enter" && otpCode.length === 6 && !otpSubmitting) handleSubmitOtp(); }}
   placeholder="123456"
   className="w-full rounded-lg border border-gray-300 px-4 py-3 text-2xl text-center tracking-[0.5em] font-mono text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  />
  {otpError && <p className="text-sm text-red-600 mt-2">{otpError}</p>}
  <div className="flex items-center justify-end gap-2 mt-5">
   <button
   type="button"
   onClick={() => { setOtpModalOpen(false); setOtpCode(""); setOtpError(null); }}
   disabled={otpSubmitting}
   className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
   >
   Cancel
   </button>
   <button
   type="button"
   onClick={handleSubmitOtp}
   disabled={otpCode.length !== 6 || otpSubmitting}
   className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   {otpSubmitting && <Loader2 size={16} className="animate-spin" />}
   Approve refund
   </button>
  </div>
  </div>
 </div>
 )}
 </div>
 );
}

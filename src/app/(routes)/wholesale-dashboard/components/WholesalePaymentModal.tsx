"use client";

import React, { useState, useEffect } from "react";
import { X, Banknote, CreditCard, Wallet, Landmark, Printer, Mail, Receipt, CheckCircle, Download } from "lucide-react";
import { downloadInvoiceA4, printInvoiceA4, printReceipt80mm, type SaleForPrint } from "@/lib/invoicePrint";
import { printReceipt as printReceiptSilent } from "@/services/printService";
import { useAppCurrency } from "@/lib/app-currency-context";
import { bankAccountApi } from "../../bank-accounts/service/bankAccountApi";

const parseAmount = (s: string): number => {
 const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
 return isNaN(n) ? 0 : n;
};

const PAYMENT_METHODS = [
 { id: "cash" as const, label: "Cash", icon: Banknote },
 { id: "card" as const, label: "Card", icon: CreditCard },
 { id: "credit" as const, label: "Credit", icon: Wallet },
 { id: "bank" as const, label: "Bank", icon: Landmark },
] as const;

type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

/** Payment details passed when order is completed (for saving the transaction) */
export interface WholesalePaymentDetails {
 /** Resolved discount in currency (after percent → £ conversion). */
 discount: number;
 /** "flat" = £ amount, "percent" = % of total */
 discountType: "flat" | "percent";
 /** Raw input value (£ when flat, percent number when percent) */
 discountValue: number;
 additionalPayment: number;
 previousBalance: number;
 amountDue: number;
 payments: { cash: number; card: number; credit: number; bank: number };
 bankAccount: string;
}

interface WholesalePaymentModalProps {
 open: boolean;
 total: number;
 onClose: () => void;
 onComplete: (details: WholesalePaymentDetails) => void;
 customerName?: string;
 /** Customer email (for Email invoice) */
 customerEmail?: string;
 /** Customer's previous/outstanding balance (added to amount due) */
 previousBalance?: number;
 /** When true, show Print / Email / Receipt options (after order created) */
 showInvoiceStep?: boolean;
 /** Sale data for printing invoice or receipt (only set after order created) */
 saleForPrint?: SaleForPrint | null;
 /** Called when user clicks Done on the invoice step */
 onDone?: () => void;
 /** Initial discount (e.g. when editing an existing sale) */
 initialDiscount?: number;
 /** Initial discount type when editing */
 initialDiscountType?: "flat" | "percent";
 /** Initial discount raw input value when editing (overrides initialDiscount when present) */
 initialDiscountValue?: number;
 /** Primary button label (e.g. "Save changes" for edit sale) */
 primaryButtonLabel?: string;
 /** Pre-fill payment amounts (e.g. when editing an existing sale so user sees recorded payments) */
 initialPayments?: { cash?: number; card?: number; credit?: number; bank?: number };
 /** Optional: show a short message (e.g. toast) for receipt print feedback */
 onMessage?: (type: "success" | "error", text: string) => void;
 /** When true (Retail/Walk-in mode): hide Credit, require full payment (no balance due). */
 retailMode?: boolean;
}

export const WholesalePaymentModal: React.FC<WholesalePaymentModalProps> = ({
 open,
 total,
 onClose,
 onComplete,
 customerName,
 customerEmail,
 previousBalance = 0,
 showInvoiceStep = false,
 saleForPrint = null,
 onDone,
 initialDiscount,
 initialDiscountType,
 initialDiscountValue,
 primaryButtonLabel = "Create Order",
 initialPayments,
 onMessage,
 retailMode = false,
}) => {
 const { formatMoney } = useAppCurrency();
 const [discount, setDiscount] = useState("");
 const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
 const [checkedMethods, setCheckedMethods] = useState<Record<MethodId, boolean>>({
 cash: false,
 card: false,
 credit: false,
 bank: false,
 });
 const [amounts, setAmounts] = useState<Record<MethodId, string>>({
 cash: "",
 card: "",
 credit: "",
 bank: "",
 });
 const [defaultBankName, setDefaultBankName] = useState<string>("");
 const [error, setError] = useState<string | null>(null);

 const discountInput = parseAmount(discount);
 const previousBalanceNum = Math.max(0, previousBalance);
 const discountNum = (() => {
 if (discountType === "percent") {
  const pct = Math.min(100, Math.max(0, discountInput));
  return Math.round(((total * pct) / 100) * 100) / 100;
 }
 return Math.min(Math.max(0, discountInput), total);
 })();
 const amountDue = Math.max(0, total - discountNum + previousBalanceNum);

 useEffect(() => {
 if (!open) {
 setDiscount("");
 setDiscountType("flat");
 setCheckedMethods({ cash: false, card: false, credit: false, bank: false });
 setAmounts({ cash: "", card: "", credit: "", bank: "" });
 setError(null);
 } else {
 if (initialDiscountType) setDiscountType(initialDiscountType);
 if (initialDiscountValue != null && initialDiscountValue > 0) {
 setDiscount(String(initialDiscountValue));
 } else if (initialDiscount != null) {
 setDiscount(initialDiscount.toFixed(2));
 }
 if (initialPayments) {
 const cash = Number(initialPayments.cash) || 0;
 const card = Number(initialPayments.card) || 0;
 const credit = Number(initialPayments.credit) || 0;
 const bank = Number(initialPayments.bank) || 0;
 setAmounts({
  cash: cash > 0 ? cash.toFixed(2) : "",
  card: card > 0 ? card.toFixed(2) : "",
  credit: credit > 0 ? credit.toFixed(2) : "",
  bank: bank > 0 ? bank.toFixed(2) : "",
 });
 setCheckedMethods({
  cash: cash > 0,
  card: card > 0,
  credit: credit > 0,
  bank: bank > 0,
 });
 }
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps -- only apply initial values when modal opens
 }, [open]);

 useEffect(() => {
 if (!open) return;
 bankAccountApi
 .getAccounts()
 .then((res) => {
 const list = res.data ?? [];
 const defaultOrFirst = list.find((a) => a.isDefault) ?? list[0];
 setDefaultBankName(defaultOrFirst?.accountName ?? "");
 })
 .catch(() => setDefaultBankName(""));
 }, [open]);

 const toggleMethod = (id: MethodId) => {
 setCheckedMethods((prev) => {
 const next = { ...prev, [id]: !prev[id] };
 if (next[id]) {
 const othersChecked = (PAYMENT_METHODS as readonly { id: MethodId }[])
  .filter((m) => m.id !== id && next[m.id])
  .length;
 if (othersChecked === 0) setAmounts((a) => ({ ...a, [id]: amountDue.toFixed(2) }));
 } else {
 setAmounts((a) => ({ ...a, [id]: "" }));
 }
 return next;
 });
 };

 const setAmount = (id: MethodId, value: string) => {
 setAmounts((prev) => ({ ...prev, [id]: value }));
 };

 const getEnteredTotal = (): number => {
 return (PAYMENT_METHODS as readonly { id: MethodId }[]).reduce(
 (sum, m) => sum + parseAmount(amounts[m.id]),
 0
 );
 };

 const dueRounded = Math.round(amountDue * 100) / 100;
 const paidNow = parseAmount(amounts.cash) + parseAmount(amounts.card) + parseAmount(amounts.bank);
 const creditAuto = retailMode ? 0 : Math.max(0, dueRounded - paidNow);
 const enteredTotal = paidNow + (retailMode ? 0 : parseAmount(amounts.credit));
 const remaining = Math.max(0, dueRounded - paidNow);
 const overpayment = paidNow > dueRounded + 0.01 ? Math.round((paidNow - dueRounded) * 100) / 100 : 0;
 const paymentMethodsToShow = retailMode
 ? (PAYMENT_METHODS as readonly { id: MethodId; label: string; icon: React.ElementType }[]).filter((m) => m.id !== "credit")
 : PAYMENT_METHODS;

 const buildDetails = (paymentsOverride?: { cash: number; card: number; credit: number; bank: number }): WholesalePaymentDetails => {
 const due = dueRounded;
 const baseDetails = {
 discount: discountNum,
 discountType,
 discountValue: discountInput,
 additionalPayment: 0,
 previousBalance: previousBalanceNum,
 amountDue: due,
 bankAccount: defaultBankName || "Default",
 };
 if (paymentsOverride) {
 return { ...baseDetails, payments: paymentsOverride };
 }
 const creditAmount = retailMode ? 0 : Math.max(0, due - paidNow);
 return {
 ...baseDetails,
 payments: {
 cash: parseAmount(amounts.cash),
 card: parseAmount(amounts.card),
 credit: creditAmount,
 bank: parseAmount(amounts.bank),
 },
 };
 };

 const handleCreateSales = () => {
 setError(null);
 const due = dueRounded;
 if (retailMode) {
 if (paidNow < due - 0.01) {
 const remaining = Math.round((due - paidNow) * 100) / 100;
 setError(`Retail mode requires full payment. Remaining: ${formatMoney(remaining)}`);
 return;
 }
 }
 if (paidNow > due + 0.01) {
 setError(`Payment total ${formatMoney(paidNow)} cannot exceed Amount Due ${formatMoney(due)}. Use Refund or Store credit below.`);
 return;
 }
 onComplete(buildDetails());
 };

 const handleRefund = () => {
 setError(null);
 const due = dueRounded;
 if (paidNow <= due + 0.01) return;
 const totalPaid = paidNow;
 const scale = totalPaid > 0 ? due / totalPaid : 0;
 const cappedPayments = {
 cash: Math.round(parseAmount(amounts.cash) * scale * 100) / 100,
 card: Math.round(parseAmount(amounts.card) * scale * 100) / 100,
 bank: Math.round(parseAmount(amounts.bank) * scale * 100) / 100,
 credit: 0,
 };
 const sum = cappedPayments.cash + cappedPayments.card + cappedPayments.bank;
 const diff = Math.round((due - sum) * 100) / 100;
 if (diff !== 0) cappedPayments.cash = Math.round((cappedPayments.cash + diff) * 100) / 100;
 onComplete(buildDetails(cappedPayments));
 };

 const handleRefundFrom = (method: MethodId) => {
 setError(null);
 if (overpayment <= 0) return;
 const cashAmt = parseAmount(amounts.cash);
 const cardAmt = parseAmount(amounts.card);
 const bankAmt = parseAmount(amounts.bank);
 const reduceBy = Math.round(overpayment * 100) / 100;
 let cappedPayments: { cash: number; card: number; credit: number; bank: number };
 if (method === "cash") {
 cappedPayments = {
 cash: Math.max(0, Math.round((cashAmt - reduceBy) * 100) / 100),
 card: cardAmt,
 bank: bankAmt,
 credit: 0,
 };
 } else if (method === "card") {
 cappedPayments = {
 cash: cashAmt,
 card: Math.max(0, Math.round((cardAmt - reduceBy) * 100) / 100),
 bank: bankAmt,
 credit: 0,
 };
 } else {
 cappedPayments = {
 cash: cashAmt,
 card: cardAmt,
 bank: Math.max(0, Math.round((bankAmt - reduceBy) * 100) / 100),
 credit: 0,
 };
 }
 const sum = cappedPayments.cash + cappedPayments.card + cappedPayments.bank;
 const diff = Math.round((dueRounded - sum) * 100) / 100;
 if (Math.abs(diff) > 0.01) cappedPayments.cash = Math.round((cappedPayments.cash + diff) * 100) / 100;
 onComplete(buildDetails(cappedPayments));
 };

 const handleStoreCredit = () => {
 setError(null);
 const due = dueRounded;
 const fullPayments = {
 cash: parseAmount(amounts.cash),
 card: parseAmount(amounts.card),
 bank: parseAmount(amounts.bank),
 credit: 0,
 };
 onComplete(buildDetails(fullPayments));
 };

 const handlePrintInvoice = () => {
 if (saleForPrint) {
 printInvoiceA4(saleForPrint).catch(() => {});
 }
 };

 const handleDownloadInvoice = () => {
 if (saleForPrint) {
 downloadInvoiceA4(saleForPrint).catch(() => {});
 }
 };

 const handleReceiptPrint = async () => {
 if (!saleForPrint) return;
 const result = await printReceiptSilent(saleForPrint._id);
 if (result.sent) {
 onMessage?.("success", "Receipt sent to printer");
 } else {
 printReceipt80mm(saleForPrint).catch(() => {});
 onMessage?.("error", result.error ?? "Silent print failed. Opening receipt in browser.");
 }
 };

 const handleEmailInvoice = () => {
 const to = customerEmail ? encodeURIComponent(customerEmail) : "";
 const subject = encodeURIComponent(`Invoice - Order for ${customerName || "Customer"}`);
 const body = encodeURIComponent(`Please find your invoice attached.\n\nOrder for: ${customerName || "Customer"}\nTotal: ${formatMoney(total)}`);
 window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
 };

 if (!open) return null;

 if (showInvoiceStep) {
 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
 <div className="absolute inset-0 bg-black/50" aria-hidden />
 <div
  role="dialog"
  aria-modal="true"
  aria-labelledby="wholesale-invoice-title"
  className={`relative w-full bg-white rounded-t-2xl sm:rounded-lg shadow-2xl overflow-hidden flex flex-col ${retailMode ? "sm:max-w-lg" : "sm:max-w-3xl"}`}
 >
  <div className="flex items-center justify-between p-5 pb-4">
  <div className="flex items-center gap-3">
  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
  <CheckCircle className="h-7 w-7" />
  </div>
  <div>
  <h2 id="wholesale-invoice-title" className="text-xl font-semibold text-gray-900">
   Order created
  </h2>
  {saleForPrint?.reference && (
   <p className="text-sm text-gray-500 mt-0.5 font-mono">Ref: {saleForPrint.reference}</p>
  )}
  </div>
  </div>
  <button
  onClick={onClose}
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 touch-manipulation text-gray-500"
  aria-label="Close"
  >
  <X className="h-5 w-5" />
  </button>
  </div>
  <div className="px-5 pb-5">
  <p className="text-gray-600 text-sm mb-4">What would you like to do next?</p>
  <div
  className={`grid grid-cols-1 gap-3 ${retailMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
  >
  {!retailMode && (
  <>
   <button
   type="button"
   onClick={handlePrintInvoice}
   disabled={!saleForPrint}
   className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-gray-700 font-medium hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-gray-50/50 disabled:hover:text-gray-700"
   >
   <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600">
   <Printer className="h-6 w-6" />
   </span>
   <span className="text-sm">Print invoice</span>
   </button>
   <button
   type="button"
   onClick={handleDownloadInvoice}
   disabled={!saleForPrint}
   className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-gray-700 font-medium hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-gray-50/50 disabled:hover:text-gray-700"
   >
   <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600">
   <Download className="h-6 w-6" />
   </span>
   <span className="text-sm">Download invoice</span>
   </button>
  </>
  )}
  {retailMode && (
  <button
   type="button"
   onClick={handleReceiptPrint}
   disabled={!saleForPrint}
   className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-gray-700 font-medium hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-gray-50/50 disabled:hover:text-gray-700"
  >
   <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 group-hover:border-slate-300 group-hover:bg-slate-100 text-gray-500 group-hover:text-slate-600">
   <Receipt className="h-6 w-6" />
   </span>
   <span className="text-sm">Receipt print</span>
  </button>
  )}
  <button
  type="button"
  onClick={handleEmailInvoice}
  className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-gray-700 font-medium hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 active:scale-[0.98] transition-all touch-manipulation"
  >
  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600">
   <Mail className="h-6 w-6" />
  </span>
  <span className="text-sm">Email invoice</span>
  </button>
  </div>
  </div>
  <div className="p-5 pt-0">
  <button
  type="button"
  onClick={onDone ?? onClose}
  className="w-full min-h-[48px] py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
  >
  Done
  </button>
  </div>
 </div>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
 <div className="absolute inset-0 bg-black/50" aria-hidden />
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="wholesale-payment-title"
 className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
 >
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 id="wholesale-payment-title" className="text-lg font-semibold text-gray-900">
  Complete Order
  </h2>
  <button
  onClick={onClose}
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
  aria-label="Close"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <div className="overflow-y-auto touch-scroll flex-1 p-4 sm:p-6 space-y-5">
  {customerName && (
  <div className="text-sm text-gray-600">
  <span className="font-medium">Account:</span> {customerName}
  </div>
  )}

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
  <div className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 font-medium">
  {formatMoney(total)}
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
  <div className="flex items-stretch h-[50px] rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden bg-white">
  <input
  type="text"
  inputMode="decimal"
  value={discount}
  onChange={(e) => setDiscount(e.target.value.replace(/[^0-9.]/g, ""))}
  placeholder={discountType === "percent" ? "0" : "0.00"}
  className="flex-1 min-w-0 px-4 bg-transparent focus:outline-none"
  />
  <div className="flex shrink-0 border-l border-gray-300">
  <button
   type="button"
   onClick={() => setDiscountType("flat")}
   className={`w-12 text-sm font-semibold transition-colors ${
   discountType === "flat" ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
   }`}
   aria-pressed={discountType === "flat"}
  >
   £
  </button>
  <button
   type="button"
   onClick={() => setDiscountType("percent")}
   className={`w-12 text-sm font-semibold transition-colors border-l border-gray-300 ${
   discountType === "percent" ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
   }`}
   aria-pressed={discountType === "percent"}
  >
   %
  </button>
  </div>
  </div>
  {discountNum > 0 && (
  <p className="mt-1 text-xs text-gray-500">
  Applied: −{formatMoney(discountNum)}
  {discountType === "percent" && discountInput > 0 && ` (${Math.min(100, discountInput)}%)`}
  </p>
  )}
  </div>
  <div>
  {previousBalanceNum > 0 && (
  <>
   <label className="block text-sm font-medium text-gray-700 mb-1">
   Previous balance (outstanding)
   </label>
   <div className="px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-neutral-800 font-semibold">
   {formatMoney(previousBalanceNum)}
   </div>
  </>
  )}
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
  <div className="px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-bold">
  {formatMoney(amountDue)}
  </div>
  </div>
  </div>

  <div>
  <p className="text-sm font-medium text-gray-700 mb-3">Payment method</p>
  <p className="text-xs text-gray-500 mb-2">
  {retailMode
  ? "Retail mode: full payment required (Cash, Card, Bank). No credit."
  : "Cash, Card and Bank are payments received (balance reduces). Any remainder is automatically applied as Credit (stays on account). Enter amounts for Cash/Card/Bank only; the rest goes to Credit."}
  </p>
  <div className="flex flex-wrap gap-2">
  {paymentMethodsToShow.map(({ id, label, icon: Icon }) => (
  <label
   key={id}
   className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer touch-manipulation min-h-[44px] ${
   checkedMethods[id]
   ? "border-blue-500 bg-blue-50 text-blue-700"
   : "border-gray-200 hover:border-gray-300"
   }`}
  >
   <input
   type="checkbox"
   checked={checkedMethods[id]}
   onChange={() => toggleMethod(id)}
   className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
   />
   <Icon className="h-5 w-5" />
   <span className="font-medium">{label}</span>
  </label>
  ))}
  </div>
  </div>

  <div className="space-y-3">
  {checkedMethods.cash && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount</label>
  <input
   type="text"
   inputMode="decimal"
   value={amounts.cash}
   onChange={(e) => setAmount("cash", e.target.value.replace(/[^0-9.]/g, ""))}
   placeholder="0.00"
   className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
  />
  </div>
  )}
  {checkedMethods.card && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Card Amount</label>
  <input
   type="text"
   inputMode="decimal"
   value={amounts.card}
   onChange={(e) => setAmount("card", e.target.value.replace(/[^0-9.]/g, ""))}
   placeholder="0.00"
   className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
  />
  </div>
  )}
  {dueRounded > 0 && !retailMode && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Credit (remainder, auto)</label>
  <div className="px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-neutral-800 font-semibold tabular-nums">
   {formatMoney(creditAuto)}
  </div>
  </div>
  )}
  {checkedMethods.bank && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Amount</label>
  {defaultBankName && (
   <p className="text-xs text-gray-500 mb-1">Bank: {defaultBankName}</p>
  )}
  <input
   type="text"
   inputMode="decimal"
   value={amounts.bank}
   onChange={(e) => setAmount("bank", e.target.value.replace(/[^0-9.]/g, ""))}
   placeholder="0.00"
   className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
  />
  </div>
  )}
  {(checkedMethods.cash || checkedMethods.bank || checkedMethods.credit || checkedMethods.card) && (
  <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
  <span className="text-gray-600">
   Cash/Card/Bank: <strong className="tabular-nums">{formatMoney(paidNow)}</strong>
  </span>
  <span className="text-gray-600">
   Due: <strong className="tabular-nums text-blue-600">{formatMoney(dueRounded)}</strong>
  </span>
  {remaining > 0 && !retailMode && (
   <span className="text-neutral-700 font-medium">
   Remainder on credit: <strong className="tabular-nums">{formatMoney(remaining)}</strong>
   </span>
  )}
  {remaining > 0 && retailMode && (
   <span className="text-red-700 font-medium">
   Full payment required. Remaining: <strong className="tabular-nums">{formatMoney(remaining)}</strong>
   </span>
  )}
  {paidNow > dueRounded + 0.01 && (
   <span className="text-red-600 font-medium">
   Payment exceeds due by {formatMoney(paidNow - dueRounded)}
   </span>
  )}
  </div>
  )}
  </div>

  {overpayment > 0 && (
  <div className="p-4 rounded-xl border-2 border-neutral-200 bg-neutral-50 space-y-3">
  <p className="text-sm font-medium text-neutral-800">
  Payment exceeds due by {formatMoney(overpayment)}. Choose how to handle the excess:
  </p>
  <div className="space-y-2">
  <p className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
   Refund {formatMoney(overpayment)} from:
  </p>
  <div className="flex flex-wrap gap-2">
   {parseAmount(amounts.cash) >= overpayment - 0.01 && (
   <button
   type="button"
   onClick={() => handleRefundFrom("cash")}
   className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orange-500 bg-white text-neutral-800 font-semibold hover:bg-neutral-50 transition-colors"
   >
   <Banknote className="h-4 w-4" />
   Cash ({formatMoney(parseAmount(amounts.cash))})
   </button>
   )}
   {parseAmount(amounts.card) >= overpayment - 0.01 && (
   <button
   type="button"
   onClick={() => handleRefundFrom("card")}
   className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orange-500 bg-white text-neutral-800 font-semibold hover:bg-neutral-50 transition-colors"
   >
   <CreditCard className="h-4 w-4" />
   Card ({formatMoney(parseAmount(amounts.card))})
   </button>
   )}
   {parseAmount(amounts.bank) >= overpayment - 0.01 && (
   <button
   type="button"
   onClick={() => handleRefundFrom("bank")}
   className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orange-500 bg-white text-neutral-800 font-semibold hover:bg-neutral-50 transition-colors"
   >
   <Landmark className="h-4 w-4" />
   Bank ({formatMoney(parseAmount(amounts.bank))})
   </button>
   )}
  </div>
  <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-200/80">
   <button
   type="button"
   onClick={handleRefund}
   className="text-sm font-medium text-neutral-700 hover:text-neutral-900 underline"
   >
   Refund proportionally
   </button>
   <span className="text-neutral-600">|</span>
   <button
   type="button"
   onClick={handleStoreCredit}
   className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
   >
   Store credit {formatMoney(overpayment)}
   </button>
  </div>
  </div>
  </div>
  )}

  {error && (
  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
  )}
 </div>

 <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3">
  <button
  type="button"
  onClick={onClose}
  className="flex-1 min-h-[52px] py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
  >
  Close
  </button>
  <button
  type="button"
  onClick={handleCreateSales}
  disabled={overpayment > 0 || (retailMode && remaining > 0.01)}
  className="flex-1 min-h-[52px] py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {primaryButtonLabel}
  </button>
 </div>
 </div>
 </div>
 );
};

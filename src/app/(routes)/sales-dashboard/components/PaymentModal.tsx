"use client";

import React from "react";
import { X, Banknote, CreditCard, Wallet, Landmark } from "lucide-react";
import type { PaymentMethod } from "../types";
import { useAppCurrency } from "@/lib/app-currency-context";

interface PaymentModalProps {
 open: boolean;
 total: number;
 paymentMethod: PaymentMethod;
 onPaymentMethodChange: (m: PaymentMethod) => void;
 onClose: () => void;
 onComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
 open,
 total,
 paymentMethod,
 onPaymentMethodChange,
 onClose,
 onComplete,
}) => {
 const { formatMoney } = useAppCurrency();
 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
 <div
 className="absolute inset-0 bg-black/50"
 aria-hidden
 />
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="payment-title"
 className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
 >
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 id="payment-title" className="text-lg font-semibold text-gray-900">
  Complete Payment
  </h2>
  <button
  onClick={onClose}
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
  aria-label="Close"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <div className="p-4 sm:p-6 space-y-6">
  <div className="text-center py-4">
  <p className="text-gray-500 text-sm">Amount due</p>
  <p className="text-3xl font-bold text-orange-600">
  {formatMoney(total)}
  </p>
  </div>

  <div>
  <p className="text-sm font-medium text-gray-700 mb-3">
  Payment method
  </p>
  <div className="grid grid-cols-2 gap-3">
  <button
  type="button"
  onClick={() => onPaymentMethodChange("cash")}
  className={`flex items-center justify-center gap-2 min-h-[52px] p-4 rounded-xl border-2 transition-colors touch-manipulation ${
   paymentMethod === "cash"
   ? "border-orange-500 bg-orange-50 text-orange-700"
   : "border-gray-200 hover:border-gray-300 active:bg-gray-100"
  }`}
  >
  <Banknote className="h-6 w-6" />
  <span className="font-medium">Cash</span>
  </button>
  <button
  type="button"
  onClick={() => onPaymentMethodChange("card")}
  className={`flex items-center justify-center gap-2 min-h-[52px] p-4 rounded-xl border-2 transition-colors touch-manipulation ${
   paymentMethod === "card"
   ? "border-orange-500 bg-orange-50 text-orange-700"
   : "border-gray-200 hover:border-gray-300 active:bg-gray-100"
  }`}
  >
  <CreditCard className="h-6 w-6" />
  <span className="font-medium">Card</span>
  </button>
  <button
  type="button"
  onClick={() => onPaymentMethodChange("credit")}
  className={`flex items-center justify-center gap-2 min-h-[52px] p-4 rounded-xl border-2 transition-colors touch-manipulation ${
   paymentMethod === "credit"
   ? "border-orange-500 bg-orange-50 text-orange-700"
   : "border-gray-200 hover:border-gray-300 active:bg-gray-100"
  }`}
  >
  <Wallet className="h-6 w-6" />
  <span className="font-medium">Credit</span>
  </button>
  <button
  type="button"
  onClick={() => onPaymentMethodChange("bank")}
  className={`flex items-center justify-center gap-2 min-h-[52px] p-4 rounded-xl border-2 transition-colors touch-manipulation ${
   paymentMethod === "bank"
   ? "border-orange-500 bg-orange-50 text-orange-700"
   : "border-gray-200 hover:border-gray-300 active:bg-gray-100"
  }`}
  >
  <Landmark className="h-6 w-6" />
  <span className="font-medium">Bank</span>
  </button>
  </div>
  </div>
 </div>

 <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3">
  <div className="flex gap-3">
  <button
  type="button"
  onClick={onClose}
  className="flex-1 min-h-[52px] py-3 sm:py-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
  >
  Cancel
  </button>
  <button
  onClick={onComplete}
  className="flex-1 min-h-[52px] py-3 sm:py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
  >
  Complete Sale
  </button>
  </div>
 </div>
 </div>
 </div>
 );
};

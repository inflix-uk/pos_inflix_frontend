"use client";

import React from "react";
import { X, CreditCard, User, Calendar, DollarSign } from "lucide-react";
import { GiftCard } from "../types";

interface ViewGiftCardModalProps {
 open: boolean;
 onClose: () => void;
 giftCard: GiftCard | null;
}

export const ViewGiftCardModal: React.FC<ViewGiftCardModalProps> = ({
 open,
 onClose,
 giftCard,
}) => {
 if (!open || !giftCard) return null;

 const getStatusBadge = (status: string) => {
 const statusClasses = {
 Active: "bg-green-100 text-green-800",
 Redeemed: "bg-red-100 text-red-800",
 Expired: "bg-gray-100 text-gray-800",
 };
 return statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800";
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-md">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Gift Card Details</h2>
  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
  <X size={24} />
  </button>
 </div>

 <div className="p-6 space-y-4">
  <div className="flex items-center justify-center mb-4">
  <div className={`w-16 h-16 rounded-full ${giftCard.customer.color} flex items-center justify-center`}>
  <CreditCard className="w-8 h-8 text-gray-600" />
  </div>
  </div>

  <div className="text-center mb-4">
  <h3 className="text-2xl font-bold text-gray-900">{giftCard.giftCard}</h3>
  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusBadge(giftCard.status)}`}>
  {giftCard.status}
  </span>
  </div>

  <div className="space-y-3">
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
  <User className="w-5 h-5 text-gray-400" />
  <div>
  <p className="text-xs text-gray-500">Customer</p>
  <p className="font-medium text-gray-900">{giftCard.customer.name}</p>
  </div>
  </div>

  <div className="grid grid-cols-2 gap-3">
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
  <Calendar className="w-5 h-5 text-gray-400" />
  <div>
   <p className="text-xs text-gray-500">Issued Date</p>
   <p className="font-medium text-gray-900">{giftCard.issuedDate}</p>
  </div>
  </div>
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
  <Calendar className="w-5 h-5 text-gray-400" />
  <div>
   <p className="text-xs text-gray-500">Expiry Date</p>
   <p className="font-medium text-gray-900">{giftCard.expiryDate}</p>
  </div>
  </div>
  </div>

  <div className="grid grid-cols-2 gap-3">
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
  <DollarSign className="w-5 h-5 text-gray-400" />
  <div>
   <p className="text-xs text-gray-500">Amount</p>
   <p className="font-medium text-gray-900">${giftCard.amount}</p>
  </div>
  </div>
  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
  <DollarSign className="w-5 h-5 text-green-500" />
  <div>
   <p className="text-xs text-gray-500">Balance</p>
   <p className="font-medium text-green-600">${giftCard.balance}</p>
  </div>
  </div>
  </div>
  </div>
 </div>

 <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
  <button
  onClick={onClose}
  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
  >
  Close
  </button>
 </div>
 </div>
 </div>
 );
};

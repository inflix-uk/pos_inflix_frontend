"use client";

import React from "react";
import { Eye, Edit, Trash2, User } from "lucide-react";
import { GiftCard } from "../types";

interface GiftCardTableProps {
 giftCards: GiftCard[];
 selectedGiftCards: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectGiftCard: (id: string) => void;
 onView: (giftCard: GiftCard) => void;
 onEdit: (giftCard: GiftCard) => void;
 onDelete: (giftCard: GiftCard) => void;
 getStatusBadge: (status: string) => string;
}

export const GiftCardTable: React.FC<GiftCardTableProps> = ({
 giftCards,
 selectedGiftCards,
 selectAll,
 onSelectAll,
 onSelectGiftCard,
 onView,
 onEdit,
 onDelete,
 getStatusBadge,
}) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-3 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Gift Card
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Customer
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Issued Date
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Expiry Date
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Amount
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Balance
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {giftCards.map((giftCard) => (
  <tr key={giftCard.id} className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap">
  <input
   type="checkbox"
   checked={selectedGiftCards.includes(giftCard.id)}
   onChange={() => onSelectGiftCard(giftCard.id)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {giftCard.giftCard}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-3">
   <div className={`w-8 h-8 rounded-full ${giftCard.customer.color} flex items-center justify-center`}>
   <User size={16} className="text-gray-600" />
   </div>
   <span className="text-sm text-gray-900">{giftCard.customer.name}</span>
  </div>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {giftCard.issuedDate}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {giftCard.expiryDate}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  ${giftCard.amount}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  ${giftCard.balance}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(giftCard.status)}`}>
   {giftCard.status}
  </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
   <button
   onClick={() => onView(giftCard)}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Eye size={16} />
   </button>
   <button
   onClick={() => onEdit(giftCard)}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Edit size={16} />
   </button>
   <button
   onClick={() => onDelete(giftCard)}
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
   >
   <Trash2 size={16} />
   </button>
  </div>
  </td>
  </tr>
  ))}
 </tbody>
 </table>
 </div>
 );
};

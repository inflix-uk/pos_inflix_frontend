"use client";
import React from "react";
import { X, User } from "lucide-react";
import { GiftCard } from "./AddGiftCardModal";

interface Transaction {
  id: string;
  date: string;
  transactionType: "Purchase" | "Refund";
  store: string;
  amount: number;
  balance: number;
}

interface ViewGiftCardModalProps {
  open: boolean;
  onClose: () => void;
  giftCard: GiftCard | null;
}

const ViewGiftCardModal: React.FC<ViewGiftCardModalProps> = ({
  open,
  onClose,
  giftCard,
}) => {
  if (!open || !giftCard) return null;

  // Sample transaction data
  const transactions: Transaction[] = [
    {
      id: "1",
      date: "04 Jan 2025",
      transactionType: "Refund",
      store: "Online",
      amount: 25,
      balance: 175,
    },
    {
      id: "2",
      date: "16 Jan 2025",
      transactionType: "Purchase",
      store: "Electro Mart",
      amount: 75,
      balance: 100,
    },
    {
      id: "3",
      date: "26 Dec 2024",
      transactionType: "Purchase",
      store: "Gadget World",
      amount: 50,
      balance: 150,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gift Card Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Gift Card Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Gift Card */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Gift Card</h3>
              <p className="text-lg font-semibold text-blue-600">{giftCard.giftCard}</p>
            </div>

            {/* Amount */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
              <p className="text-lg font-semibold text-gray-900">${giftCard.amount}</p>
            </div>

            {/* Balance */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Balance</h3>
              <p className="text-lg font-semibold text-gray-900">${giftCard.balance}</p>
            </div>

            {/* Customer */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${giftCard.customer.color} flex items-center justify-center`}>
                  <User size={16} className="text-gray-600" />
                </div>
                <span className="text-lg font-semibold text-gray-900">{giftCard.customer.name}</span>
              </div>
            </div>

            {/* Issued Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Issued Date</h3>
              <p className="text-lg font-semibold text-gray-900">{giftCard.issuedDate}</p>
            </div>

            {/* Expiry Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Expiry Date</h3>
              <p className="text-lg font-semibold text-gray-900">{giftCard.expiryDate}</p>
            </div>

            {/* Issued By */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Issued By</h3>
              <p className="text-lg font-semibold text-gray-900">Admin</p>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  giftCard.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : giftCard.status === "Redeemed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {giftCard.status}
              </span>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.transactionType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.store}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.balance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewGiftCardModal;

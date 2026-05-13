"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { GiftCard } from "../types";

interface EditGiftCardModalProps {
 open: boolean;
 onClose: () => void;
 onUpdate: (giftCard: GiftCard) => void;
 giftCard: GiftCard | null;
}

export const EditGiftCardModal: React.FC<EditGiftCardModalProps> = ({
 open,
 onClose,
 onUpdate,
 giftCard,
}) => {
 const [formData, setFormData] = useState({
 giftCardCode: "",
 customerName: "",
 issuedDate: "",
 expiryDate: "",
 amount: 0,
 balance: 0,
 status: "Active" as "Active" | "Redeemed" | "Expired",
 });

 useEffect(() => {
 if (giftCard) {
 setFormData({
 giftCardCode: giftCard.giftCard,
 customerName: giftCard.customer.name,
 issuedDate: parseDate(giftCard.issuedDate),
 expiryDate: parseDate(giftCard.expiryDate),
 amount: giftCard.amount,
 balance: giftCard.balance,
 status: giftCard.status,
 });
 }
 }, [giftCard]);

 const parseDate = (dateStr: string): string => {
 try {
 const date = new Date(dateStr);
 return date.toISOString().split("T")[0];
 } catch {
 return "";
 }
 };

 const handleChange = (field: string, value: string | number) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (giftCard) {
 const updatedGiftCard: GiftCard = {
 ...giftCard,
 giftCard: formData.giftCardCode.toUpperCase(),
 customer: {
  ...giftCard.customer,
  name: formData.customerName,
 },
 issuedDate: new Date(formData.issuedDate).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
 }),
 expiryDate: new Date(formData.expiryDate).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
 }),
 amount: formData.amount,
 balance: formData.balance,
 status: formData.status,
 };
 onUpdate(updatedGiftCard);
 }
 };

 if (!open || !giftCard) return null;

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Edit Gift Card</h2>
  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
  <X size={24} />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Gift Card Code
  </label>
  <input
  type="text"
  value={formData.giftCardCode}
  onChange={(e) => handleChange("giftCardCode", e.target.value.toUpperCase())}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Customer Name
  </label>
  <input
  type="text"
  value={formData.customerName}
  onChange={(e) => handleChange("customerName", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Issued Date
  </label>
  <input
  type="date"
  value={formData.issuedDate}
  onChange={(e) => handleChange("issuedDate", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Expiry Date
  </label>
  <input
  type="date"
  value={formData.expiryDate}
  onChange={(e) => handleChange("expiryDate", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Amount ($)
  </label>
  <input
  type="number"
  value={formData.amount}
  onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Balance ($)
  </label>
  <input
  type="number"
  value={formData.balance}
  onChange={(e) => handleChange("balance", parseFloat(e.target.value) || 0)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
  <select
  value={formData.status}
  onChange={(e) => handleChange("status", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="Active">Active</option>
  <option value="Redeemed">Redeemed</option>
  <option value="Expired">Expired</option>
  </select>
  </div>

  <div className="flex justify-end gap-3 pt-4">
  <button
  type="button"
  onClick={onClose}
  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
  >
  Cancel
  </button>
  <button
  type="submit"
  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  Update Gift Card
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

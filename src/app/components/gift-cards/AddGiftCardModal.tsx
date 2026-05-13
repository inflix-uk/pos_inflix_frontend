"use client";
import React, { useState } from "react";
import { X, Calendar, Plus } from "lucide-react";

export interface GiftCard {
  id: string;
  giftCard: string;
  customer: {
    name: string;
    avatar: string;
    color: string;
  };
  issuedDate: string;
  expiryDate: string;
  amount: number;
  balance: number;
  status: "Active" | "Redeemed" | "Expired";
}

interface AddGiftCardModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (giftCard: GiftCard) => void;
}

const AddGiftCardModal: React.FC<AddGiftCardModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    giftCard: "",
    customer: "Select",
    issuedDate: "",
    expiryDate: "",
    amount: "",
    balance: "",
    status: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.giftCard.trim()) newErrors.giftCard = "Gift Card ID is required";
    if (formData.customer === "Select") newErrors.customer = "Customer selection is required";
    if (!formData.issuedDate) newErrors.issuedDate = "Issued date is required";
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    if (!formData.balance) newErrors.balance = "Balance is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const customerData = customers.find(c => c.name === formData.customer) || customers[0];

    const newGiftCard: GiftCard = {
      id: Date.now().toString(),
      giftCard: formData.giftCard,
      customer: customerData,
      issuedDate: formData.issuedDate,
      expiryDate: formData.expiryDate,
      amount: Number(formData.amount),
      balance: Number(formData.balance),
      status: formData.status ? "Active" : "Expired",
    };

    onAdd(newGiftCard);
    
    // Reset form
    setFormData({
      giftCard: "",
      customer: "Select",
      issuedDate: "",
      expiryDate: "",
      amount: "",
      balance: "",
      status: true,
    });
    setErrors({});
  };

  const customers = [
    { name: "Carl Evans", avatar: "user", color: "bg-blue-100" },
    { name: "Minerva Rametz", avatar: "user", color: "bg-red-100" },
    { name: "Robert Lamon", avatar: "user", color: "bg-gray-100" },
    { name: "Patricia Lewis", avatar: "user", color: "bg-orange-100" },
    { name: "Mark Jordyn", avatar: "user", color: "bg-blue-100" },
    { name: "Marsha Betts", avatar: "user", color: "bg-green-100" },
    { name: "Daniel Jude", avatar: "user", color: "bg-purple-100" },
    { name: "Emma Bates", avatar: "user", color: "bg-pink-100" },
    { name: "Richard Fralick", avatar: "user", color: "bg-yellow-100" },
    { name: "Michelle Robison", avatar: "user", color: "bg-indigo-100" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Gift Card</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Gift Card */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gift Card <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.giftCard}
              onChange={(e) => handleInputChange("giftCard", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.giftCard ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter gift card ID"
            />
            {errors.giftCard && <p className="text-red-500 text-xs mt-1">{errors.giftCard}</p>}
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.customer ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Select">Select</option>
                {customers.map((customer) => (
                  <option key={customer.name} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-2 text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-50"
              >
                <Plus size={16} />
                Add New
              </button>
            </div>
            {errors.customer && <p className="text-red-500 text-xs mt-1">{errors.customer}</p>}
          </div>

          {/* Issued Date and Expiry Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issued Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => handleInputChange("issuedDate", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.issuedDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              {errors.issuedDate && <p className="text-red-500 text-xs mt-1">{errors.issuedDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.expiryDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
            </div>
          </div>

          {/* Amount and Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter amount"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => handleInputChange("balance", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.balance ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter balance"
              />
              {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.status}
                onChange={(e) => handleInputChange("status", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Add Gift Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGiftCardModal;

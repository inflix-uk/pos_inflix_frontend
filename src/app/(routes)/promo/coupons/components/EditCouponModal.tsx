"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Coupon } from "../types";

interface EditCouponModalProps {
 open: boolean;
 onClose: () => void;
 onUpdate: (coupon: Coupon) => void;
 coupon: Coupon | null;
}

export const EditCouponModal: React.FC<EditCouponModalProps> = ({
 open,
 onClose,
 onUpdate,
 coupon,
}) => {
 const [formData, setFormData] = useState({
 name: "",
 code: "",
 description: "",
 type: "Percentage" as "Percentage" | "Fixed Amount",
 discount: 0,
 limit: 1,
 startDate: "",
 endDate: "",
 product: "All",
 oncePerCustomer: false,
 status: "Active" as "Active" | "Inactive",
 });

 useEffect(() => {
 if (coupon) {
 setFormData({
 name: coupon.name,
 code: coupon.code,
 description: coupon.description,
 type: coupon.type,
 discount: coupon.discount,
 limit: coupon.limit,
 startDate: coupon.startDate,
 endDate: coupon.endDate,
 product: coupon.product,
 oncePerCustomer: coupon.oncePerCustomer,
 status: coupon.status,
 });
 }
 }, [coupon]);

 const handleChange = (field: string, value: string | number | boolean) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (coupon) {
 const updatedCoupon: Coupon = {
 ...coupon,
 ...formData,
 valid: new Date(formData.endDate).toLocaleDateString("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
 }),
 };
 onUpdate(updatedCoupon);
 }
 };

 if (!open || !coupon) return null;

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Edit Coupon</h2>
  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
  <X size={24} />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name</label>
  <input
  type="text"
  value={formData.name}
  onChange={(e) => handleChange("name", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
  <input
  type="text"
  value={formData.code}
  onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
  <textarea
  value={formData.description}
  onChange={(e) => handleChange("description", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  rows={2}
  />
  </div>

  <div className="grid grid-cols-3 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
  <select
  value={formData.type}
  onChange={(e) => handleChange("type", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  >
  <option value="Percentage">Percentage</option>
  <option value="Fixed Amount">Fixed Amount</option>
  </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
  <input
  type="number"
  value={formData.discount}
  onChange={(e) => handleChange("discount", parseFloat(e.target.value) || 0)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
  <input
  type="number"
  value={formData.limit}
  onChange={(e) => handleChange("limit", parseInt(e.target.value) || 0)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  min="0"
  />
  </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
  <input
  type="date"
  value={formData.startDate}
  onChange={(e) => handleChange("startDate", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
  <input
  type="date"
  value={formData.endDate}
  onChange={(e) => handleChange("endDate", e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  required
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
  <option value="Inactive">Inactive</option>
  </select>
  </div>

  <div className="flex items-center">
  <input
  type="checkbox"
  id="oncePerCustomer"
  checked={formData.oncePerCustomer}
  onChange={(e) => handleChange("oncePerCustomer", e.target.checked)}
  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
  />
  <label htmlFor="oncePerCustomer" className="ml-2 text-sm text-gray-700">
  Once per customer
  </label>
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
  Update Coupon
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

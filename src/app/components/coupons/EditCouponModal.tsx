"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar, Bold, Italic, Underline, Link, List, AlignLeft } from "lucide-react";
import { Coupon } from "./AddCouponModal";

interface EditCouponModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (coupon: Coupon) => void;
  coupon: Coupon | null;
}

const EditCouponModal: React.FC<EditCouponModalProps> = ({
  open,
  onClose,
  onUpdate,
  coupon,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "Percentage" as "Percentage" | "Fixed Amount",
    discount: "",
    limit: "",
    startDate: "",
    endDate: "",
    product: "Select",
    oncePerCustomer: false,
    description: "",
    status: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (coupon && open) {
      setFormData({
        name: coupon.name,
        code: coupon.code,
        type: coupon.type,
        discount: coupon.discount.toString(),
        limit: coupon.limit.toString(),
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        product: coupon.product,
        oncePerCustomer: coupon.oncePerCustomer,
        description: coupon.description,
        status: coupon.status === "Active",
      });
    }
  }, [coupon, open]);

  if (!open || !coupon) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Coupon name is required";
    if (!formData.code.trim()) newErrors.code = "Coupon code is required";
    if (!formData.discount) newErrors.discount = "Discount is required";
    if (!formData.limit) newErrors.limit = "Limit is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (formData.product === "Select") newErrors.product = "Product selection is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const updatedCoupon: Coupon = {
      ...coupon,
      name: formData.name,
      code: formData.code,
      description: formData.description,
      type: formData.type,
      discount: Number(formData.discount),
      limit: Number(formData.limit),
      startDate: formData.startDate,
      endDate: formData.endDate,
      product: formData.product,
      oncePerCustomer: formData.oncePerCustomer,
      status: formData.status ? "Active" : "Inactive",
      valid: formData.endDate,
    };

    onUpdate(updatedCoupon);
    setErrors({});
  };

  const products = [
    "All",
    "Lenovo 3rd Generation",
    "Bold V3.2",
    "Nike Jordan",
    "Apple Series 5 Watch",
    "Amazon Echo Dot",
    "Lobar Handy",
    "Red Premium Handy",
    "Iphone 14 Pro",
    "Black Slim 200",
    "Woodcraft Sandal"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Coupon</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Coupon Name and Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter coupon name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.code ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter coupon code"
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* Type and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Percentage">Percentage</option>
                <option value="Fixed Amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.discount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter discount value"
              />
              {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
            </div>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limit <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.limit}
              onChange={(e) => handleInputChange("limit", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.limit ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter 0 for Unlimited"
            />
            <p className="text-gray-500 text-xs mt-1">Enter 0 for Unlimited</p>
            {errors.limit && <p className="text-red-500 text-xs mt-1">{errors.limit}</p>}
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.startDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.endDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Product and Once Per Customer */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <select
                  value={formData.product}
                  onChange={(e) => handleInputChange("product", e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.product ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="Select">Select</option>
                  {products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.oncePerCustomer}
                      onChange={(e) => handleInputChange("oncePerCustomer", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                  <span className="text-sm text-gray-700">Once Per Customer</span>
                </div>
              </div>
              {errors.product && <p className="text-red-500 text-xs mt-1">{errors.product}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="border border-gray-300 rounded-lg">
              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
                <select className="text-sm border-none bg-transparent">
                  <option>Normal</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <div className="w-px h-4 bg-gray-300"></div>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <Bold size={16} />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <Italic size={16} />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <Underline size={16} />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <Link size={16} />
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <List size={16} />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded">
                  <AlignLeft size={16} />
                </button>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-3 py-2 border-none focus:ring-0 resize-none"
                rows={4}
                placeholder="Enter description..."
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">Maximum 60 Words</p>
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
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCouponModal;

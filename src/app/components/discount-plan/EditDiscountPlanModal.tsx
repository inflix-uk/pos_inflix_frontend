"use client";
import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { DiscountPlan } from "./AddDiscountPlanModal";

interface EditDiscountPlanModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (discountPlan: DiscountPlan) => void;
  discountPlan: DiscountPlan | null;
}

const EditDiscountPlanModal: React.FC<EditDiscountPlanModalProps> = ({
  open,
  onClose,
  onUpdate,
  discountPlan,
}) => {
  const [formData, setFormData] = useState({
    planName: "",
    customer: "Select",
    status: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (discountPlan && open) {
      setFormData({
        planName: discountPlan.planName,
        customer: discountPlan.customers,
        status: discountPlan.status === "Active",
      });
    }
  }, [discountPlan, open]);

  if (!open || !discountPlan) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.planName.trim()) newErrors.planName = "Plan Name is required";
    if (formData.customer === "Select") newErrors.customer = "Customer selection is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const updatedDiscountPlan: DiscountPlan = {
      ...discountPlan,
      planName: formData.planName,
      customers: formData.customer,
      status: formData.status ? "Active" : "Inactive",
    };

    onUpdate(updatedDiscountPlan);
    setErrors({});
  };

  const customers = [
    "All Customers",
    "Members Only",
    "High-Spending Customers",
    "Students",
    "Online Customers",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Discount Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.planName}
              onChange={(e) => handleInputChange("planName", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.planName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter plan name"
            />
            {errors.planName && <p className="text-red-500 text-xs mt-1">{errors.planName}</p>}
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
                  <option key={customer} value={customer}>
                    {customer}
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

export default EditDiscountPlanModal;

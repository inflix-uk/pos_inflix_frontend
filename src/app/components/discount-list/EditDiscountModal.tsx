"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { Discount } from "./AddDiscountModal";

interface EditDiscountModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (discount: Discount) => void;
  discount: Discount | null;
}

const EditDiscountModal: React.FC<EditDiscountModalProps> = ({
  open,
  onClose,
  onUpdate,
  discount,
}) => {
  const [formData, setFormData] = useState({
    discountName: "",
    discountPlan: "Select",
    applicableFor: "Select",
    validFrom: "",
    validTill: "",
    discountType: "Select",
    validOnFollowingDays: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (discount && open) {
      setFormData({
        discountName: discount.name,
        discountPlan: discount.discountPlan,
        applicableFor: discount.applicableFor,
        validFrom: discount.validFrom,
        validTill: discount.validTill,
        discountType: discount.discountType,
        validOnFollowingDays: discount.days,
      });
    }
  }, [discount, open]);

  if (!open) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      validOnFollowingDays: prev.validOnFollowingDays.includes(day)
        ? prev.validOnFollowingDays.filter(d => d !== day)
        : [...prev.validOnFollowingDays, day]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.discountName.trim()) newErrors.discountName = "Discount Name is required";
    if (formData.discountPlan === "Select") newErrors.discountPlan = "Discount Plan is required";
    if (formData.applicableFor === "Select") newErrors.applicableFor = "Applicable For is required";
    if (!formData.validFrom) newErrors.validFrom = "Valid From date is required";
    if (!formData.validTill) newErrors.validTill = "Valid Till date is required";
    if (formData.discountType === "Select") newErrors.discountType = "Discount Type is required";
    if (formData.validOnFollowingDays.length === 0) newErrors.validOnFollowingDays = "Select at least one day";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !discount) return;

    const updatedDiscount: Discount = {
      ...discount,
      name: formData.discountName,
      value: formData.discountType === "Percentage" ? "70 (Percentage)" : "60 (Flat)",
      discountPlan: formData.discountPlan,
      validity: `${formData.validFrom} - ${formData.validTill}`,
      days: formData.validOnFollowingDays,
      products: formData.applicableFor,
      discountType: formData.discountType as "Percentage" | "Flat",
      applicableFor: formData.applicableFor,
      validFrom: formData.validFrom,
      validTill: formData.validTill,
    };

    onUpdate(updatedDiscount);
    setErrors({});
  };

  const discountPlans = ["Standard", "Membership", "Premium"];
  const applicableOptions = ["All Products", "Specific Products"];
  const discountTypes = ["Percentage", "Flat"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Discount</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Row 1: Discount Name, Discount Plan, Applicable For */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.discountName}
                onChange={(e) => handleInputChange("discountName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.discountName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter discount name"
              />
              {errors.discountName && <p className="text-red-500 text-xs mt-1">{errors.discountName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Plan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.discountPlan}
                onChange={(e) => handleInputChange("discountPlan", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.discountPlan ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Select">Select</option>
                {discountPlans.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
              {errors.discountPlan && <p className="text-red-500 text-xs mt-1">{errors.discountPlan}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable For <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.applicableFor}
                onChange={(e) => handleInputChange("applicableFor", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.applicableFor ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Select">Select</option>
                {applicableOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.applicableFor && <p className="text-red-500 text-xs mt-1">{errors.applicableFor}</p>}
            </div>
          </div>

          {/* Row 2: Valid From, Valid Till, Discount Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => handleInputChange("validFrom", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.validFrom ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="dd/mm/yyyy"
                />
                <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Till <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.validTill}
                  onChange={(e) => handleInputChange("validTill", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.validTill ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="dd/mm/yyyy"
                />
                <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.validTill && <p className="text-red-500 text-xs mt-1">{errors.validTill}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => handleInputChange("discountType", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.discountType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Select">Select</option>
                {discountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.discountType && <p className="text-red-500 text-xs mt-1">{errors.discountType}</p>}
            </div>
          </div>

          {/* Valid on Following Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid on Following Days <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.validOnFollowingDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
            {errors.validOnFollowingDays && <p className="text-red-500 text-xs mt-1">{errors.validOnFollowingDays}</p>}
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

export default EditDiscountModal;

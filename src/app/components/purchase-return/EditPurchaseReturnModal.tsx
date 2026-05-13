"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar, Plus } from "lucide-react";
import { PurchaseReturn, PurchaseReturnItem } from "./AddPurchaseReturnModal";

interface EditPurchaseReturnModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (purchaseReturn: PurchaseReturn) => void;
  purchaseReturn: PurchaseReturn | null;
}

const EditPurchaseReturnModal: React.FC<EditPurchaseReturnModalProps> = ({
  open,
  onClose,
  onUpdate,
  purchaseReturn,
}) => {
  const [formData, setFormData] = useState({
    supplierName: "Select",
    date: "",
    reference: "",
    supplier: "",
    product: "",
    orderTax: 0,
    discount: 0,
    shipping: 0,
    status: "Select",
    description: "",
  });

  const [items, setItems] = useState<PurchaseReturnItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (purchaseReturn && open) {
      setFormData({
        supplierName: purchaseReturn.supplierName,
        date: purchaseReturn.date,
        reference: purchaseReturn.reference,
        supplier: purchaseReturn.supplierName,
        product: "",
        orderTax: purchaseReturn.orderTax,
        discount: purchaseReturn.discount,
        shipping: purchaseReturn.shipping,
        status: purchaseReturn.status,
        description: purchaseReturn.description,
      });
      setItems(purchaseReturn.items);
    }
  }, [purchaseReturn, open]);

  if (!open) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const addItem = () => {
    if (!formData.product.trim()) return;
    
    const newItem: PurchaseReturnItem = {
      id: Date.now().toString(),
      image: "📱",
      date: formData.date,
      supplier: formData.supplierName,
      reference: formData.reference,
      status: "Received",
      total: 1000,
      paid: 1000,
      due: 600,
      paymentStatus: "Paid",
    };
    
    setItems(prev => [...prev, newItem]);
    setFormData(prev => ({ ...prev, product: "" }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + formData.orderTax + formData.shipping - formData.discount;
    return { subtotal, total };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.supplierName === "Select") newErrors.supplierName = "Supplier is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.reference.trim()) newErrors.reference = "Reference is required";
    if (formData.status === "Select") newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !purchaseReturn) return;

    const { total } = calculateTotals();
    const updatedPurchaseReturn: PurchaseReturn = {
      ...purchaseReturn,
      supplierName: formData.supplierName,
      reference: formData.reference,
      date: formData.date,
      status: formData.status as "Received" | "Pending" | "Unpaid",
      total: total,
      paid: formData.status === "Received" ? total : purchaseReturn.paid,
      due: formData.status === "Received" ? 0 : total - purchaseReturn.paid,
      paymentStatus: formData.status === "Received" ? "Paid" : purchaseReturn.paymentStatus,
      items: items,
      orderTax: formData.orderTax,
      discount: formData.discount,
      shipping: formData.shipping,
      grandTotal: total,
      description: formData.description,
    };

    onUpdate(updatedPurchaseReturn);
    setErrors({});
  };

  const suppliers = ["Electro Mart", "Quantum Gadgets", "Prime Bazaar", "Gadget World", "Volt Vault"];
  const statuses = ["Received", "Pending", "Unpaid"];
  const { total } = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Purchase Return</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Row 1: Supplier Name, Date, Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.supplierName}
                onChange={(e) => handleInputChange("supplierName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.supplierName ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Select">Select</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
              {errors.supplierName && <p className="text-red-500 text-xs mt-1">{errors.supplierName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Select">Select</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.product}
                onChange={(e) => handleInputChange("product", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Search Product"
              />
              <button
                onClick={addItem}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Items</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total ($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid ($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due ($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                          <span className="text-purple-600 text-xs">💻</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">24 Dec 2024</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Electro Mart</td>
                      <td className="px-4 py-3 text-sm text-gray-900">PT001</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Received
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">£1000</td>
                      <td className="px-4 py-3 text-sm text-gray-900">£1000</td>
                      <td className="px-4 py-3 text-sm text-gray-900">£600</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No items added yet. Search and add products above.
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Order Tax</span>
              <span>$ {formData.orderTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span>$ {formData.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>$ {formData.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span>Grand Total</span>
              <span>$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Order Tax, Discount, Shipping, Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Tax <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.orderTax}
                onChange={(e) => handleInputChange("orderTax", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => handleInputChange("discount", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.shipping}
                onChange={(e) => handleInputChange("shipping", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Select">Select</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="border border-gray-300 rounded-lg">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                <select className="text-sm border-none bg-transparent">
                  <option>Normal</option>
                </select>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-200 rounded"><strong>B</strong></button>
                  <button className="p-1 hover:bg-gray-200 rounded"><em>I</em></button>
                  <button className="p-1 hover:bg-gray-200 rounded"><u>U</u></button>
                </div>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-3 py-2 border-none resize-none focus:ring-0"
                rows={4}
                placeholder="Type your message"
              />
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
                Maximum 60 Words
              </div>
            </div>
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
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseReturnModal;

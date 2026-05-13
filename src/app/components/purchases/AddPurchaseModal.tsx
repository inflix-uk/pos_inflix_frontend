"use client";
import React, { useState } from "react";
import { X, Calendar, Plus, Minus } from "lucide-react";

export interface PurchaseItem {
  id: string;
  product: string;
  qty: number;
  purchasePrice: number;
  discount: number;
  tax: number;
  taxAmount: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  supplierName: string;
  reference: string;
  date: string;
  status: "Received" | "Pending" | "Ordered";
  total: number;
  paid: number;
  due: number;
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  items: PurchaseItem[];
  orderTax: number;
  discount: number;
  shipping: number;
  grandTotal: number;
  description: string;
}

interface AddPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (purchase: Purchase) => void;
}

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    supplierName: "Select",
    date: "",
    reference: "",
    product: "",
    orderTax: 0,
    discount: 0,
    shipping: 0,
    status: "Select",
    description: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const addItem = () => {
    if (!formData.product.trim()) return;
    
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      product: formData.product,
      qty: 1,
      purchasePrice: 0,
      discount: 0,
      tax: 0,
      taxAmount: 0,
      unitCost: 0,
      totalCost: 0,
    };
    
    setItems(prev => [...prev, newItem]);
    setFormData(prev => ({ ...prev, product: "" }));
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate costs
        const subtotal = updatedItem.qty * updatedItem.purchasePrice;
        const discountAmount = (subtotal * updatedItem.discount) / 100;
        const afterDiscount = subtotal - discountAmount;
        updatedItem.taxAmount = (afterDiscount * updatedItem.tax) / 100;
        updatedItem.unitCost = updatedItem.purchasePrice;
        updatedItem.totalCost = afterDiscount + updatedItem.taxAmount;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
    const total = subtotal + formData.orderTax + formData.shipping - formData.discount;
    return { subtotal, total };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.supplierName === "Select") newErrors.supplierName = "Supplier is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.reference.trim()) newErrors.reference = "Reference is required";
    if (formData.status === "Select") newErrors.status = "Status is required";
    if (items.length === 0) newErrors.items = "At least one item is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const { total } = calculateTotals();
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      supplierName: formData.supplierName,
      reference: formData.reference,
      date: formData.date,
      status: formData.status as "Received" | "Pending" | "Ordered",
      total: total,
      paid: formData.status === "Received" ? total : 0,
      due: formData.status === "Received" ? 0 : total,
      paymentStatus: formData.status === "Received" ? "Paid" : "Unpaid",
      items: items,
      orderTax: formData.orderTax,
      discount: formData.discount,
      shipping: formData.shipping,
      grandTotal: total,
      description: formData.description,
    };

    onAdd(newPurchase);
    
    // Reset form
    setFormData({
      supplierName: "Select",
      date: "",
      reference: "",
      product: "",
      orderTax: 0,
      discount: 0,
      shipping: 0,
      status: "Select",
      description: "",
    });
    setItems([]);
    setErrors({});
  };

  const suppliers = ["Electro Mart", "Quantum Gadgets", "Prime Bazaar", "Gadget World", "Volt Vault"];
  const statuses = ["Received", "Pending", "Ordered"];
  const { total } = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Purchase</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Row 1: Supplier Name, Date, Reference */}
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
                Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.reference ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter reference"
              />
              {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference}</p>}
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Purchase Price($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tax(%)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tax Amount($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit Cost($)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total Cost(%)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.product}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(item.id, "purchasePrice", Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, "discount", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, "tax", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">${item.taxAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${item.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${item.totalCost.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Minus size={16} />
                        </button>
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

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span>Entries: {items.length}</span>
                <div className="flex items-center gap-2">
                  <span>1</span>
                </div>
              </div>
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
                placeholder="Enter description..."
              />
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
                Maximum 60 Words
              </div>
            </div>
          </div>

          {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-lg font-semibold text-gray-900">
            Grand Total: ${total.toFixed(2)}
          </div>
          <div className="flex items-center gap-3">
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
    </div>
  );
};

export default AddPurchaseModal;

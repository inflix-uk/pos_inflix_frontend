"use client";
import React, { useState, useEffect } from "react";
import { X, User, Calendar } from "lucide-react";
import { Quotation, QuotationItem } from "./AddQuotationModal";

interface EditQuotationModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedQuotation: Quotation) => void;
  quotation: Quotation | null;
}

const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  open,
  onClose,
  onUpdate,
  quotation,
}) => {
  const [form, setForm] = useState({
    customer: { name: "", avatar: "user", color: "bg-blue-100" },
    date: "",
    reference: "",
    status: "Pending",
    orderTax: 0,
    discount: 0,
    shipping: 0,
    description: "",
  });

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [newItem, setNewItem] = useState({
    product: "",
    qty: 1,
    purchasePrice: 0,
    discount: 0,
    tax: 0,
    taxAmount: 0,
    unitCost: 0,
    totalCost: 0,
  });

  const customers = [
    { name: "Carl Evans", avatar: "user", color: "bg-blue-100" },
    { name: "Minerva Rametz", avatar: "user", color: "bg-red-100" },
    { name: "Robert Lamon", avatar: "user", color: "bg-gray-100" },
    { name: "Mark Jordyn", avatar: "user", color: "bg-blue-100" },
    { name: "Patricia Lewis", avatar: "user", color: "bg-red-100" },
    { name: "Marsha Betts", avatar: "user", color: "bg-blue-100" },
    { name: "Daniel Jude", avatar: "user", color: "bg-orange-100" },
    { name: "Emma Bates", avatar: "user", color: "bg-green-100" },
    { name: "Richard Fralick", avatar: "user", color: "bg-gray-100" },
    { name: "Michelle Robison", avatar: "user", color: "bg-red-100" },
  ];

  const products = [
    { name: "Lenovo 3rd Generation", price: 2000, stock: 100 },
    { name: "Bold V3.2", price: 1500, stock: 50 },
    { name: "Nike Jordan", price: 2000, stock: 75 },
    { name: "Apple Series 5 Watch", price: 3000, stock: 200 },
    { name: "Amazon Echo Dot", price: 150, stock: 300 },
    { name: "Lobar Handy", price: 2500, stock: 120 },
    { name: "Red Premium Handy", price: 1800, stock: 60 },
    { name: "Iphone 14 Pro", price: 4000, stock: 40 },
    { name: "Black Slim 200", price: 800, stock: 80 },
    { name: "Woodcraft Sandal", price: 1200, stock: 150 },
  ];

  const statuses = ["Pending", "Sent", "Ordered"];

  // Initialize form with quotation data when modal opens
  useEffect(() => {
    if (open && quotation) {
      setForm({
        customer: quotation.customer,
        date: quotation.date,
        reference: quotation.reference,
        status: quotation.status,
        orderTax: quotation.orderTax,
        discount: quotation.discount,
        shipping: quotation.shipping,
        description: quotation.description,
      });
      setQuotationItems(quotation.items);
    }
  }, [open, quotation]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setForm({
        customer: { name: "", avatar: "user", color: "bg-blue-100" },
        date: "",
        reference: "",
        status: "Pending",
        orderTax: 0,
        discount: 0,
        shipping: 0,
        description: "",
      });
      setQuotationItems([]);
      setNewItem({
        product: "",
        qty: 1,
        purchasePrice: 0,
        discount: 0,
        tax: 0,
        taxAmount: 0,
        unitCost: 0,
        totalCost: 0,
      });
    }
  }, [open]);

  const calculateItemCosts = (item: Partial<QuotationItem>) => {
    const qty = item.qty || 0;
    const purchasePrice = item.purchasePrice || 0;
    const discount = item.discount || 0;
    const tax = item.tax || 0;

    const discountAmount = (purchasePrice * discount) / 100;
    const unitCost = purchasePrice - discountAmount;
    const taxAmount = (unitCost * tax) / 100;
    const totalCost = (unitCost + taxAmount) * qty;

    return {
      taxAmount,
      unitCost,
      totalCost,
    };
  };

  const handleProductSelect = (productName: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      const updatedItem = {
        ...newItem,
        product: productName,
        purchasePrice: product.price,
      };
      const costs = calculateItemCosts(updatedItem);
      setNewItem({ ...updatedItem, ...costs });
    }
  };

  const handleItemChange = (field: string, value: number) => {
    const updatedItem = { ...newItem, [field]: value };
    const costs = calculateItemCosts(updatedItem);
    setNewItem({ ...updatedItem, ...costs });
  };

  const addItem = () => {
    if (newItem.product && newItem.qty > 0) {
      const costs = calculateItemCosts(newItem);
      const item: QuotationItem = {
        id: Date.now().toString(),
        ...newItem,
        ...costs,
      };
      setQuotationItems([...quotationItems, item]);
      setNewItem({
        product: "",
        qty: 1,
        purchasePrice: 0,
        discount: 0,
        tax: 0,
        taxAmount: 0,
        unitCost: 0,
        totalCost: 0,
      });
    }
  };

  const updateItem = (id: string, field: string, value: number) => {
    setQuotationItems(quotationItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const costs = calculateItemCosts(updatedItem);
        return { ...updatedItem, ...costs };
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotalAmount = quotationItems.reduce((sum, item) => sum + item.totalCost, 0);
  const grandTotal = subtotalAmount + form.orderTax + form.shipping - form.discount;

  const handleSubmit = () => {
    if (!form.customer.name || quotationItems.length === 0) {
      alert("Please fill in all required fields and add at least one item.");
      return;
    }

    const updatedQuotation: Quotation = {
      id: quotation?.id || "",
      customer: form.customer,
      date: form.date,
      reference: form.reference,
      status: form.status as "Sent" | "Pending" | "Ordered",
      total: grandTotal,
      items: quotationItems,
      orderTax: form.orderTax,
      discount: form.discount,
      shipping: form.shipping,
      grandTotal,
      description: form.description,
    };

    onUpdate(updatedQuotation);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Quotation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Customer and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <div className="relative">
                <select
                  value={form.customer.name}
                  onChange={(e) => {
                    const selectedCustomer = customers.find(c => c.name === e.target.value);
                    if (selectedCustomer) {
                      setForm({ ...form, customer: selectedCustomer });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.name} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white rounded p-1">
                  <User size={12} />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter reference"
              />
            </div>
          </div>

          {/* Product Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              placeholder="Please type product code and select..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Product Table */}
          <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Purchase Price($)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Discount($)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax(%)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax Amount($)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Cost($)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Cost($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotationItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-red-600">
                              {item.product.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{item.product}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateItem(item.id, "qty", Math.max(1, item.qty - 1))}
                            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="mx-2 text-sm">{item.qty}</span>
                          <button
                            onClick={() => updateItem(item.id, "qty", item.qty + 1)}
                            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(item.id, "purchasePrice", Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, "discount", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, "tax", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.taxAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                  
                  {/* Add New Item Row */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3">
                      <select
                        value={newItem.product}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.name} value={product.name}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newItem.qty}
                        onChange={(e) => handleItemChange("qty", Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newItem.purchasePrice}
                        onChange={(e) => handleItemChange("purchasePrice", Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newItem.discount}
                        onChange={(e) => handleItemChange("discount", Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newItem.tax}
                        onChange={(e) => handleItemChange("tax", Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {newItem.taxAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {newItem.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {newItem.totalCost.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Tax</span>
                    <span className="text-gray-900">$ {form.orderTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-gray-900">$ {form.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">$ {form.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span className="text-gray-900">Grand Total</span>
                    <span className="text-gray-900">$ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Item Button */}
            <div className="p-4 border-t">
              <button
                onClick={addItem}
                disabled={!newItem.product}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Order Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Order Tax */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Tax
              </label>
              <input
                type="number"
                value={form.orderTax}
                onChange={(e) => setForm({ ...form, orderTax: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount
              </label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
            </div>

            {/* Shipping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping
              </label>
              <input
                type="number"
                value={form.shipping}
                onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="border border-gray-300 rounded-lg">
              <div className="flex items-center gap-2 p-3 border-b border-gray-200">
                <select className="text-sm border-none bg-transparent">
                  <option>Normal</option>
                </select>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <strong>B</strong>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <em>I</em>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <u>U</u>
                  </button>
                </div>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 border-none resize-none focus:outline-none"
                rows={4}
                placeholder="Enter description..."
              />
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

export default EditQuotationModal;

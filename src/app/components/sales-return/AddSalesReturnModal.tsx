"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export interface SalesReturnItem {
  id: string;
  product: string;
  netUnitPrice: number;
  stock: number;
  quantity: number;
  discount: number;
  taxPercent: number;
  subtotal: number;
}

export interface SalesReturn {
  id: string;
  customer: {
    name: string;
    avatar: string;
    color: string;
  };
  date: string;
  reference: string;
  linkedInvoiceRef?: string;
  status: "Received" | "Pending" | "Ordered";
  total: number;
  paid: number;
  due: number;
  paymentStatus: "Paid" | "Unpaid" | "Pending";
  items: SalesReturnItem[];
  orderTax: number;
  discount: number;
  shipping: number;
  grandTotal: number;
}

const DEFAULT_CUSTOMER_OPTIONS = ["Carl Evans", "Minerva Rametz", "Robert Lamon", "Patricia Lewis", "Mark Jordyn"];

interface AddSalesReturnModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (salesReturn: SalesReturn) => void;
  /** Customer names from API for dropdown; if not provided, uses default list */
  customerNames?: string[];
  /** Prefill when starting return from an invoice (e.g. from edit sale page) */
  initialInvoiceRef?: string;
  initialCustomerName?: string;
}

const AddSalesReturnModal: React.FC<AddSalesReturnModalProps> = ({
  open,
  onClose,
  onAdd,
  customerNames,
  initialInvoiceRef = "",
  initialCustomerName = "",
}) => {
  const customerOptions = Array.from(
    new Set(
      ((customerNames && customerNames.length > 0) ? customerNames : DEFAULT_CUSTOMER_OPTIONS)
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    )
  );
  const [form, setForm] = useState<Omit<SalesReturn, 'id'>>({
    customer: {
      name: "",
      avatar: "user",
      color: "bg-gray-100",
    },
    date: "",
    reference: "",
    linkedInvoiceRef: "",
    status: "Pending",
    total: 0,
    paid: 0,
    due: 0,
    paymentStatus: "Unpaid",
    items: [],
    orderTax: 0,
    discount: 0,
    shipping: 0,
    grandTotal: 0,
  });

  const [newItem, setNewItem] = useState<Omit<SalesReturnItem, 'id' | 'subtotal'>>({
    product: "",
    netUnitPrice: 0,
    stock: 0,
    quantity: 1,
    discount: 0,
    taxPercent: 0,
  });

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().slice(0, 10);
      setForm({
        customer: {
          name: initialCustomerName || "",
          avatar: "user",
          color: "bg-gray-100",
        },
        date: today,
        reference: "",
        linkedInvoiceRef: initialInvoiceRef || "",
        status: "Pending",
        total: 0,
        paid: 0,
        due: 0,
        paymentStatus: "Unpaid",
        items: [],
        orderTax: 0,
        discount: 0,
        shipping: 0,
        grandTotal: 0,
      });
      setNewItem({
        product: "",
        netUnitPrice: 0,
        stock: 0,
        quantity: 1,
        discount: 0,
        taxPercent: 0,
      });
    }
  }, [open, initialInvoiceRef, initialCustomerName]);

  const calculateSubtotal = (item: Omit<SalesReturnItem, 'id' | 'subtotal'>) => {
    const baseAmount = item.netUnitPrice * item.quantity;
    const discountAmount = (baseAmount * item.discount) / 100;
    const afterDiscount = baseAmount - discountAmount;
    const taxAmount = (afterDiscount * item.taxPercent) / 100;
    return afterDiscount + taxAmount;
  };

  const addItem = () => {
    if (newItem.product && newItem.netUnitPrice > 0 && newItem.quantity > 0) {
      const subtotal = calculateSubtotal(newItem);
      const item: SalesReturnItem = {
        id: Date.now().toString(),
        ...newItem,
        subtotal,
      };
      
      const updatedItems = [...form.items, item];
      const itemsTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const grandTotal = itemsTotal + form.orderTax - form.discount + form.shipping;
      
      setForm(prev => ({
        ...prev,
        items: updatedItems,
        total: itemsTotal,
        grandTotal,
        due: grandTotal - prev.paid,
      }));
      
      setNewItem({
        product: "",
        netUnitPrice: 0,
        stock: 0,
        quantity: 1,
        discount: 0,
        taxPercent: 0,
      });
    }
  };

  const removeItem = (id: string) => {
    const updatedItems = form.items.filter(item => item.id !== id);
    const itemsTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const grandTotal = itemsTotal + form.orderTax - form.discount + form.shipping;
    
    setForm(prev => ({
      ...prev,
      items: updatedItems,
      total: itemsTotal,
      grandTotal,
      due: grandTotal - prev.paid,
    }));
  };

  const updateCalculations = (orderTax: number, discount: number, shipping: number) => {
    const itemsTotal = form.items.reduce((sum, item) => sum + item.subtotal, 0);
    const grandTotal = itemsTotal + orderTax - discount + shipping;
    
    setForm(prev => ({
      ...prev,
      orderTax,
      discount,
      shipping,
      grandTotal,
      due: grandTotal - prev.paid,
    }));
  };

  const generateReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `SR${timestamp}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-2 p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-red-500 hover:bg-red-100 rounded-full p-1"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg
            width={20}
            height={20}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        <h2 className="text-2xl font-semibold mb-6">Add Sales Return</h2>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.customer.name && form.items.length > 0) {
              onAdd({
                ...form,
                id: Date.now().toString(),
                reference: form.reference || generateReference(),
              });
              onClose();
            }
          }}
          className="space-y-6"
        >
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-base font-medium mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.customer.name}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  customer: { ...prev.customer, name: e.target.value }
                }))}
                required
              >
                <option value="">Choose Customer</option>
                {customerOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-base font-medium mb-1">
                Reference <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.reference}
                onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-base font-medium mb-1">Original invoice #</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.linkedInvoiceRef ?? ""}
                onChange={(e) => setForm(prev => ({ ...prev, linkedInvoiceRef: e.target.value }))}
                placeholder="e.g. INV-000002"
              />
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-base font-medium mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              placeholder="Please type product code and select"
              value={newItem.product}
              onChange={(e) => setNewItem(prev => ({ ...prev, product: e.target.value }))}
            />
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-medium mb-4">Return Items</h3>
            
            {/* Add Item Form */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Net Unit Price (£)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.netUnitPrice}
                  onChange={(e) => setNewItem(prev => ({ ...prev, netUnitPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.stock}
                  onChange={(e) => setNewItem(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">QTY</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount (£)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.discount}
                  onChange={(e) => setNewItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.taxPercent}
                  onChange={(e) => setNewItem(prev => ({ ...prev, taxPercent: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* Items Table */}
            {form.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Unit Price (£)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">QTY</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Discount (£)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax %</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subtotal (£)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {form.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.product}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">£{item.netUnitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.stock}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">£{item.discount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.taxPercent}%</td>
                        <td className="px-4 py-3 text-sm text-gray-900">£{item.subtotal.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Order Summary */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Order Tax:</span>
                  <span>£{form.orderTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>£{form.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>£{form.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Grand Total:</span>
                  <span>£{form.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-base font-medium mb-1">
                Order Tax <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.orderTax}
                onChange={(e) => updateCalculations(parseFloat(e.target.value) || 0, form.discount, form.shipping)}
              />
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">
                Discount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.discount}
                onChange={(e) => updateCalculations(form.orderTax, parseFloat(e.target.value) || 0, form.shipping)}
              />
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">
                Shipping <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.shipping}
                onChange={(e) => updateCalculations(form.orderTax, form.discount, parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as "Received" | "Pending" | "Ordered" }))}
              >
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Ordered">Ordered</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              className="px-6 py-2 rounded-md bg-[#0a2342] text-white hover:bg-[#16335b] font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-orange-400 text-white hover:bg-orange-500 font-medium"
              disabled={!form.customer.name || form.items.length === 0}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalesReturnModal;

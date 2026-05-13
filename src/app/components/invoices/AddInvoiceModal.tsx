"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export interface InvoiceItem {
  id: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  invoiceNo: string;
  customer: {
    name: string;
    avatar: string;
    color: string;
  };
  dueDate: string;
  amount: number;
  paid: number;
  amountDue: number;
  status: "Paid" | "Unpaid" | "Overdue";
  items: InvoiceItem[];
}

interface AddInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (invoice: Invoice) => void;
}

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [form, setForm] = useState<Omit<Invoice, 'invoiceNo'>>({
    customer: {
      name: "",
      avatar: "user",
      color: "bg-gray-100",
    },
    dueDate: "",
    amount: 0,
    paid: 0,
    amountDue: 0,
    status: "Unpaid",
    items: [],
  });

  const [newItem, setNewItem] = useState<Omit<InvoiceItem, 'id' | 'total'>>({
    product: "",
    quantity: 1,
    price: 0,
  });

  useEffect(() => {
    if (open) {
      setForm({
        customer: {
          name: "",
          avatar: "user",
          color: "bg-gray-100",
        },
        dueDate: "",
        amount: 0,
        paid: 0,
        amountDue: 0,
        status: "Unpaid",
        items: [],
      });
      setNewItem({
        product: "",
        quantity: 1,
        price: 0,
      });
    }
  }, [open]);

  const addItem = () => {
    if (newItem.product && newItem.quantity > 0 && newItem.price > 0) {
      const total = newItem.quantity * newItem.price;
      const item: InvoiceItem = {
        id: Date.now().toString(),
        ...newItem,
        total,
      };
      
      const updatedItems = [...form.items, item];
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      setForm(prev => ({
        ...prev,
        items: updatedItems,
        amount: totalAmount,
        amountDue: totalAmount - prev.paid,
      }));
      
      setNewItem({
        product: "",
        quantity: 1,
        price: 0,
      });
    }
  };

  const removeItem = (id: string) => {
    const updatedItems = form.items.filter(item => item.id !== id);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setForm(prev => ({
      ...prev,
      items: updatedItems,
      amount: totalAmount,
      amountDue: totalAmount - prev.paid,
    }));
  };

  const handlePaidChange = (paid: number) => {
    setForm(prev => ({
      ...prev,
      paid,
      amountDue: prev.amount - paid,
      status: paid >= prev.amount ? "Paid" : paid > 0 ? "Unpaid" : "Unpaid",
    }));
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `INV${timestamp}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-2 p-8 relative max-h-[90vh] overflow-y-auto">
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
        
        <h2 className="text-2xl font-semibold mb-6">Add Invoice</h2>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.customer.name && form.items.length > 0) {
              onAdd({
                ...form,
                invoiceNo: generateInvoiceNumber(),
              });
              onClose();
            }
          }}
          className="space-y-6"
        >
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.customer.name}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  customer: { ...prev.customer, name: e.target.value }
                }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.dueDate}
                onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Invoice Items Table */}
          <div>
            <h3 className="text-lg font-medium mb-4">Invoice Items</h3>
            
            {/* Add Item Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.product}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product: e.target.value }))}
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>

            {/* Items Table */}
            {form.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {form.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.product}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">${item.total.toFixed(2)}</td>
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
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-base font-medium mb-1">Total Amount</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                value={`$${form.amount.toFixed(2)}`}
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">Paid Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.paid}
                onChange={(e) => handlePaidChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <label className="block text-base font-medium mb-1">Amount Due</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                value={`$${form.amountDue.toFixed(2)}`}
                readOnly
              />
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
              Add Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvoiceModal;

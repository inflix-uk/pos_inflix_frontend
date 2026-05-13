"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2, User, Calendar } from "lucide-react";
import { SalesReturn } from "./AddSalesReturnModal";
import { salesApi } from "@/app/(routes)/sales-dashboard/service/salesApi";

const DEFAULT_CUSTOMER_OPTIONS = ["Thomas", "Carl Evans", "Minerva Rametz", "Robert Lamon", "Mark Jordyn", "Patricia Lewis", "Marsha Betts", "Daniel Jude", "Emma Bates", "Richard Fralick", "Michelle Robison"];

type ReturnLineOption = {
  lineIndex: number;
  sku: string;
  name: string;
  price: number;
  qtyReturnable: number;
};

interface EditSalesReturnModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedSalesReturn: SalesReturn) => void;
  salesReturn: SalesReturn | null;
  /** Customer names from API for dropdown; if not provided, uses default list */
  customerNames?: string[];
}

interface ReturnItem {
  id: string;
  product: string;
  netUnitPrice: number;
  stock: number;
  quantity: number;
  discount: number;
  taxPercent: number;
  subtotal: number;
  serialNumbers?: string[];
}

const EditSalesReturnModal: React.FC<EditSalesReturnModalProps> = ({
  open,
  onClose,
  onUpdate,
  salesReturn,
  customerNames,
}) => {
  const customerOptions = (customerNames && customerNames.length > 0) ? customerNames : DEFAULT_CUSTOMER_OPTIONS;
  const [form, setForm] = useState({
    customer: { name: "", avatar: "user", color: "bg-blue-100" },
    date: "",
    reference: "",
    linkedInvoiceRef: "",
    status: "Pending" as "Pending" | "Received" | "Ordered",
    paymentStatus: "Unpaid" as "Paid" | "Unpaid" | "Pending",
    orderTax: 0,
    discount: 0,
    shipping: 0,
  });

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [newItem, setNewItem] = useState({
    product: "",
    netUnitPrice: 0,
    stock: 0,
    quantity: 1,
    discount: 0,
    taxPercent: 0,
  });
  const [invoiceReturnLines, setInvoiceReturnLines] = useState<ReturnLineOption[]>([]);
  const [loadingReturnLines, setLoadingReturnLines] = useState(false);
  const [newItemSelectedLineIndex, setNewItemSelectedLineIndex] = useState<number | null>(null);

  const statuses = ["Pending", "Received", "Ordered"];

  // Fetch returnable lines from the linked invoice when Original invoice # is set
  const linkedRef = form.linkedInvoiceRef?.trim() || (salesReturn && (salesReturn as { linkedInvoiceRef?: string }).linkedInvoiceRef) || "";
  const fetchReturnLines = useCallback(async () => {
    if (!linkedRef) {
      setInvoiceReturnLines([]);
      return;
    }
    setLoadingReturnLines(true);
    try {
      const listRes = await salesApi.getSales({ search: linkedRef, limit: 1 });
      const list = listRes?.data ?? [];
      const sale = list[0];
      if (!sale?._id) {
        setInvoiceReturnLines([]);
        return;
      }
      const linesRes = await salesApi.getReturnLines(sale._id);
      const lines = linesRes.data?.lines ?? [];
      setInvoiceReturnLines(
        lines
          .filter((l: { qtyReturnable: number }) => l.qtyReturnable > 0)
          .map((l: { lineIndex: number; sku: string; name: string; price: number; qtyReturnable: number }) => ({
            lineIndex: l.lineIndex,
            sku: l.sku,
            name: l.name,
            price: l.price,
            qtyReturnable: l.qtyReturnable,
          }))
      );
    } catch {
      setInvoiceReturnLines([]);
    } finally {
      setLoadingReturnLines(false);
    }
  }, [linkedRef]);

  useEffect(() => {
    if (open && linkedRef) fetchReturnLines();
    if (!linkedRef) setInvoiceReturnLines([]);
    setNewItemSelectedLineIndex(null);
  }, [open, linkedRef, fetchReturnLines]);

  // Initialize form with sales return data when modal opens
  useEffect(() => {
    if (open && salesReturn) {
      setForm({
        customer: salesReturn.customer,
        date: salesReturn.date,
        reference: salesReturn.reference,
        linkedInvoiceRef: (salesReturn as { linkedInvoiceRef?: string }).linkedInvoiceRef ?? "",
        status: salesReturn.status,
        paymentStatus: salesReturn.paymentStatus,
        orderTax: salesReturn.orderTax,
        discount: salesReturn.discount,
        shipping: salesReturn.shipping,
      });
      setReturnItems(salesReturn.items);
    }
  }, [open, salesReturn]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setForm({
        customer: { name: "", avatar: "user", color: "bg-blue-100" },
        date: "",
        reference: "",
        linkedInvoiceRef: "",
        status: "Pending",
        paymentStatus: "Unpaid",
        orderTax: 0,
        discount: 0,
        shipping: 0,
      });
      setReturnItems([]);
      setNewItem({
        product: "",
        netUnitPrice: 0,
        stock: 0,
        quantity: 1,
        discount: 0,
        taxPercent: 0,
      });
      setInvoiceReturnLines([]);
      setNewItemSelectedLineIndex(null);
    }
  }, [open]);

  const calculateSubtotal = (item: Partial<ReturnItem>) => {
    const baseAmount = (item.netUnitPrice || 0) * (item.quantity || 0);
    const discountAmount = baseAmount * ((item.discount || 0) / 100);
    const taxableAmount = baseAmount - discountAmount;
    const taxAmount = taxableAmount * ((item.taxPercent || 0) / 100);
    return taxableAmount + taxAmount;
  };

  const handleProductSelect = (value: string) => {
    const lineIndex = Number(value);
    if (Number.isNaN(lineIndex) || value === "") {
      setNewItemSelectedLineIndex(null);
      return;
    }
    const line = invoiceReturnLines.find((l) => l.lineIndex === lineIndex);
    if (line) {
      setNewItemSelectedLineIndex(lineIndex);
      setNewItem((prev) => ({
        ...prev,
        product: line.name,
        netUnitPrice: line.price,
        stock: line.qtyReturnable,
        quantity: Math.min(prev.quantity, line.qtyReturnable || 1),
      }));
    }
  };

  const handleItemChange = (field: string, value: number) => {
    const updatedItem = { ...newItem, [field]: value };
    setNewItem(updatedItem);
  };

  const addItem = () => {
    if (newItem.product && newItem.quantity > 0) {
      const subtotal = calculateSubtotal(newItem);
      const item: ReturnItem = {
        id: Date.now().toString(),
        ...newItem,
        subtotal,
      };
      setReturnItems([...returnItems, item]);
      setNewItem({
        product: "",
        netUnitPrice: 0,
        stock: 0,
        quantity: 1,
        discount: 0,
        taxPercent: 0,
      });
      setNewItemSelectedLineIndex(null);
    }
  };

  const removeItem = (id: string) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: number) => {
    setReturnItems(returnItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        return { ...updatedItem, subtotal: calculateSubtotal(updatedItem) };
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotalAmount = returnItems.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = subtotalAmount + form.orderTax + form.shipping - form.discount;

  const handleSubmit = () => {
    if (!form.customer.name || returnItems.length === 0) {
      alert("Please fill in all required fields and add at least one item.");
      return;
    }

    const updatedSalesReturn: SalesReturn & { linkedInvoiceRef?: string } = {
      id: salesReturn?.id || "",
      customer: form.customer,
      date: form.date,
      reference: form.reference,
      linkedInvoiceRef: form.linkedInvoiceRef || undefined,
      status: form.status,
      total: grandTotal,
      paid: grandTotal,
      due: 0,
      paymentStatus: form.paymentStatus,
      items: returnItems,
      orderTax: form.orderTax,
      discount: form.discount,
      shipping: form.shipping,
      grandTotal,
    };

    onUpdate(updatedSalesReturn);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e0dff091] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Sales Return</h2>
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
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.customer.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm({ ...form, customer: { name, avatar: "user", color: "bg-blue-100" } });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                >
                  <option value="">Select Customer</option>
                  {customerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
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

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter reference"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original invoice #</label>
              <input
                type="text"
                value={form.linkedInvoiceRef}
                onChange={(e) => setForm({ ...form, linkedInvoiceRef: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g. INV-000002"
              />
            </div>
          </div>

          {/* Product Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4">
              <input
                type="text"
                placeholder="Please type product code and select..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-4"
              />

              {/* Product Table */}
              <div className="overflow-x-auto">
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
                    {returnItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-purple-600">
                                {item.product.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">{item.product}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.netUnitPrice}
                            onChange={(e) => updateItem(item.id, "netUnitPrice", Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.stock}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
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
                            value={item.taxPercent}
                            onChange={(e) => updateItem(item.id, "taxPercent", Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.subtotal.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Add New Item Row */}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">
                        <select
                          value={newItemSelectedLineIndex != null ? String(newItemSelectedLineIndex) : ""}
                          onChange={(e) => handleProductSelect(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={loadingReturnLines}
                        >
                          <option value="">
                            {!linkedRef
                              ? "Set Original invoice # to load products"
                              : loadingReturnLines
                                ? "Loading…"
                                : invoiceReturnLines.length === 0
                                  ? "No returnable lines for this invoice"
                                  : "Select Product"}
                          </option>
                          {invoiceReturnLines.map((line) => (
                            <option key={line.lineIndex} value={String(line.lineIndex)}>
                              {line.name} — £{line.price.toFixed(2)} (up to {line.qtyReturnable} returnable)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={newItem.netUnitPrice}
                          onChange={(e) => handleItemChange("netUnitPrice", Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{newItem.stock}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => handleItemChange("quantity", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
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
                          value={newItem.taxPercent}
                          onChange={(e) => handleItemChange("taxPercent", Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {calculateSubtotal(newItem).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={addItem}
                          className="p-1 text-green-500 hover:bg-green-50 rounded"
                          disabled={!newItem.product}
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Tax</span>
                    <span className="text-gray-900">£{form.orderTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-gray-900">£{form.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">£{form.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span className="text-gray-900">Grand Total</span>
                    <span className="text-gray-900">£{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Order Tax */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Tax <span className="text-red-500">*</span>
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
                Discount <span className="text-red-500">*</span>
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
                Shipping <span className="text-red-500">*</span>
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
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "Pending" | "Received" | "Ordered" })}
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

export default EditSalesReturnModal;

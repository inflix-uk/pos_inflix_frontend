"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { AccountFormData } from "../types";

const CURRENCIES = [
 { code: "GBP", label: "£ GBP" },
 { code: "USD", label: "$ USD" },
 { code: "EUR", label: "€ EUR" },
];

interface AddAccountModalProps {
 open: boolean;
 onClose: () => void;
 onCreateCustomer: (data: {
 name: string;
 email: string;
 phone: string;
 address: { street?: string; addressLine2?: string; city?: string; state?: string; zipCode?: string; country?: string };
 companyNumber?: string;
 contactName?: string;
 mobile?: string;
 vatNumber?: string;
 currency?: string;
 isActive: boolean;
 }) => void;
 onCreateSupplier: (data: {
 name: string;
 email: string;
 phone: string;
 address: { street?: string; addressLine2?: string; city?: string; state?: string; zipCode?: string; country?: string };
 contactPerson: string;
 companyNumber?: string;
 mobile?: string;
 vatNumber?: string;
 currency?: string;
 isActive: boolean;
 }) => void;
 isLoading: boolean;
}

const initialForm: AccountFormData = {
 accountType: "customer",
 currency: "GBP",
 name: "",
 companyNumber: "",
 phone: "",
 address1: "",
 city: "",
 country: "United Kingdom",
 contactName: "",
 vatNumber: "",
 mobile: "",
 address2: "",
 postcode: "",
 email: "",
 isActive: true,
};

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
 open,
 onClose,
 onCreateCustomer,
 onCreateSupplier,
 isLoading,
}) => {
 const [formData, setFormData] = useState<AccountFormData>(initialForm);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const address = {
 street: formData.address1 || undefined,
 addressLine2: formData.address2 || undefined,
 city: formData.city || undefined,
 zipCode: formData.postcode || undefined,
 country: formData.country || "United Kingdom",
 };
 if (formData.accountType === "customer") {
 onCreateCustomer({
 name: formData.name,
 email: formData.email,
 phone: formData.phone,
 address,
 companyNumber: formData.companyNumber || undefined,
 contactName: formData.contactName || undefined,
 mobile: formData.mobile || undefined,
 vatNumber: formData.vatNumber || undefined,
 currency: formData.currency || undefined,
 isActive: formData.isActive,
 });
 } else {
 onCreateSupplier({
 name: formData.name,
 email: formData.email,
 phone: formData.phone,
 address,
 contactPerson: formData.contactName || "",
 companyNumber: formData.companyNumber || undefined,
 mobile: formData.mobile || undefined,
 vatNumber: formData.vatNumber || undefined,
 currency: formData.currency || undefined,
 isActive: formData.isActive,
 });
 }
 setFormData(initialForm);
 };

 if (!open) return null;

 const inputClass =
 "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
 const labelClass = "block text-sm font-medium text-gray-700 mb-1";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/20" aria-hidden />
 <div className="@container relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
 <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
  <h2 className="text-xl font-semibold text-gray-900">Create New Account</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-5">
  <div className="grid grid-cols-1 @[640px]:grid-cols-2 @[1024px]:grid-cols-3 gap-4">
  <div>
  <label className={labelClass}>Account Type *</label>
  <select
  required
  value={formData.accountType}
  onChange={(e) =>
   setFormData((prev) => ({
   ...prev,
   accountType: e.target.value as "customer" | "supplier",
   }))
  }
  className={inputClass}
  >
  <option value="customer">Customer</option>
  <option value="supplier">Supplier</option>
  </select>
  </div>
  <div>
  <label className={labelClass}>Currency *</label>
  <select
  value={formData.currency}
  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
  className={inputClass}
  >
  {CURRENCIES.map((c) => (
   <option key={c.code} value={c.code}>
   {c.label}
   </option>
  ))}
  </select>
  </div>
  <div>
  <label className={labelClass}>Company *</label>
  <input
  type="text"
  required
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  className={inputClass}
  placeholder="Company name"
  />
  </div>

  <div>
  <label className={labelClass}>Company Number</label>
  <input
  type="text"
  value={formData.companyNumber}
  onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
  className={inputClass}
  placeholder="Company number"
  />
  </div>
  <div>
  <label className={labelClass}>Vat Number</label>
  <input
  type="text"
  value={formData.vatNumber}
  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
  className={inputClass}
  placeholder="VAT number"
  />
  </div>
  <div>
  <label className={labelClass}>Contact Name</label>
  <input
  type="text"
  value={formData.contactName}
  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
  className={inputClass}
  placeholder="Contact name"
  />
  </div>

  <div>
  <label className={labelClass}>Phone *</label>
  <input
  type="tel"
  required
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  className={inputClass}
  placeholder="Phone"
  />
  </div>
  <div>
  <label className={labelClass}>Mobile</label>
  <input
  type="tel"
  value={formData.mobile}
  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
  className={inputClass}
  placeholder="Mobile"
  />
  </div>
  <div>
  <label className={labelClass}>Email</label>
  <input
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  className={inputClass}
  placeholder="Email"
  />
  </div>

  <div>
  <label className={labelClass}>City</label>
  <input
  type="text"
  value={formData.city}
  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
  className={inputClass}
  placeholder="City"
  />
  </div>
  <div>
  <label className={labelClass}>Postcode</label>
  <input
  type="text"
  value={formData.postcode}
  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
  className={inputClass}
  placeholder="Postcode"
  />
  </div>
  <div>
  <label className={labelClass}>Country</label>
  <input
  type="text"
  value={formData.country}
  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
  className={inputClass}
  placeholder="Country"
  />
  </div>

  <div className="@[640px]:col-span-2 @[1024px]:col-span-3">
  <label className={labelClass}>Address 1</label>
  <input
  type="text"
  value={formData.address1}
  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
  className={inputClass}
  placeholder="Address line 1"
  />
  </div>
  <div className="@[640px]:col-span-2 @[1024px]:col-span-3">
  <label className={labelClass}>Address 2</label>
  <input
  type="text"
  value={formData.address2}
  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
  className={inputClass}
  placeholder="Address line 2"
  />
  </div>
  </div>

  <div className="flex items-center gap-2">
  <input
  type="checkbox"
  id="isActive"
  checked={formData.isActive}
  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
  </div>

  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
  <button
  type="button"
  onClick={onClose}
  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isLoading}
  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
  >
  {isLoading ? "Creating..." : "Create Account"}
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { Supplier, SupplierFormData } from "../types";
import { supplierApi } from "../service/supplierApi";

const CURRENCIES = [
 { code: "GBP", label: "£ GBP" },
 { code: "USD", label: "$ USD" },
 { code: "EUR", label: "€ EUR" },
];

const emptyForm = (): SupplierFormData => ({
 name: "",
 email: "",
 phone: "",
 address: {
 street: "",
 addressLine2: "",
 city: "",
 state: "",
 zipCode: "",
 country: "United Kingdom",
 },
 contactPerson: "",
 companyNumber: "",
 mobile: "",
 vatNumber: "",
 currency: "GBP",
 isActive: true,
});

function supplierToFormData(s: Supplier): SupplierFormData {
 return {
 name: s.name,
 email: s.email || "",
 phone: s.phone,
 address: {
 street: s.address?.street || "",
 addressLine2: s.address?.addressLine2 || "",
 city: s.address?.city || "",
 state: s.address?.state || "",
 zipCode: s.address?.zipCode || "",
 country: s.address?.country || "United Kingdom",
 },
 contactPerson: s.contactPerson || "",
 companyNumber: s.companyNumber || "",
 mobile: s.mobile || "",
 vatNumber: s.vatNumber || "",
 currency: s.currency || "GBP",
 isActive: s.isActive,
 };
}

interface EditSupplierModalProps {
 open: boolean;
 supplier: Supplier | null;
 onClose: () => void;
 onSave: (id: string, accountType: "customer" | "supplier", data: Partial<SupplierFormData>) => void;
 isLoading: boolean;
}

export const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
 open,
 supplier,
 onClose,
 onSave,
 isLoading,
}) => {
 const [accountType, setAccountType] = useState<"customer" | "supplier">("supplier");
 const [formData, setFormData] = useState<SupplierFormData>(emptyForm);
 const [detailLoading, setDetailLoading] = useState(false);
 const supplierRowRef = useRef<Supplier | null>(null);
 supplierRowRef.current = supplier;

 useEffect(() => {
 if (!open || !supplier?._id) {
 return;
 }
 const id = supplier._id;
 let cancelled = false;
 setDetailLoading(true);
 (async () => {
 const fallback = supplierRowRef.current;
 try {
 const res = await supplierApi.getSupplier(id);
 const full =
  res.success && res.data ? (res.data as Supplier) : fallback;
 if (cancelled || !full) return;
 setAccountType("supplier");
 setFormData(supplierToFormData(full));
 } catch {
 const s = fallback;
 if (!cancelled && s) {
  setFormData(supplierToFormData(s));
 }
 } finally {
 if (!cancelled) setDetailLoading(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [open, supplier?._id]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (supplier?._id) onSave(supplier._id, accountType, formData);
 };

 if (!open || !supplier) return null;

 const inputClass =
 "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
 const labelClass = "block text-sm font-medium text-gray-700 mb-1";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/20" aria-hidden />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
 <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
  <h2 className="text-xl font-semibold text-gray-900">Edit supplier</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
  <X size={20} />
  </button>
 </div>

 {detailLoading ? (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
  <p className="text-sm">Loading supplier details…</p>
  </div>
 ) : (
  <form onSubmit={handleSubmit} className="p-6 space-y-5">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>
  <label className={labelClass}>Account type</label>
  <select
  value={accountType}
  onChange={(e) => setAccountType(e.target.value as "customer" | "supplier")}
  className={inputClass}
  >
  <option value="customer">Customer</option>
  <option value="supplier">Supplier</option>
  </select>
  </div>
  <div>
  <label className={labelClass}>Currency</label>
  <select
   value={formData.currency || "GBP"}
   onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
   className={inputClass}
  >
   {CURRENCIES.map((c) => (
   <option key={c.code} value={c.code}>
   {c.label}
   </option>
   ))}
   {!CURRENCIES.some((c) => c.code === (formData.currency || "GBP")) && formData.currency && (
   <option value={formData.currency}>{formData.currency}</option>
   )}
  </select>
  </div>
  <div>
  <label className={labelClass}>Supplier name *</label>
  <input
   type="text"
   required
   value={formData.name}
   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
   className={inputClass}
   placeholder="Supplier name"
  />
  </div>

  <div>
  <label className={labelClass}>Company number</label>
  <input
   type="text"
   value={formData.companyNumber || ""}
   onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
   className={inputClass}
   placeholder="Company number"
  />
  </div>
  <div>
  <label className={labelClass}>VAT number</label>
  <input
   type="text"
   value={formData.vatNumber || ""}
   onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
   className={inputClass}
   placeholder="VAT number"
  />
  </div>
  <div>
  <label className={labelClass}>Contact person</label>
  <input
   type="text"
   value={formData.contactPerson}
   onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
   className={inputClass}
   placeholder="Contact person"
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
   value={formData.mobile || ""}
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
   value={formData.address.city}
   onChange={(e) =>
   setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })
   }
   className={inputClass}
   placeholder="City"
  />
  </div>
  <div>
  <label className={labelClass}>Postcode</label>
  <input
   type="text"
   value={formData.address.zipCode || ""}
   onChange={(e) =>
   setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })
   }
   className={inputClass}
   placeholder="Postcode"
  />
  </div>
  <div>
  <label className={labelClass}>Country</label>
  <input
   type="text"
   value={formData.address.country}
   onChange={(e) =>
   setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })
   }
   className={inputClass}
   placeholder="Country"
  />
  </div>

  <div>
  <label className={labelClass}>State / region</label>
  <input
   type="text"
   value={formData.address.state || ""}
   onChange={(e) =>
   setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })
   }
   className={inputClass}
   placeholder="State / region"
  />
  </div>

  <div className="sm:col-span-2 lg:col-span-3">
  <label className={labelClass}>Address line 1</label>
  <input
   type="text"
   value={formData.address.street}
   onChange={(e) =>
   setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })
   }
   className={inputClass}
   placeholder="Street / line 1"
  />
  </div>
  <div className="sm:col-span-2 lg:col-span-3">
  <label className={labelClass}>Address line 2</label>
  <input
   type="text"
   value={formData.address.addressLine2 || ""}
   onChange={(e) =>
   setFormData({ ...formData, address: { ...formData.address, addressLine2: e.target.value } })
   }
   className={inputClass}
   placeholder="Address line 2"
  />
  </div>
  </div>

  {accountType === "customer" && (
  <p className="text-xs text-gray-500">
  Saving will update this supplier and add a Customer account with the same details. No record is removed.
  </p>
  )}

  <div className="flex items-center gap-2">
  <input
  type="checkbox"
  id="supplierEditIsActive"
  checked={formData.isActive}
  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  <label htmlFor="supplierEditIsActive" className="text-sm text-gray-700">
  Active
  </label>
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
  {isLoading ? "Updating…" : "Update supplier"}
  </button>
  </div>
  </form>
 )}
 </div>
 </div>
 );
};

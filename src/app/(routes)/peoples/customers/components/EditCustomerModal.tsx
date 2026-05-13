"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { Customer, CustomerFormData } from "../types";
import { customerApi } from "../service";
import { pricingGroupApi, type PricingGroup } from "../service/pricingGroupApi";

const CURRENCIES = [
 { code: "GBP", label: "£ GBP" },
 { code: "USD", label: "$ USD" },
 { code: "EUR", label: "€ EUR" },
];

const emptyForm = (): CustomerFormData => ({
 name: "",
 email: "",
 phone: "",
 address: { street: "", addressLine2: "", city: "", state: "", zipCode: "", country: "United Kingdom" },
 companyNumber: "",
 contactName: "",
 mobile: "",
 vatNumber: "",
 currency: "GBP",
 isActive: true,
 useInRepairs: true,
 pricingGroupId: null,
});

function customerToFormData(c: Customer): CustomerFormData {
 return {
 name: c.name,
 email: c.email || "",
 phone: c.phone,
 address: {
 street: c.address?.street || "",
 addressLine2: c.address?.addressLine2 || "",
 city: c.address?.city || "",
 state: c.address?.state || "",
 zipCode: c.address?.zipCode || "",
 country: c.address?.country || "United Kingdom",
 },
 companyNumber: c.companyNumber || "",
 contactName: c.contactName || "",
 mobile: c.mobile || "",
 vatNumber: c.vatNumber || "",
 currency: c.currency || "GBP",
 isActive: c.isActive,
 useInRepairs: c.useInRepairs !== false,
 pricingGroupId: c.pricingGroupId ?? null,
 };
}

const formatMoney = (n: number) =>
 new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

interface EditCustomerModalProps {
 open: boolean;
 customer: Customer | null;
 onClose: () => void;
 onSave: (id: string, accountType: "customer" | "supplier", data: CustomerFormData) => void;
 isLoading: boolean;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ open, customer, onClose, onSave, isLoading }) => {
 const [accountType, setAccountType] = useState<"customer" | "supplier">("customer");
 const [formData, setFormData] = useState<CustomerFormData>(emptyForm);
 const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
 const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
 const [detailLoading, setDetailLoading] = useState(false);
 const customerRowRef = useRef<Customer | null>(null);
 customerRowRef.current = customer;

 useEffect(() => {
 if (open) {
 pricingGroupApi.getList().then((res) => {
 if (res.success && Array.isArray(res.data)) setPricingGroups(res.data);
 });
 }
 }, [open]);

 useEffect(() => {
 if (!open || !customer?._id) {
 setDetailCustomer(null);
 return;
 }
 const id = customer._id;
 let cancelled = false;
 setDetailLoading(true);
 setDetailCustomer(null);
 (async () => {
 const fallback = customerRowRef.current;
 try {
 const res = await customerApi.getById(id);
 const full = res.success && res.data ? res.data : fallback;
 if (cancelled || !full) return;
 setDetailCustomer(full);
 setAccountType("customer");
 setFormData(customerToFormData(full));
 } catch {
 const c = fallback;
 if (!cancelled && c) {
  setDetailCustomer(c);
  setAccountType("customer");
  setFormData(customerToFormData(c));
 }
 } finally {
 if (!cancelled) setDetailLoading(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [open, customer?._id]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (customer?._id) onSave(customer._id, accountType, formData);
 };

 if (!open || !customer) return null;

 const stats = detailCustomer;

 const inputClass =
 "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
 const labelClass = "block text-sm font-medium text-gray-700 mb-1";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/20" aria-hidden />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
 <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
  <h2 className="text-xl font-semibold text-gray-900">Edit Customer</h2>
  <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
  <X size={20} />
  </button>
 </div>

 {detailLoading ? (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
  <p className="text-sm">Loading customer details…</p>
  </div>
 ) : (
  <form onSubmit={handleSubmit} className="p-6 space-y-5">
  {stats && (stats.balance != null || stats.loyaltyPoints != null || stats.totalPurchases != null) && (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
  {stats.balance != null && (
   <div>
   <span className="text-gray-500 block text-xs uppercase tracking-wide">Balance</span>
   <span className="font-semibold tabular-nums">{formatMoney(Number(stats.balance))}</span>
   </div>
  )}
  {stats.loyaltyPoints != null && (
   <div>
   <span className="text-gray-500 block text-xs uppercase tracking-wide">Loyalty points</span>
   <span className="font-semibold tabular-nums">{stats.loyaltyPoints}</span>
   </div>
  )}
  {stats.totalPurchases != null && (
   <div>
   <span className="text-gray-500 block text-xs uppercase tracking-wide">Total purchases</span>
   <span className="font-semibold tabular-nums">{formatMoney(Number(stats.totalPurchases))}</span>
   </div>
  )}
  </div>
  )}

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
  <label className={labelClass}>Name *</label>
  <input
   type="text"
   required
   value={formData.name}
   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
   className={inputClass}
   placeholder="Company or customer name"
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
  <label className={labelClass}>Contact name</label>
  <input
   type="text"
   value={formData.contactName || ""}
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
   onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
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
   onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
   className={inputClass}
   placeholder="State / region"
  />
  </div>
  <div className="sm:col-span-1 lg:col-span-2">
  <label className={labelClass}>Pricing group (optional)</label>
  <select
   value={formData.pricingGroupId ?? ""}
   onChange={(e) => setFormData({ ...formData, pricingGroupId: e.target.value || null })}
   className={inputClass}
  >
   <option value="">None (default pricing)</option>
   {pricingGroups.map((g) => (
   <option key={g._id} value={g._id}>
   {g.name}
   </option>
   ))}
  </select>
  </div>

  <div className="sm:col-span-2 lg:col-span-3">
  <label className={labelClass}>Address line 1</label>
  <input
  type="text"
  value={formData.address.street}
  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
  className={inputClass}
  placeholder="Street / address line 1"
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

  {accountType === "supplier" && (
  <p className="text-xs text-gray-500">
  Saving will update this customer and add a Supplier account with the same details. No record is removed.
  </p>
  )}

  <div className="flex items-center gap-2">
  <input
  type="checkbox"
  id="editIsActive"
  checked={formData.isActive}
  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  <label htmlFor="editIsActive" className="text-sm text-gray-700">
  Active
  </label>
  </div>
  <div className="flex items-center gap-2">
  <input
  type="checkbox"
  id="editUseInRepairs"
  checked={formData.useInRepairs !== false}
  onChange={(e) => setFormData({ ...formData, useInRepairs: e.target.checked })}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  <label htmlFor="editUseInRepairs" className="text-sm text-gray-700">
  Show in repair tickets
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
  {isLoading ? "Updating…" : "Update customer"}
  </button>
  </div>
  </form>
 )}
 </div>
 </div>
 );
};

"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CustomerFormData } from "../types";
import { pricingGroupApi, type PricingGroup } from "../service/pricingGroupApi";

interface AddCustomerModalProps { open: boolean; onClose: () => void; onAdd: (data: CustomerFormData) => void; isLoading: boolean; }

const initialForm: CustomerFormData = {
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
};

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ open, onClose, onAdd, isLoading }) => {
 const [formData, setFormData] = useState<CustomerFormData>(initialForm);
 const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);

 useEffect(() => {
 if (open) {
 pricingGroupApi.getList().then((res) => {
 if (res.success && Array.isArray(res.data)) setPricingGroups(res.data);
 });
 }
 }, [open]);

 const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAdd(formData); setFormData(initialForm); };

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/20" aria-hidden />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Add Customer</h2>
  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
 </div>
 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <div className="grid grid-cols-2 gap-4">
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Customer name" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Phone" /></div>
  </div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Email" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Street</label><input type="text" value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Street" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Address line 2</label><input type="text" value={formData.address.addressLine2 || ""} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine2: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Address line 2" /></div>
  <div className="grid grid-cols-2 gap-4">
  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="City" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={formData.address.state || ""} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="State" /></div>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Zip / Postcode</label><input type="text" value={formData.address.zipCode || ""} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Zip / Postcode" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Country" /></div>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Company number</label><input type="text" value={formData.companyNumber || ""} onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Company number" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact name</label><input type="text" value={formData.contactName || ""} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Contact name" /></div>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label><input type="tel" value={formData.mobile || ""} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Mobile" /></div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">VAT number</label><input type="text" value={formData.vatNumber || ""} onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="VAT number" /></div>
  </div>
  <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><input type="text" value={formData.currency || ""} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="e.g. GBP" /></div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Pricing group (optional)</label>
  <select value={formData.pricingGroupId ?? ""} onChange={(e) => setFormData({ ...formData, pricingGroupId: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
  <option value="">None (default pricing)</option>
  {pricingGroups.map((g) => (<option key={g._id} value={g._id}>{g.name}</option>))}
  </select>
  </div>
  <div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" /><label htmlFor="isActive" className="text-sm text-gray-700">Active</label></div>
  <div className="flex items-center gap-2"><input type="checkbox" id="useInRepairs" checked={formData.useInRepairs !== false} onChange={(e) => setFormData({ ...formData, useInRepairs: e.target.checked })} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" /><label htmlFor="useInRepairs" className="text-sm text-gray-700">Show in repair tickets</label></div>
  <div className="flex justify-end gap-3 pt-4">
  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">{isLoading ? "Adding..." : "Add Customer"}</button>
  </div>
 </form>
 </div>
 </div>
 );
};

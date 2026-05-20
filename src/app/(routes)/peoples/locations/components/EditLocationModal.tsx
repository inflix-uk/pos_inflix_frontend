"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Location, LocationFormData } from "../types";

interface EditLocationModalProps {
 open: boolean;
 location: Location | null;
 onClose: () => void;
 onUpdate: (id: string, data: Partial<LocationFormData>) => void;
 isLoading: boolean;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
 open,
 location,
 onClose,
 onUpdate,
 isLoading,
}) => {
 const [formData, setFormData] = useState<LocationFormData>({
 name: "",
 type: "store",
 contactPerson: "",
 phone: "",
 email: "",
 address: "",
 city: "",
 postcode: "",
 country: "",
 companyNumber: "",
 vatNumber: "",
 isActive: true,
 });

 useEffect(() => {
 if (location) {
 setFormData({
 name: location.name || "",
 type: location.type || "store",
 contactPerson: location.contactPerson || "",
 phone: location.phone || "",
 email: location.email || "",
 address: location.address || "",
 city: location.city || "",
 postcode: location.postcode || "",
 country: location.country || "",
 companyNumber: location.companyNumber || "",
 vatNumber: location.vatNumber || "",
 isActive: location.isActive ?? true,
 });
 }
 }, [location]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (location?._id) {
 onUpdate(location._id, formData);
 }
 };

 if (!open || !location) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/20" aria-hidden />
 <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Edit Location</h2>
  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
  <X size={20} />
  </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Name *
  </label>
  <input
  type="text"
  required
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Location name"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Type
  </label>
  <select
  value={formData.type}
  onChange={(e) => setFormData({ ...formData, type: e.target.value as "store" | "warehouse" })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  >
  <option value="store">Store</option>
  <option value="warehouse">Warehouse</option>
  </select>
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Contact Person
  </label>
  <input
  type="text"
  value={formData.contactPerson}
  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Contact person name"
  />
  </div>

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Phone
  </label>
  <input
  type="tel"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Phone number"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Email
  </label>
  <input
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Email address"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Address
  </label>
  <textarea
  value={formData.address}
  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Full address"
  rows={2}
  />
  </div>

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  City
  </label>
  <input
  type="text"
  value={formData.city}
  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="City"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Postcode
  </label>
  <input
  type="text"
  value={formData.postcode}
  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Postcode"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Country
  </label>
  <input
  type="text"
  value={formData.country}
  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Country"
  />
  </div>

  <div className="grid grid-cols-2 gap-4">
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Company Number
  </label>
  <input
  type="text"
  value={formData.companyNumber}
  onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="Company number"
  />
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  VAT Number
  </label>
  <input
  type="text"
  value={formData.vatNumber}
  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  placeholder="VAT number"
  />
  </div>
  </div>

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

  <div className="flex justify-end gap-3 pt-4">
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
  {isLoading ? "Updating..." : "Update Location"}
  </button>
  </div>
 </form>
 </div>
 </div>
 );
};

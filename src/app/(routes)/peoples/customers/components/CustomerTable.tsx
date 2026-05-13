"use client";
import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Customer } from "../types";

interface CustomerTableProps { customers: Customer[]; selectedCustomers: string[]; selectAll: boolean; onSelectAll: () => void; onSelectCustomer: (id: string) => void; onEdit: (customer: Customer) => void; onDelete: (customer: Customer) => void; }

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers, selectedCustomers, selectAll, onSelectAll, onSelectCustomer, onEdit, onDelete }) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50">
  <tr>
  <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectAll} onChange={onSelectAll} className="rounded border-gray-300" /></th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loyalty Points</th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
  {customers.map((customer) => (
  <tr key={customer._id} className="hover:bg-gray-50">
  <td className="px-4 py-3"><input type="checkbox" checked={selectedCustomers.includes(customer._id!)} onChange={() => onSelectCustomer(customer._id!)} className="rounded border-gray-300" /></td>
  <td className="px-4 py-3"><div className="font-medium text-gray-900">{customer.name}</div>{customer.address?.city && <div className="text-sm text-gray-500">{customer.address.city}</div>}</td>
  <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
  <td className="px-4 py-3 text-gray-600">{customer.email || "-"}</td>
  <td className="px-4 py-3 text-gray-600">{customer.loyaltyPoints || 0}</td>
  <td className="px-4 py-3 text-gray-600">{customer.totalPurchases || 0}</td>
  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${customer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{customer.isActive ? "Active" : "Inactive"}</span></td>
  <td className="px-4 py-3">
  <div className="flex gap-2">
   <button onClick={() => onEdit(customer)} className="p-1 hover:bg-gray-100 rounded text-blue-600"><Edit2 size={16} /></button>
   <button onClick={() => onDelete(customer)} className="p-1 hover:bg-gray-100 rounded text-red-600"><Trash2 size={16} /></button>
  </div>
  </td>
  </tr>
  ))}
  {customers.length === 0 && (
  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No customers found</td></tr>
  )}
 </tbody>
 </table>
 </div>
 );
};

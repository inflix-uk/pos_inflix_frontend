"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer, CustomerFormData } from "../../peoples/customers/types";
import type { Supplier, SupplierFormData } from "../../peoples/suppliers/types";
import { customerApi } from "../../peoples/customers/service";
import { supplierApi } from "../../peoples/suppliers/service";
import type { AccountRow, Message } from "../types";

/** CSV columns matching import mapping so export can be re-imported */
const CUSTOMER_EXPORT_HEADERS = [
 "Name",
 "Phone",
 "Email",
 "Balance brought forward",
 "Company number",
 "Contact name",
 "Mobile",
 "VAT number",
 "Address line 1",
 "Address line 2",
 "City",
 "State",
 "Postcode",
 "Country",
];

function escapeCsv(value: string | number | undefined | null): string {
 const s = String(value ?? "");
 if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
 return s;
}

function exportCustomersAsCsv(customers: Customer[]) {
 const rows = customers.map((c) => [
  escapeCsv(c.name),
  escapeCsv(c.phone),
  escapeCsv(c.email),
  escapeCsv(c.balance != null && c.balance !== 0 ? c.balance : ""),
  escapeCsv(c.companyNumber),
  escapeCsv(c.contactName),
  escapeCsv(c.mobile),
  escapeCsv(c.vatNumber),
  escapeCsv(c.address?.street),
  escapeCsv(c.address?.addressLine2),
  escapeCsv(c.address?.city),
  escapeCsv(c.address?.state),
  escapeCsv(c.address?.zipCode),
  escapeCsv(c.address?.country),
 ]);
 const csv = [CUSTOMER_EXPORT_HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
}

export const useAccounts = () => {
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
 const [kindFilter, setKindFilter] = useState<"all" | "customer" | "supplier">("all");

 const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
 const [addModalOpen, setAddModalOpen] = useState(false);
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);

 const fetchAll = useCallback(async () => {
  setIsLoading(true);
  setMessage({ type: "", text: "" });
  try {
   const [custRes, supRes] = await Promise.all([
    customerApi.getAll({ limit: 5000, search: searchTerm, status: statusFilter !== "all" ? statusFilter : undefined }),
    supplierApi.getSuppliers({
     limit: 5000,
     search: searchTerm,
     isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    }),
   ]);
   setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
   setSuppliers(Array.isArray(supRes.data) ? (supRes.data as Supplier[]) : []);
  } catch {
   setMessage({ type: "error", text: "Failed to load accounts" });
  } finally {
   setIsLoading(false);
  }
 }, [searchTerm, statusFilter]);

 useEffect(() => {
  fetchAll();
 }, [fetchAll]);

 const rows: AccountRow[] = [
  ...(kindFilter !== "supplier" ? customers.map((c) => ({ kind: "customer" as const, id: c._id!, data: c })) : []),
  ...(kindFilter !== "customer" ? suppliers.map((s) => ({ kind: "supplier" as const, id: s._id!, data: s })) : []),
 ];

 const openAddModal = () => setAddModalOpen(true);
 const closeAddModal = () => setAddModalOpen(false);

 const openEditModal = (row: AccountRow) => {
  setSelectedAccount(row);
  setEditModalOpen(true);
 };
 const closeEditModal = () => {
  setSelectedAccount(null);
  setEditModalOpen(false);
 };

 const openDeleteModal = (row: AccountRow) => {
  setSelectedAccount(row);
  setDeleteModalOpen(true);
 };
 const closeDeleteModal = () => {
  setSelectedAccount(null);
  setDeleteModalOpen(false);
 };

 const createCustomer = async (data: CustomerFormData) => {
  try {
   const res = await customerApi.create(data);
   if (res.success) {
    setMessage({ type: "success", text: "Customer created successfully" });
    closeAddModal();
    fetchAll();
   } else {
    setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to create customer" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to create customer" });
  }
 };

 const createSupplier = async (data: SupplierFormData) => {
  try {
   const res = await supplierApi.createSupplier(data);
   if (res.success) {
    setMessage({ type: "success", text: "Supplier created successfully" });
    closeAddModal();
    fetchAll();
   } else {
    setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to create supplier" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to create supplier" });
  }
 };

 const updateCustomer = async (id: string, data: Partial<CustomerFormData>) => {
  try {
   const res = await customerApi.update(id, data);
   if (res.success) {
    setMessage({ type: "success", text: "Customer updated successfully" });
    closeEditModal();
    fetchAll();
   } else {
    setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to update customer" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update customer" });
  }
 };

 const updateSupplier = async (id: string, data: Partial<SupplierFormData>) => {
  try {
   const res = await supplierApi.updateSupplier(id, data);
   if (res.success) {
    setMessage({ type: "success", text: "Supplier updated successfully" });
    closeEditModal();
    fetchAll();
   } else {
    setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to update supplier" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to update supplier" });
  }
 };

 const deleteCustomer = async (id: string) => {
  try {
   await customerApi.delete(id);
   setMessage({ type: "success", text: "Customer deleted successfully" });
   closeDeleteModal();
   fetchAll();
  } catch {
   setMessage({ type: "error", text: "Failed to delete customer" });
  }
 };

 const deleteLastImported = async (count = 1) => {
  try {
   const res = await customerApi.deleteRecent(count);
   setMessage({
    type: "success",
    text: res.deleted > 0 ? res.message : "No recent customers to delete.",
   });
   fetchAll();
  } catch {
   setMessage({ type: "error", text: "Failed to delete last imported customer(s)" });
  }
 };

 const deleteSupplier = async (id: string) => {
  try {
   await supplierApi.deleteSupplier(id);
   setMessage({ type: "success", text: "Supplier deleted successfully" });
   closeDeleteModal();
   fetchAll();
  } catch {
   setMessage({ type: "error", text: "Failed to delete supplier" });
  }
 };

 /** Update customer; if accountType is 'supplier', also create a new Supplier with same details. No record is removed. */
 const saveCustomer = async (id: string, accountType: "customer" | "supplier", data: CustomerFormData) => {
  try {
   const res = await customerApi.update(id, data);
   if (!res.success) {
    setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to update customer" });
    return;
   }
   if (accountType === "supplier") {
    const supplierData: SupplierFormData = {
     name: data.name,
     email: data.email,
     phone: data.phone,
     address: { ...data.address },
     contactPerson: data.contactName || "",
     companyNumber: data.companyNumber,
     mobile: data.mobile,
     vatNumber: data.vatNumber,
     currency: data.currency,
     isActive: data.isActive,
    };
    const supRes = await supplierApi.createSupplier(supplierData);
    if (supRes.success) {
     setMessage({ type: "success", text: "Customer updated. Supplier account added with same details." });
    } else {
     setMessage({ type: "success", text: "Customer updated." });
    }
   } else {
    setMessage({ type: "success", text: "Customer updated successfully" });
   }
   closeEditModal();
   fetchAll();
  } catch {
   setMessage({ type: "error", text: "Failed to update customer" });
  }
 };

 /** Update supplier; if accountType is 'customer', also create a new Customer with same details. No record is removed. */
 const saveSupplier = async (id: string, accountType: "customer" | "supplier", data: Partial<SupplierFormData>) => {
  try {
   const res = await supplierApi.updateSupplier(id, data);
   if (!res.success) {
    setMessage({ type: "error", text: (res as { message?: string }).message || "Failed to update supplier" });
    return;
   }
   if (accountType === "customer") {
    const customerData: CustomerFormData = {
     name: data.name ?? "",
     email: data.email ?? "",
     phone: data.phone ?? "",
     address: data.address ?? {
      street: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United Kingdom",
     },
     contactName: data.contactPerson ?? "",
     companyNumber: data.companyNumber,
     mobile: data.mobile,
     vatNumber: data.vatNumber,
     currency: data.currency,
     isActive: data.isActive ?? true,
    };
    const custRes = await customerApi.create(customerData);
    if (custRes.success) {
     setMessage({ type: "success", text: "Supplier updated. Customer account added with same details." });
    } else {
     setMessage({ type: "success", text: "Supplier updated." });
    }
   } else {
    setMessage({ type: "success", text: "Supplier updated successfully" });
   }
   closeEditModal();
   fetchAll();
  } catch {
   setMessage({ type: "error", text: "Failed to update supplier" });
  }
 };

 return {
  rows,
  customers,
  isLoading,
  message,
  searchTerm,
  statusFilter,
  kindFilter,
  setSearchTerm,
  setStatusFilter,
  setKindFilter,
  selectedAccount,
  addModalOpen,
  editModalOpen,
  deleteModalOpen,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  createCustomer,
  createSupplier,
  updateCustomer,
  updateSupplier,
  deleteCustomer,
  deleteSupplier,
  saveCustomer,
  saveSupplier,
  fetchAll,
  exportCustomersAsCsv: () => exportCustomersAsCsv(customers),
  deleteLastImported,
 };
};

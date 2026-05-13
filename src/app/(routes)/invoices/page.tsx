"use client";
import React, { useState } from "react";
import {
 Search,
 ChevronDown,
 Download,
 Plus,
 Eye,
 Edit,
 Trash2,
 ChevronLeft,
 ChevronRight,
 FileText,
} from "lucide-react";
import Link from "next/link";
import AddInvoiceModal, { Invoice } from "../../components/invoices/AddInvoiceModal";
import DeleteInvoiceModal from "../../components/invoices/DeleteInvoiceModal";

const Page = () => {
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(5);
 const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
 const [selectedStatus, setSelectedStatus] = useState<string>("All");
 const [selectedCustomer, setSelectedCustomer] = useState<string>("All");
 const [searchTerm, setSearchTerm] = useState<string>("");
 const [showAddModal, setShowAddModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<string | null>(null);

 const [invoices, setInvoices] = useState<Invoice[]>([
 {
 invoiceNo: "INV001",
 customer: { name: "Carl Evans", avatar: "", color: "bg-blue-100" },
 dueDate: "24 Dec 2024",
 amount: 1000,
 paid: 1000,
 amountDue: 0,
 status: "Paid",
 items: [
 { id: "1", product: "Laptop", quantity: 1, price: 1000, total: 1000 }
 ],
 },
 {
 invoiceNo: "INV002",
 customer: { name: "Minerva Rametz", avatar: "", color: "bg-red-100" },
 dueDate: "24 Dec 2024",
 amount: 1500,
 paid: 0,
 amountDue: 1500,
 status: "Unpaid",
 items: [
 { id: "2", product: "Monitor", quantity: 2, price: 750, total: 1500 }
 ],
 },
 {
 invoiceNo: "INV003",
 customer: { name: "Robert Lamon", avatar: "", color: "bg-gray-100" },
 dueDate: "24 Dec 2024",
 amount: 1500,
 paid: 0,
 amountDue: 1500,
 status: "Unpaid",
 items: [
 { id: "3", product: "Keyboard", quantity: 3, price: 500, total: 1500 }
 ],
 },
 {
 invoiceNo: "INV004",
 customer: { name: "Patricia Lewis", avatar: "", color: "bg-red-100" },
 dueDate: "24 Dec 2024",
 amount: 2000,
 paid: 1000,
 amountDue: 1000,
 status: "Unpaid",
 items: [
 { id: "4", product: "Tablet", quantity: 1, price: 2000, total: 2000 }
 ],
 },
 {
 invoiceNo: "INV005",
 customer: { name: "Mark Jordyn", avatar: "", color: "bg-blue-100" },
 dueDate: "24 Dec 2024",
 amount: 800,
 paid: 800,
 amountDue: 0,
 status: "Paid",
 items: [
 { id: "5", product: "Mouse", quantity: 4, price: 200, total: 800 }
 ],
 },
 {
 invoiceNo: "INV006",
 customer: { name: "Marsha Betts", avatar: "", color: "bg-blue-100" },
 dueDate: "24 Dec 2024",
 amount: 750,
 paid: 0,
 amountDue: 750,
 status: "Unpaid",
 items: [
 { id: "6", product: "Headphones", quantity: 1, price: 750, total: 750 }
 ],
 },
 {
 invoiceNo: "INV007",
 customer: { name: "Daniel Jude", avatar: "", color: "bg-orange-100" },
 dueDate: "24 Dec 2024",
 amount: 1300,
 paid: 1300,
 amountDue: 0,
 status: "Paid",
 items: [
 { id: "7", product: "Speaker", quantity: 2, price: 650, total: 1300 }
 ],
 },
 {
 invoiceNo: "INV008",
 customer: { name: "Emma Bates", avatar: "", color: "bg-green-100" },
 dueDate: "21 Dec 2024",
 amount: 1100,
 paid: 1100,
 amountDue: 0,
 status: "Paid",
 items: [
 { id: "8", product: "Camera", quantity: 1, price: 1100, total: 1100 }
 ],
 },
 {
 invoiceNo: "INV009",
 customer: { name: "Richard Fralick", avatar: "", color: "bg-gray-100" },
 dueDate: "21 Dec 2024",
 amount: 2300,
 paid: 2300,
 amountDue: 0,
 status: "Paid",
 items: [
 { id: "9", product: "Printer", quantity: 1, price: 2300, total: 2300 }
 ],
 },
 {
 invoiceNo: "INV010",
 customer: { name: "Michelle Robison", avatar: "", color: "bg-red-100" },
 dueDate: "21 Dec 2024",
 amount: 1700,
 paid: 1700,
 amountDue: 0,
 status: "Paid",
 items: [
 { id: "10", product: "Scanner", quantity: 1, price: 1700, total: 1700 }
 ],
 },
 ]);

 const customers = Array.from(new Set(invoices.map(inv => inv.customer.name)));
 const statuses = ["Paid", "Unpaid", "Overdue"];

 // Filter invoices based on search and filters
 const filteredInvoices = invoices.filter((invoice) => {
 const matchesSearch = 
 invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
 invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesStatus = selectedStatus === "All" || invoice.status === selectedStatus;
 const matchesCustomer = selectedCustomer === "All" || invoice.customer.name === selectedCustomer;
 
 return matchesSearch && matchesStatus && matchesCustomer;
 });

 // Pagination
 const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + rowsPerPage);

 const handleSelectAll = () => {
 if (selectAll) {
 setSelectedInvoices([]);
 } else {
 setSelectedInvoices(paginatedInvoices.map(inv => inv.invoiceNo));
 }
 setSelectAll(!selectAll);
 };

 const handleSelectInvoice = (invoiceNo: string) => {
 if (selectedInvoices.includes(invoiceNo)) {
 setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceNo));
 } else {
 setSelectedInvoices([...selectedInvoices, invoiceNo]);
 }
 };

 const handlePageChange = (page: number) => {
 setCurrentPage(page);
 setSelectAll(false);
 setSelectedInvoices([]);
 };

 const handleRowsPerPageChange = (value: number) => {
 setRowsPerPage(value);
 setCurrentPage(1);
 setSelectAll(false);
 setSelectedInvoices([]);
 };

 const handleAddInvoice = (newInvoice: Invoice) => {
 setInvoices(prev => [...prev, newInvoice]);
 setShowAddModal(false);
 };

 const handleDeleteInvoice = () => {
 if (selectedInvoiceForDelete) {
 setInvoices(prev => prev.filter(inv => inv.invoiceNo !== selectedInvoiceForDelete));
 setSelectedInvoices(prev => prev.filter(id => id !== selectedInvoiceForDelete));
 }
 setShowDeleteModal(false);
 setSelectedInvoiceForDelete(null);
 };

 const openDeleteModal = (invoiceNo: string) => {
 setSelectedInvoiceForDelete(invoiceNo);
 setShowDeleteModal(true);
 };

 const getStatusColor = (status: string) => {
 switch (status) {
 case "Paid":
 return "text-green-600 bg-green-100";
 case "Unpaid":
 return "text-red-600 bg-red-100";
 case "Overdue":
 return "text-orange-600 bg-orange-100";
 default:
 return "text-gray-600 bg-gray-100";
 }
 };

 return (
 <div className="p-6">
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div>
  <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
  <p className="text-gray-600">Manage your stock invoices</p>
 </div>
 <button
  onClick={() => setShowAddModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
 >
  <Plus size={20} />
  Add Invoice
 </button>
 </div>

 {/* Filters and Search */}
 <div className="bg-white rounded-lg border border-gray-200 mb-6">
 <div className="p-6">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
  {/* Search */}
  <div className="relative flex-1 max-w-md">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
  <input
  type="text"
  placeholder="Search invoices..."
  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  />
  </div>

  {/* Filters */}
  <div className="flex items-center gap-4">
  {/* Customer Filter */}
  <div className="relative">
  <button
   onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Customer: {selectedCustomer}</span>
   <ChevronDown size={16} />
  </button>
  {showCustomerDropdown && (
   <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
   <button
   onClick={() => {
   setSelectedCustomer("All");
   setShowCustomerDropdown(false);
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   All
   </button>
   {customers.map((customer) => (
   <button
   key={customer}
   onClick={() => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   {customer}
   </button>
   ))}
   </div>
  )}
  </div>

  {/* Status Filter */}
  <div className="relative">
  <button
   onClick={() => setShowStatusDropdown(!showStatusDropdown)}
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Status: {selectedStatus}</span>
   <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
   <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
   <button
   onClick={() => {
   setSelectedStatus("All");
   setShowStatusDropdown(false);
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   All
   </button>
   {statuses.map((status) => (
   <button
   key={status}
   onClick={() => {
    setSelectedStatus(status);
    setShowStatusDropdown(false);
   }}
   className="w-full text-left px-4 py-2 hover:bg-gray-50"
   >
   {status}
   </button>
   ))}
   </div>
  )}
  </div>

  {/* Export Button */}
  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
  <Download size={16} />
  Export
  </button>
  </div>
  </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-4 text-left">
   <input
   type="checkbox"
   checked={selectAll}
   onChange={handleSelectAll}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Invoice No</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Customer</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Due Date</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Paid</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount Due</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {paginatedInvoices.map((invoice) => (
  <tr key={invoice.invoiceNo} className="hover:bg-gray-50">
   <td className="px-6 py-4">
   <input
   type="checkbox"
   checked={selectedInvoices.includes(invoice.invoiceNo)}
   onChange={() => handleSelectInvoice(invoice.invoiceNo)}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-3">
   <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
   <FileText className="text-blue-600" size={16} />
   </div>
   <span className="text-sm font-medium text-gray-900">
   {invoice.invoiceNo}
   </span>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <div className={`w-8 h-8 rounded-full ${invoice.customer.color} flex items-center justify-center text-sm`}>
   </div>
   <span className="text-sm text-gray-900">
   {invoice.customer.name}
   </span>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {invoice.dueDate}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   ${invoice.amount.toFixed(2)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   ${invoice.paid.toFixed(2)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   ${invoice.amountDue.toFixed(2)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
   {invoice.status}
   </span>
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <Link
   href="/invoice-detail"
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Eye size={16} />
   </Link>
   <Link
   href="/edit-invoice"
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Edit size={16} />
   </Link>
   <button 
   onClick={() => openDeleteModal(invoice.invoiceNo)}
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
   >
   <Trash2 size={16} />
   </button>
   </div>
   </td>
  </tr>
  ))}
  </tbody>
  </table>
 </div>

 {/* Pagination */}
 <div className="px-6 py-4 border-t border-gray-200">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
  <span className="text-sm text-gray-700">Row Per Page</span>
  <select
  value={rowsPerPage}
  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
  className="border border-gray-300 rounded px-3 py-1 text-sm"
  >
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={20}>20</option>
  </select>
  <span className="text-sm text-gray-700 ml-4">Entries</span>
  </div>

  <div className="flex items-center gap-2">
  <button
  onClick={() => handlePageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronLeft size={16} />
  </button>

  {[...Array(totalPages)].map((_, index) => {
  const pageNumber = index + 1;
  return (
   <button
   key={pageNumber}
   onClick={() => handlePageChange(pageNumber)}
   className={`w-8 h-8 rounded-lg text-sm font-medium ${
   currentPage === pageNumber
   ? "bg-orange-500 text-white"
   : "text-gray-600 hover:bg-gray-100"
   }`}
   >
   {pageNumber}
   </button>
  );
  })}

  <button
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages}
  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <ChevronRight size={16} />
  </button>
  </div>
  </div>
 </div>
 </div>

 {/* Modals */}
 <AddInvoiceModal
 open={showAddModal}
 onClose={() => setShowAddModal(false)}
 onAdd={handleAddInvoice}
 />

 <DeleteInvoiceModal
 open={showDeleteModal}
 onClose={() => setShowDeleteModal(false)}
 onDelete={handleDeleteInvoice}
 invoiceNo={selectedInvoiceForDelete || undefined}
 />
 </div>
 );
};

export default Page;

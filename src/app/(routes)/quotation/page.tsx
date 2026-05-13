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
 User,
} from "lucide-react";
import Link from "next/link";
import AddQuotationModal, { Quotation } from "../../components/quotation/AddQuotationModal";
import EditQuotationModal from "../../components/quotation/EditQuotationModal";
import DeleteQuotationModal from "../../components/quotation/DeleteQuotationModal";

const Page = () => {
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);
 const [selectedStatus, setSelectedStatus] = useState<string>("All");
 const [selectedCustomer, setSelectedCustomer] = useState<string>("All");
 const [searchTerm, setSearchTerm] = useState<string>("");
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedQuotationForEdit, setSelectedQuotationForEdit] = useState<Quotation | null>(null);
 const [selectedQuotationForDelete, setSelectedQuotationForDelete] = useState<string | null>(null);

 const [quotations, setQuotations] = useState<Quotation[]>([
 {
 id: "1",
 customer: { name: "Carl Evans", avatar: "user", color: "bg-blue-100" },
 date: "19 Jan 2023",
 reference: "010203",
 status: "Sent",
 total: 5750,
 items: [
 { id: "1", product: "Lenovo 3rd Generation", qty: 2, purchasePrice: 2000, discount: 500, tax: 0, taxAmount: 0, unitCost: 1500, totalCost: 3000 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5750,
 description: "",
 },
 {
 id: "2",
 customer: { name: "Minerva Rametz", avatar: "user", color: "bg-red-100" },
 date: "19 Jan 2023",
 reference: "010204",
 status: "Sent",
 total: 5430,
 items: [
 { id: "2", product: "Bold V3.2", qty: 2, purchasePrice: 1500, discount: 400, tax: 0, taxAmount: 0, unitCost: 1100, totalCost: 2200 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5430,
 description: "",
 },
 {
 id: "3",
 customer: { name: "Robert Lamon", avatar: "user", color: "bg-gray-100" },
 date: "19 Jan 2023",
 reference: "010205",
 status: "Ordered",
 total: 5760,
 items: [
 { id: "3", product: "Nike Jordan", qty: 2, purchasePrice: 2000, discount: 500, tax: 0, taxAmount: 0, unitCost: 1500, totalCost: 3000 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5760,
 description: "",
 },
 {
 id: "4",
 customer: { name: "Mark Jordyn", avatar: "user", color: "bg-blue-100" },
 date: "19 Jan 2023",
 reference: "010206",
 status: "Sent",
 total: 5170,
 items: [
 { id: "4", product: "Apple Series 5 Watch", qty: 2, purchasePrice: 3000, discount: 400, tax: 0, taxAmount: 0, unitCost: 2600, totalCost: 5200 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5170,
 description: "",
 },
 {
 id: "5",
 customer: { name: "Patricia Lewis", avatar: "user", color: "bg-red-100" },
 date: "19 Jan 2023",
 reference: "010207",
 status: "Pending",
 total: 5380,
 items: [
 { id: "5", product: "Amazon Echo Dot", qty: 2, purchasePrice: 150, discount: 100, tax: 0, taxAmount: 0, unitCost: 50, totalCost: 100 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5380,
 description: "",
 },
 {
 id: "6",
 customer: { name: "Marsha Betts", avatar: "user", color: "bg-blue-100" },
 date: "19 Jan 2023",
 reference: "010208",
 status: "Sent",
 total: 5190,
 items: [
 { id: "6", product: "Lobar Handy", qty: 2, purchasePrice: 2500, discount: 500, tax: 0, taxAmount: 0, unitCost: 2000, totalCost: 4000 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5190,
 description: "",
 },
 {
 id: "7",
 customer: { name: "Daniel Jude", avatar: "user", color: "bg-orange-100" },
 date: "19 Jan 2023",
 reference: "010209",
 status: "Pending",
 total: 5540,
 items: [
 { id: "7", product: "Red Premium Handy", qty: 2, purchasePrice: 1800, discount: 500, tax: 0, taxAmount: 0, unitCost: 1300, totalCost: 2600 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5540,
 description: "",
 },
 {
 id: "8",
 customer: { name: "Emma Bates", avatar: "user", color: "bg-green-100" },
 date: "19 Jan 2023",
 reference: "010210",
 status: "Ordered",
 total: 5610,
 items: [
 { id: "8", product: "Iphone 14 Pro", qty: 2, purchasePrice: 4000, discount: 400, tax: 0, taxAmount: 0, unitCost: 3600, totalCost: 7200 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5610,
 description: "",
 },
 {
 id: "9",
 customer: { name: "Richard Fralick", avatar: "user", color: "bg-gray-100" },
 date: "19 Jan 2023",
 reference: "010211",
 status: "Pending",
 total: 5230,
 items: [
 { id: "9", product: "Black Slim 200", qty: 2, purchasePrice: 800, discount: 500, tax: 0, taxAmount: 0, unitCost: 300, totalCost: 600 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5230,
 description: "",
 },
 {
 id: "10",
 customer: { name: "Michelle Robison", avatar: "user", color: "bg-red-100" },
 date: "19 Jan 2023",
 reference: "010212",
 status: "Sent",
 total: 5460,
 items: [
 { id: "10", product: "Woodcraft Sandal", qty: 2, purchasePrice: 1200, discount: 500, tax: 0, taxAmount: 0, unitCost: 700, totalCost: 1400 }
 ],
 orderTax: 0,
 discount: 0,
 shipping: 0,
 grandTotal: 5460,
 description: "",
 },
 ]);

 const customers = Array.from(new Set(quotations.map(q => q.customer.name)));
 const statuses = ["Sent", "Pending", "Ordered"];

 // Filter quotations based on search and filters
 const filteredQuotations = quotations.filter((quotation) => {
 const matchesSearch = 
 quotation.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
 quotation.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 quotation.items.some(item => item.product.toLowerCase().includes(searchTerm.toLowerCase()));
 const matchesStatus = selectedStatus === "All" || quotation.status === selectedStatus;
 const matchesCustomer = selectedCustomer === "All" || quotation.customer.name === selectedCustomer;
 
 return matchesSearch && matchesStatus && matchesCustomer;
 });

 // Pagination
 const totalPages = Math.ceil(filteredQuotations.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const paginatedQuotations = filteredQuotations.slice(startIndex, startIndex + rowsPerPage);

 const handleSelectAll = () => {
 if (selectAll) {
 setSelectedQuotations([]);
 } else {
 setSelectedQuotations(paginatedQuotations.map(q => q.id));
 }
 setSelectAll(!selectAll);
 };

 const handleSelectQuotation = (id: string) => {
 if (selectedQuotations.includes(id)) {
 setSelectedQuotations(selectedQuotations.filter(qId => qId !== id));
 } else {
 setSelectedQuotations([...selectedQuotations, id]);
 }
 };

 const handlePageChange = (page: number) => {
 setCurrentPage(page);
 setSelectAll(false);
 setSelectedQuotations([]);
 };

 const handleRowsPerPageChange = (value: number) => {
 setRowsPerPage(value);
 setCurrentPage(1);
 setSelectAll(false);
 setSelectedQuotations([]);
 };

 const handleAddQuotation = (newQuotation: Quotation) => {
 setQuotations(prev => [...prev, newQuotation]);
 setShowAddModal(false);
 };

 const handleUpdateQuotation = (updatedQuotation: Quotation) => {
 setQuotations(prev => prev.map(q => 
 q.id === updatedQuotation.id ? updatedQuotation : q
 ));
 setShowEditModal(false);
 setSelectedQuotationForEdit(null);
 };

 const handleDeleteQuotation = () => {
 if (selectedQuotationForDelete) {
 setQuotations(prev => prev.filter(q => q.id !== selectedQuotationForDelete));
 setSelectedQuotations(prev => prev.filter(id => id !== selectedQuotationForDelete));
 }
 setShowDeleteModal(false);
 setSelectedQuotationForDelete(null);
 };

 const openEditModal = (quotation: Quotation) => {
 setSelectedQuotationForEdit(quotation);
 setShowEditModal(true);
 };

 const openDeleteModal = (id: string) => {
 setSelectedQuotationForDelete(id);
 setShowDeleteModal(true);
 };

 const getStatusColor = (status: string) => {
 switch (status) {
 case "Sent":
 return "text-green-600 bg-green-100";
 case "Pending":
 return "text-blue-600 bg-blue-100";
 case "Ordered":
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
  <h1 className="text-2xl font-semibold text-gray-900">Quotation List</h1>
  <p className="text-gray-600">Manage Your Quotation</p>
 </div>
 <button
  onClick={() => setShowAddModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
 >
  <Plus size={20} />
  Add Quotation
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
  placeholder="Search..."
  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  />
  </div>

  {/* Filters */}
  <div className="flex items-center gap-4">
  {/* Product Filter */}
  <div className="relative">
  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
   <span>Product</span>
   <ChevronDown size={16} />
  </button>
  </div>

  {/* Customer Filter */}
  <div className="relative">
  <button
   onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Customer</span>
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
   <span>Status</span>
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

  {/* Sort By */}
  <div className="relative">
  <button
   onClick={() => setShowSortDropdown(!showSortDropdown)}
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
   <span>Sort By: Last 7 Days</span>
   <ChevronDown size={16} />
  </button>
  {showSortDropdown && (
   <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
   <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Last 7 Days</button>
   <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Last 30 Days</button>
   <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Last 90 Days</button>
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
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Product Name</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Customer Name</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Total</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {paginatedQuotations.map((quotation) => (
  <tr key={quotation.id} className="hover:bg-gray-50">
   <td className="px-6 py-4">
   <input
   type="checkbox"
   checked={selectedQuotations.includes(quotation.id)}
   onChange={() => handleSelectQuotation(quotation.id)}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-3">
   <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
   <FileText className="text-neutral-600" size={16} />
   </div>
   <span className="text-sm font-medium text-gray-900">
   {quotation.items[0]?.product || "Multiple Items"}
   </span>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <div className={`w-8 h-8 rounded-full ${quotation.customer.color} flex items-center justify-center text-sm`}>
   <User size={16} className="text-gray-600" />
   </div>
   <span className="text-sm text-gray-900">
   {quotation.customer.name}
   </span>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}>
   {quotation.status}
   </span>
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   ${quotation.total.toFixed(2)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <Link
   href="/quotation-detail"
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Eye size={16} />
   </Link>
   <button
   onClick={() => openEditModal(quotation)}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Edit size={16} />
   </button>
   <button 
   onClick={() => openDeleteModal(quotation.id)}
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
  <option value={10}>10</option>
  <option value={20}>20</option>
  <option value={50}>50</option>
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
 <AddQuotationModal
 open={showAddModal}
 onClose={() => setShowAddModal(false)}
 onAdd={handleAddQuotation}
 />

 <EditQuotationModal
 open={showEditModal}
 onClose={() => setShowEditModal(false)}
 onUpdate={handleUpdateQuotation}
 quotation={selectedQuotationForEdit}
 />

 <DeleteQuotationModal
 open={showDeleteModal}
 onClose={() => setShowDeleteModal(false)}
 onDelete={handleDeleteQuotation}
 reference={quotations.find(q => q.id === selectedQuotationForDelete)?.reference}
 />
 </div>
 );
};

export default Page;
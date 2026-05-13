"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
 Search,
 ChevronDown,
 FileText,
 RotateCcw,
 Plus,
 MoreVertical,
 ChevronLeft,
 ChevronRight,
} from "lucide-react";

const salesData = [
 {
 customer: { name: "Carl Evans", avatar: "🧑‍💼", color: "bg-blue-100" },
 reference: "SL001",
 date: "24 Dec 2024",
 status: "Completed",
 grandTotal: "£1000",
 paid: "£1000",
 due: "£0.00",
 paymentStatus: "Paid",
 },
 {
 customer: { name: "Minerva Rameriz", avatar: "👩‍💼", color: "bg-neutral-100" },
 reference: "SL002",
 date: "10 Dec 2024",
 status: "Pending",
 grandTotal: "$1500",
 paid: "£0.00",
 due: "$1500",
 paymentStatus: "Unpaid",
 },
 {
 customer: { name: "Robert Lamon", avatar: "🧑‍💼", color: "bg-gray-100" },
 reference: "SL003",
 date: "08 Feb 2023",
 status: "Completed",
 grandTotal: "$1500",
 paid: "£0.00",
 due: "$1500",
 paymentStatus: "Paid",
 },
 {
 customer: { name: "Patricia Lewis", avatar: "👩‍💼", color: "bg-neutral-200" },
 reference: "SL004",
 date: "12 Feb 2023",
 status: "Completed",
 grandTotal: "£2000",
 paid: "£1000",
 due: "£1000",
 paymentStatus: "Overdue",
 },
 {
 customer: { name: "Mark Joslyn", avatar: "🧑‍💼", color: "bg-blue-200" },
 reference: "SL005",
 date: "17 Mar 2023",
 status: "Completed",
 grandTotal: "£800",
 paid: "£800",
 due: "£0.00",
 paymentStatus: "Paid",
 },
 {
 customer: { name: "Marsha Betts", avatar: "👩‍💼", color: "bg-blue-300" },
 reference: "SL006",
 date: "24 Mar 2023",
 status: "Pending",
 grandTotal: "£750",
 paid: "£0.00",
 due: "£750",
 paymentStatus: "Unpaid",
 },
 {
 customer: { name: "Daniel Jude", avatar: "🧑‍💼", color: "bg-yellow-100" },
 reference: "SL007",
 date: "06 Apr 2023",
 status: "Completed",
 grandTotal: "£1300",
 paid: "£1300",
 due: "£0.00",
 paymentStatus: "Paid",
 },
 {
 customer: { name: "Emma Bates", avatar: "👩‍💼", color: "bg-gray-200" },
 reference: "SL008",
 date: "16 Apr 2023",
 status: "Completed",
 grandTotal: "£1100",
 paid: "£1100",
 due: "£0.00",
 paymentStatus: "Paid",
 },
 {
 customer: { name: "Richard Fralick", avatar: "🧑‍💼", color: "bg-gray-50" },
 reference: "SL009",
 date: "04 May 2023",
 status: "Pending",
 grandTotal: "£2300",
 paid: "£2300",
 due: "£0.00",
 paymentStatus: "Paid",
 },
 {
 customer: { name: "Michelle Robison", avatar: "👩‍💼", color: "bg-red-200" },
 reference: "SL010",
 date: "29 May 2023",
 status: "Pending",
 grandTotal: "£1700",
 paid: "£1700",
 due: "£0.00",
 paymentStatus: "Paid",
 },
];

const uniqueCustomers = [
 "All",
 ...Array.from(new Set(salesData.map((s) => s.customer.name))),
];
const uniqueStatuses = [
 "All",
 ...Array.from(new Set(salesData.map((s) => s.status))),
];
const uniquePaymentStatuses = [
 "All",
 ...Array.from(new Set(salesData.map((s) => s.paymentStatus))),
];
const sortOptions = ["Last 7 Days", "Last 30 Days", "Newest", "Oldest"];

const statusBadge = (status: string) => {
 if (status === "Completed")
 return (
 <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
 Completed
 </span>
 );
 if (status === "Pending")
 return (
 <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
 Pending
 </span>
 );
 return null;
};
const paymentBadge = (status: string) => {
 if (status === "Paid")
 return (
 <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
 <span className="h-2 w-2 bg-green-400 rounded-full inline-block"></span>
 Paid
 </span>
 );
 if (status === "Unpaid")
 return (
 <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
 <span className="h-2 w-2 bg-red-400 rounded-full inline-block"></span>
 Unpaid
 </span>
 );
 if (status === "Overdue")
 return (
 <span className="bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
 <span className="h-2 w-2 bg-yellow-400 rounded-full inline-block"></span>
 Overdue
 </span>
 );
 return null;
};

const Page = () => {
 const [currentPage, setCurrentPage] = useState(1);
 const [rowsPerPage, setRowsPerPage] = useState(10);
 const [selectedSales, setSelectedSales] = useState<number[]>([]);
 const [selectAll, setSelectAll] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");
 const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
 const [showSortDropdown, setShowSortDropdown] = useState(false);
 const [selectedCustomer, setSelectedCustomer] = useState("All");
 const [selectedStatus, setSelectedStatus] = useState("All");
 const [selectedPayment, setSelectedPayment] = useState("All");
 const [selectedSort, setSelectedSort] = useState("Last 7 Days");
 const [openDropdown, setOpenDropdown] = useState<number | null>(null);
 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (
 dropdownRef.current &&
 !dropdownRef.current.contains(event.target as Node)
 ) {
 setOpenDropdown(null);
 }
 }
 if (openDropdown !== null) {
 document.addEventListener("mousedown", handleClickOutside);
 } else {
 document.removeEventListener("mousedown", handleClickOutside);
 }
 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, [openDropdown]);

 let filteredSales = salesData.filter((s) => {
 const customerMatch =
 selectedCustomer === "All" || s.customer.name === selectedCustomer;
 const statusMatch = selectedStatus === "All" || s.status === selectedStatus;
 const paymentMatch =
 selectedPayment === "All" || s.paymentStatus === selectedPayment;
 const searchTermMatch =
 s.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 s.reference.toLowerCase().includes(searchTerm.toLowerCase());
 return customerMatch && statusMatch && paymentMatch && searchTermMatch;
 });

 if (selectedSort === "Newest")
 filteredSales = filteredSales.slice().reverse();
 if (selectedSort === "Oldest") filteredSales = filteredSales.slice();
 // For demo, Last 7/30 Days just show all

 const totalPages = Math.ceil(filteredSales.length / rowsPerPage);
 const startIndex = (currentPage - 1) * rowsPerPage;
 const endIndex = startIndex + rowsPerPage;
 const currentSales = filteredSales.slice(startIndex, endIndex);

 const handleSelectAll = () => {
 if (selectAll) {
 setSelectedSales([]);
 } else {
 setSelectedSales(currentSales.map((_, idx) => idx));
 }
 setSelectAll(!selectAll);
 };

 const handleSelectSale = (idx: number) => {
 if (selectedSales.includes(idx)) {
 setSelectedSales(selectedSales.filter((id) => id !== idx));
 } else {
 setSelectedSales([...selectedSales, idx]);
 }
 };

 const handlePageChange = (page: number) => {
 setCurrentPage(page);
 setSelectedSales([]);
 setSelectAll(false);
 };

 const handleRowsPerPageChange = (value: number) => {
 setRowsPerPage(value);
 setCurrentPage(1);
 setSelectedSales([]);
 setSelectAll(false);
 };

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center justify-between">
  <div>
  <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
  <p className="text-gray-600 mt-1">Manage Your Sales</p>
  </div>
  <div className="flex items-center gap-3">
  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-gray-200">
  <FileText size={20} />
  </button>
  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
  <RotateCcw size={20} />
  </button>
  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
  <Plus size={20} />
  Add Sales
  </button>
  </div>
 </div>
 </div>

 {/* Filters and Search */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
 <div className="p-6">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
  <div className="relative">
  <Search
   className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
   size={20}
  />
  <input
   type="text"
   placeholder="Search"
   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
   onChange={(e) => {
   setSearchTerm(e.target.value);
   setCurrentPage(1);
   }}
  />
  </div>
  </div>
  <div className="flex items-center gap-3">
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
  >
   Customer
   <ChevronDown size={16} />
  </button>
  {showCustomerDropdown && (
   <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
   <div
   className="py-1"
   role="menu"
   aria-orientation="vertical"
   aria-labelledby="customer-menu"
   >
   {uniqueCustomers.map((customer) => (
   <button
    key={customer}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
    role="menuitem"
    onClick={() => {
    setSelectedCustomer(customer);
    setCurrentPage(1);
    setShowCustomerDropdown(false);
    }}
   >
    {customer}
   </button>
   ))}
   </div>
   </div>
  )}
  </div>
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowStatusDropdown(!showStatusDropdown)}
  >
   Status
   <ChevronDown size={16} />
  </button>
  {showStatusDropdown && (
   <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
   <div
   className="py-1"
   role="menu"
   aria-orientation="vertical"
   aria-labelledby="status-menu"
   >
   {uniqueStatuses.map((status) => (
   <button
    key={status}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
    role="menuitem"
    onClick={() => {
    setSelectedStatus(status);
    setCurrentPage(1);
    setShowStatusDropdown(false);
    }}
   >
    {status}
   </button>
   ))}
   </div>
   </div>
  )}
  </div>
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
  >
   Payment Status
   <ChevronDown size={16} />
  </button>
  {showPaymentDropdown && (
   <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
   <div
   className="py-1"
   role="menu"
   aria-orientation="vertical"
   aria-labelledby="payment-menu"
   >
   {uniquePaymentStatuses.map((status) => (
   <button
    key={status}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
    role="menuitem"
    onClick={() => {
    setSelectedPayment(status);
    setCurrentPage(1);
    setShowPaymentDropdown(false);
    }}
   >
    {status}
   </button>
   ))}
   </div>
   </div>
  )}
  </div>
  <div className="relative">
  <button
   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
   onClick={() => setShowSortDropdown(!showSortDropdown)}
  >
   Sort By : {selectedSort}
   <ChevronDown size={16} />
  </button>
  {showSortDropdown && (
   <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
   <div
   className="py-1"
   role="menu"
   aria-orientation="vertical"
   aria-labelledby="sort-menu"
   >
   {sortOptions.map((sort) => (
   <button
    key={sort}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
    role="menuitem"
    onClick={() => {
    setSelectedSort(sort);
    setShowSortDropdown(false);
    }}
   >
    {sort}
   </button>
   ))}
   </div>
   </div>
  )}
  </div>
  </div>
  </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-3 text-left">
   <input
   type="checkbox"
   checked={selectAll}
   onChange={handleSelectAll}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
   />
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Customer
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Reference
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Date
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Grand Total
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Paid
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Due
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Payment Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
   Actions
  </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
  {currentSales.map((sale, idx) => (
  <tr key={idx} className="hover:bg-gray-50">
   <td className="px-6 py-4 whitespace-nowrap">
   <input
   type="checkbox"
   checked={selectedSales.includes(idx)}
   onChange={() => handleSelectSale(idx)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
   />
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <span
   className={`w-8 h-8 rounded-full flex items-center justify-center text-xl ${sale.customer.color}`}
   >
   {sale.customer.avatar}
   </span>
   <span className="text-sm text-gray-900">
   {sale.customer.name}
   </span>
   </div>
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {sale.reference}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {sale.date}
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   {statusBadge(sale.status)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {sale.grandTotal}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {sale.paid}
   </td>
   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {sale.due}
   </td>
   <td className="px-6 py-4 whitespace-nowrap">
   {paymentBadge(sale.paymentStatus)}
   </td>
   <td className="px-6 py-4 whitespace-nowrap relative">
   <button
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   onClick={() =>
   setOpenDropdown(openDropdown === idx ? null : idx)
   }
   >
   <MoreVertical size={16} />
   </button>
   {openDropdown === idx && (
   <div
   ref={dropdownRef}
   className="absolute lg:right-20 right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-100"
   >
   <Link
    href="/sales-online-orders"
    className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
    onClick={() => setOpenDropdown(null)}
   >
    <FileText size={16} className="mr-2" /> View in Sales
   </Link>
   </div>
   )}
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
  onChange={(e) =>
   handleRowsPerPageChange(Number(e.target.value))
  }
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
 </div>
 );
};

export default Page;

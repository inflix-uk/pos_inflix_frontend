"use client";

import React from "react";
import { Eye, Edit, Trash2, Tag } from "lucide-react";
import Link from "next/link";
import { Coupon } from "../types";

interface CouponTableProps {
 coupons: Coupon[];
 selectedCoupons: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectCoupon: (id: string) => void;
 onEdit: (coupon: Coupon) => void;
 onDelete: (coupon: Coupon) => void;
 getStatusColor: (status: string) => string;
 getTypeColor: (type: string) => string;
}

export const CouponTable: React.FC<CouponTableProps> = ({
 coupons,
 selectedCoupons,
 selectAll,
 onSelectAll,
 onSelectCoupon,
 onEdit,
 onDelete,
 getStatusColor,
 getTypeColor,
}) => {
 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-6 py-4 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Name</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Code</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Description</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Type</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Discount</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Limit</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Valid</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
  {coupons.map((coupon) => (
  <tr key={coupon.id} className="hover:bg-gray-50">
  <td className="px-6 py-4">
  <input
   type="checkbox"
   checked={selectedCoupons.includes(coupon.id)}
   onChange={() => onSelectCoupon(coupon.id)}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-3">
   <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
   <Tag className="text-orange-600" size={16} />
   </div>
   <span className="text-sm font-medium text-gray-900">{coupon.name}</span>
  </div>
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded font-mono">
   {coupon.code}
  </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
  {coupon.description}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(coupon.type)}`}>
   {coupon.type}
  </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {coupon.type === "Percentage" ? `${coupon.discount}%` : `$${coupon.discount}`}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {coupon.limit === 0 ? "Unlimited" : String(coupon.limit).padStart(2, "0")}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.valid}</td>
  <td className="px-6 py-4 whitespace-nowrap">
  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(coupon.status)}`}>
   {coupon.status}
  </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
   <Link
   href="/promo/coupons/detail"
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Eye size={16} />
   </Link>
   <button
   onClick={() => onEdit(coupon)}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Edit size={16} />
   </button>
   <button
   onClick={() => onDelete(coupon)}
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
 );
};

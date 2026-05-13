"use client";

import React from "react";
import Link from "next/link";
import { Edit, Trash2, Layers } from "lucide-react";
import { Category } from "../types";

interface CategoryTableProps {
 categories: Category[];
 selectedCategories: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectCategory: (id: string) => void;
 onDelete: (category: Category) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
 categories,
 selectedCategories,
 selectAll,
 onSelectAll,
 onSelectCategory,
 onDelete,
}) => {
 const formatDate = (dateString?: string) => {
 if (!dateString) return "N/A";
 return new Date(dateString).toLocaleDateString("en-GB", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 });
 };

 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-t border-gray-200">
  <tr>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
  />
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Category
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Category Slug
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Sub Categories
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Use for
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Created On
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Status
  </th>
  <th className="px-3 @[640px]:px-6 py-2 @[640px]:py-3 text-left text-[10px] @[640px]:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {categories.map((category) => (
  <tr key={category._id || category.slug} className="hover:bg-gray-50">
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
  <input
   type="checkbox"
   checked={selectedCategories.includes(category._id || category.slug)}
   onChange={() => onSelectCategory(category._id || category.slug)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
  />
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
  {category.name}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
  {category.slug}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-600">
  {category.subCategoryCount || 0} sub-categories
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-600">
  {category.itemType === "serial"
   ? "Serial (IMEI) only"
   : category.itemType === "non-serial"
   ? "Non-serial only"
   : "Both"}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap text-xs @[640px]:text-sm text-gray-900">
  {formatDate(category.createdAt)}
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
  <span
   className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
   category.isActive
   ? "bg-green-100 text-green-700"
   : "bg-red-100 text-red-700"
   }`}
  >
   {category.isActive ? "Active" : "Inactive"}
  </span>
  </td>
  <td className="px-3 @[640px]:px-6 py-2.5 @[640px]:py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
   <button
   className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
   onClick={() => window.open(`/inventory/category/${category.slug}/sub-categories`, '_blank')}
   title="Manage Sub-Categories"
   >
   <Layers size={16} />
   </button>
   <Link
   href={`/inventory/category/edit/${category._id}`}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg inline-flex"
   title="Edit"
   >
   <Edit size={16} />
   </Link>
   <button
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
   onClick={() => onDelete(category)}
   title="Delete"
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

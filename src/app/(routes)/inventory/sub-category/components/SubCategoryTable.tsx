"use client";

import React from "react";
import { Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { SubCategory } from "../types";

interface SubCategoryTableProps {
 subCategories: SubCategory[];
 selectedSubCategories: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectSubCategory: (id: string) => void;
 onEdit: (subCategory: SubCategory) => void;
 onDelete: (subCategory: SubCategory) => void;
}

export const SubCategoryTable: React.FC<SubCategoryTableProps> = ({
 subCategories,
 selectedSubCategories,
 selectAll,
 onSelectAll,
 onSelectSubCategory,
 onEdit,
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
  <th className="px-6 py-3 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
  />
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Image
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Sub-Category
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Category
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Code
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Created On
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Status
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {subCategories.map((subCategory) => (
  <tr key={subCategory._id || subCategory.code} className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap">
  <input
   type="checkbox"
   checked={selectedSubCategories.includes(subCategory._id || subCategory.code)}
   onChange={() => onSelectSubCategory(subCategory._id || subCategory.code)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
  />
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  {subCategory.image ? (
   <img
   src={subCategory.image}
   alt={subCategory.name}
   className="w-10 h-10 rounded-lg object-cover"
   />
  ) : (
   <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
   <ImageIcon size={20} className="text-gray-400" />
   </div>
  )}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <div>
   <div className="text-sm font-medium text-gray-900">
   {subCategory.name}
   </div>
   <div className="text-sm text-gray-500">{subCategory.slug}</div>
  </div>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {subCategory.category}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {subCategory.code}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {formatDate(subCategory.createdAt)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <span
   className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
   subCategory.isActive
   ? "bg-green-100 text-green-700"
   : "bg-red-100 text-red-700"
   }`}
  >
   {subCategory.isActive ? "Active" : "Inactive"}
  </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
   <button
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   onClick={() => onEdit(subCategory)}
   >
   <Edit size={16} />
   </button>
   <button
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
   onClick={() => onDelete(subCategory)}
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

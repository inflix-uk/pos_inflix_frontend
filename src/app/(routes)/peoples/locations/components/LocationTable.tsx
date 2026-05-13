"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Location } from "../types";

interface LocationTableProps {
 locations: Location[];
 selectedLocations: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectLocation: (id: string) => void;
 onEdit: (location: Location) => void;
 onDelete: (location: Location) => void;
}

export const LocationTable: React.FC<LocationTableProps> = ({
 locations,
 selectedLocations,
 selectAll,
 onSelectAll,
 onSelectLocation,
 onEdit,
 onDelete,
}) => {
 const formatDate = (dateString?: string) => {
 if (!dateString) return "-";
 return new Date(dateString).toLocaleDateString("en-US", {
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 };

 return (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-y border-gray-200">
  <tr>
  <th className="px-6 py-4 text-left">
  <input
  type="checkbox"
  checked={selectAll}
  onChange={onSelectAll}
  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
  />
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Name
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Type
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Contact Person
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Phone
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  City
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Status
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Created
  </th>
  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
  {locations.length === 0 ? (
  <tr>
  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
  No locations found
  </td>
  </tr>
  ) : (
  locations.map((location) => (
  <tr key={location._id || location.name} className="hover:bg-gray-50">
  <td className="px-6 py-4">
   <input
   type="checkbox"
   checked={selectedLocations.includes(location._id || location.name)}
   onChange={() => onSelectLocation(location._id || location.name)}
   className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
   />
  </td>
  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
   {location.name}
  </td>
  <td className="px-6 py-4">
   <span
   className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
   location.type === "store"
   ? "bg-neutral-100 text-neutral-800"
   : "bg-yellow-100 text-yellow-800"
   }`}
   >
   {location.type === "store" ? "Store" : "Warehouse"}
   </span>
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {location.contactPerson}
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {location.phone}
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {location.city}, {location.country}
  </td>
  <td className="px-6 py-4">
   <span
   className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
   location.isActive
   ? "bg-green-100 text-green-800"
   : "bg-red-100 text-red-800"
   }`}
   >
   {location.isActive ? "Active" : "Inactive"}
   </span>
  </td>
  <td className="px-6 py-4 text-sm text-gray-600">
   {formatDate(location.createdAt)}
  </td>
  <td className="px-6 py-4">
   <div className="flex items-center gap-2">
   <button
   onClick={() => onEdit(location)}
   className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
   >
   <Edit2 size={16} />
   </button>
   <button
   onClick={() => onDelete(location)}
   className="p-1.5 text-red-600 hover:bg-red-50 rounded"
   >
   <Trash2 size={16} />
   </button>
   </div>
  </td>
  </tr>
  ))
  )}
 </tbody>
 </table>
 </div>
 );
};

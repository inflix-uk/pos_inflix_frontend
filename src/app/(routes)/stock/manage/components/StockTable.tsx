"use client";

import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Stock } from "../types";

interface StockTableProps {
 stocks: Stock[];
 selectedStocks: string[];
 selectAll: boolean;
 onSelectAll: () => void;
 onSelectStock: (id: string) => void;
 onEdit: (stock: Stock) => void;
 onDelete: (stock: Stock) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
 stocks,
 selectedStocks,
 selectAll,
 onSelectAll,
 onSelectStock,
 onEdit,
 onDelete,
}) => {
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
  Warehouse
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Store
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Product
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Date
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Person
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Qty
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Actions
  </th>
  </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
  {stocks.length === 0 ? (
  <tr>
  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
  No stocks found
  </td>
  </tr>
  ) : (
  stocks.map((stock) => (
  <tr key={stock.id} className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap">
   <input
   type="checkbox"
   checked={selectedStocks.includes(stock.id)}
   onChange={() => onSelectStock(stock.id)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
   />
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {stock.warehouse}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {stock.store}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <span className="inline-block text-2xl align-middle bg-gray-100 rounded p-1">
   {stock.product.icon}
   </span>
   <span className="text-sm font-medium text-gray-900">
   {stock.product.name}
   </span>
   </div>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {stock.date}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <span className="inline-block text-2xl align-middle bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
   {stock.person.avatar}
   </span>
   <span className="text-sm text-gray-900">
   {stock.person.name}
   </span>
   </div>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {stock.qty}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <button
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   onClick={() => onEdit(stock)}
   >
   <Edit size={16} />
   </button>
   <button
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
   onClick={() => onDelete(stock)}
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

"use client";
import React from "react";
import Link from "next/link";
import { Eye, Edit, Trash2, Package } from "lucide-react";
import { Product } from "../types";

interface ProductTableProps {
 products: Product[];
 selectedProducts: string[];
 selectAll: boolean;
 isLoading: boolean;
 onSelectAll: () => void;
 onSelectProduct: (id: string) => void;
 onDelete: (product: Product) => void;
}

export default function ProductTable({
 products,
 selectedProducts,
 selectAll,
 isLoading,
 onSelectAll,
 onSelectProduct,
 onDelete,
}: ProductTableProps) {
 const formatPrice = (price: number) => {
 return new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: "GBP",
 }).format(price);
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
  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
  />
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Product
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  SKU
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Category
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Cost Price
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Selling Price
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Qty
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Unit
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
  {isLoading ? (
  <tr>
  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
  <div className="flex items-center justify-center gap-2">
   <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
   Loading products...
  </div>
  </td>
  </tr>
  ) : products.length === 0 ? (
  <tr>
  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
  <Package size={48} className="mx-auto mb-4 text-gray-300" />
  <p>No products found</p>
  <Link
   href="/create-product"
   className="text-orange-500 hover:text-orange-600 mt-2 inline-block"
  >
   Add your first product
  </Link>
  </td>
  </tr>
  ) : (
  products.map((product) => (
  <tr key={product._id} className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap">
   <input
   type="checkbox"
   checked={selectedProducts.includes(product._id)}
   onChange={() => onSelectProduct(product._id)}
   className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
   />
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-3">
   <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
   {product.image ? (
   <img
    src={product.image}
    alt={product.name}
    className="w-full h-full object-cover"
   />
   ) : (
   <Package size={20} className="text-gray-400" />
   )}
   </div>
   <div>
   <p className="text-sm font-medium text-gray-900">{product.name}</p>
   {product.barcode && (
   <p className="text-xs text-gray-500">{product.barcode}</p>
   )}
   </div>
   </div>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {product.sku}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
   {product.category?.name || "-"}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {formatPrice(product.costPrice)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
   {formatPrice(product.sellingPrice)}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <span
   className={`text-sm font-medium ${
   product.quantity <= product.minStockLevel
   ? "text-red-600"
   : "text-gray-900"
   }`}
   >
   {product.quantity}
   </span>
   {product.quantity <= product.minStockLevel && (
   <span className="ml-2 text-xs text-red-500">Low</span>
   )}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
   {product.unit}
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <span
   className={`px-2 py-1 text-xs font-medium rounded-full ${
   product.isActive
   ? "bg-green-100 text-green-700"
   : "bg-red-100 text-red-700"
   }`}
   >
   {product.isActive ? "Active" : "Inactive"}
   </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
   <div className="flex items-center gap-2">
   <Link
   href={`/product-detail/${product._id}`}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Eye size={16} />
   </Link>
   <Link
   href={`/edit-product/${product._id}`}
   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
   >
   <Edit size={16} />
   </Link>
   <button
   onClick={() => onDelete(product)}
   className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
}

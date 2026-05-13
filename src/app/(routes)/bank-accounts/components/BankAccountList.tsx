"use client";

import React from "react";
import { Edit2, Trash2, Star, Building2 } from "lucide-react";
import { BankAccountListProps } from "../types";

export const BankAccountList: React.FC<BankAccountListProps> = ({
 accounts,
 onEdit,
 onDelete,
 onSetDefault,
}) => {
 if (accounts.length === 0) {
 return (
 <div className="@container bg-white rounded-lg shadow-sm border border-gray-200 p-8 @[640px]:p-10 @[768px]:p-12 text-center">
 <Building2 className="h-10 w-10 @[640px]:h-12 @[640px]:w-12 text-gray-300 mx-auto mb-3 @[640px]:mb-4" />
 <h3 className="text-base @[640px]:text-lg font-medium text-gray-800 mb-1.5 @[640px]:mb-2">No Bank Accounts</h3>
 <p className="text-xs @[640px]:text-sm text-gray-500">Add your first bank account to get started.</p>
 </div>
 );
 }

 return (
 <div className="@container space-y-3 @[640px]:space-y-4">
 {accounts.map((account) => (
 <div
  key={account._id}
  className={`bg-white rounded-lg shadow-sm border ${
  account.isDefault ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"
  } p-4 @[640px]:p-5 @[768px]:p-6`}
 >
  <div className="flex flex-col @[768px]:flex-row @[768px]:items-start @[768px]:justify-between gap-3 @[640px]:gap-4">
  <div className="flex-1">
  <div className="flex flex-wrap items-center gap-2 mb-2">
  <h3 className="text-base @[640px]:text-lg font-semibold text-gray-800">{account.accountName}</h3>
  {account.isDefault && (
   <span className="inline-flex items-center px-2 py-0.5 text-[10px] @[640px]:text-xs font-medium bg-orange-100 text-orange-600 rounded-full">
   <Star className="w-3 h-3 mr-1 fill-current" />
   Default
   </span>
  )}
  {!account.isActive && (
   <span className="inline-flex items-center px-2 py-0.5 text-[10px] @[640px]:text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
   Inactive
   </span>
  )}
  </div>

  <div className="grid grid-cols-1 @[480px]:grid-cols-2 @[1024px]:grid-cols-4 gap-3 @[640px]:gap-4 mt-3 @[640px]:mt-4">
  <div>
   <p className="text-[10px] @[640px]:text-xs text-gray-500 uppercase tracking-wide">Bank Name</p>
   <p className="text-xs @[640px]:text-sm font-medium text-gray-800">{account.bankName}</p>
  </div>
  <div>
   <p className="text-[10px] @[640px]:text-xs text-gray-500 uppercase tracking-wide">Account Number</p>
   <p className="text-xs @[640px]:text-sm font-medium text-gray-800">{account.accountNumber}</p>
  </div>
  <div>
   <p className="text-[10px] @[640px]:text-xs text-gray-500 uppercase tracking-wide">Sort Code</p>
   <p className="text-xs @[640px]:text-sm font-medium text-gray-800">{account.sortCode}</p>
  </div>
  {account.iban && (
   <div>
   <p className="text-[10px] @[640px]:text-xs text-gray-500 uppercase tracking-wide">IBAN</p>
   <p className="text-xs @[640px]:text-sm font-medium text-gray-800 truncate">{account.iban}</p>
   </div>
  )}
  {account.swiftBic && (
   <div>
   <p className="text-[10px] @[640px]:text-xs text-gray-500 uppercase tracking-wide">SWIFT/BIC</p>
   <p className="text-xs @[640px]:text-sm font-medium text-gray-800">{account.swiftBic}</p>
   </div>
  )}
  </div>

  {account.branchAddress && (
  <div className="mt-3 @[640px]:mt-4">
   <p className="text-[10px] @[640px]:text-xs text-gray-500 uppercase tracking-wide">Branch Address</p>
   <p className="text-xs @[640px]:text-sm text-gray-700">{account.branchAddress}</p>
  </div>
  )}
  </div>

  <div className="flex items-center gap-1.5 @[640px]:gap-2">
  {!account.isDefault && (
  <button
   onClick={() => onSetDefault(account)}
   className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
   title="Set as default"
  >
   <Star className="w-4 h-4 @[640px]:w-5 @[640px]:h-5" />
  </button>
  )}
  <button
  onClick={() => onEdit(account)}
  className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
  title="Edit"
  >
  <Edit2 className="w-4 h-4 @[640px]:w-5 @[640px]:h-5" />
  </button>
  <button
  onClick={() => onDelete(account)}
  className="p-1.5 @[640px]:p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
  title="Delete"
  >
  <Trash2 className="w-4 h-4 @[640px]:w-5 @[640px]:h-5" />
  </button>
  </div>
  </div>
 </div>
 ))}
 </div>
 );
};

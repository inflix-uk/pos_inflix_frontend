"use client";

import React from "react";
import { ParcelData, QuantityData } from "../types";

interface AccountOption {
 _id: string;
 name: string;
}

interface ParcelDetailsSummaryProps {
 parcelData: ParcelData;
 quantityData: QuantityData;
 accountOptions: AccountOption[];
 enteredImeiQty: number;
 enteredOtherQty: number;
}

function formatParcelDate(dateStr: string): string {
 if (!dateStr) return "—";
 const d = new Date(dateStr + "T00:00:00");
 const day = String(d.getDate()).padStart(2, "0");
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const year = d.getFullYear();
 return `${day}/${month}/${year} 00:00:00`;
}

export const ParcelDetailsSummary: React.FC<ParcelDetailsSummaryProps> = React.memo(({
 parcelData,
 quantityData,
 accountOptions,
 enteredImeiQty,
 enteredOtherQty,
}) => {
 const accountName =
 (accountOptions.find((o) => o._id === parcelData.account)?.name ?? parcelData.account) || "—";
 const expImei = quantityData.imeiQuantity ? parseInt(quantityData.imeiQuantity, 10) : 0;
 const expOther = quantityData.otherQuantity ? parseInt(quantityData.otherQuantity, 10) : 0;

 return (
 <div className="border border-gray-200 rounded-lg overflow-hidden">
 <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
 <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Purchase details</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm border-collapse">
  <thead>
  <tr className="border-b border-gray-200 bg-gray-50/80">
  <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
  <th className="text-left py-2 px-3 font-medium text-gray-700">Account</th>
  <th className="text-left py-2 px-3 font-medium text-gray-700">Currency</th>
  <th className="text-left py-2 px-3 font-medium text-gray-700">Exp IMEIs Qty</th>
  <th className="text-left py-2 px-3 font-medium text-gray-700">Ent IMEIs Qty</th>
  <th className="text-left py-2 px-3 font-medium text-gray-700">Exp Other Qty</th>
  <th className="text-left py-2 px-3 font-medium text-gray-700">Ent Other Qty</th>
  </tr>
  </thead>
  <tbody>
  <tr className="border-b border-gray-100 bg-white">
  <td className="py-2 px-3 text-gray-800 whitespace-nowrap">
  {formatParcelDate(parcelData.date)}
  </td>
  <td className="py-2 px-3 text-gray-800">{accountName}</td>
  <td className="py-2 px-3 text-gray-800">{parcelData.currency || "—"}</td>
  <td className="py-2 px-3 text-gray-800">{expImei}</td>
  <td className="py-2 px-3 text-gray-800">{enteredImeiQty}</td>
  <td className="py-2 px-3 text-gray-800">{expOther}</td>
  <td className="py-2 px-3 text-gray-800">{enteredOtherQty}</td>
  </tr>
  </tbody>
 </table>
 </div>
 </div>
 );
});

ParcelDetailsSummary.displayName = "ParcelDetailsSummary";

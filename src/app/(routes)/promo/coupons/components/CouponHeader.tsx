"use client";

import React from "react";
import { Plus } from "lucide-react";

interface CouponHeaderProps {
 onAddClick: () => void;
}

export const CouponHeader: React.FC<CouponHeaderProps> = ({ onAddClick }) => {
 return (
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
 <p className="text-gray-600">Manage Your Coupons</p>
 </div>
 <button
 onClick={onAddClick}
 className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
 >
 <Plus size={20} />
 Add Coupons
 </button>
 </div>
 );
};

"use client";

import React from "react";
import { Package, ArrowLeft } from "lucide-react";

interface PageHeaderProps {
 onBack: () => void;
 title?: string;
 subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(({
 onBack,
 title = "Add New Purchase",
 subtitle = "Add a purchase to inventory",
}) => {
 return (
 <div className="flex items-center gap-3">
 <button
 onClick={onBack}
 className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
 >
 <ArrowLeft className="h-5 w-5 text-gray-600" />
 </button>
 <div className="p-2 bg-orange-100 rounded-lg">
 <Package className="h-6 w-6 text-orange-500" />
 </div>
 <div>
 <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
 <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
 </div>
 </div>
 );
});

PageHeader.displayName = "PageHeader";

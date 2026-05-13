"use client";

import React from "react";

interface ProductSectionProps {
 title: string;
 children: React.ReactNode;
}

/** Same style as parcel form: light section header, single card */
export default function ProductSection({ title, children }: ProductSectionProps) {
 return (
 <div className="border-b border-gray-200 last:border-b-0">
 <div className="px-6 py-4 border-b border-gray-200">
 <h2 className="text-base font-medium text-gray-800">{title}</h2>
 </div>
 <div className="px-6 pb-6 pt-4">{children}</div>
 </div>
 );
}

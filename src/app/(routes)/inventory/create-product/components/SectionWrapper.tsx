"use client";
import React from "react";
import { ChevronDown } from "lucide-react";

interface SectionWrapperProps {
 title: string;
 stepNumber?: number;
 isExpanded: boolean;
 onToggle: () => void;
 children: React.ReactNode;
}

export default function SectionWrapper({
 title,
 stepNumber,
 isExpanded,
 onToggle,
 children,
}: SectionWrapperProps) {
 return (
 <div className="border-b border-gray-200">
 <div
 className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
 onClick={onToggle}
 >
 <div className="flex items-center">
  {stepNumber !== undefined && (
  <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center mr-3">
  <span className="text-orange-600 text-sm font-medium">{stepNumber}</span>
  </div>
  )}
  {stepNumber === undefined && (
  <div className="w-5 h-5 flex items-center justify-center mr-3">
  <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
  </div>
  )}
  <h2 className="text-lg font-medium text-gray-900">{title}</h2>
 </div>
 <ChevronDown
  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
 />
 </div>
 {isExpanded && <div className="px-4 pb-6">{children}</div>}
 </div>
 );
}

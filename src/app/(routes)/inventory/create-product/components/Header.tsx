"use client";
import React from "react";
import Link from "next/link";

interface HeaderProps {
 title: string;
 subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
 return (
 <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
 <div>
 <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
 {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
 </div>
 <div className="flex items-center space-x-3">
 <button className="p-2 text-gray-400 hover:text-gray-600">
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path
  strokeLinecap="round"
  strokeLinejoin="round"
  strokeWidth={2}
  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
  />
  </svg>
 </button>
 <button className="p-2 text-gray-400 hover:text-gray-600">
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
 </button>
 <Link
  href="/products"
  className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 flex items-center"
 >
  ← Back to Product
 </Link>
 </div>
 </div>
 );
}

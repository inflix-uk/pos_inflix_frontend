"use client";

import React from "react";

export const LoadingSpinner: React.FC = () => {
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
 </div>
 );
};

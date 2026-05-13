"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { MessageAlertProps } from "../types";

export const MessageAlert: React.FC<MessageAlertProps> = ({ message }) => {
 if (!message.text) return null;

 return (
 <div
 className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
 message.type === "success"
  ? "border-green-200 bg-green-50 text-green-800"
  : "border-red-200 bg-red-50 text-red-700"
 }`}
 >
 {message.type === "success" ? (
 <CheckCircle className="h-4 w-4 flex-shrink-0" />
 ) : (
 <XCircle className="h-4 w-4 flex-shrink-0" />
 )}
 {message.text}
 </div>
 );
};

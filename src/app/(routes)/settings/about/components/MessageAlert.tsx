"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { MessageAlertProps } from "../types";

export const MessageAlert: React.FC<MessageAlertProps> = ({ message }) => {
 if (!message.text) return null;

 return (
 <div
 className={`mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
 message.type === "success"
  ? "bg-green-50 border border-green-200 text-green-600"
  : "bg-red-50 border border-red-200 text-red-600"
 }`}
 >
 {message.type === "success" ? (
 <CheckCircle className="h-5 w-5 flex-shrink-0" />
 ) : (
 <XCircle className="h-5 w-5 flex-shrink-0" />
 )}
 {message.text}
 </div>
 );
};

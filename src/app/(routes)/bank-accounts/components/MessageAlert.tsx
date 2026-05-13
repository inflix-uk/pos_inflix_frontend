"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Message } from "../types";

interface MessageAlertProps {
 message: Message;
}

export const MessageAlert: React.FC<MessageAlertProps> = ({ message }) => {
 if (!message.text) return null;

 return (
 <div
 className={`mb-4 @[640px]:mb-5 @[768px]:mb-6 px-3 @[640px]:px-4 py-2 @[640px]:py-3 rounded-lg text-xs @[640px]:text-sm flex items-center gap-2 ${
 message.type === "success"
  ? "bg-green-50 border border-green-200 text-green-600"
  : "bg-red-50 border border-red-200 text-red-600"
 }`}
 >
 {message.type === "success" ? (
 <CheckCircle className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 flex-shrink-0" />
 ) : (
 <XCircle className="h-4 w-4 @[640px]:h-5 @[640px]:w-5 flex-shrink-0" />
 )}
 {message.text}
 </div>
 );
};

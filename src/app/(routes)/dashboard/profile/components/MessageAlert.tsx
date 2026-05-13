"use client";

import React from "react";
import { Message } from "../types";

interface MessageAlertProps {
 message: Message;
}

export const MessageAlert: React.FC<MessageAlertProps> = ({ message }) => {
 if (!message.text) return null;

 return (
 <div
 className={`mx-6 mt-6 px-4 py-3 rounded-lg text-sm ${
 message.type === "success"
  ? "bg-green-50 border border-green-200 text-green-600"
  : "bg-red-50 border border-red-200 text-red-600"
 }`}
 >
 {message.text}
 </div>
 );
};

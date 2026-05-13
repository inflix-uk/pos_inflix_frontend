"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export default function LogoutPage() {
 const router = useRouter();

 useEffect(() => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 const finish = () => {
  if (typeof window !== "undefined") {
  localStorage.removeItem("token");
  }
  router.replace("/");
 };
 if (token) {
  fetch(`${API_BASE}/auth/logout`, {
  method: "POST",
  headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
  },
  })
  .catch(() => {})
  .finally(finish);
 } else {
  finish();
 }
 }, [router]);

 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
 <div className="max-w-md w-full text-center">
 <div className="p-4 rounded-full bg-orange-100 inline-flex mb-4">
  <LogOut className="h-16 w-16 text-orange-600" />
 </div>
 <h1 className="text-2xl font-semibold text-gray-800 mb-2">Signing you out…</h1>
 <p className="text-gray-600">Redirecting to login.</p>
 </div>
 </div>
 );
}

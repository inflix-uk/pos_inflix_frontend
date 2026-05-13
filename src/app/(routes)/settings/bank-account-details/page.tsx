"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BankAccountDetailsRedirect() {
 const router = useRouter();
 useEffect(() => {
 router.replace("/bank-accounts");
 }, [router]);
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-gray-500">Redirecting to Bank Accounts...</p>
 </div>
 );
}

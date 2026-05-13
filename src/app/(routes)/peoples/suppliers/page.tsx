"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PeoplesSuppliersPage() {
 const router = useRouter();
 useEffect(() => {
 router.replace("/customers");
 }, [router]);
 return (
 <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
 <p className="text-gray-500">Redirecting to Customers...</p>
 </div>
 );
}

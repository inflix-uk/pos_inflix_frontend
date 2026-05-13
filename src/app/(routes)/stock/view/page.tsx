"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StockViewPage() {
 const router = useRouter();
 useEffect(() => {
 router.replace("/inventory/products");
 }, [router]);
 return null;
}

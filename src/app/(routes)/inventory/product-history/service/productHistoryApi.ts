const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 if (typeof window === "undefined") return { "Content-Type": "application/json" };
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
}

export interface ProductHistoryOrigin {
 purchaseId?: string;
 itemId?: string;
 purchaseNumber: string;
 parcelNumber?: string;
 date: string;
 createdAt?: string;
 supplier: string;
 currency?: string;
 /** Parcel / purchase note (e.g. from create-product intake note) */
 purchaseNote?: string;
 item: {
  brand?: string;
  brandModel?: string;
  grade?: string;
  capacity?: string;
  colour?: string;
  purchasePrice?: number;
  salePrice?: number;
  name?: string;
 };
}

export interface ProductHistorySale {
 _id: string;
 reference: string;
 type?: string;
 customerName?: string;
 total?: number;
 createdAt: string;
 fromHistory?: boolean;
 items?: { sku: string; name: string; quantity: number; price: number; serialNumbers?: string[] }[];
}

export interface ProductHistoryMovement {
 type: "received" | "sale" | "removed_from_invoice" | "returned" | "sale_deleted" | "returned_to_supplier" | "received_from_repair";
 date: string;
 dateTime?: string;
 from?: string;
 to?: string;
 note?: string;
 /** Intake / parcel note on the purchase */
 purchaseNote?: string;
 parcelNumber?: string;
 reference?: string;
 amount?: number;
 saleId?: string;
 salesReturnId?: string;
 purchaseReturnId?: string;
 returnDestination?: string;
 /** Purchase return events: product name, reason, return-to, user */
 productName?: string;
 returnReason?: string;
 returnTo?: string;
 performedBy?: string;
}

export interface ProductHistoryResponse {
 success: boolean;
 serialNumber: string;
 status: "in_stock" | "sold" | "returned" | "not_in_stock";
 origin: ProductHistoryOrigin | null;
 sales: ProductHistorySale[];
 movements: ProductHistoryMovement[];
 data?: {
  serialNumber: string;
  status: string;
  origin: ProductHistoryOrigin | null;
  sales: ProductHistorySale[];
  movements: ProductHistoryMovement[];
 };
}

export const productHistoryApi = {
 getBySerial: async (serialNumber: string): Promise<ProductHistoryResponse> => {
  const serial = encodeURIComponent(serialNumber.trim());
  const res = await fetch(`${API_BASE}/api/products/serial-history/${serial}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load product history");
  return data;
 },
};

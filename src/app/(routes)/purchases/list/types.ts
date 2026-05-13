export interface PurchaseItem {
 _id?: string;
 id: string;
 product: string;
 qty: number;
 sendTo?: string | { _id: string; name: string };
 tax: number;
 taxAmount: number;
 category?: string | { _id: string; name: string };
 subCategory?: string | { _id: string; name: string };
 grade?: string;
 brand?: string;
 brandModel?: string;
 capacity?: string;
 colour?: string;
 purchasePrice: number;
 salePrice?: number;
 discount: number;
 unitCost: number;
 totalCost: number;
 imeis?: string[];
}

export interface Purchase {
 _id: string;
 id?: string;
 purchaseNumber: string;
 supplier?: string | { _id: string; name: string; contactPerson?: string };
 account?: string | { _id: string; name: string; contactPerson?: string; contactName?: string };
 parcelNumber?: string;
 date: string;
 currency?: string;
 note?: string;
 imeiQuantity?: number;
 otherQuantity?: number;
 /** Total "other" (non-IMEI) quantity expected; for completion status. */
 totalOtherQuantity?: number;
 items: PurchaseItem[];
 totalIMEIs?: number;
 status: "Received" | "Pending" | "Ordered";
 paymentStatus: "Paid" | "Unpaid" | "Partial";
 /** Parcel completion: In Process | Completed; user can change. */
 completionStatus?: "In Process" | "Completed";
 grandTotal: number;
 paid: number;
 createdBy?: string | { _id: string; name: string };
 createdAt?: string;
 updatedAt?: string;
}

export interface PurchaseFormData {
 supplier?: string;
 supplierName: string;
 reference: string;
 parcelNumber?: string;
 date: string;
 currency?: string;
 note?: string;
 description: string;
 imeiQuantity?: number;
 otherQuantity?: number;
 items: PurchaseItem[];
 totalIMEIs?: number;
 status?: "Received" | "Pending" | "Ordered";
 completionStatus?: "In Process" | "Completed";
 grandTotal?: number;
 orderTax: number;
 discount: number;
 shipping: number;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

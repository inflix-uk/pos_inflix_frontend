/** One line when creating a purchase return */
export interface PurchaseReturnItemInput {
 purchaseItemId: string;
 quantityReturned?: number;
 imeisReturned?: string[];
}

/** Item line as stored in a purchase return (from API) */
export interface PurchaseReturnLine {
 _id?: string;
 purchaseItemId: string;
 quantityReturned: number;
 imeisReturned: string[];
 purchasePrice: number;
}

export interface PurchaseReturn {
 _id: string;
 id?: string;
 returnNumber: string;
 purchase: string | { _id: string; purchaseNumber?: string; date?: string; status?: string; grandTotal?: number };
 purchaseNumber?: string;
 supplierName?: string;
 date: string;
 status: "Pending" | "Sent" | "Received by Supplier";
 note?: string;
 items: PurchaseReturnLine[];
 totalAmount: number;
 createdBy?: string | { _id: string; name: string };
 createdAt?: string;
 updatedAt?: string;
}

/** Payload to create a purchase return */
export interface CreatePurchaseReturnPayload {
 purchaseId: string;
 date?: string;
 note?: string;
 items: PurchaseReturnItemInput[];
}

export interface Message {
 type: "success" | "error";
 text: string;
}

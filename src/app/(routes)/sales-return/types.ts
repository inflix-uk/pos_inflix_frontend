/** Where returned item goes: restock (sellable), damaged, refurb, return_to_supplier */
export type ReturnDestination = "restock" | "damaged" | "refurb" | "return_to_supplier";

export interface SalesReturnItem {
 id: string;
 product: string;
 sku?: string;
 netUnitPrice: number;
 stock: number;
 quantity: number;
 discount: number;
 taxPercent: number;
 subtotal: number;
 serialNumbers?: string[];
 returnDestination?: ReturnDestination;
}

export interface SalesReturn {
 id: string;
 reference: string;
 /** Original sale invoice reference (e.g. INV-000002) */
 linkedInvoiceRef?: string;
 customer: {
  name: string;
  avatar: string;
  color: string;
 };
 date: string;
 status: "Received" | "Pending" | "Ordered";
 total: number;
 paid: number;
 due: number;
 paymentStatus: "Paid" | "Unpaid" | "Pending";
 items: SalesReturnItem[];
 orderTax: number;
 discount: number;
 shipping: number;
 grandTotal: number;
}

export interface SalesReturnFilters {
 search?: string;
 status?: string;
 customer?: string;
 paymentStatus?: string;
 page?: number;
 limit?: number;
}

export interface SalesReturnListResponse {
 success: boolean;
 data: SalesReturn[];
 total: number;
 page: number;
 pages: number;
 count: number;
}

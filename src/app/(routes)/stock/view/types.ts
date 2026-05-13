/** One row in the stock view table (one per IMEI, or one per "other" item with imei "-") */
export interface StockViewRow {
 purchaseNumber: string;
 parcelNumber: string;
 date: string;
 /** ISO date string for display (date + time); prefer over date for "Date" column */
 createdAt?: string;
 supplier: string;
 currency: string;
 status: string;
 paymentStatus: string;
 category: string;
 grade: string;
 brand: string;
 brandModel: string;
 capacity: string;
 colour: string;
 purchasePrice: number;
 salePrice: number;
 imei: string;
 /** Unique key for React list (purchaseId + itemId + imei or index) */
 rowKey: string;
 /** True = serial/IMEI product; false = non-serial (other item, e.g. accessories) */
 isSerialProduct: boolean;
 /** Non-serial item name (e.g. "Back Covers") */
 name?: string;
 /** Non-serial item barcode / SKU */
 barcode?: string;
 /** Non-serial item quantity (editable in inventory) */
 quantity?: number;
 /** Purchase document id (for updating item quantity) */
 purchaseId?: string;
 /** Purchase item subdocument id (for updating item quantity) */
 itemId?: string;
 /** Resolved from Product by barcode (for pricing group rate list — link serial item to ProductGroupPrice) */
 productId?: string;
 /** Variant attributes from API (e.g. { slug: "ram", value: "8GB" }) */
 variantValues?: { slug?: string; value?: string }[];
 /** Category's variant attribute slugs in Edit Category order (for column order on inventory tables) */
 variantAttributeSlugsOrder?: string[];
 /** Auto-generated serial item ID number (e.g. SID-000001) */
 serialItemIdNumber?: string;
 /** Parcel/intake note saved with the purchase */
 note?: string;
 /** When row is sold, backend may embed sold info (avoids separate sold-serials call) */
 soldInfo?: { customerName: string; saleReference: string; saleId?: string };
}

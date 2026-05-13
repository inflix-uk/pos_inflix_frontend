export type StockTransferStatus = "Draft" | "Dispatched" | "Received" | "Cancelled";

export interface StockTransferLine {
 _id?: string;
 productId: string | { _id: string; name?: string; sku?: string; barcode?: string };
 qty: number;
 unitCost?: number;
}

export interface StockTransferSerial {
 _id?: string;
 productId?: string | { _id: string; name?: string; sku?: string } | null;
 serialOrImei: string;
 fromLocationId: string | { _id: string; name?: string };
 toLocationId: string | { _id: string; name?: string };
}

export interface StockTransfer {
 _id: string;
 transferNo: string;
 fromLocationId: string | { _id: string; name?: string; type?: string };
 toLocationId: string | { _id: string; name?: string; type?: string };
 status: StockTransferStatus;
 notes?: string;
 createdByUserId?: string | { _id: string; name?: string };
 dispatchedByUserId?: string | { _id: string; name?: string } | null;
 receivedByUserId?: string | { _id: string; name?: string } | null;
 dispatchedAtUtc?: string | null;
 receivedAtUtc?: string | null;
 createdAt?: string;
 updatedAt?: string;
 lines?: StockTransferLine[];
 serials?: StockTransferSerial[];
}

export interface StockTransferFilters {
 status?: StockTransferStatus;
 fromLocationId?: string;
 toLocationId?: string;
 fromUtc?: string;
 toUtc?: string;
 search?: string;
 imei?: string;
 page?: number;
 limit?: number;
}

export interface StockMove {
 _id: string;
 transferId: string;
 type: "in" | "out";
 locationId: string;
 productId?: string | null;
 quantity?: number | null;
 serialNumber?: string | null;
 createdAt?: string;
}

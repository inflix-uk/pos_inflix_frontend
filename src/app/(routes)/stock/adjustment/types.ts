export type StockAdjustmentStatus = "Draft" | "Posted" | "Cancelled";

export type StockAdjustmentReasonCode =
 | "COUNT_CORRECTION"
 | "DAMAGED"
 | "LOST_STOLEN"
 | "SUPPLIER_DISCREPANCY"
 | "DATA_FIX"
 | "OTHER";

export interface StockAdjustmentLine {
 _id: string;
 productId: string | { _id: string; name?: string; sku?: string; barcode?: string };
 deltaQty: number;
 unitCostSnapshot: number;
 valueSnapshot: number;
 costMissing?: boolean;
}

export interface StockAdjustmentSerial {
 _id: string;
 productId?: string | { _id: string; name?: string; sku?: string } | null;
 serialOrImei: string;
 direction: "IN" | "OUT";
 unitCostSnapshot: number;
 valueSnapshot: number;
 costMissing?: boolean;
}

export interface StockAdjustment {
 _id: string;
 adjustmentNo: string;
 locationId: string | { _id: string; name?: string; type?: string };
 status: StockAdjustmentStatus;
 reasonCode: StockAdjustmentReasonCode;
 notes?: string;
 createdByUserId?: string | { _id: string; name?: string };
 postedByUserId?: string | { _id: string; name?: string } | null;
 cancelledByUserId?: string | { _id: string; name?: string } | null;
 postedAtUtc?: string | null;
 cancelledAtUtc?: string | null;
 createdAt?: string;
 updatedAt?: string;
 totalQtyIn?: number;
 totalQtyOut?: number;
 totalValueIn?: number;
 totalValueOut?: number;
 lines?: StockAdjustmentLine[];
 serials?: StockAdjustmentSerial[];
}

export interface StockAdjustmentFilters {
 status?: StockAdjustmentStatus;
 locationId?: string;
 reasonCode?: StockAdjustmentReasonCode;
 fromUtc?: string;
 toUtc?: string;
 search?: string;
 imei?: string;
 page?: number;
 limit?: number;
}

export interface StockMove {
 _id: string;
 transferId?: string | null;
 adjustmentId?: string | null;
 type: "in" | "out" | "adjust_in" | "adjust_out";
 locationId: string;
 productId?: string | null;
 quantity?: number | null;
 serialNumber?: string | null;
 createdAt?: string;
}

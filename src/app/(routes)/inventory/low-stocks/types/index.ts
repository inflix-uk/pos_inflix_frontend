export interface LowStockProduct {
 _id: string;
 name: string;
 sku: string;
 barcode?: string;
 category: { _id: string; name: string } | null;
 store?: { _id: string; name: string } | null;
 warehouse?: { _id: string; name: string } | null;
 quantity: number;
 minStockLevel: number;
 costPrice: number;
 sellingPrice: number;
 unit: string;
 image?: string;
 isActive: boolean;
 /** Set when opening Add stock modal; required for stock update to reflect in low-stocks list */
 locationId?: string;
}

export interface LowStockFilters {
 search?: string;
 category?: string;
 warehouse?: string;
 store?: string;
}

export interface LowStockResponse {
 success: boolean;
 count: number;
 data: LowStockProduct[];
}

/** Row from GET /api/inventory/low-stocks (available qty from StockBalance + SerialLocation) */
export interface LowStockRow {
 productId: string;
 name: string;
 sku: string;
 category?: { _id: string; name: string; itemType?: string } | null;
 supplier?: { _id: string; name: string; contactPerson?: string; displayLabel?: string } | null;
 availableQty: number;
 thresholdUsed: number;
 effectiveThreshold: number;
 lowStockThreshold: number | null;
 reorderQtyDefault: number | null;
 isSerialized: boolean;
 locationId: string | null;
 suggestedReorderQty: number;
 status: "low" | "out_of_stock";
}

export interface LowStocksApiParams {
 locationId?: string;
 threshold?: number;
 q?: string;
 categoryId?: string;
 supplierId?: string;
 page?: number;
 limit?: number;
}

export interface LowStocksApiResponse {
 success: boolean;
 data: LowStockRow[];
 pagination: { page: number; limit: number; total: number; pages: number };
 defaultLowStockThreshold: number;
}

export interface InventorySettingsData {
 defaultLowStockThreshold?: number;
 syncSalePriceToSameVariant?: boolean;
}

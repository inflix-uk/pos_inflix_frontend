const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export interface ApiResponse<T> {
 success: boolean;
 data?: T;
 message?: string;
 pages?: number;
 total?: number;
 count?: number;
 page?: number;
}

/** Raw item from API (items array on purchase) */
export interface PurchaseItemRaw {
 _id?: string;
 category?: { _id?: string; name: string } | string;
 subCategory?: { _id: string; name: string } | string;
 grade?: string;
 brand?: string;
 brandModel?: string;
 capacity?: string;
 colour?: string;
 purchasePrice?: number;
 salePrice?: number;
 imeis?: string[];
 quantity?: number;
 isOtherItem?: boolean;
 name?: string;
 barcode?: string;
 variantValues?: { slug?: string; value?: string }[];
}

/** Raw purchase from GET /api/purchases */
export interface PurchaseRaw {
 _id: string;
 purchaseNumber: string;
 parcelNumber?: string;
 date: string;
 currency?: string;
 status?: string;
 paymentStatus?: string;
 supplier?: { _id: string; name: string } | string;
 items?: PurchaseItemRaw[];
}

export interface GetPurchasesParams {
 page?: number;
 limit?: number;
 search?: string;
 status?: string;
 paymentStatus?: string;
 sort?: string;
 /** When true, backend excludes IMEIs/serials that have been sold (for inventory/stock view) */
 excludeSold?: boolean;
 /** When true, backend returns minimal data (only items.category populated) for faster create-sales load */
 forSales?: boolean;
 /** When set with forSales, backend resolves item salePrice from ProductGroupPrice or Product.sellingPrice for this customer group */
 pricingGroupId?: string | null;
 /** Filter stock by location */
 locationId?: string | null;
}

/** Params for paginated stock view rows (server-side filtering and pagination) */
export interface GetStockViewRowsParams {
 page?: number;
 limit?: number;
 excludeSold?: boolean;
 statusFilter?: "available" | "sold" | "all";
 productType?: "all" | "serial" | "non-serial";
 search?: string;
 category?: string;
 brand?: string;
 brandModel?: string;
 capacity?: string;
 colour?: string;
 imei?: string;
 /** Filter stock by location */
 locationId?: string;
}

/** Response shape from GET /api/purchases/stock-view-rows */
export interface StockViewRowsResponse {
 success: boolean;
 data?: import("../types").StockViewRow[];
 total?: number;
 page?: number;
 pages?: number;
 filterOptions?: {
  categories: string[];
  brands: string[];
  brandModels?: string[];
  capacities: string[];
  colours: string[];
  locations?: { _id: string; name: string }[];
 };
 message?: string;
}

/** Row returned by the dedicated /api/purchases/sales-typeahead endpoint */
export interface SalesTypeaheadRow {
 rowKey: string;
 name?: string;
 barcode?: string;
 category?: string;
 categoryId?: string;
 brand?: string;
 brandModel?: string;
 grade?: string;
 capacity?: string;
 colour?: string;
 variantValues?: { slug?: string; value?: string }[];
 salePrice: number;
 purchasePrice: number;
 currency: string;
 imei: string;
 quantity: number;
 purchaseId: string;
 purchaseItemId: string;
 inventoryDate?: string;
 isSerial: boolean;
}

export interface SalesTypeaheadParams {
 q: string;
 limit?: number;
 pricingGroupId?: string | null;
 locationId?: string | null;
 includeSerial?: boolean;
 includeNonSerial?: boolean;
}

export const stockViewApi = {
 /** Server-side typeahead for /create-sales item search. Returns flat rows (one per IMEI / one per non-serial item). */
 salesTypeahead: async (
  params: SalesTypeaheadParams
 ): Promise<{ success: boolean; data: SalesTypeaheadRow[]; count: number; tookMs?: number; message?: string }> => {
  try {
   const qs = new URLSearchParams();
   qs.set("q", params.q);
   if (params.limit != null) qs.set("limit", String(params.limit));
   if (params.pricingGroupId) qs.set("pricingGroupId", params.pricingGroupId);
   if (params.locationId) qs.set("locationId", params.locationId);
   if (params.includeSerial === false) qs.set("includeSerial", "0");
   if (params.includeNonSerial === false) qs.set("includeNonSerial", "0");
   const response = await fetch(
    `${API_BASE_URL}/purchases/sales-typeahead?${qs.toString()}`,
    { method: "GET", headers: getAuthHeaders() }
   );
   const data = await response.json();
   return {
    success: !!data.success,
    data: Array.isArray(data.data) ? data.data : [],
    count: Number(data.count || 0),
    tookMs: data.tookMs,
    message: data.message,
   };
  } catch (error) {
   console.error("Error in salesTypeahead:", error);
   return { success: false, data: [], count: 0, message: "Failed to search inventory" };
  }
 },
 /** Paginated stock view rows with server-side filters (for products page speed) */
 getStockViewRows: async (
  params: GetStockViewRowsParams = {}
 ): Promise<StockViewRowsResponse> => {
  try {
   const queryParams = new URLSearchParams();
   if (params.page != null) queryParams.set("page", params.page.toString());
   if (params.limit != null) queryParams.set("limit", params.limit.toString());
   if (params.excludeSold === true) queryParams.set("excludeSold", "true");
   if (params.statusFilter) queryParams.set("statusFilter", params.statusFilter);
   if (params.productType) queryParams.set("productType", params.productType);
   if (params.search) queryParams.set("search", params.search);
   if (params.category) queryParams.set("category", params.category);
   if (params.brand) queryParams.set("brand", params.brand);
   if (params.brandModel) queryParams.set("brandModel", params.brandModel);
   if (params.capacity) queryParams.set("capacity", params.capacity);
   if (params.colour) queryParams.set("colour", params.colour);
   if (params.imei) queryParams.set("imei", params.imei);
   if (params.locationId) queryParams.set("locationId", params.locationId);

   const response = await fetch(
    `${API_BASE_URL}/purchases/stock-view-rows?${queryParams.toString()}`,
    { method: "GET", headers: getAuthHeaders() }
   );
   return await response.json();
  } catch (error) {
   console.error("Error fetching stock view rows:", error);
   return { success: false, message: "Failed to fetch stock view" };
  }
 },

 getPurchases: async (
  params: GetPurchasesParams = {}
 ): Promise<ApiResponse<PurchaseRaw[]>> => {
  try {
   const queryParams = new URLSearchParams();
   if (params.page != null) queryParams.set("page", params.page.toString());
   if (params.limit != null) queryParams.set("limit", params.limit.toString());
   if (params.search) queryParams.append("search", params.search);
   if (params.status) queryParams.append("status", params.status);
   if (params.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);
   if (params.sort) queryParams.append("sort", params.sort);
   if (params.excludeSold === true) queryParams.set("excludeSold", "true");
   if (params.forSales === true) queryParams.set("forSales", "1");
   if (params.pricingGroupId) queryParams.set("pricingGroupId", params.pricingGroupId);
   if (params.locationId) queryParams.set("locationId", params.locationId);

   const response = await fetch(
    `${API_BASE_URL}/purchases?${queryParams.toString()}`,
    {
     method: "GET",
     headers: getAuthHeaders(),
    }
   );
   const data = await response.json();
   return data;
  } catch (error) {
   console.error("Error fetching purchases for stock view:", error);
   return { success: false, message: "Failed to fetch purchases" };
  }
 },

 /** Update non-serial item quantity */
 updateItemQuantity: async (
  purchaseId: string,
  itemId: string,
  quantity: number
 ): Promise<ApiResponse<PurchaseRaw>> => {
  try {
   const response = await fetch(
    `${API_BASE_URL}/purchases/${purchaseId}/items/${itemId}`,
    {
     method: "PATCH",
     headers: getAuthHeaders(),
     body: JSON.stringify({ quantity }),
    }
   );
   return await response.json();
  } catch (error) {
   console.error("Error updating item quantity:", error);
   return { success: false, message: "Failed to update quantity" };
  }
 },

 /** Update sale price for any purchase item (serial or non-serial) */
 updateItemSalePrice: async (
  purchaseId: string,
  itemId: string,
  salePrice: number
 ): Promise<ApiResponse<PurchaseRaw>> => {
  try {
   const response = await fetch(
    `${API_BASE_URL}/purchases/${purchaseId}/items/${itemId}`,
    {
     method: "PATCH",
     headers: getAuthHeaders(),
     body: JSON.stringify({ salePrice }),
    }
   );
   return await response.json();
  } catch (error) {
   console.error("Error updating sale price:", error);
   return { success: false, message: "Failed to update sale price" };
  }
 },

 /** Delete a non-serial item from a purchase */
 deletePurchaseItem: async (
  purchaseId: string,
  itemId: string
 ): Promise<ApiResponse<PurchaseRaw>> => {
  try {
   const response = await fetch(
    `${API_BASE_URL}/purchases/${purchaseId}/items/${itemId}`,
    { method: "DELETE", headers: getAuthHeaders() }
   );
   return await response.json();
  } catch (error) {
   console.error("Error deleting purchase item:", error);
   return { success: false, message: "Failed to delete item" };
  }
 },
};

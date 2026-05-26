/** Line item for a saved sale */
export interface SaleItemPayload {
 sku: string;
 name: string;
 price: number;
 quantity: number;
 unit?: string;
 serialNumbers?: string[];
 /** Per-serial colour map: { [serial]: "BLUE" } — preserved across save/load so multi-colour serial lines display correctly. */
 serialColours?: Record<string, string>;
 grade?: string;
 brand?: string;
 colour?: string;
 brandModel?: string;
 capacity?: string;
 /** From find-in-stock-serials for fast Create Order (backend uses when valid) */
 unit_cost_at_sale?: number;
 purchaseId?: string;
 purchaseItemId?: string;
 cost_missing?: boolean;
}

/** Payment breakdown (amount per method) */
export interface PaymentBreakdown {
 cash?: number;
 card?: number;
 credit?: number;
 bank?: number;
 split?: number;
}

/** Payload to create a retail sale */
export interface CreateRetailSalePayload {
 type: "retail";
 items: SaleItemPayload[];
 subtotal: number;
 tax: number;
 total: number;
 paymentMethod: "cash" | "card" | "credit" | "bank";
 locationId?: string;
 /** Optional user-supplied invoice number. Empty → backend auto-generates INV-XXXXXX. */
 reference?: string;
 /** Idempotency key for one checkout attempt — same id on retry returns the original sale instead of failing with "already sold". */
 clientRequestId?: string;
}

/** Payload to create a wholesale order/sale */
export interface CreateWholesaleSalePayload {
 type: "wholesale";
 items: SaleItemPayload[];
 subtotal: number;
 tax: number;
 total: number;
 discount: number;
 discountType?: "flat" | "percent";
 discountValue?: number;
 previousBalance: number;
 amountDue: number;
 customerId?: string;
 customerName?: string;
 payments: PaymentBreakdown;
 bankAccount?: string;
 locationId?: string;
 note?: string;
 /** Optional user-supplied invoice number. Empty → backend auto-generates INV-XXXXXX. */
 reference?: string;
 /** Idempotency key for one checkout attempt — same id on retry returns the original sale instead of failing with "already sold". */
 clientRequestId?: string;
}

export type CreateSalePayload = CreateRetailSalePayload | CreateWholesaleSalePayload;

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

/** App-wide cache for serial/IMEI lookups (all statuses). in_stock TTL 3 min; others 45 s. Max 1000. */
const SERIAL_CACHE_TTL_IN_STOCK_MS = 3 * 60 * 1000;
const SERIAL_CACHE_TTL_OTHER_MS = 45 * 1000;
const SERIAL_CACHE_MAX = 1000;

export type SerialLookupResult = {
 status: string;
 product?: { sku: string; name: string; price: number; category: string; brand: string; serial: string; grade?: string; colour?: string; brandModel?: string; capacity?: string; purchaseDate?: string | null };
 soldInfo?: { reference?: string; customerName?: string };
};

const serialLookupCache = new Map<string, { at: number; ttlMs: number; result: SerialLookupResult }>();

function getCachedSerialResult(serial: string): SerialLookupResult | null {
 if (typeof window === "undefined") return null;
 const key = serial.trim();
 const entry = serialLookupCache.get(key);
 if (!entry) return null;
 if (Date.now() - entry.at > entry.ttlMs) {
  serialLookupCache.delete(key);
  return null;
 }
 return entry.result;
}

function setCachedSerialResult(serial: string, result: SerialLookupResult): void {
 const key = serial.trim();
 const ttlMs = result.status === "in_stock" ? SERIAL_CACHE_TTL_IN_STOCK_MS : SERIAL_CACHE_TTL_OTHER_MS;
 if (serialLookupCache.size >= SERIAL_CACHE_MAX) {
  const oldest = [...serialLookupCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
  if (oldest) serialLookupCache.delete(oldest[0]);
 }
 serialLookupCache.set(key, { at: Date.now(), ttlMs, result });
}

/** Prime cache from batch results (call after getFindInStockSerialsBatch). Stores all statuses.
 * Does not cache in_stock results that have a product (and thus a price), so batch lookups
 * made with pricingGroupId never store group prices; single lookup remains the only path that caches price (and only when !pricingGroupId). */
export function primeSerialCache(
 results: Array<{
  serial: string;
  status: string;
  product?: { sku: string; name: string; price: number; category: string; brand: string; serial: string; grade?: string; colour?: string; brandModel?: string; capacity?: string; purchaseDate?: string | null; unitCost?: number | null; purchaseId?: string; purchaseItemId?: string };
  soldInfo?: { reference?: string; customerName?: string };
 }>
): void {
 results.forEach((r) => {
  const hasPrice = r.status === "in_stock" && r.product;
  if (hasPrice) return;
  setCachedSerialResult(r.serial, { status: r.status, product: r.product, soldInfo: r.soldInfo });
 });
}

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
};

export interface CreateSaleResponse {
 success: boolean;
 data?: { _id: string; reference?: string; [key: string]: unknown };
 message?: string;
}

/** Sale item as stored/returned by API */
export interface SaleItemRecord {
 _id?: string;
 sku: string;
 name: string;
 price: number;
 quantity: number;
 unit?: string;
 serialNumbers?: string[];
 /** Per-serial colour map (Mongoose Map → plain object on JSON output). */
 serialColours?: Record<string, string>;
 /** Per-IMEI SID resolved from the source Purchase item; only present from getSaleById. */
 serialIds?: Record<string, string>;
 grade?: string;
 brand?: string;
 colour?: string;
 brandModel?: string;
 capacity?: string;
}

/** Customer address (from populated customerId) */
export interface SaleCustomerAddress {
 street?: string;
 addressLine2?: string;
 city?: string;
 state?: string;
 zipCode?: string;
 country?: string;
}

/** Populated customer on sale (for invoice address) */
export interface SaleCustomer {
 _id?: string;
 name?: string;
 phone?: string;
 email?: string;
 address?: SaleCustomerAddress;
}

/** Populated location on sale (for invoice/receipt header and display) */
export interface SaleLocation {
 _id: string;
 name: string;
 address?: string;
 city?: string;
 country?: string;
 phone?: string;
 email?: string;
}

/** Sale as returned from GET /api/sales or GET /api/sales/:id */
export interface SaleRecord {
 _id: string;
 reference: string;
 type: "retail" | "wholesale" | "repair";
 items?: SaleItemRecord[];
 total: number;
 subtotal: number;
 tax: number;
 discount: number;
 discountType?: "flat" | "percent";
 discountValue?: number;
 customerName?: string;
 customerId?: string | SaleCustomer;
 /** Populated when from getSaleById: location details for invoice/receipt */
 locationId?: string | SaleLocation;
 previousBalance?: number;
 amountDue?: number;
 paymentMethod?: string;
 payments?: PaymentBreakdown;
 createdAt: string;
 updatedAt: string;
 /** True when at least one sales return is linked to this invoice */
 hasReturn?: boolean;
 note?: string;
}

/** Format address object to multi-line string for invoice (accepts any address-like object) */
export function formatAddressForInvoice(
 addr: { street?: string; addressLine2?: string; city?: string; state?: string; zipCode?: string; country?: string } | null | undefined
): string {
 if (!addr) return "";
 const parts = [
  addr.street,
  addr.addressLine2,
  [addr.city, addr.state].filter(Boolean).join(", ").trim(),
  addr.zipCode,
  addr.country,
 ].filter(Boolean);
 return parts.join("\n");
}

/** Format populated customer address for invoice Bill To section */
export function formatCustomerAddressForInvoice(sale: SaleRecord): string {
 const customer = typeof sale.customerId === "object" && sale.customerId ? sale.customerId : null;
 return formatAddressForInvoice(customer?.address);
}

/** Payload to update a sale (items + totals) */
export interface UpdateSalePayload {
 items: SaleItemPayload[];
 subtotal: number;
 tax: number;
 total: number;
 discount?: number;
 discountType?: "flat" | "percent";
 discountValue?: number;
 amountDue?: number;
 payments?: PaymentBreakdown;
 note?: string;
 customerId?: string | null;
 customerName?: string;
}

export interface GetSalesResponse {
 success: boolean;
 data: SaleRecord[];
 total: number;
 page: number;
 pages: number;
 count: number;
}

const SALES_STORAGE_KEY = "pos_sales";

function saveSaleToStorage(payload: CreateSalePayload): void {
 try {
  const raw = typeof window !== "undefined" ? localStorage.getItem(SALES_STORAGE_KEY) : null;
  const list: (CreateSalePayload & { id: string; createdAt: string })[] = raw ? JSON.parse(raw) : [];
  list.push({
   ...payload,
   id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
   createdAt: new Date().toISOString(),
  });
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(list));
 } catch (e) {
  console.warn("Could not save sale to localStorage", e);
 }
}

/** Sold serial with customer info (for "Sold to [Customer Name]" in inventory) */
export interface SoldSerialInfo {
 serialNumber: string;
 customerName: string;
 saleReference: string;
 saleId?: string;
 soldAt?: string;
}

export const salesApi = {
 getSoldSerials: async (): Promise<{ success: boolean; data: SoldSerialInfo[] }> => {
  const response = await fetch(`${API_BASE_URL}/sales/sold-serials`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch sold serials");
  }
  return response.json();
 },

 getSaleById: async (id: string): Promise<{ success: boolean; data: SaleRecord }> => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch sale");
  }
  return response.json();
 },

 updateSale: async (id: string, payload: UpdateSalePayload): Promise<CreateSaleResponse> => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
   throw new Error(data?.message || "Failed to update sale");
  }
  return data;
 },

 /** Record a follow-up partial payment against an existing sale (e.g. customer paid 50% on POS, balance later). */
 takePayment: async (
  id: string,
  payload: { amount: number; paymentMethod: "cash" | "card" | "credit" | "bank"; note?: string }
 ): Promise<{
  success: boolean;
  message?: string;
  data?: {
   saleId: string;
   reference: string;
   applied: number;
   amountDue: number;
   payments: { cash?: number; card?: number; credit?: number; bank?: number };
   paymentHistory: Array<{ _id: string; amount: number; method: string; note?: string; receivedAt: string }>;
  };
 }> => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}/take-payment`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { message?: string }).message || "Failed to record payment");
  return data;
 },

 deleteSale: async (id: string, voidReason?: string): Promise<{ success: boolean; message: string; data: { _id: string; reference: string } }> => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
   body: JSON.stringify(voidReason != null ? { voidReason: String(voidReason).trim() || undefined } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
   throw new Error(data?.message || "Failed to delete sale");
  }
  return data;
 },

 hardDeleteSale: async (id: string, confirmInvoiceRef: string): Promise<{ success: boolean; message: string; data: { _id: string; reference: string } }> => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}/hard`, {
   method: "DELETE",
   headers: getAuthHeaders(),
   body: JSON.stringify({ confirmInvoiceRef: String(confirmInvoiceRef).trim() }),
  });
  const data = await response.json();
  if (!response.ok) {
   throw new Error(data?.message || "Failed to hard delete sale");
  }
  return data;
 },

 getSales: async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  from?: string;
  to?: string;
  locationId?: string;
  paymentMethod?: string;
  minTotal?: string | number;
  maxTotal?: string | number;
  hasReturn?: "yes" | "no";
  order?: "asc" | "desc";
  includeItems?: boolean;
 }): Promise<GetSalesResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set("page", String(params.page));
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.type) searchParams.set("type", params.type);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.locationId) searchParams.set("locationId", params.locationId);
  if (params?.paymentMethod) searchParams.set("paymentMethod", params.paymentMethod);
  if (params?.minTotal != null && String(params.minTotal).trim() !== "") {
   searchParams.set("minTotal", String(params.minTotal));
  }
  if (params?.maxTotal != null && String(params.maxTotal).trim() !== "") {
   searchParams.set("maxTotal", String(params.maxTotal));
  }
  if (params?.hasReturn === "yes" || params?.hasReturn === "no") {
   searchParams.set("hasReturn", params.hasReturn);
  }
  if (params?.order === "asc" || params?.order === "desc") {
   searchParams.set("order", params.order);
  }
  if (params?.includeItems) searchParams.set("includeItems", "true");
  const response = await fetch(`${API_BASE_URL}/sales?${searchParams}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch sales");
  }
  return response.json();
 },

 /** Check whether a user-typed invoice number is already used (tenant-scoped). */
 checkReference: async (
  reference: string,
  signal?: AbortSignal
 ): Promise<{ success: boolean; data: { reference: string; exists: boolean; valid: boolean; reason?: string } }> => {
  const q = encodeURIComponent(reference || "");
  const response = await fetch(`${API_BASE_URL}/sales/check-reference?reference=${q}`, {
   method: "GET",
   headers: getAuthHeaders(),
   signal,
  });
  if (!response.ok) {
   return { success: false, data: { reference, exists: false, valid: false, reason: "request_failed" } };
  }
  return response.json();
 },

 createSale: async (payload: CreateSalePayload): Promise<CreateSaleResponse> => {
  try {
   const response = await fetch(`${API_BASE_URL}/sales`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
   });
   const data = await response.json();
   if (!response.ok) {
    if (response.status === 409 || data?.code === "REFERENCE_TAKEN") {
     return { success: false, message: data?.message || "Invoice number is already in use." };
    }
    saveSaleToStorage(payload);
    if (response.status === 404 || response.status >= 502) {
     return { success: true, data: { _id: "local", reference: "Saved locally" }, message: "Server unavailable — order saved locally." };
    }
    return { success: false, message: data?.message || "Failed to save sale" };
   }
   return data;
  } catch (error) {
   console.error("Error saving sale:", error);
   saveSaleToStorage(payload);
   return { success: true, data: { _id: "local", reference: "Saved locally (offline)" } };
  }
 },

 /** Return-eligible lines for a sale (qty purchased, already returned, returnable) */
 getReturnLines: async (saleId: string): Promise<{
  success: boolean;
  data: {
   saleId: string;
   reference: string;
   customerName?: string;
   lines: Array<{
    lineIndex: number;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    qtyAlreadyReturned: number;
    qtyReturnable: number;
    serialNumbers: string[];
    returnableSerials: string[];
   }>;
  };
 }> => {
  const response = await fetch(`${API_BASE_URL}/sales/${saleId}/return-lines`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Failed to fetch return lines");
  }
  return response.json();
 },

 /** Find sale and line by serial (for scan-to-return) */
 getFindBySerial: async (serial: string): Promise<{
  success: boolean;
  data: {
   saleId: string;
   reference: string;
   customerName?: string;
   lineIndex: number;
   line: { sku: string; name: string; price: number; quantity: number; serialNumbers: string[] };
   serial: string;
  };
 }> => {
  const response = await fetch(`${API_BASE_URL}/sales/find-by-serial/${encodeURIComponent(serial)}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Serial not sold / already returned / not found");
  }
  return response.json();
 },

 /** Find in-stock product by serial/IMEI (for POS add-by-scan). Uses app-wide cache (all statuses) for instant repeat lookups. Optional pricingGroupId for customer group price. */
 getFindInStockSerial: async (serial: string, pricingGroupId?: string | null): Promise<{
  success: boolean;
  data: {
   sku: string;
   name: string;
   price: number;
   category: string;
   brand: string;
   serial: string;
   grade?: string;
   colour?: string;
   brandModel?: string;
   capacity?: string;
   purchaseDate?: string | null;
  };
 }> => {
  const cached = !pricingGroupId ? getCachedSerialResult(serial) : null;
  if (cached) {
   if (cached.status === "in_stock" && cached.product) return { success: true, data: cached.product };
   const msg =
    cached.status === "already_sold"
     ? cached.soldInfo?.reference
      ? `Already sold (${cached.soldInfo.reference})`
      : "Already sold"
     : cached.status === "returned_to_supplier"
      ? "Returned to supplier"
      : "Serial not found in inventory";
   // Preserve status/soldInfo on cached throws so callers can branch on them
   // (without this, repeat scans of a sold serial lose the discriminator and
   // the UI falls through to a SKU/barcode lookup that may wrongly add to cart).
   const e = new Error(msg) as Error & {
    status?: string;
    soldInfo?: { reference?: string; customerName?: string } | null;
   };
   e.status = cached.status;
   e.soldInfo = cached.soldInfo ?? null;
   throw e;
  }
  const url = new URL(`${API_BASE_URL}/purchases/find-in-stock-serial/${encodeURIComponent(serial)}`);
  if (pricingGroupId) url.searchParams.set("pricingGroupId", pricingGroupId);
  const response = await fetch(
   url.toString(),
   { method: "GET", headers: getAuthHeaders() }
  );
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   const e = new Error(err.message || "Serial not found in inventory") as Error & {
    status?: string;
    soldInfo?: { reference?: string; customerName?: string } | null;
   };
   e.status = err.status;
   e.soldInfo = err.soldInfo ?? null;
   if (err.status === "already_sold" && !pricingGroupId) {
    setCachedSerialResult(serial, { status: "already_sold", soldInfo: err.soldInfo ?? undefined });
   }
   throw e;
  }
  const json = await response.json();
  // Only cache when lookup was done without pricing group, so cache never holds group prices (non-grouped customer must get default price).
  if (json.success && json.data && !pricingGroupId) setCachedSerialResult(serial, { status: "in_stock", product: json.data });
  return json;
 },

 /** Clear serial lookup cache (e.g. when switching to non-grouped customer so no stale group price is used). */
 clearSerialCache: (): void => {
  serialLookupCache.clear();
 },

 /** Batch find in-stock products by serial/IMEI (one request for many serials). Use for bulk add. Optional pricingGroupId for customer group price. */
 getFindInStockSerialsBatch: async (serials: string[], pricingGroupId?: string | null): Promise<{
  success: boolean;
  data: {
   results: Array<{
    serial: string;
    status: "in_stock" | "already_sold" | "returned_to_supplier" | "not_found";
    product?: {
     sku: string;
     name: string;
     price: number;
     category: string;
     brand: string;
     serial: string;
     grade?: string;
     colour?: string;
     brandModel?: string;
     capacity?: string;
     purchaseDate?: string | null;
     unitCost?: number | null;
     purchaseId?: string;
     purchaseItemId?: string;
    };
    soldInfo?: { reference?: string; customerName?: string };
   }>;
  };
 }> => {
  const body: { serials: string[]; pricingGroupId?: string } = { serials };
  if (pricingGroupId) body.pricingGroupId = pricingGroupId;
  const response = await fetch(`${API_BASE_URL}/purchases/find-in-stock-serials`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(body),
  });
  if (!response.ok) {
   const err = await response.json().catch(() => ({}));
   throw new Error(err.message || "Batch lookup failed");
  }
  return response.json();
 },

 /** Look up product by SKU or barcode from the Product table (for POS when not in inventory list). Optional pricingGroupId for customer group price. */
 getProductBySkuOrBarcode: async (skuOrBarcode: string, pricingGroupId?: string | null): Promise<{
  success: boolean;
  data?: {
   _id: string;
   sku: string;
   name: string;
   barcode?: string;
   sellingPrice: number;
   quantity?: number;
   unit?: string;
   category?: { _id: string; name: string } | string;
  };
  message?: string;
 }> => {
  const value = (skuOrBarcode || "").trim();
  if (!value) return { success: false };
  // Fast path: exact barcode endpoint (indexed lookup). For scanned barcodes/serials this is
  // the only call we make — no regex fallback round-trip.
  try {
   const barcodeUrl = new URL(`${API_BASE_URL}/products/barcode/${encodeURIComponent(value)}`);
   if (pricingGroupId) barcodeUrl.searchParams.set("pricingGroupId", pricingGroupId);
   const byBarcode = await fetch(
    barcodeUrl.toString(),
    { method: "GET", headers: getAuthHeaders() }
   );
   if (byBarcode.ok) {
    const json = await byBarcode.json();
    if (json.success && json.data) return json;
   }
  } catch {
   // ignore
  }
  // Fallback regex search is expensive — only run it for short values that look like a manually
  // typed SKU. Long numeric/alphanumeric values are barcodes/serials; if the indexed lookup
  // missed, the regex search won't find them either.
  const isLikelyBarcodeOrSerial = value.length >= 8 && /^[A-Za-z0-9-]+$/.test(value);
  if (isLikelyBarcodeOrSerial) return { success: false };
  try {
   const bySearch = await fetch(
    `${API_BASE_URL}/products?search=${encodeURIComponent(value)}&limit=1`,
    { method: "GET", headers: getAuthHeaders() }
   );
   if (!bySearch.ok) return { success: false };
   const json = await bySearch.json();
   if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
    const product = json.data[0];
    const match =
     (product.sku || "").trim().toLowerCase() === value.toLowerCase() ||
     (product.barcode || "").trim().toLowerCase() === value.toLowerCase();
    if (match) {
     return { success: true, data: product };
    }
   }
  } catch {
   // ignore
  }
  return { success: false };
 },
};

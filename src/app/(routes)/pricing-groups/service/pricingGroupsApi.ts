const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export interface PricingGroupRecord {
 _id: string;
 name: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface GroupSummary {
 _id: string;
 name: string;
 customerCount: number;
 productPriceCount: number;
}

export const pricingGroupsApi = {
 getList: async (withCounts = false): Promise<{ success: boolean; data: (PricingGroupRecord & { customerCount?: number; productPriceCount?: number })[] }> => {
  const url = withCounts ? `${API_URL}/api/pricing-groups?counts=1` : `${API_URL}/api/pricing-groups`;
  const res = await fetch(url, { method: "GET", headers: getAuthHeaders() });
  return res.json();
 },

 getById: async (id: string): Promise<{ success: boolean; data: PricingGroupRecord }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups/${id}`, { method: "GET", headers: getAuthHeaders() });
  return res.json();
 },

 create: async (name: string): Promise<{ success: boolean; data: PricingGroupRecord; message?: string }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ name: name.trim() }),
  });
  return res.json();
 },

 update: async (id: string, name: string): Promise<{ success: boolean; data: PricingGroupRecord; message?: string }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify({ name: name.trim() }),
  });
  return res.json();
 },

 delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  return res.json();
 },

 getProductPricesForGroup: async (
  groupId: string
 ): Promise<{ success: boolean; data: Array<{ productId: string; price: number }> }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups/${groupId}/product-prices`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  return res.json();
 },

 /** Variant-level prices for Rate List (variantKey -> price). Use for Pricing Groups -> Rate List. */
 getVariantPricesForGroup: async (
  groupId: string
 ): Promise<{ success: boolean; data: Record<string, number> }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups/${groupId}/variant-prices`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  return res.json();
 },

 /** Set or remove one variant price (price null = remove). */
 setVariantGroupPrice: async (
  groupId: string,
  variantKey: string,
  price: number | null
 ): Promise<{ success: boolean; message?: string }> => {
  const res = await fetch(`${API_URL}/api/pricing-groups/${groupId}/variant-prices`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify({ variantKey, price }),
  });
  return res.json();
 },
};

/** Fetch products for rate list (uses existing GET /api/products). */
export async function fetchProducts(params: { page?: number; limit?: number; search?: string }): Promise<{
 success: boolean;
 data: Array<{ _id: string; name: string; sku?: string; barcode?: string; sellingPrice?: number; category?: { name: string } }>;
 total?: number;
 page?: number;
 pages?: number;
}> {
 const q = new URLSearchParams();
 if (params.page != null) q.set("page", String(params.page));
 if (params.limit != null) q.set("limit", String(params.limit));
 if (params.search) q.set("search", params.search);
 const res = await fetch(`${API_URL}/api/products?${q}`, { method: "GET", headers: getAuthHeaders() });
 return res.json();
}

/** Save or remove group price for one product. Pass price as number to set, null to remove. */
export async function setProductGroupPrice(
 productId: string,
 pricingGroupId: string,
 price: number | null
): Promise<{ success: boolean }> {
 const res = await fetch(`${API_URL}/api/products/${productId}/group-prices`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify({ groupPrices: [{ pricingGroupId, price }] }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.message || "Failed to save");
 return data;
}

/** Batch lookup product IDs by barcodes (for rate list variant -> ProductGroupPrice mapping). */
export async function getProductsByBarcodes(barcodes: string[]): Promise<{
 success: boolean;
 data: Array<{ _id: string; barcode: string }>;
}> {
 if (barcodes.length === 0) return { success: true, data: [] };
 const q = new URLSearchParams();
 q.set("barcodes", barcodes.join(","));
 const res = await fetch(`${API_URL}/api/products/by-barcodes?${q}`, {
  method: "GET",
  headers: getAuthHeaders(),
 });
 return res.json();
}

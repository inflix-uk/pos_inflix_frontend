import { CreateProductPayload, ApiResponse, SelectOption } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const productApi = {
 /** Add a parcel to inventory (same as purchases add). Used when adding single item as parcel. */
 addPurchase: async (payload: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_URL}/api/purchases`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success) {
   throw new Error(result.message || "Failed to add to inventory");
  }
  return result;
 },

 // Create a new product
 create: async (data: CreateProductPayload): Promise<ApiResponse<unknown>> => {
  try {
   const response = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create product");
   }
   return response.json();
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to create product");
  }
 },

 // Fetch categories for dropdown
 getCategories: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/categories`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((cat: { _id: string; name: string }) => ({
    value: cat._id,
    label: cat.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch sub-categories for dropdown
 getSubCategories: async (categoryId?: string): Promise<SelectOption[]> => {
  try {
   const url = categoryId
    ? `${API_URL}/api/subcategories?category=${categoryId}`
    : `${API_URL}/api/subcategories`;
   const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((sub: { _id: string; name: string }) => ({
    value: sub._id,
    label: sub.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch brands for dropdown
 getBrands: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/brands/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((brand: { _id: string; name: string }) => ({
    value: brand._id,
    label: brand.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch units for dropdown
 getUnits: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/units`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((unit: { _id: string; name: string }) => ({
    value: unit._id,
    label: unit.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch stores for dropdown
 getStores: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/stores/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((store: { _id: string; name: string }) => ({
    value: store._id,
    label: store.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch warehouses for dropdown
 getWarehouses: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/warehouses/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((warehouse: { _id: string; name: string }) => ({
    value: warehouse._id,
    label: warehouse.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Fetch suppliers for single-product parcel form (legacy)
 getSuppliers: async (): Promise<{ _id: string; name: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/suppliers?limit=1000&isActive=true`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.success && Array.isArray(data.data)
    ? data.data.map((s: { _id: string; name: string }) => ({ _id: s._id, name: s.name }))
    : [];
  } catch {
   return [];
  }
 },

 /** Same account list as /customers: suppliers + customers (suppliers can also be customers). _id is "supplier:xxx" or "customer:xxx". Label includes contact name when present so users can search by either. */
 getAccounts: async (): Promise<{ _id: string; name: string }[]> => {
  try {
   const [supRes, custRes] = await Promise.all([
    fetch(`${API_URL}/api/suppliers?limit=1000&isActive=true`, { headers: getAuthHeaders() }).then((r) => r.json()),
    fetch(`${API_URL}/api/customers?limit=1000&isActive=true`, { headers: getAuthHeaders() }).then((r) => r.json()),
   ]);
   const options: { _id: string; name: string }[] = [];
   const join = (company?: string, contact?: string) => {
    const c = (company || "").trim();
    const p = (contact || "").trim();
    if (!c && !p) return "";
    if (!p || p === c) return c || p;
    return `${c} · ${p}`;
   };
   if (supRes.success && Array.isArray(supRes.data)) {
    supRes.data.forEach((s: { _id: string; name: string; contactPerson?: string }) =>
     options.push({ _id: `supplier:${s._id}`, name: join(s.name, s.contactPerson) })
    );
   }
   if (custRes.success && Array.isArray(custRes.data)) {
    custRes.data.forEach((c: { _id: string; name: string; contactName?: string }) =>
     options.push({ _id: `customer:${c._id}`, name: join(c.name, c.contactName) })
    );
   }
   return options;
  } catch {
   return [];
  }
 },

 // Fetch locations (Send To) for single-product / parcel-style form
 getLocations: async (): Promise<{ _id: string; name: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/locations?limit=1000&isActive=true`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.success && Array.isArray(data.data)
    ? data.data.map((l: { _id: string; name: string }) => ({ _id: l._id, name: l.name }))
    : [];
  } catch {
   return [];
  }
 },

 // Fetch active tax categories for single-product form
 getActiveTaxes: async (): Promise<{ _id: string; name: string; rate: number; type: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/taxes/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.success && Array.isArray(data.data)
    ? data.data.map((t: { _id: string; name: string; rate: number; type: string }) => ({ _id: t._id, name: t.name, rate: t.rate, type: t.type }))
    : [];
  } catch {
   return [];
  }
 },

 // Fetch categories filtered by itemType (serial / non-serial) for single-product form
 getCategoriesByItemType: async (itemType: "serial" | "non-serial"): Promise<{ _id: string; name: string }[]> => {
  try {
   const response = await fetch(`${API_URL}/api/categories?limit=1000&isActive=true&itemType=${itemType}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   if (!data.success || !Array.isArray(data.data)) return [];
   return (data.data as { _id: string; name: string }[]).map((c) => ({ _id: c._id, name: c.name }));
  } catch {
   return [];
  }
 },

 // Fetch variant attributes for a category (single-product serial form)
 getCategoryVariantAttributes: async (categoryId: string): Promise<import("../types").CategoryVariantAttribute[]> => {
  if (!categoryId) return [];
  try {
   const response = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   if (!data.success || !Array.isArray(data.data)) return [];
   // Preserve API order = Edit Category "Display order (top to bottom)"
   const normalize = (a: { _id: string; name?: string; slug?: string; values?: { _id: string; name: string; slug?: string; models?: { _id: string; name: string; slug?: string; children?: { _id: string; name: string }[] }[] }[] }): import("../types").CategoryVariantAttribute => ({
    _id: a._id,
    name: a.name || "",
    slug: (a.slug || "").toLowerCase().trim(),
    values: (a.values || []).filter((v: { _id: string; name: string; slug?: string; models?: { _id: string; name: string; slug?: string; children?: { _id: string; name: string }[] }[]; isActive?: boolean }) => v.isActive !== false).map((v) => ({
     _id: v._id,
     name: v.name,
     slug: v.slug,
     models: (v.models || []).map((m: { _id: string; name: string; slug?: string; children?: { _id: string; name: string }[] }) => ({ _id: m._id, name: m.name, slug: m.slug, children: m.children || [] })),
    })),
   });
   return data.data.map(normalize);
  } catch {
   return [];
  }
 },

 /** Add a variant value at path (for "create new" in single-product serial form). Returns new _id or null. */
 addValueAtPath: async (
  categoryId: string,
  firstAttributeId: string,
  parentPath: string[],
  name: string
 ): Promise<string | null> => {
  if (!categoryId || !name.trim()) return null;
  try {
   const response = await fetch(
    `${API_URL}/api/categories/${categoryId}/variant-attributes/${firstAttributeId}/values/add-at-path`,
    {
     method: "POST",
     headers: getAuthHeaders(),
     body: JSON.stringify({ parentPath, name: name.trim() }),
    }
   );
   const result = await response.json();
   if (!result.success || !result.data) return null;
   const data = result.data as { _id?: string };
   return data._id != null ? String(data._id) : null;
  } catch {
   return null;
  }
 },

 // Fetch warranties for dropdown
 getWarranties: async (): Promise<SelectOption[]> => {
  try {
   const response = await fetch(`${API_URL}/api/warranties/active`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) return [];
   const data = await response.json();
   return data.data?.map((warranty: { _id: string; name: string }) => ({
    value: warranty._id,
    label: warranty.name,
   })) || [];
  } catch {
   return [];
  }
 },

 // Generate SKU
 generateSku: async (): Promise<string> => {
  try {
   const response = await fetch(`${API_URL}/api/products/generate-sku`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) {
    return `SKU${Date.now().toString().slice(-6)}`;
   }
   const data = await response.json();
   return data.sku || `SKU${Date.now().toString().slice(-6)}`;
  } catch {
   return `SKU${Date.now().toString().slice(-6)}`;
  }
 },

 // Generate Barcode
 generateBarcode: async (): Promise<string> => {
  try {
   const response = await fetch(`${API_URL}/api/products/generate-barcode`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   if (!response.ok) {
    return Date.now().toString().slice(-12);
   }
   const data = await response.json();
   return data.barcode || Date.now().toString().slice(-12);
  } catch {
   return Date.now().toString().slice(-12);
  }
 },

 // Create Store
 createStore: async (data: {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/stores`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create store");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Warehouse
 createWarehouse: async (data: {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/warehouses`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create warehouse");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Category
 createCategory: async (data: {
  name: string;
  slug: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/categories`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create category");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Sub-Category
 createSubCategory: async (data: {
  name: string;
  slug: string;
  category: string;
  code: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/subcategories`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create sub-category");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Unit
 createUnit: async (data: {
  name: string;
  shortName: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/units`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create unit");
  }
  const result = await response.json();
  return result.data;
 },

 // Create Brand
 createBrand: async (data: {
  name: string;
  slug: string;
 }): Promise<{ _id: string; name: string }> => {
  const response = await fetch(`${API_URL}/api/brands`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify({ ...data, isActive: true }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({}));
   throw new Error(error.message || "Failed to create brand");
  }
  const result = await response.json();
  return result.data;
 },

 // Upload single image
 uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
  try {
   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
   const formData = new FormData();
   formData.append("image", file);

   const response = await fetch(`${API_URL}/api/upload/image`, {
    method: "POST",
    headers: {
     Authorization: `Bearer ${token}`,
    },
    body: formData,
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload image");
   }

   const data = await response.json();
   return {
    url: `${API_URL}${data.data.url}`,
    filename: data.data.filename,
   };
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to upload image");
  }
 },

 // Upload multiple images
 uploadImages: async (files: File[]): Promise<{ url: string; filename: string }[]> => {
  try {
   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
   const formData = new FormData();
   files.forEach((file) => {
    formData.append("images", file);
   });

   const response = await fetch(`${API_URL}/api/upload/images`, {
    method: "POST",
    headers: {
     Authorization: `Bearer ${token}`,
    },
    body: formData,
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload images");
   }

   const data = await response.json();
   return data.data.map((img: { url: string; filename: string }) => ({
    url: `${API_URL}${img.url}`,
    filename: img.filename,
   }));
  } catch (error) {
   throw error instanceof Error ? error : new Error("Failed to upload images");
  }
 },
};

export default productApi;

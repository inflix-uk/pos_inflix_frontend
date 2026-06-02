"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ParcelData, QuantityData, ItemData, ItemEntry, Currency, ItemMode, OtherItemData, OtherItemEntry, CategoryVariantAttribute } from "../../../add/types";
import { categoryApi } from "@/app/(routes)/inventory/category/service/categoryApi";
import { parseMultiIMEIs } from "@/app/(routes)/purchases/add/utils/parseMultiIMEIs";
import { formatSupplierDisplay } from "@/lib/formatSupplierDisplay";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const useEditPurchase = () => {
 const router = useRouter();
 const params = useParams();
 const purchaseId = params.id as string;

 const [detailsSaved, setDetailsSaved] = useState(false);
 const [isLoadingData, setIsLoadingData] = useState(true);
 const [loadError, setLoadError] = useState("");

 const [parcelData, setParcelData] = useState<ParcelData>({
  date: "",
  account: "",
  parcelNumber: "",
  note: "",
  currency: "GBP",
 });

 const [quantityData, setQuantityData] = useState<QuantityData>({
  date: "",
  imeiQuantity: "",
  otherQuantity: "",
  note: "",
 });

 const [itemData, setItemData] = useState<ItemData>({
  sendTo: "",
  taxCategory: "",
  type: "",
  make: "",
  grade: "",
  brand: "",
  brandModel: "",
  capacity: "",
  colour: "",
  purchasePrice: "",
  salePrice: "",
  multiIMEIs: "",
  variantValues: {},
 });

 const [itemMode, setItemMode] = useState<ItemMode>("imei");

 const [otherItemData, setOtherItemData] = useState<OtherItemData>({
  sendTo: "",
  taxCategory: "",
  type: "",
  make: "",
  grade: "",
  brand: "",
  brandModel: "",
  capacity: "",
  colour: "",
  purchasePrice: "",
  salePrice: "",
  quantity: "0",
  name: "",
  barcode: "",
  variantValues: {},
 });

 const [savedOtherItems, setSavedOtherItems] = useState<OtherItemEntry[]>([]);

 // Track which saved entry is currently loaded into the form for editing. While set, the entry
 // remains visible in the saved list (with an "open" indicator) and its serial/quantity counts
 // are excluded from totals so they aren't double-counted with the form's live serials.
 const [editingItemId, setEditingItemId] = useState<string | null>(null);
 const [editingOtherItemId, setEditingOtherItemId] = useState<string | null>(null);

 const [status, setStatus] = useState<"Received" | "Pending" | "Ordered">("Received");
 const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid" | "Partial">("Unpaid");
 const [paid, setPaid] = useState<string>("0");

 const currencies: Currency[] = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
 ];

 const buildSearchText = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).map((s) => String(s).toLowerCase()).join(" ");
 const [suppliers, setSuppliers] = useState<{ _id: string; name: string; email?: string; phone?: string; contactPerson?: string }[]>([]);
 const [customers, setCustomers] = useState<{ _id: string; name: string; email?: string; phone?: string; contactName?: string }[]>([]);
 const [sendToOptions, setSendToOptions] = useState<{ _id: string; name: string }[]>([]);
 const [taxCategories, setTaxCategories] = useState<{ _id: string; name: string; rate: number; type: string }[]>([]);
 const [types, setTypes] = useState<{ _id: string; name: string }[]>([]);
 const [typesForNonSerial, setTypesForNonSerial] = useState<{ _id: string; name: string }[]>([]);
 const [makes, setMakes] = useState<{ _id: string; name: string }[]>([]);
 const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);
 const [brands, setBrands] = useState<{ _id: string; name: string }[]>([]);
 const [brandModels, setBrandModels] = useState<{ _id: string; name: string }[]>([]);
 const [capacities, setCapacities] = useState<{ _id: string; name: string }[]>([]);
 const [colours, setColours] = useState<{ _id: string; name: string }[]>([]);
 const [brandsRaw, setBrandsRaw] = useState<{ _id: string; name: string; models: { _id: string; name: string }[] }[]>([]);

 const [categoryVariantAttributesImei, setCategoryVariantAttributesImei] = useState<CategoryVariantAttribute[]>([]);
 const [categoryVariantAttributesOther, setCategoryVariantAttributesOther] = useState<CategoryVariantAttribute[]>([]);
 const attributesByCategoryIdRef = useRef<Record<string, CategoryVariantAttribute[]>>({});
 const categoryIdImeiRef = useRef<string>("");
 const categoryIdOtherRef = useRef<string>("");

 // Store raw item data for resolving variant names to IDs after options load
 const [rawItem, setRawItem] = useState<{
  grade: string; brand: string; brandModel: string; capacity: string; colour: string;
 } | null>(null);

 // Fetch dropdowns (same account list as /customers: suppliers + customers)
 useEffect(() => {
  const fetchSuppliers = async () => {
   try {
    const response = await fetch(`${API_URL}/api/suppliers?limit=1000&isActive=true`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data) {
     setSuppliers(result.data.map((s: { _id: string; name: string; email?: string; phone?: string; contactPerson?: string }) => ({ _id: s._id, name: s.name, email: s.email, phone: s.phone, contactPerson: s.contactPerson })));
    }
   } catch (error) {
    console.error("Failed to fetch suppliers:", error);
   }
  };

  const fetchCustomers = async () => {
   try {
    const response = await fetch(`${API_URL}/api/customers?limit=1000&isActive=true`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data) {
     setCustomers(result.data.map((c: { _id: string; name: string; email?: string; phone?: string; contactName?: string }) => ({ _id: c._id, name: c.name, email: c.email, phone: c.phone, contactName: c.contactName })));
    }
   } catch (error) {
    console.error("Failed to fetch customers:", error);
   }
  };

  fetchSuppliers();
  fetchCustomers();

  const fetchLocations = async () => {
   try {
    const response = await fetch(`${API_URL}/api/locations?limit=1000&isActive=true`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data) {
     setSendToOptions(result.data.map((l: { _id: string; name: string }) => ({ _id: l._id, name: l.name })));
    }
   } catch (error) {
    console.error("Failed to fetch locations:", error);
   }
  };

  const fetchTaxCategories = async () => {
   try {
    const response = await fetch(`${API_URL}/api/settings/taxes/active`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data) {
     setTaxCategories(result.data.map((t: { _id: string; name: string; rate: number; type: string }) => ({ _id: t._id, name: t.name, rate: t.rate, type: t.type })));
    }
   } catch (error) {
    console.error("Failed to fetch tax categories:", error);
   }
  };

  const fetchTypes = async () => {
   try {
    const response = await fetch(`${API_URL}/api/categories?limit=1000&isActive=true`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data) {
     const list = result.data as { _id: string; name: string; itemType?: string }[];
     const forSerial = list.filter((c) => {
      const t = c.itemType ?? "";
      return t === "serial" || t === "both" || t === "";
     });
     const forNonSerial = list.filter((c) => {
      const t = c.itemType ?? "";
      return t === "non-serial" || t === "both";
     });
     setTypes(forSerial.map((c) => ({ _id: c._id, name: c.name })));
     setTypesForNonSerial(forNonSerial.map((c) => ({ _id: c._id, name: c.name })));
    }
   } catch (error) {
    console.error("Failed to fetch categories:", error);
   }
  };

  const fetchVariantBySlug = async (slug: string) => {
   try {
    const response = await fetch(`${API_URL}/api/variant-attributes/slug/${slug}`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data && result.data.values) {
     return result.data.values.filter((v: { isActive: boolean }) => v.isActive);
    }
   } catch (error) {
    console.error(`Failed to fetch ${slug}:`, error);
   }
   return [];
  };

  const fetchAllVariants = async () => {
   const [gradesData, brandsData, storageData, colorData] = await Promise.all([
    fetchVariantBySlug("grade"),
    fetchVariantBySlug("brands"),
    fetchVariantBySlug("storage"),
    fetchVariantBySlug("color"),
   ]);
   setGrades(gradesData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
   setBrands(brandsData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
   setBrandsRaw(brandsData.map((v: { _id: string; name: string; models: { _id: string; name: string }[] }) => ({ _id: v._id, name: v.name, models: v.models || [] })));
   setCapacities(storageData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
   setColours(colorData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
  };

  fetchLocations();
  fetchTaxCategories();
  fetchTypes();
  fetchAllVariants();
 }, []);

 const fetchSubCategories = async (categoryId: string) => {
  if (!categoryId) {
   setMakes([]);
   return;
  }
  try {
   const response = await fetch(`${API_URL}/api/subcategories/category/${categoryId}`, { headers: getAuthHeaders() });
   const result = await response.json();
   if (result.success && result.data) {
    setMakes(result.data.map((s: { _id: string; name: string }) => ({ _id: s._id, name: s.name })));
   }
  } catch (error) {
   console.error("Failed to fetch subcategories:", error);
  }
 };

 const normalizeAttribute = (a: {
  _id: string;
  name?: string;
  slug?: string;
  values?: { _id: string; name: string; slug?: string; models?: { _id: string; name: string; slug?: string; children?: { _id: string; name: string }[] }[] }[];
 }): CategoryVariantAttribute => ({
  _id: a._id,
  name: a.name || "",
  slug: (a.slug || "").toLowerCase().trim(),
  values: (a.values || []).filter((v) => (v as { isActive?: boolean }).isActive !== false).map((v: { _id: string; name: string; slug?: string; models?: { _id: string; name: string; slug?: string; children?: { _id: string; name: string }[] }[] }) => ({
   _id: v._id,
   name: v.name,
   slug: v.slug,
   models: (v.models || []).map((m: { _id: string; name: string; slug?: string; children?: { _id: string; name: string }[] }) => ({
    _id: m._id,
    name: m.name,
    slug: m.slug,
    children: m.children || [],
   })),
  })),
 });

 const getVariantOptionsForAttributeIndex = useCallback(
  (attributes: CategoryVariantAttribute[], variantValues: Record<string, string>, attributeIndex: number): { _id: string; name: string }[] => {
   if (!attributes.length || attributeIndex < 0) return [];
   const treeValues = attributes[0].values || [];
   if (attributeIndex === 0) return treeValues.map((v) => ({ _id: v._id, name: v.name }));
   const path = attributes.slice(0, attributeIndex).map((a) => variantValues[a._id]).filter(Boolean);
   if (path.length !== attributeIndex) return [];
   type Node = { _id: string; name: string; models?: Node[]; children?: Node[] };
   let nodes: Node[] = treeValues as Node[];
   for (let i = 0; i < path.length; i++) {
    const node = nodes.find((n) => n._id === path[i]);
    if (!node) return [];
    nodes = i === 0 ? (node.models || []) : (node.children || []);
   }
   return nodes.map((n) => ({ _id: n._id, name: n.name }));
  },
  []
 );

 const fetchCategoryVariantAttributes = useCallback(async (categoryId: string, forImei: boolean) => {
  if (!categoryId) {
   if (forImei) {
    categoryIdImeiRef.current = "";
    setCategoryVariantAttributesImei([]);
   } else {
    categoryIdOtherRef.current = "";
    setCategoryVariantAttributesOther([]);
   }
   return;
  }
  try {
   const response = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, { headers: getAuthHeaders() });
   const result = await response.json();
   if (result.success && result.data && Array.isArray(result.data)) {
    const list = (result.data as Parameters<typeof normalizeAttribute>[0][]).map(normalizeAttribute);
    attributesByCategoryIdRef.current[categoryId] = list;
    if (forImei) {
     categoryIdImeiRef.current = categoryId;
     setCategoryVariantAttributesImei(list);
    } else {
     categoryIdOtherRef.current = categoryId;
     setCategoryVariantAttributesOther(list);
    }
   } else {
    if (forImei) setCategoryVariantAttributesImei([]);
    else setCategoryVariantAttributesOther([]);
   }
  } catch (error) {
   console.error("Failed to fetch category variant attributes:", error);
   if (forImei) setCategoryVariantAttributesImei([]);
   else setCategoryVariantAttributesOther([]);
  }
 }, []);

 useEffect(() => {
  if (itemData.type) fetchCategoryVariantAttributes(itemData.type, true);
  else setCategoryVariantAttributesImei([]);
 }, [itemData.type, fetchCategoryVariantAttributes]);

 useEffect(() => {
  if (otherItemData.type) fetchCategoryVariantAttributes(otherItemData.type, false);
  else setCategoryVariantAttributesOther([]);
 }, [otherItemData.type, fetchCategoryVariantAttributes]);

 // When category attributes load, pre-fill variantValues so dynamic dropdowns show data saved when parcel was added
 useEffect(() => {
  const attrs = categoryVariantAttributesImei;
  if (attrs.length === 0 || !itemData.type || categoryIdImeiRef.current !== itemData.type) return;
  if (Object.keys(itemData.variantValues || {}).length > 0) return;

  const next: Record<string, string> = {};

  // Prefer raw variant array from API (saved when parcel was added)
  if (itemData.rawVariantValues && itemData.rawVariantValues.length > 0) {
   for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    const raw = itemData.rawVariantValues.find(
     (r) => (r.slug || "").toLowerCase() === (attr.slug || "").toLowerCase()
    );
    const valueName = raw?.value?.trim();
    if (!valueName) continue;
    const options = getVariantOptionsForAttributeIndex(attrs, next, i);
    const opt = options.find(
     (o) => (o.name || "").trim().toUpperCase() === valueName.toUpperCase()
    );
    if (opt) next[attr._id] = opt._id;
   }
   if (Object.keys(next).length > 0) {
    setItemData((prev) => ({ ...prev, variantValues: next, rawVariantValues: undefined }));
   }
   return;
  }

  // Fallback: legacy fields (grade, brand, etc.) -> variantValues
  const hasLegacy = itemData.grade || itemData.brand || itemData.brandModel || itemData.capacity || itemData.colour;
  if (!hasLegacy) return;
  const getLegacyName = (slug: string): string | undefined => {
   if (slug === "grade") return grades.find((g) => g._id === itemData.grade)?.name;
   if (slug === "brands" || slug === "brand") return brands.find((b) => b._id === itemData.brand)?.name;
   if (slug === "brand_model" || slug === "model") return brandModels.find((m) => m._id === itemData.brandModel)?.name;
   if (slug === "storage" || slug === "capacity") return capacities.find((c) => c._id === itemData.capacity)?.name;
   if (slug === "color" || slug === "colour") return colours.find((c) => c._id === itemData.colour)?.name;
   return undefined;
  };
  for (let i = 0; i < attrs.length; i++) {
   const attr = attrs[i];
   const legacyName = getLegacyName(attr.slug);
   if (!legacyName) continue;
   const options = getVariantOptionsForAttributeIndex(attrs, next, i);
   const opt = options.find((o) => (o.name || "").trim().toUpperCase() === legacyName.trim().toUpperCase());
   if (opt) next[attr._id] = opt._id;
  }
  if (Object.keys(next).length > 0) {
   setItemData((prev) => ({ ...prev, variantValues: next }));
  }
 }, [categoryVariantAttributesImei, itemData.type, itemData.rawVariantValues, itemData.variantValues, itemData.grade, itemData.brand, itemData.brandModel, itemData.capacity, itemData.colour, grades, brands, brandModels, capacities, colours]);

 // Same for other items: show dynamic variant data saved when parcel was added
 useEffect(() => {
  const attrs = categoryVariantAttributesOther;
  if (attrs.length === 0 || !otherItemData.type || categoryIdOtherRef.current !== otherItemData.type) return;
  if (Object.keys(otherItemData.variantValues || {}).length > 0) return;

  const next: Record<string, string> = {};
  if (otherItemData.rawVariantValues && otherItemData.rawVariantValues.length > 0) {
   for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    const raw = otherItemData.rawVariantValues.find(
     (r) => (r.slug || "").toLowerCase() === (attr.slug || "").toLowerCase()
    );
    const valueName = raw?.value?.trim();
    if (!valueName) continue;
    const options = getVariantOptionsForAttributeIndex(attrs, next, i);
    const opt = options.find((o) => (o.name || "").trim().toUpperCase() === valueName.toUpperCase());
    if (opt) next[attr._id] = opt._id;
   }
   if (Object.keys(next).length > 0) {
    setOtherItemData((prev) => ({ ...prev, variantValues: next, rawVariantValues: undefined }));
   }
  }
 }, [categoryVariantAttributesOther, otherItemData.type, otherItemData.rawVariantValues, otherItemData.variantValues]);

 // Fetch category variant attributes when editing an item so dynamic block and pencil/trash show
 const addValueAtPath = useCallback(
  async (categoryId: string, firstAttributeId: string, parentPath: string[], name: string): Promise<string | null> => {
   if (!categoryId || !name.trim()) return null;
   try {
    const response = await fetch(
     `${API_URL}/api/categories/${categoryId}/variant-attributes/${firstAttributeId}/values/add-at-path`,
     { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ parentPath, name: name.trim() }) }
    );
    const result = await response.json();
    if (!result.success || !result.data) return null;
    const data = result.data as { _id: string };
    const id = data._id != null ? String(data._id) : "";
    if (!id) return null;
    const list = attributesByCategoryIdRef.current[categoryId];
    if (list) {
     const refetched = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, { headers: getAuthHeaders() }).then((r) => r.json());
     if (refetched.success && refetched.data && Array.isArray(refetched.data)) {
      const next = (refetched.data as Parameters<typeof normalizeAttribute>[0][]).map(normalizeAttribute);
      attributesByCategoryIdRef.current[categoryId] = next;
      if (categoryIdImeiRef.current === categoryId) setCategoryVariantAttributesImei(next);
      if (categoryIdOtherRef.current === categoryId) setCategoryVariantAttributesOther(next);
     }
    }
    return id;
   } catch {
    return null;
   }
  },
  []
 );

 const updateVariantValueAtPath = useCallback(
  async (categoryId: string, firstAttributeId: string, path: string[], newName: string): Promise<{ ok: boolean; message?: string }> => {
   if (!categoryId || !newName.trim() || path.length === 0) return { ok: false, message: "Missing data" };
   try {
    const response = await fetch(
     `${API_URL}/api/categories/${categoryId}/variant-attributes/${firstAttributeId}/values/update-at-path`,
     { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ path, name: newName.trim() }) }
    );
    const result = await response.json();
    if (!result.success) {
     return { ok: false, message: result.message || "Failed to rename." };
    }
    const refetched = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, { headers: getAuthHeaders() }).then((r) => r.json());
    if (refetched.success && refetched.data && Array.isArray(refetched.data)) {
     const next = (refetched.data as Parameters<typeof normalizeAttribute>[0][]).map(normalizeAttribute);
     attributesByCategoryIdRef.current[categoryId] = next;
     if (categoryIdImeiRef.current === categoryId) setCategoryVariantAttributesImei(next);
     if (categoryIdOtherRef.current === categoryId) setCategoryVariantAttributesOther(next);
    }
    return { ok: true };
   } catch {
    return { ok: false, message: "Failed to rename." };
   }
  },
  []
 );

 const deleteVariantValueAtPath = useCallback(
  async (
   categoryId: string,
   firstAttributeId: string,
   path: string[],
   replacementValueName?: string
  ): Promise<
   | boolean
   | { ok: false; inUse: true; count: number; replacementOptions: Array<{ _id: string; name: string }> }
  > => {
   if (!categoryId || path.length === 0) return false;
   try {
    const result = await categoryApi.deleteCategoryVariantValueAtPath(
     categoryId,
     firstAttributeId,
     path,
     replacementValueName
    );
    if (!result.success) {
     if (result.inUse && result.replacementOptions) {
      return {
       ok: false,
       inUse: true,
       count: result.count ?? 0,
       replacementOptions: result.replacementOptions,
      };
     }
     return false;
    }
    const refetched = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, { headers: getAuthHeaders() }).then((r) => r.json());
    if (refetched.success && refetched.data && Array.isArray(refetched.data)) {
     const next = (refetched.data as Parameters<typeof normalizeAttribute>[0][]).map(normalizeAttribute);
     attributesByCategoryIdRef.current[categoryId] = next;
     if (categoryIdImeiRef.current === categoryId) setCategoryVariantAttributesImei(next);
     if (categoryIdOtherRef.current === categoryId) setCategoryVariantAttributesOther(next);
    }
    return true;
   } catch {
    return false;
   }
  },
  []
 );

 const handleItemVariantChange = useCallback((attributeId: string, valueId: string) => {
  setItemData((prev) => {
   const attrs = categoryVariantAttributesImei;
   const idx = attrs.findIndex((a) => a._id === attributeId);
   const next = { ...prev.variantValues, [attributeId]: valueId };
   if (idx >= 0) for (let j = idx + 1; j < attrs.length; j++) delete next[attrs[j]._id];
   return { ...prev, variantValues: next };
  });
 }, [categoryVariantAttributesImei]);

 const handleItemVariantModelChange = useCallback((_attributeId: string, modelId: string) => {
  const attrs = categoryVariantAttributesImei;
  if (attrs.length < 2) return;
  const modelAttrId = attrs[1]._id;
  setItemData((prev) => {
   const next = { ...prev.variantValues, [modelAttrId]: modelId };
   for (let j = 2; j < attrs.length; j++) delete next[attrs[j]._id];
   return { ...prev, variantValues: next };
  });
 }, [categoryVariantAttributesImei]);

 const handleOtherItemVariantChange = useCallback((attributeId: string, valueId: string) => {
  setOtherItemData((prev) => {
   const attrs = categoryVariantAttributesOther;
   const idx = attrs.findIndex((a) => a._id === attributeId);
   const next = { ...prev.variantValues, [attributeId]: valueId };
   if (idx >= 0) for (let j = idx + 1; j < attrs.length; j++) delete next[attrs[j]._id];
   return { ...prev, variantValues: next };
  });
 }, [categoryVariantAttributesOther]);

 const handleOtherItemVariantModelChange = useCallback((_attributeId: string, modelId: string) => {
  const attrs = categoryVariantAttributesOther;
  if (attrs.length < 2) return;
  const modelAttrId = attrs[1]._id;
  setOtherItemData((prev) => {
   const next = { ...prev.variantValues, [modelAttrId]: modelId };
   for (let j = 2; j < attrs.length; j++) delete next[attrs[j]._id];
   return { ...prev, variantValues: next };
  });
 }, [categoryVariantAttributesOther]);

 // Fetch existing purchase data
 useEffect(() => {
  const fetchPurchase = async () => {
   try {
    const response = await fetch(`${API_URL}/api/purchases/${purchaseId}`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data) {
     const p = result.data;
     const supplierId = typeof p.supplier === "object" ? p.supplier?._id : p.supplier;
     const accountId = typeof p.account === "object" ? (p.account as { _id?: string })?._id : p.account;
     const rawId = supplierId || accountId || "";
     const accountModel = (p.accountModel as string) || "Supplier";
     const prefixedAccount = rawId ? (accountModel === "Customer" ? `customer:${rawId}` : `supplier:${rawId}`) : "";
     setParcelData({
      date: p.date ? new Date(p.date).toISOString().split("T")[0] : "",
      account: prefixedAccount || rawId,
      parcelNumber: p.parcelNumber || "",
      note: p.note || "",
      currency: p.currency || "GBP",
     });
     setQuantityData({
      date: p.date ? new Date(p.date).toISOString().split("T")[0] : "",
      imeiQuantity: p.imeiQuantity?.toString() || "",
      otherQuantity: p.otherQuantity?.toString() || "",
      note: p.note || "",
     });
     setStatus(p.status || "Received");
     setPaymentStatus(p.paymentStatus || "Unpaid");
     setPaid(p.paid?.toString() || "0");
     setDetailsSaved(true);

     if (p.items && p.items.length > 0) {
      const toId = (v: { _id?: string } | string | null | undefined): string =>
       v && typeof v === "object" && v._id != null ? String(v._id) : v != null ? String(v) : "";
      // Load all items into savedItems list so user can edit any variant and re-save
      type ApiItem = {
       sendTo?: { _id: string } | string;
       tax?: { _id: string } | string;
       category?: { _id: string } | string;
       subCategory?: { _id: string } | string;
       grade?: string;
       brand?: string;
       brandModel?: string;
       capacity?: string;
       colour?: string;
       purchasePrice?: number;
       salePrice?: number;
       imeis?: string[];
       quantity?: number;
       name?: string;
       barcode?: string;
       variantValues?: { slug: string; value: string }[];
       isOtherItem?: boolean;
      };
      const imeiItems = p.items.filter((item: ApiItem) => !item.isOtherItem);
      const otherItems = p.items.filter((item: ApiItem) => !!item.isOtherItem);
      const entries: ItemEntry[] = imeiItems.map((item: ApiItem, idx: number) => {
       const imeis = item.imeis || [];
       const summaryParts = [item.brand, item.brandModel, item.capacity].filter(Boolean);
       const rawVariantValues =
        Array.isArray(item.variantValues) && item.variantValues.length > 0 ? item.variantValues : undefined;
       return {
        id: `loaded-imei-${idx}`,
        data: {
         sendTo: toId(item.sendTo),
         taxCategory: toId(item.tax),
         type: toId(item.category),
         make: toId(item.subCategory),
         grade: item.grade != null ? String(item.grade).trim() : "",
         brand: item.brand != null ? String(item.brand).trim() : "",
         brandModel: item.brandModel != null ? String(item.brandModel).trim() : "",
         capacity: item.capacity != null ? String(item.capacity).trim() : "",
         colour: item.colour != null ? String(item.colour).trim() : "",
         purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
         salePrice: item.salePrice != null ? String(item.salePrice) : "",
         multiIMEIs: imeis.join("\n"),
         variantValues: {},
         rawVariantValues,
        },
        imeiCount: imeis.length,
        specsSummary: summaryParts.length > 0 ? summaryParts.join(" / ") : `Item ${idx + 1}`,
       } as ItemEntry;
      });
      const otherEntries: OtherItemEntry[] = otherItems.map((item: ApiItem, idx: number) => {
       const qty = item.quantity ?? 1;
       const summaryParts = [item.brand, item.brandModel, item.capacity].filter(Boolean);
       const rawVariantValues =
        Array.isArray(item.variantValues) && item.variantValues.length > 0 ? item.variantValues : undefined;
       return {
        id: `loaded-other-${idx}`,
        data: {
         sendTo: toId(item.sendTo),
         taxCategory: toId(item.tax),
         type: toId(item.category),
         make: toId(item.subCategory),
         grade: item.grade != null ? String(item.grade).trim() : "",
         brand: item.brand != null ? String(item.brand).trim() : "",
         brandModel: item.brandModel != null ? String(item.brandModel).trim() : "",
         capacity: item.capacity != null ? String(item.capacity).trim() : "",
         colour: item.colour != null ? String(item.colour).trim() : "",
         purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
         salePrice: item.salePrice != null ? String(item.salePrice) : "",
         quantity: String(qty),
         name: item.name != null ? String(item.name) : "",
         barcode: item.barcode != null ? String(item.barcode) : "",
         variantValues: {},
         rawVariantValues,
        },
        quantity: qty,
        specsSummary: summaryParts.length > 0 ? summaryParts.join(" / ") : `Other ${idx + 1}`,
       } as OtherItemEntry;
      });
      setSavedItems(entries);
      setSavedOtherItems(otherEntries);

      // Don't populate the form — leave it empty for adding new items
      // But still load subcategories for the first item for reference
      const firstCat = p.items[0]?.category;
      const firstCatId = firstCat && typeof firstCat === "object" ? firstCat._id : firstCat || "";
      if (firstCatId) {
       fetchSubCategories(firstCatId);
      }

      // Clear rawItem since we're not populating the form
      setRawItem(null);
     }
    } else {
     setLoadError(result.message || "Purchase not found");
    }
   } catch {
    setLoadError("Failed to fetch purchase");
   } finally {
    setIsLoadingData(false);
   }
  };
  fetchPurchase();
 }, [purchaseId]);

 // Resolve variant name strings to _id values once dropdown options are loaded
 useEffect(() => {
  if (!rawItem) return;

  const gradeId = grades.find((g) => g.name === rawItem.grade)?._id || "";
  const brandId = brands.find((b) => b.name === rawItem.brand)?._id || "";
  const capacityId = capacities.find((c) => c.name === rawItem.capacity)?._id || "";
  const colourId = colours.find((c) => c.name === rawItem.colour)?._id || "";

  // Load brand models for the matched brand
  if (brandId) {
   const selected = brandsRaw.find((b) => b._id === brandId);
   const models = selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || [];
   setBrandModels(models);
  }

  setItemData((prev) => ({
   ...prev,
   grade: gradeId,
   brand: brandId,
   capacity: capacityId,
   colour: colourId,
  }));
 }, [rawItem, grades, brands, capacities, colours, brandsRaw]);

 // Resolve brandModel after brandModels are populated
 useEffect(() => {
  if (!rawItem || brandModels.length === 0) return;
  const modelId = brandModels.find((m) => m.name === rawItem.brandModel)?._id || "";
  if (modelId) {
   setItemData((prev) => ({ ...prev, brandModel: modelId }));
  }
 }, [rawItem, brandModels]);

 const currentFormIMEICount = useMemo(() => {
  if (!itemData.multiIMEIs.trim()) return 0;
  return parseMultiIMEIs(itemData.multiIMEIs).length;
 }, [itemData.multiIMEIs]);

 const [savedItems, setSavedItems] = useState<ItemEntry[]>([]);

 // Exclude the entry currently being edited — its data lives in the form, and the form's
 // currentFormIMEICount already represents that entry's live serial count.
 const savedIMEICount = useMemo(
  () =>
   savedItems
    .filter((i) => i.id !== editingItemId)
    .reduce((sum, item) => sum + item.imeiCount, 0),
  [savedItems, editingItemId]
 );
 const totalIMEIs = savedIMEICount + currentFormIMEICount;

 const savedOtherQuantity = useMemo(
  () =>
   savedOtherItems
    .filter((i) => i.id !== editingOtherItemId)
    .reduce((sum, item) => sum + item.quantity, 0),
  [savedOtherItems, editingOtherItemId]
 );
 const currentOtherQuantity = parseInt(otherItemData.quantity) || 0;
 const totalOtherQuantity = savedOtherQuantity + currentOtherQuantity;

 const buildSpecsSummary = (d: ItemData) => {
  const parts: string[] = [];
  const brandName = brands.find((b) => b._id === d.brand)?.name || d.brand;
  const modelName = brandModels.find((m) => m._id === d.brandModel)?.name || d.brandModel;
  const capName = capacities.find((c) => c._id === d.capacity)?.name || d.capacity;
  if (brandName) parts.push(brandName);
  if (modelName) parts.push(modelName);
  if (capName) parts.push(capName);
  return parts.length > 0 ? parts.join(" / ") : "Item";
 };

 const handleAddItem = () => {
  if (currentFormIMEICount === 0) return;
  const pp = parseFloat(itemData.purchasePrice);
  const sp = parseFloat(itemData.salePrice);
  if (!Number.isFinite(pp) || pp <= 0 || !Number.isFinite(sp) || sp <= 0) {
   setSubmitMessage({
    type: "error",
    text: "Enter purchase price and sale price (each must be greater than zero).",
   });
   return;
  }
  const currentIMEIs = parseMultiIMEIs(itemData.multiIMEIs);
  // Exclude the entry being edited from duplicate check — its old serials are being replaced
  // by what's currently in the form.
  const allSavedIMEIs = savedItems
   .filter((item) => item.id !== editingItemId)
   .flatMap((item) => parseMultiIMEIs(item.data.multiIMEIs));
  const savedU = new Set(allSavedIMEIs.map((x) => x.toUpperCase()));
  const duplicate = currentIMEIs.find((sn) => savedU.has(sn.toUpperCase()));
  if (duplicate) {
   setSubmitMessage({ type: "error", text: `Duplicate serial "${duplicate}" is already in another item group!` });
   return;
  }
  const specs = buildSpecsSummary(itemData);
  if (editingItemId) {
   setSavedItems((prev) =>
    prev.map((item) =>
     item.id === editingItemId
      ? { ...item, data: { ...itemData }, imeiCount: currentFormIMEICount, specsSummary: specs }
      : item
    )
   );
   setEditingItemId(null);
  } else {
   const entry: ItemEntry = {
    id: Date.now().toString(),
    data: { ...itemData },
    imeiCount: currentFormIMEICount,
    specsSummary: specs,
   };
   setSavedItems((prev) => [...prev, entry]);
  }
  setItemData({
   sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
   brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", multiIMEIs: "",
   variantValues: {},
  });
  setSubmitMessage({ type: "", text: "" });
 };

 const handleRemoveItem = (id: string) => {
  if (id === editingItemId) {
   setEditingItemId(null);
   setItemData({
    sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
    brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", multiIMEIs: "",
    variantValues: {},
   });
  }
  setSavedItems((prev) => prev.filter((item) => item.id !== id));
 };

 // Commit whatever is in the form back to the currently-edited entry (if any) without
 // adding a new row. Used when switching to edit another item or when explicitly cancelling.
 const commitFormToEditingItem = (targetId: string) => {
  const pp = parseFloat(itemData.purchasePrice);
  const sp = parseFloat(itemData.salePrice);
  const cnt = currentFormIMEICount;
  if (cnt === 0 || !Number.isFinite(pp) || pp <= 0 || !Number.isFinite(sp) || sp <= 0) {
   // Form is incomplete — leave the original saved entry untouched.
   return;
  }
  const specs = buildSpecsSummary(itemData);
  setSavedItems((prev) =>
   prev.map((item) =>
    item.id === targetId
     ? { ...item, data: { ...itemData }, imeiCount: cnt, specsSummary: specs }
     : item
   )
  );
 };

 const handleCancelEdit = () => {
  if (!editingItemId) return;
  commitFormToEditingItem(editingItemId);
  setEditingItemId(null);
  setItemData({
   sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
   brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", multiIMEIs: "",
   variantValues: {},
  });
 };

 // Match option by _id or by name (case-insensitive) so API uppercase variant names resolve
 const matchId = <T extends { _id: string; name?: string }>(list: T[], value: string): string => {
  if (!value || !list.length) return value || "";
  const v = value.trim().toUpperCase();
  const byId = list.find((o) => String(o._id) === value || String(o._id) === value.trim());
  if (byId) return byId._id;
  const byName = list.find((o) => (o.name || "").trim().toUpperCase() === v);
  return byName ? byName._id : value;
 };

 const handleEditItem = (id: string) => {
  // Toggle: if user re-clicks the row that's already open in the form, treat it as "close".
  if (editingItemId === id) {
   handleCancelEdit();
   return;
  }

  const entry = savedItems.find((item) => item.id === id);
  if (!entry) return;
  const d = { ...entry.data };

  // Resolve variant names to _id so dropdowns show current selection (API often returns UPPERCASE names)
  const gradeId = matchId(grades, d.grade);
  const brandId = matchId(brands, d.brand);
  const capacityId = matchId(capacities, d.capacity);
  const colourId = matchId(colours, d.colour);

  // Load brand models for the resolved brand
  let resolvedModels: { _id: string; name: string }[] = [];
  if (brandId) {
   const selected = brandsRaw.find((b) => b._id === brandId);
   resolvedModels = selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || [];
   setBrandModels(resolvedModels);
  }

  const brandModelId = resolvedModels.length ? matchId(resolvedModels, d.brandModel) : d.brandModel;

  // Switching from one open entry to another: commit the form's current contents back to
  // the previously-edited entry so the user's pending changes aren't lost.
  if (editingItemId && editingItemId !== id) {
   commitFormToEditingItem(editingItemId);
  }

  setItemData({
   ...d,
   grade: gradeId,
   brand: brandId,
   brandModel: brandModelId,
   capacity: capacityId,
   colour: colourId,
  });
  setEditingItemId(id);
  if (d.type) {
   fetchSubCategories(d.type);
   fetchCategoryVariantAttributes(d.type, true);
  }
 };

 // Other items handlers
 const buildOtherSpecsSummary = () => {
  const parts: string[] = [];
  const brandName = brands.find((b) => b._id === otherItemData.brand)?.name;
  const modelName = brandModels.find((m) => m._id === otherItemData.brandModel)?.name;
  const capName = capacities.find((c) => c._id === otherItemData.capacity)?.name;
  if (brandName) parts.push(brandName);
  if (modelName) parts.push(modelName);
  if (capName) parts.push(capName);
  return parts.length > 0 ? parts.join(" / ") : "Item";
 };

 const handleOtherItemChange = (field: keyof OtherItemData, value: string) => {
  if (field === "type") {
   setOtherItemData((prev) => ({ ...prev, [field]: value, make: "" }));
   fetchSubCategories(value);
  } else if (field === "brand") {
   setOtherItemData((prev) => ({ ...prev, [field]: value, brandModel: "" }));
   const selected = brandsRaw.find((b) => b._id === value);
   setBrandModels(selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || []);
  } else if (field === "quantity") {
   const otherQtyLimit = parseInt(quantityData.otherQuantity) || 0;
   const newQty = parseInt(value) || 0;
   if (otherQtyLimit > 0 && (savedOtherQuantity + newQty) > otherQtyLimit) {
    const maxAllowed = Math.max(0, otherQtyLimit - savedOtherQuantity);
    setOtherItemData((prev) => ({ ...prev, quantity: maxAllowed.toString() }));
    setSubmitMessage({ type: "error", text: `Quantity limit reached! You can only add ${maxAllowed} more items.` });
   } else {
    setOtherItemData((prev) => ({ ...prev, quantity: value }));
    setSubmitMessage({ type: "", text: "" });
   }
  } else {
   setOtherItemData((prev) => ({ ...prev, [field]: value }));
  }
 };

 const handleAddOtherItem = () => {
  if (currentOtherQuantity === 0) return;

  const opp = parseFloat(otherItemData.purchasePrice);
  const osp = parseFloat(otherItemData.salePrice);
  if (!Number.isFinite(opp) || opp <= 0 || !Number.isFinite(osp) || osp <= 0) {
   setSubmitMessage({
    type: "error",
    text: "Enter purchase price and sale price (each must be greater than zero).",
   });
   return;
  }

  const otherQtyLimit = parseInt(quantityData.otherQuantity) || 0;
  if (otherQtyLimit > 0 && totalOtherQuantity > otherQtyLimit) {
   setSubmitMessage({ type: "error", text: `Cannot add item. Quantity would exceed limit of ${otherQtyLimit}.` });
   return;
  }

  const specs = buildOtherSpecsSummary();
  if (editingOtherItemId) {
   setSavedOtherItems((prev) =>
    prev.map((item) =>
     item.id === editingOtherItemId
      ? { ...item, data: { ...otherItemData }, quantity: currentOtherQuantity, specsSummary: specs }
      : item
    )
   );
   setEditingOtherItemId(null);
  } else {
   const entry: OtherItemEntry = {
    id: Date.now().toString(),
    data: { ...otherItemData },
    quantity: currentOtherQuantity,
    specsSummary: specs,
   };
   setSavedOtherItems((prev) => [...prev, entry]);
  }
  setOtherItemData({
   sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
   brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", quantity: "0",
   name: "", barcode: "", variantValues: {},
  });
  setSubmitMessage({ type: "", text: "" });
 };

 const handleRemoveOtherItem = (id: string) => {
  if (id === editingOtherItemId) {
   setEditingOtherItemId(null);
   setOtherItemData({
    sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
    brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", quantity: "0",
    name: "", barcode: "", variantValues: {},
   });
  }
  setSavedOtherItems((prev) => prev.filter((item) => item.id !== id));
 };

 const commitFormToEditingOtherItem = (targetId: string) => {
  const opp = parseFloat(otherItemData.purchasePrice);
  const osp = parseFloat(otherItemData.salePrice);
  const qty = currentOtherQuantity;
  if (qty === 0 || !Number.isFinite(opp) || opp <= 0 || !Number.isFinite(osp) || osp <= 0) {
   return;
  }
  const specs = buildOtherSpecsSummary();
  setSavedOtherItems((prev) =>
   prev.map((item) =>
    item.id === targetId
     ? { ...item, data: { ...otherItemData }, quantity: qty, specsSummary: specs }
     : item
   )
  );
 };

 const handleCancelOtherEdit = () => {
  if (!editingOtherItemId) return;
  commitFormToEditingOtherItem(editingOtherItemId);
  setEditingOtherItemId(null);
  setOtherItemData({
   sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
   brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", quantity: "0",
   name: "", barcode: "", variantValues: {},
  });
 };

 const handleEditOtherItem = (id: string) => {
  if (editingOtherItemId === id) {
   handleCancelOtherEdit();
   return;
  }
  const entry = savedOtherItems.find((item) => item.id === id);
  if (!entry) return;

  if (editingOtherItemId && editingOtherItemId !== id) {
   commitFormToEditingOtherItem(editingOtherItemId);
  }

  setOtherItemData({ ...entry.data });
  setEditingOtherItemId(id);
  if (entry.data.type) {
   fetchSubCategories(entry.data.type);
   fetchCategoryVariantAttributes(entry.data.type, false);
  }
  if (entry.data.brand) {
   const selected = brandsRaw.find((b) => b._id === entry.data.brand);
   setBrandModels(selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || []);
  }
 };

 const handleSaveDetails = async () => {
  if (!parcelData.account) {
   setSubmitMessage({ type: "error", text: "Kindly add a supplier first" });
   return;
  }
  setIsSubmitting(true);
  setSubmitMessage({ type: "", text: "" });

  const accountValue = parcelData.account || "";
  const detailsPayload: Record<string, unknown> = {
   parcelNumber: parcelData.parcelNumber,
   date: parcelData.date,
   currency: parcelData.currency,
   note: parcelData.note || quantityData.note,
   imeiQuantity: quantityData.imeiQuantity ? parseInt(quantityData.imeiQuantity) : 0,
   otherQuantity: quantityData.otherQuantity ? parseInt(quantityData.otherQuantity) : 0,
  };
  if (accountValue.startsWith("supplier:")) {
   detailsPayload.account = accountValue.slice("supplier:".length);
   detailsPayload.accountModel = "Supplier";
  } else if (accountValue.startsWith("customer:")) {
   detailsPayload.account = accountValue.slice("customer:".length);
   detailsPayload.accountModel = "Customer";
  } else if (accountValue) {
   detailsPayload.supplier = accountValue;
  }

  try {
   const response = await fetch(`${API_URL}/api/purchases/${purchaseId}/details`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(detailsPayload),
   });
   const result = await response.json();
   if (result.success) {
    setDetailsSaved(true);
    setSubmitMessage({ type: "success", text: "Details saved" });
   } else {
    setSubmitMessage({ type: "error", text: result.message || "Failed to save details" });
   }
  } catch (error) {
   console.error("Failed to save purchase details:", error);
   setSubmitMessage({ type: "error", text: "Failed to save details" });
  } finally {
   setIsSubmitting(false);
  }
 };
 const handleEditDetails = () => setDetailsSaved(false);

 const handleParcelChange = (field: keyof ParcelData, value: string) => {
  setParcelData((prev) => ({ ...prev, [field]: value }));
 };

 const handleQuantityChange = (field: keyof QuantityData, value: string) => {
  setQuantityData((prev) => ({ ...prev, [field]: value }));
 };

 const handleItemChange = (field: keyof ItemData, value: string) => {
  if (field === "type") {
   setItemData((prev) => ({ ...prev, [field]: value, make: "", variantValues: {} }));
   fetchSubCategories(value);
   fetchCategoryVariantAttributes(value, true);
  } else if (field === "brand") {
   setItemData((prev) => ({ ...prev, [field]: value, brandModel: "" }));
   const selected = brandsRaw.find((b) => b._id === value);
   setBrandModels(selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || []);
  } else {
   setItemData((prev) => ({ ...prev, [field]: value }));
  }
 };

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

 const toUpper = (s: string | undefined) => (s != null && String(s).trim() !== "" ? String(s).trim().toUpperCase() : "");

 const getVariantValueName = (attributes: CategoryVariantAttribute[], variantValues: Record<string, string>, attributeIndex: number): string | undefined => {
  const options = getVariantOptionsForAttributeIndex(attributes, variantValues, attributeIndex);
  const attr = attributes[attributeIndex];
  if (!attr) return undefined;
  const selectedId = variantValues[attr._id];
  if (!selectedId) return undefined;
  return options.find((o) => o._id === selectedId)?.name;
 };

 const resolveVariantValues = (
  attrs: CategoryVariantAttribute[],
  variantValues: Record<string, string>
 ): { grade?: string; brand?: string; brandModel?: string; capacity?: string; colour?: string; variantValues: { slug: string; value: string }[] } => {
  const list: { slug: string; value: string }[] = [];
  const fixed: { grade?: string; brand?: string; brandModel?: string; capacity?: string; colour?: string } = {};
  for (let i = 0; i < attrs.length; i++) {
   const attr = attrs[i];
   const valueName = getVariantValueName(attrs, variantValues, i);
   if (!valueName) continue;
   const slug = attr.slug;
   const valueUpper = toUpper(valueName) ?? valueName;
   list.push({ slug, value: valueUpper });
   if (slug === "grade") fixed.grade = valueUpper;
   else if (slug === "brands" || slug === "brand") fixed.brand = valueUpper;
   else if (slug === "brand_model" || slug === "model") fixed.brandModel = valueUpper;
   else if (slug === "storage" || slug === "capacity") fixed.capacity = valueUpper;
   else if (slug === "color" || slug === "colour") fixed.colour = valueUpper;
  }
  return { ...fixed, variantValues: list };
 };

 const buildItemPayload = (d: ItemData) => {
  const imeis = parseMultiIMEIs(d.multiIMEIs);
  const cid = d.type;
  const attrs = cid ? attributesByCategoryIdRef.current[cid] : undefined;
  const useDynamic = attrs && attrs.length > 0 && d.variantValues && Object.keys(d.variantValues).length > 0;
  let gradeVal: string | undefined;
  let brandVal: string | undefined;
  let modelVal: string | undefined;
  let capacityVal: string | undefined;
  let colourVal: string | undefined;
  let variantValuesArr: { slug: string; value: string }[] = [];
  if (useDynamic) {
   const resolved = resolveVariantValues(attrs, d.variantValues);
   gradeVal = resolved.grade;
   brandVal = resolved.brand;
   modelVal = resolved.brandModel;
   capacityVal = resolved.capacity;
   colourVal = resolved.colour;
   variantValuesArr = resolved.variantValues;
  } else {
   const brand = brandsRaw.find((b) => b._id === d.brand);
   const modelsForBrand = brand?.models ?? [];
   modelVal = modelsForBrand.find((m) => m._id === d.brandModel)?.name;
   gradeVal = grades.find((g) => g._id === d.grade)?.name || d.grade;
   brandVal = brands.find((b) => b._id === d.brand)?.name || d.brand;
   capacityVal = capacities.find((c) => c._id === d.capacity)?.name || d.capacity;
   colourVal = colours.find((c) => c._id === d.colour)?.name || d.colour;
   if (gradeVal) variantValuesArr.push({ slug: "grade", value: toUpper(gradeVal) });
   if (brandVal) variantValuesArr.push({ slug: "brands", value: toUpper(brandVal) });
   if (modelVal) variantValuesArr.push({ slug: "brand_model", value: toUpper(modelVal) });
   if (capacityVal) variantValuesArr.push({ slug: "storage", value: toUpper(capacityVal) });
   if (colourVal) variantValuesArr.push({ slug: "color", value: toUpper(colourVal) });
  }
  return {
   sendTo: d.sendTo || undefined,
   tax: d.taxCategory || undefined,
   category: d.type || undefined,
   subCategory: d.make || undefined,
   grade: gradeVal,
   brand: brandVal,
   brandModel: modelVal,
   capacity: capacityVal,
   colour: colourVal,
   variantValues: variantValuesArr,
   purchasePrice: parseFloat(d.purchasePrice) || 0,
   salePrice: parseFloat(d.salePrice) || 0,
   imeis,
  };
 };

 const buildOtherItemPayload = (d: OtherItemData) => {
  const cid = d.type;
  const attrs = cid ? attributesByCategoryIdRef.current[cid] : undefined;
  const useDynamic = attrs && attrs.length > 0 && d.variantValues && Object.keys(d.variantValues).length > 0;
  let gradeVal: string | undefined;
  let brandVal: string | undefined;
  let modelVal: string | undefined;
  let capacityVal: string | undefined;
  let colourVal: string | undefined;
  let variantValuesArr: { slug: string; value: string }[] = [];
  if (useDynamic) {
   const resolved = resolveVariantValues(attrs, d.variantValues);
   gradeVal = resolved.grade;
   brandVal = resolved.brand;
   modelVal = resolved.brandModel;
   capacityVal = resolved.capacity;
   colourVal = resolved.colour;
   variantValuesArr = resolved.variantValues;
  } else {
   const brand = brandsRaw.find((b) => b._id === d.brand);
   const modelsForBrand = brand?.models ?? [];
   modelVal = modelsForBrand.find((m) => m._id === d.brandModel)?.name;
   gradeVal = grades.find((g) => g._id === d.grade)?.name || d.grade;
   brandVal = brands.find((b) => b._id === d.brand)?.name || d.brand;
   capacityVal = capacities.find((c) => c._id === d.capacity)?.name || d.capacity;
   colourVal = colours.find((c) => c._id === d.colour)?.name || d.colour;
   if (gradeVal) variantValuesArr.push({ slug: "grade", value: toUpper(gradeVal) });
   if (brandVal) variantValuesArr.push({ slug: "brands", value: toUpper(brandVal) });
   if (modelVal) variantValuesArr.push({ slug: "brand_model", value: toUpper(modelVal) });
   if (capacityVal) variantValuesArr.push({ slug: "storage", value: toUpper(capacityVal) });
   if (colourVal) variantValuesArr.push({ slug: "color", value: toUpper(colourVal) });
  }
  return {
   sendTo: d.sendTo || undefined,
   tax: d.taxCategory || undefined,
   category: d.type || undefined,
   subCategory: d.make || undefined,
   grade: gradeVal,
   brand: brandVal,
   brandModel: modelVal,
   capacity: capacityVal,
   colour: colourVal,
   variantValues: variantValuesArr,
   purchasePrice: parseFloat(d.purchasePrice) || 0,
   salePrice: parseFloat(d.salePrice) || 0,
   quantity: parseInt(d.quantity) || 0,
   isOtherItem: true,
  };
 };

 const handleItemSubmit = async () => {
  setIsSubmitting(true);
  setSubmitMessage({ type: "", text: "" });

  // Combine IMEI items
  const imeiItems = [
   ...savedItems.map((entry) => buildItemPayload(entry.data)),
   ...(currentFormIMEICount > 0 ? [buildItemPayload(itemData)] : []),
  ];

  // Combine Other items
  const otherItems = [
   ...savedOtherItems.map((entry) => buildOtherItemPayload(entry.data)),
   ...(currentOtherQuantity > 0 ? [buildOtherItemPayload(otherItemData)] : []),
  ];

  // Validation: need at least one item of any type
  if (imeiItems.length === 0 && otherItems.length === 0) {
   setSubmitMessage({ type: "error", text: "Add at least one item" });
   setIsSubmitting(false);
   return;
  }

  const allItems = [...imeiItems, ...otherItems];

  // Validation: purchase price and sale price are required for every item
  const imeiMissing = imeiItems.find(
   (item) =>
    item.purchasePrice == null ||
    item.purchasePrice <= 0 ||
    item.salePrice == null ||
    item.salePrice <= 0
  );
  const otherMissing = otherItems.find(
   (item) =>
    item.purchasePrice == null ||
    item.purchasePrice <= 0 ||
    item.salePrice == null ||
    item.salePrice <= 0
  );
  if (imeiMissing || otherMissing) {
   const parts: string[] = [];
   if (imeiMissing) parts.push("IMEI/Serial item(s)");
   if (otherMissing) parts.push("Non-Serial item(s)");
   setSubmitMessage({
    type: "error",
    text: `Purchase price and sale price are required for every item (value > 0). Please check: ${parts.join(" and ")}. If you have non-serial items, open the "Non Serial Numbers" tab and enter prices there.`,
   });
   setIsSubmitting(false);
   return;
  }
  const allIMEIs = imeiItems.flatMap((item) => item.imeis);

  // Calculate grand total for both types
  const imeiTotal = imeiItems.reduce((sum, item) => sum + item.purchasePrice * (item.imeis.length || 1), 0);
  const otherTotal = otherItems.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0);
  const grandTotal = imeiTotal + otherTotal;

  // Calculate total other quantity
  const totalOtherQty = otherItems.reduce((sum, item) => sum + item.quantity, 0);

  const accountValue = parcelData.account || "";
  const purchasePayload: Record<string, unknown> = {
   parcelNumber: parcelData.parcelNumber,
   date: parcelData.date,
   currency: parcelData.currency,
   note: parcelData.note || quantityData.note,
   imeiQuantity: quantityData.imeiQuantity ? parseInt(quantityData.imeiQuantity) : 0,
   otherQuantity: quantityData.otherQuantity ? parseInt(quantityData.otherQuantity) : 0,
   status,
   paymentStatus,
   paid: parseFloat(paid) || 0,
   items: allItems,
   totalIMEIs: allIMEIs.length,
   totalOtherQuantity: totalOtherQty,
   grandTotal,
  };
  if (accountValue.startsWith("supplier:")) {
   purchasePayload.account = accountValue.slice("supplier:".length);
   purchasePayload.accountModel = "Supplier";
  } else if (accountValue.startsWith("customer:")) {
   purchasePayload.account = accountValue.slice("customer:".length);
   purchasePayload.accountModel = "Customer";
  } else if (accountValue) {
   purchasePayload.supplier = accountValue;
  }

  try {
   const response = await fetch(`${API_URL}/api/purchases/${purchaseId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(purchasePayload as Record<string, string | number | unknown[]>),
   });
   const result = await response.json();
   if (result.success) {
    setSubmitMessage({ type: "success", text: "Purchase updated successfully!" });
    router.push("/purchases/list");
   } else {
    setSubmitMessage({ type: "error", text: result.message || "Failed to update purchase" });
   }
  } catch (error) {
   console.error("Failed to update purchase:", error);
   setSubmitMessage({ type: "error", text: "Failed to update purchase" });
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleBack = () => router.push("/purchases/list");

 const handleReset = () => {
  setItemData({
   sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
   brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", multiIMEIs: "",
   variantValues: {},
  });
  setOtherItemData({
   sendTo: "", taxCategory: "", type: "", make: "", grade: "", brand: "",
   brandModel: "", capacity: "", colour: "", purchasePrice: "", salePrice: "", quantity: "0",
   name: "", barcode: "", variantValues: {},
  });
  setEditingItemId(null);
  setEditingOtherItemId(null);
  setSubmitMessage({ type: "", text: "" });
 };

 const getCurrencySymbol = () => {
  return currencies.find((c) => c.code === parcelData.currency)?.symbol || "£";
 };

 const accountOptions = useMemo(
  () => [
   ...suppliers.map((s) => ({
    _id: `supplier:${s._id}`,
    name: formatSupplierDisplay({ name: s.name, contactPerson: s.contactPerson }),
    subtitle: "Supplier",
    searchText: buildSearchText(s.name, s.email, s.phone, s.contactPerson),
   })),
   ...customers.map((c) => ({
    _id: `customer:${c._id}`,
    name: c.name,
    subtitle: c.contactName?.trim() ? `Customer · ${c.contactName.trim()}` : "Customer",
    searchText: buildSearchText(c.name, c.email, c.phone, c.contactName),
   })),
  ],
  [suppliers, customers]
 );

 return {
  purchaseId,
  detailsSaved,
  handleSaveDetails,
  handleEditDetails,
  parcelData,
  quantityData,
  itemData,
  currencies,
  accountOptions,
  suppliers,
  sendToOptions,
  taxCategories,
  types,
  typesForNonSerial,
  makes,
  grades,
  brands,
  brandModels,
  capacities,
  colours,
  totalIMEIs,
  savedItems,
  savedIMEICount,
  status,
  setStatus,
  paymentStatus,
  setPaymentStatus,
  paid,
  setPaid,
  isLoadingData,
  loadError,
  isSubmitting,
  submitMessage,
  handleParcelChange,
  handleQuantityChange,
  handleItemChange,
  handleItemSubmit,
  handleAddItem,
  handleRemoveItem,
  handleEditItem,
  editingItemId,
  handleCancelEdit,
  handleBack,
  handleReset,
  getCurrencySymbol,
  itemMode,
  setItemMode,
  otherItemData,
  savedOtherItems,
  savedOtherQuantity,
  totalOtherQuantity,
  handleOtherItemChange,
  handleAddOtherItem,
  handleRemoveOtherItem,
  handleEditOtherItem,
  editingOtherItemId,
  handleCancelOtherEdit,
  categoryVariantAttributesImei,
  categoryVariantAttributesOther,
  getVariantOptionsForAttributeIndex,
  addValueAtPath,
  updateVariantValueAtPath,
  deleteVariantValueAtPath,
  handleItemVariantChange,
  handleItemVariantModelChange,
  handleOtherItemVariantChange,
  handleOtherItemVariantModelChange,
 };
};

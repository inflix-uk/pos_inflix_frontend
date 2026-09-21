"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ParcelData, QuantityData, ItemData, ItemEntry, Step, Currency, ItemMode, OtherItemData, OtherItemEntry, CategoryVariantAttribute, NonSerialSearchResult, SerialSearchResult } from "../types";
import { categoryApi } from "@/app/(routes)/inventory/category/service/categoryApi";
import { parseMultiIMEIs } from "../utils/parseMultiIMEIs";
import { formatSupplierDisplay } from "@/lib/formatSupplierDisplay";
import { formatProductName, formatProductNameInput } from "@/lib/formatProductName";
import { customerApi } from "@/app/(routes)/peoples/customers/service";
import { supplierApi } from "@/app/(routes)/peoples/suppliers/service/supplierApi";
import type { CustomerFormData } from "@/app/(routes)/peoples/customers/types";
import type { SupplierFormData } from "@/app/(routes)/peoples/suppliers/types";

import { API_BASE_URL as API_URL } from "@/lib/apiBase";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Fetch JSON with retry + backoff. Returns parsed body on `result.success`, otherwise throws.
const fetchJsonWithRetry = async <T,>(
 url: string,
 attempts = 3,
): Promise<T> => {
 let lastErr: unknown = new Error("Request failed");
 for (let i = 0; i < attempts; i++) {
  try {
   const response = await fetch(url, { headers: getAuthHeaders() });
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const result = (await response.json()) as { success?: boolean; data?: T };
   if (result.success && result.data !== undefined) return result.data;
   throw new Error("Bad response shape");
  } catch (err) {
   lastErr = err;
   if (i < attempts - 1) await sleep(500 * Math.pow(2, i)); // 500ms, 1s, 2s
  }
 }
 throw lastErr;
};

const CURRENCIES: Currency[] = [
 { code: "GBP", symbol: "£", name: "British Pound" },
 { code: "USD", symbol: "$", name: "US Dollar" },
 { code: "EUR", symbol: "€", name: "Euro" },
];

type CustomerListItem = { _id: string; name: string; email?: string; phone?: string; contactName?: string };
type SupplierListItem = { _id: string; name: string; email?: string; phone?: string; contactPerson?: string };
type AccountOption = { _id: string; name: string; subtitle?: string; searchText?: string };

const buildSearchText = (...parts: (string | undefined)[]) =>
 parts
  .filter(Boolean)
  .map((s) => String(s).toLowerCase())
  .join(" ");

const fetchCustomersList = async (): Promise<CustomerListItem[]> => {
 try {
  const response = await fetch(`${API_URL}/api/customers?limit=1000&isActive=true`, {
   headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (result.success && Array.isArray(result.data)) {
   return result.data as CustomerListItem[];
  }
 } catch (error) {
  console.error("Failed to fetch customers:", error);
 }
 return [];
};

const fetchSuppliersList = async (): Promise<SupplierListItem[]> => {
 try {
  const response = await fetch(`${API_URL}/api/suppliers?limit=1000&isActive=true`, {
   headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (result.success && Array.isArray(result.data)) {
   return result.data as SupplierListItem[];
  }
 } catch (error) {
  console.error("Failed to fetch suppliers:", error);
 }
 return [];
};

const toSupplierOptions = (list: SupplierListItem[]): AccountOption[] =>
 list.map((s) => ({
  _id: `supplier:${s._id}`,
  name: formatSupplierDisplay({ name: s.name, contactPerson: s.contactPerson }),
  subtitle: "Supplier",
  searchText: buildSearchText(s.name, s.email, s.phone, s.contactPerson),
 }));

const toCustomerOptions = (list: CustomerListItem[]): AccountOption[] =>
 list.map((c) => ({
  _id: `customer:${c._id}`,
  name: formatSupplierDisplay({ name: c.name, contactName: c.contactName }),
  subtitle: "Customer",
  searchText: buildSearchText(c.name, c.email, c.phone, c.contactName),
 }));

const STEPS = [
 { key: "parcel" as Step, label: "Add Purchase", number: 1 },
 { key: "quantity" as Step, label: "Quantity", number: 2 },
 { key: "item" as Step, label: "Item Entry", number: 3 },
];

const NOOP = () => {};

const normalizeAttribute = (a: {
 _id: string;
 name?: string;
 slug?: string;
 values?: {
  _id: string;
  name: string;
  slug?: string;
  models?: {
   _id: string;
   name: string;
   slug?: string;
   children?: { _id: string; name: string }[];
  }[];
 }[];
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

const hasSlug = (attrs: CategoryVariantAttribute[], ...candidates: string[]) =>
 attrs.some((a) => candidates.some((c) => (a.slug || "").toLowerCase() === c.toLowerCase()));

export const useAddPurchase = () => {
 const router = useRouter();
 const [currentStep, setCurrentStep] = useState<Step>("parcel");
 const [detailsSaved, setDetailsSaved] = useState(false);

 const [parcelData, setParcelData] = useState<ParcelData>({
  date: "2026-01-24",
  account: "",
  parcelNumber: "",
  note: "",
  currency: "GBP",
 });

 const [quantityData, setQuantityData] = useState<QuantityData>({
  date: "2026-01-24",
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
  variantValues: {},
  purchasePrice: "",
  salePrice: "",
  multiIMEIs: "",
  note: "",
 });

 const [itemMode, setItemMode] = useState<ItemMode>("imei");

 const [otherItemData, setOtherItemData] = useState<OtherItemData>({
  name: "",
  barcode: "",
  sendTo: "",
  taxCategory: "",
  type: "",
  make: "",
  grade: "",
  brand: "",
  brandModel: "",
  capacity: "",
  colour: "",
  variantValues: {},
  purchasePrice: "",
  salePrice: "",
  quantity: "0",
  note: "",
 });

 const [savedOtherItems, setSavedOtherItems] = useState<OtherItemEntry[]>([]);

 const currencies = CURRENCIES;

 const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
 const [accountOptions, setAccountOptions] = useState<{ _id: string; name: string; subtitle?: string; searchText?: string }[]>([]);
 const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
 const [addAccountSaving, setAddAccountSaving] = useState(false);
 const [sendToOptions, setSendToOptions] = useState<{ _id: string; name: string }[]>([]);
 const [taxCategories, setTaxCategories] = useState<{ _id: string; name: string; rate: number; type: string }[]>([]);
 const [types, setTypes] = useState<{ _id: string; name: string }[]>([]);
 const [typesForNonSerial, setTypesForNonSerial] = useState<{ _id: string; name: string }[]>([]);
 const [optionsError, setOptionsError] = useState<{ sendTo: boolean; tax: boolean; categories: boolean }>({
  sendTo: false,
  tax: false,
  categories: false,
 });
 const [optionsLoading, setOptionsLoading] = useState<boolean>(true);

 // Full variant attributes for selected category – one field per attribute (dynamic)
 const [categoryVariantAttributesImei, setCategoryVariantAttributesImei] = useState<CategoryVariantAttribute[]>([]);
 const [categoryVariantAttributesOther, setCategoryVariantAttributesOther] = useState<CategoryVariantAttribute[]>([]);
 const categoryIdImeiRef = useRef<string>("");
 const categoryIdOtherRef = useRef<string>("");
 // Cache attributes by category id for payload resolution (saved items may have different category)
 const attributesByCategoryIdRef = useRef<Record<string, CategoryVariantAttribute[]>>({});

 const loadAccounts = useCallback(async () => {
  const [supList, custList] = await Promise.all([fetchSuppliersList(), fetchCustomersList()]);
  setSuppliers(supList.map((s) => ({ _id: s._id, name: s.name })));
  setAccountOptions([...toSupplierOptions(supList), ...toCustomerOptions(custList)]);
 }, []);

 const refreshSuppliers = useCallback(async () => {
  const supList = await fetchSuppliersList();
  setSuppliers(supList.map((s) => ({ _id: s._id, name: s.name })));
  setAccountOptions((prev) => [
   ...toSupplierOptions(supList),
   ...prev.filter((o) => o._id.startsWith("customer:")),
  ]);
 }, []);

 const refreshCustomers = useCallback(async () => {
  const custList = await fetchCustomersList();
  setAccountOptions((prev) => [
   ...prev.filter((o) => o._id.startsWith("supplier:")),
   ...toCustomerOptions(custList),
  ]);
 }, []);

 const createCustomerFromParcel = async (data: {
  name: string;
  email: string;
  phone: string;
  address: CustomerFormData["address"];
  companyNumber?: string;
  contactName?: string;
  mobile?: string;
  vatNumber?: string;
  currency?: string;
  isActive: boolean;
 }) => {
  setAddAccountSaving(true);
  try {
   const payload: CustomerFormData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    companyNumber: data.companyNumber,
    contactName: data.contactName,
    mobile: data.mobile,
    vatNumber: data.vatNumber,
    currency: data.currency,
    isActive: data.isActive,
   };
   const res = await customerApi.create(payload);
   if (res.success && res.data?._id) {
    await refreshCustomers();
    setParcelData((prev) => ({ ...prev, account: `customer:${res.data._id}` }));
    setAddAccountModalOpen(false);
   } else {
    window.alert((res as { message?: string }).message || "Failed to create customer");
   }
  } catch {
   window.alert("Failed to create customer");
  } finally {
   setAddAccountSaving(false);
  }
 };

 const createSupplierFromParcel = async (data: SupplierFormData) => {
  setAddAccountSaving(true);
  try {
   const res = await supplierApi.createSupplier(data);
   const created = res.data as { _id?: string } | undefined;
   if (res.success && created?._id) {
    await refreshSuppliers();
    setParcelData((prev) => ({ ...prev, account: `supplier:${created._id}` }));
    setAddAccountModalOpen(false);
   } else {
    window.alert((res as { message?: string }).message || "Failed to create supplier");
   }
  } catch {
   window.alert("Failed to create supplier");
  } finally {
   setAddAccountSaving(false);
  }
 };

 const fetchLocations = useCallback(async () => {
  try {
   const data = await fetchJsonWithRetry<{ _id: string; name: string }[]>(
    `${API_URL}/api/locations?limit=1000&isActive=true`,
   );
   setSendToOptions(data.map((l) => ({ _id: l._id, name: l.name })));
   setOptionsError((p) => ({ ...p, sendTo: false }));
  } catch (error) {
   console.error("Failed to fetch locations:", error);
   setOptionsError((p) => ({ ...p, sendTo: true }));
  }
 }, []);

 const fetchTaxCategories = useCallback(async () => {
  try {
   const data = await fetchJsonWithRetry<{ _id: string; name: string; rate: number; type: string }[]>(
    `${API_URL}/api/settings/taxes/active`,
   );
   setTaxCategories(data.map((t) => ({ _id: t._id, name: t.name, rate: t.rate, type: t.type })));
   setOptionsError((p) => ({ ...p, tax: false }));
  } catch (error) {
   console.error("Failed to fetch tax categories:", error);
   setOptionsError((p) => ({ ...p, tax: true }));
  }
 }, []);

 const fetchTypes = useCallback(async () => {
  try {
   const list = await fetchJsonWithRetry<{ _id: string; name: string; itemType?: string }[]>(
    `${API_URL}/api/categories?limit=1000&isActive=true`,
   );
   // IMEI tab: only serial or both; treat missing/legacy as serial-only so they don't appear in non-serial
   const forSerial = list.filter((c) => {
    const t = c.itemType ?? "";
    return t === "serial" || t === "both" || t === "";
   });
   // Non-serial tab: only non-serial or both (exclude serial and legacy)
   const forNonSerial = list.filter((c) => {
    const t = c.itemType ?? "";
    return t === "non-serial" || t === "both";
   });
   // Pin "mobile" first, then "tablets"/"tablet", preserve original order for the rest
   const priorityRank = (name: string): number => {
    const n = name.trim().toLowerCase();
    if (n.startsWith("mobile")) return 0;
    if (n.startsWith("tablet")) return 1;
    return 2;
   };
   const sortByPriority = (arr: { _id: string; name: string }[]) =>
    arr
     .map((c, i) => ({ c, i }))
     .sort((a, b) => {
      const ra = priorityRank(a.c.name);
      const rb = priorityRank(b.c.name);
      if (ra !== rb) return ra - rb;
      return a.i - b.i;
     })
     .map(({ c }) => c);
   setTypes(sortByPriority(forSerial.map((c) => ({ _id: c._id, name: c.name }))));
   setTypesForNonSerial(sortByPriority(forNonSerial.map((c) => ({ _id: c._id, name: c.name }))));
   setOptionsError((p) => ({ ...p, categories: false }));
  } catch (error) {
   console.error("Failed to fetch categories:", error);
   setOptionsError((p) => ({ ...p, categories: true }));
  }
 }, []);

 const loadAllOptions = useCallback(async () => {
  setOptionsLoading(true);
  await Promise.all([fetchLocations(), fetchTaxCategories(), fetchTypes()]);
  setOptionsLoading(false);
 }, [fetchLocations, fetchTaxCategories, fetchTypes]);

 const retryFailedOptions = useCallback(async () => {
  const tasks: Promise<void>[] = [];
  if (optionsError.sendTo) tasks.push(fetchLocations());
  if (optionsError.tax) tasks.push(fetchTaxCategories());
  if (optionsError.categories) tasks.push(fetchTypes());
  if (tasks.length === 0) return;
  setOptionsLoading(true);
  await Promise.all(tasks);
  setOptionsLoading(false);
 }, [optionsError, fetchLocations, fetchTaxCategories, fetchTypes]);

 useEffect(() => {
  loadAccounts();
  loadAllOptions();
 }, [loadAccounts, loadAllOptions]);

 // Auto-refetch on window focus if any source previously failed (heals stale state)
 useEffect(() => {
  if (typeof window === "undefined") return;
  const onFocus = () => {
   if (optionsError.sendTo || optionsError.tax || optionsError.categories) {
    retryFailedOptions();
   }
  };
  window.addEventListener("focus", onFocus);
  return () => window.removeEventListener("focus", onFocus);
 }, [optionsError, retryFailedOptions]);

 // Default "Send to" to Shop (or first location) and tax to first option when options load
 useEffect(() => {
  if (sendToOptions.length === 0) return;
  const defaultSendTo =
   sendToOptions.find((l) => l.name.toLowerCase().trim() === "shop")?._id || sendToOptions[0]?._id || "";
  setItemData((prev) => (prev.sendTo === "" && defaultSendTo ? { ...prev, sendTo: defaultSendTo } : prev));
  setOtherItemData((prev) => (prev.sendTo === "" && defaultSendTo ? { ...prev, sendTo: defaultSendTo } : prev));
 }, [sendToOptions]);

 useEffect(() => {
  if (taxCategories.length === 0) return;
  const defaultTax = taxCategories[0]?._id || "";
  setItemData((prev) => (prev.taxCategory === "" && defaultTax ? { ...prev, taxCategory: defaultTax } : prev));
  setOtherItemData((prev) => (prev.taxCategory === "" && defaultTax ? { ...prev, taxCategory: defaultTax } : prev));
 }, [taxCategories]);

 const [makes, setMakes] = useState<{ _id: string; name: string }[]>([]);

 const fetchSubCategories = useCallback(async (categoryId: string) => {
  if (!categoryId) {
   setMakes([]);
   return;
  }
  try {
   const response = await fetch(`${API_URL}/api/subcategories/category/${categoryId}`, {
    headers: getAuthHeaders(),
   });
   const result = await response.json();
   if (result.success && result.data) {
    setMakes(result.data.map((s: { _id: string; name: string }) => ({ _id: s._id, name: s.name })));
   }
  } catch (error) {
   console.error("Failed to fetch subcategories:", error);
  }
 }, []);

 /** Get options for attribute at index from the tree; path = selected ids for previous attributes. */
 const getVariantOptionsForAttributeIndex = useCallback((
  attributes: CategoryVariantAttribute[],
  variantValues: Record<string, string>,
  attributeIndex: number
 ): { _id: string; name: string }[] => {
  if (!attributes.length || attributeIndex < 0) return [];
  const treeValues = attributes[0].values || [];
  if (attributeIndex === 0) {
   return treeValues.map((v) => ({ _id: v._id, name: v.name }));
  }
  const path = attributes.slice(0, attributeIndex).map((a) => variantValues[a._id]).filter(Boolean);
  if (path.length !== attributeIndex) return []; // parent not selected
  type Node = { _id: string; name: string; models?: Node[]; children?: Node[] };
  let nodes: Node[] = treeValues as Node[];
  for (let i = 0; i < path.length; i++) {
   const node = nodes.find((n) => n._id === path[i]);
   if (!node) return [];
   nodes = i === 0 ? (node.models || []) : (node.children || []);
  }
  return nodes.map((n) => ({ _id: n._id, name: n.name }));
 }, []);

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
  // Drop previous category's tree immediately so add-at-path never uses stale attribute ids
  // while the new category's request is in flight.
  delete attributesByCategoryIdRef.current[categoryId];
  if (forImei) {
   categoryIdImeiRef.current = "";
   setCategoryVariantAttributesImei([]);
  } else {
   categoryIdOtherRef.current = "";
   setCategoryVariantAttributesOther([]);
  }
  try {
   const response = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, {
    headers: getAuthHeaders(),
   });
   const result = await response.json();
   if (result.success && result.data && Array.isArray(result.data)) {
    // Use API order = Edit Category "Display order (top to bottom)" (do not reorder)
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
    if (forImei) {
     categoryIdImeiRef.current = "";
     setCategoryVariantAttributesImei([]);
    } else {
     categoryIdOtherRef.current = "";
     setCategoryVariantAttributesOther([]);
    }
   }
  } catch (error) {
   console.error("Failed to fetch category variant attributes:", error);
   if (forImei) {
    categoryIdImeiRef.current = "";
    setCategoryVariantAttributesImei([]);
   } else {
    categoryIdOtherRef.current = "";
    setCategoryVariantAttributesOther([]);
   }
  }
 }, []);
 const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);

 useEffect(() => {
  const fetchGrades = async () => {
   try {
    const response = await fetch(`${API_URL}/api/variant-attributes/slug/grade`, {
     headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success && result.data && result.data.values) {
     setGrades(
      result.data.values
       .filter((v: { isActive: boolean }) => v.isActive)
       .map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name }))
     );
    }
   } catch (error) {
    console.error("Failed to fetch grades:", error);
   }
  };
  fetchGrades();
 }, []);

 const [brands, setBrands] = useState<{ _id: string; name: string }[]>([]);
 const [brandModels, setBrandModels] = useState<{ _id: string; name: string }[]>([]);
 const [capacities, setCapacities] = useState<{ _id: string; name: string }[]>([]);
 const [colours, setColours] = useState<{ _id: string; name: string }[]>([]);
 const [brandsRaw, setBrandsRaw] = useState<{ _id: string; name: string; models: { _id: string; name: string }[] }[]>([]);
 const [brandsAttributeId, setBrandsAttributeId] = useState<string>("");
 const brandsAttributeIdRef = useRef<string>("");
 const attributeIdBySlugRef = useRef<Record<string, string>>({});

 useEffect(() => {
  const fetchVariantBySlug = async (slug: string) => {
   try {
    const response = await fetch(`${API_URL}/api/variant-attributes/slug/${slug}`, {
     headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success && result.data && result.data.values) {
     const attributeId = result.data._id != null ? String(result.data._id) : "";
     return { values: result.data.values.filter((v: { isActive?: boolean }) => v.isActive !== false), attributeId };
    }
   } catch (error) {
    console.error(`Failed to fetch ${slug}:`, error);
   }
   return { values: [], attributeId: "" };
  };

  const fetchAll = async () => {
   const [brandsResult, storageResult, colorResult] = await Promise.all([
    fetchVariantBySlug("brands"),
    fetchVariantBySlug("storage"),
    fetchVariantBySlug("color"),
   ]);
   const brandsData = (brandsResult as { values: { _id: string; name: string; models?: { _id: string; name: string }[] }[] }).values;
   const storageData = (storageResult as { values: { _id: string; name: string }[] }).values;
   const colorData = (colorResult as { values: { _id: string; name: string }[] }).values;
   const attrId = (brandsResult as { attributeId?: string }).attributeId || "";
   brandsAttributeIdRef.current = attrId;
   setBrandsAttributeId(attrId);
   const storageAttrId = (storageResult as { attributeId?: string }).attributeId || "";
   const colorAttrId = (colorResult as { attributeId?: string }).attributeId || "";
   if (storageAttrId) {
    attributeIdBySlugRef.current["storage"] = storageAttrId;
    attributeIdBySlugRef.current["capacity"] = storageAttrId;
   }
   if (colorAttrId) {
    attributeIdBySlugRef.current["color"] = colorAttrId;
    attributeIdBySlugRef.current["colour"] = colorAttrId;
   }
   setBrands(brandsData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
   setBrandsRaw(brandsData.map((v: { _id: string; name: string; models?: { _id: string; name: string }[] }) => ({ _id: v._id, name: v.name, models: v.models || [] })));
   setCapacities(storageData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
   setColours(colorData.map((v: { _id: string; name: string }) => ({ _id: v._id, name: v.name })));
  };
  fetchAll();
 }, []);

 const getBrandsAttributeId = async (): Promise<string> => {
  if (brandsAttributeIdRef.current) return brandsAttributeIdRef.current;
  for (const slug of ["brands", "brand"]) {
   try {
    const response = await fetch(`${API_URL}/api/variant-attributes/slug/${slug}`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data && result.data._id) {
     const id = String(result.data._id);
     brandsAttributeIdRef.current = id;
     setBrandsAttributeId(id);
     return id;
    }
   } catch (e) {
    console.error(`getBrandsAttributeId slug ${slug} failed`, e);
   }
  }
  return "";
 };

 const addBrand = async (name: string): Promise<string | null> => {
  if (!name.trim()) return null;
  const attrId = await getBrandsAttributeId();
  if (!attrId) {
   console.error("Add brand: could not get brands attribute id");
   return null;
  }
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/${attrId}/values`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: name.trim() }),
   });
   const result = await response.json();
   if (!result.success || !result.data) {
    console.error("Add brand failed:", result.message || response.status, result);
    return null;
   }
   const v = result.data as { _id: string; name: string; models?: { _id: string; name: string }[] };
   const id = v._id != null ? String(v._id) : "";
   if (id) {
    setBrands((prev) => [...prev, { _id: id, name: v.name }]);
    setBrandsRaw((prev) => [...prev, { _id: id, name: v.name, models: v.models || [] }]);
    return id;
   }
  } catch (error) {
   console.error("Failed to add brand:", error);
  }
  return null;
 };

 const addModelUnderBrand = async (brandId: string, modelName: string): Promise<string | null> => {
  if (!brandId || !modelName.trim()) return null;
  const attrId = await getBrandsAttributeId();
  if (!attrId) return null;
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/${attrId}/values/${String(brandId)}/models`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: modelName.trim() }),
   });
   const result = await response.json();
   if (!result.success || !result.data) {
    console.error("Add model failed:", result.message || response.status, result);
    return null;
   }
   const m = result.data as { _id: string; name: string };
   const id = m._id != null ? String(m._id) : "";
   if (id) {
    setBrandModels((prev) => [...prev, { _id: id, name: m.name }]);
    setBrandsRaw((prev) =>
     prev.map((b) =>
      b._id === brandId ? { ...b, models: [...(b.models || []), { _id: id, name: m.name }] } : b
     )
    );
    return id;
   }
  } catch (error) {
   console.error("Failed to add model:", error);
  }
  return null;
 };

 const getAttributeIdBySlug = async (slug: string, aliases: string[] = []): Promise<string> => {
  for (const s of [slug, ...aliases]) {
   if (s && attributeIdBySlugRef.current[s]) return attributeIdBySlugRef.current[s];
  }
  for (const s of [slug, ...aliases]) {
   if (!s) continue;
   try {
    const response = await fetch(`${API_URL}/api/variant-attributes/slug/${s}`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (result.success && result.data && result.data._id) {
     const id = String(result.data._id);
     attributeIdBySlugRef.current[s] = id;
     attributeIdBySlugRef.current[slug] = id;
     return id;
    }
   } catch (e) {
    console.error(`getAttributeIdBySlug ${s} failed`, e);
   }
  }
  return "";
 };

 const addVariantValue = async (
  slugKey: "storage" | "color" | "grade",
  name: string
 ): Promise<string | null> => {
  if (!name.trim()) return null;
  const slugAliases: Record<string, string[]> = {
   storage: ["storage", "capacity"],
   color: ["color", "colour"],
   grade: ["grade"],
  };
  const slugs = [slugKey, ...(slugAliases[slugKey] || [])].filter((s, i, a) => a.indexOf(s) === i);
  const attrId = await getAttributeIdBySlug(slugs[0], slugs.slice(1));
  if (!attrId) {
   console.error(`Add ${slugKey}: could not get attribute id`);
   return null;
  }
  try {
   const response = await fetch(`${API_URL}/api/variant-attributes/${attrId}/values`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: name.trim() }),
   });
   const result = await response.json();
   if (!result.success || !result.data) {
    console.error(`Add ${slugKey} failed:`, result.message || response.status, result);
    return null;
   }
   const v = result.data as { _id: string; name: string };
   const id = v._id != null ? String(v._id) : "";
   if (id) {
    if (slugKey === "storage") setCapacities((prev) => [...prev, { _id: id, name: v.name }]);
    else if (slugKey === "color") setColours((prev) => [...prev, { _id: id, name: v.name }]);
    else if (slugKey === "grade") setGrades((prev) => [...prev, { _id: id, name: v.name }]);
    return id;
   }
  } catch (error) {
   console.error(`Failed to add ${slugKey}:`, error);
  }
  return null;
 };

 const addCapacity = (name: string) => addVariantValue("storage", name);
 const addColour = (name: string) => addVariantValue("color", name);
 const addGrade = (name: string) => addVariantValue("grade", name);

 const addValueForAttribute = async (
  categoryId: string,
  attributeId: string,
  name: string
 ): Promise<string | null> => {
  if (!categoryId || !name.trim()) return null;
  try {
   const response = await fetch(
    `${API_URL}/api/categories/${categoryId}/variant-attributes/${attributeId}/values`,
    {
     method: "POST",
     headers: getAuthHeaders(),
     body: JSON.stringify({ name: name.trim() }),
    }
   );
   const result = await response.json();
   if (!result.success || !result.data) {
    console.error("Add value failed:", result.message || response.status, result);
    return null;
   }
   const v = result.data as { _id: string; name: string; models?: { _id: string; name: string }[] };
   const id = v._id != null ? String(v._id) : "";
   if (!id) return null;
   const newVal = { _id: id, name: v.name, models: v.models || [] };
   const updateList = (list: CategoryVariantAttribute[]) =>
    list.map((attr) =>
     attr._id === attributeId ? { ...attr, values: [...attr.values, newVal] } : attr
    );
   if (attributesByCategoryIdRef.current[categoryId]) {
    attributesByCategoryIdRef.current[categoryId] = updateList(attributesByCategoryIdRef.current[categoryId]);
   }
   if (categoryIdImeiRef.current === categoryId) {
    setCategoryVariantAttributesImei((prev) => updateList(prev));
   }
   if (categoryIdOtherRef.current === categoryId) {
    setCategoryVariantAttributesOther((prev) => updateList(prev));
   }
   return id;
  } catch (error) {
   console.error("Failed to add value:", error);
   return null;
  }
 };

 const addModelForAttribute = async (
  categoryId: string,
  attributeId: string,
  valueId: string,
  modelName: string
 ): Promise<string | null> => {
  if (!categoryId || !modelName.trim()) return null;
  try {
   const response = await fetch(
    `${API_URL}/api/categories/${categoryId}/variant-attributes/${attributeId}/values/${valueId}/models`,
    {
     method: "POST",
     headers: getAuthHeaders(),
     body: JSON.stringify({ name: modelName.trim() }),
    }
   );
   const result = await response.json();
   if (!result.success || !result.data) {
    console.error("Add model failed:", result.message || response.status, result);
    return null;
   }
   const m = result.data as { _id: string; name: string };
   const id = m._id != null ? String(m._id) : "";
   if (!id) return null;
   const newModel = { _id: id, name: m.name, children: [] };
   const updateList = (list: CategoryVariantAttribute[]) =>
    list.map((attr) =>
     attr._id === attributeId
      ? {
        ...attr,
        values: attr.values.map((val) =>
         val._id === valueId
          ? { ...val, models: [...(val.models || []), newModel] }
          : val
        ),
       }
      : attr
    );
   if (attributesByCategoryIdRef.current[categoryId]) {
    attributesByCategoryIdRef.current[categoryId] = updateList(attributesByCategoryIdRef.current[categoryId]);
   }
   if (categoryIdImeiRef.current === categoryId) {
    setCategoryVariantAttributesImei((prev) => updateList(prev));
   }
   if (categoryIdOtherRef.current === categoryId) {
    setCategoryVariantAttributesOther((prev) => updateList(prev));
   }
   return id;
  } catch (error) {
   console.error("Failed to add model:", error);
   return null;
  }
 };

 /** Add a child under a model (e.g. Condition under Model). Used for attribute index >= 2. */
 const addChildForModelAttribute = async (
  categoryId: string,
  firstAttributeId: string,
  valueId: string,
  modelId: string,
  name: string
 ): Promise<string | null> => {
  return addValueAtPath(categoryId, firstAttributeId, [valueId, modelId], name);
 };

 /** Add a variant value at any level (fully dynamic for any category and any number of attributes). */
 const addValueAtPath = async (
  categoryId: string,
  firstAttributeId: string,
  parentPath: string[],
  name: string
 ): Promise<string | null> => {
  if (!categoryId || !name.trim()) return null;
  const loaded = attributesByCategoryIdRef.current[categoryId];
  const rootAttrId = loaded?.[0]?._id;
  if (loaded && loaded.length > 0 && rootAttrId && rootAttrId !== firstAttributeId) {
   console.warn("addValueAtPath: attribute root mismatch for category; refresh category and try again.");
   return null;
  }
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
   if (!result.success || !result.data) {
    console.error("Add value at path failed:", result.message || response.status, result);
    return null;
   }
   const data = result.data as { _id: string; name: string; models?: unknown[]; slug?: string; isActive?: boolean };
   const id = data._id != null ? String(data._id) : "";
   if (!id) return null;

   const refetched = await fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, {
    headers: getAuthHeaders(),
   }).then((r) => r.json());
   if (refetched.success && refetched.data && Array.isArray(refetched.data)) {
    const list = (refetched.data as Parameters<typeof normalizeAttribute>[0][]).map(normalizeAttribute);
    attributesByCategoryIdRef.current[categoryId] = list;
    if (categoryIdImeiRef.current === categoryId) {
     setCategoryVariantAttributesImei(list);
    }
    if (categoryIdOtherRef.current === categoryId) {
     setCategoryVariantAttributesOther(list);
    }
   }
   return id;
  } catch (error) {
   console.error("Failed to add value at path:", error);
   return null;
  }
 };

 /** Update (rename) a variant value at path. path = full path including node id. */
 const updateVariantValueAtPath = async (
  categoryId: string,
  firstAttributeId: string,
  path: string[],
  newName: string
 ): Promise<{ ok: boolean; message?: string }> => {
  if (!categoryId || !newName.trim() || path.length === 0) return { ok: false, message: "Missing data" };
  try {
   const response = await fetch(
    `${API_URL}/api/categories/${categoryId}/variant-attributes/${firstAttributeId}/values/update-at-path`,
    {
     method: "PUT",
     headers: getAuthHeaders(),
     body: JSON.stringify({ path, name: newName.trim() }),
    }
   );
   const result = await response.json();
   if (!result.success) {
    return { ok: false, message: result.message || "Failed to rename." };
   }
   const name = (result.data as { name?: string })?.name ?? newName.trim().toUpperCase();
   type TreeVal = { _id: string; name: string; models?: TreeVal[]; children?: TreeVal[] };
   const updateNameAtPath = (nodes: TreeVal[], p: string[], name: string, nextIsModels: boolean): TreeVal[] => {
    if (p.length === 0) return nodes;
    const [head, ...rest] = p;
    const key = nextIsModels ? "models" : "children";
    return nodes.map((n) => {
     if (n._id !== head) return n;
     if (rest.length === 0) return { ...n, name };
     const arr = n[key] || [];
     return { ...n, [key]: updateNameAtPath(arr, rest, name, false) };
    });
   };
   const updateList = (list: CategoryVariantAttribute[]) =>
    list.map((attr) =>
     attr._id === firstAttributeId
      ? { ...attr, values: updateNameAtPath(attr.values as TreeVal[], path, name, true) }
      : attr
    );
   if (attributesByCategoryIdRef.current[categoryId]) {
    attributesByCategoryIdRef.current[categoryId] = updateList(attributesByCategoryIdRef.current[categoryId]);
   }
   if (categoryIdImeiRef.current === categoryId) {
    setCategoryVariantAttributesImei((prev) => updateList(prev));
   }
   if (categoryIdOtherRef.current === categoryId) {
    setCategoryVariantAttributesOther((prev) => updateList(prev));
   }
   return { ok: true };
  } catch (error) {
   console.error("Failed to update variant at path:", error);
   return { ok: false, message: "Failed to rename." };
  }
 };

 /** Delete a variant value at path. path = full path including node id. When in use, pass replacementValueName. Returns true, false, or { ok: false, inUse: true, count, replacementOptions }. */
 const deleteVariantValueAtPath = async (
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
    console.error("Delete variant at path failed:", result.message, result);
    return false;
   }
   type TreeVal = { _id: string; name: string; models?: TreeVal[]; children?: TreeVal[] };
   const removeAtPath = (nodes: TreeVal[], p: string[], nextIsModels: boolean): TreeVal[] => {
    if (p.length === 0) return nodes;
    const [head, ...rest] = p;
    const key = nextIsModels ? "models" : "children";
    if (rest.length === 0) {
     return nodes.filter((n) => n._id !== head);
    }
    return nodes.map((n) => {
     if (n._id !== head) return n;
     const arr = n[key] || [];
     return { ...n, [key]: removeAtPath(arr, rest, false) };
    });
   };
   const updateList = (list: CategoryVariantAttribute[]) =>
    list.map((attr) =>
     attr._id === firstAttributeId
      ? { ...attr, values: removeAtPath(attr.values as TreeVal[], path, true) }
      : attr
    );
   if (attributesByCategoryIdRef.current[categoryId]) {
    attributesByCategoryIdRef.current[categoryId] = updateList(attributesByCategoryIdRef.current[categoryId]);
   }
   if (categoryIdImeiRef.current === categoryId) {
    setCategoryVariantAttributesImei((prev) => updateList(prev));
   }
   if (categoryIdOtherRef.current === categoryId) {
    setCategoryVariantAttributesOther((prev) => updateList(prev));
   }
   return true;
  } catch (error) {
   console.error("Failed to delete variant at path:", error);
   return false;
  }
 };

 const currentFormIMEICount = useMemo(() => {
  if (!itemData.multiIMEIs.trim()) return 0;
  return parseMultiIMEIs(itemData.multiIMEIs).length;
 }, [itemData.multiIMEIs]);

 const [savedItems, setSavedItems] = useState<ItemEntry[]>([]);

 const savedIMEICount = useMemo(() => savedItems.reduce((sum, item) => sum + item.imeiCount, 0), [savedItems]);
 const totalIMEIs = savedIMEICount + currentFormIMEICount;

 const savedOtherQuantity = useMemo(
  () => savedOtherItems.reduce((sum, item) => sum + item.quantity, 0),
  [savedOtherItems]
 );
 const currentOtherQuantity = parseInt(otherItemData.quantity) || 0;
 const totalOtherQuantity = savedOtherQuantity + currentOtherQuantity;

 const buildSpecsSummary = () => {
  const attrs = categoryVariantAttributesImei;
  const vv = itemData.variantValues || {};
  if (attrs.length > 0) {
   const parts: string[] = [];
   for (let i = 0; i < attrs.length; i++) {
    const name = getVariantValueName(attrs, vv, i);
    if (name) parts.push(name);
   }
   return parts.length > 0 ? parts.join(" / ") : "Item";
  }
  const brandName = brands.find((b) => b._id === itemData.brand)?.name;
  const modelName = brandModels.find((m) => m._id === itemData.brandModel)?.name;
  const capName = capacities.find((c) => c._id === itemData.capacity)?.name;
  const parts: string[] = [];
  if (brandName) parts.push(brandName);
  if (modelName) parts.push(modelName);
  if (capName) parts.push(capName);
  return parts.length > 0 ? parts.join(" / ") : "Item";
 };

 const handleAddItem = () => {
  if (currentFormIMEICount === 0) return;

  if (!isSerialItemVariantComplete(itemData)) {
   setSubmitMessage({
    type: "error",
    text: "Please fill all variant attributes (e.g. Category and every attribute below) before adding serial items.",
   });
   return;
  }

  const pp = parseFloat(itemData.purchasePrice);
  const sp = parseFloat(itemData.salePrice);
  if (!Number.isFinite(pp) || pp <= 0 || !Number.isFinite(sp) || sp <= 0) {
   setSubmitMessage({
    type: "error",
    text: "Enter purchase price and sale price (each must be greater than zero).",
   });
   return;
  }

  // Check cross-item IMEI duplicates
  const currentIMEIs = parseMultiIMEIs(itemData.multiIMEIs);
  const allSavedIMEIs = savedItems.flatMap((item) => parseMultiIMEIs(item.data.multiIMEIs));
  const savedU = new Set(allSavedIMEIs.map((x) => x.toUpperCase()));
  const duplicate = currentIMEIs.find((sn) => savedU.has(sn.toUpperCase()));
  if (duplicate) {
   setSubmitMessage({ type: "error", text: `Duplicate serial "${duplicate}" is already in another item group!` });
   return;
  }

  const entry: ItemEntry = {
   id: Date.now().toString(),
   data: { ...itemData },
   imeiCount: currentFormIMEICount,
   specsSummary: buildSpecsSummary(),
  };
  setSavedItems((prev) => [...prev, entry]);
  // Keep filled fields so the next batch can reuse them — only clear the IMEI list that was just added.
  setItemData((prev) => ({ ...prev, multiIMEIs: "" }));
  setSubmitMessage({ type: "", text: "" });
 };

 const handleRemoveItem = useCallback((id: string) => {
  setSavedItems((prev) => prev.filter((item) => item.id !== id));
 }, []);

 const handleEditItem = (id: string) => {
  const entry = savedItems.find((item) => item.id === id);
  if (!entry) return;
  setItemData({ ...entry.data });
  setSavedItems((prev) => prev.filter((item) => item.id !== id));
  // Trigger dependent dropdowns and category variant attributes
  if (entry.data.type) {
   fetchSubCategories(entry.data.type);
   fetchCategoryVariantAttributes(entry.data.type, true);
  }
  if (entry.data.brand) {
   const selected = brandsRaw.find((b) => b._id === entry.data.brand);
   setBrandModels(selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || []);
  }
 };

 // Other items handlers
 const buildOtherSpecsSummary = () => {
  if (otherItemData.name && otherItemData.name.trim()) return otherItemData.name.trim();
  const attrs = categoryVariantAttributesOther;
  const vv = otherItemData.variantValues || {};
  if (attrs.length > 0) {
   const parts: string[] = [];
   for (let i = 0; i < attrs.length; i++) {
    const name = getVariantValueName(attrs, vv, i);
    if (name) parts.push(name);
   }
   return parts.length > 0 ? parts.join(" / ") : "Item";
  }
  const brandName = brands.find((b) => b._id === otherItemData.brand)?.name;
  const modelName = brandModels.find((m) => m._id === otherItemData.brandModel)?.name;
  const capName = capacities.find((c) => c._id === otherItemData.capacity)?.name;
  const parts: string[] = [];
  if (brandName) parts.push(brandName);
  if (modelName) parts.push(modelName);
  if (capName) parts.push(capName);
  return parts.length > 0 ? parts.join(" / ") : "Item";
 };

 const handleOtherItemChange = useCallback((field: keyof OtherItemData, value: string) => {
  if (field === "type") {
   setOtherItemData((prev) => ({ ...prev, [field]: value, make: "", variantValues: {} }));
   fetchSubCategories(value);
   fetchCategoryVariantAttributes(value, false);
  } else if (field === "brand") {
   setOtherItemData((prev) => ({ ...prev, [field]: value, brandModel: "" }));
   const selected = brandsRaw.find((b) => b._id === value);
   setBrandModels(selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || []);
  } else if (field === "name") {
   setOtherItemData((prev) => ({ ...prev, [field]: formatProductNameInput(value) }));
  } else if (field === "quantity") {
   setOtherItemData((prev) => ({ ...prev, quantity: value }));
   setSubmitMessage({ type: "", text: "" });
  } else {
   setOtherItemData((prev) => ({ ...prev, [field]: value }));
  }
 }, [brandsRaw, fetchSubCategories, fetchCategoryVariantAttributes]);

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

  // Duplicate barcode in this parcel
  const barcodeTrim = (otherItemData.barcode || "").trim();
  if (barcodeTrim) {
   const duplicate = savedOtherItems.some(
    (item) => (item.data.barcode || "").trim().toLowerCase() === barcodeTrim.toLowerCase()
   );
   if (duplicate) {
    setSubmitMessage({
     type: "error",
     text: `Barcode "${barcodeTrim}" is already used in this purchase. Each barcode must be unique.`,
    });
    return;
   }
  }

  const entry: OtherItemEntry = {
   id: Date.now().toString(),
   data: { ...otherItemData },
   quantity: currentOtherQuantity,
   specsSummary: buildOtherSpecsSummary(),
  };
  setSavedOtherItems((prev) => [...prev, entry]);
  // Keep filled fields so the next non-serial item can reuse them — only clear barcode (must be unique) and reset quantity.
  setOtherItemData((prev) => ({ ...prev, barcode: "", quantity: "0" }));
  setSubmitMessage({ type: "", text: "" });
 };

 const handleRemoveOtherItem = useCallback((id: string) => {
  setSavedOtherItems((prev) => prev.filter((item) => item.id !== id));
 }, []);

 const handleEditOtherItem = (id: string) => {
  const entry = savedOtherItems.find((item) => item.id === id);
  if (!entry) return;
  setOtherItemData({ ...entry.data });
  setSavedOtherItems((prev) => prev.filter((item) => item.id !== id));
  // Trigger dependent dropdowns and category variant attributes
  if (entry.data.type) {
   fetchSubCategories(entry.data.type);
   fetchCategoryVariantAttributes(entry.data.type, false);
  }
  if (entry.data.brand) {
   const selected = brandsRaw.find((b) => b._id === entry.data.brand);
   setBrandModels(selected?.models?.map((m) => ({ _id: m._id, name: m.name })) || []);
  }
 };

 const steps = STEPS;

 const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

 const handleParcelChange = useCallback((field: keyof ParcelData, value: string) => {
  setParcelData((prev) => ({ ...prev, [field]: value }));
 }, []);

 const handleQuantityChange = useCallback((field: keyof QuantityData, value: string) => {
  setQuantityData((prev) => ({ ...prev, [field]: value }));
 }, []);

 const handleItemChange = useCallback((field: keyof ItemData, value: string) => {
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
 }, [brandsRaw, fetchSubCategories, fetchCategoryVariantAttributes]);

 const toUpper = (s: string | undefined) => (s != null && String(s).trim() !== "" ? String(s).trim().toUpperCase() : s);

 /** Get display name for the selected value of attribute at index from the tree. */
 const getVariantValueName = (
  attributes: CategoryVariantAttribute[],
  variantValues: Record<string, string>,
  attributeIndex: number
 ): string | undefined => {
  const options = getVariantOptionsForAttributeIndex(attributes, variantValues, attributeIndex);
  const attr = attributes[attributeIndex];
  if (!attr) return undefined;
  const selectedId = variantValues[attr._id];
  if (!selectedId) return undefined;
  const node = options.find((o) => o._id === selectedId);
  return node?.name;
 };

 const resolveVariantValues = (
  attrs: CategoryVariantAttribute[],
  variantValues: Record<string, string>
 ): {
  grade?: string;
  brand?: string;
  brandModel?: string;
  capacity?: string;
  colour?: string;
  variantValues: { slug: string; value: string }[];
 } => {
  const list: { slug: string; value: string }[] = [];
  const fixed: { grade?: string; brand?: string; brandModel?: string; capacity?: string; colour?: string } = {};
  for (let i = 0; i < attrs.length; i++) {
   const attr = attrs[i];
   const valueName = getVariantValueName(attrs, variantValues, i);
   if (!valueName) continue;
   const slug = attr.slug;
   const valueUpper = toUpper(valueName) ?? valueName;
   list.push({ slug, value: valueUpper });
   if (slug === "grade" || slug === "condition") fixed.grade = valueUpper;
   else if (slug === "brands" || slug === "brand") fixed.brand = valueUpper;
   else if (slug === "brand_model" || slug === "model") fixed.brandModel = valueUpper;
   else if (slug === "storage" || slug === "capacity") fixed.capacity = valueUpper;
   else if (slug === "color" || slug === "colour") fixed.colour = valueUpper;
  }
  return { ...fixed, variantValues: list };
 };

 const handleItemVariantChange = (attributeId: string, valueId: string) => {
  setItemData((prev) => {
   const attrs = categoryVariantAttributesImei;
   const idx = attrs.findIndex((a) => a._id === attributeId);
   const next = { ...prev.variantValues, [attributeId]: valueId };
   if (idx >= 0) {
    for (let j = idx + 1; j < attrs.length; j++) delete next[attrs[j]._id];
   }
   attrs.forEach((a) => {
    delete next[a._id + "_model"];
   });
   return { ...prev, variantValues: next };
  });
 };
 const handleItemVariantModelChange = (_attributeId: string, modelId: string) => {
  const attrs = categoryVariantAttributesImei;
  if (attrs.length < 2) return;
  const modelAttrId = attrs[1]._id;
  setItemData((prev) => {
   const next = { ...prev.variantValues, [modelAttrId]: modelId };
   for (let j = 2; j < attrs.length; j++) delete next[attrs[j]._id];
   return { ...prev, variantValues: next };
  });
 };
 const handleOtherItemVariantChange = (attributeId: string, valueId: string) => {
  setOtherItemData((prev) => {
   const attrs = categoryVariantAttributesOther;
   const idx = attrs.findIndex((a) => a._id === attributeId);
   const next = { ...prev.variantValues, [attributeId]: valueId };
   if (idx >= 0) {
    for (let j = idx + 1; j < attrs.length; j++) delete next[attrs[j]._id];
   }
   attrs.forEach((a) => {
    delete next[a._id + "_model"];
   });
   return { ...prev, variantValues: next };
  });
 };
 const handleOtherItemVariantModelChange = (_attributeId: string, modelId: string) => {
  const attrs = categoryVariantAttributesOther;
  if (attrs.length < 2) return;
  const modelAttrId = attrs[1]._id;
  setOtherItemData((prev) => {
   const next = { ...prev.variantValues, [modelAttrId]: modelId };
   for (let j = 2; j < attrs.length; j++) delete next[attrs[j]._id];
   return { ...prev, variantValues: next };
  });
 };

 /** Typeahead search for existing non-serial items. Returns dedupe-by-barcode/name matches to prefill the form. */
 const searchNonSerialProducts = useCallback(async (query: string, limit = 10) => {
  const q = (query || "").trim();
  if (!q) return [];
  try {
   const response = await fetch(
    `${API_URL}/api/purchases/non-serial/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { headers: getAuthHeaders() }
   );
   const result = await response.json();
   if (result && result.success && Array.isArray(result.data)) {
    return result.data as NonSerialSearchResult[];
   }
   return [];
  } catch (error) {
   console.error("Failed to search non-serial products:", error);
   return [];
  }
 }, []);

 /** Prefill the non-serial form from a selected existing item. Variant ids resolve once category attrs load. */
 const selectNonSerialProduct = useCallback((product: NonSerialSearchResult) => {
  const rawVariantValues = Array.isArray(product.variantValues)
   ? product.variantValues.filter((v): v is { slug: string; value: string } => !!v && !!v.slug)
   : [];
  const categoryId = product.category ? String(product.category) : "";
  setOtherItemData((prev) => ({
   ...prev,
   name: product.name || "",
   barcode: product.barcode || "",
   sendTo: product.sendTo ? String(product.sendTo) : prev.sendTo,
   taxCategory: product.tax ? String(product.tax) : prev.taxCategory,
   type: categoryId,
   make: product.subCategory ? String(product.subCategory) : "",
   grade: product.grade || "",
   brand: product.brand || "",
   brandModel: product.brandModel || "",
   capacity: product.capacity || "",
   colour: product.colour || "",
   variantValues: {},
   rawVariantValues,
   purchasePrice:
    product.purchasePrice != null && Number.isFinite(Number(product.purchasePrice))
     ? String(product.purchasePrice)
     : prev.purchasePrice,
   salePrice:
    product.salePrice != null && Number.isFinite(Number(product.salePrice))
     ? String(product.salePrice)
     : prev.salePrice,
   quantity: prev.quantity || "0",
  }));
  if (categoryId) {
   fetchSubCategories(categoryId);
   fetchCategoryVariantAttributes(categoryId, false);
  }
 }, [fetchSubCategories, fetchCategoryVariantAttributes]);

 /** Typeahead search for existing serial/IMEI items. Returns dedupe-by-config matches to prefill the IMEI form. */
 const searchSerialProducts = useCallback(async (query: string, limit = 10) => {
  const q = (query || "").trim();
  if (!q) return [];
  try {
   const response = await fetch(
    `${API_URL}/api/purchases/serial/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { headers: getAuthHeaders() }
   );
   const result = await response.json();
   if (result && result.success && Array.isArray(result.data)) {
    return result.data as SerialSearchResult[];
   }
   return [];
  } catch (error) {
   console.error("Failed to search serial products:", error);
   return [];
  }
 }, []);

 /** Prefill the IMEI/serial form from a selected existing item. Variant ids resolve once category attrs load. */
 const selectSerialProduct = useCallback((product: SerialSearchResult) => {
  const rawVariantValues = Array.isArray(product.variantValues)
   ? product.variantValues.filter((v): v is { slug: string; value: string } => !!v && !!v.slug)
   : [];
  const categoryId = product.category ? String(product.category) : "";
  setItemData((prev) => ({
   ...prev,
   sendTo: product.sendTo ? String(product.sendTo) : prev.sendTo,
   taxCategory: product.tax ? String(product.tax) : prev.taxCategory,
   type: categoryId,
   make: product.subCategory ? String(product.subCategory) : "",
   grade: product.grade || "",
   brand: product.brand || "",
   brandModel: product.brandModel || "",
   capacity: product.capacity || "",
   colour: product.colour || "",
   variantValues: {},
   rawVariantValues,
   purchasePrice:
    product.purchasePrice != null && Number.isFinite(Number(product.purchasePrice))
     ? String(product.purchasePrice)
     : prev.purchasePrice,
   salePrice:
    product.salePrice != null && Number.isFinite(Number(product.salePrice))
     ? String(product.salePrice)
     : prev.salePrice,
   // Keep multiIMEIs untouched — user fills serials themselves after prefill.
   multiIMEIs: prev.multiIMEIs,
  }));
  if (categoryId) {
   fetchSubCategories(categoryId);
   fetchCategoryVariantAttributes(categoryId, true);
  }
 }, [fetchSubCategories, fetchCategoryVariantAttributes]);

 /** Resolve rawVariantValues (slug/name) → variantValues (attrId→valueId) once attrs load. Mirrors edit page logic. */
 useEffect(() => {
  const attrs = categoryVariantAttributesOther;
  if (attrs.length === 0 || !otherItemData.type || categoryIdOtherRef.current !== otherItemData.type) return;
  if (!otherItemData.rawVariantValues || otherItemData.rawVariantValues.length === 0) return;
  if (Object.keys(otherItemData.variantValues || {}).length > 0) return;

  const next: Record<string, string> = {};
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
  setOtherItemData((prev) => ({ ...prev, variantValues: next, rawVariantValues: undefined }));
 }, [categoryVariantAttributesOther, otherItemData.type, otherItemData.rawVariantValues, otherItemData.variantValues, getVariantOptionsForAttributeIndex]);

 /** Resolve rawVariantValues (slug/name) → variantValues (attrId→valueId) for IMEI/serial form once attrs load. */
 useEffect(() => {
  const attrs = categoryVariantAttributesImei;
  if (attrs.length === 0 || !itemData.type || categoryIdImeiRef.current !== itemData.type) return;
  if (!itemData.rawVariantValues || itemData.rawVariantValues.length === 0) return;
  if (Object.keys(itemData.variantValues || {}).length > 0) return;

  const next: Record<string, string> = {};
  for (let i = 0; i < attrs.length; i++) {
   const attr = attrs[i];
   const raw = itemData.rawVariantValues.find(
    (r) => (r.slug || "").toLowerCase() === (attr.slug || "").toLowerCase()
   );
   const valueName = raw?.value?.trim();
   if (!valueName) continue;
   const options = getVariantOptionsForAttributeIndex(attrs, next, i);
   const opt = options.find((o) => (o.name || "").trim().toUpperCase() === valueName.toUpperCase());
   if (opt) next[attr._id] = opt._id;
  }
  setItemData((prev) => ({ ...prev, variantValues: next, rawVariantValues: undefined }));
 }, [categoryVariantAttributesImei, itemData.type, itemData.rawVariantValues, itemData.variantValues, getVariantOptionsForAttributeIndex]);

 const handleParcelSubmit = () => {
  if (!parcelData.account) return false;
  setCurrentStep("quantity");
  return true;
 };

 const handleQuantitySubmit = () => {
  setCurrentStep("item");
 };

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

 const buildItemPayload = (d: ItemData, categoryId?: string) => {
  const imeis = parseMultiIMEIs(d.multiIMEIs);
  const cid = categoryId || d.type;
  const attrs = cid ? attributesByCategoryIdRef.current[cid] : undefined;
  let grade: string | undefined;
  let brand: string | undefined;
  let brandModel: string | undefined;
  let capacity: string | undefined;
  let colour: string | undefined;
  let variantValues: { slug: string; value: string }[] = [];
  if (attrs && attrs.length > 0 && d.variantValues) {
   const resolved = resolveVariantValues(attrs, d.variantValues);
   grade = resolved.grade;
   brand = resolved.brand;
   brandModel = resolved.brandModel;
   capacity = resolved.capacity;
   colour = resolved.colour;
   variantValues = resolved.variantValues;
  } else {
   const brandObj = brandsRaw.find((b) => b._id === d.brand);
   const modelName = brandObj?.models?.find((m) => m._id === d.brandModel)?.name;
   grade = toUpper(grades.find((g) => g._id === d.grade)?.name || d.grade);
   brand = toUpper(brands.find((b) => b._id === d.brand)?.name || d.brand);
   brandModel = toUpper(modelName || d.brandModel);
   capacity = toUpper(capacities.find((c) => c._id === d.capacity)?.name || d.capacity);
   colour = toUpper(colours.find((c) => c._id === d.colour)?.name || d.colour);
  }
  return {
   sendTo: d.sendTo || undefined,
   tax: d.taxCategory || undefined,
   category: d.type || undefined,
   subCategory: d.make || undefined,
   grade,
   brand,
   brandModel,
   capacity,
   colour,
   variantValues,
   purchasePrice: parseFloat(d.purchasePrice) || 0,
   salePrice: parseFloat(d.salePrice) || 0,
   imeis,
   note: d.note?.trim() ? d.note.trim() : undefined,
  };
 };

 const buildOtherItemPayload = (d: OtherItemData, categoryId?: string) => {
  const cid = categoryId || d.type;
  const attrs = cid ? attributesByCategoryIdRef.current[cid] : undefined;
  let grade: string | undefined;
  let brand: string | undefined;
  let brandModel: string | undefined;
  let capacity: string | undefined;
  let colour: string | undefined;
  let variantValues: { slug: string; value: string }[] = [];
  if (attrs && attrs.length > 0 && d.variantValues) {
   const resolved = resolveVariantValues(attrs, d.variantValues);
   grade = resolved.grade;
   brand = resolved.brand;
   brandModel = resolved.brandModel;
   capacity = resolved.capacity;
   colour = resolved.colour;
   variantValues = resolved.variantValues;
  } else {
   const brandObj = brandsRaw.find((b) => b._id === d.brand);
   const modelName = brandObj?.models?.find((m) => m._id === d.brandModel)?.name;
   grade = toUpper(grades.find((g) => g._id === d.grade)?.name || d.grade);
   brand = toUpper(brands.find((b) => b._id === d.brand)?.name || d.brand);
   brandModel = toUpper(modelName || d.brandModel);
   capacity = toUpper(capacities.find((c) => c._id === d.capacity)?.name || d.capacity);
   colour = toUpper(colours.find((c) => c._id === d.colour)?.name || d.colour);
  }
  return {
   name: d.name?.trim() ? formatProductName(d.name) : undefined,
   barcode: d.barcode?.trim() || undefined,
   sendTo: d.sendTo || undefined,
   tax: d.taxCategory || undefined,
   category: d.type || undefined,
   subCategory: d.make || undefined,
   grade,
   brand,
   brandModel,
   capacity,
   colour,
   variantValues,
   purchasePrice: parseFloat(d.purchasePrice) || 0,
   salePrice: parseFloat(d.salePrice) || 0,
   quantity: parseInt(d.quantity) || 0,
   isOtherItem: true,
   note: d.note?.trim() ? d.note.trim() : undefined,
  };
 };

 const handleItemSubmit = async () => {
  setIsSubmitting(true);
  setSubmitMessage({ type: "", text: "" });

  if (!parcelData.account) {
   setSubmitMessage({ type: "error", text: "Account is required" });
   setIsSubmitting(false);
   return;
  }

  // Combine IMEI items
  const imeiItems = [
   ...savedItems.map((entry) => buildItemPayload(entry.data, entry.data.type)),
   ...(currentFormIMEICount > 0 ? [buildItemPayload(itemData, itemData.type)] : []),
  ];

  // Combine Other items
  const otherItems = [
   ...savedOtherItems.map((entry) => buildOtherItemPayload(entry.data, entry.data.type)),
   ...(currentOtherQuantity > 0 ? [buildOtherItemPayload(otherItemData, otherItemData.type)] : []),
  ];

  // Validation: need at least one item of any type
  if (imeiItems.length === 0 && otherItems.length === 0) {
   setSubmitMessage({ type: "error", text: "Add at least one item" });
   setIsSubmitting(false);
   return;
  }

  // Validation: every serial item must have all variant attributes filled
  for (const entry of savedItems) {
   if (!isSerialItemVariantComplete(entry.data)) {
    setSubmitMessage({
     type: "error",
     text: "All serial items must have every variant attribute filled. Edit the item and complete missing fields.",
    });
    setIsSubmitting(false);
    return;
   }
  }
  if (currentFormIMEICount > 0 && !isSerialItemVariantComplete(itemData)) {
   setSubmitMessage({
    type: "error",
    text: "Please fill all variant attributes for the current serial item before submitting.",
   });
   setIsSubmitting(false);
   return;
  }

  const allItems = [...imeiItems, ...otherItems];

  // Validation: purchase price and sale price are required for every item
  const missingPrice = allItems.find(
   (item) =>
    item.purchasePrice == null ||
    item.purchasePrice <= 0 ||
    item.salePrice == null ||
    item.salePrice <= 0
  );
  if (missingPrice) {
   setSubmitMessage({
    type: "error",
    text: "Purchase price and sale price are required for every item. Enter a value greater than 0.",
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

  const purchasePayload: Record<string, unknown> = {
   parcelNumber: parcelData.parcelNumber,
   date: parcelData.date,
   currency: parcelData.currency,
   note: parcelData.note || quantityData.note,
   imeiQuantity: quantityData.imeiQuantity ? parseInt(quantityData.imeiQuantity) : 0,
   otherQuantity: quantityData.otherQuantity ? parseInt(quantityData.otherQuantity) : 0,
   items: allItems,
   totalIMEIs: allIMEIs.length,
   totalOtherQuantity: totalOtherQty,
   grandTotal,
  };

  const accountValue = parcelData.account || "";
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
   const response = await fetch(`${API_URL}/api/purchases`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(purchasePayload),
   });
   const result = await response.json();
   if (result.success) {
    setSubmitMessage({ type: "success", text: "Purchase added to inventory!" });
    router.push("/purchases/list");
   } else {
    setSubmitMessage({ type: "error", text: result.message || "Failed to add purchase" });
   }
  } catch (error) {
   console.error("Failed to add purchase:", error);
   setSubmitMessage({ type: "error", text: "Failed to add purchase" });
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleBack = useCallback(() => {
  if (currentStep === "quantity") {
   setCurrentStep("parcel");
  } else if (currentStep === "item") {
   setCurrentStep("quantity");
  } else {
   router.push("/purchases");
  }
 }, [currentStep, router]);

 const handleSaveDetails = () => {
  const imeiQty = String(quantityData.imeiQuantity || "").trim();
  const otherQty = String(quantityData.otherQuantity || "").trim();
  if (!parcelData.account || !imeiQty || !otherQty) return false;
  setDetailsSaved(true);
  return true;
 };

 const handleEditDetails = useCallback(() => {
  setDetailsSaved(false);
 }, []);

 const handleReset = useCallback(() => {
  setDetailsSaved(false);
  if (currentStep === "parcel") {
   setParcelData({
    date: "2026-01-24",
    account: "",
    parcelNumber: "",
    note: "",
    currency: "GBP",
   });
  } else if (currentStep === "quantity") {
   setQuantityData({
    date: "2026-01-24",
    imeiQuantity: "",
    otherQuantity: "",
    note: "",
   });
  } else {
   setItemData({
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
  }
 }, [currentStep]);

 const currencySymbol = useMemo(
  () => CURRENCIES.find((c) => c.code === parcelData.currency)?.symbol || "£",
  [parcelData.currency]
 );

 // Order comes from the category (set in Edit Category); display as returned by API
 const showGradeImei = useMemo(() => hasSlug(categoryVariantAttributesImei, "grade") || hasSlug(categoryVariantAttributesImei, "condition"), [categoryVariantAttributesImei]);
 const showBrandImei = useMemo(() => hasSlug(categoryVariantAttributesImei, "brands", "brand"), [categoryVariantAttributesImei]);
 const showStorageImei = useMemo(() => hasSlug(categoryVariantAttributesImei, "storage", "capacity"), [categoryVariantAttributesImei]);
 const showColorImei = useMemo(() => hasSlug(categoryVariantAttributesImei, "color", "colour"), [categoryVariantAttributesImei]);
 const showGradeOther = useMemo(() => hasSlug(categoryVariantAttributesOther, "grade") || hasSlug(categoryVariantAttributesOther, "condition"), [categoryVariantAttributesOther]);
 const showBrandOther = useMemo(() => hasSlug(categoryVariantAttributesOther, "brands", "brand"), [categoryVariantAttributesOther]);
 const showStorageOther = useMemo(() => hasSlug(categoryVariantAttributesOther, "storage", "capacity"), [categoryVariantAttributesOther]);
 const showColorOther = useMemo(() => hasSlug(categoryVariantAttributesOther, "color", "colour"), [categoryVariantAttributesOther]);

 /** True when the given serial (IMEI) item has every variant attribute filled. */
 const isSerialItemVariantComplete = useCallback(
  (data: ItemData): boolean => {
   if (!(data.type ?? "").trim()) return false;
   if (categoryVariantAttributesImei.length > 0) {
    for (const attr of categoryVariantAttributesImei) {
     if (!(data.variantValues?.[attr._id] ?? "").trim()) return false;
    }
    return true;
   }
   if (showGradeImei && !(data.grade ?? "").trim()) return false;
   if (showBrandImei && (!(data.brand ?? "").trim() || !(data.brandModel ?? "").trim())) return false;
   if (showStorageImei && !(data.capacity ?? "").trim()) return false;
   if (showColorImei && !(data.colour ?? "").trim()) return false;
   return true;
  },
  [categoryVariantAttributesImei, showGradeImei, showBrandImei, showStorageImei, showColorImei]
 );

 const canAddSerialItem =
  currentFormIMEICount > 0 && isSerialItemVariantComplete(itemData);

 return {
  currentStep,
  detailsSaved,
  handleSaveDetails,
  handleEditDetails,
  parcelData,
  quantityData,
  itemData,
  currencies,
  accountOptions,
  addAccountModalOpen,
  setAddAccountModalOpen,
  addAccountSaving,
  createCustomerFromParcel,
  createSupplierFromParcel,
  suppliers,
  sendToOptions,
  taxCategories,
  types,
  typesForNonSerial,
  optionsError,
  optionsLoading,
  retryFailedOptions,
  makes,
  grades,
  brands,
  brandModels,
  capacities,
  colours,
  showGradeImei,
  showBrandImei,
  showStorageImei,
  showColorImei,
  showGradeOther,
  showBrandOther,
  showStorageOther,
  showColorOther,
  totalIMEIs,
  savedItems,
  savedIMEICount,
  steps,
  currentStepIndex,
  handleParcelChange,
  handleQuantityChange,
  handleItemChange,
  handleParcelSubmit,
  handleQuantitySubmit,
  handleItemSubmit,
  handleAddItem,
  handleRemoveItem,
  handleEditItem,
  handleBack,
  handleReset,
  currencySymbol,
  isSubmitting,
  submitMessage,
  // Other items exports
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
  searchNonSerialProducts,
  selectNonSerialProduct,
  searchSerialProducts,
  selectSerialProduct,
  addBrand,
  addModelUnderBrand,
  addCapacity,
  addColour,
  addGrade,
  categoryVariantAttributesImei,
  categoryVariantAttributesOther,
  handleItemVariantChange,
  handleItemVariantModelChange,
  handleOtherItemVariantChange,
  handleOtherItemVariantModelChange,
  addValueForAttribute,
  addModelForAttribute,
  addChildForModelAttribute,
  addValueAtPath,
  updateVariantValueAtPath,
  deleteVariantValueAtPath,
  getVariantOptionsForAttributeIndex,
  canAddSerialItem,
 };
};

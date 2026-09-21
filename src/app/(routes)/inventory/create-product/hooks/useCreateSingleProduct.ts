"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { productApi } from "../service";
import { parseMultiIMEIs } from "@/lib/parseMultiIMEIs";
import { formatProductName, formatProductNameInput } from "@/lib/formatProductName";
import type {
 ProductAddMode,
 SerialSingleFormData,
 NonSerialSingleFormData,
 SingleProductParcelData,
 CategoryVariantAttribute,
} from "../types";

const parseTabParam = (value: string | null): ProductAddMode => {
 if (value === "serial" || value === "non-serial") return value;
 return null;
};

const defaultSerialData: SerialSingleFormData = {
 sendTo: "",
 taxCategory: "",
 type: "",
 variantValues: {},
 purchasePrice: "0",
 salePrice: "0",
 multiIMEIs: "",
};

const defaultNonSerialData: NonSerialSingleFormData = {
 sendTo: "",
 taxCategory: "",
 type: "",
 variantValues: {},
 name: "",
 barcode: "",
 purchasePrice: "0",
 salePrice: "0",
 quantity: "1",
};

const today = new Date().toISOString().slice(0, 10);
const defaultParcelData: SingleProductParcelData = {
 supplier: "",
 parcelNumber: `SINGLE-${Date.now()}`,
 date: today,
 currency: "GBP",
 note: "",
};

const toUpper = (s: string | undefined) => (s != null && String(s).trim() !== "" ? String(s).trim().toUpperCase() : undefined);

export function useCreateSingleProduct() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [productAddMode, setProductAddModeState] = useState<ProductAddMode>(() =>
  parseTabParam(searchParams?.get("tab") ?? null)
 );

 useEffect(() => {
  const next = parseTabParam(searchParams?.get("tab") ?? null);
  setProductAddModeState((curr) => (curr === next ? curr : next));
 }, [searchParams]);

 const setProductAddMode = useCallback(
  (next: ProductAddMode) => {
   setProductAddModeState(next);
   const params = new URLSearchParams(searchParams?.toString() ?? "");
   if (next === null) params.delete("tab");
   else params.set("tab", next);
   const qs = params.toString();
   router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  },
  [router, pathname, searchParams]
 );
 const [parcelData, setParcelData] = useState<SingleProductParcelData>(defaultParcelData);
 const [serialData, setSerialData] = useState<SerialSingleFormData>(defaultSerialData);
 const [nonSerialData, setNonSerialData] = useState<NonSerialSingleFormData>(defaultNonSerialData);

 const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
 const [sendToOptions, setSendToOptions] = useState<{ _id: string; name: string }[]>([]);
 const [taxCategories, setTaxCategories] = useState<{ _id: string; name: string; rate: number; type: string }[]>([]);
 const [typesSerial, setTypesSerial] = useState<{ _id: string; name: string }[]>([]);
 const [typesNonSerial, setTypesNonSerial] = useState<{ _id: string; name: string }[]>([]);
 const [loadingSerialTypes, setLoadingSerialTypes] = useState(false);
 const [loadingNonSerialTypes, setLoadingNonSerialTypes] = useState(false);
 const [categoryVariantAttributes, setCategoryVariantAttributes] = useState<CategoryVariantAttribute[]>([]);
 /** True while loading suppliers, locations, taxes. Starts false — choice screen needs no data. */
 const [isLoadingOptions, setIsLoadingOptions] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });

 const showMessage = useCallback((type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 }, []);

 // Load shared dropdown data only when user picks a mode (not on mount).
 // The choice screen ("Serial items" / "Non-serial items") needs zero API data,
 // so we defer all network calls until the user actually needs the form.
 const sharedDataLoadedRef = useRef(false);
 useEffect(() => {
  if (productAddMode === null || sharedDataLoadedRef.current) return;
  let cancelled = false;
  setIsLoadingOptions(true);
  const load = async () => {
   try {
    const [suppliersList, locations, taxes] = await Promise.all([
     productApi.getAccounts(),
     productApi.getLocations(),
     productApi.getActiveTaxes(),
    ]);
    if (cancelled) return;
    sharedDataLoadedRef.current = true;
    setSuppliers(suppliersList);
    setSendToOptions(locations);
    setTaxCategories(taxes);
    const defaultSendTo = locations.find((l) => l.name.toLowerCase().trim() === "shop")?._id || locations[0]?._id || "";
    const defaultTax = taxes[0]?._id || "";
    if (defaultSendTo) {
     setSerialData((prev) => (prev.sendTo === "" ? { ...prev, sendTo: defaultSendTo } : prev));
     setNonSerialData((prev) => (prev.sendTo === "" ? { ...prev, sendTo: defaultSendTo } : prev));
    }
    if (defaultTax) {
     setSerialData((prev) => (prev.taxCategory === "" ? { ...prev, taxCategory: defaultTax } : prev));
     setNonSerialData((prev) => (prev.taxCategory === "" ? { ...prev, taxCategory: defaultTax } : prev));
    }
   } catch {
    // silent
   } finally {
    if (!cancelled) setIsLoadingOptions(false);
   }
  };
  void load();
  return () => { cancelled = true; };
 }, [productAddMode]);

 // If user opens a mode before prefetch finishes, load the relevant category list once.
 useEffect(() => {
  if (productAddMode !== "serial") return;
  if (typesSerial.length > 0) return;
  let cancelled = false;
  setLoadingSerialTypes(true);
  void productApi
   .getCategoriesByItemType("serial")
   .then((list) => {
    if (!cancelled) setTypesSerial(list);
   })
   .finally(() => {
    if (!cancelled) setLoadingSerialTypes(false);
   });
  return () => {
   cancelled = true;
   setLoadingSerialTypes(false);
  };
 }, [productAddMode, typesSerial.length]);

 useEffect(() => {
  if (productAddMode !== "non-serial") return;
  if (typesNonSerial.length > 0) return;
  let cancelled = false;
  setLoadingNonSerialTypes(true);
  void productApi
   .getCategoriesByItemType("non-serial")
   .then((list) => {
    if (!cancelled) setTypesNonSerial(list);
   })
   .finally(() => {
    if (!cancelled) setLoadingNonSerialTypes(false);
   });
  return () => {
   cancelled = true;
   setLoadingNonSerialTypes(false);
  };
 }, [productAddMode, typesNonSerial.length]);

 // Load variant attributes when category changes (serial or non-serial)
 useEffect(() => {
  const categoryId = productAddMode === "serial" ? serialData.type : productAddMode === "non-serial" ? nonSerialData.type : "";
  if (!categoryId) {
   setCategoryVariantAttributes([]);
   return;
  }
  let cancelled = false;
  productApi.getCategoryVariantAttributes(categoryId).then((attrs) => {
   if (!cancelled) setCategoryVariantAttributes(attrs);
  });
  return () => { cancelled = true; };
 }, [productAddMode, serialData.type, nonSerialData.type]);

 const getVariantOptionsForAttributeIndex = useCallback(
  (variantValues: Record<string, string>, attributeIndex: number): { _id: string; name: string }[] => {
   const attributes = categoryVariantAttributes;
   if (!attributes.length || attributeIndex < 0) return [];
   const treeValues = attributes[0].values || [];
   if (attributeIndex === 0) {
    return treeValues.map((v) => ({ _id: v._id, name: v.name }));
   }
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
  [categoryVariantAttributes]
 );

 const getVariantValueName = useCallback(
  (variantValues: Record<string, string>, attributeIndex: number): string | undefined => {
   const options = getVariantOptionsForAttributeIndex(variantValues, attributeIndex);
   const attr = categoryVariantAttributes[attributeIndex];
   if (!attr) return undefined;
   const selectedId = variantValues[attr._id];
   if (!selectedId) return undefined;
   return options.find((o) => o._id === selectedId)?.name;
  },
  [categoryVariantAttributes, getVariantOptionsForAttributeIndex]
 );

 const resolveVariantValues = useCallback(
  (variantValues: Record<string, string>): { grade?: string; brand?: string; brandModel?: string; capacity?: string; colour?: string; variantValues: { slug: string; value: string }[] } => {
   const list: { slug: string; value: string }[] = [];
   const fixed: { grade?: string; brand?: string; brandModel?: string; capacity?: string; colour?: string } = {};
   for (let i = 0; i < categoryVariantAttributes.length; i++) {
    const attr = categoryVariantAttributes[i];
    const valueName = getVariantValueName(variantValues, i);
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
  },
  [categoryVariantAttributes, getVariantValueName]
 );

 /** Add a new variant value at path (for "create new" in serial or non-serial form). Refetches attributes after success. */
 const addValueAtPath = useCallback(
  async (
   categoryId: string,
   firstAttributeId: string,
   parentPath: string[],
   name: string
  ): Promise<string | null> => {
   const newId = await productApi.addValueAtPath(categoryId, firstAttributeId, parentPath, name);
   const currentCategoryId = productAddMode === "serial" ? serialData.type : productAddMode === "non-serial" ? nonSerialData.type : "";
   if (newId && currentCategoryId === categoryId) {
    const attrs = await productApi.getCategoryVariantAttributes(categoryId);
    setCategoryVariantAttributes(attrs);
   }
   return newId;
  },
  [productAddMode, serialData.type, nonSerialData.type]
 );

 const updateSerialData = useCallback((data: Partial<SerialSingleFormData>) => {
  setSerialData((prev) => ({ ...prev, ...data }));
 }, []);

 const updateNonSerialData = useCallback((data: Partial<NonSerialSingleFormData>) => {
  const patch = { ...data };
  if (patch.name != null) patch.name = formatProductNameInput(patch.name);
  setNonSerialData((prev) => ({ ...prev, ...patch }));
 }, []);

 const currentImeiCount = useMemo(() => {
  if (!serialData.multiIMEIs.trim()) return 0;
  return parseMultiIMEIs(serialData.multiIMEIs).length;
 }, [serialData.multiIMEIs]);

 const serialImeis = useMemo(() => parseMultiIMEIs(serialData.multiIMEIs), [serialData.multiIMEIs]);

 const submitSerial = useCallback(async () => {
  const imeis = serialImeis.filter((s) => s.length > 0);
  if (imeis.length === 0) {
   showMessage("error", "Enter at least one IMEI.");
   return;
  }
  if (!serialData.type) {
   showMessage("error", "Select a category.");
   return;
  }
  if (!serialData.sendTo) {
   showMessage("error", "Select Send To location.");
   return;
  }
  if (!parcelData.supplier) {
   showMessage("error", "Select a supplier.");
   return;
  }
  const purchasePrice = parseFloat(serialData.purchasePrice);
  const salePrice = parseFloat(serialData.salePrice);
  if (Number.isNaN(purchasePrice) || purchasePrice <= 0) {
   showMessage("error", "Purchase price is required and must be greater than 0.");
   return;
  }
  if (Number.isNaN(salePrice) || salePrice <= 0) {
   showMessage("error", "Sale price is required and must be greater than 0.");
   return;
  }
  setIsSubmitting(true);
  try {
   const resolved = categoryVariantAttributes.length > 0 ? resolveVariantValues(serialData.variantValues) : { variantValues: [] as { slug: string; value: string }[] };
   const itemPayload = {
    sendTo: serialData.sendTo || undefined,
    tax: serialData.taxCategory || undefined,
    category: serialData.type || undefined,
    subCategory: undefined,
    grade: resolved.grade,
    brand: resolved.brand,
    brandModel: resolved.brandModel,
    capacity: resolved.capacity,
    colour: resolved.colour,
    variantValues: resolved.variantValues,
    purchasePrice: purchasePrice,
    salePrice: salePrice,
    imeis,
   };
   const sv = parcelData.supplier || "";
   const purchasePayload: Record<string, unknown> = {
    parcelNumber: parcelData.parcelNumber || `SINGLE-${Date.now()}`,
    date: parcelData.date || today,
    currency: parcelData.currency || "GBP",
    note: (parcelData.note ?? "").trim(),
    imeiQuantity: imeis.length,
    otherQuantity: 0,
    items: [itemPayload],
    totalIMEIs: imeis.length,
    totalOtherQuantity: 0,
    grandTotal: purchasePrice * imeis.length,
   };
   if (sv.startsWith("supplier:")) {
    purchasePayload.account = sv.slice("supplier:".length);
    purchasePayload.accountModel = "Supplier";
   } else if (sv.startsWith("customer:")) {
    purchasePayload.account = sv.slice("customer:".length);
    purchasePayload.accountModel = "Customer";
   } else if (sv) {
    purchasePayload.account = sv;
    purchasePayload.accountModel = "Supplier";
   }
   await productApi.addPurchase(purchasePayload);
   showMessage("success", `Added ${imeis.length} item(s) to inventory. Add more IMEIs below for the same variant.`);
   setSerialData((prev) => ({ ...prev, multiIMEIs: "" }));
  } catch (err) {
   showMessage("error", err instanceof Error ? err.message : "Failed to add to inventory");
  } finally {
   setIsSubmitting(false);
  }
 }, [serialData, serialImeis, parcelData, categoryVariantAttributes, resolveVariantValues, showMessage]);

 const submitNonSerial = useCallback(async () => {
  const name = formatProductName(nonSerialData.name);
  const hasVariantSelection = categoryVariantAttributes.length > 0 && Object.values(nonSerialData.variantValues).some(Boolean);
  if (!hasVariantSelection && !name) {
   showMessage("error", "Enter product name or select variant attributes.");
   return;
  }
  if (!nonSerialData.type) {
   showMessage("error", "Select a category.");
   return;
  }
  if (!nonSerialData.sendTo) {
   showMessage("error", "Select Send To location.");
   return;
  }
  if (!parcelData.supplier) {
   showMessage("error", "Select a supplier.");
   return;
  }
  const purchasePrice = parseFloat(nonSerialData.purchasePrice);
  const salePrice = parseFloat(nonSerialData.salePrice);
  if (Number.isNaN(purchasePrice) || purchasePrice <= 0) {
   showMessage("error", "Purchase price is required and must be greater than 0.");
   return;
  }
  if (Number.isNaN(salePrice) || salePrice <= 0) {
   showMessage("error", "Sale price is required and must be greater than 0.");
   return;
  }
  const qty = Math.max(1, parseInt(nonSerialData.quantity, 10) || 1);
  setIsSubmitting(true);
  try {
   const resolved = categoryVariantAttributes.length > 0 ? resolveVariantValues(nonSerialData.variantValues) : { variantValues: [] as { slug: string; value: string }[] };
   const otherItemPayload = {
    name: name || undefined,
    barcode: nonSerialData.barcode.trim() || undefined,
    sendTo: nonSerialData.sendTo || undefined,
    tax: nonSerialData.taxCategory || undefined,
    category: nonSerialData.type || undefined,
    subCategory: undefined,
    grade: resolved.grade,
    brand: resolved.brand,
    brandModel: resolved.brandModel,
    capacity: resolved.capacity,
    colour: resolved.colour,
    variantValues: resolved.variantValues,
    purchasePrice,
    salePrice,
    quantity: qty,
    isOtherItem: true,
   };
   const sv = parcelData.supplier || "";
   const purchasePayload: Record<string, unknown> = {
    parcelNumber: parcelData.parcelNumber || `SINGLE-${Date.now()}`,
    date: parcelData.date || today,
    currency: parcelData.currency || "GBP",
    note: (parcelData.note ?? "").trim(),
    imeiQuantity: 0,
    otherQuantity: qty,
    items: [otherItemPayload],
    totalIMEIs: 0,
    totalOtherQuantity: qty,
    grandTotal: purchasePrice * qty,
   };
   if (sv.startsWith("supplier:")) {
    purchasePayload.account = sv.slice("supplier:".length);
    purchasePayload.accountModel = "Supplier";
   } else if (sv.startsWith("customer:")) {
    purchasePayload.account = sv.slice("customer:".length);
    purchasePayload.accountModel = "Customer";
   } else if (sv) {
    purchasePayload.account = sv;
    purchasePayload.accountModel = "Supplier";
   }
   await productApi.addPurchase(purchasePayload);
   showMessage("success", "Item added to inventory.");
   setNonSerialData(defaultNonSerialData);
   setParcelData({ ...defaultParcelData, parcelNumber: `SINGLE-${Date.now()}` });
  } catch (err) {
   showMessage("error", err instanceof Error ? err.message : "Failed to add to inventory");
  } finally {
   setIsSubmitting(false);
  }
 }, [nonSerialData, parcelData, categoryVariantAttributes, resolveVariantValues, showMessage]);

 const updateParcelData = useCallback((data: Partial<SingleProductParcelData>) => {
  setParcelData((prev) => ({ ...prev, ...data }));
 }, []);

 const resetSerial = useCallback(() => {
  setSerialData(defaultSerialData);
  setCategoryVariantAttributes([]);
 }, []);

 const resetNonSerial = useCallback(() => {
  setNonSerialData(defaultNonSerialData);
 }, []);

 const goBackToChoice = useCallback(() => {
  setProductAddMode(null);
  setSerialData(defaultSerialData);
  setNonSerialData(defaultNonSerialData);
  setCategoryVariantAttributes([]);
 }, [setProductAddMode]);

 return {
  productAddMode,
  setProductAddMode,
  parcelData,
  updateParcelData,
  suppliers,
  serialData,
  nonSerialData,
  updateSerialData,
  updateNonSerialData,
  sendToOptions,
  taxCategories,
  typesSerial,
  typesNonSerial,
  categoryVariantAttributes,
  getVariantOptionsForAttributeIndex,
  currentImeiCount,
  serialImeis,
  isLoadingOptions,
  isCategoryTypesLoading:
   productAddMode === "serial"
    ? loadingSerialTypes
    : productAddMode === "non-serial"
     ? loadingNonSerialTypes
     : false,
  isSubmitting,
  message,
  showMessage,
  submitSerial,
  submitNonSerial,
  resetSerial,
  resetNonSerial,
  goBackToChoice,
  addValueAtPath,
 };
}

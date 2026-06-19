"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Upload, FileSpreadsheet, ChevronRight, AlertCircle } from "lucide-react";
import { parseImportFile, type ParsedImportFile } from "../utils/parseImportFile";
import { purchaseApi } from "../service/purchaseApi";
import { emitInventoryEvent } from "@/lib/inventoryEvents";
import { clearSalesProductCache } from "@/app/(routes)/sales-dashboard/hooks/useInventoryProductsForSales";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
 "Content-Type": "application/json",
 Authorization: `Bearer ${token}`,
 };
};

/** Match backend categoryController.generateSlug */
function generateCategorySlug(name: string): string {
 return (name || "")
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "_")
 .replace(/(^_|_$)/g, "");
}

type CategoryListRow = { _id: string; name: string; itemType?: string };

/**
 * Creates missing non-serial categories for parcel import. Updates lookup (lower name → id).
 * On duplicate name, loads all active categories and links if existing row allows non-serial.
 */
async function ensureNonSerialCategoriesForParcelImport(
 apiUrl: string,
 headers: HeadersInit,
 distinctDisplayNames: string[],
 lookup: Map<string, string>
): Promise<{ ok: boolean; error?: string }> {
 const pending = distinctDisplayNames
 .map((n) => n.trim().slice(0, 50))
 .filter((trimmed) => {
 if (!trimmed) return false;
 return !lookup.has(trimmed.toLowerCase());
 });

 for (const trimmed of pending) {
 const k = trimmed.toLowerCase();
 if (lookup.has(k)) continue;

 const slug = generateCategorySlug(trimmed) || "category";
 const res = await fetch(`${apiUrl}/api/categories`, {
 method: "POST",
 headers,
 body: JSON.stringify({
 name: trimmed,
 slug,
 isActive: true,
 itemType: "non-serial",
 }),
 });
 const json = (await res.json().catch(() => ({}))) as {
 success?: boolean;
 data?: { _id?: string };
 message?: string;
 };
 if (res.ok && json.success && json.data?._id) {
 lookup.set(k, String(json.data._id));
 continue;
 }

 const listRes = await fetch(`${apiUrl}/api/categories?limit=1000&isActive=true`, { headers });
 const listJson = (await listRes.json().catch(() => ({}))) as { data?: CategoryListRow[] };
 const all: CategoryListRow[] = Array.isArray(listJson.data) ? listJson.data : [];
 const match = all.find((c) => c.name.trim().toLowerCase() === k);
 if (match) {
 const it = match.itemType || "both";
 if (it === "serial") {
 return {
  ok: false,
  error: `Category "${trimmed}" already exists as serial-only. Change the spreadsheet name or edit the category in Inventory to allow non-serial/both.`,
 };
 }
 lookup.set(k, String(match._id));
 continue;
 }

 return {
 ok: false,
 error:
 json.message ||
 `Could not create category "${trimmed}". Check product.create permission and that the name is unique (max 50 characters).`,
 };
 }
 return { ok: true };
}

export type ImportStep = "type" | "upload" | "category" | "mapping" | "preview";
export type ImportType = "serial" | "non-serial";

interface VariantAttribute {
 _id: string;
 name: string;
 slug: string;
}

interface ImportParcelModalProps {
 open: boolean;
 onClose: () => void;
 onSuccess: () => void;
 /** When set, skip the type step and use this type (e.g. from header "Import non-serial") */
 initialImportType?: ImportType | null;
 /** "modal" (default) renders as overlay dialog. "page" renders inline for use as a full-page route. */
 displayMode?: "modal" | "page";
}

/** Max items per API request to avoid timeouts and huge payloads */
const IMPORT_BATCH_SIZE = 400;
/** Run up to this many batch requests at once to speed up large imports */
const IMPORT_CONCURRENCY = 3;

export const ImportParcelModal: React.FC<ImportParcelModalProps> = ({ open, onClose, onSuccess, initialImportType = null, displayMode = "modal" }) => {
 const [importType, setImportType] = useState<ImportType | null>(initialImportType);
 const [step, setStep] = useState<ImportStep>(initialImportType ? "upload" : "type");
 const [file, setFile] = useState<File | null>(null);
 const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
 const [parseError, setParseError] = useState<string | null>(null);

 const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
 const [categoryId, setCategoryId] = useState("");
 /** Non-serial only: one category for all rows vs a column with category name per row */
 const [nonSerialCategoryMode, setNonSerialCategoryMode] = useState<"single" | "fromColumn">("single");
 /** When category is from file column, optional fallback if the cell is blank */
 const [defaultCategoryId, setDefaultCategoryId] = useState("");
 const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([]);

 const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
 const [accountOptions, setAccountOptions] = useState<{ _id: string; name: string }[]>([]);
 const [sendToOptions, setSendToOptions] = useState<{ _id: string; name: string }[]>([]);
 const [taxOptions, setTaxOptions] = useState<{ _id: string; name: string }[]>([]);

 const [account, setAccount] = useState("");
 const [sendTo, setSendTo] = useState("");
 const [tax, setTax] = useState("");
 const [parcelDate, setParcelDate] = useState(() => new Date().toISOString().split("T")[0]);
 const [note, setNote] = useState("");

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
 const [submitError, setSubmitError] = useState<string | null>(null);

 const loadOptions = useCallback(async (type: ImportType | null) => {
 if (!type) return;
 try {
 const categoryQuery = type === "serial"
 ? "limit=500&isActive=true" // serial: exclude non-serial-only
 : "limit=500&isActive=true&itemType=non-serial";
 const [catRes, locRes, taxRes, supRes] = await Promise.all([
 fetch(`${API_URL}/api/categories?${categoryQuery}`, { headers: getAuthHeaders() }).then((r) => r.json()),
 fetch(`${API_URL}/api/locations?limit=500&isActive=true`, { headers: getAuthHeaders() }).then((r) => r.json()),
 fetch(`${API_URL}/api/settings/taxes/active`, { headers: getAuthHeaders() }).then((r) => r.json()),
 fetch(`${API_URL}/api/suppliers?limit=500&isActive=true`, { headers: getAuthHeaders() }).then((r) => r.json()),
 ]);
 if (catRes.success && Array.isArray(catRes.data)) {
 const list = type === "serial"
  ? catRes.data.filter((c: { itemType?: string }) => (c.itemType ?? "") !== "non-serial").map((c: { _id: string; name: string }) => ({ _id: c._id, name: c.name }))
  : catRes.data.map((c: { _id: string; name: string }) => ({ _id: c._id, name: c.name }));
 setCategories(list);
 }
 if (locRes.success && Array.isArray(locRes.data)) {
 setSendToOptions(locRes.data.map((l: { _id: string; name: string }) => ({ _id: l._id, name: l.name })));
 }
 if (taxRes.success && Array.isArray(taxRes.data)) {
 setTaxOptions(taxRes.data.map((t: { _id: string; name: string }) => ({ _id: t._id, name: t.name })));
 }
 if (supRes.success && Array.isArray(supRes.data)) {
 setAccountOptions(supRes.data.map((s: { _id: string; name: string }) => ({ _id: s._id, name: s.name })));
 }
 } catch (e) {
 console.error("Load options failed", e);
 }
 }, []);

 useEffect(() => {
 if (open) {
 if (initialImportType) {
 setImportType(initialImportType);
 setStep("upload");
 loadOptions(initialImportType);
 } else {
 setImportType(null);
 setStep("type");
 }
 }
 }, [open, initialImportType, loadOptions]);

 useEffect(() => {
 if (sendToOptions.length === 0) return;
 setSendTo((prev) => {
  if (prev && sendToOptions.some((l) => l._id === prev)) return prev;
  try {
   const stored = localStorage.getItem("create-sales-locationId");
   if (stored && sendToOptions.some((l) => l._id === stored)) return stored;
  } catch { /* ignore */ }
  return sendToOptions[0]?._id || "";
 });
 }, [sendToOptions]);

 useEffect(() => {
 if (!categoryId || importType === "non-serial") {
 setVariantAttributes([]);
 return;
 }
 fetch(`${API_URL}/api/categories/${categoryId}/variant-attributes`, { headers: getAuthHeaders() })
 .then((r) => r.json())
 .then((res) => {
 if (res.success && Array.isArray(res.data)) {
  setVariantAttributes(res.data.map((a: { _id: string; name: string; slug?: string }) => ({ _id: a._id, name: a.name, slug: (a.slug || "").toLowerCase().trim() })));
 } else {
  setVariantAttributes([]);
 }
 })
 .catch(() => setVariantAttributes([]));
 }, [categoryId, importType]);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const f = e.target.files?.[0];
 setFile(f || null);
 setParsed(null);
 setParseError(null);
 if (!f) return;
 parseImportFile(f)
 .then((result) => {
 setParsed(result);
 if (result.headers.length === 0 || result.rows.length === 0) {
  setParseError("File has no headers or data rows.");
 }
 })
 .catch(() => setParseError("Failed to parse file. Use CSV or Excel (.xlsx, .xls)."));
 };

 const requiredFieldsSerial = ["imei", "purchasePrice", "salePrice"];
 const requiredFieldsNonSerial = ["name", "quantity", "purchasePrice", "salePrice"];

 /** Mapping step label with hint so Condition (grade) and Storage (capacity) are not mixed up */
 const getMappingLabel = (name: string, slug: string): string => {
 const s = (slug || "").toLowerCase();
 if (s === "condition" || s === "grade") return `${name} (e.g. A, B, NEW — not storage like 64GB)`;
 if (s === "storage" || s === "capacity") return `${name} (e.g. 64GB, 128GB, 256GB)`;
 if (s === "model" || s === "brands_model" || s === "brand_model") return `${name} (e.g. IPHONE 16 PRO MAX)`;
 if (s === "brands" || s === "brand") return `${name} (e.g. APPLE, SAMSUNG)`;
 return `${name} (${slug})`;
 };

 const mappingFieldsSerial = [
 { key: "imei", label: "IMEI / Serial (required)" },
 { key: "purchasePrice", label: "Purchase price (required)" },
 { key: "salePrice", label: "Sale price (required)" },
 { key: "supplier", label: "Supplier (optional) — match a supplier name; blank or unknown text uses default below" },
 ...variantAttributes.map((a) => ({
 key: `variant:${a.slug}`,
 label: getMappingLabel(a.name, a.slug),
 })),
 ];
 const mappingFieldsNonSerialBase = [
 { key: "name", label: "Product name (required)" },
 { key: "quantity", label: "Quantity (required)" },
 { key: "purchasePrice", label: "Purchase price (required)" },
 { key: "salePrice", label: "Sale price (required)" },
 { key: "barcode", label: "Barcode / SKU (optional)" },
 { key: "supplier", label: "Supplier (optional) — match a supplier name; blank or unknown text uses default below" },
 ];
 const mappingFieldsNonSerial =
 nonSerialCategoryMode === "fromColumn"
 ? [
  {
  key: "category",
  label: "Category (required) — must match a non-serial category name",
  },
  ...mappingFieldsNonSerialBase,
 ]
 : mappingFieldsNonSerialBase;
 const mappingFields = importType === "non-serial" ? mappingFieldsNonSerial : mappingFieldsSerial;

 const canGoMapping =
 parsed &&
 parsed.rows.length > 0 &&
 (importType === "serial"
 ? Boolean(categoryId)
 : nonSerialCategoryMode === "fromColumn" || Boolean(categoryId));
 const getMappedValue = (row: Record<string, string>, key: string): string => {
 const header = columnMapping[key];
 if (!header) return "";
 return row[header] ?? "";
 };
 const canGoPreview =
 importType === "non-serial"
 ? (nonSerialCategoryMode === "fromColumn" ? [...requiredFieldsNonSerial, "category"] : requiredFieldsNonSerial).every((k) => columnMapping[k])
 : requiredFieldsSerial.every((k) => columnMapping[k]);
 const mappedRows = parsed?.rows ?? [];
 const previewRows = mappedRows.slice(0, 10);

 const categoryNameToId = useMemo(() => {
 const m = new Map<string, string>();
 for (const c of categories) {
 const k = c.name.trim().toLowerCase();
 if (k && !m.has(k)) m.set(k, c._id);
 }
 return m;
 }, [categories]);

 const supplierNameToId = useMemo(() => {
 const m = new Map<string, string>();
 for (const s of accountOptions) {
 const k = s.name.trim().toLowerCase();
 if (k && !m.has(k)) m.set(k, s._id);
 }
 return m;
 }, [accountOptions]);

 /**
 * Supplier for this row: map file name → id; blank / not mapped → default account.
 * If the cell has text but no catalog match (e.g. "Unknown", typo), use default account when set — same as blank.
 */
 const resolveSupplierId = (row: Record<string, string>): string | null => {
 const header = columnMapping["supplier"];
 const defaultId = account.trim() ? account : null;
 if (!header) return defaultId;
 const raw = (row[header] ?? "").trim();
 if (!raw) return defaultId;
 const id = supplierNameToId.get(raw.toLowerCase());
 if (id) return id;
 return defaultId;
 };

 const resolveNonSerialCategoryId = (row: Record<string, string>): string | null => {
 if (importType !== "non-serial") return categoryId || null;
 if (nonSerialCategoryMode === "single") return categoryId || null;
 const raw = getMappedValue(row, "category").trim();
 if (!raw) return defaultCategoryId || null;
 return categoryNameToId.get(raw.toLowerCase()) ?? null;
 };

 /** Rows with product data but empty category cell and no default category (cannot import). */
 const categoryBlankNoDefaultRowCount = useMemo(() => {
 if (importType !== "non-serial" || nonSerialCategoryMode !== "fromColumn") return 0;
 let n = 0;
 for (const row of mappedRows) {
 const nameVal = getMappedValue(row, "name").trim();
 if (!nameVal) continue;
 const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
 const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
 if (purchasePrice <= 0 || salePrice <= 0) continue;
 const raw = getMappedValue(row, "category").trim();
 if (!raw && !defaultCategoryId) n += 1;
 }
 return n;
 }, [importType, nonSerialCategoryMode, mappedRows, columnMapping, defaultCategoryId]);

 /** Distinct category names in the file that are not in the catalog yet (will be created on import). */
 const newCategoryNamesCount = useMemo(() => {
 if (importType !== "non-serial" || nonSerialCategoryMode !== "fromColumn") return 0;
 const seen = new Set<string>();
 for (const row of mappedRows) {
 const nameVal = getMappedValue(row, "name").trim();
 if (!nameVal) continue;
 const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
 const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
 if (purchasePrice <= 0 || salePrice <= 0) continue;
 const raw = getMappedValue(row, "category").trim();
 if (!raw) continue;
 const low = raw.toLowerCase();
 if (categoryNameToId.has(low)) continue;
 if (!seen.has(low)) seen.add(low);
 }
 return seen.size;
 }, [importType, nonSerialCategoryMode, mappedRows, columnMapping, categoryNameToId]);

 const unresolvedSupplierRowCount = useMemo(() => {
 let n = 0;
 for (const row of mappedRows) {
 if (!resolveSupplierId(row)) {
 if (importType === "non-serial") {
  const nameVal = getMappedValue(row, "name").trim();
  if (!nameVal) continue;
  const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
  const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
  if (purchasePrice <= 0 || salePrice <= 0) continue;
  const rawCat = getMappedValue(row, "category").trim();
  const categoryOk =
  nonSerialCategoryMode === "single"
  ? Boolean(categoryId)
  : Boolean(resolveNonSerialCategoryId(row) || rawCat || defaultCategoryId);
  if (!categoryOk) continue;
  n += 1;
 } else if (importType === "serial") {
  const imeiVal = getMappedValue(row, "imei").trim();
  if (!imeiVal) continue;
  const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
  const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
  if (purchasePrice <= 0 || salePrice <= 0) continue;
  n += 1;
 }
 }
 }
 return n;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [importType, mappedRows, columnMapping, account, supplierNameToId, categoryNameToId, defaultCategoryId, categoryId, nonSerialCategoryMode]);

 /** Rows with non-empty supplier cell text that does not match a supplier name (default supplier will be used). */
 const supplierNameFallbackRowCount = useMemo(() => {
 const header = columnMapping["supplier"];
 if (!header || !account.trim()) return 0;
 let n = 0;
 for (const row of mappedRows) {
 const raw = (row[header] ?? "").trim();
 if (!raw) continue;
 if (supplierNameToId.has(raw.toLowerCase())) continue;
 n += 1;
 }
 return n;
 }, [mappedRows, columnMapping, account, supplierNameToId]);

 /** Warn if Condition is mapped to a column that contains storage-like values (e.g. 64GB, 128) */
 const conditionStorageWarning = (() => {
 const conditionSlug = variantAttributes.find((a) => (a.slug || "").toLowerCase() === "condition" || (a.slug || "").toLowerCase() === "grade")?.slug;
 if (!conditionSlug || !columnMapping[`variant:${conditionSlug}`]) return null;
 const header = columnMapping[`variant:${conditionSlug}`];
 const looksLikeStorage = (v: string) => /^\d+\s*GB$/i.test(v.trim()) || /^\d+\s*MB$/i.test(v.trim()) || /^\d+$/.test(v.trim()) && Number(v) >= 16;
 const sample = mappedRows.slice(0, 50).map((r) => (r[header] ?? "").trim()).filter(Boolean);
 const bad = sample.filter(looksLikeStorage);
 if (bad.length > 0) return "Condition column has storage-like values (e.g. 64GB, 128). Map Condition to grade (A, B, NEW) and Storage to capacity (64GB, 128GB). Go back to step 3 to fix.";
 return null;
 })();

 /** Map variant slug to legacy Purchase item field so backend and UI display attributes correctly.
 * Model must map to brandModel (stock list uses items.brandModel). Condition -> grade, Storage -> capacity. */
 const slugToLegacyField: Record<string, "grade" | "brand" | "brandModel" | "capacity" | "colour"> = {
 grade: "grade",
 condition: "grade",
 brands: "brand",
 brand: "brand",
 brands_model: "brandModel",
 brand_model: "brandModel",
 model: "brandModel",
 make: "brandModel",
 storage: "capacity",
 capacity: "capacity",
 color: "colour",
 colour: "colour",
 };

 type NonSerialImportItem = {
 category: string;
 name: string;
 quantity: number;
 purchasePrice: number;
 salePrice: number;
 barcode?: string;
 isOtherItem: true;
 sendTo?: string;
 tax?: string;
 };

 type SerialImportItem = {
 category: string;
 sendTo?: string;
 tax?: string;
 purchasePrice: number;
 salePrice: number;
 imeis: string[];
 variantValues: { slug: string; value: string }[];
 grade?: string;
 brand?: string;
 brandModel?: string;
 capacity?: string;
 colour?: string;
 };

 const resolveNonSerialCategoryIdFromMap = (
 row: Record<string, string>,
 categoryLookup: Map<string, string>
 ): string | null => {
 if (importType !== "non-serial") return categoryId || null;
 if (nonSerialCategoryMode === "single") return categoryId || null;
 const raw = getMappedValue(row, "category").trim();
 if (!raw) return defaultCategoryId || null;
 return categoryLookup.get(raw.toLowerCase()) ?? null;
 };

 /** Rows with a barcode that appeared on an earlier row in file order (skipped on import). */
 const duplicateBarcodeSkipRowCount = useMemo(() => {
 if (importType !== "non-serial") return 0;
 const seen = new Set<string>();
 let skipped = 0;
 for (const row of mappedRows) {
 const b = getMappedValue(row, "barcode").trim();
 if (!b) continue;
 if (seen.has(b)) skipped += 1;
 else seen.add(b);
 }
 return skipped;
 }, [importType, mappedRows, columnMapping]);

 /** One supplier account → list of line items (multiple parcels if several suppliers in file). */
 const buildNonSerialGroups = (
 categoryLookup: Map<string, string>
 ): { account: string; items: NonSerialImportItem[] }[] => {
 const byAccount = new Map<string, NonSerialImportItem[]>();
 const seenBarcodesInImport = new Set<string>();
 for (const row of mappedRows) {
 const nameVal = getMappedValue(row, "name").trim();
 if (!nameVal) continue;
 const qty = Math.max(1, parseInt(getMappedValue(row, "quantity"), 10) || 1);
 const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
 const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
 if (purchasePrice <= 0 || salePrice <= 0) continue;
 const rowCategoryId = resolveNonSerialCategoryIdFromMap(row, categoryLookup);
 if (!rowCategoryId) continue;
 const supplierId = resolveSupplierId(row);
 if (!supplierId) continue;
 const barcodeVal = getMappedValue(row, "barcode").trim() || undefined;
 if (barcodeVal) {
 if (seenBarcodesInImport.has(barcodeVal)) continue;
 seenBarcodesInImport.add(barcodeVal);
 }
 const item: NonSerialImportItem = {
 category: rowCategoryId,
 name: nameVal,
 quantity: qty,
 purchasePrice,
 salePrice,
 barcode: barcodeVal,
 isOtherItem: true,
 sendTo: sendTo || undefined,
 tax: tax || undefined,
 };
 if (!byAccount.has(supplierId)) byAccount.set(supplierId, []);
 byAccount.get(supplierId)!.push(item);
 }
 return Array.from(byAccount.entries()).map(([acc, items]) => ({ account: acc, items }));
 };

 const buildSerialGroups = (): { account: string; items: SerialImportItem[] }[] => {
 const byAccount = new Map<string, SerialImportItem[]>();
 const toUpper = (s: string) => (s != null && String(s).trim() !== "" ? String(s).trim().toUpperCase() : "");

 for (const row of mappedRows) {
 const imeiVal = getMappedValue(row, "imei");
 if (!imeiVal.trim()) continue;
 const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
 const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
 if (purchasePrice <= 0 || salePrice <= 0) continue;
 const supplierId = resolveSupplierId(row);
 if (!supplierId) continue;

 const variantValues: { slug: string; value: string }[] = [];
 const legacy: { grade?: string; brand?: string; brandModel?: string; capacity?: string; colour?: string } = {};
 variantAttributes.forEach((a) => {
 const val = getMappedValue(row, `variant:${a.slug}`);
 if (!val.trim()) return;
 const valueUpper = toUpper(val);
 variantValues.push({ slug: a.slug, value: valueUpper });
 const field = slugToLegacyField[(a.slug || "").toLowerCase()];
 if (field) legacy[field] = valueUpper;
 });

 const item: SerialImportItem = {
 category: categoryId,
 sendTo: sendTo || undefined,
 tax: tax || undefined,
 purchasePrice,
 salePrice,
 imeis: [imeiVal.trim()],
 variantValues,
 ...legacy,
 };
 if (!byAccount.has(supplierId)) byAccount.set(supplierId, []);
 byAccount.get(supplierId)!.push(item);
 }
 return Array.from(byAccount.entries()).map(([acc, items]) => ({ account: acc, items }));
 };

 const handleImport = async () => {
 if (!account) {
 setSubmitError(
 "Select a default supplier (used when the supplier column is not mapped or a cell is blank)."
 );
 return;
 }
 if (!sendTo) {
 setSubmitError(
 "Select Send to (location). Create Sales only shows stock assigned to the selected store."
 );
 return;
 }
 setIsSubmitting(true);
 setSubmitError(null);
 setImportProgress(null);

 const categoryLookup = new Map(categoryNameToId);

 if (importType === "non-serial" && nonSerialCategoryMode === "fromColumn") {
 const namesByLower = new Map<string, string>();
 for (const row of mappedRows) {
 const nameVal = getMappedValue(row, "name").trim();
 if (!nameVal) continue;
 const purchasePrice = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
 const salePrice = parseFloat(getMappedValue(row, "salePrice")) || 0;
 if (purchasePrice <= 0 || salePrice <= 0) continue;
 const rawCat = getMappedValue(row, "category").trim();
 if (!rawCat) continue;
 const low = rawCat.toLowerCase();
 if (categoryLookup.has(low)) continue;
 if (!namesByLower.has(low)) namesByLower.set(low, rawCat.trim().slice(0, 50));
 }
 const toCreate = [...namesByLower.values()];
 if (toCreate.length > 0) {
 const ensured = await ensureNonSerialCategoriesForParcelImport(
  API_URL,
  getAuthHeaders(),
  toCreate,
  categoryLookup
 );
 if (!ensured.ok) {
  setSubmitError(ensured.error || "Could not create missing categories.");
  setIsSubmitting(false);
  return;
 }
 loadOptions("non-serial");
 }
 }

 const groups =
 importType === "non-serial"
 ? buildNonSerialGroups(categoryLookup)
 : importType === "serial"
  ? buildSerialGroups()
  : [];
 const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
 if (totalItems === 0) {
 setSubmitError(
 importType === "non-serial"
  ? nonSerialCategoryMode === "fromColumn"
  ? "No valid rows to import. Check name, quantity, prices, supplier (and default supplier), blank category cells (set a default), or category errors above."
  : "No valid rows to import (name, quantity, prices, and supplier required)."
  : "No valid rows to import (IMEI, prices, and supplier required)."
 );
 setIsSubmitting(false);
 return;
 }

 /** API accepts parcel payload (account + items); wider than PurchaseFormData typing. */
 const payloads: unknown[] = [];
 let globalBatchIndex = 0;
 for (const g of groups) {
 if (g.items.length === 0) continue;
 for (let i = 0; i < g.items.length; i += IMPORT_BATCH_SIZE) {
 const batchItems = g.items.slice(i, i + IMPORT_BATCH_SIZE);
 if (importType === "non-serial") {
  const batchOtherQty = (batchItems as NonSerialImportItem[]).reduce((s, it) => s + it.quantity, 0);
  const grandTotal = (batchItems as NonSerialImportItem[]).reduce(
  (s, it) => s + it.purchasePrice * it.quantity,
  0
  );
  payloads.push({
  account: g.account,
  accountModel: "Supplier",
  date: parcelDate,
  note: globalBatchIndex === 0 ? note || undefined : undefined,
  currency: "GBP",
  imeiQuantity: 0,
  otherQuantity: batchOtherQty,
  items: batchItems,
  totalIMEIs: 0,
  totalOtherQuantity: batchOtherQty,
  grandTotal,
  });
 } else {
  const batchImeis = (batchItems as SerialImportItem[]).reduce((s, it) => s + it.imeis.length, 0);
  const grandTotal = (batchItems as SerialImportItem[]).reduce(
  (s, it) => s + it.purchasePrice * it.imeis.length,
  0
  );
  payloads.push({
  account: g.account,
  accountModel: "Supplier",
  date: parcelDate,
  note: globalBatchIndex === 0 ? note || undefined : undefined,
  currency: "GBP",
  imeiQuantity: batchImeis,
  otherQuantity: 0,
  items: batchItems,
  totalIMEIs: batchImeis,
  totalOtherQuantity: 0,
  grandTotal,
  });
 }
 globalBatchIndex += 1;
 }
 }

 /** Run batch create with concurrency limit so multiple requests run in parallel. */
 const runWithConcurrency = async () => {
 let lastError: string | null = null;
 let completed = 0;
 const runNext = (index: number): Promise<void> => {
 if (lastError || index >= payloads.length) return Promise.resolve();
 return purchaseApi
  .createPurchase(payloads[index] as Parameters<typeof purchaseApi.createPurchase>[0])
  .then((res) => {
  completed += 1;
  setImportProgress({ current: completed, total: payloads.length });
  if (!res.success) {
  lastError = res.message || `Batch ${index + 1} failed.`;
  setSubmitError(lastError);
  return;
  }
  return runNext(index + IMPORT_CONCURRENCY);
  })
  .catch((e) => {
  lastError = e instanceof Error ? e.message : "Import failed.";
  setSubmitError(lastError);
  });
 };
 const workers = Array.from({ length: Math.min(IMPORT_CONCURRENCY, payloads.length) }, (_, i) => runNext(i));
 await Promise.all(workers);
 return lastError;
 };

 let lastError: string | null = null;
 try {
 lastError = await runWithConcurrency();
 if (!lastError) {
 clearSalesProductCache();
 emitInventoryEvent({ type: "purchase-imported" });
 onSuccess();
 onClose();
 }
 } catch (e) {
 const errMsg = e instanceof Error ? e.message : "Import failed.";
 setSubmitError(errMsg);
 } finally {
 setIsSubmitting(false);
 setImportProgress(null);
 }
 };

 const reset = () => {
 setImportType(initialImportType ?? null);
 setStep(initialImportType ? "upload" : "type");
 setFile(null);
 setParsed(null);
 setParseError(null);
 setCategoryId("");
 setNonSerialCategoryMode("single");
 setDefaultCategoryId("");
 setColumnMapping({});
 setSubmitError(null);
 };

 const stepsForTabs = importType == null ? (["type"] as const) : (["upload", "category", "mapping", "preview"] as const);

 if (!open) return null;

 const isPage = displayMode === "page";

 return (
 <div className={isPage ? "" : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"}>
 <div className={isPage ? "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" : "bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"}>
 <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-gray-900">
  {importType === "non-serial" ? "Import purchase from file (non-serial items)" : importType === "serial" ? "Import purchase from file (serial items)" : "Import purchase from file"}
  </h2>
  {!isPage && (
  <button type="button" onClick={() => { onClose(); reset(); }} className="p-2 text-gray-500 hover:text-gray-700 rounded">
   <X className="h-5 w-5" />
  </button>
  )}
 </div>

 <div className="flex border-b border-gray-200 overflow-x-auto">
  {stepsForTabs.map((s, i) => (
  <button
  key={s}
  type="button"
  onClick={() => setStep(s)}
  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
  step === s ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
  >
  {s === "type" && "1. Choose type"}
  {s === "upload" && (importType ? "1. Upload" : "2. Upload")}
  {s === "category" && (importType ? "2. Category" : "3. Category")}
  {s === "mapping" && (importType ? "3. Map columns" : "4. Map columns")}
  {s === "preview" && (importType ? "4. Preview & import" : "5. Preview & import")}
  {i < stepsForTabs.length - 1 && <ChevronRight className="h-4 w-4 opacity-50" />}
  </button>
  ))}
 </div>

 <div className="flex-1 overflow-y-auto p-5">
  {step === "type" && (
  <div className="space-y-4">
  <p className="text-sm text-gray-600">Choose what kind of items you are importing from your file.</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <button
   type="button"
   onClick={() => {
   setImportType("serial");
   loadOptions("serial");
   setStep("upload");
   }}
   className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-colors text-left"
  >
   <FileSpreadsheet className="h-10 w-10 text-orange-500" />
   <span className="font-medium text-gray-900">Serial items (IMEI)</span>
   <span className="text-xs text-gray-500 text-center">One row per device with IMEI/serial. Map columns to category and variants.</span>
  </button>
  <button
   type="button"
   onClick={() => {
   setImportType("non-serial");
   loadOptions("non-serial");
   setStep("upload");
   }}
   className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-colors text-left"
  >
   <Upload className="h-10 w-10 text-orange-500" />
   <span className="font-medium text-gray-900">Non-serial items</span>
   <span className="text-xs text-gray-500 text-center">Name, quantity, prices per row. e.g. accessories, back covers.</span>
  </button>
  </div>
  </div>
  )}

  {step === "upload" && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel or CSV file</label>
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
  <input
   type="file"
   accept=".csv,.xlsx,.xls"
   onChange={handleFileChange}
   className="hidden"
   id="import-file"
  />
  <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center gap-2">
   <Upload className="h-10 w-10 text-gray-400" />
   <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
   <span className="text-xs text-gray-500">CSV, XLSX or XLS</span>
  </label>
  </div>
  {file && (
  <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
   <FileSpreadsheet className="h-4 w-4" />
   {file.name} {parsed && `(${parsed.rows.length} rows)`}
  </p>
  )}
  {parseError && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
   <AlertCircle className="h-4 w-4" />
   {parseError}
  </p>
  )}
  <div className="mt-4 flex justify-end">
  <button
   type="button"
   onClick={() => setStep("category")}
   disabled={!parsed || parsed.rows.length === 0}
   className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  >
   Next: Select category
  </button>
  </div>
  </div>
  )}

  {step === "category" && (
  <div>
  {importType === "non-serial" && (
  <div className="space-y-3 mb-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
   <p className="text-sm font-medium text-gray-800">Category source</p>
   <label className="flex items-start gap-3 cursor-pointer">
   <input
   type="radio"
   name="non-serial-category-mode"
   className="mt-1"
   checked={nonSerialCategoryMode === "single"}
   onChange={() => {
   setNonSerialCategoryMode("single");
   setColumnMapping((m) => {
    const rest = { ...m };
    delete rest.category;
    return rest;
   });
   }}
   />
   <span>
   <span className="text-sm font-medium text-gray-900">One category for all rows</span>
   <span className="block text-xs text-gray-600 mt-0.5">
   Every imported line uses the category you select below.
   </span>
   </span>
   </label>
   <label className="flex items-start gap-3 cursor-pointer">
   <input
   type="radio"
   name="non-serial-category-mode"
   className="mt-1"
   checked={nonSerialCategoryMode === "fromColumn"}
   onChange={() => {
   setNonSerialCategoryMode("fromColumn");
   setCategoryId("");
   }}
   />
   <span>
   <span className="text-sm font-medium text-gray-900">Category from file column</span>
   <span className="block text-xs text-gray-600 mt-0.5">
   Each row can use a different category. In the next step, map a column whose cells match your category names (e.g. “Accessories”, “Cases”).
   </span>
   </span>
   </label>
  </div>
  )}

  {(importType !== "non-serial" || nonSerialCategoryMode === "single") && (
  <>
   <label className="block text-sm font-medium text-gray-700 mb-2">
   {importType === "non-serial" ? "Category for all rows" : "Category for serial items"}
   </label>
   <select
   value={categoryId}
   onChange={(e) => setCategoryId(e.target.value)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
   >
   <option value="">Select category</option>
   {categories.map((c) => (
   <option key={c._id} value={c._id}>{c.name}</option>
   ))}
   </select>
   {importType === "serial" && (
   <p className="mt-2 text-xs text-gray-500">Variant attributes from this category will appear in the mapping step.</p>
   )}
  </>
  )}

  {importType === "non-serial" && nonSerialCategoryMode === "fromColumn" && (
  <div className="mt-2">
   <label className="block text-sm font-medium text-gray-700 mb-2">Default category (optional)</label>
   <select
   value={defaultCategoryId}
   onChange={(e) => setDefaultCategoryId(e.target.value)}
   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
   >
   <option value="">— None: rows with an empty category cell are skipped —</option>
   {categories.map((c) => (
   <option key={c._id} value={c._id}>{c.name}</option>
   ))}
   </select>
   <p className="mt-2 text-xs text-gray-500">
   Names that already exist must match (ignoring case). New names in the file are created as non-serial categories when you import.
   </p>
  </div>
  )}

  <div className="mt-4 flex justify-end">
  <button
   type="button"
   onClick={() => setStep("mapping")}
   disabled={!canGoMapping}
   className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  >
   Next: Map columns
  </button>
  </div>
  </div>
  )}

  {step === "mapping" && (
  <div>
  <p className="text-sm text-gray-600 mb-4">
  {importType === "non-serial"
   ? nonSerialCategoryMode === "fromColumn"
   ? "Map each column. Category cells should match a category name, or a new non-serial category will be created on import if the name is new. Name, quantity, purchase price, and sale price are required. Optionally map Supplier — cells must match a supplier name (same as Settings → Peoples → Suppliers); blank uses the default supplier on the next step."
   : "Map each column. Name, quantity, purchase price, and sale price are required. Optionally map Supplier — match supplier name per row, or leave blank to use the default supplier on the next step."
   : "Map each file column to the correct field. IMEI, purchase price, and sale price are required. Optionally map Supplier — match supplier name per row, or leave blank to use the default supplier on the next step."}
  </p>
  <div className="space-y-3">
  {mappingFields.map(({ key, label }) => (
   <div key={key} className="flex items-center gap-3">
   <span className="w-56 text-sm font-medium text-gray-700 truncate">{label}</span>
   <select
   value={columnMapping[key] ?? ""}
   onChange={(e) => setColumnMapping((m) => ({ ...m, [key]: e.target.value }))}
   className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
   >
   <option value="">— Skip —</option>
   {parsed?.headers.map((h) => (
   <option key={h} value={h}>{h}</option>
   ))}
   </select>
   </div>
  ))}
  </div>
  <div className="mt-4 flex justify-end">
  <button
   type="button"
   onClick={() => setStep("preview")}
   disabled={!canGoPreview}
   className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  >
   Next: Preview & import
  </button>
  </div>
  </div>
  )}

  {step === "preview" && (
  <div className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">
   Default supplier
   </label>
   <select value={account} onChange={(e) => setAccount(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
   <option value="">Select supplier</option>
   {accountOptions.map((s) => (
   <option key={s._id} value={s._id}>{s.name}</option>
   ))}
   </select>
   <p className="mt-1 text-xs text-gray-500">
   Used when the supplier column is not mapped, when a cell is empty, or when the cell text does not match any supplier (e.g. “Unknown”). If every row resolves to the same supplier, one purchase is created.
   </p>
  </div>
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
   <input type="date" value={parcelDate} onChange={(e) => setParcelDate(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
  </div>
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">Send to (location) *</label>
   <select value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" required>
   <option value="">Select location</option>
   {sendToOptions.map((l) => (
   <option key={l._id} value={l._id}>{l.name}</option>
   ))}
   </select>
  </div>
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
   <select value={tax} onChange={(e) => setTax(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
   <option value="">—</option>
   {taxOptions.map((t) => (
   <option key={t._id} value={t._id}>{t.name}</option>
   ))}
   </select>
  </div>
  </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
  </div>

  {conditionStorageWarning && (
  <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-start gap-2">
   <AlertCircle className="h-5 w-5 text-neutral-600 flex-shrink-0 mt-0.5" />
   <p className="text-sm text-neutral-800">{conditionStorageWarning}</p>
  </div>
  )}
  {importType === "non-serial" && nonSerialCategoryMode === "fromColumn" && newCategoryNamesCount > 0 && (
  <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-start gap-2">
   <AlertCircle className="h-5 w-5 text-neutral-600 flex-shrink-0 mt-0.5" />
   <p className="text-sm text-neutral-800">
   {newCategoryNamesCount} distinct categor{newCategoryNamesCount === 1 ? "y" : "ies"} in the file{" "}
   {newCategoryNamesCount === 1 ? "is" : "are"} not in your catalog yet. They will be{" "}
   <strong>created as non-serial categories</strong> when you import (needs{" "}
   <strong>product.create</strong> permission). Names are trimmed to 50 characters.
   </p>
  </div>
  )}
  {importType === "non-serial" && nonSerialCategoryMode === "fromColumn" && categoryBlankNoDefaultRowCount > 0 && (
  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
   <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
   <p className="text-sm text-red-800">
   {categoryBlankNoDefaultRowCount} row{categoryBlankNoDefaultRowCount === 1 ? "" : "s"} have an empty category cell and no default category is set. Those rows will be skipped — choose a default category above or fill the category column.
   </p>
  </div>
  )}
  {importType === "non-serial" && duplicateBarcodeSkipRowCount > 0 && (
  <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-start gap-2">
   <AlertCircle className="h-5 w-5 text-neutral-600 flex-shrink-0 mt-0.5" />
   <p className="text-sm text-neutral-900">
   {duplicateBarcodeSkipRowCount} row{duplicateBarcodeSkipRowCount === 1 ? "" : "s"} will be skipped because the barcode duplicates an earlier row in this file. Only the first occurrence of each barcode is imported.
   </p>
  </div>
  )}
  {supplierNameFallbackRowCount > 0 && account.trim() && (
  <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-start gap-2">
   <AlertCircle className="h-5 w-5 text-neutral-600 flex-shrink-0 mt-0.5" />
   <p className="text-sm text-neutral-800">
   {supplierNameFallbackRowCount} row{supplierNameFallbackRowCount === 1 ? "" : "s"} have a supplier cell that does not match any name in your supplier list. The{" "}
   <strong>default supplier</strong> above will be used for those rows.
   </p>
  </div>
  )}
  {unresolvedSupplierRowCount > 0 && (
  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
   <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
   <p className="text-sm text-red-800">
   {unresolvedSupplierRowCount} row{unresolvedSupplierRowCount === 1 ? "" : "s"} cannot be assigned a supplier — select a <strong>default supplier</strong> above (required when the supplier column is mapped or for blank cells).
   </p>
  </div>
  )}
  <div>
  <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 10 rows)</p>
  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
   <table className="min-w-full text-sm">
   <thead className="bg-gray-50 sticky top-0">
   <tr>
   {importType === "non-serial" ? (
    <>
    {nonSerialCategoryMode === "fromColumn" && (
    <th className="px-3 py-2 text-left font-medium text-gray-600">Category</th>
    )}
    <th className="px-3 py-2 text-left font-medium text-gray-600">Supplier</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Qty</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Purchase</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Sale</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Barcode</th>
    </>
   ) : (
    <>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Supplier</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">IMEI</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Purchase</th>
    <th className="px-3 py-2 text-left font-medium text-gray-600">Sale</th>
    {variantAttributes.map((a) => (
    <th key={a._id} className="px-3 py-2 text-left font-medium text-gray-600">{a.name}</th>
    ))}
    </>
   )}
   </tr>
   </thead>
   <tbody>
   {previewRows.map((row, i) => (
   <tr key={i} className="border-t border-gray-100">
    {importType === "non-serial" ? (
    <>
    {nonSerialCategoryMode === "fromColumn" && (() => {
    const raw = getMappedValue(row, "category").trim();
    const cid = resolveNonSerialCategoryId(row);
    const resolvedName = cid ? categories.find((c) => c._id === cid)?.name : null;
    const nameOk = getMappedValue(row, "name").trim();
    const pp = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
    const sp = parseFloat(getMappedValue(row, "salePrice")) || 0;
    const isDataRow = nameOk && pp > 0 && sp > 0;
    const blankNoDefault = isDataRow && !raw && !defaultCategoryId;
    const willCreate = isDataRow && !!raw && !cid;
    return (
     <td className="px-3 py-1.5">
     <span className={blankNoDefault ? "text-red-700" : ""}>{raw || "—"}</span>
     {resolvedName && (
     <span className="block text-xs text-gray-500">→ {resolvedName}</span>
     )}
     {willCreate && (
     <span className="block text-xs text-neutral-700 font-medium">→ New category on import</span>
     )}
     {blankNoDefault && (
     <span className="block text-xs text-red-600">Set default or fill category</span>
     )}
     </td>
    );
    })()}
    {(() => {
    const supHeader = columnMapping["supplier"];
    const rawSup = supHeader ? (row[supHeader] ?? "").trim() : "";
    const matchedDirectId = rawSup ? supplierNameToId.get(rawSup.toLowerCase()) : undefined;
    const sid = resolveSupplierId(row);
    const sname = sid ? accountOptions.find((s) => s._id === sid)?.name : null;
    const nameOk = getMappedValue(row, "name").trim();
    const pp = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
    const sp = parseFloat(getMappedValue(row, "salePrice")) || 0;
    const isDataRow = nameOk && pp > 0 && sp > 0;
    const rawCat = getMappedValue(row, "category").trim();
    const categoryOkForRow =
     nonSerialCategoryMode === "single"
     ? Boolean(categoryId)
     : Boolean(resolveNonSerialCategoryId(row) || rawCat || defaultCategoryId);
    const isImportRow = isDataRow && categoryOkForRow;
    const badSup = isImportRow && !sid;
    const usedUnmatchedFallback = Boolean(
     supHeader && rawSup && !matchedDirectId && account.trim() && sid === account
    );
    return (
     <td className="px-3 py-1.5">
     <span className={badSup ? "text-red-700" : ""}>
     {supHeader ? (rawSup || "(empty → default)") : "From default only"}
     </span>
     {sname && (
     <span className="block text-xs text-gray-500">
     → {sname}
     {usedUnmatchedFallback ? " (default)" : ""}
     </span>
     )}
     {badSup && <span className="block text-xs text-red-600">Select default supplier</span>}
     </td>
    );
    })()}
    <td className="px-3 py-1.5">{getMappedValue(row, "name")}</td>
    <td className="px-3 py-1.5">{getMappedValue(row, "quantity")}</td>
    <td className="px-3 py-1.5">{getMappedValue(row, "purchasePrice")}</td>
    <td className="px-3 py-1.5">{getMappedValue(row, "salePrice")}</td>
    <td className="px-3 py-1.5">{getMappedValue(row, "barcode")}</td>
    </>
    ) : (
    <>
    {(() => {
    const supHeader = columnMapping["supplier"];
    const rawSup = supHeader ? (row[supHeader] ?? "").trim() : "";
    const matchedDirectId = rawSup ? supplierNameToId.get(rawSup.toLowerCase()) : undefined;
    const sid = resolveSupplierId(row);
    const sname = sid ? accountOptions.find((s) => s._id === sid)?.name : null;
    const imeiOk = getMappedValue(row, "imei").trim();
    const pp = parseFloat(getMappedValue(row, "purchasePrice")) || 0;
    const sp = parseFloat(getMappedValue(row, "salePrice")) || 0;
    const isImportRow = imeiOk && pp > 0 && sp > 0;
    const badSup = isImportRow && !sid;
    const usedUnmatchedFallback = Boolean(
     supHeader && rawSup && !matchedDirectId && account.trim() && sid === account
    );
    return (
     <td className="px-3 py-1.5">
     <span className={badSup ? "text-red-700" : ""}>
     {supHeader ? (rawSup || "(empty → default)") : "From default only"}
     </span>
     {sname && (
     <span className="block text-xs text-gray-500">
     → {sname}
     {usedUnmatchedFallback ? " (default)" : ""}
     </span>
     )}
     {badSup && <span className="block text-xs text-red-600">Select default supplier</span>}
     </td>
    );
    })()}
    <td className="px-3 py-1.5 font-mono text-xs">{getMappedValue(row, "imei")}</td>
    <td className="px-3 py-1.5">{getMappedValue(row, "purchasePrice")}</td>
    <td className="px-3 py-1.5">{getMappedValue(row, "salePrice")}</td>
    {variantAttributes.map((a) => (
    <td key={a._id} className="px-3 py-1.5">{getMappedValue(row, `variant:${a.slug}`)}</td>
    ))}
    </>
    )}
   </tr>
   ))}
   </tbody>
   </table>
  </div>
  <p className="mt-1 text-xs text-gray-500">Total rows to import: {mappedRows.length}</p>
  {columnMapping["supplier"] && (
   <p className="mt-1 text-xs text-gray-600">
   Supplier column is mapped: rows are grouped by supplier. Each supplier gets at least one purchase (additional purchases if a supplier has more than {IMPORT_BATCH_SIZE} lines).
   </p>
  )}
  {mappedRows.length > IMPORT_BATCH_SIZE && (
   <p className="mt-1 text-xs text-neutral-700">
   Large imports are split into batches of up to {IMPORT_BATCH_SIZE} items per request. Up to {IMPORT_CONCURRENCY} batches run in parallel.
   </p>
  )}
  </div>

  {importProgress && (
  <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
   <p className="text-sm font-medium text-orange-800">
   Importing batch {importProgress.current} of {importProgress.total}…
   </p>
   <div className="mt-2 h-2 bg-orange-100 rounded-full overflow-hidden">
   <div
   className="h-full bg-orange-500 transition-all duration-300"
   style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
   />
   </div>
  </div>
  )}

  {submitError && (
  <p className="text-sm text-red-600 flex items-center gap-1">
   <AlertCircle className="h-4 w-4 flex-shrink-0" />
   {submitError}
  </p>
  )}

  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => setStep("mapping")} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
   Back
  </button>
  <button
   type="button"
   onClick={handleImport}
   disabled={isSubmitting || !account}
   className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  >
   {isSubmitting ? "Importing…" : "Import purchase"}
  </button>
  </div>
  </div>
  )}
 </div>
 </div>
 </div>
 );
};

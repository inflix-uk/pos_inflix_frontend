"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, FileSpreadsheet, ChevronRight, AlertCircle } from "lucide-react";
import { parseImportFile, type ParsedImportFile } from "../utils/parseImportFile";
import { customerApi } from "../../peoples/customers/service";
import type { CustomerFormData } from "../../peoples/customers/types";

export type ImportStep = "upload" | "mapping" | "preview";

const CUSTOMER_MAPPING_FIELDS = [
 { key: "name", label: "Name (required)" },
 { key: "phone", label: "Phone (optional)" },
 { key: "email", label: "Email (optional)" },
 { key: "balance", label: "Balance brought forward (optional)" },
 { key: "companyNumber", label: "Company number (optional)" },
 { key: "contactName", label: "Contact name (optional)" },
 { key: "mobile", label: "Mobile (optional)" },
 { key: "vatNumber", label: "VAT number (optional)" },
 { key: "addressLine1", label: "Address line 1 (optional)" },
 { key: "addressLine2", label: "Address line 2 (optional)" },
 { key: "city", label: "City (optional)" },
 { key: "state", label: "State / County (optional)" },
 { key: "postcode", label: "Postcode (optional)" },
 { key: "country", label: "Country (optional)" },
];

const REQUIRED_KEYS = ["name"];
const BATCH_SIZE = 50;

interface ImportCustomersModalProps {
 open: boolean;
 onClose: () => void;
 /** Called with the number of customers just imported (for undo). */
 onSuccess: (importedCount: number) => void;
}

export const ImportCustomersModal: React.FC<ImportCustomersModalProps> = ({
 open,
 onClose,
 onSuccess,
}) => {
 const [step, setStep] = useState<ImportStep>("upload");
 const [file, setFile] = useState<File | null>(null);
 const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
 const [parseError, setParseError] = useState<string | null>(null);
 const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
 const [submitError, setSubmitError] = useState<string | null>(null);

 useEffect(() => {
 if (!open) return;
 setStep("upload");
 setFile(null);
 setParsed(null);
 setParseError(null);
 setColumnMapping({});
 setSubmitError(null);
 }, [open]);

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

 const getMappedValue = (row: Record<string, string>, key: string): string => {
 const header = columnMapping[key];
 if (!header) return "";
 return (row[header] ?? "").trim();
 };

 const canGoMapping = !!(parsed && parsed.rows.length > 0);
 const canGoPreview = REQUIRED_KEYS.every((k) => columnMapping[k]);
 const mappedRows = parsed?.rows ?? [];
 const previewRows = mappedRows.slice(0, 10);

 const parseBalance = (value: string): number | undefined => {
 const s = (value ?? "").trim().replace(/,/g, "");
 if (!s) return undefined;
 const n = Number(s);
 if (Number.isNaN(n)) return undefined;
 return Math.round(n * 100) / 100;
 };

 const buildCustomerPayload = (row: Record<string, string>): CustomerFormData => {
 const get = (k: string) => getMappedValue(row, k);
 const balanceVal = parseBalance(get("balance"));
 return {
 name: get("name") || "Unknown",
 phone: get("phone") || "—",
 email: get("email") || "",
 balance: balanceVal !== undefined && balanceVal !== 0 ? balanceVal : undefined,
 companyNumber: get("companyNumber") || undefined,
 contactName: get("contactName") || undefined,
 mobile: get("mobile") || undefined,
 vatNumber: get("vatNumber") || undefined,
 address: {
 street: get("addressLine1") || undefined,
 addressLine2: get("addressLine2") || undefined,
 city: get("city") || undefined,
 state: get("state") || undefined,
 zipCode: get("postcode") || undefined,
 country: get("country") || "United Kingdom",
 },
 isActive: true,
 };
 };

 const handleSubmit = async () => {
 if (mappedRows.length === 0) {
 setSubmitError("No valid rows to import.");
 return;
 }
 const payloads = mappedRows
 .map((row) => {
 const name = getMappedValue(row, "name");
 if (!name) return null;
 return buildCustomerPayload(row);
 })
 .filter((p): p is CustomerFormData => p !== null);

 if (payloads.length === 0) {
 setSubmitError("No valid rows (name is required for each).");
 return;
 }

 setSubmitError(null);
 setIsSubmitting(true);
 setImportProgress({ current: 0, total: payloads.length });

 let created = 0;
 let lastError: string | null = null;

 for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
 const batch = payloads.slice(i, i + BATCH_SIZE);
 const results = await Promise.all(
 batch.map((p) =>
  customerApi.create(p).then((r) => ({ success: r.success, message: (r as { message?: string }).message }))
 )
 );
 const failed = results.find((r) => !r.success);
 if (failed) {
 lastError = failed.message || "Create failed.";
 setSubmitError(lastError);
 break;
 }
 created += batch.length;
 setImportProgress({ current: created, total: payloads.length });
 }

 setIsSubmitting(false);
 setImportProgress(null);
 if (!lastError) {
 onSuccess(created);
 onClose();
 }
 };

 const reset = () => {
 setStep("upload");
 setFile(null);
 setParsed(null);
 setParseError(null);
 setColumnMapping({});
 setSubmitError(null);
 };

 if (!open) return null;

 const steps: ImportStep[] = ["upload", "mapping", "preview"];

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
 <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
 <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-gray-900">Import customers from file</h2>
  <button
  type="button"
  onClick={() => {
  onClose();
  reset();
  }}
  className="p-2 text-gray-500 hover:text-gray-700 rounded"
  >
  <X className="h-5 w-5" />
  </button>
 </div>

 <div className="flex border-b border-gray-200 overflow-x-auto">
  {steps.map((s, i) => (
  <button
  key={s}
  type="button"
  onClick={() => setStep(s)}
  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
  step === s ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
  >
  {s === "upload" && "1. Upload"}
  {s === "mapping" && "2. Map columns"}
  {s === "preview" && "3. Preview & import"}
  {i < steps.length - 1 && <ChevronRight className="h-4 w-4 opacity-50" />}
  </button>
  ))}
 </div>

 <div className="flex-1 overflow-y-auto p-5">
  {step === "upload" && (
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel or CSV file</label>
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
  <input
   type="file"
   accept=".csv,.xlsx,.xls"
   onChange={handleFileChange}
   className="hidden"
   id="customer-import-file"
  />
  <label
   htmlFor="customer-import-file"
   className="cursor-pointer flex flex-col items-center gap-2"
  >
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
  Map each file column to the correct field. Only Name is required.
  </p>
  <div className="space-y-3">
  {CUSTOMER_MAPPING_FIELDS.map(({ key, label }) => (
   <div key={key} className="flex items-center gap-3">
   <span className="w-48 text-sm font-medium text-gray-700 truncate">{label}</span>
   <select
   value={columnMapping[key] ?? ""}
   onChange={(e) => setColumnMapping((m) => ({ ...m, [key]: e.target.value }))}
   className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
   >
   <option value="">— Skip —</option>
   {parsed?.headers.map((h) => (
   <option key={h} value={h}>
    {h}
   </option>
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
  <p className="text-sm text-gray-600">
  First 10 rows below. Will import {mappedRows.filter((r) => getMappedValue(r, "name")).length} customers.
  </p>
  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
  <table className="w-full text-sm">
   <thead className="bg-gray-50 sticky top-0">
   <tr>
   <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
   <th className="px-3 py-2 text-left font-medium text-gray-700">Phone</th>
   <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
   <th className="px-3 py-2 text-right font-medium text-gray-700">Balance</th>
   </tr>
   </thead>
   <tbody>
   {previewRows.map((row, i) => (
   <tr key={i} className="border-t border-gray-100">
   <td className="px-3 py-2">{getMappedValue(row, "name") || "—"}</td>
   <td className="px-3 py-2">{getMappedValue(row, "phone") || "—"}</td>
   <td className="px-3 py-2">{getMappedValue(row, "email") || "—"}</td>
   <td className="px-3 py-2 text-right">{parseBalance(getMappedValue(row, "balance")) ?? "—"}</td>
   </tr>
   ))}
   </tbody>
  </table>
  </div>
  {submitError && (
  <p className="text-sm text-red-600 flex items-center gap-1">
   <AlertCircle className="h-4 w-4 flex-shrink-0" />
   {submitError}
  </p>
  )}
  {importProgress && (
  <p className="text-sm text-gray-600">
   Importing… {importProgress.current} / {importProgress.total}
  </p>
  )}
  <div className="flex justify-end gap-2">
  <button
   type="button"
   onClick={() => setStep("mapping")}
   disabled={isSubmitting}
   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
  >
   Back
  </button>
  <button
   type="button"
   onClick={handleSubmit}
   disabled={isSubmitting}
   className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  >
   {isSubmitting ? "Importing…" : "Import customers"}
  </button>
  </div>
  </div>
  )}
 </div>
 </div>
 </div>
 );
};

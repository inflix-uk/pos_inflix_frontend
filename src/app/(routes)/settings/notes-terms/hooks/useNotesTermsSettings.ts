"use client";

import { useState, useEffect, useCallback } from "react";
import { mergeRepairLabelPrintSettings, type RepairLabelPrintSettings } from "@/lib/repairLabelPrintConfig";
import { mergeInvoicePdfPrintOptions, type InvoicePdfPrintOptions } from "@/lib/invoicePdfPrintOptions";
import {
 mergeBusinessInvoicePdfPrintOptions,
 toBusinessInvoicePdfPrintRecord,
 type BusinessInvoicePdfPrintOptions,
} from "@/lib/businessInvoicePdfPrintOptions";
import { normalizeA4InvoiceTemplate, type A4InvoiceTemplateId } from "@/lib/a4InvoiceTemplate";
import {
 mergeReceiptPrinterSalesPrintOptions,
 mergeReceiptPrinterRepairPrintOptions,
 type ReceiptPrinterSalesPrintOptions,
 type ReceiptPrinterRepairPrintOptions,
} from "@/lib/receiptPrinterPrintOptions";
import { NotesTermsSettings, NotesTermsFormData, Message } from "../types";
import { notesTermsApi } from "../service";
import type {
 RepairLabelTextFieldId,
 RepairTicketFontSizeKey,
 SalesReceiptFontSizeKey,
} from "@/lib/receiptPrintLayout";

const defaultTerms = `*30 Days Limited Warranty

All Stock is Tested by Professionals

Warranty void if the attempted to temper or disassembled

Warranty void if damaged or broken`;

const initialFormData: NotesTermsFormData = {
 deliveryAddress: "",
 purchaseTermsConditions: defaultTerms,
 pdfSalesTerms: defaultTerms,
 receiptPrinterSalesTerms: "",
 receiptPrinterRepairTerms: "",
 receiptPrinterSalesPrint: mergeReceiptPrinterSalesPrintOptions(),
 receiptPrinterRepairPrint: mergeReceiptPrinterRepairPrintOptions(),
 paymentNote: "",
 repairLabelPrint: mergeRepairLabelPrintSettings(),
 invoicePdfPrint: mergeInvoicePdfPrintOptions(),
 businessInvoicePdfPrint: mergeBusinessInvoicePdfPrintOptions(),
 businessInvoiceTerms: "",
 a4InvoiceTemplate: "dispatch",
};

const buildFormData = (data: NotesTermsSettings): NotesTermsFormData => ({
 deliveryAddress: data.deliveryAddress || "",
 purchaseTermsConditions: data.purchaseTermsConditions || defaultTerms,
 pdfSalesTerms: data.pdfSalesTerms || defaultTerms,
 receiptPrinterSalesTerms: data.receiptPrinterSalesTerms || "",
 receiptPrinterRepairTerms: data.receiptPrinterRepairTerms || "",
 receiptPrinterSalesPrint: mergeReceiptPrinterSalesPrintOptions(data.receiptPrinterSalesPrint),
 receiptPrinterRepairPrint: mergeReceiptPrinterRepairPrintOptions(data.receiptPrinterRepairPrint),
 paymentNote: data.paymentNote || "",
 repairLabelPrint: mergeRepairLabelPrintSettings(data.repairLabelPrint),
 invoicePdfPrint: mergeInvoicePdfPrintOptions(data.invoicePdfPrint),
 businessInvoicePdfPrint: mergeBusinessInvoicePdfPrintOptions(data.businessInvoicePdfPrint),
 businessInvoiceTerms: data.businessInvoiceTerms || "",
 a4InvoiceTemplate: normalizeA4InvoiceTemplate(data.a4InvoiceTemplate),
});

const REPAIR_LABEL_NUM_KEYS = new Set<keyof RepairLabelPrintSettings>([
 "labelWidthMm",
 "labelHeightMm",
 "fontSizePt",
 "lineHeightMm",
 "qrSizeMm",
 "maxProblemLines",
]);
const REPAIR_LABEL_BOOL_KEYS = new Set<keyof RepairLabelPrintSettings>([
 "showQr",
 "showReferenceText",
 "showCustomerName",
 "showContactPhone",
 "showContactEmail",
 "showDeviceDescription",
 "showProblemType",
 "showSerialNumber",
 "showEstimatedCost",
 "invertSilentPrintOrientation",
]);

const RECEIPT_SALES_BOOL_KEYS = new Set<keyof ReceiptPrinterSalesPrintOptions>([
 "showLogo",
 "showShopName",
 "showShopAddress",
 "showReceiptTitle",
 "showReferenceAndDate",
 "showCustomerNameAndAddress",
 "showCustomerPhone",
 "showCustomerEmail",
 "showLocationPhone",
 "showLocationEmail",
 "showLineItems",
 "showItemSerials",
 "showTotal",
 "showTermsText",
 "showThankYou",
 "showReceiptReferenceQr",
]);

const RECEIPT_SALES_NUM_KEYS = new Set([
 "paperWidthMm",
 "sideMarginMm",
 "fontHeadingPt",
 "fontBodyPt",
 "fontSmallPt",
 "fontLineItemPt",
 "receiptReferenceQrSizeMm",
]);

const RECEIPT_REPAIR_NUM_KEYS = new Set([
 "paperWidthMm",
 "sideMarginMm",
 "fontHeadingPt",
 "fontBodyPt",
 "fontSmallPt",
 "qrSizeMm",
]);

const RECEIPT_REPAIR_BOOL_KEYS = new Set<keyof ReceiptPrinterRepairPrintOptions>([
 "showLogo",
 "showShopName",
 "showShopAddress",
 "showTicketTitle",
 "showQrCode",
 "showReferenceLine",
 "showDate",
 "showCustomerName",
 "showContactPhone",
 "showContactEmail",
 "showDeviceDescription",
 "showSerialNumber",
 "showDevicePassword",
 "showProblemType",
 "showEstimatedCost",
 "showRepairItems",
 "showActualCost",
 "showStatus",
 "showNotes",
 "showTermsText",
 "showThankYou",
 "showLocationPhone",
 "showLocationEmail",
]);

const INVOICE_PDF_NUM_KEYS = new Set([
 "marginMm",
 "fontCompanyNamePt",
 "fontDocTitlePt",
 "fontSectionHeadingPt",
 "fontBodyPt",
 "fontTablePt",
 "fontTermsPt",
 "logoWidthMm",
 "logoHeightMm",
 "invoiceReferenceQrSizeMm",
]);

type InvoicePdfPrintToggleKey = {
 [K in keyof InvoicePdfPrintOptions]-?: InvoicePdfPrintOptions[K] extends boolean ? K : never;
}[keyof InvoicePdfPrintOptions];

const INVOICE_PDF_BOOL_KEYS = new Set<InvoicePdfPrintToggleKey>([
 "showLogo",
 "showCompanyName",
 "showBillTo",
 "showItemsSummary",
 "showSerialDetails",
 "showInvoiceSummary",
 "showAccountSummary",
 "showPayments",
 "showPdfSalesTerms",
 "showPaymentNote",
 "showBankDetails",
 "showInvoiceReferenceQr",
]);

type BusinessInvoicePdfPrintToggleKey = {
 [K in keyof BusinessInvoicePdfPrintOptions]-?: BusinessInvoicePdfPrintOptions[K] extends boolean
  ? K
  : never;
}[keyof BusinessInvoicePdfPrintOptions];

const BUSINESS_INVOICE_PDF_BOOL_KEYS = new Set<BusinessInvoicePdfPrintToggleKey>([
 "showLogo",
 "showCompanyName",
 "showBillTo",
 "showItemsSummary",
 "showSerialDetails",
 "showInvoiceSummary",
 "showAccountSummary",
 "showPayments",
 "showPdfSalesTerms",
 "showPaymentNote",
 "showBankDetails",
 "showInvoiceReferenceQr",
 "showCompanyNumber",
 "showVatNumber",
 "showFooterLegalLine",
 "showTax",
]);

const BUSINESS_INVOICE_PDF_NUM_KEYS = new Set([...INVOICE_PDF_NUM_KEYS]);

function moveOrderItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
 if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
  return [...list];
 }
 const next = [...list];
 const [removed] = next.splice(fromIndex, 1);
 next.splice(toIndex, 0, removed);
 return next;
}

export const useNotesTermsSettings = () => {
 const [formData, setFormData] = useState<NotesTermsFormData>(initialFormData);
 const [originalData, setOriginalData] = useState<NotesTermsSettings | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [message, setMessage] = useState<Message>({ type: "", text: "" });

 // Fetch existing settings
 const fetchSettings = useCallback(async () => {
  setIsLoading(true);
  try {
   const response = await notesTermsApi.getSettings();

   if (response.success && response.data) {
    const data = response.data;
    setOriginalData(data);
    setFormData(buildFormData(data));
   } else {
    setFormData(initialFormData);
   }
  } catch {
   setMessage({ type: "error", text: "Failed to load settings" });
   setFormData(initialFormData);
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchSettings();
 }, [fetchSettings]);

 // Clear message after 5 seconds
 useEffect(() => {
  if (message.text) {
   const timer = setTimeout(() => {
    setMessage({ type: "", text: "" });
   }, 5000);
   return () => clearTimeout(timer);
  }
 }, [message]);

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
 ) => {
  const target = e.target;
  const name = target.name;

  if (name === "a4InvoiceTemplate") {
   const value = (target as HTMLSelectElement).value as A4InvoiceTemplateId;
   setFormData((prev) => ({
    ...prev,
    a4InvoiceTemplate: normalizeA4InvoiceTemplate(value),
   }));
   return;
  }

  if (name === "businessInvoiceTerms") {
   const { value } = target as HTMLTextAreaElement;
   setFormData((prev) => ({
    ...prev,
    businessInvoiceTerms: value,
    a4InvoiceTemplate: "business",
   }));
   return;
  }

  if (name.startsWith("businessInvoicePdfPrint.")) {
   const key = name.slice("businessInvoicePdfPrint.".length);
   if (key === "documentTitle") {
    const { value } = target as HTMLInputElement;
    setFormData((prev) => ({
     ...prev,
     a4InvoiceTemplate: "business",
     businessInvoicePdfPrint: { ...prev.businessInvoicePdfPrint, documentTitle: value },
    }));
    return;
   }
   if (BUSINESS_INVOICE_PDF_NUM_KEYS.has(key)) {
    const raw = (target as HTMLInputElement).value;
    const n = parseFloat(raw);
    setFormData((prev) => {
     const cur = prev.businessInvoicePdfPrint;
     const k = key as keyof BusinessInvoicePdfPrintOptions;
     const fallback = cur[k] as number;
     const next = Number.isFinite(n) ? n : fallback;
     return {
      ...prev,
      a4InvoiceTemplate: "business",
      businessInvoicePdfPrint: { ...cur, [k]: next },
     };
    });
    return;
   }
   const boolKey = key as keyof BusinessInvoicePdfPrintOptions;
   if (!BUSINESS_INVOICE_PDF_BOOL_KEYS.has(boolKey as BusinessInvoicePdfPrintToggleKey)) return;
   const checked = (target as HTMLInputElement).checked;
   setFormData((prev) => ({
    ...prev,
    a4InvoiceTemplate: "business",
    businessInvoicePdfPrint: { ...prev.businessInvoicePdfPrint, [boolKey]: checked },
   }));
   return;
  }

  if (name.startsWith("invoicePdfPrint.")) {
   const key = name.slice("invoicePdfPrint.".length);
   if (INVOICE_PDF_NUM_KEYS.has(key)) {
    const raw = (target as HTMLInputElement).value;
    const n = parseFloat(raw);
    setFormData((prev) => {
     const cur = prev.invoicePdfPrint;
     const k = key as keyof InvoicePdfPrintOptions;
     const fallback = cur[k] as number;
     const next = Number.isFinite(n) ? n : fallback;
     return {
      ...prev,
      invoicePdfPrint: { ...cur, [k]: next },
     };
    });
    return;
   }
   const boolKey = key as keyof InvoicePdfPrintOptions;
   if (!INVOICE_PDF_BOOL_KEYS.has(boolKey as InvoicePdfPrintToggleKey)) return;
   const checked = (target as HTMLInputElement).checked;
   setFormData((prev) => ({
    ...prev,
    invoicePdfPrint: { ...prev.invoicePdfPrint, [boolKey]: checked },
   }));
   return;
  }

  if (name.startsWith("receiptPrinterSalesPrint.sectionFontPt.")) {
   const subKey = name.slice("receiptPrinterSalesPrint.sectionFontPt.".length) as SalesReceiptFontSizeKey;
   const raw = (target as HTMLInputElement).value;
   setFormData((prev) => {
    const cur: Partial<Record<SalesReceiptFontSizeKey, number>> = {
     ...(prev.receiptPrinterSalesPrint.sectionFontPt || {}),
    };
    if (raw === "" || raw.trim() === "") {
     delete cur[subKey];
    } else {
     const n = parseFloat(raw);
     if (Number.isFinite(n)) cur[subKey] = n;
    }
    return {
     ...prev,
     receiptPrinterSalesPrint: { ...prev.receiptPrinterSalesPrint, sectionFontPt: cur },
    };
   });
   return;
  }

  if (name.startsWith("receiptPrinterRepairPrint.sectionFontPt.")) {
   const subKey = name.slice("receiptPrinterRepairPrint.sectionFontPt.".length) as RepairTicketFontSizeKey;
   const raw = (target as HTMLInputElement).value;
   setFormData((prev) => {
    const cur: Partial<Record<RepairTicketFontSizeKey, number>> = {
     ...(prev.receiptPrinterRepairPrint.sectionFontPt || {}),
    };
    if (raw === "" || raw.trim() === "") {
     delete cur[subKey];
    } else {
     const n = parseFloat(raw);
     if (Number.isFinite(n)) cur[subKey] = n;
    }
    return {
     ...prev,
     receiptPrinterRepairPrint: { ...prev.receiptPrinterRepairPrint, sectionFontPt: cur },
    };
   });
   return;
  }

  if (name.startsWith("repairLabelPrint.fieldFontPt.")) {
   const subKey = name.slice("repairLabelPrint.fieldFontPt.".length) as RepairLabelTextFieldId;
   const raw = (target as HTMLInputElement).value;
   setFormData((prev) => {
    const cur: Partial<Record<RepairLabelTextFieldId, number>> = {
     ...(prev.repairLabelPrint.fieldFontPt || {}),
    };
    if (raw === "" || raw.trim() === "") {
     delete cur[subKey];
    } else {
     const n = parseFloat(raw);
     if (Number.isFinite(n)) cur[subKey] = n;
    }
    return { ...prev, repairLabelPrint: { ...prev.repairLabelPrint, fieldFontPt: cur } };
   });
   return;
  }

  if (name.startsWith("receiptPrinterSalesPrint.")) {
   const key = name.slice("receiptPrinterSalesPrint.".length);
   if (RECEIPT_SALES_NUM_KEYS.has(key)) {
    const raw = (target as HTMLInputElement).value;
    const n = parseFloat(raw);
    setFormData((prev) => {
     const cur = prev.receiptPrinterSalesPrint;
     const k = key as keyof ReceiptPrinterSalesPrintOptions;
     const fallback = cur[k] as number;
     const next = Number.isFinite(n) ? n : fallback;
     return {
      ...prev,
      receiptPrinterSalesPrint: { ...cur, [k]: next },
     };
    });
    return;
   }
   const boolKey = key as keyof ReceiptPrinterSalesPrintOptions;
   if (!RECEIPT_SALES_BOOL_KEYS.has(boolKey)) return;
   const checked = (target as HTMLInputElement).checked;
   setFormData((prev) => ({
    ...prev,
    receiptPrinterSalesPrint: { ...prev.receiptPrinterSalesPrint, [boolKey]: checked },
   }));
   return;
  }

  if (name.startsWith("receiptPrinterRepairPrint.")) {
   const key = name.slice("receiptPrinterRepairPrint.".length);
   if (RECEIPT_REPAIR_NUM_KEYS.has(key)) {
    const raw = (target as HTMLInputElement).value;
    const n = parseFloat(raw);
    setFormData((prev) => {
     const cur = prev.receiptPrinterRepairPrint;
     const k = key as keyof ReceiptPrinterRepairPrintOptions;
     const fallback = cur[k] as number;
     const next = Number.isFinite(n) ? n : fallback;
     return {
      ...prev,
      receiptPrinterRepairPrint: { ...cur, [k]: next },
     };
    });
    return;
   }
   const boolKey = key as keyof ReceiptPrinterRepairPrintOptions;
   if (!RECEIPT_REPAIR_BOOL_KEYS.has(boolKey)) return;
   const checked = (target as HTMLInputElement).checked;
   setFormData((prev) => ({
    ...prev,
    receiptPrinterRepairPrint: { ...prev.receiptPrinterRepairPrint, [boolKey]: checked },
   }));
   return;
  }

  if (name.startsWith("repairLabelPrint.")) {
   const key = name.slice("repairLabelPrint.".length) as keyof RepairLabelPrintSettings;
   setFormData((prev) => {
    const cur = prev.repairLabelPrint;
    if (REPAIR_LABEL_BOOL_KEYS.has(key)) {
     const checked = (target as HTMLInputElement).checked;
     return { ...prev, repairLabelPrint: { ...cur, [key]: checked } };
    }
    if (REPAIR_LABEL_NUM_KEYS.has(key)) {
     const raw = (target as HTMLInputElement).value;
     const n = parseFloat(raw);
     const fallback = cur[key] as number;
     const next = Number.isFinite(n) ? n : fallback;
     return { ...prev, repairLabelPrint: { ...cur, [key]: next } };
    }
    const strVal = (target as HTMLSelectElement).value;
    if (key === "qrPosition") {
     return {
      ...prev,
      repairLabelPrint: { ...cur, qrPosition: strVal === "right" ? "right" : "left" },
     };
    }
    if (key === "textAlign") {
     const ta = strVal === "center" || strVal === "right" ? strVal : "left";
     return { ...prev, repairLabelPrint: { ...cur, textAlign: ta } };
    }
    if (key === "silentPrintLayoutMode") {
     const mode = strVal === "swap_columns" ? "swap_columns" : "same_as_pdf";
     return { ...prev, repairLabelPrint: { ...cur, silentPrintLayoutMode: mode } };
    }
    return prev;
   });
   return;
  }

  const { value } = target as HTMLInputElement | HTMLTextAreaElement;
  setFormData((prev) => ({ ...prev, [name]: value }));
 };

 // Save settings
 const saveSettings = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setMessage({ type: "", text: "" });

  try {
   const payload: NotesTermsFormData = {
    ...formData,
    businessInvoicePdfPrint: toBusinessInvoicePdfPrintRecord(formData.businessInvoicePdfPrint),
   };
   const response = await notesTermsApi.saveSettings(payload);

   if (response.success && response.data) {
    setOriginalData(response.data);
    setFormData(buildFormData(response.data));
    setMessage({ type: "success", text: response.message || "Settings saved successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to save settings" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to save settings" });
  } finally {
   setIsSaving(false);
  }
 };

 // Reset form to original values
 const resetForm = () => {
  if (originalData) {
   setFormData(buildFormData(originalData));
  } else {
   setFormData(initialFormData);
  }
  setMessage({ type: "", text: "" });
 };

 // Delete settings (reset to defaults)
 const reorderSalesReceiptSections = useCallback((fromIndex: number, toIndex: number) => {
  setFormData((prev) => ({
   ...prev,
   receiptPrinterSalesPrint: {
    ...prev.receiptPrinterSalesPrint,
    sectionOrder: moveOrderItem(prev.receiptPrinterSalesPrint.sectionOrder, fromIndex, toIndex),
   },
  }));
 }, []);

 const reorderRepairTicketSections = useCallback((fromIndex: number, toIndex: number) => {
  setFormData((prev) => ({
   ...prev,
   receiptPrinterRepairPrint: {
    ...prev.receiptPrinterRepairPrint,
    sectionOrder: moveOrderItem(prev.receiptPrinterRepairPrint.sectionOrder, fromIndex, toIndex),
   },
  }));
 }, []);

 const reorderRepairLabelFields = useCallback((fromIndex: number, toIndex: number) => {
  setFormData((prev) => ({
   ...prev,
   repairLabelPrint: {
    ...prev.repairLabelPrint,
    textFieldOrder: moveOrderItem(prev.repairLabelPrint.textFieldOrder, fromIndex, toIndex),
   },
  }));
 }, []);

 const deleteSettings = async () => {
  setIsLoading(true);
  try {
   const response = await notesTermsApi.deleteSettings();

   if (response.success && response.data) {
    setOriginalData(response.data);
    setFormData(buildFormData(response.data));
    setMessage({ type: "success", text: response.message || "Settings reset to defaults successfully" });
   } else {
    setMessage({ type: "error", text: response.message || "Failed to reset settings" });
   }
  } catch {
   setMessage({ type: "error", text: "Failed to reset settings" });
  } finally {
   setIsLoading(false);
  }
 };

 return {
  formData,
  isLoading,
  isSaving,
  message,
  hasExistingData: !!originalData?._id,
  handleChange,
  reorderSalesReceiptSections,
  reorderRepairTicketSections,
  reorderRepairLabelFields,
  saveSettings,
  resetForm,
  deleteSettings,
  fetchSettings,
 };
};

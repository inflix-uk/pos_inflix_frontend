import type { RepairLabelPrintSettings } from "@/lib/repairLabelPrintConfig";
import type { InvoicePdfPrintOptions } from "@/lib/invoicePdfPrintOptions";
import type { BusinessInvoicePdfPrintOptions } from "@/lib/businessInvoicePdfPrintOptions";
import type { A4InvoiceTemplateId } from "@/lib/a4InvoiceTemplate";
import type {
 ReceiptPrinterSalesPrintOptions,
 ReceiptPrinterRepairPrintOptions,
} from "@/lib/receiptPrinterPrintOptions";

export interface NotesTermsSettings {
 _id?: string;
 deliveryAddress: string;
 purchaseTermsConditions: string;
 pdfSalesTerms: string;
 receiptPrinterSalesTerms: string;
 receiptPrinterRepairTerms: string;
 receiptPrinterSalesPrint?: Partial<ReceiptPrinterSalesPrintOptions> | null;
 receiptPrinterRepairPrint?: Partial<ReceiptPrinterRepairPrintOptions> | null;
 paymentNote: string;
 repairLabelPrint?: Partial<RepairLabelPrintSettings>;
 invoicePdfPrint?: Partial<InvoicePdfPrintOptions> | null;
 businessInvoicePdfPrint?: Partial<BusinessInvoicePdfPrintOptions> | null;
 businessInvoiceTerms?: string;
 a4InvoiceTemplate?: A4InvoiceTemplateId;
 createdBy?: string;
 updatedBy?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface NotesTermsFormData {
 deliveryAddress: string;
 purchaseTermsConditions: string;
 pdfSalesTerms: string;
 receiptPrinterSalesTerms: string;
 receiptPrinterRepairTerms: string;
 receiptPrinterSalesPrint: ReceiptPrinterSalesPrintOptions;
 receiptPrinterRepairPrint: ReceiptPrinterRepairPrintOptions;
 paymentNote: string;
 repairLabelPrint: RepairLabelPrintSettings;
 invoicePdfPrint: InvoicePdfPrintOptions;
 businessInvoicePdfPrint: BusinessInvoicePdfPrintOptions;
 businessInvoiceTerms: string;
 a4InvoiceTemplate: A4InvoiceTemplateId;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface NotesTermsFormProps {
 formData: NotesTermsFormData;
 isSaving: boolean;
 hasExistingData: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
 onReorderSalesReceiptSections: (fromIndex: number, toIndex: number) => void;
 onReorderRepairTicketSections: (fromIndex: number, toIndex: number) => void;
 onReorderRepairLabelFields: (fromIndex: number, toIndex: number) => void;
 onSubmit: (e: React.FormEvent) => void;
 onReset: () => void;
 onDelete: () => void;
}

export interface DeleteConfirmModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 isLoading?: boolean;
}

export interface MessageAlertProps {
 message: Message;
}

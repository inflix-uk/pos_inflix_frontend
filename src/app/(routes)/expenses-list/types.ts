export const PAYMENT_METHODS = ["Cash", "BankTransfer", "Card", "PettyCash", "OnAccount", "Other"] as const;
export const STATUSES = ["Draft", "Submitted", "Approved", "Paid", "Rejected", "Voided"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ExpenseStatus = (typeof STATUSES)[number];

export interface ExpenseAttachment {
 filename: string;
 mimeType?: string;
 size?: number;
 storageKey?: string;
 url?: string;
}

export interface Expense {
 _id: string;
 occurredAtUtc: string;
 vendorId?: string | null;
 vendorName?: string;
 categoryId: string | { _id: string; name: string; code?: string; costCentre?: string };
 description?: string;
 notes?: string;
 amountNet: number;
 vatAmount: number;
 amountGross: number;
 vatRate?: number;
 paymentMethod: PaymentMethod;
 paymentReference?: string;
 status: ExpenseStatus;
 createdByUserId?: string | { _id: string; name: string };
 approvedByUserId?: string | null | { _id: string; name: string };
 approvedAtUtc?: string | null;
 voidReason?: string | null;
 attachments?: ExpenseAttachment[];
 createdAt?: string;
 updatedAt?: string;
}

export interface ExpenseFormData {
 occurredAtUtc: string;
 vendorName?: string;
 categoryId: string;
 description?: string;
 notes?: string;
 amountNet: number;
 vatAmount: number;
 amountGross: number;
 vatRate?: number;
 paymentMethod: PaymentMethod;
 paymentReference?: string;
}

export interface ExpenseFilters {
 fromUtc?: string;
 toUtc?: string;
 categoryId?: string;
 status?: string;
 paymentMethod?: string;
 search?: string;
 page?: number;
 limit?: number;
}

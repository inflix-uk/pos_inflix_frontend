export const COST_CENTRES = ["Sales", "Repairs", "Warehouse", "Admin", "General"] as const;
export type CostCentre = (typeof COST_CENTRES)[number];

export interface ExpenseCategory {
 _id: string;
 name: string;
 code?: string;
 parentCategoryId?: string | null;
 defaultVatRate: number;
 vatType?: string;
 costCentre: CostCentre;
 requiresAttachment: boolean;
 requiresManagerApproval: boolean;
 approvalThresholdAmount?: number | null;
 isActive: boolean;
 createdAt?: string;
 updatedAt?: string;
}

export interface ExpenseCategoryFormData {
 name: string;
 code?: string;
 parentCategoryId?: string | null;
 defaultVatRate: number;
 vatType?: string;
 costCentre: CostCentre;
 requiresAttachment: boolean;
 requiresManagerApproval: boolean;
 approvalThresholdAmount?: number | null;
}

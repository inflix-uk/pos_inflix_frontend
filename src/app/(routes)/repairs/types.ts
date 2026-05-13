export type RepairStatus =
 | "pending"
 | "in_progress"
 | "waiting_parts"
 | "completed"
 | "cancelled"
 | "collected"
 | "redo";

export interface RepairDevice {
 deviceDescription: string;
 serialNumber?: string;
 problemType?: string;
 devicePassword?: string;
 estimatedCost?: number | null;
 notes?: string;
}

export interface Repair {
 _id: string;
 reference: string;
 customerId?: string | null;
 customerName: string;
 contactPhone?: string;
 contactEmail?: string;
 deviceDescription: string;
 serialNumber?: string;
 /** Multiple devices on this ticket (from API); when length > 0 use this instead of single device fields */
 devices?: RepairDevice[];
 status: RepairStatus;
 receivedAt: string;
 completedAt?: string | null;
 collectedAt?: string | null;
 estimatedCost?: number | null;
 actualCost?: number | null;
 notes?: string;
 internalNotes?: string;
 devicePassword?: string;
 problemType?: string;
 notifyViaEmail?: boolean;
 repairItems?: { description: string; amount: number }[];
 saleId?: string | null | { _id?: string; total?: number; reference?: string };
 /** Populated on getRepair: latest payment/sale details */
 sale?: {
  _id: string;
  reference: string;
  total: number;
  paymentMethod?: string;
  createdAt?: string;
  paymentKind?: "deposit" | "full";
 } | null;
 /** All payments/deposits for this repair (newest last) */
 payments?: Array<{
  _id: string;
  reference: string;
  total: number;
  paymentMethod?: string;
  createdAt?: string;
  paymentKind?: "deposit" | "full";
 }>;
 /** Sum of all payments (from API) */
 totalTaken?: number;
 purchaseReturnId?: string | null;
 createdBy?: string | null | { _id?: string; name?: string };
 createdAt?: string;
 updatedAt?: string;
 /** Populated in list: creator display name */
 createdByName?: string | null;
 /** Populated in list: payment amount when sale linked */
 amountTaken?: number | null;
 locationId?: string | { _id: string; name: string; type?: string } | null;
}

export interface RepairFormData {
 customerName: string;
 contactPhone?: string;
 contactEmail?: string;
 deviceDescription: string;
 serialNumber?: string;
 devices?: RepairDevice[];
 status: RepairStatus;
 receivedAt?: string;
 completedAt?: string | null;
 collectedAt?: string | null;
 estimatedCost?: number | null;
 actualCost?: number | null;
 notes?: string;
 internalNotes?: string;
 devicePassword?: string;
 problemType?: string;
 notifyViaEmail?: boolean;
 repairItems?: { description: string; amount: number }[];
 locationId?: string;
}

export interface RepairFilters {
 search?: string;
 status?: string;
 sortBy?: "newest" | "oldest";
 page?: number;
 limit?: number;
}

export interface RepairResponse {
 success: boolean;
 data: Repair[];
 total?: number;
 page?: number;
 pages?: number;
 count?: number;
}

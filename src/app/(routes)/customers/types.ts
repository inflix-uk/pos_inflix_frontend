import type { Customer } from "../peoples/customers/types";
import type { Supplier } from "../peoples/suppliers/types";

export type AccountRow =
 | { kind: "customer"; id: string; data: Customer }
 | { kind: "supplier"; id: string; data: Supplier };

export interface AccountFormData {
 accountType: "customer" | "supplier";
 currency: string;
 name: string;
 companyNumber: string;
 phone: string;
 address1: string;
 city: string;
 country: string;
 contactName: string;
 vatNumber: string;
 mobile: string;
 address2: string;
 postcode: string;
 email: string;
 isActive: boolean;
 /** Customer only: may buy on credit. */
 creditAllowed: boolean;
 /** Customer only: maximum outstanding balance. 0 = no limit. */
 creditLimit: number;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

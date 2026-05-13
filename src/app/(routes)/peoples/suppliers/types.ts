export interface SupplierAddress {
 street?: string;
 addressLine2?: string;
 city?: string;
 state?: string;
 zipCode?: string;
 country?: string;
}

export interface Supplier {
 _id?: string;
 name: string;
 email: string;
 phone: string;
 address: SupplierAddress;
 contactPerson: string;
 companyNumber?: string;
 mobile?: string;
 vatNumber?: string;
 currency?: string;
 isActive: boolean;
 createdAt?: string;
 updatedAt?: string;
}

export interface SupplierFormData {
 name: string;
 email: string;
 phone: string;
 address: SupplierAddress;
 contactPerson: string;
 companyNumber?: string;
 mobile?: string;
 vatNumber?: string;
 currency?: string;
 isActive: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface Location {
 _id?: string;
 name: string;
 type: "store" | "warehouse";
 contactPerson: string;
 phone: string;
 email: string;
 address: string;
 city: string;
 postcode: string;
 country: string;
 isActive: boolean;
 createdAt?: string;
 updatedAt?: string;
}

export interface LocationFormData {
 name: string;
 type: "store" | "warehouse";
 contactPerson: string;
 phone: string;
 email: string;
 address: string;
 city: string;
 postcode: string;
 country: string;
 isActive: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

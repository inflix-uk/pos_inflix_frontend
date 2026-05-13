export interface VariantModel {
 _id?: string;
 name: string;
 slug?: string;
 isActive?: boolean;
}

export interface VariantValue {
 _id?: string;
 name: string;
 slug?: string;
 isActive?: boolean;
 models?: VariantModel[];
}

export interface VariantAttribute {
 _id?: string;
 name: string;
 slug?: string;
 values?: VariantValue[];
 description?: string;
 isActive: boolean;
 createdAt?: string;
 updatedAt?: string;
}

export interface VariantAttributeFormData {
 name: string;
 values?: VariantValue[];
 description?: string;
 isActive: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

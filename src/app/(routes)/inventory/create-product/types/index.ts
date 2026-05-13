// Product form data types
export interface ProductFormData {
 store: string;
 warehouse: string;
 productName: string;
 slug: string;
 sku: string;
 sellingType: string;
 category: string;
 subCategory: string;
 brand: string;
 unit: string;
 barcodeSymbology: string;
 itemBarcode: string;
 description: string;
}

export interface PricingData {
 quantity: string;
 costPrice: string;
 sellingPrice: string;
 taxType: string;
 tax: string;
 discountType: string;
 discountValue: string;
 minStockLevel: string;
}

export interface ProductImage {
 id: number;
 type: string;
 file?: File;
 url?: string;
}

export interface CustomFieldsData {
 warranty: string;
 manufacturer: string;
 manufacturedDate: string;
 expiryDate: string;
 warrantiesChecked: boolean;
 manufacturerChecked: boolean;
 expiryChecked: boolean;
}

export interface CreateProductPayload {
 name: string;
 slug?: string;
 sku: string;
 barcode?: string;
 barcodeSymbology?: string;
 description?: string;
 category: string;
 subCategory?: string;
 brand?: string;
 store?: string;
 warehouse?: string;
 sellingType?: string;
 costPrice: number;
 sellingPrice: number;
 taxType?: string;
 taxRate?: number;
 discountType?: string;
 discountValue?: number;
 quantity: number;
 minStockLevel?: number;
 unit?: string;
 image?: string;
 images?: string[];
 warranty?: string;
 manufacturer?: string;
 manufacturedDate?: string;
 expiryDate?: string;
 isActive?: boolean;
 supplier?: string;
 /** Single serial/IMEI when adding one serial item */
 serialNumber?: string;
}

/** Shown on create-product page load: choose serial vs non-serial before showing the form */
export type ProductAddMode = null | "serial" | "non-serial";

/** Parcel/supplier info when adding single item to inventory (same as add parcel) */
export interface SingleProductParcelData {
 supplier: string;
 parcelNumber: string;
 date: string;
 currency: string;
 /** Saved on the purchase; shown on product history (IMEI/serial) as parcel / intake note */
 note: string;
}

/** Form data for adding a single serial (IMEI) product - one IMEI only */
export interface SerialSingleFormData {
 sendTo: string;
 taxCategory: string;
 type: string;
 variantValues: Record<string, string>;
 purchasePrice: string;
 salePrice: string;
 multiIMEIs: string;
}

/** Form data for adding a single non-serial product */
export interface NonSerialSingleFormData {
 sendTo: string;
 taxCategory: string;
 type: string;
 variantValues: Record<string, string>;
 name: string;
 barcode: string;
 purchasePrice: string;
 salePrice: string;
 quantity: string;
}

/** Variant attribute from API for category (used in single-product serial form) */
export interface CategoryVariantAttribute {
 _id: string;
 name: string;
 slug: string;
 values: {
  _id: string;
  name: string;
  slug?: string;
  models?: {
   _id: string;
   name: string;
   slug?: string;
   children?: { _id: string; name: string }[];
  }[];
 }[];
}

export interface ApiResponse<T> {
 success: boolean;
 data: T;
 message?: string;
}

// Dropdown options types
export interface SelectOption {
 value: string;
 label: string;
}

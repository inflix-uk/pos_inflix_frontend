// Re-export types from create-product
export * from "../../../inventory/create-product/types";

// Edit-specific types
/** Ref from API may be populated { _id, name } or raw ObjectId string */
type PopulatedRef = { _id: string; name?: string } | null;
type RefOrId = PopulatedRef | string | null | undefined;

export interface ProductApiData {
 _id: string;
 name: string;
 slug?: string;
 sku: string;
 barcode?: string;
 barcodeSymbology?: string;
 description?: string;
 category: RefOrId;
 subCategory?: RefOrId;
 brand?: RefOrId;
 store?: RefOrId;
 warehouse?: RefOrId;
 sellingType?: string;
 costPrice: number;
 sellingPrice: number;
 taxType?: string;
 taxRate?: number;
 discountType?: string;
 discountValue?: number;
 quantity: number;
 minStockLevel: number;
 unit: string;
 image?: string;
 images?: string[];
 warranty?: string;
 manufacturer?: string;
 manufacturedDate?: string;
 expiryDate?: string;
 isActive: boolean;
 supplier?: PopulatedRef;
 createdAt?: string;
 updatedAt?: string;
}

export interface UpdateProductPayload {
 name?: string;
 slug?: string;
 sku?: string;
 barcode?: string;
 barcodeSymbology?: string;
 description?: string;
 category?: string;
 subCategory?: string;
 brand?: string;
 store?: string;
 warehouse?: string;
 sellingType?: string;
 costPrice?: number;
 sellingPrice?: number;
 taxType?: string;
 taxRate?: number;
 discountType?: string;
 discountValue?: number;
 quantity?: number;
 minStockLevel?: number;
 unit?: string;
 image?: string;
 images?: string[];
 warranty?: string;
 manufacturer?: string;
 manufacturedDate?: string;
 expiryDate?: string;
 isActive?: boolean;
}

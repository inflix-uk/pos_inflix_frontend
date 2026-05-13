export interface ExpiredProduct {
 _id: string;
 name: string;
 sku: string;
 barcode?: string;
 category: { _id: string; name: string } | null;
 store?: { _id: string; name: string } | null;
 warehouse?: { _id: string; name: string } | null;
 quantity: number;
 costPrice: number;
 sellingPrice: number;
 expiryDate: string;
 image?: string;
 isActive: boolean;
}

export interface ApiResponse<T> {
 success: boolean;
 count?: number;
 data: T;
 message?: string;
}

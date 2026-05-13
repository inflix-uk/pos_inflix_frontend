export interface Product {
 _id: string;
 name: string;
 sku: string;
 barcode?: string;
 description?: string;
 category: {
  _id: string;
  name: string;
 } | null;
 costPrice: number;
 sellingPrice: number;
 quantity: number;
 minStockLevel: number;
 unit: string;
 image?: string;
 isActive: boolean;
 supplier?: {
  _id: string;
  name: string;
 } | null;
 createdAt: string;
 updatedAt: string;
}

export interface ProductFilters {
 search?: string;
 category?: string;
 isActive?: boolean;
 lowStock?: boolean;
 page?: number;
 limit?: number;
 /** For stock transfer: only products in non-serial (or both) categories for qty lines */
 productType?: 'non-serial' | 'serial';
}

export interface ProductResponse {
 success: boolean;
 count: number;
 total: number;
 page: number;
 pages: number;
 data: Product[];
}

export interface ProductApiResponse<T> {
 success: boolean;
 message?: string;
 data: T;
}

export interface SelectOption {
 value: string;
 label: string;
}

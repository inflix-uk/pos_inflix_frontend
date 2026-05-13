/** Category use: serial (IMEI) only, non-serial only, or both */
export type CategoryItemType = "serial" | "non-serial" | "both";

export interface Category {
 _id?: string;
 name: string;
 slug: string;
 description?: string;
 image?: string;
 /** Lucide icon name (e.g. Package, Smartphone) — shown on create-sales above product name */
 icon?: string;
 isActive: boolean;
 /** Serial only, non-serial only, or both (default) */
 itemType?: CategoryItemType;
 subCategoryCount?: number;
 variantAttributes?: { _id: string; name: string; slug: string }[];
 createdAt?: string;
 updatedAt?: string;
}

export interface CategoryFormData {
 name: string;
 slug: string;
 description?: string;
 isActive: boolean;
 itemType?: CategoryItemType;
 variantAttributes?: string[];
 icon?: string;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface PaginationInfo {
 currentPage: number;
 totalPages: number;
 totalItems: number;
 rowsPerPage: number;
}

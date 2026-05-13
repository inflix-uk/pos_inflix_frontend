export interface SubCategory {
 _id?: string;
 name: string;
 slug: string;
 category: string;
 categoryId?: string;
 code: string;
 description?: string;
 image?: string;
 isActive: boolean;
 createdAt?: string;
 updatedAt?: string;
}

export interface SubCategoryFormData {
 name: string;
 slug: string;
 category: string;
 code: string;
 description?: string;
 image?: string;
 isActive: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface CategoryOption {
 _id: string;
 name: string;
}

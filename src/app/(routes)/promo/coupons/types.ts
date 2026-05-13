export interface Coupon {
 id: string;
 name: string;
 code: string;
 description: string;
 type: "Percentage" | "Fixed Amount";
 discount: number;
 limit: number;
 startDate: string;
 endDate: string;
 product: string;
 oncePerCustomer: boolean;
 status: "Active" | "Inactive";
 valid: string;
}

export interface Message {
 type: "success" | "error";
 text: string;
}

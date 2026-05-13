export interface DiscountPlan {
 id: string;
 planName: string;
 customers: string;
 status: "Active" | "Inactive";
}

export interface Message {
 type: "success" | "error";
 text: string;
}

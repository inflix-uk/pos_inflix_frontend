export interface Discount {
 id: string;
 name: string;
 value: string;
 discountPlan: string;
 validity: string;
 days: string[];
 products: string;
 status: "Active" | "Inactive";
 discountType: "Percentage" | "Flat";
 applicableFor: string;
 validFrom: string;
 validTill: string;
}

export interface Message {
 type: "success" | "error";
 text: string;
}

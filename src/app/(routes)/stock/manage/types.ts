export interface Stock {
 id: string;
 warehouse: string;
 store: string;
 product: {
  name: string;
  icon: string;
 };
 date: string;
 person: {
  name: string;
  avatar: string;
 };
 qty: number;
 status?: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface StockForm {
 warehouse: string;
 store: string;
 person: string;
 product: string;
 qty?: number;
}

export interface Message {
 type: "success" | "error";
 text: string;
}

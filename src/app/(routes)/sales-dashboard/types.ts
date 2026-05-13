import type { ReactNode } from "react";

/** Single line in the POS cart */
export interface CartLineItem {
 sku: string;
 name: string;
 price: string;  // e.g. "£10.00"
 quantity: number;
 unit?: string;
 /** Serial numbers for this line (e.g. one per unit for serialized products) */
 serialNumbers?: string[];
 /** Colour per serial (so Serial Items Details shows correct colour when same line has mixed colours) */
 serialColours?: Record<string, string>;
 /** Grade/condition per serial */
 serialGrades?: Record<string, string>;
 /** Model line per serial */
 serialBrandModels?: Record<string, string>;
 /** Category _id — summary order from category variant attributes */
 categoryId?: string;
 /** Purchase line [{ slug, value }] in category order */
 variantValues?: { slug?: string; value?: string }[];
 /** Inventory date per serial (ISO string); used to pick "recent price" = price of most recently added to inventory */
 serialInventoryDates?: Record<string, string>;
 /** Price per serial (e.g. "£125.00"); used with serialInventoryDates to set line price from most recent in inventory */
 serialPrices?: Record<string, string>;
 /** Condition/grade (e.g. A, D, NEW) */
 grade?: string;
 brand?: string;
 colour?: string;
 brandModel?: string;
 capacity?: string;
 /** From find-in-stock-serials: unit cost at sale (for fast Create Order path) */
 unit_cost_at_sale?: number;
 purchaseId?: string;
 purchaseItemId?: string;
 cost_missing?: boolean;
}

/** Product as shown in POS grid (from products context) */
export interface POSProduct {
 sku: string;
 name: string;
 category: string;
 brand: string;
 price: string;
 unit: string;
 qty: number;
 iconColor?: string;
 /** When set, product is serialized; can be shown on card and copied to cart line */
 serialNumber?: string;
 /** Barcode / SKU for non-serial items (searchable) */
 barcode?: string;
 /** Condition/grade (e.g. A, D, NEW) */
 grade?: string;
 colour?: string;
 brandModel?: string;
 capacity?: string;
 categoryId?: string;
 variantValues?: { slug?: string; value?: string }[];
 /** When set, used to pick line price = price of item most recently added to inventory (not cart) */
 inventoryDate?: string;
 /** From find-in-stock-serials: unit cost and purchase refs for fast Create Order */
 unitCost?: number;
 purchaseId?: string;
 purchaseItemId?: string;
}

export type PaymentMethod = "cash" | "card" | "credit" | "bank";

/** Single recent sale row for sales dashboard */
export interface RecentSale {
 id: string;
 invoiceNo: string;
 customer: string;
 amount: string;
 date: string;
 status: "paid" | "pending" | "refunded";
}

/** Data for the sales chart (labels + daily values) */
export interface SalesChartData {
 labels: string[];
 dailySales: number[];
}

/** Stat card for dashboard summary */
export interface StatCard {
 title: string;
 amount: string;
 value?: string;
 subtitle?: string;
 trend?: "up" | "down";
 trendValue?: string;
 bgColor?: string;
 icon?: ReactNode;
}

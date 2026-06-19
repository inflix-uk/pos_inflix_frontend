export interface Address {
 street?: string;
 addressLine2?: string;
 city?: string;
 state?: string;
 zipCode?: string;
 country?: string;
}

export interface Customer {
 _id?: string;
 name: string;
 email?: string;
 phone: string;
 address?: Address;
 companyNumber?: string;
 contactName?: string;
 mobile?: string;
 vatNumber?: string;
 currency?: string;
 loyaltyPoints?: number;
 totalPurchases?: number;
 balance?: number;
 isActive: boolean;
 /** If false, customer is hidden from repair ticket list (POS/wholesale only). Default true. */
 useInRepairs?: boolean;
 /** Optional pricing group for customer-group pricing. When set, POS uses group price for products that have one. */
 pricingGroupId?: string | null;
 /** System walk-in customer — hide 360 or show read-only. */
 isWalkIn?: boolean;
 /** B2B customer portal enabled. */
 portalEnabled?: boolean;
 createdAt?: string;
 updatedAt?: string;
}

export interface CustomerFormData {
 name: string;
 email: string;
 phone: string;
 address: Address;
 companyNumber?: string;
 contactName?: string;
 mobile?: string;
 vatNumber?: string;
 currency?: string;
 isActive: boolean;
 useInRepairs?: boolean;
 /** Optional pricing group for customer-group pricing. */
 pricingGroupId?: string | null;
 /** Opening balance / balance brought forward (import or API). Creates a ledger entry so it shows in accounts. */
 balance?: number;
}

export interface CustomerFilters {
 search?: string;
 status?: string;
 sortBy?: string;
 page?: number;
 limit?: number;
 /** When true, only return customers allowed in repair tickets (useInRepairs !== false). */
 useInRepairs?: boolean;
 /** Filter by pricing group ID (customers in this group). */
 pricingGroupId?: string | null;
}

export interface CustomerResponse {
 success: boolean;
 data: Customer[];
 /** Backend returns these at top level */
 total?: number;
 page?: number;
 pages?: number;
 count?: number;
 /** Optional nested shape for compatibility */
 pagination?: {
  total: number;
  page: number;
  pages: number;
  limit: number;
 };
}

export interface CustomerSummaryPricingGroup {
 _id: string;
 name: string;
}

export interface CustomerSummaryStats {
 saleCount: number;
 lastSaleAt: string | null;
 lastSaleReference: string | null;
 openBalance: number;
}

export interface CustomerSummary {
 customer: Customer;
 pricingGroup: CustomerSummaryPricingGroup | null;
 stats: CustomerSummaryStats;
}

export interface CustomerSummaryResponse {
 success: boolean;
 data: CustomerSummary;
}

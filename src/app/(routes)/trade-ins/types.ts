export type TradeInFileKind = "id_front" | "id_back" | "signature";
export type PayoutMethod = "cash" | "bank" | "card";

export const PAYOUT_LABELS: Record<PayoutMethod, string> = {
 cash: "Cash",
 bank: "Bank transfer",
 card: "Card",
};

export const FILE_LABELS: Record<TradeInFileKind, string> = {
 id_front: "ID front",
 id_back: "ID back",
 signature: "Signature",
};

export interface TradeInFileMeta {
 _id: string;
 kind: TradeInFileKind;
 mimeType: string;
 size: number;
 width: number;
 height: number;
 uploadedVia: "desktop" | "phone";
 updatedAt: string;
}

export interface TradeInFileWithData extends TradeInFileMeta {
 dataUrl: string | null;
}

export interface TradeInItem {
 purchaseItemId?: string | null;
 description: string;
 category: string;
 grade: string;
 brand: string;
 brandModel: string;
 capacity: string;
 colour: string;
 imeis: string[];
 isOtherItem: boolean;
 barcode: string;
 quantity: number;
 purchasePrice: number;
 salePrice: number;
 locationId?: string | null;
 locationName: string;
 note: string;
}

export interface TradeInLocation {
 name: string;
 address?: string;
 city?: string;
 postcode?: string;
 country?: string;
 phone?: string;
 email?: string;
 companyNumber?: string;
 vatNumber?: string;
}

export interface TradeIn {
 _id: string;
 reference?: string;
 status: "draft" | "completed";
 customer: { name: string; phone: string; email: string };
 notes: string;
 items: TradeInItem[];
 totalAmount: number;
 totalUnits: number;
 payoutMethod: PayoutMethod;
 purchaseId?: string | null;
 purchaseNumber?: string;
 termsText?: string;
 termsAccepted: boolean;
 termsAcceptedAt?: string | null;
 termsAcceptedVia?: "desktop" | "phone" | null;
 date?: string;
 createdBy?: { _id: string; name: string } | string | null;
 completedBy?: { _id: string; name: string } | string | null;
 completedAt?: string | null;
 createdAt?: string;
 /** Only on GET /:id */
 files?: TradeInFileMeta[];
 uploadLinkActive?: boolean;
 location?: TradeInLocation | null;
}

export interface TradeInMeta {
 termsText: string;
 about: {
  appName: string;
  appTitle: string;
  companyAddress: string;
  companyNumber: string;
  vatNumber: string;
  logo: string | null;
 };
}

export interface CompleteTradeInPayload {
 customer: { name: string; phone: string; email: string };
 notes: string;
 payoutMethod: PayoutMethod;
 termsAccepted: boolean;
 items: unknown[];
}

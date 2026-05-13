export interface ParcelData {
 date: string;
 account: string;
 parcelNumber: string;
 note: string;
 currency: string;
}

export interface QuantityData {
 date: string;
 imeiQuantity: string;
 otherQuantity: string;
 note: string;
}

/** One variant attribute assigned to a category (from API). First attribute has the full tree (values → models → children); rest have empty values. */
export interface CategoryVariantAttribute {
 _id: string;
 name: string;
 slug: string;
 values: {
  _id: string;
  name: string;
  slug?: string;
  models?: {
   _id: string;
   name: string;
   slug?: string;
   children?: { _id: string; name: string }[];
  }[];
 }[];
}

/** Dynamic variant selection: attributeId -> valueId; attributeId_model -> modelId for brand-like attributes. */
export type VariantValuesMap = Record<string, string>;

export interface ItemData {
 sendTo: string;
 taxCategory: string;
 type: string;
 make: string;
 grade: string;
 brand: string;
 brandModel: string;
 capacity: string;
 colour: string;
 variantValues: VariantValuesMap;
 /** When loading from API: raw array from backend; resolved to variantValues when category attributes load */
 rawVariantValues?: { slug: string; value: string }[];
 purchasePrice: string;
 salePrice: string;
 multiIMEIs: string;
 /** Per-item-group note. Saved only with the items in this section. */
 note?: string;
}

export interface Currency {
 code: string;
 symbol: string;
 name: string;
}

export interface ItemEntry {
 id: string;
 data: ItemData;
 imeiCount: number;
 specsSummary: string;
}

export type Step = "parcel" | "quantity" | "item";

export type ItemMode = "imei" | "other";

export interface OtherItemData {
 name: string;
 barcode: string;
 sendTo: string;
 taxCategory: string;
 type: string;
 make: string;
 grade: string;
 brand: string;
 brandModel: string;
 capacity: string;
 colour: string;
 variantValues: VariantValuesMap;
 /** When loading from API: raw array from backend; resolved to variantValues when category attributes load */
 rawVariantValues?: { slug: string; value: string }[];
 purchasePrice: string;
 salePrice: string;
 quantity: string;
 /** Per-item-group note. Saved only with the items in this section. */
 note?: string;
}

export interface OtherItemEntry {
 id: string;
 data: OtherItemData;
 quantity: number;
 specsSummary: string;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

/** Result row from GET /api/purchases/non-serial/search — lightweight typeahead match. */
export interface NonSerialSearchResult {
 _id: string;
 name?: string;
 barcode?: string;
 sendTo?: string;
 tax?: string;
 category?: string;
 subCategory?: string;
 categoryName?: string;
 grade?: string;
 brand?: string;
 brandModel?: string;
 capacity?: string;
 colour?: string;
 variantValues?: { slug: string; value: string }[];
 purchasePrice?: number;
 salePrice?: number;
 lastPurchaseId?: string;
 lastPurchasedAt?: string;
}

/** Result row from GET /api/purchases/serial/search — typeahead match for IMEI/serial items. */
export interface SerialSearchResult {
 _id?: string | { cat?: string; brand?: string; model?: string; cap?: string; col?: string; grd?: string };
 sendTo?: string;
 tax?: string;
 category?: string;
 subCategory?: string;
 categoryName?: string;
 grade?: string;
 brand?: string;
 brandModel?: string;
 capacity?: string;
 colour?: string;
 variantValues?: { slug: string; value: string }[];
 purchasePrice?: number;
 salePrice?: number;
 lastPurchaseId?: string;
 lastPurchasedAt?: string;
}

/** Single product row for product labels tab */
export interface ProductLabelRow {
 productId: string;
 name: string;
 sku: string;
 barcode?: string;
 salePrice?: number;
 quantity: number;
 categoryName?: string;
 /** Parcel / purchase line: selected variant values for the label title */
 variantDisplay?: string;
 variantAttributes?: { name: string; slug: string }[];
}

/** Print symbology: QR (2D) or Code128 barcode (1D) */
export type CodeKind = "qr" | "barcode";

/** Resolved serial for IMEI/serial labels tab */
export interface SerialLabelRow {
 serial: string;
 productId: string | null;
 productName: string | null;
 sku: string | null;
 barcode?: string | null;
 categoryName?: string | null;
 /** Variant values from purchase line when serial is only in a purchase */
 variantDisplay?: string | null;
 locationId: string | null;
 locationName: string | null;
 status: string | null;
 purchaseId: string | null;
 purchasePrice: number | null;
 found: boolean;
 invalidReason: string | null;
}

/** Location for location labels tab */
export interface LocationLabelRow {
 locationId: string;
 name: string;
 type?: string;
}

/** Label template for layout (page = one physical label for thermal) */
export interface LabelTemplate {
 id: string;
 name: string;
 pageWidth: number; // mm
 pageHeight: number;
 labelWidth: number;
 labelHeight: number;
 cols: number;
 rows: number;
 marginTop: number;
 marginLeft: number;
 gapX: number;
 gapY: number;
}

/** IMEI / serial thermal label — matches common 57×32 mm stock; PDF page size works with silent print (agent, noscale). */
export const THERMAL_LABEL_57x32: LabelTemplate = {
 id: "thermal-57x32",
 name: "57 × 32 mm (thermal)",
 pageWidth: 57,
 pageHeight: 32,
 labelWidth: 57,
 labelHeight: 32,
 cols: 1,
 rows: 1,
 marginTop: 0,
 marginLeft: 0,
 gapX: 0,
 gapY: 0,
};

/** Font sizes (pt) for label text — applied in PDF and preview */
export interface LabelTypography {
 titlePt: number;
 serialPt: number;
 metaPt: number;
}

export const DEFAULT_LABEL_TYPOGRAPHY: LabelTypography = {
 titlePt: 5,
 serialPt: 6,
 metaPt: 4,
};

export type TabId = "product" | "serial" | "location";

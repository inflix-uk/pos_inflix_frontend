/** Shared defaults for repair device label PDF (Settings + invoicePrint). */

import {
  normalizeRepairLabelTextFieldOrder,
  REPAIR_LABEL_TEXT_FIELD_IDS,
  type RepairLabelTextFieldId,
} from "./receiptPrintLayout";

export type RepairLabelQrPosition = "left" | "right";
export type RepairLabelTextAlign = "left" | "center" | "right";

/** Browser PDF always uses `same_as_pdf`. `swap_columns` inverts QR/text columns only when building PDF for silent Print Bridge (DYMO raster path). */
export type RepairLabelSilentPrintLayoutMode = "same_as_pdf" | "swap_columns";

export interface RepairLabelPrintSettings {
  labelWidthMm: number;
  labelHeightMm: number;
  fontSizePt: number;
  lineHeightMm: number;
  qrSizeMm: number;
  qrPosition: RepairLabelQrPosition;
  textAlign: RepairLabelTextAlign;
  showQr: boolean;
  showReferenceText: boolean;
  showCustomerName: boolean;
  showContactPhone: boolean;
  showContactEmail: boolean;
  showDeviceDescription: boolean;
  showProblemType: boolean;
  showSerialNumber: boolean;
  showEstimatedCost: boolean;
  maxProblemLines: number;
  /** Swap landscape/portrait only for Print Bridge silent print (not PDF layout). */
  invertSilentPrintOrientation: boolean;
  /**
   * Silent label print only: when `swap_columns`, QR and text columns are swapped in the PDF sent to the agent
   * (not mirrored). Use when physical DYMO output is consistently left/right reversed vs browser PDF.
   */
  silentPrintLayoutMode: RepairLabelSilentPrintLayoutMode;
  /** Order of text lines in the label text column (QR stays in its column). */
  textFieldOrder: RepairLabelTextFieldId[];
  /** Optional text size (pt) per label line; unset uses {@link fontSizePt}. */
  fieldFontPt: Partial<Record<RepairLabelTextFieldId, number>>;
}

/** Standard landscape repair sticker: 57 mm wide × 32 mm tall (width ≥ height). */
export const DEFAULT_REPAIR_LABEL_PRINT: RepairLabelPrintSettings = {
  labelWidthMm: 57,
  labelHeightMm: 32,
  fontSizePt: 7,
  lineHeightMm: 3.9,
  qrSizeMm: 16.5,
  qrPosition: "left",
  textAlign: "left",
  showQr: true,
  showReferenceText: false,
  showCustomerName: true,
  showContactPhone: true,
  showContactEmail: false,
  showDeviceDescription: true,
  showProblemType: true,
  showSerialNumber: false,
  showEstimatedCost: false,
  maxProblemLines: 2,
  invertSilentPrintOrientation: false,
  silentPrintLayoutMode: "same_as_pdf",
  textFieldOrder: normalizeRepairLabelTextFieldOrder(null),
  fieldFontPt: {},
};

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampInt(n: number, min: number, max: number, fallback: number): number {
  return Math.round(clamp(n, min, max, fallback));
}

function normalizeRepairLabelFieldFontPt(
  partial: Partial<Record<RepairLabelTextFieldId, number>> | null | undefined
): Partial<Record<RepairLabelTextFieldId, number>> {
  if (!partial || typeof partial !== "object") return {};
  const out: Partial<Record<RepairLabelTextFieldId, number>> = {};
  for (const id of REPAIR_LABEL_TEXT_FIELD_IDS) {
    const v = partial[id];
    if (v == null || !Number.isFinite(Number(v))) continue;
    out[id] = clamp(Number(v), 4, 14, 7);
  }
  return out;
}

/** Effective pt for a label text line (PDF + canvas). */
export function repairLabelFieldFontPt(
  opts: RepairLabelPrintSettings,
  field: RepairLabelTextFieldId
): number {
  const c = opts.fieldFontPt?.[field];
  if (c != null && Number.isFinite(c)) return clamp(c, 4, 14, opts.fontSizePt);
  return opts.fontSizePt;
}

/**
 * Repair device labels are landscape media (e.g. DYMO 57 mm wide × 32 mm high).
 * If width/height were saved reversed, swap so width ≥ height for canvas, PDF, and GDI.
 */
function normalizeRepairLabelLandscapeMm(widthMm: number, heightMm: number): { labelWidthMm: number; labelHeightMm: number } {
  if (heightMm > widthMm) {
    return { labelWidthMm: heightMm, labelHeightMm: widthMm };
  }
  return { labelWidthMm: widthMm, labelHeightMm: heightMm };
}

/** Merge API partial object with defaults and clamp to safe ranges. */
export function mergeRepairLabelPrintSettings(
  partial?: Partial<RepairLabelPrintSettings> | null
): RepairLabelPrintSettings {
  const p = partial ?? {};
  const qrPos = p.qrPosition === "right" ? "right" : "left";
  const ta = p.textAlign === "center" || p.textAlign === "right" ? p.textAlign : "left";
  const w = clamp(p.labelWidthMm ?? DEFAULT_REPAIR_LABEL_PRINT.labelWidthMm, 30, 120, DEFAULT_REPAIR_LABEL_PRINT.labelWidthMm);
  const h = clamp(p.labelHeightMm ?? DEFAULT_REPAIR_LABEL_PRINT.labelHeightMm, 15, 100, DEFAULT_REPAIR_LABEL_PRINT.labelHeightMm);
  const { labelWidthMm, labelHeightMm } = normalizeRepairLabelLandscapeMm(w, h);
  return {
    labelWidthMm,
    labelHeightMm,
    fontSizePt: clamp(p.fontSizePt ?? DEFAULT_REPAIR_LABEL_PRINT.fontSizePt, 4, 14, DEFAULT_REPAIR_LABEL_PRINT.fontSizePt),
    lineHeightMm: clamp(p.lineHeightMm ?? DEFAULT_REPAIR_LABEL_PRINT.lineHeightMm, 2.5, 10, DEFAULT_REPAIR_LABEL_PRINT.lineHeightMm),
    qrSizeMm: clamp(p.qrSizeMm ?? DEFAULT_REPAIR_LABEL_PRINT.qrSizeMm, 8, 35, DEFAULT_REPAIR_LABEL_PRINT.qrSizeMm),
    qrPosition: qrPos,
    textAlign: ta,
    showQr: p.showQr !== false,
    showReferenceText: p.showReferenceText === true,
    showCustomerName: p.showCustomerName !== false,
    showContactPhone: p.showContactPhone !== false,
    showContactEmail: p.showContactEmail === true,
    showDeviceDescription: p.showDeviceDescription !== false,
    showProblemType: p.showProblemType !== false,
    showSerialNumber: p.showSerialNumber === true,
    showEstimatedCost: p.showEstimatedCost === true,
    maxProblemLines: clampInt(
      p.maxProblemLines ?? DEFAULT_REPAIR_LABEL_PRINT.maxProblemLines,
      1,
      6,
      DEFAULT_REPAIR_LABEL_PRINT.maxProblemLines
    ),
    invertSilentPrintOrientation: p.invertSilentPrintOrientation === true,
    silentPrintLayoutMode:
      p.silentPrintLayoutMode === "swap_columns" ? "swap_columns" : "same_as_pdf",
    textFieldOrder: normalizeRepairLabelTextFieldOrder(p.textFieldOrder),
    fieldFontPt: normalizeRepairLabelFieldFontPt(p.fieldFontPt),
  };
}

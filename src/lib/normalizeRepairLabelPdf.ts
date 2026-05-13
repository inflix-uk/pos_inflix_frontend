import { PDFDocument, PrintScaling, degrees, ParseSpeeds } from "pdf-lib";

/** PDF points from millimetres (same as jsPDF mm output intent). */
export function repairLabelMmToPt(mm: number): number {
  return (mm / 25.4) * 72;
}

/** Encode bytes to base64 without stack overflow on large buffers (chunked). */
export function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(binary);
}

export type RepairLabelPdfPageSizeMm = { widthMm: number; heightMm: number };

/**
 * Align repair label PDFs with browser/Chrome printing for Sumatra silent print.
 * Avoid using this on PDFs that will be rasterised with pdf.js after jsPDF embedded a custom TTF — pdf-lib
 * save can damage those font objects so the agent sees text missing (QR image still OK).
 *
 * When used elsewhere, this:
 * - Rotation 0°
 * - Explicit MediaBox + CropBox from label width/height (mm → pt) so page geometry matches Notes & Terms
 *   (avoids drivers treating the page as portrait 32×57 when it should be landscape 57×32)
 * - /PrintScaling /None; PickTrayByPDFSize off
 * - save without object streams
 *
 * Do not pass Sumatra `orientation` for these jobs — it applies an extra 90° content rotation vs the PDF.
 */
export async function normalizeRepairLabelPdfForConsistentPrinting(
  pdfBytes: Uint8Array,
  pageSizeMm?: RepairLabelPdfPageSizeMm
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    parseSpeed: ParseSpeeds.Fast,
  });

  const wPt = pageSizeMm ? repairLabelMmToPt(pageSizeMm.widthMm) : null;
  const hPt = pageSizeMm ? repairLabelMmToPt(pageSizeMm.heightMm) : null;

  for (const page of pdfDoc.getPages()) {
    page.setRotation(degrees(0));
    if (wPt != null && hPt != null && wPt > 0 && hPt > 0) {
      page.setMediaBox(0, 0, wPt, hPt);
      page.setCropBox(0, 0, wPt, hPt);
    }
  }

  const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences();
  viewerPrefs.setPrintScaling(PrintScaling.None);
  viewerPrefs.setPickTrayByPDFSize(false);

  const saved = await pdfDoc.save({
    useObjectStreams: false,
    updateFieldAppearances: false,
  });
  return new Uint8Array(saved);
}

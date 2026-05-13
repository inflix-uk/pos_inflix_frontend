/**
 * Repair label as PNG from browser canvas — bypasses PDF/pdf.js on the print agent (DYMO reliability).
 * Landscape label: width × height in mm (default 57 × 32). GDI receives the same mm box as /print/label-png.
 */
import QRCode from "qrcode";
import {
  mergeRepairLabelPrintSettings,
  repairLabelFieldFontPt,
  type RepairLabelPrintSettings,
  type RepairLabelQrPosition,
} from "./repairLabelPrintConfig";
import type { RepairLabelTextFieldId } from "./receiptPrintLayout";

const DPI = 300;

/** Subset of repair row fields needed for canvas label (avoids circular import with invoicePrint). */
export interface RepairLabelCanvasRepairData {
  reference: string;
  customerName: string;
  contactPhone?: string;
  contactEmail?: string;
  deviceDescription: string;
  serialNumber?: string;
  problemType?: string;
  estimatedCost?: number | null;
  devices?: Array<{ deviceDescription?: string; serialNumber?: string; problemType?: string }>;
}

function mmToPx(mm: number): number {
  return Math.max(1, Math.round((mm / 25.4) * DPI));
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(n);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number): string[] {
  const words = text.replace(/\n/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["—"];
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidthPx) {
      line = test;
      continue;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    if (ctx.measureText(w).width <= maxWidthPx) {
      line = w;
      continue;
    }
    let chunk = "";
    for (const ch of w) {
      const t2 = chunk + ch;
      if (ctx.measureText(t2).width <= maxWidthPx) chunk = t2;
      else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    line = chunk;
  }
  if (line) lines.push(line);
  return lines;
}

export interface BuildRepairLabelPngForAgentOptions {
  applySilentColumnSwap?: boolean;
}

export interface RepairLabelPngForAgentPayload {
  pngBase64: string;
  /** GDI physical label size: width × height in mm (e.g. 57 × 32 landscape). */
  gdiWidthMm: number;
  gdiHeightMm: number;
}

/**
 * Renders repair label to PNG (landscape bitmap). Caller sends to print agent /print/label-png.
 */
export async function buildRepairLabelPngForDymoAgent(
  repair: RepairLabelCanvasRepairData,
  labelPrint: Partial<RepairLabelPrintSettings> | RepairLabelPrintSettings,
  options?: BuildRepairLabelPngForAgentOptions
): Promise<RepairLabelPngForAgentPayload> {
  const opts = mergeRepairLabelPrintSettings(labelPrint);
  const widthMm = opts.labelWidthMm;
  const heightMm = opts.labelHeightMm;
  if (widthMm < heightMm) {
    throw new Error("Canvas repair label path expects label width ≥ height (e.g. 57×32 mm).");
  }

  const qrLayoutPosition: RepairLabelQrPosition =
    options?.applySilentColumnSwap === true
      ? opts.qrPosition === "left"
        ? "right"
        : "left"
      : opts.qrPosition;

  const W = mmToPx(widthMm);
  const H = mmToPx(heightMm);
  /** Tighter inset on short labels (e.g. 32 mm height) so more lines fit in the landscape strip. */
  const pad = mmToPx(heightMm <= 34 ? 0.9 : 1.2);
  const gap = mmToPx(heightMm <= 34 ? 1.2 : 1.5);
  const pageW = W;
  const pageH = H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "alphabetic";

  const qrCapPx = Math.min(
    mmToPx(opts.qrSizeMm),
    Math.max(mmToPx(4), Math.min(pageW, pageH) - 2 * pad)
  );
  const showQr = opts.showQr && qrCapPx >= mmToPx(6);

  let textLeft = pad;
  let textWidth = pageW - 2 * pad;
  let qrX = pad;
  /** Top-align QR with text block on landscape strips (57×32 mm), not vertically centered. */
  const qrY = pad;

  if (showQr) {
    if (qrLayoutPosition === "right") {
      textLeft = pad;
      textWidth = pageW - 2 * pad - gap - qrCapPx;
      qrX = pageW - pad - qrCapPx;
    } else {
      textLeft = pad + qrCapPx + gap;
      textWidth = pageW - textLeft - pad;
      qrX = pad;
    }
  }
  textWidth = Math.max(mmToPx(6), textWidth);

  /** Extra inset so right-aligned glyphs are not clipped at print edge (~5px at label raster DPI). */
  const rightTextInsetPx = opts.textAlign === "right" ? 5 : 0;
  const wrapTextWidth = Math.max(mmToPx(4), textWidth - rightTextInsetPx);

  if (showQr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(repair.reference, { width: 180, margin: 0 });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("QR decode failed"));
        img.src = qrDataUrl;
      });
      ctx.drawImage(img, qrX, qrY, qrCapPx, qrCapPx);
    } catch {
      ctx.font = `bold ${Math.min(8, repairLabelFieldFontPt(opts, "reference") + 1) * (DPI / 72)}px system-ui, Segoe UI, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(repair.reference.slice(0, 8), qrX + qrCapPx / 2, pageH / 2);
      ctx.textAlign = "left";
    }
  }

  const lineStepPx = mmToPx(opts.lineHeightMm);
  const fauxDx = mmToPx(0.08);
  const bottom = pageH - pad;
  let y = pad + opts.fontSizePt * (DPI / 72) * 0.85;

  const textXForLine = (): number => {
    if (opts.textAlign === "center") return textLeft + textWidth / 2;
    if (opts.textAlign === "right") return textLeft + textWidth - rightTextInsetPx;
    return textLeft;
  };

  const drawLabelText = (seg: string, x: number, yPos: number) => {
    ctx.textAlign = opts.textAlign;
    ctx.fillText(seg, x, yPos);
    if (opts.textAlign === "right") {
      ctx.fillText(seg, x - fauxDx, yPos);
    } else if (opts.textAlign === "center") {
      ctx.fillText(seg, x + fauxDx, yPos);
      ctx.fillText(seg, x - fauxDx, yPos);
    } else {
      ctx.fillText(seg, x + fauxDx, yPos);
    }
    ctx.textAlign = "left";
  };

  const drawLine = (raw: string, fieldId: RepairLabelTextFieldId) => {
    if (y > bottom) return;
    const pt = repairLabelFieldFontPt(opts, fieldId);
    const fPx = pt * (DPI / 72);
    ctx.font = `bold ${fPx}px system-ui, "Segoe UI", sans-serif`;
    const line = raw.replace(/\n/g, " ").trim() || "—";
    const lines = wrapLines(ctx, line, wrapTextWidth);
    for (const seg of lines) {
      if (y > bottom) return;
      drawLabelText(seg, textXForLine(), y);
      y += lineStepPx;
    }
  };

  const serial =
    (repair.serialNumber || repair.devices?.find((d) => d.serialNumber)?.serialNumber || "").trim() || "—";

  const drawProblemBlock = () => {
    if (!opts.showProblemType) return;
    const pt = repairLabelFieldFontPt(opts, "problemType");
    const fPx = pt * (DPI / 72);
    ctx.font = `bold ${fPx}px system-ui, "Segoe UI", sans-serif`;
    const problem = (repair.problemType ?? repair.devices?.[0]?.problemType ?? "—").replace(/\n/g, " ").slice(0, 80);
    const problemLines = wrapLines(ctx, problem, wrapTextWidth).slice(0, opts.maxProblemLines);
    const tight = Math.max(lineStepPx - mmToPx(0.15), fPx * 0.45);
    for (const pl of problemLines) {
      if (y > bottom) break;
      drawLabelText(pl, textXForLine(), y);
      y += tight;
    }
  };

  const paintField = (fieldId: RepairLabelTextFieldId) => {
    switch (fieldId) {
      case "reference":
        if (opts.showReferenceText) drawLine(repair.reference, "reference");
        break;
      case "customerName":
        if (opts.showCustomerName) drawLine((repair.customerName || "—").slice(0, 40), "customerName");
        break;
      case "contactPhone":
        if (opts.showContactPhone) drawLine((repair.contactPhone || "—").slice(0, 28), "contactPhone");
        break;
      case "contactEmail":
        if (opts.showContactEmail && repair.contactEmail?.trim()) {
          drawLine(repair.contactEmail.trim().slice(0, 40), "contactEmail");
        }
        break;
      case "deviceDescription":
        if (opts.showDeviceDescription) drawLine((repair.deviceDescription || "—").slice(0, 40), "deviceDescription");
        break;
      case "serialNumber":
        if (opts.showSerialNumber) drawLine(serial.slice(0, 36), "serialNumber");
        break;
      case "problemType":
        drawProblemBlock();
        break;
      case "estimatedCost":
        if (opts.showEstimatedCost && repair.estimatedCost != null) {
          drawLine(`Est: ${formatMoney(repair.estimatedCost)}`, "estimatedCost");
        }
        break;
      default:
        break;
    }
  };

  for (const fieldId of opts.textFieldOrder) {
    paintField(fieldId);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const pngBase64 = dataUrl.split(",")[1] || "";
  if (!pngBase64) throw new Error("PNG encoding failed");

  return {
    pngBase64,
    gdiWidthMm: widthMm,
    gdiHeightMm: heightMm,
  };
}

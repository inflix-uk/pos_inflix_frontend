/**
 * Silent printing: receipt (ESC/POS via agent), labels (PDF via agent).
 * Falls back to browser/current behavior when disabled or agent unreachable.
 */

import { checkPrintAgentReachable, fetchPrintAgent } from "@/lib/printAgentClient";
import { parseAllowedLoopbackAgentBase } from "@/lib/printAgentLoopbackUrl";

const DEVICE_ID_KEY = "pos_print_device_id";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      "web-" +
      Math.random().toString(36).slice(2) +
      "-" +
      Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface PrintingSettings {
  silentPrintingEnabled: boolean;
  agentUrl: string;
  agentToken: string;
  receiptPrinterName: string;
  labelPrinterName: string;
  a4PrinterName?: string;
}

let cachedSettings: PrintingSettings | null = null;
let cacheTs = 0;
const CACHE_MS = 30_000;

/** Load printing settings for current device (from backend). Caller may pass preloaded settings to avoid extra request. */
export async function loadPrintingSettings(
  preloaded?: PrintingSettings | null
): Promise<PrintingSettings | null> {
  if (preloaded !== undefined) return preloaded;
  if (typeof window === "undefined") return null;
  const now = Date.now();
  if (cachedSettings && now - cacheTs < CACHE_MS) return cachedSettings;
  const deviceId = getDeviceId();
  try {
    const res = await fetch(
      `${API_URL}/api/settings/printing?deviceId=${encodeURIComponent(deviceId)}`,
      { headers: getAuthHeaders() }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data) {
      cachedSettings = null;
      return null;
    }
    const d = json.data;
    const token = localStorage.getItem("pos_print_agent_token") || "";
    const settings: PrintingSettings = {
      silentPrintingEnabled: !!d.silentPrintingEnabled,
      agentUrl: (d.agentUrl || "http://127.0.0.1:9123").replace(/\/$/, ""),
      agentToken: token,
      receiptPrinterName: d.receiptPrinterName || "",
      labelPrinterName: d.labelPrinterName || "",
      a4PrinterName: d.a4PrinterName || "",
    };
    cachedSettings = settings;
    cacheTs = now;
    return settings;
  } catch {
    cachedSettings = null;
    return null;
  }
}

/** Invalidate cached settings (e.g. after user saves new settings). */
export function invalidatePrintingSettingsCache(): void {
  cachedSettings = null;
  cacheTs = 0;
}

/**
 * Whether silent label printing via Print Bridge could be attempted (settings only; agent may still be down).
 * Used to skip expensive browser canvas PNG work when the user only uses browser PDF for labels.
 */
export function isLabelSilentPrintingConfigured(settings: PrintingSettings | null): boolean {
  if (!settings) return false;
  const silentReady =
    settings.silentPrintingEnabled &&
    !!String(settings.labelPrinterName || "").trim() &&
    !!String(settings.agentUrl || "").trim() &&
    !!settings.agentToken?.trim();
  if (!silentReady) return false;
  return !!parseAllowedLoopbackAgentBase(settings.agentUrl);
}

/** Check if agent is reachable. Calls Print Bridge DIRECTLY from the browser (Chrome treats http://127.0.0.1 as a secure origin even from HTTPS pages, so mixed-content is allowed; the cloud-side proxy fallback is only used in same-machine installs). */
export async function checkAgentHealth(
  agentUrl: string,
  agentToken: string
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return checkPrintAgentReachable(agentUrl, agentToken);
}

export interface PrintReceiptResult {
  sent: boolean;
  error?: string;
}

/** Send receipt (ESC/POS) to agent. Returns result with sent flag and optional error reason. */
export async function printReceipt(saleId: string): Promise<PrintReceiptResult> {
  const settings = await loadPrintingSettings();
  if (!settings) {
    return { sent: false, error: "Printing settings not loaded. Check you are logged in." };
  }
  // Always use current token from localStorage (cache may have been built before token was saved)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("pos_print_agent_token");
    if (stored !== null) settings.agentToken = stored;
  }
  if (!settings.silentPrintingEnabled) {
    return { sent: false, error: "Silent printing is disabled in Settings → Printing." };
  }
  if (!settings.agentUrl) {
    return { sent: false, error: "Agent URL not set in Settings → Printing." };
  }
  if (!settings.receiptPrinterName) {
    return { sent: false, error: "Receipt printer not selected in Settings → Printing." };
  }
  if (!settings.agentToken?.trim()) {
    return {
      sent: false,
      error: "Print agent token not set. Open Print Bridge Status, copy the token, paste in Settings → Printing and Save.",
    };
  }
  const ok = await checkAgentHealth(settings.agentUrl, settings.agentToken);
  if (!ok) {
    return {
      sent: false,
      error: "Cannot reach print agent. Is POS Print Bridge running? Check agent URL and token in Settings → Printing.",
    };
  }
  try {
    const res = await fetch(`${API_URL}/api/print/receipt/${encodeURIComponent(saleId)}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        sent: false,
        error: json.message || `Backend error ${res.status}. Check permissions (sale.view).`,
      };
    }
    if (!json.success || !json.dataBase64) {
      return { sent: false, error: "Backend did not return receipt data." };
    }
    const agentRes = await fetchPrintAgent(
      settings.agentUrl,
      "POST",
      "/print/receipt/escpos",
      {
        token: settings.agentToken,
        timeoutMs: 30000,
        jsonBody: {
          printerName: settings.receiptPrinterName,
          dataBase64: json.dataBase64,
          jobName: json.jobName || `receipt-${saleId}`,
        },
      }
    );
    const agentJson = await agentRes.json().catch(() => ({}));
    if (agentRes.ok && agentJson.success) {
      return { sent: true };
    }
    if (agentRes.status === 401) {
      return {
        sent: false,
        error: "Agent token invalid or not paired. Copy token from Print Bridge Status (http://127.0.0.1:9123/status) into Settings → Printing and Save.",
      };
    }
    if (agentRes.status === 403) {
      return {
        sent: false,
        error: "Print request was rejected (403). Check agent token and printer name.",
      };
    }
    const agentMsg = agentJson.message || "";
    const isPrinterModuleMissing =
      agentMsg.includes("printer module not available") || agentMsg.includes("build required");
    return {
      sent: false,
      error: isPrinterModuleMissing
        ? "Receipt printing needs the Print Bridge 'printer' module. Reinstall Print Bridge (build with receipt support) or use the browser print option below."
        : agentMsg || `Print agent error ${agentRes.status}. Check receipt printer is installed and selected.`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      sent: false,
      error: msg.includes("fetch") || msg.includes("Failed to fetch")
        ? "Cannot reach print agent. Is POS Print Bridge running? If the app runs in Docker, the server must reach the agent (127.0.0.1 is inside the container)."
        : `Error: ${msg}`,
    };
  }
}

export interface PrintLabelsPdfOptions {
  /**
   * Default noscale — avoids fitting the label to Letter/A4.
   * Do not set Sumatra `orientation` for repair labels: it rotates content 90° and breaks layout vs Chrome.
   */
  scale?: "noscale" | "shrink" | "fit";
}

export interface PrintLabelsPdfResult {
  sent: boolean;
  /** Set when silent print was configured but did not complete; show before falling back to browser print. */
  error?: string;
}

/** Send labels PDF to agent (e.g. DYMO). Uses noscale; page size comes from the PDF MediaBox. */
export async function printLabelsPdf(
  pdfBase64: string,
  jobName = "labels",
  options?: PrintLabelsPdfOptions
): Promise<PrintLabelsPdfResult> {
  const settings = await loadPrintingSettings();
  if (!settings) return { sent: false };
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("pos_print_agent_token");
    if (stored !== null) settings.agentToken = stored;
  }

  const silentReady =
    settings.silentPrintingEnabled &&
    !!String(settings.labelPrinterName || "").trim() &&
    !!String(settings.agentUrl || "").trim() &&
    !!settings.agentToken?.trim();

  if (!silentReady) {
    return { sent: false };
  }

  const agentBaseOk = parseAllowedLoopbackAgentBase(settings.agentUrl);
  if (!agentBaseOk) {
    return {
      sent: false,
      error:
        "Print agent URL must be http://127.0.0.1:PORT or http://localhost:PORT so the app can reach Print Bridge. LAN addresses are blocked—fix Settings → Printing.",
    };
  }

  const ok = await checkAgentHealth(settings.agentUrl, settings.agentToken);
  if (!ok) {
    return {
      sent: false,
      error:
        "Cannot reach Print Bridge. Start it on this PC and set the agent URL to http://127.0.0.1:9123 (or your port).",
    };
  }

  try {
    const res = await fetchPrintAgent(settings.agentUrl, "POST", "/print/pdf", {
      token: settings.agentToken,
      timeoutMs: 30000,
      jsonBody: {
        printerName: settings.labelPrinterName,
        pdfBase64,
        jobName,
        scale: options?.scale ?? "noscale",
      },
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };
    if (res.ok && json.success) {
      return { sent: true };
    }
    if (res.status === 401) {
      return {
        sent: false,
        error:
          "Print agent token invalid. Open Print Bridge status, copy the token, paste in Settings → Printing, then Save.",
      };
    }
    if (res.status === 403) {
      return {
        sent: false,
        error: "Print request rejected (403). Check the agent token and label printer name.",
      };
    }
    const agentMsg = json.message || "";
    const isPrinterModuleMissing =
      agentMsg.includes("printer module not available") || agentMsg.includes("build required");
    return {
      sent: false,
      error: isPrinterModuleMissing
        ? "Label printing needs Print Bridge with raster/PDF support. Reinstall or run npm install in the print-agent folder, or use browser print below."
        : agentMsg || `Print agent error (${res.status}). Check Print Bridge and the label printer name.`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      sent: false,
      error:
        msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("aborted")
          ? "Could not reach the print proxy or Print Bridge timed out. If the app runs in Docker/WSL, 127.0.0.1 must point to the machine running Print Bridge."
          : msg,
    };
  }
}

/**
 * Silent-print repair label as PNG (browser canvas → agent GDI). Bypasses PDF/pdf.js; reliable on DYMO.
 */
const REPAIR_LABEL_PRINT_LOG = "[repair-label-print]";

export async function printRepairLabelCanvasPngToAgent(
  pngBase64: string,
  jobName: string,
  gdiWidthMm: number,
  gdiHeightMm: number
): Promise<boolean> {
  const settings = await loadPrintingSettings();
  if (!settings) {
    console.info(REPAIR_LABEL_PRINT_LOG, "label-png skip: no printing settings");
    return false;
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("pos_print_agent_token");
    if (stored !== null) settings.agentToken = stored;
  }
  if (
    !settings.silentPrintingEnabled ||
    !settings.labelPrinterName ||
    !settings.agentUrl ||
    !settings.agentToken?.trim()
  ) {
    console.info(REPAIR_LABEL_PRINT_LOG, "label-png skip: silent off or missing label printer / agent URL / token");
    return false;
  }
  const ok = await checkAgentHealth(settings.agentUrl, settings.agentToken);
  if (!ok) {
    console.info(REPAIR_LABEL_PRINT_LOG, "label-png skip: agent health check failed");
    return false;
  }
  try {
    const res = await fetchPrintAgent(settings.agentUrl, "POST", "/print/label-png", {
      token: settings.agentToken,
      timeoutMs: 30000,
      jsonBody: {
        printerName: settings.labelPrinterName,
        pngBase64,
        jobName,
        copies: 1,
        gdiWidthMm,
        gdiHeightMm,
      },
    });
    const json = await res.json().catch(() => ({}));
    const success = res.ok && !!json.success;
    if (!success) {
      console.info(
        REPAIR_LABEL_PRINT_LOG,
        "label-png request failed:",
        res.status,
        (json as { error?: string }).error ?? ""
      );
    }
    return success;
  } catch (e) {
    console.info(REPAIR_LABEL_PRINT_LOG, "label-png fetch error:", e);
    return false;
  }
}

/** Optional: send invoice PDF to A4 printer via agent. */
export async function printInvoicePdf(pdfBase64: string): Promise<boolean> {
  const settings = await loadPrintingSettings();
  if (
    !settings?.silentPrintingEnabled ||
    !settings.a4PrinterName ||
    !settings.agentUrl
  )
    return false;
  const ok = await checkAgentHealth(settings.agentUrl, settings.agentToken);
  if (!ok) return false;
  try {
    const res = await fetchPrintAgent(settings.agentUrl, "POST", "/print/pdf", {
      token: settings.agentToken,
      timeoutMs: 30000,
      jsonBody: {
        printerName: settings.a4PrinterName,
        pdfBase64,
        jobName: "invoice",
      },
    });
    const json = await res.json().catch(() => ({}));
    return res.ok && !!json.success;
  } catch {
    return false;
  }
}

/** ESC/POS cash drawer pulse (ESC @ init + ESC p). Pin 0 = connector pin 2 on most printers. */
export function buildCashDrawerKickBase64(pin: 0 | 1 = 0): string {
  const ESC = 0x1b;
  const m = pin === 1 ? 1 : 0;
  const bytes = new Uint8Array([ESC, 0x40, ESC, 0x70, m, 25, 250]);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Open cash drawer via receipt printer (RAW ESC/POS). Requires silent printing configured. */
export async function openCashDrawer(pin: 0 | 1 = 0): Promise<PrintReceiptResult> {
  const settings = await loadPrintingSettings();
  if (!settings) {
    return { sent: false, error: "Printing settings not loaded." };
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("pos_print_agent_token");
    if (stored !== null) settings.agentToken = stored;
  }
  if (!settings.silentPrintingEnabled) {
    return { sent: false, error: "Enable silent printing in Settings → Printing." };
  }
  if (!settings.receiptPrinterName?.trim()) {
    return { sent: false, error: "Select a receipt printer in Settings → Printing." };
  }
  if (!settings.agentToken?.trim()) {
    return { sent: false, error: "Print agent token not set in Settings → Printing." };
  }
  const ok = await checkAgentHealth(settings.agentUrl, settings.agentToken);
  if (!ok) {
    return { sent: false, error: "Cannot reach Print Bridge on this PC." };
  }
  try {
    const agentRes = await fetchPrintAgent(settings.agentUrl, "POST", "/print/drawer/kick", {
      token: settings.agentToken,
      timeoutMs: 10000,
      jsonBody: {
        printerName: settings.receiptPrinterName.trim(),
        dataBase64: buildCashDrawerKickBase64(pin),
        jobName: "cash-drawer",
      },
    });
    const agentJson = await agentRes.json().catch(() => ({}));
    if (agentRes.ok && agentJson.success) {
      return { sent: true };
    }
    return {
      sent: false,
      error: (agentJson as { message?: string }).message || `Drawer kick failed (${agentRes.status}).`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { sent: false, error: msg };
  }
}

export { getDeviceId };

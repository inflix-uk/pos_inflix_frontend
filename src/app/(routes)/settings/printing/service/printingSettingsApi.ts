const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 if (typeof window === "undefined") return { "Content-Type": "application/json" };
 const token = localStorage.getItem("token");
 return {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
 };
};

export interface PrintingSettingsData {
 deviceId: string;
 silentPrintingEnabled: boolean;
 agentUrl: string;
 hasAgentToken: boolean;
 agentToken?: string;
 receiptPrinterName: string;
 labelPrinterName: string;
 a4PrinterName?: string;
}

export async function getPrintingSettings(deviceId: string): Promise<{
 success: boolean;
 data?: PrintingSettingsData;
 message?: string;
}> {
 const res = await fetch(
  `${API_URL}/api/settings/printing?deviceId=${encodeURIComponent(deviceId)}`,
  { headers: getAuthHeaders() }
 );
 const json = await res.json().catch(() => ({}));
 if (!res.ok) return { success: false, message: json.message || "Failed to load printing settings" };
 return json;
}

export async function updatePrintingSettings(
 deviceId: string,
 payload: {
  silentPrintingEnabled: boolean;
  agentUrl?: string;
  agentToken?: string;
  receiptPrinterName?: string;
  labelPrinterName?: string;
  a4PrinterName?: string;
 }
): Promise<{ success: boolean; data?: PrintingSettingsData; message?: string }> {
 const res = await fetch(`${API_URL}/api/settings/printing`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify({ deviceId, ...payload }),
 });
 const json = await res.json().catch(() => ({}));
 if (!res.ok) return { success: false, message: json.message || "Failed to save" };
 return json;
}

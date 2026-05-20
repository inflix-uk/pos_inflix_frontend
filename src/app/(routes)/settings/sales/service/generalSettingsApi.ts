const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export interface GeneralSettingsData {
 salesAutoSelectAccountEnabled: boolean;
 defaultSalesAccountId: string | null;
 defaultAccount?: { _id: string; name: string };
 retailModeEnabled?: boolean;
 allowNegativeStock?: boolean;
 adminTotpEnabled?: boolean;
 refundOtpThreshold?: number;
 updatedAtUtc?: string;
}

export interface AdminTotpSetupData {
 otpauthUrl: string;
 qrDataUrl: string;
 secret: string;
}

export async function setupAdminTotp(): Promise<{
 success: boolean;
 data?: AdminTotpSetupData;
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general/2fa/setup`, {
  method: "POST",
  headers: getAuthHeaders(),
 });
 return res.json();
}

export async function verifyAndEnableAdminTotp(code: string): Promise<{
 success: boolean;
 data?: { adminTotpEnabled: boolean };
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general/2fa/verify-enable`, {
  method: "POST",
  headers: getAuthHeaders(),
  body: JSON.stringify({ code }),
 });
 return res.json();
}

export async function disableAdminTotp(code: string): Promise<{
 success: boolean;
 data?: { adminTotpEnabled: boolean };
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general/2fa/disable`, {
  method: "POST",
  headers: getAuthHeaders(),
  body: JSON.stringify({ code }),
 });
 return res.json();
}

export async function getGeneralSettings(): Promise<{
 success: boolean;
 data?: GeneralSettingsData;
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general`, {
  method: "GET",
  headers: getAuthHeaders(),
 });
 return res.json();
}

export async function updateSalesAutoSelectAccount(body: {
 enabled: boolean;
 defaultSalesAccountId?: string | null;
}): Promise<{
 success: boolean;
 data?: GeneralSettingsData;
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general/sales-auto-select-account`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
 });
 return res.json();
}

export async function updateSalesMode(body: {
 retailModeEnabled: boolean;
}): Promise<{
 success: boolean;
 data?: GeneralSettingsData;
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general/sales-mode`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
 });
 return res.json();
}

export async function updateNegativeStock(body: {
 allowNegativeStock: boolean;
}): Promise<{
 success: boolean;
 data?: GeneralSettingsData;
 message?: string;
}> {
 const res = await fetch(`${API_URL}/api/settings/general/negative-stock`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
 });
 return res.json();
}

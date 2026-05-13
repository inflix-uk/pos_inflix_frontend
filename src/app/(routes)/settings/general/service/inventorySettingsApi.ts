const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
}

export interface InventorySettingsData {
 syncSalePriceToSameVariant: boolean;
}

export async function getInventorySettings(): Promise<{
 success: boolean;
 data?: InventorySettingsData;
}> {
 const response = await fetch(`${API_URL}/api/settings/inventory`, {
  method: "GET",
  headers: getAuthHeaders(),
 });
 return response.json();
}

export async function updateInventorySettings(
 body: Partial<InventorySettingsData>
): Promise<{ success: boolean; data?: InventorySettingsData; message?: string }> {
 const response = await fetch(`${API_URL}/api/settings/inventory`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
 });
 return response.json();
}

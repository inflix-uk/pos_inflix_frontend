const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export interface MySalesModeData {
  preferredRetailModeEnabled: boolean | null;
  effectiveRetailModeEnabled: boolean;
}

export async function getMySalesMode(): Promise<{
  success: boolean;
  data?: MySalesModeData;
  message?: string;
}> {
  const res = await fetch(`${API_URL}/api/settings/my-sales-mode`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function updateMySalesMode(body: {
  retailModeEnabled: boolean;
}): Promise<{
  success: boolean;
  data?: {
    preferredRetailModeEnabled: boolean;
    effectiveRetailModeEnabled: boolean;
  };
  message?: string;
}> {
  const res = await fetch(`${API_URL}/api/settings/my-sales-mode`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

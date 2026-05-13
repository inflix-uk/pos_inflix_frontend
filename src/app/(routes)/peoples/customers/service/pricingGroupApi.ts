const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export interface PricingGroup {
 _id: string;
 name: string;
}

export const pricingGroupApi = {
 getList: async (): Promise<{ success: boolean; data: PricingGroup[] }> => {
  const response = await fetch(`${API_URL}/api/pricing-groups`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  return response.json();
 },
};

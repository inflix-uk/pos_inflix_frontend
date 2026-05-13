const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export interface StockListItem {
 path: string[];
 availableCount: number;
}

export interface StockListResponse {
 success: boolean;
 data?: StockListItem[];
 message?: string;
}

export interface GetStockListParams {
 status?: string;
}

export const stockListApi = {
 getStockList: async (
  params: GetStockListParams = {}
 ): Promise<StockListResponse> => {
  try {
   const queryParams = new URLSearchParams();
   if (params.status) queryParams.set("status", params.status);

   const url = `${API_BASE_URL}/purchases/stock-list${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
   const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   const data = await response.json();
   if (!response.ok) {
    return { success: false, message: data.message || "Failed to fetch stock list" };
   }
   return data;
  } catch (error) {
   console.error("Error fetching stock list:", error);
   return { success: false, message: "Failed to fetch stock list" };
  }
 },
};

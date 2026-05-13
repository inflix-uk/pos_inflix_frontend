import { Discount } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const discountApi = {
 getAll: async (): Promise<Discount[]> => {
  const response = await fetch(`${API_BASE_URL}/discounts`);
  if (!response.ok) throw new Error("Failed to fetch discounts");
  return response.json();
 },

 getById: async (id: string): Promise<Discount> => {
  const response = await fetch(`${API_BASE_URL}/discounts/${id}`);
  if (!response.ok) throw new Error("Failed to fetch discount");
  return response.json();
 },

 create: async (data: Omit<Discount, "id">): Promise<Discount> => {
  const response = await fetch(`${API_BASE_URL}/discounts`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create discount");
  return response.json();
 },

 update: async (id: string, data: Partial<Discount>): Promise<Discount> => {
  const response = await fetch(`${API_BASE_URL}/discounts/${id}`, {
   method: "PUT",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update discount");
  return response.json();
 },

 delete: async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/discounts/${id}`, {
   method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete discount");
 },
};

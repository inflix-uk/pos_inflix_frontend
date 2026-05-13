import { DiscountPlan } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const discountPlanApi = {
 getAll: async (): Promise<DiscountPlan[]> => {
  const response = await fetch(`${API_BASE_URL}/discount-plans`);
  if (!response.ok) throw new Error("Failed to fetch discount plans");
  return response.json();
 },

 getById: async (id: string): Promise<DiscountPlan> => {
  const response = await fetch(`${API_BASE_URL}/discount-plans/${id}`);
  if (!response.ok) throw new Error("Failed to fetch discount plan");
  return response.json();
 },

 create: async (data: Omit<DiscountPlan, "id">): Promise<DiscountPlan> => {
  const response = await fetch(`${API_BASE_URL}/discount-plans`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create discount plan");
  return response.json();
 },

 update: async (id: string, data: Partial<DiscountPlan>): Promise<DiscountPlan> => {
  const response = await fetch(`${API_BASE_URL}/discount-plans/${id}`, {
   method: "PUT",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update discount plan");
  return response.json();
 },

 delete: async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/discount-plans/${id}`, {
   method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete discount plan");
 },
};

import { GiftCard } from "../types";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const giftCardApi = {
 getAll: async (): Promise<GiftCard[]> => {
  const response = await fetch(`${API_BASE_URL}/gift-cards`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch gift cards");
  return response.json();
 },

 getById: async (id: string): Promise<GiftCard> => {
  const response = await fetch(`${API_BASE_URL}/gift-cards/${id}`, {
   method: "GET",
   headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch gift card");
  return response.json();
 },

 create: async (data: Omit<GiftCard, "id">): Promise<GiftCard> => {
  const response = await fetch(`${API_BASE_URL}/gift-cards`, {
   method: "POST",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create gift card");
  return response.json();
 },

 update: async (id: string, data: Partial<GiftCard>): Promise<GiftCard> => {
  const response = await fetch(`${API_BASE_URL}/gift-cards/${id}`, {
   method: "PUT",
   headers: getAuthHeaders(),
   body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update gift card");
  return response.json();
 },

 delete: async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/gift-cards/${id}`, {
   method: "DELETE",
   headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete gift card");
 },
};

import { BankAccount, BankAccountFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse<T = unknown> {
 success: boolean;
 message?: string;
 data?: T;
 count?: number;
}

const getAuthHeaders = (): HeadersInit => {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 return {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
 };
};

export const bankAccountApi = {
 /**
  * Get all bank accounts
  */
 getAccounts: async (): Promise<ApiResponse<BankAccount[]>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/bank-accounts`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch bank accounts");
  }
 },

 /**
  * Get single bank account
  */
 getAccount: async (id: string): Promise<ApiResponse<BankAccount>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/bank-accounts/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to fetch bank account");
  }
 },

 /**
  * Create bank account
  */
 createAccount: async (data: BankAccountFormData): Promise<ApiResponse<BankAccount>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/bank-accounts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to create bank account");
  }
 },

 /**
  * Update bank account
  */
 updateAccount: async (id: string, data: Partial<BankAccountFormData>): Promise<ApiResponse<BankAccount>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/bank-accounts/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to update bank account");
  }
 },

 /**
  * Delete bank account
  */
 deleteAccount: async (id: string): Promise<ApiResponse> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/bank-accounts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to delete bank account");
  }
 },

 /**
  * Set bank account as default
  */
 setDefault: async (id: string): Promise<ApiResponse<BankAccount>> => {
  try {
   const response = await fetch(`${API_URL}/api/settings/bank-accounts/${id}/set-default`, {
    method: "PUT",
    headers: getAuthHeaders(),
   });
   return await response.json();
  } catch {
   throw new Error("Failed to set default bank account");
  }
 },
};

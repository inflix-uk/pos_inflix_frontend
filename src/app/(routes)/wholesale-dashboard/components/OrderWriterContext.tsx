"use client";

/**
 * Minimal write-side seam that lets the create-invoice flow swap salesApi for
 * invoicesApi without forking the 1500-line wholesale-dashboard. Read paths
 * (inventory lookups, serial searches) keep using salesApi directly — only
 * the operations that determine where the order lands are pluggable.
 */

import React, { createContext, useContext } from "react";
import {
 salesApi,
 type CreateSalePayload,
 type CreateSaleResponse,
} from "../../sales-dashboard/service/salesApi";

export interface OrderWriter {
 /** Label shown on the primary action / success toast (e.g. "Order", "Invoice"). */
 entityLabel: string;
 /** Singular noun for messages (e.g. "order saved", "invoice saved"). */
 entityNounLower: string;
 /** Server-side reference prefix shown to users when describing the doc number. */
 referencePrefix: string;
 /** Persist the cart as a sale or invoice. */
 createSale: (payload: CreateSalePayload) => Promise<CreateSaleResponse>;
 /** Check whether a user-typed reference is already used (in the corresponding collection). */
 checkReference: (
  reference: string,
  signal?: AbortSignal,
  excludeId?: string,
 ) => Promise<{
  success: boolean;
  data: {
   reference: string;
   exists: boolean;
   valid: boolean;
   reason?: string;
   nextAvailable?: string;
  };
 }>;
 /** Save / Drafts toolbar and empty-cart draft actions (off on create-invoice). */
 enableDrafts?: boolean;
 /** Always wholesale UI (customer required, no walk-in retail layout). Used by create-invoice. */
 forceWholesaleMode?: boolean;
 /** Optional invoice date field in toolbar (create-invoice). */
 enableInvoiceDate?: boolean;
 /** When set, wholesale UI loads this invoice and saves via updateSale instead of create. */
 editInvoiceId?: string;
 /** Update existing invoice (edit-invoice flow). */
 updateSale?: (
  id: string,
  payload: CreateSalePayload,
 ) => Promise<CreateSaleResponse>;
}

const DEFAULT_WRITER: OrderWriter = {
 entityLabel: "Order",
 entityNounLower: "order",
 referencePrefix: "INV-",
 createSale: (payload) => salesApi.createSale(payload),
 checkReference: (reference, signal) => salesApi.checkReference(reference, signal),
 enableDrafts: true,
};

const OrderWriterContext = createContext<OrderWriter>(DEFAULT_WRITER);

export function OrderWriterProvider({
 value,
 children,
}: {
 value: OrderWriter;
 children: React.ReactNode;
}) {
 return <OrderWriterContext.Provider value={value}>{children}</OrderWriterContext.Provider>;
}

export function useOrderWriter(): OrderWriter {
 return useContext(OrderWriterContext);
}

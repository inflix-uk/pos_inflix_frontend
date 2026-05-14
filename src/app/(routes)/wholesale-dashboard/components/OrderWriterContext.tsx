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
 ) => Promise<{ success: boolean; data: { reference: string; exists: boolean; valid: boolean; reason?: string } }>;
}

const DEFAULT_WRITER: OrderWriter = {
 entityLabel: "Order",
 entityNounLower: "order",
 referencePrefix: "INV-",
 createSale: (payload) => salesApi.createSale(payload),
 checkReference: (reference, signal) => salesApi.checkReference(reference, signal),
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

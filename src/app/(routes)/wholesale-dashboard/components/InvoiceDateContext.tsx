"use client";

import React, { createContext, useContext, useState } from "react";

type InvoiceDateContextValue = {
  /** Local calendar date `YYYY-MM-DD`; empty → backend uses current date/time. */
  invoiceDate: string;
  setInvoiceDate: (value: string) => void;
  enabled: boolean;
};

const defaultValue: InvoiceDateContextValue = {
  invoiceDate: "",
  setInvoiceDate: () => {},
  enabled: false,
};

const InvoiceDateContext = createContext<InvoiceDateContextValue>(defaultValue);

export function InvoiceDateProvider({ children }: { children: React.ReactNode }) {
  const [invoiceDate, setInvoiceDate] = useState("");
  return (
    <InvoiceDateContext.Provider value={{ invoiceDate, setInvoiceDate, enabled: true }}>
      {children}
    </InvoiceDateContext.Provider>
  );
}

export function useInvoiceDate(): InvoiceDateContextValue {
  return useContext(InvoiceDateContext);
}

/** Map optional date input to ISO string for API `occurredAt`. */
export function invoiceDateToOccurredAt(date: string): string | undefined {
  const trimmed = date.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "app_currency";

export type CurrencyCode = "GBP" | "USD" | "EUR";

const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

function getStoredCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "GBP";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "GBP" || stored === "USD" || stored === "EUR") return stored;
  return "GBP";
}

interface AppCurrencyContextValue {
  currencyCode: CurrencyCode;
  currencySymbol: string;
  setCurrency: (code: CurrencyCode) => void;
  formatMoney: (n: number) => string;
  currencies: typeof CURRENCIES;
}

const AppCurrencyContext = createContext<AppCurrencyContextValue | null>(null);

export function AppCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("GBP");

  useEffect(() => {
    setCurrencyCode(getStoredCurrency());
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
    setCurrencyCode(code);
  }, []);

  const currencySymbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "£";
  const formatMoney = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(n),
    [currencyCode]
  );

  const value: AppCurrencyContextValue = {
    currencyCode,
    currencySymbol,
    setCurrency,
    formatMoney,
    currencies: CURRENCIES,
  };

  return (
    <AppCurrencyContext.Provider value={value}>
      {children}
    </AppCurrencyContext.Provider>
  );
}

export function useAppCurrency(): AppCurrencyContextValue {
  const ctx = useContext(AppCurrencyContext);
  if (!ctx) {
    return {
      currencyCode: "GBP",
      currencySymbol: "£",
      setCurrency: () => {},
      formatMoney: (n: number) =>
        new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n),
      currencies: CURRENCIES,
    };
  }
  return ctx;
}

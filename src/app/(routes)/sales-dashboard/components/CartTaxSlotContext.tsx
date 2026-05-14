"use client";

import React, { createContext, useContext } from "react";

/**
 * Optional slot injected into <CartPanel/> directly after the Subtotal row.
 * Used by /create-invoice to render a tax-category selector inside the
 * shared wholesale order summary without forking the dashboard.
 */
const CartTaxSlotContext = createContext<React.ReactNode | null>(null);

export function CartTaxSlotProvider({
 value,
 children,
}: {
 value: React.ReactNode | null;
 children: React.ReactNode;
}) {
 return <CartTaxSlotContext.Provider value={value}>{children}</CartTaxSlotContext.Provider>;
}

export function useCartTaxSlot(): React.ReactNode | null {
 return useContext(CartTaxSlotContext);
}

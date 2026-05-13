"use client";

import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { ProductsProvider } from "@/lib/products-context";
import { AppCurrencyProvider } from "@/lib/app-currency-context";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { PlatformAuthProvider } from "@/contexts/PlatformAuthContext";
import { RouteGuard } from "./RouteGuard";

export default function RoutesLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <AppCurrencyProvider>
 <ProductsProvider>
 <PermissionsProvider>
  <PlatformAuthProvider>
  <RouteGuard>
  <div className="flex h-screen">
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
   <Header />
   <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
  </div>
  </div>
  </RouteGuard>
  </PlatformAuthProvider>
 </PermissionsProvider>
 </ProductsProvider>
 </AppCurrencyProvider>
 );
}

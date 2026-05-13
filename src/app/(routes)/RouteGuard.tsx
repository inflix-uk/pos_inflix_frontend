"use client";

import { usePathname } from "next/navigation";
import { isPlatformPath } from "@/lib/route-permissions";
import { RequirePermission } from "@/components/RequirePermission";

/**
 * Layout-level guard: platform paths skip tenant auth (RequirePermission).
 * Platform routes use platform layout auth; others require tenant user.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
 const pathname = usePathname() ?? "";
 if (isPlatformPath(pathname)) {
 return <>{children}</>;
 }
 return <RequirePermission>{children}</RequirePermission>;
}

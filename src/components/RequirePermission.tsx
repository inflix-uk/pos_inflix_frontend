"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getRequiredPermsForPath, isPublicPath } from "@/lib/route-permissions";

type RequirePermissionProps = { children: React.ReactNode };

/**
 * Route guard: no direct URL access for restricted pages.
 * - Public paths (e.g. /login) → render children (layout may still redirect if not logged in).
 * - Not logged in → redirect to /login.
 * - Logged in but missing required permission → redirect to /403.
 * - Do NOT render page content for unauthorized users (no data load).
 */
export function RequirePermission({ children }: RequirePermissionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, can, suspended } = usePermissions();

  useEffect(() => {
    if (loading) return;

    if (suspended) {
      router.replace("/suspended");
      return;
    }

    if (isPublicPath(pathname)) {
      return;
    }

    if (!user) {
      router.replace("/");
      return;
    }

    const required = getRequiredPermsForPath(pathname);
    if (required === undefined) return; // public
    if (required.length === 0) return; // any authenticated

    const hasAny = required.some((p) => can(p));
    if (!hasAny) {
      router.replace("/403");
    }
  }, [loading, user, pathname, can, router, suspended]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (suspended) {
    return null;
  }

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const required = getRequiredPermsForPath(pathname);
  if (required !== undefined && required.length > 0) {
    const hasAny = required.some((p) => can(p));
    if (!hasAny) {
      return null;
    }
  }

  return <>{children}</>;
}

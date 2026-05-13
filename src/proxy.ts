import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Paths that use platform auth only; no tenant auth required. */
function isPlatformPath(pathname: string): boolean {
  return (
    pathname === "/platform-login" ||
    pathname === "/platform" ||
    pathname.startsWith("/platform/")
  );
}

/**
 * Proxy: allow platform paths without tenant auth.
 * Platform routes use their own auth (platform layout redirects to /platform-login if needed).
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPlatformPath(pathname)) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except static files and api
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};

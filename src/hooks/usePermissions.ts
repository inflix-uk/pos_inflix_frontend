"use client";

import { usePermissionsContext } from "@/contexts/PermissionsContext";

export type { CurrentUser } from "@/contexts/PermissionsContext";

/**
 * Returns user + permission helpers from the single PermissionsProvider fetch.
 * Use to gate UI; backend remains source of truth and will 403 forbidden requests.
 */
export function usePermissions() {
  return usePermissionsContext();
}

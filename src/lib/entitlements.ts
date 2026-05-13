/**
 * Entitlements helpers: normalize usage shape and map usage vs limits for display.
 * Usage keys: usersUsed, locationsUsed, repairsThisMonthUsed (current counts).
 * Limit keys: maxUsers, maxLocations, maxRepairsPerMonth (caps).
 */

export interface NormalizedUsage {
  usersUsed: number;
  locationsUsed: number;
  repairsThisMonthUsed: number;
}

export interface EntitlementsLike {
  usage?: Record<string, number>;
  limits?: Record<string, number | null>;
}

const DEFAULT_USAGE: NormalizedUsage = {
  usersUsed: 0,
  locationsUsed: 0,
  repairsThisMonthUsed: 0,
};

/**
 * Ensures usage has the correct keys with default 0.
 * Accepts legacy shape (maxUsers/maxLocations/maxRepairsPerMonth as usage counts) for backward compatibility.
 */
export function normalizeUsage(usage: Record<string, number> | undefined | null): NormalizedUsage {
  if (!usage || typeof usage !== "object") return { ...DEFAULT_USAGE };
  return {
    usersUsed: Number(usage.usersUsed ?? usage.maxUsers ?? 0) || 0,
    locationsUsed: Number(usage.locationsUsed ?? usage.maxLocations ?? 0) || 0,
    repairsThisMonthUsed: Number(usage.repairsThisMonthUsed ?? usage.maxRepairsPerMonth ?? 0) || 0,
  };
}

/**
 * Normalizes entitlements so usage has usersUsed, locationsUsed, repairsThisMonthUsed.
 */
export function normalizeEntitlements<T extends EntitlementsLike>(ent: T | null | undefined): T | null {
  if (ent == null) return null;
  const usage = normalizeUsage(ent.usage);
  return { ...ent, usage: { ...ent.usage, ...usage } } as T;
}

/** Rows for "Usage vs limits" table: limit key, usage key, display label */
export const USAGE_LIMIT_ROWS: { limitKey: string; usageKey: keyof NormalizedUsage; label: string }[] = [
  { limitKey: "maxUsers", usageKey: "usersUsed", label: "Users" },
  { limitKey: "maxLocations", usageKey: "locationsUsed", label: "Locations" },
  { limitKey: "maxRepairsPerMonth", usageKey: "repairsThisMonthUsed", label: "Repairs (month)" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const CACHE_KEY = "pos_header_quick_actions_cache_v2";
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

/** When false, the matching control is hidden (permissions still apply). All default to true. */
export interface HeaderQuickActionsVisibility {
  showNewSale: boolean;
  showNewRepair: boolean;
  showParcel: boolean;
  showReturn: boolean;
  /** Retail / Wholesale mode toggle in the header */
  showSalesModeToggle: boolean;
  /** Account Statement shortcut */
  showAccounts: boolean;
  /** Stock List (Inventory Products – stock-list tab) shortcut */
  showStockList: boolean;
}

const defaults: HeaderQuickActionsVisibility = {
  showNewSale: true,
  showNewRepair: true,
  showParcel: true,
  showReturn: true,
  showSalesModeToggle: true,
  showAccounts: true,
  showStockList: true,
};

function normalize(partial: Partial<HeaderQuickActionsVisibility> | null | undefined): HeaderQuickActionsVisibility {
  return {
    showNewSale: partial?.showNewSale !== false,
    showNewRepair: partial?.showNewRepair !== false,
    showParcel: partial?.showParcel !== false,
    showReturn: partial?.showReturn !== false,
    showSalesModeToggle: partial?.showSalesModeToggle !== false,
    showAccounts: partial?.showAccounts !== false,
    showStockList: partial?.showStockList !== false,
  };
}

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

interface CacheEntry {
  data: HeaderQuickActionsVisibility;
  ts: number;
}

function readCache(): HeaderQuickActionsVisibility | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts < CACHE_TTL_MS) return normalize(entry.data);
    return null;
  } catch {
    return null;
  }
}

function writeCache(data: HeaderQuickActionsVisibility): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

/** Clear cache so the next fetch hits the API. */
export function invalidateHeaderQuickActionsCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/** Fetch from API (with 60-min localStorage cache). Returns cached data if fresh, otherwise hits API. */
export async function fetchHeaderQuickActionsVisibility(): Promise<HeaderQuickActionsVisibility> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const res = await fetch(`${API_URL}/api/settings/header-quick-actions`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (json.success && json.data) {
      const normalized = normalize(json.data);
      writeCache(normalized);
      return normalized;
    }
  } catch {
    // API failed — fall through to defaults
  }
  return defaults;
}

/** Save to API, invalidate cache, and notify other components. */
export async function saveHeaderQuickActionsVisibility(
  visibility: HeaderQuickActionsVisibility
): Promise<{ success: boolean; data?: HeaderQuickActionsVisibility; message?: string }> {
  const body = normalize(visibility);
  try {
    const res = await fetch(`${API_URL}/api/settings/header-quick-actions`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success && json.data) {
      const normalized = normalize(json.data);
      writeCache(normalized);
      window.dispatchEvent(new CustomEvent("pos-header-quick-actions-change", { detail: normalized }));
      return { success: true, data: normalized };
    }
    return { success: false, message: json.message || "Failed to save" };
  } catch {
    return { success: false, message: "Network error" };
  }
}

/** Synchronous read from cache only (for initial render). Falls back to defaults. */
export function getHeaderQuickActionsVisibility(): HeaderQuickActionsVisibility {
  return readCache() ?? defaults;
}

export const HEADER_QUICK_ACTIONS_DEFAULTS = defaults;

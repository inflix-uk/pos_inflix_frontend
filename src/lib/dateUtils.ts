/**
 * System-wide date/time display: Europe/London, 24-hour format.
 * All API timestamps are stored in UTC; use these helpers to show London time in the UI.
 */

const LONDON_TZ = "Europe/London";
const DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: LONDON_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/**
 * Format a date for display in London time, 24-hour.
 * Format: DD/MM/YYYY HH:mm (e.g. "04/03/2026 17:45")
 */
export function formatDateTimeLondon(
  value: string | number | Date | null | undefined
): string {
  if (value == null || value === "") return "—";
  const d = typeof value === "object" && "getTime" in value ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", DISPLAY_OPTIONS);
}

/**
 * Time only in London, 24-hour (HH:mm). For "Saved 14:32" style indicators.
 */
export function formatTimeLondon(
  value: string | number | Date | null | undefined
): string {
  if (value == null || value === "") return "—";
  const d = typeof value === "object" && "getTime" in value ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", {
    timeZone: LONDON_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Date only in London (DD/MM/YYYY)
 */
export function formatDateLondon(
  value: string | number | Date | null | undefined
): string {
  if (value == null || value === "") return "—";
  const d = typeof value === "object" && "getTime" in value ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    timeZone: LONDON_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * For table columns: "Created" / "Last updated" / "Occurred at".
 * Prefer occurredAt when present and relevant, else createdAt/updatedAt.
 */
export function formatCreated(
  createdAt: string | Date | null | undefined
): string {
  return formatDateTimeLondon(createdAt);
}

export function formatUpdated(
  updatedAt: string | Date | null | undefined
): string {
  return formatDateTimeLondon(updatedAt);
}

export function formatOccurredAt(
  occurredAt: string | Date | null | undefined,
  fallback: string | Date | null | undefined
): string {
  return formatDateTimeLondon(occurredAt ?? fallback);
}

/**
 * Parse a London date string (DD/MM/YYYY) or date-time to UTC Date for API queries.
 * Use in filters: user picks London date range → convert to UTC start/end for backend.
 */
export function londonDateToUTC(
  localDateStr: string,
  endOfDay = false
): Date {
  const [d, m, y] = localDateStr.split("/").map(Number);
  if (!d || !m || !y) return new Date(NaN);
  const date = new Date(Date.UTC(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
  return date;
}

/**
 * Today's date in London as DD/MM/YYYY (for default filter values).
 */
export function todayLondon(): string {
  return new Date().toLocaleDateString("en-GB", {
    timeZone: LONDON_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Get London date as YYYY-MM-DD for a given date (default: today).
 */
export function getLondonDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: LONDON_TZ });
}

/**
 * Start of a given day in London as UTC Date.
 * Uses noon UTC on that day to derive London offset, then subtracts to get 00:00 London.
 */
function startOfDayLondonUTC(year: number, month: number, day: number): Date {
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(noon);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const offsetMs = (hour * 60 + minute - 12 * 60) * 60 * 1000;
  return new Date(noon.getTime() - 12 * 60 * 60 * 1000 - offsetMs);
}

/**
 * End of a given day in London (23:59:59.999) as UTC Date.
 */
function endOfDayLondonUTC(year: number, month: number, day: number): Date {
  const start = startOfDayLondonUTC(year, month, day);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export type DashboardRange = "today" | "yesterday" | "7d" | "30d" | "custom";

export interface DashboardDateRange {
  fromUtc: Date;
  toUtc: Date;
  label: string;
}

/**
 * Get UTC bounds for dashboard range (London time).
 * For "today" uses current day in London; for 7d/30d uses that many days ending today (London).
 */
export function getDashboardRangeUtc(
  range: DashboardRange,
  customFrom?: string,
  customTo?: string
): DashboardDateRange {
  const now = new Date();
  const todayStr = getLondonDateString(now);
  const [y, m, d] = todayStr.split("-").map(Number);

  if (range === "custom" && customFrom && customTo) {
    const [y1, m1, d1] = customFrom.split("-").map(Number);
    const [y2, m2, d2] = customTo.split("-").map(Number);
    return {
      fromUtc: startOfDayLondonUTC(y1, m1, d1),
      toUtc: endOfDayLondonUTC(y2, m2, d2),
      label: "Custom",
    };
  }

  if (range === "today") {
    return {
      fromUtc: startOfDayLondonUTC(y, m, d),
      toUtc: endOfDayLondonUTC(y, m, d),
      label: "Today",
    };
  }

  if (range === "yesterday") {
    const startToday = startOfDayLondonUTC(y, m, d);
    const yesterday = new Date(startToday.getTime() - 24 * 60 * 60 * 1000);
    const [yy, my, dy] = getLondonDateString(yesterday).split("-").map(Number);
    return {
      fromUtc: startOfDayLondonUTC(yy, my, dy),
      toUtc: endOfDayLondonUTC(yy, my, dy),
      label: "Yesterday",
    };
  }

  if (range === "7d") {
    const startToday = startOfDayLondonUTC(y, m, d);
    const sixDaysAgo = new Date(startToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    const [y0, m0, d0] = getLondonDateString(sixDaysAgo).split("-").map(Number);
    return {
      fromUtc: startOfDayLondonUTC(y0, m0, d0),
      toUtc: endOfDayLondonUTC(y, m, d),
      label: "Last 7 days",
    };
  }

  if (range === "30d") {
    const startToday = startOfDayLondonUTC(y, m, d);
    const twentyNineDaysAgo = new Date(startToday.getTime() - 29 * 24 * 60 * 60 * 1000);
    const [y0, m0, d0] = getLondonDateString(twentyNineDaysAgo).split("-").map(Number);
    return {
      fromUtc: startOfDayLondonUTC(y0, m0, d0),
      toUtc: endOfDayLondonUTC(y, m, d),
      label: "Last 30 days",
    };
  }

  return {
    fromUtc: startOfDayLondonUTC(y, m, d),
    toUtc: endOfDayLondonUTC(y, m, d),
    label: "Today",
  };
}

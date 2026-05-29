/** POS shift window for End of Shift Z-Read (Europe/London display, UTC storage). */

const SHIFT_START_KEY = "pos-shift-started-at";

export function getShiftStartedAt(): Date | null {
 if (typeof window === "undefined") return null;
 const raw = localStorage.getItem(SHIFT_START_KEY);
 if (!raw) return null;
 const d = new Date(raw);
 return Number.isNaN(d.getTime()) ? null : d;
}

/** Start shift clock (login or manual). */
export function startPosShift(at: Date = new Date()): void {
 if (typeof window === "undefined") return;
 localStorage.setItem(SHIFT_START_KEY, at.toISOString());
}

/** Ensure a shift is running; returns start time. */
export function ensurePosShift(): Date {
 const existing = getShiftStartedAt();
 if (existing) return existing;
 const now = new Date();
 startPosShift(now);
 return now;
}

export function clearPosShift(): void {
 if (typeof window === "undefined") return;
 localStorage.removeItem(SHIFT_START_KEY);
}

export function formatShiftRangeLabel(from: Date, to: Date): string {
 const opts: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
 };
 return `${from.toLocaleString("en-GB", opts)} – ${to.toLocaleString("en-GB", opts)}`;
}

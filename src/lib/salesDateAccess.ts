import {
  getDashboardRangeUtc,
  getLondonDateString,
  type DashboardRange,
  type DashboardDateRange,
} from "./dateUtils";

export function canViewHistoricalSales(can: (key: string) => boolean): boolean {
  return can("report.view");
}

export const STAFF_SALES_BANNER =
  "You can only view today's sales. Contact a manager for historical reports.";

export function getTodayLondonDateKey(): string {
  return getLondonDateString();
}

export function getSalesDateRange(
  range: DashboardRange,
  customFrom: string | undefined,
  customTo: string | undefined,
  canViewHistorical: boolean
): DashboardDateRange {
  if (!canViewHistorical) {
    return getDashboardRangeUtc("today");
  }
  return getDashboardRangeUtc(range, customFrom, customTo);
}

/**
 * Route permissions tests: getRequiredPermsForPath, isPublicPath, NAV_CONFIG filtering.
 */

import {
  getRequiredPermsForPath,
  isPublicPath,
  ROUTE_PERMISSIONS,
  PUBLIC_PATHS,
} from "../route-permissions";

describe("route-permissions", () => {
  describe("isPublicPath", () => {
    it("returns true for / and /login", () => {
      expect(isPublicPath("/")).toBe(true);
      expect(isPublicPath("/login")).toBe(true);
    });
    it("returns false for protected paths", () => {
      expect(isPublicPath("/dashboard")).toBe(false);
      expect(isPublicPath("/settings")).toBe(false);
    });
  });

  describe("getRequiredPermsForPath", () => {
    it("returns undefined for public paths", () => {
      expect(getRequiredPermsForPath("/")).toBeUndefined();
      expect(getRequiredPermsForPath("/login")).toBeUndefined();
    });
    it("returns exact match when defined", () => {
      expect(getRequiredPermsForPath("/dashboard")).toEqual([]);
      expect(getRequiredPermsForPath("/settings")).toEqual([
        "audit.view",
        "user.manage",
        "role.manage",
        "settings.view",
      ]);
      expect(getRequiredPermsForPath("/sales-online-orders")).toEqual(["sale.view"]);
    });
    it("returns prefix match for nested routes", () => {
      expect(getRequiredPermsForPath("/sales-online-orders/edit/123")).toEqual([
        "sale.view",
        "sale.edit",
      ]);
      expect(getRequiredPermsForPath("/settings/admin")).toEqual([
        "user.manage",
        "role.manage",
        "audit.view",
      ]);
      expect(getRequiredPermsForPath("/purchases/edit/abc")).toEqual(["purchase.edit"]);
    });
    it("returns longest prefix match", () => {
      expect(getRequiredPermsForPath("/settings/activity-log")).toEqual(["audit.view"]);
    });
    it("returns [] for unknown path (deny by default)", () => {
      const perms = getRequiredPermsForPath("/unknown/page");
      expect(Array.isArray(perms)).toBe(true);
      expect(perms?.length).toBe(0);
    });
  });

  describe("ROUTE_PERMISSIONS coverage", () => {
    it("has entries for sensitive routes", () => {
      expect(ROUTE_PERMISSIONS["/inventory/print-qr-code"]).toEqual(["inventory.print_labels"]);
      expect(ROUTE_PERMISSIONS["/stock/adjustment"]).toContain("stock_adjustment.view");
      expect(ROUTE_PERMISSIONS["/settings/admin"]).toEqual(
        expect.arrayContaining(["user.manage", "role.manage", "audit.view"])
      );
      expect(ROUTE_PERMISSIONS["/sales-return"]).toEqual(
        expect.arrayContaining(["return.create", "refund.issue", "sale.view"])
      );
    });
  });

  describe("PUBLIC_PATHS", () => {
    it("includes only unauthenticated paths", () => {
      expect(PUBLIC_PATHS).toContain("/");
      expect(PUBLIC_PATHS).toContain("/login");
      expect(PUBLIC_PATHS).not.toContain("/dashboard");
    });
  });
});

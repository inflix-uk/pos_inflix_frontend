import { parseQrPayload, buildQrPayload } from "../qrPayload";

describe("qrPayload", () => {
  describe("parseQrPayload", () => {
    it("parses POSv1|product|id", () => {
      expect(parseQrPayload("POSv1|product|abc123")).toEqual({ type: "product", id: "abc123" });
    });
    it("parses POSv1|serial|imei", () => {
      expect(parseQrPayload("POSv1|serial|351234567890123")).toEqual({ type: "serial", id: "351234567890123" });
    });
    it("parses POSv1|location|id", () => {
      expect(parseQrPayload("POSv1|location|loc456")).toEqual({ type: "location", id: "loc456" });
    });
    it("parses legacy POS|product|id", () => {
      expect(parseQrPayload("POS|product|xyz")).toEqual({ type: "product", id: "xyz" });
    });
    it("returns null for empty or invalid", () => {
      expect(parseQrPayload("")).toBeNull();
      expect(parseQrPayload(null as unknown as string)).toBeNull();
      expect(parseQrPayload("invalid")).toBeNull();
      expect(parseQrPayload("POSv1|unknown|id")).toBeNull();
      expect(parseQrPayload("POSv1|product|")).toBeNull();
    });
  });

  describe("buildQrPayload", () => {
    it("builds product payload", () => {
      expect(buildQrPayload("product", "abc")).toBe("POSv1|product|abc");
    });
    it("builds serial payload", () => {
      expect(buildQrPayload("serial", "imei123")).toBe("POSv1|serial|imei123");
    });
    it("returns empty string for empty id", () => {
      expect(buildQrPayload("product", "")).toBe("");
    });
  });
});

import { describe, expect, it } from "vitest";
import { instrumentDetailHref, resolveInstrumentRouteParam } from "./routes";

describe("instrument detail routing", () => {
  it.each(["US-XNAS:AAPL", "IE-XETR:VWCE", "FMP:NASDAQ:AAPL", "FMP:XETRA:BRK%2FB"]) ("round trips %s without changing identity", (id) => {
    const segment = instrumentDetailHref(id).split("/").at(-1)!;
    expect(resolveInstrumentRouteParam(segment)).toBe(id);
    expect(resolveInstrumentRouteParam(decodeURIComponent(segment))).toBe(id);
  });
  it.each(["", ".", "..", "A/B", "A\\B", "A?B", "FMP:NASDAQ:", "FMP::AAPL", "FMP:NASDAQ:A%ZZ", "FMP:A:B:C", "A\nB"]) ("rejects malformed identity %s", (id) => {
    expect(resolveInstrumentRouteParam(id)).toBeNull();
    expect(() => instrumentDetailHref(id)).toThrow();
  });
  it("accepts a valid ID even when its URL-encoded form is over 100 characters", () => {
    const id = `FMP:NASDAQ:${"A".repeat(75)}`;
    expect(resolveInstrumentRouteParam(instrumentDetailHref(id).split("/").at(-1))).toBe(id);
  });
});

import { describe, expect, it } from "vitest";
import { periodReturnLabel, periodStatistics } from "./period-statistics";

const point = (date: string, close: number) => ({ date, close });

describe("selected-period split-adjusted price statistics", () => {
  it("uses first and last available observations and includes the period high and low", () => {
    const result = periodStatistics([point("2026-01-05", 100), point("2026-01-08", 95.2), point("2026-01-12", 120), point("2026-01-16", 114)]);
    expect(result).toMatchObject({ start: point("2026-01-05", 100), end: point("2026-01-16", 114), change: 14, low: 95.2, high: 120, observationCount: 4 });
    expect(result?.returnPercent).toBeCloseTo(14);
  });
  it("reports negative and flat price returns", () => {
    expect(periodStatistics([point("2026-01-05", 100), point("2026-01-16", 80)])?.returnPercent).toBeCloseTo(-20);
    expect(periodStatistics([point("2026-01-05", 100), point("2026-01-16", 100)])).toMatchObject({ change: 0, returnPercent: 0, low: 100, high: 100 });
  });
  it("does not invent a return from one observation or an unavailable series", () => {
    expect(periodStatistics([point("2026-01-16", 114)])).toMatchObject({ start: point("2026-01-16", 114), end: point("2026-01-16", 114), change: null, returnPercent: null, low: 114, high: 114 });
    expect(periodStatistics([])).toBeNull();
    expect(periodStatistics(null)).toBeNull();
    expect(periodStatistics(undefined)).toBeNull();
  });
  it("rejects malformed, non-positive, and out-of-order observations", () => {
    expect(periodStatistics([point("2026-01-05", 0), point("2026-01-16", 114)])).toBeNull();
    expect(periodStatistics([point("2026-01-05", Number.NaN)])).toBeNull();
    expect(periodStatistics([point("bad", 100)])).toBeNull();
    expect(periodStatistics([point("2026-02-30", 100)])).toBeNull();
    expect(periodStatistics([point("2026-01-16", 114), point("2026-01-05", 100)])).toBeNull();
  });
  it("exposes only price statistics with no total-return field", () => {
    expect(Object.keys(periodStatistics([point("2026-01-05", 100), point("2026-01-16", 114)]) ?? {})).toEqual(["start", "end", "change", "returnPercent", "low", "high", "observationCount"]);
    expect(periodReturnLabel("1M")).toBe("1M price return");
    expect(periodReturnLabel("1M")).not.toMatch(/total return/i);
  });
});

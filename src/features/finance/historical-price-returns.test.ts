import { describe, expect, it } from "vitest";
import { adjustmentPolicies, type HistoricalPriceRequest, type HistoricalSeries } from "@/features/market-data/contracts";
import { historicalPriceReturns } from "./historical-price-returns";
import { simpleReturn } from "./returns";

function history(closes = [100, 103, 101, 106]): HistoricalSeries {
  return {
    instrumentId: "sample:returns", currency: "CZK", interval: "daily", timeZone: "UTC",
    adjustment: adjustmentPolicies["split-adjusted"],
    points: closes.map((close, index) => ({ date: ["2026-01-08", "2026-01-09", "2026-01-12", "2026-01-13"][index], open: close, high: close, low: close, close, adjustedClose: 999 })),
    provenance: {
      provider: "educational", dataset: "returns", dataKind: "synthetic", isDeterministic: true, isDemo: true,
      observedAt: "2026-01-13T00:00:00.000Z", retrievedAt: "2026-01-13T00:00:00.000Z",
      adjustmentMode: "split-adjusted", completeness: "partial",
    },
  };
}
const request: HistoricalPriceRequest = {
  instrumentId: "sample:returns", startDate: "2026-01-01", endDate: "2026-01-31",
  interval: "daily", timeZone: "UTC", adjustment: adjustmentPolicies["split-adjusted"],
};

function invalid(series: HistoricalSeries, reason: string, index?: number) {
  const result = historicalPriceReturns(series);
  expect(result).toMatchObject({ status: "invalid-data", reason, ...(index === undefined ? {} : { index }) });
  expect(result).not.toHaveProperty("observations");
}

describe("historicalPriceReturns", () => {
  it("preserves exact adjacency, N−1 unrounded decimal returns and source metadata without mutating history", () => {
    const series = history();
    const before = structuredClone(series);
    const result = historicalPriceReturns(series, request);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("Expected valid history");
    expect(result.observations).toEqual(series.points.slice(1).map((end, index) => ({
      startDate: series.points[index].date, endDate: end.date,
      startClose: series.points[index].close, endClose: end.close,
      returnValue: simpleReturn(series.points[index].close, end.close),
      elapsedCalendarDays: index === 1 ? 3 : 1, gapClassification: index === 1 ? "unknown" : "none",
    })));
    expect(result.observations.map((point) => point.returnValue)).toEqual([
      expect.closeTo(0.03, 14), expect.closeTo(-0.01941747572815533, 14), expect.closeTo(0.04950495049504955, 14),
    ]);
    expect(result.metadata).toEqual({
      instrumentId: series.instrumentId, currency: series.currency, interval: series.interval, timeZone: series.timeZone,
      adjustment: series.adjustment, provenance: series.provenance, request,
      actualRange: { startDate: "2026-01-08", endDate: "2026-01-13" }, observationCount: 4, returnCount: 3,
    });
    expect(series).toEqual(before);
  });

  it("produces one real zero for two flat observed prices, never a synthetic first zero", () => {
    expect(historicalPriceReturns(history([100, 100]))).toMatchObject({
      status: "ok", observations: [{ startDate: "2026-01-08", endDate: "2026-01-09", returnValue: 0 }],
      metadata: { observationCount: 2, returnCount: 1, request: null },
    });
    expect(simpleReturn(100, 0)).toBe(-1); // Educational numeric semantics remain separate.
  });

  it.each([{ closes: [] }, { closes: [100] }])("reports insufficient valid history for $closes", ({ closes }) => {
    expect(historicalPriceReturns(history(closes))).toMatchObject({
      status: "insufficient-data", observations: [], metadata: {
        observationCount: closes.length, returnCount: 0,
        actualRange: closes.length ? { startDate: "2026-01-08", endDate: "2026-01-08" } : null,
      },
    });
  });

  it.each([null, undefined, "", "103", NaN, Infinity, -Infinity, -1, 0])("rejects invalid closes (%s) without partial results", (close) => {
    const series = history();
    series.points[2].close = close as number;
    invalid(series, "invalid-close", 2);
  });

  it("validates even a single observation before declaring insufficiency", () => {
    invalid(history([0]), "invalid-close", 0);
  });

  it.each(["2026-02-30", "2026-01-08T00:00:00.000Z", "2026-1-08", "not-a-date", "", undefined])("rejects invalid/noncanonical dates (%s)", (date) => {
    const series = history();
    series.points[1].date = date as string;
    invalid(series, "invalid-date", 1);
  });

  it("rejects duplicates and unsorted dates without repairing them", () => {
    const duplicate = history();
    duplicate.points[2].date = duplicate.points[1].date;
    invalid(duplicate, "duplicate-date", 2);
    const unsorted = history();
    unsorted.points[2].date = "2026-01-07";
    invalid(unsorted, "unsorted-date", 2);
  });

  it("retains a multi-day observed gap even when the source claims completeness", () => {
    const series = history();
    series.provenance.completeness = "complete";
    const result = historicalPriceReturns(series);
    expect(result).toMatchObject({ status: "ok", metadata: { provenance: { completeness: "complete" }, returnCount: 3 } });
    if (result.status !== "ok") throw new Error("Expected valid history");
    expect(result.observations[1]).toMatchObject({ startDate: "2026-01-09", endDate: "2026-01-12", elapsedCalendarDays: 3, gapClassification: "unknown" });
  });

  it("counts UTC calendar days over a month/leap-day boundary", () => {
    const series = history([100, 103]);
    series.points[0].date = "2024-02-28";
    series.points[1].date = "2024-03-01";
    expect(historicalPriceReturns(series)).toMatchObject({ status: "ok", observations: [{ elapsedCalendarDays: 2, gapClassification: "unknown" }] });
  });

  it("rejects a non-finite derived return from finite positive endpoints", () => {
    invalid(history([Number.MIN_VALUE, Number.MAX_VALUE]), "non-finite-return", 1);
  });

  it.each([adjustmentPolicies.raw, adjustmentPolicies["total-return"]])("rejects unsupported adjustment $mode", (adjustment) => {
    invalid({ ...history(), adjustment }, "unsupported-basis");
  });

  it("rejects contradictory adjustment metadata and unsupported temporal basis", () => {
    const series = history();
    invalid({ ...series, provenance: { ...series.provenance, adjustmentMode: "raw" } }, "incompatible-metadata");
    invalid({ ...series, adjustment: { ...series.adjustment, dividendTreatment: "reinvested" } } as HistoricalSeries, "unsupported-basis");
    invalid({ ...series, interval: "weekly" } as unknown as HistoricalSeries, "unsupported-basis");
    invalid({ ...series, timeZone: "Europe/Prague" } as unknown as HistoricalSeries, "unsupported-basis");
  });

  it("validates optional canonical request identity, basis and enclosing range", () => {
    const series = history();
    for (const mismatch of [{ instrumentId: "other" }, { adjustment: adjustmentPolicies.raw }, { interval: "weekly" }, { timeZone: "Europe/Prague" }]) {
      expect(historicalPriceReturns(series, { ...request, ...mismatch } as HistoricalPriceRequest)).toMatchObject({ status: "invalid-data", reason: "incompatible-metadata" });
    }
    for (const range of [{ startDate: "2026-02-30" }, { startDate: "2026-02-01" }]) {
      expect(historicalPriceReturns(series, { ...request, ...range })).toMatchObject({ status: "invalid-data", reason: "invalid-request-range" });
    }
    expect(historicalPriceReturns(series, { ...request, startDate: "2026-01-09" })).toMatchObject({ status: "invalid-data", reason: "outside-request-range", index: 0 });
  });
});

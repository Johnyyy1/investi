import { describe, expect, it } from "vitest";
import { aggregateCandles, candleInterval, chartTone, hasCandlestickData, viewportPoints } from "./price-chart-presentation";

const candles = [
  { date: "2026-01-05", open: 100, high: 104, low: 99, close: 103 },
  { date: "2026-01-06", open: 103, high: 105, low: 98, close: 99 },
];

describe("instrument chart presentation", () => {
  it("chooses semantic line colors from the selected period return", () => {
    expect(chartTone(3.2)).toBe("positive");
    expect(chartTone(-0.1)).toBe("negative");
    expect(chartTone(0)).toBe("neutral");
    expect(chartTone(null)).toBe("neutral");
  });
  it("only enables candles for valid daily OHLC, without inventing missing values", () => {
    expect(hasCandlestickData(candles)).toBe(true);
    expect(hasCandlestickData(candles.map(({ date, close }) => ({ date, close })))).toBe(false);
    expect(hasCandlestickData([candles[0]])).toBe(false);
    expect(hasCandlestickData([{ ...candles[0], low: 104 }, candles[1]])).toBe(false);
    expect(hasCandlestickData([{ ...candles[0], open: Number.NaN }, candles[1]])).toBe(false);
    expect(hasCandlestickData(candles.map((point) => ({ ...point, open: point.close, high: point.close, low: point.close })))).toBe(false);
  });
  it("uses a centralized range policy and coarsens only very long Max histories", () => {
    for (const [range, expected] of [["1M", "daily"], ["3M", "daily"], ["6M", "weekly"], ["YTD", "weekly"], ["1Y", "weekly"], ["5Y", "monthly"], ["Max", "monthly"]] as const) {
      expect(candleInterval(range, candles)).toBe(expected);
    }
    expect(candleInterval("3M", Array.from({ length: 91 }, (_, index) => ({ date: `2026-01-${index}`, close: 100 })))).toBe("weekly");
    expect(candleInterval("Max", [{ date: "2000-01-03", close: 100 }, { date: "2026-01-05", close: 100 }])).toBe("quarterly");
  });
  it("aggregates UTC Monday–Sunday weeks using first open, extrema and last close", () => {
    const bars = aggregateCandles([
      { date: "2025-12-29", open: 10, high: 12, low: 9, close: 11 },
      { date: "2025-12-31", open: 11, high: 15, low: 10, close: 14 },
      { date: "2026-01-02", open: 14, high: 14, low: 7, close: 8 },
      { date: "2026-01-05", open: 8, high: 9, low: 6, close: 7 },
    ], "weekly");
    expect(bars).toEqual([
      { date: "2025-12-29", periodStart: "2025-12-29", periodEnd: "2026-01-04", open: 10, high: 15, low: 7, close: 8, observationCount: 3 },
      { date: "2026-01-05", periodStart: "2026-01-05", periodEnd: "2026-01-11", open: 8, high: 9, low: 6, close: 7, observationCount: 1 },
    ]);
  });
  it("aggregates calendar months without synthetic empty bars or forward fills", () => {
    const bars = aggregateCandles([
      { date: "2025-01-02", open: 10, high: 12, low: 9, close: 11 },
      { date: "2025-01-31", open: 11, high: 15, low: 8, close: 14 },
      { date: "2025-03-03", open: 20, high: 21, low: 19, close: 20 },
      { date: "2026-01-05", open: 30, high: 32, low: 29, close: 31 },
    ], "monthly");
    expect(bars.map(({ periodStart }) => periodStart)).toEqual(["2025-01-01", "2025-03-01", "2026-01-01"]);
    expect(bars[0]).toMatchObject({ open: 10, high: 15, low: 8, close: 14, periodEnd: "2025-01-31" });
    expect(bars[1]).toMatchObject({ open: 20, high: 21, low: 19, close: 20, periodEnd: "2025-03-31" });
    expect(bars[2]).toMatchObject({ open: 30, high: 32, low: 29, close: 31 });
  });
  it("covers the full 1Y and 5Y/Max selected horizons without a recent-tail slice", () => {
    const daily = Array.from({ length: 365 }, (_, index) => ({ ...candles[index % 2], date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10) }));
    const yearly = aggregateCandles(daily, candleInterval("1Y", daily));
    expect(yearly[0].observationCount).toBeGreaterThan(0);
    expect(yearly[0].periodStart).toBe("2024-12-30");
    expect(yearly.at(-1)?.periodEnd).toBe("2026-01-04");
    const long = Array.from({ length: 240 }, (_, index) => ({ ...candles[index % 2], date: new Date(Date.UTC(2000, index, 3)).toISOString().slice(0, 10) }));
    const fiveYear = aggregateCandles(long.slice(-60), candleInterval("5Y", long.slice(-60)));
    const max = aggregateCandles(long, candleInterval("Max", long));
    expect(fiveYear).toHaveLength(60);
    expect(fiveYear[0].periodStart).toBe("2015-01-01");
    expect(max[0].periodStart).toBe("2000-01-01");
    expect(max.at(-1)?.periodEnd).toBe("2019-12-31");
  });
  it("slices only the visual viewport, leaving source observations intact", () => {
    expect(viewportPoints(candles, 0, 1)).toEqual(candles);
    expect(viewportPoints(candles, 1, 1)).toEqual([candles[1]]);
    expect(candles).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import { equityMetricSignal, type EquityMetricId, type MetricSignal } from "./fundamentals-signals";

function expectSignals(id: EquityMetricId, cases: [number, MetricSignal][]) {
  for (const [value, expected] of cases) expect(equityMetricSignal(id, value).signal, `${id} at ${value}`).toBe(expected);
}

describe("equity fundamentals educational signals", () => {
  it("keeps valuation and scale neutral regardless of magnitude", () => {
    expectSignals("pe", [[9, "neutral"], [45, "neutral"]]);
    expectSignals("ps", [[0.4, "neutral"], [35, "neutral"]]);
    expectSignals("ev-ebitda", [[4, "neutral"], [40, "neutral"]]);
    for (const id of ["market-cap", "pb", "p-fcf", "revenue"] as const) expectSignals(id, [[0, "neutral"], [1_000_000_000, "neutral"]]);
    expectSignals("gross-margin", [[-0.01, "caution"], [0, "neutral"], [0.8, "neutral"]]);
  });

  it("applies broad profitability thresholds at exact boundaries", () => {
    for (const id of ["operating-margin", "roe"] as const) expectSignals(id, [[-0.01, "caution"], [0, "neutral"], [0.08, "neutral"], [0.1499, "neutral"], [0.15, "positive"], [0.2, "positive"]]);
    for (const id of ["net-margin", "roic"] as const) expectSignals(id, [[-0.01, "caution"], [0, "neutral"], [0.0999, "neutral"], [0.10, "positive"], [0.15, "positive"]]);
    expect(equityMetricSignal("roic", 0.348).context).toMatch(/10% educational reference/);
  });

  it("treats financial health as ranges, including negative debt and high liquidity", () => {
    expectSignals("debt-equity", [[-1, "neutral"], [0, "positive"], [0.3, "positive"], [0.5, "positive"], [0.5001, "neutral"], [1.2, "neutral"], [2, "neutral"], [2.0001, "caution"], [3, "caution"]]);
    expectSignals("current-ratio", [[0.8, "caution"], [0.9999, "caution"], [1, "neutral"], [1.2, "neutral"], [1.4999, "neutral"], [1.5, "positive"], [2, "positive"], [3, "positive"], [3.0001, "neutral"], [5, "neutral"]]);
    expectSignals("net-debt-ebitda", [[-0.4, "neutral"], [0, "positive"], [1, "positive"], [2, "positive"], [2.0001, "neutral"], [3, "neutral"], [4, "neutral"], [4.0001, "caution"], [5, "caution"]]);
    expect(equityMetricSignal("net-debt-ebitda", -0.4, undefined, true).signal).toBe("positive");
    expect(equityMetricSignal("current-ratio", 0.7).context).toMatch(/liabilities exceed current assets/);
  });

  it("flags negative fiscal amounts without coloring positive size or earnings", () => {
    expectSignals("revenue", [[-1, "caution"], [0, "neutral"], [100, "neutral"]]);
    for (const id of ["net-income", "fcf", "eps"] as const) expectSignals(id, [[-1, "caution"], [0, "neutral"], [100, "neutral"]]);
  });

  it("separates missing values and a meaningless P/E from caution", () => {
    expect(equityMetricSignal("roic", null).signal).toBe("unavailable");
    expect(equityMetricSignal("roic", Number.NaN).signal).toBe("unavailable");
    expect(equityMetricSignal("pe", null, "not-meaningful").signal).toBe("not-meaningful");
  });
});

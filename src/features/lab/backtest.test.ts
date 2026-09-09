import { describe, expect, it } from "vitest";
import { calculateBacktestMetrics, calculateCagr, calculateGrowthSeries, calculateMaxDrawdown, calculateVolatility, selectMonthlySample } from "./backtest";
import { syntheticMonthlyData } from "./sample-data";
describe("backtesting math", () => {
  it("CAGR reflects intervals, not number of observations", () => {
    expect(calculateCagr(100, 121, 2)).toBeCloseTo(0.1, 12);
    expect(calculateCagr(100, 0, 1)).toBe(-1);
    expect(calculateCagr(100, 81, 2)).toBeCloseTo(-0.1, 12);
  });
  it("drawdown includes the initial peak and can reach 100%", () => {
    expect(calculateMaxDrawdown([100, 80, 120, 90, 130])).toBeCloseTo(0.25);
    expect(calculateMaxDrawdown([100, 80, 0])).toBe(1);
    expect(calculateMaxDrawdown([100, 110, 120])).toBe(0);
  });
  it("uses sample volatility and explicit monthly annualization", () => {
    expect(calculateVolatility([0.1, -0.1], 12)).toBeCloseTo(0.4898979485566356, 12);
    expect(calculateVolatility([0.1, 0.1, 0.1], 12)).toBeCloseTo(0, 12);
  });
  it("compounds sequentially and preserves total loss", () => {
    expect(calculateGrowthSeries(100, [0.1, -0.1])).toEqual([100, 110.00000000000001, 99.00000000000001]);
    expect(calculateGrowthSeries(100, [-1, 0.5])).toEqual([100, 0, 0]);
  });
  it("known two-month metrics: +10%, −10%", () => {
    const result = calculateBacktestMetrics(100, [0.1, -0.1]);
    expect(result.finalValue).toBeCloseTo(99, 12);
    expect(result.cagr).toBeCloseTo(-0.058519850599, 10);
    expect(result.maxDrawdown).toBeCloseTo(0.1, 12);
  });
  it.each([0, -1, NaN, Infinity])("rejects starting amount %s", (value) => expect(() => calculateBacktestMetrics(value, [0.1, 0.2])).toThrow());
  it.each<[number[]]>([[[]], [[0.1]], [[NaN, 0.1]], [[Infinity, 0.1]], [[-1.01, 0.1]]])("rejects insufficient or invalid returns %j", (returns) => expect(() => calculateBacktestMetrics(100, returns)).toThrow());
  it("rejects invalid time, terminal values, observations and overflowing results", () => {
    expect(() => calculateCagr(100, -10, 1)).toThrow();
    expect(() => calculateCagr(100, 110, 0)).toThrow();
    expect(() => calculateMaxDrawdown([100, NaN])).toThrow();
    expect(() => calculateMaxDrawdown([100, -1])).toThrow();
    expect(() => calculateVolatility([0, 1], 0)).toThrow();
    expect(() => calculateGrowthSeries(1e308, [10, 10])).toThrow();
  });
});
describe("explicit, complete monthly fixture", () => {
  it("has 132 deterministic monthly samples and 133 growth observations", () => {
    const rows = selectMonthlySample(syntheticMonthlyData, 2015, 2025);
    expect(rows).toHaveLength(132);
    expect(calculateBacktestMetrics(100000, rows.map((row) => row.stocks)).values).toHaveLength(133);
    expect(selectMonthlySample(rows, 2020, 2020)).toHaveLength(12);
    expect(syntheticMonthlyData[62].stocks).toBe(-0.24);
  });
  it("rejects missing, duplicate, unordered, non-finite and incomplete data", () => {
    expect(() => selectMonthlySample(syntheticMonthlyData.slice(1), 2015, 2025)).toThrow();
    for (const data of [[...syntheticMonthlyData].reverse(), syntheticMonthlyData.map((row, i) => i === 1 ? syntheticMonthlyData[0] : row), syntheticMonthlyData.map((row, i) => i === 1 ? { ...row, bonds: NaN } : row)]) expect(() => selectMonthlySample(data, 2015, 2025)).toThrow();
    expect(() => selectMonthlySample(syntheticMonthlyData, 2025, 2015)).toThrow();
    expect(() => selectMonthlySample(syntheticMonthlyData, 2014, 2020)).toThrow();
  });
});

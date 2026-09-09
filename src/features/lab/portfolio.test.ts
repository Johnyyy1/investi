import { describe, expect, it } from "vitest";
import { portfolioScenario, rebalanceAllocation } from "./portfolio";
describe("Portfolio Lab uses the lesson's weighted return model", () => {
  it("shows each contribution, value change and largest category", () => {
    const result = portfolioScenario([0.6, 0.3, 0.1], [0.08, 0.02, 0], 100000);
    expect(result.returnValue).toBeCloseTo(0.054);
    expect(result.finalValue).toBeCloseTo(105400);
    expect(result.contributions).toEqual([0.048, 0.006, 0]);
    expect(result.largestWeight).toBe(0.6);
  });
  it("reallocates other sliders proportionally and handles a 100% concentration", () => {
    expect(rebalanceAllocation([60, 30, 10], 0, 100)).toEqual([100, 0, 0]);
    expect(rebalanceAllocation([100, 0, 0], 0, 60)).toEqual([60, 20, 20]);
    const mix = rebalanceAllocation([60, 30, 10], 0, 20);
    expect(mix).toEqual([20, 60, 20]);
    expect(portfolioScenario(mix.map((v) => v / 100), [-0.2, 0.02, 0], 100).returnValue).toBeCloseTo(-0.028);
  });
  it("keeps exact totals across repeated slider moves", () => {
    let weights = [60, 30, 10];
    for (let i = 0; i < 500; i++) {
      weights = rebalanceAllocation(weights, i % 3, (i * 17) % 101);
      expect(weights.reduce((sum, v) => sum + v, 0)).toBeCloseTo(100, 10);
      expect(weights.every((v) => v >= -1e-12 && v <= 100)).toBe(true);
    }
  });
  it("rejects invalid allocation, return, amount and overflow", () => {
    expect(() => portfolioScenario([0.2, 0.1], [0.1, 0.2], 100)).toThrow();
    expect(() => portfolioScenario([1], [-1.1], 100)).toThrow();
    expect(() => portfolioScenario([1], [NaN], 100)).toThrow();
    expect(() => portfolioScenario([1], [0.1], 0)).toThrow();
    expect(() => portfolioScenario([1], [10], 1e308)).toThrow();
    expect(() => rebalanceAllocation([60, 30, 10], 0, 101)).toThrow();
  });
});

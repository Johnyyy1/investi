import { describe, expect, it } from "vitest";
import { rebalanceAllocation } from "@/features/lab/portfolio";
import { getPortfolioShowcaseOutcome } from "./portfolio-showcase-model";

describe("Portfolio Lab marketing example", () => {
  it("matches the disclosed starting example", () => {
    const outcome = getPortfolioShowcaseOutcome([60, 30, 10]);

    expect(outcome.expectedReturn).toBeCloseTo(0.072);
    expect(outcome.lowerExample).toBeCloseTo(-0.12);
    expect(outcome.upperExample).toBeCloseTo(0.28);
  });

  it("uses the product rebalancing behavior and remains a valid portfolio", () => {
    const weights = rebalanceAllocation([60, 30, 10], 0, 70);

    expect(weights).toEqual([70, 22.5, 7.5]);
    expect(weights.reduce((total, weight) => total + weight, 0)).toBeCloseTo(100);
    expect(weights.every((weight) => weight >= 0 && weight <= 100)).toBe(true);
    expect(getPortfolioShowcaseOutcome(weights).lowerExample).toBeLessThan(0);
  });
});

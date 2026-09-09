import { describe, expect, it } from "vitest";
import { marketCapitalization, ownershipPercentage } from "./foundations";
import { compoundValue } from "./returns";
describe("beginner financial examples", () => {
  it("distinguishes fractions from percentages", () => {
    expect(ownershipPercentage(100, 1_000_000)).toBe(0.01);
    expect(ownershipPercentage(0, 100)).toBe(0);
    expect(ownershipPercentage(100, 100)).toBe(100);
    expect(ownershipPercentage(0.5, 100)).toBe(0.5);
  });
  it.each([[1, 0], [0, -1], [-1, 100], [101, 100], [NaN, 100], [Infinity, 100], [1, Infinity]])("rejects invalid ownership %s/%s", (owned, total) => expect(() => ownershipPercentage(owned, total)).toThrow());
  it("calculates market equity value", () => {
    expect(marketCapitalization(50, 1_000_000)).toBe(50_000_000);
    expect(marketCapitalization(0, 100)).toBe(0);
    expect(marketCapitalization(0.25, 100)).toBe(25);
  });
  it.each([[-1, 100], [50, 0], [50, -1], [Infinity, 100], [50, NaN], [NaN, 100], [50, Infinity], [Number.MAX_VALUE, 100]])("rejects invalid market cap %s × %s", (price, total) => expect(() => marketCapitalization(price, total)).toThrow());
  it("uses the existing compounding utility for growth, zero growth, and losses", () => {
    expect(compoundValue(10_000, Array(10).fill(0.05))).toBeCloseTo(16288.94626777, 6);
    expect(compoundValue(10_000, Array(10).fill(0))).toBe(10_000);
    expect(compoundValue(100, [0.05, 0.05])).toBeCloseTo(110.25);
    expect(compoundValue(10_000, [-0.1, -0.1])).toBeCloseTo(8100);
    expect(compoundValue(10_000, [-1, 0.05])).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { annualCoupon, bidAskSpread, drawdownFromPeak, marketCapitalization, ownershipPercentage, portfolioWeightedReturn, simpleBondCashflows, totalCouponPayments, validatePortfolioWeights } from "./foundations";
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
  it("illustrates fixed bond coupon cash flows without treating them as a return", () => {
    expect(annualCoupon(1_000, 0.05)).toBe(50);
    expect(totalCouponPayments(1_000, 0.05, 5)).toBe(250);
    expect(simpleBondCashflows(1_000, 0.05, 5)).toEqual({ annualCoupon: 50, totalCouponPayments: 250, principalAtMaturity: 1_000, totalCashReceived: 1_250 });
    expect(annualCoupon(1_000, 0)).toBe(0);
  });
  it.each([[0, 0.05, 5], [-1, 0.05, 5], [1_000, -0.01, 5], [1_000, 0.05, 0], [1_000, 0.05, -1], [Infinity, 0.05, 5], [1_000, Infinity, 5], [1_000, 0.05, NaN]])("rejects invalid simplified bond cash flows %s, %s, %s", (principal, rate, years) => expect(() => simpleBondCashflows(principal, rate, years)).toThrow());
  it("calculates a valid bid-ask spread", () => {
    expect(bidAskSpread(99, 100)).toBe(1);
    expect(bidAskSpread(49.8, 50)).toBeCloseTo(0.2);
    expect(bidAskSpread(100, 100)).toBe(0);
  });
  it.each([[100, 99], [-1, 100], [0, 0], [NaN, 1], [1, Infinity]])("rejects invalid bid and ask quotes %s, %s", (bid, ask) => expect(() => bidAskSpread(bid, ask)).toThrow());
  it("calculates drawdown from a peak and clamps values above that peak to zero", () => {
    expect(drawdownFromPeak(10_000, 7_500)).toBe(0.25);
    expect(drawdownFromPeak(10_000, 10_000)).toBe(0);
    expect(drawdownFromPeak(10_000, 12_000)).toBe(0);
    expect(drawdownFromPeak(3, 2)).toBeCloseTo(1 / 3);
  });
  it.each([[0, 0], [-1, 0], [100, -1], [Infinity, 100], [100, NaN]])("rejects invalid drawdown values %s, %s", (peak, current) => expect(() => drawdownFromPeak(peak, current)).toThrow());
  it("validates portfolio weights with floating-point tolerance", () => {
    expect(validatePortfolioWeights([0.6, 0.3, 0.1])).toBe(true);
    expect(validatePortfolioWeights([0.1, 0.2, 0.7])).toBe(true);
    expect(validatePortfolioWeights([0.1 + 0.2, 0.7])).toBe(true);
  });
  it.each([
    [[0.6, 0.3]],
    [[0.6, 0.3, 0.100001]],
    [[-0.1, 0.5, 0.6]],
    [[1.1, 0]],
    [[NaN, 1]],
    [[Infinity, 0]],
    [[]],
  ])("rejects invalid portfolio weights %j", (weights) => expect(() => validatePortfolioWeights(weights)).toThrow());
  it("calculates unrounded weighted one-period returns", () => {
    expect(portfolioWeightedReturn([0.6, 0.3, 0.1], [0.1, 0.02, 0])).toBeCloseTo(0.066, 12);
    expect(portfolioWeightedReturn([0.5, 0.5], [0.1, 0])).toBeCloseTo(0.05, 12);
    expect(portfolioWeightedReturn([0.25, 0.25, 0.25, 0.25], [-0.4, 0, 0, 0])).toBeCloseTo(-0.1, 12);
    expect(portfolioWeightedReturn([0.1, 0.2, 0.7], [-0.123456789, 0.031415926, 0.001234567])).toBeCloseTo(-0.0051982968, 12);
  });
  it("accepts negative asset returns and rejects mismatched or non-finite returns", () => {
    expect(portfolioWeightedReturn([1], [-0.4])).toBe(-0.4);
    expect(() => portfolioWeightedReturn([0.5, 0.5], [0.1])).toThrow();
    expect(() => portfolioWeightedReturn([0.5, 0.5], [0.1, NaN])).toThrow();
  });
});

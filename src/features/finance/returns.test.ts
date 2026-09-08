import { describe, expect, it } from "vitest";
import { FinancialInputError, absoluteChange, consecutiveSimpleReturns, simpleReturn } from "./returns";

describe("simpleReturn", () => {
  it.each([
    [100, 110, 0.1],
    [100, 90, -0.1],
    [80, 92, 0.15],
    [50, 55, 0.1],
    [200, 210, 0.05],
    [12.5, 13.125, 0.05],
    [100, 100, 0],
  ])("calculates the unrounded return for %d to %d", (start, end, expected) => {
    expect(simpleReturn(start, end)).toBeCloseTo(expected, 12);
  });

  it("rejects zero and negative starting prices", () => {
    expect(() => simpleReturn(0, 10)).toThrow(FinancialInputError);
    expect(() => simpleReturn(-10, 5)).toThrow(FinancialInputError);
  });

  it("rejects a negative ending price", () => {
    expect(() => simpleReturn(10, -1)).toThrow(FinancialInputError);
  });
});

describe("absoluteChange", () => {
  it("preserves decimal precision before presentation rounding", () => {
    expect(absoluteChange(10.1, 10.35)).toBeCloseTo(0.25, 12);
  });

  it("calculates an unchanged price as zero", () => {
    expect(absoluteChange(100, 100)).toBe(0);
  });
});

describe("consecutiveSimpleReturns", () => {
  it("calculates each period from the immediately previous price", () => {
    const returns = consecutiveSimpleReturns([100, 105, 102, 108]);
    expect(returns[0]).toBeCloseTo(0.05, 12);
    expect(returns[1]).toBeCloseTo(-0.0285714285714286, 12);
    expect(returns[2]).toBeCloseTo(0.0588235294117647, 12);
  });

  it("supports decimals and unchanged prices", () => {
    expect(consecutiveSimpleReturns([10.5, 10.5, 10.75])).toEqual([0, expect.closeTo(0.0238095238095238, 12)]);
  });

  it("rejects incomplete and invalid series", () => {
    expect(() => consecutiveSimpleReturns([])).toThrow(FinancialInputError);
    expect(() => consecutiveSimpleReturns([100])).toThrow(FinancialInputError);
    expect(() => consecutiveSimpleReturns([100, 0, 10])).toThrow(FinancialInputError);
    expect(() => consecutiveSimpleReturns([100, -10])).toThrow(FinancialInputError);
  });
});

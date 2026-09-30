import { describe, expect, it } from "vitest";
import { FinancialInputError, absoluteChange, compoundPeriods, compoundValue, consecutiveSimpleReturns, cumulativeReturn, recoveryReturn, simpleReturn, logReturn, simpleReturnFromLog } from "./returns";

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

  it("derives N−1 unrounded returns without inserting a zero for the first observation", () => {
    const returns = consecutiveSimpleReturns([100, 103, 101, 106]);
    expect(returns).toHaveLength(3);
    expect(returns).toEqual([simpleReturn(100, 103), simpleReturn(103, 101), simpleReturn(101, 106)]);
    expect(returns[1]).not.toBe(-0.0194);
    expect(consecutiveSimpleReturns([100, 100])).toEqual([0]);
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

describe("compounding", () => {
  it.each([
    [[0.2, -0.2], -0.04],
    [[0.1, 0.1], 0.21],
    [[0.1, -0.1], -0.01],
    [[], 0],
  ])("calculates cumulative return for %j", (returns, expected) => {
    expect(cumulativeReturn(returns)).toBeCloseTo(expected, 12);
  });

  it("calculates an ending value without rounding period returns", () => {
    expect(compoundValue(10000, [0.2, -0.2])).toBeCloseTo(9600, 12);
    expect(compoundValue(100, [-1])).toBe(0);
    expect(compoundValue(12.5, [0.0125, -0.0075])).toBeCloseTo(12.561328125, 12);
  });

  it("keeps a wiped-out value at zero in later periods", () => {
    expect(compoundPeriods(100, [-1, 0.2]).map((period) => period.endValue)).toEqual([0, 0]);
  });

  it("rejects a return below -100%", () => {
    expect(() => cumulativeReturn([-1.01])).toThrow(FinancialInputError);
    expect(() => compoundValue(100, [-1.01])).toThrow(FinancialInputError);
  });

  it("calculates required recovery without treating loss as a negative return", () => {
    expect(recoveryReturn(0.1)).toBeCloseTo(0.111111111111111, 12);
    expect(recoveryReturn(0.5)).toBe(1);
    expect(() => recoveryReturn(1)).toThrow(FinancialInputError);
  });
});

describe("log returns", () => {
  it.each([[100, 110], [100, 99], [100, 100], [0.1, 0.25], [0.25, 1.3333]])("calculates and reverses %d → %d without presentation rounding", (start, end) => {
    const value = logReturn(start, end);
    expect(value).toBeCloseTo(Math.log(end / start), 12);
    expect(simpleReturnFromLog(value)).toBeCloseTo(simpleReturn(start, end), 12);
  });

  it.each([[100, 110, 99], [100, 105, 110]])("adds consecutive logs for %j", (start, middle, end) => {
    const sum = logReturn(start, middle) + logReturn(middle, end);
    expect(sum).toBeCloseTo(logReturn(start, end), 12);
    expect(simpleReturnFromLog(sum)).toBeCloseTo(simpleReturn(start, end), 12);
  });

  it("keeps small returns close without treating the two definitions as equal", () => {
    const value = logReturn(100, 100.2);
    expect(value).toBeCloseTo(0.001998002662673, 14);
    expect(value).not.toBe(simpleReturn(100, 100.2));
    expect(simpleReturnFromLog(1e-12)).toBeCloseTo(1.0000000000005e-12, 26);
    expect(logReturn(100, 100)).toBe(0);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])("rejects invalid prices %s in either position", (price) => {
    expect(() => logReturn(price, 100)).toThrow(FinancialInputError);
    expect(() => logReturn(100, price)).toThrow(FinancialInputError);
  });

  it("handles extreme positive price ratios without emitting infinity", () => {
    expect(logReturn(Number.MIN_VALUE, Number.MAX_VALUE)).toBeCloseTo(Math.log(Number.MAX_VALUE) - Math.log(Number.MIN_VALUE), 12);
    expect(logReturn(Number.MAX_VALUE, Number.MIN_VALUE)).toBeCloseTo(Math.log(Number.MIN_VALUE) - Math.log(Number.MAX_VALUE), 12);
  });

  it.each([NaN, Infinity, -Infinity, 1000, -1000])("rejects invalid or unrepresentable inverse returns %s", (value) => {
    expect(() => simpleReturnFromLog(value)).toThrow(FinancialInputError);
  });
});

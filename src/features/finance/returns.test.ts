import { describe, expect, it } from "vitest";
import { FinancialInputError, absoluteChange, simpleReturn } from "./returns";

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

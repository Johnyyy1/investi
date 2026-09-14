import { describe, expect, it } from "vitest";
import { fxUnitsFromNumber, grossBaseMinor, parseQuantity, priceUnitsFromNumber, quantityToDecimal } from "./decimal";

describe("portfolio fixed-precision arithmetic", () => {
  it.each(["0.1", "0.25", "1.3333"])("round-trips fractional quantity %s", (quantity) => {
    expect(quantityToDecimal(parseQuantity(quantity))).toBe(quantity);
  });

  it("rounds non-round execution values to the nearest minor unit centrally", () => {
    expect(grossBaseMinor(parseQuantity("0.25"), priceUnitsFromNumber(114), fxUnitsFromNumber(22.75))).toBe(64_838n);
    expect(grossBaseMinor(parseQuantity("1.3333"), priceUnitsFromNumber(100.6), fxUnitsFromNumber(1))).toBe(13_413n);
  });

  it("rejects zero, negative and excess precision", () => {
    for (const value of ["0", "-1", "0.000000001", "nope"]) expect(() => parseQuantity(value)).toThrow();
  });
});

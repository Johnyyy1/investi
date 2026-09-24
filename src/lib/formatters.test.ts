import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatPercentage } from "./formatters";

describe("Czech-first presentation formatters", () => {
  it("formats CZK with Czech grouping and meaningful decimals", () => {
    expect(formatCurrency(5_000, "CZK")).toBe("5\u00a0000\u00a0Kč");
    expect(formatCurrency(12_345.67, "CZK", { maximumFractionDigits: 2 })).toBe("12\u00a0345,67\u00a0Kč");
  });

  it("formats percentages and dates for cs-CZ", () => {
    expect(formatPercentage(0.1246)).toBe("12,46\u00a0%");
    expect(formatDate("2026-09-24T00:00:00.000Z", { timeZone: "UTC" })).toBe("24. 9. 2026");
  });
});

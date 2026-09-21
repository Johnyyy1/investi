import { describe, expect, it } from "vitest";
import { formatMagnitude, formatMultiple, formatPercent, formatPerShare } from "./fundamentals-presentation";

describe("equity fundamentals formatting", () => {
  it("formats millions, billions, trillions and negative amounts", () => {
    expect(formatMagnitude(920_000_000, "USD")).toBe("920.0M USD");
    expect(formatMagnitude(391_000_000_000, "USD")).toBe("391.0B USD");
    expect(formatMagnitude(3_420_000_000_000, "USD")).toBe("3.4T USD");
    expect(formatMagnitude(-1_200_000_000, "USD")).toBe("-1.2B USD");
  });
  it("formats ratios, percentages, per-share figures, zero and unavailable values", () => {
    expect(formatMultiple(31.43)).toBe("31.4×");
    expect(formatMultiple(1.523, 2)).toBe("1.52×");
    expect(formatPercent(0.462)).toBe("46.2%");
    expect(formatPercent(-0.125)).toBe("-12.5%");
    expect(formatPerShare(6.42, "USD")).toBe("6.42 USD");
    expect(formatMultiple(0)).toBe("0.0×");
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatMagnitude(0, "USD")).toBe("0 USD");
    expect(formatMagnitude(null, "USD")).toBe("—");
    expect(formatMultiple(null)).toBe("—");
    expect(formatPerShare(null, "USD")).toBe("—");
  });
});

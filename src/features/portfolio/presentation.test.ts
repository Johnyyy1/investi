import { describe, expect, it } from "vitest";
import { gainLossState, portfolioDataSourceLabel, showSampleDataIndicator } from "./presentation";

describe("Portfolio Lab data-source presentation", () => {
  it("labels deterministic observations as sample data", () => {
    expect(portfolioDataSourceLabel("sample")).toBe("Sample data");
    expect(showSampleDataIndicator("sample")).toBe(true);
  });

  it("does not show the sample-data indicator for configured market data", () => {
    expect(portfolioDataSourceLabel("market")).toBe("Market observations");
    expect(showSampleDataIndicator("market")).toBe(false);
  });

  it("keeps positive, negative, neutral, and unavailable gain/loss states explicit", () => {
    expect(gainLossState("1250")).toBe("positive");
    expect(gainLossState("-1250")).toBe("negative");
    expect(gainLossState("0")).toBe("neutral");
    expect(gainLossState(null)).toBe("unavailable");
  });
});

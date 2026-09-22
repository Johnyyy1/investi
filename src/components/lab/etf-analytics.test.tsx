import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDeterministicMarketDataService } from "@/features/market-data/deterministic/service";
import { EtfAnalytics } from "./etf-analytics";

describe("ETF analytics presentation", () => {
  it("renders sample overview, weights, concentration, exposures, and keyboard-reachable explanations", async () => {
    const snapshot = await createDeterministicMarketDataService().getEtfAnalytics("IE-XETR:VWCE");
    const html = renderToStaticMarkup(<EtfAnalytics snapshot={snapshot} message={null} />);
    expect(html).toContain("Fund overview");
    expect(html).toContain("0.22%");
    expect(html).toContain("14.8B EUR");
    expect(html).toContain("NAV");
    expect(html).toContain("Top holdings");
    expect(html).toContain("Sample Atlas Devices");
    expect(html).toContain("Top 10 concentration");
    expect(html).toContain("23.1%");
    expect(html).toContain("12 · 3,600 reported total");
    expect(html).toContain("Sector exposure");
    expect(html).toContain("Country exposure");
    expect(html).toContain("aria-label=\"About Expense ratio\"");
    expect(html).toContain("Sample data");
    expect(html).not.toContain("P/E TTM");
    expect(html).not.toContain("Live holdings");
  });
  it("preserves successful sections when a dataset is unavailable and leaves no sample label in real mode", async () => {
    const sample = await createDeterministicMarketDataService().getEtfAnalytics("IE-XETR:VWCE");
    const partial = { ...sample, countries: null, unavailableDatasets: ["countries" as const], info: sample.info && { ...sample.info, isDeterministic: false }, holdings: sample.holdings && { ...sample.holdings, isDeterministic: false }, sectors: sample.sectors && { ...sample.sectors, isDeterministic: false } };
    const html = renderToStaticMarkup(<EtfAnalytics snapshot={partial} message={null} />);
    expect(html).toContain("Top holdings");
    expect(html).toContain("Country exposure");
    expect(html).toContain("Latest available data is unavailable");
    expect(html).not.toContain("Sample data");
    const failed = renderToStaticMarkup(<EtfAnalytics snapshot={null} message="Fund composition is unavailable right now." />);
    expect(failed).toContain("Fund composition is unavailable right now.");
    expect(failed).toContain("Top holdings");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDeterministicMarketDataService } from "@/features/market-data/deterministic/service";
import { EtfAnalytics } from "./etf-analytics";

describe("ETF analytics presentation", () => {
  it("renders sample overview, weights, concentration, exposures, and keyboard-reachable explanations", async () => {
    const snapshot = await createDeterministicMarketDataService().getEtfAnalytics("IE-XETR:VWCE");
    const html = renderToStaticMarkup(<EtfAnalytics snapshot={snapshot} message={null} />);
    expect(html).toContain("Přehled fondu");
    expect(html).toContain("0.22%");
    expect(html).toContain("14.8B EUR");
    expect(html).toContain("NAV");
    expect(html).toContain("Největší pozice");
    expect(html).toContain("Sample Atlas Devices");
    expect(html).toContain("Podíl 10 největších pozic");
    expect(html).toContain("23.1%");
    expect(html).toContain("12 · 3\u00a0600 celkem podle zdroje");
    expect(html).toContain("Sektorové zastoupení");
    expect(html).toContain("Geografické zastoupení");
    expect(html).toContain("aria-label=\"Více o položce Nákladovost\"");
    expect(html).toContain("Ukázková data");
    expect(html).not.toContain("P/E TTM");
    expect(html).not.toContain("Live holdings");
  });
  it("preserves successful sections when a dataset is unavailable and leaves no sample label in real mode", async () => {
    const sample = await createDeterministicMarketDataService().getEtfAnalytics("IE-XETR:VWCE");
    const partial = { ...sample, countries: null, unavailableDatasets: ["countries" as const], info: sample.info && { ...sample.info, isDeterministic: false }, holdings: sample.holdings && { ...sample.holdings, isDeterministic: false }, sectors: sample.sectors && { ...sample.sectors, isDeterministic: false } };
    const html = renderToStaticMarkup(<EtfAnalytics snapshot={partial} message={null} />);
    expect(html).toContain("Největší pozice");
    expect(html).toContain("Geografické zastoupení");
    expect(html).toContain("Poslední dostupná data tento zdroj neposkytuje");
    expect(html).not.toContain("Sample data");
    const failed = renderToStaticMarkup(<EtfAnalytics snapshot={null} message="Fund composition is unavailable right now." />);
    expect(failed).toContain("Fund composition is unavailable right now.");
    expect(failed).toContain("Největší pozice");
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EquityKeyMetrics } from "./equity-key-metrics";
import { createDeterministicMarketDataService } from "@/features/market-data/deterministic/service";

describe("equity key metrics fallback", () => {
  it("shows a neutral failure within the section without inventing figures", () => {
    const html = renderToStaticMarkup(createElement(EquityKeyMetrics, { snapshot: null, message: "Company metrics are unavailable right now.", quoteCurrency: "USD" }));
    expect(html).toContain("Key metrics");
    expect(html).toContain("Company metrics are unavailable right now.");
    expect(html).not.toContain("Market cap");
    expect(html).not.toContain("Sample data");
  });
  it("distinguishes a non-meaningful P/E from missing metrics and true zero", async () => {
    const sample = await createDeterministicMarketDataService().getEquityFundamentals("US-XNAS:NVDA");
    const snapshot = { ...sample, valuation: { ...sample.valuation, peTtm: null, peTtmStatus: "not-meaningful" as const }, financialHealth: { ...sample.financialHealth, debtToEquityTtm: 0 } };
    const html = renderToStaticMarkup(createElement(EquityKeyMetrics, { snapshot, message: null, quoteCurrency: "USD" }));
    expect(html).toContain("N/M");
    expect(html).toContain("0.00×");
    expect(html).toContain("—");
    expect(html).not.toContain("Sample data");
  });
  it("colors only interpreted values and includes a text explanation of signals", async () => {
    const snapshot = await createDeterministicMarketDataService().getEquityFundamentals("US-XNAS:AAPL");
    const html = renderToStaticMarkup(createElement(EquityKeyMetrics, { snapshot, message: null, quoteCurrency: "USD" }));
    expect(html).toMatch(/data-metric="pe" data-signal="neutral"[^>]*text-foreground/);
    expect(html).toMatch(/data-metric="market-cap" data-signal="neutral"[^>]*text-foreground/);
    expect(html).toMatch(/data-metric="operating-margin" data-signal="positive"[^>]*text-success-ink/);
    expect(html).toMatch(/data-metric="net-debt-ebitda" data-signal="positive"[^>]*text-success-ink/);
    expect(html).toMatch(/Broad reference: positive/);
    expect(html).toContain("not investment ratings");
    expect(html).toContain("Above Investi&#x27;s broad 10% educational reference.");
  });
  it("colors a negative net-debt ratio only when net cash is confirmed", async () => {
    const sample = await createDeterministicMarketDataService().getEquityFundamentals("US-XNAS:MSFT");
    const confirmed = renderToStaticMarkup(createElement(EquityKeyMetrics, { snapshot: sample, message: null, quoteCurrency: "USD" }));
    expect(confirmed).toMatch(/data-metric="net-debt-ebitda" data-signal="positive"/);
    const unconfirmed = renderToStaticMarkup(createElement(EquityKeyMetrics, { snapshot: { ...sample, financialHealth: { ...sample.financialHealth, netDebtToEbitdaIsNetCash: false } }, message: null, quoteCurrency: "USD" }));
    expect(unconfirmed).toMatch(/data-metric="net-debt-ebitda" data-signal="neutral"/);
  });
});

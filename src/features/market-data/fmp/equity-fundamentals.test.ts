import { describe, expect, it, vi } from "vitest";
import type { Instrument } from "../contracts";
import { FmpClient, type FmpFetch } from "./client";
import { FmpEquityFundamentalsProvider } from "./equity-fundamentals";

const instrument: Instrument = { instrumentId: "FMP:NASDAQ:AAPL", symbol: "AAPL", name: "Apple Inc.", assetType: "equity", exchangeMic: "XNAS", quoteCurrency: "USD", equityProfile: { sector: "Technology", industry: "Devices", country: "US", marketCap: 3_420_000_000_000 } };
const data: Record<string, unknown> = {
  "key-metrics-ttm": [{ symbol: "AAPL", evToEBITDATTM: 24.8, returnOnEquityTTM: 1.452, returnOnInvestedCapitalTTM: 0.631, netDebtToEBITDATTM: -0.3 }],
  "ratios-ttm": [{ symbol: "AAPL", priceToEarningsRatioTTM: 31.4, priceToSalesRatioTTM: 8.7, priceToBookRatioTTM: 42.1, priceToFreeCashFlowRatioTTM: 29.2, grossProfitMarginTTM: 0.462, operatingProfitMarginTTM: 0.317, netProfitMarginTTM: 0.264, debtToEquityRatioTTM: 0, currentRatioTTM: 0.9 }],
  "income-statement": [{ symbol: "AAPL", date: "2025-09-27", filingDate: "2025-10-31", period: "FY", reportedCurrency: "USD", revenue: 391_000_000_000, netIncome: 96_000_000_000, epsDiluted: 6.42 }],
  "cash-flow-statement": [{ symbol: "AAPL", date: "2025-09-27", filingDate: "2025-10-31", period: "FY", reportedCurrency: "USD", freeCashFlow: 108_000_000_000 }],
};

function provider(responses: Record<string, { status?: number; body: unknown }> = {}) {
  const fetchMock = vi.fn<FmpFetch>(async (input) => {
    const endpoint = new URL(input instanceof Request ? input.url : input.toString()).pathname.split("/").at(-1)!;
    const result = responses[endpoint] ?? { body: data[endpoint] };
    return Response.json(result.body, { status: result.status ?? 200 });
  });
  return { fetchMock, provider: new FmpEquityFundamentalsProvider(new FmpClient({ apiKey: "test-only", baseUrl: "https://fmp.test/stable", fetch: fetchMock }), () => new Date("2026-01-16T12:00:00.000Z")) };
}

describe("FMP equity fundamentals normalization", () => {
  it("maps only named TTM ratios and aligned fiscal-year statement amounts", async () => {
    const { provider: subject, fetchMock } = provider();
    const result = await subject.getEquityFundamentals(instrument);
    expect(result.company).toEqual({ sector: "Technology", industry: "Devices", country: "US" });
    expect(result.valuation).toMatchObject({ marketCap: 3_420_000_000_000, peTtm: 31.4, peTtmStatus: "available", evToEbitdaTtm: 24.8, priceToFcfTtm: 29.2 });
    expect(result.profitability).toMatchObject({ grossMarginTtm: 0.462, roeTtm: 1.452, roicTtm: 0.631 });
    expect(result.financialHealth).toMatchObject({ debtToEquityTtm: 0, netDebtToEbitdaTtm: -0.3, netDebtToEbitdaIsNetCash: false });
    expect(result.businessPerformance).toMatchObject({ fiscalYearEnd: "2025-09-27", reportingCurrency: "USD", revenueFy: 391_000_000_000, freeCashFlowFy: 108_000_000_000, dilutedEpsFy: 6.42 });
    expect(result.provenance.unavailableDatasets).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls.map(([url]) => new URL(url.toString()).pathname.split("/").at(-1)).sort()).toEqual(["cash-flow-statement", "income-statement", "key-metrics-ttm", "ratios-ttm"]);
  });
  it("keeps missing and malformed metrics unavailable while preserving true zero", async () => {
    const ratios = { ...(data["ratios-ttm"] as Record<string, unknown>[])[0], priceToEarningsRatioTTM: -12, grossProfitMarginTTM: "bad", priceToBookRatioTTM: null };
    const result = await provider({ "ratios-ttm": { body: [ratios] } }).provider.getEquityFundamentals(instrument);
    expect(result.valuation.peTtm).toBeNull();
    expect(result.valuation.peTtmStatus).toBe("not-meaningful");
    expect(result.valuation.pbTtm).toBeNull();
    expect(result.profitability.grossMarginTtm).toBeNull();
    expect(result.financialHealth.debtToEquityTtm).toBe(0);
  });
  it("preserves a negative debt-to-equity ratio for contextual presentation", async () => {
    const ratios = { ...(data["ratios-ttm"] as Record<string, unknown>[])[0], debtToEquityRatioTTM: -1.25 };
    const result = await provider({ "ratios-ttm": { body: [ratios] } }).provider.getEquityFundamentals(instrument);
    expect(result.financialHealth.debtToEquityTtm).toBe(-1.25);
  });
  it("isolates a mismatched symbol, malformed response, and provider entitlement or rate limit", async () => {
    const mismatch = await provider({ "ratios-ttm": { body: [{ symbol: "MSFT" }] } }).provider.getEquityFundamentals(instrument);
    expect(mismatch.valuation.peTtm).toBeNull();
    expect(mismatch.provenance.unavailableDatasets).toContain("ratios-ttm");
    const malformed = await provider({ "key-metrics-ttm": { body: { unexpected: true } } }).provider.getEquityFundamentals(instrument);
    expect(malformed.profitability.roicTtm).toBeNull();
    expect(malformed.provenance.unavailableDatasets).toContain("key-metrics-ttm");
    const limited = await provider({ "income-statement": { status: 402, body: { message: "restricted" } }, "cash-flow-statement": { status: 429, body: { message: "slow" } } }).provider.getEquityFundamentals(instrument);
    expect(limited.businessPerformance.revenueFy).toBeNull();
    expect(limited.provenance.unavailableDatasets).toEqual(["income-statement-fy", "cash-flow-statement-fy"]);
    const allDenied = Object.fromEntries(Object.keys(data).map((key) => [key, { status: 402, body: { message: "restricted" } }]));
    await expect(provider(allDenied).provider.getEquityFundamentals(instrument)).rejects.toMatchObject({ code: "ProviderConfiguration", context: expect.objectContaining({ reason: "plan-entitlement" }) });
  });
  it("does not mix fiscal years or show company ratios for an ETF", async () => {
    const cash = { ...(data["cash-flow-statement"] as Record<string, unknown>[])[0], date: "2024-09-28" };
    const mixed = await provider({ "cash-flow-statement": { body: [cash] } }).provider.getEquityFundamentals(instrument);
    expect(mixed.businessPerformance.freeCashFlowFy).toBeNull();
    expect(mixed.provenance.unavailableDatasets).toContain("cash-flow-statement-fy");
    await expect(provider().provider.getEquityFundamentals({ ...instrument, assetType: "etf" })).rejects.toMatchObject({ code: "UnsupportedInstrument" });
  });
});

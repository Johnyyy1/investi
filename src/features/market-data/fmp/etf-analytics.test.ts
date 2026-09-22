import { describe, expect, it, vi } from "vitest";
import type { Instrument } from "../contracts";
import { FmpClient, type FmpFetch } from "./client";
import { FmpEtfAnalyticsProvider, fmpPercent } from "./etf-analytics";

const instrument: Instrument = { instrumentId: "FMP:NYSE:SPY", symbol: "SPY", name: "SPDR S&P 500 ETF", assetType: "etf", exchangeMic: "XNYS", quoteCurrency: "USD" };
const samples: Record<string, unknown> = {
  info: [{ symbol: "SPY", expenseRatio: 0.09, assetsUnderManagement: 789_000_000_000, nav: 756.92, navCurrency: "USD", holdingsCount: 504, inceptionDate: "1993-01-22", updatedAt: "2026-06-06T07:46:00.054Z" }],
  holdings: [
    { symbol: "SPY", asset: "AAPL", name: "Apple", weightPercentage: 7.137, sharesNumber: 10, marketValue: 500, updatedAt: "2026-06-01 08:00:00" },
    { symbol: "SPY", asset: "MSFT", name: "Microsoft", weightPercentage: "6.2%", updatedAt: "2026-06-01 08:00:00" },
  ],
  "sector-weightings": [{ symbol: "SPY", sector: "Technology", weightPercentage: 25.4 }, { symbol: "SPY", sector: "Financials", weightPercentage: 15.2 }],
  "country-weightings": [{ symbol: "SPY", country: "United States", weightPercentage: 59.2 }, { symbol: "SPY", country: "Japan", weightPercentage: 6.1 }],
};
function setup(overrides: Record<string, { body: unknown; status?: number }> = {}) {
  const fetchMock = vi.fn<FmpFetch>(async (input) => {
    const path = new URL(input instanceof Request ? input.url : input.toString()).pathname.split("/").at(-1)!;
    const response = overrides[path] ?? { body: samples[path] };
    return Response.json(response.body, { status: response.status ?? 200 });
  });
  const provider = new FmpEtfAnalyticsProvider(new FmpClient({ apiKey: "test-only", baseUrl: "https://fmp.test/stable", fetch: fetchMock }), () => new Date("2026-09-21T10:00:00.000Z"));
  return { provider, fetchMock };
}
describe("FMP ETF analytics normalization", () => {
  it("uses percentage points once, preserves source timestamps, and never infers AUM currency or total rows", async () => {
    const { provider, fetchMock } = setup();
    const [info, holdings, sectors, countries] = await Promise.all([provider.getEtfInfo(instrument), provider.getEtfHoldings(instrument), provider.getEtfSectors(instrument), provider.getEtfCountries(instrument)]);
    expect(info.value).toMatchObject({ expenseRatio: .0009, assetsUnderManagement: 789_000_000_000, assetsCurrency: null, nav: 756.92, holdingsCount: 504 });
    expect(info.asOf).toBe("2026-06-06T07:46:00.054Z");
    expect(holdings.value.rows[0].weight).toBeCloseTo(.07137);
    expect(holdings.value.rows[1].weight).toBeCloseTo(.062);
    expect(holdings.value.totalCount).toBeNull();
    expect(holdings.asOf).toBe("2026-06-01T08:00:00.000Z");
    expect(sectors.value.map((row) => row.weight)).toEqual([.254, .152]);
    expect(countries.value[0].weight).toBeCloseTo(.592);
    expect(countries.value[1].weight).toBeCloseTo(.061);
    expect(fetchMock.mock.calls.map(([input]) => new URL(input.toString()).pathname)).toEqual(["/stable/etf/info", "/stable/etf/holdings", "/stable/etf/sector-weightings", "/stable/etf/country-weightings"]);
  });
  it("rejects ambiguous and out-of-range weights and drops malformed rows individually", async () => {
    expect(fmpPercent(.042)).toBe(.00042);
    expect(fmpPercent("4.2%")).toBe(.042);
    expect(fmpPercent("bad")).toBeNull();
    expect(fmpPercent(101)).toBeNull();
    const holdings = await setup({ holdings: { body: [...samples.holdings as object[], { symbol: "SPY", name: "Bad", weightPercentage: "oops" }, { symbol: "OTHER", name: "Wrong", weightPercentage: 3 }] } }).provider.getEtfHoldings(instrument);
    expect(holdings.value.rows).toHaveLength(2);
    expect(holdings.completeness).toBe("partial");
    const sectors = await setup({ "sector-weightings": { body: [{ symbol: "SPY", sector: "Technology", weightPercentage: 25.4 }, { symbol: "SPY", sector: "Invalid", weightPercentage: -3 }] } }).provider.getEtfSectors(instrument);
    expect(sectors.value).toEqual([{ name: "Technology", weight: .254 }]);
    expect(sectors.completeness).toBe("partial");
    await expect(setup({ "country-weightings": { body: [{ symbol: "SPY", country: "No weight" }] } }).provider.getEtfCountries(instrument)).rejects.toMatchObject({ code: "MalformedProviderResponse" });
  });
  it("keeps absent info fields null and maps entitlement and rate-limit failures", async () => {
    const info = await setup({ info: { body: [{ symbol: "SPY", expenseRatio: null, nav: "bad", holdingsCount: -1 }] } }).provider.getEtfInfo(instrument);
    expect(info.value).toMatchObject({ expenseRatio: null, assetsUnderManagement: null, nav: null, holdingsCount: null });
    await expect(setup({ holdings: { body: null, status: 402 } }).provider.getEtfHoldings(instrument)).rejects.toMatchObject({ code: "ProviderConfiguration", context: expect.objectContaining({ reason: "plan-entitlement" }) });
    await expect(setup({ "sector-weightings": { body: null, status: 429 } }).provider.getEtfSectors(instrument)).rejects.toMatchObject({ code: "RateLimited" });
    await expect(setup({ "country-weightings": { body: null, status: 503 } }).provider.getEtfCountries(instrument)).rejects.toMatchObject({ code: "ProviderUnavailable" });
    await expect(setup().provider.getEtfInfo({ ...instrument, assetType: "equity" })).rejects.toMatchObject({ code: "UnsupportedInstrument" });
  });
});

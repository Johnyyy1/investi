import { describe, expect, it, vi } from "vitest";
import { InMemoryMarketDataCache, defaultMarketDataCacheTtls } from "./cache";
import { DeterministicEtfAnalyticsProvider } from "./deterministic/etf-analytics";
import { createDeterministicMarketDataService } from "./deterministic/service";
import { MarketDataError } from "./errors";
import { etfConcentration } from "../instruments/etf-presentation";

const ETF = "IE-XETR:VWCE";
describe("ETF analytics service", () => {
  it("coalesces and caches each successful dataset independently with distinct TTLs", async () => {
    let now = Date.parse("2026-01-16T20:50:00.000Z");
    const source = new DeterministicEtfAnalyticsProvider(() => new Date(now));
    const provider = { providerId: source.providerId, getEtfInfo: vi.fn(source.getEtfInfo.bind(source)), getEtfHoldings: vi.fn(source.getEtfHoldings.bind(source)), getEtfSectors: vi.fn(source.getEtfSectors.bind(source)), getEtfCountries: vi.fn(source.getEtfCountries.bind(source)) };
    const service = createDeterministicMarketDataService({ clock: () => new Date(now), cache: new InMemoryMarketDataCache({ clock: () => now }), etfAnalyticsProvider: provider });
    const [first, second] = await Promise.all([service.getEtfAnalytics(ETF), service.getEtfAnalytics(ETF)]);
    expect(first).toEqual(second);
    expect(provider.getEtfInfo).toHaveBeenCalledTimes(1);
    expect(provider.getEtfHoldings).toHaveBeenCalledTimes(1);
    now += defaultMarketDataCacheTtls.etfHoldingsMilliseconds + 1;
    await service.getEtfAnalytics(ETF);
    expect(provider.getEtfInfo).toHaveBeenCalledTimes(1);
    expect(provider.getEtfHoldings).toHaveBeenCalledTimes(2);
    expect(provider.getEtfSectors).toHaveBeenCalledTimes(1);
    expect(defaultMarketDataCacheTtls).toMatchObject({ etfInfoMilliseconds: 86_400_000, etfHoldingsMilliseconds: 43_200_000, etfSectorsMilliseconds: 86_400_000, etfCountriesMilliseconds: 86_400_000 });
  });
  it("preserves partial data, does not cache failures, and rejects equity requests", async () => {
    const source = new DeterministicEtfAnalyticsProvider();
    let fail = true;
    const countries = vi.fn(async (instrument: Parameters<typeof source.getEtfCountries>[0]) => {
      if (fail) throw new MarketDataError("ProviderConfiguration", "Not entitled", { reason: "plan-entitlement" });
      return source.getEtfCountries(instrument);
    });
    const provider = { providerId: source.providerId, getEtfInfo: source.getEtfInfo.bind(source), getEtfHoldings: source.getEtfHoldings.bind(source), getEtfSectors: source.getEtfSectors.bind(source), getEtfCountries: countries };
    const service = createDeterministicMarketDataService({ cache: new InMemoryMarketDataCache(), etfAnalyticsProvider: provider });
    const partial = await service.getEtfAnalytics(ETF);
    expect(partial.countries).toBeNull();
    expect(partial.info).not.toBeNull();
    expect(partial.unavailableDatasets).toEqual(["countries"]);
    fail = false;
    const complete = await service.getEtfAnalytics(ETF);
    expect(complete.unavailableDatasets).toEqual([]);
    expect(countries).toHaveBeenCalledTimes(2);
    await expect(service.getEtfAnalytics("US-XNAS:AAPL")).rejects.toMatchObject({ code: "UnsupportedInstrument" });
  });
  it("keeps returned holdings distinct from provider-reported total and only computes a top ten with ten rows", async () => {
    const snapshot = await createDeterministicMarketDataService().getEtfAnalytics(ETF);
    expect(snapshot.info?.value.holdingsCount).toBe(3_600);
    expect(snapshot.holdings?.value.totalCount).toBeNull();
    const concentration = etfConcentration(snapshot.holdings!.value);
    expect(concentration).toMatchObject({ largestWeight: .041, returnedCount: 12, totalCount: null });
    expect(concentration.topTenWeight).toBeCloseTo(.231);
    expect(etfConcentration({ rows: snapshot.holdings!.value.rows.slice(0, 9), totalCount: null }).topTenWeight).toBeNull();
  });
  it("rejects provider weights that are still in percentage points", async () => {
    const source = new DeterministicEtfAnalyticsProvider();
    const service = createDeterministicMarketDataService({ etfAnalyticsProvider: {
      providerId: source.providerId,
      getEtfInfo: source.getEtfInfo.bind(source),
      getEtfHoldings: source.getEtfHoldings.bind(source),
      getEtfSectors: async (instrument) => ({ ...await source.getEtfSectors(instrument), value: [{ name: "Technology", weight: 25.2 }] }),
      getEtfCountries: source.getEtfCountries.bind(source),
    } });
    const snapshot = await service.getEtfAnalytics(ETF);
    expect(snapshot.sectors).toBeNull();
    expect(snapshot.unavailableDatasets).toContain("sectors");
    expect(snapshot.holdings).not.toBeNull();
  });
});

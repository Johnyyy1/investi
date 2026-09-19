import { describe, expect, it } from "vitest";

import { InMemoryMarketDataCache, NoopMarketDataCache } from "./cache";
import { adjustmentPolicies, type HistoricalPriceRequest, type InstrumentId } from "./contracts";
import { FIXTURE_RETRIEVED_AT } from "./deterministic/fixtures";
import { DeterministicMarketDataProvider } from "./deterministic/provider";
import { MarketDataService } from "./service";

const AAPL = "US-XNAS:AAPL";

function historyRequest(startDate = "2026-01-05"): HistoricalPriceRequest {
  return {
    instrumentId: AAPL,
    startDate,
    endDate: "2026-01-16",
    interval: "daily",
    timeZone: "UTC",
    adjustment: adjustmentPolicies.raw,
  };
}

describe("in-process market-data cache", () => {
  it("uses a short quote TTL while retaining slower-changing metadata and history", async () => {
    let now = 0;
    const cache = new InMemoryMarketDataCache({ clock: () => now });
    const provider = new DeterministicMarketDataProvider(() => new Date(FIXTURE_RETRIEVED_AT));
    const [quote, instrument, history] = await Promise.all([
      provider.getQuote(AAPL),
      provider.getInstrumentMetadata(AAPL),
      provider.getHistoricalPrices(historyRequest()),
    ]);
    await cache.setQuote(AAPL, quote);
    await cache.setInstrument(AAPL, instrument);
    await cache.setHistory("history-key", history);

    now = 31_000;
    await expect(cache.getQuote(AAPL)).resolves.toBeUndefined();
    await expect(cache.getInstrument(AAPL)).resolves.toEqual(instrument);
    await expect(cache.getHistory("history-key")).resolves.toEqual(history);
  });

  it("coalesces identical in-flight requests and caches only successful loads", async () => {
    class CountingProvider extends DeterministicMarketDataProvider {
      calls = 0;
      shouldFail = false;

      override async getQuote(instrumentId: InstrumentId) {
        this.calls += 1;
        await Promise.resolve();
        if (this.shouldFail) throw new Error("temporary failure");
        return super.getQuote(instrumentId);
      }
    }

    const provider = new CountingProvider(() => new Date(FIXTURE_RETRIEVED_AT));
    const service = new MarketDataService(provider, {
      cache: new InMemoryMarketDataCache(),
      clock: () => new Date(FIXTURE_RETRIEVED_AT),
    });
    const [first, second] = await Promise.all([service.getQuote(AAPL), service.getQuote(AAPL)]);
    expect(first).toEqual(second);
    expect(provider.calls).toBe(1);

    const retryProvider = new CountingProvider(() => new Date(FIXTURE_RETRIEVED_AT));
    retryProvider.shouldFail = true;
    const retryService = new MarketDataService(retryProvider, {
      cache: new InMemoryMarketDataCache(),
      clock: () => new Date(FIXTURE_RETRIEVED_AT),
    });
    await expect(retryService.getQuote(AAPL)).rejects.toMatchObject({ code: "ProviderUnavailable" });
    retryProvider.shouldFail = false;
    await expect(retryService.getQuote(AAPL)).resolves.toMatchObject({ instrumentId: AAPL });
    expect(retryProvider.calls).toBe(2);

    class InitiallyMalformedProvider extends DeterministicMarketDataProvider {
      calls = 0;
      override async getQuote(instrumentId: InstrumentId) {
        this.calls += 1;
        const quote = await super.getQuote(instrumentId);
        return this.calls === 1 ? { ...quote, price: Number.NaN } : quote;
      }
    }
    const malformedProvider = new InitiallyMalformedProvider(() => new Date(FIXTURE_RETRIEVED_AT));
    const malformedService = new MarketDataService(malformedProvider, {
      cache: new InMemoryMarketDataCache(),
      clock: () => new Date(FIXTURE_RETRIEVED_AT),
    });
    await expect(malformedService.getQuote(AAPL)).rejects.toMatchObject({ code: "MalformedProviderResponse" });
    await expect(malformedService.getQuote(AAPL)).resolves.toMatchObject({ price: 114 });
    expect(malformedProvider.calls).toBe(2);
  });

  it("uses unambiguous structured keys for distinct history requests", async () => {
    class RecordingCache extends NoopMarketDataCache {
      readonly keys: string[] = [];
      override async getHistory(key: string) {
        this.keys.push(key);
        return undefined;
      }
    }

    const cache = new RecordingCache();
    const service = new MarketDataService(
      new DeterministicMarketDataProvider(() => new Date(FIXTURE_RETRIEVED_AT)),
      { cache, clock: () => new Date(FIXTURE_RETRIEVED_AT) },
    );
    await service.getHistoricalPrices(historyRequest("2026-01-05"));
    await service.getHistoricalPrices(historyRequest("2026-01-06"));

    const unique = [...new Set(cache.keys)];
    expect(unique).toHaveLength(2);
    expect(unique.map((key) => JSON.parse(key))).toEqual([
      [AAPL, "2026-01-05", "2026-01-16", "daily", "UTC", "raw"],
      [AAPL, "2026-01-06", "2026-01-16", "daily", "UTC", "raw"],
    ]);
  });
});

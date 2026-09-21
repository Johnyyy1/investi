import { describe, expect, it, vi } from "vitest";
import { InMemoryMarketDataCache, defaultMarketDataCacheTtls } from "./cache";
import { DeterministicEquityFundamentalsProvider } from "./deterministic/fundamentals";
import { createDeterministicMarketDataService } from "./deterministic/service";
import { MarketDataError } from "./errors";

const AAPL = "US-XNAS:AAPL";

describe("equity fundamentals service", () => {
  it("coalesces concurrent loads and caches successful snapshots for six hours", async () => {
    let now = Date.parse("2026-01-16T20:50:00.000Z");
    const source = new DeterministicEquityFundamentalsProvider(() => new Date(now));
    const load = vi.fn(source.getEquityFundamentals.bind(source));
    const service = createDeterministicMarketDataService({ clock: () => new Date(now), cache: new InMemoryMarketDataCache({ clock: () => now }), equityFundamentalsProvider: { providerId: source.providerId, getEquityFundamentals: load } });
    const [first, second] = await Promise.all([service.getEquityFundamentals(AAPL), service.getEquityFundamentals(AAPL)]);
    expect(first).toEqual(second);
    expect(load).toHaveBeenCalledTimes(1);
    expect(defaultMarketDataCacheTtls.equityFundamentalsMilliseconds).toBe(6 * 60 * 60 * 1_000);
    now += defaultMarketDataCacheTtls.equityFundamentalsMilliseconds - 1;
    await service.getEquityFundamentals(AAPL);
    expect(load).toHaveBeenCalledTimes(1);
    now += 2;
    await service.getEquityFundamentals(AAPL);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it("does not cache partial datasets or provider errors as valid snapshots", async () => {
    const source = new DeterministicEquityFundamentalsProvider();
    let fail = true;
    const load = vi.fn(async (instrument: Parameters<typeof source.getEquityFundamentals>[0]) => {
      if (fail) throw new MarketDataError("RateLimited", "Try again later.");
      const result = await source.getEquityFundamentals(instrument);
      return { ...result, provenance: { ...result.provenance, unavailableDatasets: ["ratios-ttm" as const] } };
    });
    const service = createDeterministicMarketDataService({ cache: new InMemoryMarketDataCache(), equityFundamentalsProvider: { providerId: source.providerId, getEquityFundamentals: load } });
    await expect(service.getEquityFundamentals(AAPL)).rejects.toMatchObject({ code: "RateLimited" });
    fail = false;
    await service.getEquityFundamentals(AAPL);
    await service.getEquityFundamentals(AAPL);
    expect(load).toHaveBeenCalledTimes(3);
  });
  it("rejects ETF fundamentals without calling the provider", async () => {
    const load = vi.fn();
    const service = createDeterministicMarketDataService({ equityFundamentalsProvider: { providerId: "test", getEquityFundamentals: load } });
    await expect(service.getEquityFundamentals("IE-XETR:VWCE")).rejects.toMatchObject({ code: "UnsupportedInstrument" });
    expect(load).not.toHaveBeenCalled();
  });
});

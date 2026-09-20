import { describe, expect, it, vi } from "vitest";

import { createMarketDataService } from "./composition";
import { FIXTURE_RETRIEVED_AT } from "./deterministic/fixtures";

describe("market-data provider composition", () => {
  it("selects deterministic data explicitly", async () => {
    const service = createMarketDataService({ provider: "deterministic", fxProvider: "deterministic" });
    await expect(service.searchInstruments("AAPL")).resolves.toEqual([
      expect.objectContaining({ instrumentId: "US-XNAS:AAPL", provider: "investi-deterministic" }),
    ]);
  });

  it("fails fast when FMP is selected without a server credential", () => {
    expect(() => createMarketDataService({ provider: "fmp", fxProvider: "frankfurter", fmpApiKey: "" })).toThrowError(expect.objectContaining({
      code: "ProviderConfiguration",
    }));
  });

  it("requires an explicit FX provider when live security data is selected", () => {
    expect(() => createMarketDataService({ provider: "fmp", fmpApiKey: "server-only-test-key" })).toThrowError(expect.objectContaining({
      code: "ProviderConfiguration",
      context: expect.objectContaining({ reason: "missing-fx-provider" }),
    }));
  });

  it("rejects unknown provider names without a fallback", () => {
    expect(() => createMarketDataService({ provider: "unknown", fxProvider: "deterministic" })).toThrowError(expect.objectContaining({
      code: "ProviderConfiguration",
    }));
  });

  it("can serve the CZK identity rate in FMP plus Frankfurter mode without a network call", async () => {
    const fetchMock = vi.fn();
    const frankfurterFetch = vi.fn();
    const service = createMarketDataService({
      provider: "fmp",
      fxProvider: "frankfurter",
      fmpApiKey: "server-only-test-key",
      fetch: fetchMock,
      frankfurterFetch,
      clock: () => new Date(FIXTURE_RETRIEVED_AT),
    });

    await expect(service.getFxRate("CZK", "CZK", FIXTURE_RETRIEVED_AT)).resolves.toMatchObject({ rate: 1 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(frankfurterFetch).not.toHaveBeenCalled();
  });

  it("routes security capabilities to FMP and FX capability to Frankfurter", async () => {
    const fmpFetch = vi.fn(async (input: string | URL | Request) => {
      void input;
      return Response.json([
        { symbol: "AAPL", name: "Apple Inc.", currency: "USD", exchange: "NASDAQ", exchangeFullName: "NASDAQ Global Select" },
      ]);
    });
    const frankfurterFetch = vi.fn(async (input: string | URL | Request) => {
      void input;
      return Response.json({ date: "2026-01-16", base: "USD", quote: "CZK", rate: 22.1 });
    });
    const service = createMarketDataService({
      provider: "fmp",
      fxProvider: "frankfurter",
      fmpApiKey: "server-only-test-key",
      fetch: fmpFetch,
      frankfurterFetch,
      clock: () => new Date(FIXTURE_RETRIEVED_AT),
    });

    await expect(service.searchInstruments("AAPL")).resolves.toEqual([
      expect.objectContaining({ instrumentId: "FMP:NASDAQ:AAPL", provider: "financial-modeling-prep" }),
    ]);
    await expect(service.getFxRate("USD", "CZK", FIXTURE_RETRIEVED_AT)).resolves.toMatchObject({
      rate: 22.1,
      referenceDate: "2026-01-16",
      provenance: { provider: "frankfurter" },
    });
    expect(new URL(fmpFetch.mock.calls[0][0].toString()).pathname).toContain("/stable/search-symbol");
    expect(new URL(frankfurterFetch.mock.calls[0][0].toString()).pathname).toBe("/v2/rate/USD/CZK");
  });
});

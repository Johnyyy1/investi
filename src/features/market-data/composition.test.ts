import { describe, expect, it, vi } from "vitest";

import { createMarketDataService } from "./composition";
import { FIXTURE_RETRIEVED_AT } from "./deterministic/fixtures";

describe("market-data provider composition", () => {
  it("selects deterministic data explicitly", async () => {
    const service = createMarketDataService({ provider: "deterministic" });
    await expect(service.searchInstruments("AAPL")).resolves.toEqual([
      expect.objectContaining({ instrumentId: "US-XNAS:AAPL", provider: "investi-deterministic" }),
    ]);
  });

  it("fails fast when FMP is selected without a server credential", () => {
    expect(() => createMarketDataService({ provider: "fmp", fmpApiKey: "" })).toThrowError(expect.objectContaining({
      code: "ProviderConfiguration",
    }));
  });

  it("rejects unknown provider names without a fallback", () => {
    expect(() => createMarketDataService({ provider: "unknown" })).toThrowError(expect.objectContaining({
      code: "ProviderConfiguration",
    }));
  });

  it("can serve the CZK identity rate in FMP mode without a network call", async () => {
    const fetchMock = vi.fn();
    const service = createMarketDataService({
      provider: "fmp",
      fmpApiKey: "server-only-test-key",
      fetch: fetchMock,
      clock: () => new Date(FIXTURE_RETRIEVED_AT),
    });

    await expect(service.getFxRate("CZK", "CZK", FIXTURE_RETRIEVED_AT)).resolves.toMatchObject({ rate: 1 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

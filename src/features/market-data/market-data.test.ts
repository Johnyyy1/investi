import { describe, expect, it } from "vitest";

import { adjustmentPolicies, type HistoricalPriceRequest, type InstrumentId } from "./contracts";
import { DeterministicMarketDataProvider } from "./deterministic/provider";
import { createDeterministicMarketDataService } from "./deterministic/service";
import { FIXTURE_OBSERVED_AT, FIXTURE_RETRIEVED_AT } from "./deterministic/fixtures";
import { MarketDataService } from "./service";

const AAPL = "US-XNAS:AAPL";
const BOND = "CZ-XPRA:CZGB35";
const AS_OF = "2026-01-16T16:00:00.000Z";

function historyRequest(
  instrumentId = AAPL,
  adjustment: HistoricalPriceRequest["adjustment"] = adjustmentPolicies.raw,
): HistoricalPriceRequest {
  return {
    instrumentId,
    startDate: "2026-01-05",
    endDate: "2026-01-16",
    interval: "daily",
    timeZone: "UTC",
    adjustment,
  };
}

describe("deterministic instrument search", () => {
  const service = createDeterministicMarketDataService();

  it("matches symbols with exact symbol results ranked first", async () => {
    const results = await service.searchInstruments("aapl");
    expect(results.map(({ instrumentId }) => instrumentId)).toEqual([AAPL]);
  });

  it("matches names case-insensitively", async () => {
    expect((await service.searchInstruments("mIcRoSoFt"))[0]).toMatchObject({ symbol: "MSFT", name: "Microsoft Corporation" });
    expect((await service.searchInstruments("WORLD"))[0]).toMatchObject({ symbol: "VWCE", assetType: "etf" });
  });

  it("rejects invalid queries and returns stable empty results for valid unmatched searches", async () => {
    await expect(service.searchInstruments("  ")).rejects.toMatchObject({ code: "InvalidSearchQuery" });
    expect(await service.searchInstruments("not-in-the-fixture")).toEqual([]);
  });
});

describe("quotes and freshness", () => {
  it("returns the same normalized deterministic quote on every call", async () => {
    const service = createDeterministicMarketDataService();
    const first = await service.getQuote(AAPL);
    const second = await service.getQuote(AAPL);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      instrumentId: AAPL,
      price: 114,
      currency: "USD",
      observedAt: FIXTURE_OBSERVED_AT,
      retrievedAt: FIXTURE_RETRIEVED_AT,
      freshness: { status: "fresh", ageMilliseconds: 5 * 60 * 1_000 },
      provenance: {
        provider: "investi-deterministic",
        dataset: "investi-education-market-v1",
        dataKind: "synthetic",
        isDeterministic: true,
        isDemo: true,
        adjustmentMode: null,
        completeness: "complete",
      },
    });
    expect(first.provenance.observedAt).toBe(first.observedAt);
    expect(first.provenance.retrievedAt).toBe(first.retrievedAt);
  });

  it("evaluates stale and unavailable states with injected, testable clocks", async () => {
    const stale = createDeterministicMarketDataService({ clock: () => new Date("2026-01-16T18:00:00.000Z") });
    const unavailable = createDeterministicMarketDataService({ clock: () => new Date("2026-01-18T16:00:00.000Z") });
    expect((await stale.getQuote(AAPL)).freshness.status).toBe("stale");
    expect((await unavailable.getQuote(AAPL)).freshness.status).toBe("unavailable");
  });

  it("reports a normalized missing-instrument failure", async () => {
    await expect(createDeterministicMarketDataService().getQuote("missing:instrument")).rejects.toMatchObject({ code: "InstrumentNotFound" });
  });
});

describe("daily historical prices", () => {
  it("returns an inclusive, ordered date range with explicit raw semantics", async () => {
    const service = createDeterministicMarketDataService();
    const series = await service.getHistoricalPrices({
      ...historyRequest(),
      startDate: "2026-01-07",
      endDate: "2026-01-13",
    });

    expect(series.points.map(({ date }) => date)).toEqual([
      "2026-01-07",
      "2026-01-08",
      "2026-01-09",
      "2026-01-12",
      "2026-01-13",
    ]);
    expect(series).toMatchObject({
      instrumentId: AAPL,
      currency: "USD",
      interval: "daily",
      timeZone: "UTC",
      adjustment: adjustmentPolicies.raw,
      provenance: { adjustmentMode: "raw", completeness: "complete", dataKind: "synthetic" },
    });
    expect(series.points.every((point) => point.adjustedClose === undefined)).toBe(true);
  });

  it("keeps split-adjusted and total-return semantics distinct", async () => {
    const service = createDeterministicMarketDataService();
    const adjusted = await service.getHistoricalPrices(historyRequest(AAPL, adjustmentPolicies["split-adjusted"]));
    expect(adjusted.adjustment).toEqual(adjustmentPolicies["split-adjusted"]);
    expect(adjusted.provenance.adjustmentMode).toBe("split-adjusted");
    expect(adjusted.points.every((point) => point.adjustedClose === point.close)).toBe(true);
    await expect(service.getHistoricalPrices(historyRequest(AAPL, adjustmentPolicies["total-return"]))).rejects.toMatchObject({ code: "UnsupportedAdjustment" });
  });

  it("represents missing observations as gaps and marks the series partial", async () => {
    const service = createDeterministicMarketDataService();
    const equity = await service.getHistoricalPrices(historyRequest());
    const bond = await service.getHistoricalPrices(historyRequest(BOND));
    expect(equity.points).toHaveLength(10);
    expect(bond.points).toHaveLength(9);
    expect(bond.points.some(({ date }) => date === "2026-01-07")).toBe(false);
    expect(bond.provenance.completeness).toBe("partial");
  });

  it("rejects invalid dates, reversed ranges, unsupported modes and missing instruments", async () => {
    const service = createDeterministicMarketDataService();
    await expect(service.getHistoricalPrices({ ...historyRequest(), startDate: "2026-02-30" })).rejects.toMatchObject({ code: "InvalidDateRange" });
    await expect(service.getHistoricalPrices({ ...historyRequest(), startDate: "2026-01-16", endDate: "2026-01-05" })).rejects.toMatchObject({ code: "InvalidDateRange" });
    await expect(service.getHistoricalPrices(historyRequest("missing:instrument"))).rejects.toMatchObject({ code: "InstrumentNotFound" });
  });
});

describe("FX and corporate actions", () => {
  it("returns explicit deterministic USD/CZK and EUR/CZK base/quote rates", async () => {
    const service = createDeterministicMarketDataService();
    await expect(service.getFxRate("USD", "CZK", AS_OF)).resolves.toMatchObject({ baseCurrency: "USD", quoteCurrency: "CZK", rate: 22.75 });
    const euro = await service.getFxRate("EUR", "CZK", AS_OF);
    expect(euro.rate).toBe(24.9);
    expect(euro.provenance).toMatchObject({ isDeterministic: true, isDemo: true, adjustmentMode: null });
  });

  it("does not invent identity or inverse rates for unavailable pairs", async () => {
    const service = createDeterministicMarketDataService();
    await expect(service.getFxRate("CZK", "USD", AS_OF)).rejects.toMatchObject({ code: "FxUnavailable" });
    await expect(service.getFxRate("USD", "USD", AS_OF)).resolves.toMatchObject({ rate: 1, referenceDate: "2026-01-16", provenance: { provider: "investi-identity" } });
    await expect(service.getFxRate("USD", "CZK", "2026-01-15T16:00:00.000Z")).rejects.toMatchObject({ code: "FxUnavailable" });
    await expect(service.getFxRate("USD", "CZK", "2026-01-16T17:00:00+01:00")).rejects.toMatchObject({ code: "FxUnavailable" });
  });

  it("exposes corporate actions separately from price adjustment logic", async () => {
    const service = createDeterministicMarketDataService();
    const series = await service.getCorporateActions({ instrumentId: AAPL, startDate: "2026-01-01", endDate: "2026-01-31" });
    expect(series.actions).toEqual([expect.objectContaining({ type: "dividend", amount: 0.25, currency: "USD" })]);
    expect(series.provenance).toMatchObject({ isDeterministic: true, isDemo: true });
  });
});

describe("normalized provider failures", () => {
  it("preserves domain failures and wraps arbitrary adapter failures", async () => {
    class FailingQuoteProvider extends DeterministicMarketDataProvider {
      override async getQuote(instrumentId: InstrumentId): Promise<never> {
        void instrumentId;
        throw new Error("adapter-specific detail");
      }
    }
    const service = new MarketDataService(new FailingQuoteProvider(), { clock: () => new Date(FIXTURE_RETRIEVED_AT) });
    await expect(service.getQuote(AAPL)).rejects.toMatchObject({
      name: "MarketDataError",
      code: "ProviderUnavailable",
      context: { operation: "quote", provider: "investi-deterministic" },
    });
    await expect(service.getInstrumentMetadata("missing:instrument")).rejects.toMatchObject({ code: "InstrumentNotFound" });
  });
});

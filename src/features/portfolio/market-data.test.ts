import { describe, expect, it, vi } from "vitest";

import { createMarketDataService } from "@/features/market-data/composition";
import type {
  CorporateActionsRequest,
  Currency,
  HistoricalPriceRequest,
  Instrument,
  InstrumentSearchResult,
  MarketDataProvenance,
  UtcTimestamp,
} from "@/features/market-data/contracts";
import { createDeterministicMarketDataService } from "@/features/market-data/deterministic/service";
import { MarketDataError } from "@/features/market-data/errors";
import type { MarketDataProvider } from "@/features/market-data/provider";
import { MarketDataService } from "@/features/market-data/service";
import { foldTrades, valuePortfolio, type LedgerTrade } from "./domain";
import { tradeInputSchema } from "./input";
import {
  loadPortfolioInstrumentPreview,
  observePortfolioExecution,
  observePortfolioHoldingValue,
  type PortfolioMarketDataGateway,
} from "./market-data";

const NOW = "2026-09-19T12:00:00.000Z";
const FMP_AAPL = "FMP:NASDAQ:AAPL";

function provenance(observedAt = NOW): MarketDataProvenance {
  return {
    provider: "test-provider",
    dataset: "test-quotes",
    dataKind: "live",
    isDeterministic: false,
    isDemo: false,
    observedAt,
    retrievedAt: NOW,
    adjustmentMode: null,
    completeness: "complete",
  };
}

class MutableMarketDataProvider implements MarketDataProvider {
  readonly providerId = "test-provider";
  readonly instruments = new Map<string, Instrument>();
  price = 100;
  fxRate = 20;
  observedAt = NOW;
  quoteCalls = 0;
  fxCalls = 0;
  quoteError: unknown;
  fxError: unknown;

  constructor(instruments: readonly Instrument[]) {
    for (const instrument of instruments) this.instruments.set(instrument.instrumentId, instrument);
  }

  async searchInstruments(): Promise<readonly InstrumentSearchResult[]> { return []; }
  async getInstrumentMetadata(instrumentId: string) {
    const instrument = this.instruments.get(instrumentId);
    if (!instrument) throw new MarketDataError("InstrumentNotFound", "missing");
    return instrument;
  }
  async getQuote(instrumentId: string) {
    this.quoteCalls += 1;
    if (this.quoteError) throw this.quoteError;
    const instrument = await this.getInstrumentMetadata(instrumentId);
    return {
      instrumentId,
      price: this.price,
      currency: instrument.quoteCurrency,
      observedAt: this.observedAt,
      retrievedAt: NOW,
      provenance: provenance(this.observedAt),
    };
  }
  async getFxRate(baseCurrency: Currency, quoteCurrency: Currency, asOf: UtcTimestamp) {
    this.fxCalls += 1;
    if (this.fxError) throw this.fxError;
    return {
      baseCurrency,
      quoteCurrency,
      rate: this.fxRate,
      observedAt: asOf,
      retrievedAt: NOW,
      provenance: provenance(asOf),
    };
  }
  async getHistoricalPrices(request: HistoricalPriceRequest): Promise<never> { void request; throw new Error("unused"); }
  async getCorporateActions(request: CorporateActionsRequest): Promise<never> { void request; throw new Error("unused"); }
}

function gateway(provider: MutableMarketDataProvider, configuredProvider: "deterministic" | "fmp" = "fmp"): PortfolioMarketDataGateway {
  return {
    provider: configuredProvider,
    service: new MarketDataService(provider, { clock: () => new Date(NOW) }),
  };
}

function equity(instrumentId = FMP_AAPL, quoteCurrency: Currency = "USD"): Instrument {
  return { instrumentId, symbol: "AAPL", name: "Apple Inc.", assetType: "equity", exchangeMic: "XNAS", quoteCurrency };
}

describe("Portfolio Lab configured market data", () => {
  it("keeps the configured deterministic flow operational without an FMP key", async () => {
    const configured: PortfolioMarketDataGateway = {
      provider: "deterministic",
      service: createDeterministicMarketDataService(),
    };
    const observation = await observePortfolioExecution(configured, "US-XNAS:AAPL", "0.25", "CZK");
    expect(observation).toMatchObject({ grossMinor: 64_838n, quote: { price: 114, currency: "USD" } });
  });

  it("uses configured FMP search identities through the normalized Portfolio gateway", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      const symbol = url.searchParams.get("symbol");
      if (url.pathname.endsWith("/search-symbol")) return Response.json([
        { symbol: "AAPL", name: "Apple Inc.", currency: "USD", exchange: "NASDAQ", exchangeFullName: "NASDAQ Global Select" },
        { symbol: "AAPL", name: "Apple Europe", currency: "EUR", exchange: "XETRA", exchangeFullName: "Deutsche Boerse Xetra" },
      ]);
      if (url.pathname.endsWith("/profile")) return Response.json([{
        symbol: "AAPL", companyName: "Apple Inc.", currency: "USD", exchange: "NASDAQ", isEtf: false, isFund: false,
      }]);
      if (url.pathname.endsWith("/quote") && symbol === "AAPL") return Response.json([{
        symbol: "AAPL", price: 245.5, timestamp: Date.parse(NOW) / 1_000,
      }]);
      if (url.pathname.endsWith("/quote") && symbol === "USDCZK") return Response.json([{
        symbol: "USDCZK", price: 20.9, timestamp: Date.parse(NOW) / 1_000,
      }]);
      return new Response("not found", { status: 404 });
    });
    const configured: PortfolioMarketDataGateway = {
      provider: "fmp",
      service: createMarketDataService({ provider: "fmp", fmpApiKey: "server-test-key", fetch: fetchMock, clock: () => new Date(NOW) }),
    };

    const results = await configured.service.searchInstruments("apple");
    expect(results.map(({ instrumentId }) => instrumentId)).toEqual(["FMP:XETRA:AAPL", "FMP:NASDAQ:AAPL"]);
    const selected = results.find(({ instrumentId }) => instrumentId === FMP_AAPL)!;
    const preview = await loadPortfolioInstrumentPreview(configured, selected.instrumentId);
    expect(preview).toMatchObject({
      instrument: { instrumentId: FMP_AAPL, symbol: "AAPL", exchangeMic: "XNAS" },
      price: "245.5",
      marketDataMode: "market",
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("fails explicitly when FMP is selected without a key", () => {
    expect(() => createMarketDataService({ provider: "fmp" })).toThrowError(expect.objectContaining({ code: "ProviderConfiguration" }));
  });
});

describe("Portfolio execution and current valuation semantics", () => {
  it("uses a server-fetched USD quote and direct USD-to-CZK execution FX", async () => {
    const provider = new MutableMarketDataProvider([equity()]);
    const observation = await observePortfolioExecution(gateway(provider), FMP_AAPL, "0.25", "CZK");
    expect(observation).toMatchObject({ grossMinor: 50_000n, quote: { price: 100, currency: "USD" } });
    expect(provider.quoteCalls).toBe(1);
    expect(provider.fxCalls).toBe(1);
  });

  it("uses identity conversion for CZK instruments without requesting external FX", async () => {
    const id = "FMP:PRAGUE:CZTEST";
    const provider = new MutableMarketDataProvider([{ ...equity(id, "CZK"), symbol: "CZTEST", exchangeMic: "XPRA" }]);
    const observation = await observePortfolioExecution(gateway(provider), id, "1", "CZK");
    expect(observation.fxUnits).toBe(1_000_000_000_000n);
    expect(observation.grossMinor).toBe(10_000n);
    expect(provider.fxCalls).toBe(0);
  });

  it("keeps execution price/FX immutable while current value uses later quote/FX", async () => {
    const provider = new MutableMarketDataProvider([equity()]);
    const configured = gateway(provider);
    const execution = await observePortfolioExecution(configured, FMP_AAPL, "1", "CZK");
    provider.price = 120;
    provider.fxRate = 25;
    const current = await observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: execution.quantityUnits }, "CZK");
    const trade: LedgerTrade = {
      instrumentId: FMP_AAPL,
      instrumentSymbol: "AAPL",
      instrumentName: "Apple Inc.",
      instrumentAssetType: "equity",
      side: "BUY",
      quantity: "1",
      grossAmountBaseMinor: execution.grossMinor,
      feeBaseMinor: 0n,
      cashDeltaBaseMinor: -execution.grossMinor,
    };
    const folded = foldTrades(500_000n, [trade]);
    const valued = valuePortfolio(500_000n, folded, [{
      instrumentId: FMP_AAPL,
      marketValueMinor: current.marketValueMinor,
      quoteObservedAt: current.quoteObservedAt,
    }]);

    expect(execution.quote.price).toBe(100);
    expect(execution.fxUnits).toBe(20_000_000_000_000n);
    expect(folded.holdings[0].costBasisMinor).toBe(200_000n);
    expect(current.marketValueMinor).toBe(300_000n);
    expect(valued.holdings[0].gainLossMinor).toBe(100_000n);
  });

  it("allows stale current observations with an explicit freshness label but rejects them for execution", async () => {
    const provider = new MutableMarketDataProvider([equity()]);
    provider.observedAt = "2026-09-19T11:00:00.000Z";
    const configured = gateway(provider);
    await expect(observePortfolioExecution(configured, FMP_AAPL, "1", "CZK")).rejects.toMatchObject({ code: "QuoteUnavailable" });
    await expect(observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: 100_000_000n }, "CZK")).resolves.toMatchObject({
      marketValueMinor: 200_000n,
      quoteFreshness: "stale",
    });
  });
});

describe("Portfolio market-data failures", () => {
  it("keeps quote, FX, rate-limit, and provider failures explicit", async () => {
    const provider = new MutableMarketDataProvider([equity()]);
    const configured = gateway(provider);
    provider.quoteError = new MarketDataError("QuoteUnavailable", "missing");
    await expect(observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: 1n }, "CZK")).resolves.toMatchObject({ unavailableReason: "quote", marketValueMinor: null });
    provider.quoteError = new MarketDataError("RateLimited", "limited");
    await expect(observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: 1n }, "CZK")).resolves.toMatchObject({ unavailableReason: "rate-limit" });
    provider.quoteError = undefined;
    provider.fxError = new MarketDataError("FxUnavailable", "missing pair");
    await expect(observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: 1n }, "CZK")).resolves.toMatchObject({ unavailableReason: "fx" });
    provider.fxError = new MarketDataError("ProviderUnavailable", "down");
    await expect(observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: 1n }, "CZK")).resolves.toMatchObject({ unavailableReason: "provider" });
  });

  it("returns a partial valuation without treating an unavailable holding as zero", async () => {
    const secondId = "FMP:NASDAQ:MSFT";
    const provider = new MutableMarketDataProvider([equity(), { ...equity(secondId), symbol: "MSFT", name: "Microsoft Corporation" }]);
    const configured = gateway(provider);
    const first = await observePortfolioHoldingValue(configured, { instrumentId: FMP_AAPL, quantityUnits: 100_000_000n }, "CZK");
    provider.quoteError = new MarketDataError("QuoteUnavailable", "missing");
    const second = await observePortfolioHoldingValue(configured, { instrumentId: secondId, quantityUnits: 100_000_000n }, "CZK");
    const folded = foldTrades(500_000n, [
      { instrumentId: FMP_AAPL, instrumentSymbol: "AAPL", instrumentName: "Apple", instrumentAssetType: "equity", side: "BUY", quantity: "1", grossAmountBaseMinor: 150_000n, feeBaseMinor: 0n, cashDeltaBaseMinor: -150_000n },
      { instrumentId: secondId, instrumentSymbol: "MSFT", instrumentName: "Microsoft", instrumentAssetType: "equity", side: "BUY", quantity: "1", grossAmountBaseMinor: 150_000n, feeBaseMinor: 0n, cashDeltaBaseMinor: -150_000n },
    ]);
    const valued = valuePortfolio(500_000n, folded, [first, second]);
    expect(first.marketValueMinor).toBe(200_000n);
    expect(second.marketValueMinor).toBeNull();
    expect(valued).toMatchObject({ complete: false, holdingsMarketValueMinor: null, portfolioTotalMinor: null });
    expect(valued.holdings.find(({ instrumentId }) => instrumentId === secondId)?.gainLossMinor).toBeNull();
  });

  it("preserves legacy deterministic IDs and never silently remaps them in FMP mode", async () => {
    const provider = new MutableMarketDataProvider([equity("US-XNAS:AAPL")]);
    const configured = gateway(provider, "fmp");
    await expect(observePortfolioHoldingValue(configured, { instrumentId: "US-XNAS:AAPL", quantityUnits: 100_000_000n }, "CZK")).resolves.toMatchObject({
      unavailableReason: "instrument",
      marketValueMinor: null,
    });
    expect(provider.quoteCalls).toBe(0);
  });

  it("rejects client-authored execution price or FX fields", () => {
    expect(tradeInputSchema.safeParse({
      instrumentId: FMP_AAPL,
      quantity: "1",
      clientIdempotencyKey: "00000000-0000-4000-8000-000000000000",
      unitPrice: "1",
      fxRateToBase: "1",
    }).success).toBe(false);
  });
});

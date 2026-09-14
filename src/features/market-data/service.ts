import "server-only";

import { NoopMarketDataCache, type MarketDataCache } from "./cache";
import {
  adjustmentPolicies,
  type CorporateActionsRequest,
  type Currency,
  type HistoricalPriceRequest,
  type InstrumentId,
  type PriceAdjustmentPolicy,
  type Quote,
  type QuoteFreshness,
  type UtcTimestamp,
} from "./contracts";
import { isMarketDataError, MarketDataError } from "./errors";
import type { MarketDataProvider, ProviderQuote } from "./provider";

const DAY = 24 * 60 * 60 * 1_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export interface MarketDataServiceOptions {
  cache?: MarketDataCache;
  clock?: () => Date;
  quoteFreshForMilliseconds?: number;
  quoteUnavailableAfterMilliseconds?: number;
}

function isValidCalendarDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidUtcTimestamp(value: string) {
  return UTC_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));
}

function validateDateRange(startDate: string, endDate: string) {
  if (!isValidCalendarDate(startDate) || !isValidCalendarDate(endDate) || startDate > endDate) {
    throw new MarketDataError("InvalidDateRange", "Use a valid start date on or before the end date.", { startDate, endDate });
  }
}

function validateAdjustment(adjustment: PriceAdjustmentPolicy) {
  const expected = adjustmentPolicies[adjustment?.mode];
  if (!expected || expected.splitTreatment !== adjustment.splitTreatment || expected.dividendTreatment !== adjustment.dividendTreatment) {
    throw new MarketDataError("UnsupportedAdjustment", "The requested price-adjustment policy is not supported.", { mode: adjustment?.mode });
  }
}

/** Application boundary for validation, freshness, caching and normalized failures. */
export class MarketDataService {
  private readonly cache: MarketDataCache;
  private readonly clock: () => Date;
  private readonly freshFor: number;
  private readonly unavailableAfter: number;

  constructor(private readonly provider: MarketDataProvider, options: MarketDataServiceOptions = {}) {
    this.cache = options.cache ?? new NoopMarketDataCache();
    this.clock = options.clock ?? (() => new Date());
    this.freshFor = options.quoteFreshForMilliseconds ?? 15 * 60 * 1_000;
    this.unavailableAfter = options.quoteUnavailableAfterMilliseconds ?? DAY;
    if (this.freshFor < 0 || this.unavailableAfter < this.freshFor) {
      throw new RangeError("Quote freshness thresholds must be ordered, nonnegative durations.");
    }
  }

  async searchInstruments(query: string) {
    const normalized = query.trim().toLocaleLowerCase("en-US");
    if (!normalized) return [];
    const cached = await this.cache.getSearch(normalized);
    if (cached) return cached;
    const results = await this.call("search", () => this.provider.searchInstruments(normalized));
    await this.cache.setSearch(normalized, results);
    return results;
  }

  async getInstrumentMetadata(instrumentId: InstrumentId) {
    const cached = await this.cache.getInstrument(instrumentId);
    if (cached) return cached;
    const instrument = await this.call("metadata", () => this.provider.getInstrumentMetadata(instrumentId));
    await this.cache.setInstrument(instrumentId, instrument);
    return instrument;
  }

  async getQuote(instrumentId: InstrumentId): Promise<Quote> {
    const cached = await this.cache.getQuote(instrumentId);
    const observation = cached ?? await this.call("quote", () => this.provider.getQuote(instrumentId));
    if (!cached) await this.cache.setQuote(instrumentId, observation);
    this.validateQuote(observation);
    return { ...observation, freshness: this.evaluateFreshness(observation.observedAt) };
  }

  async getHistoricalPrices(request: HistoricalPriceRequest) {
    this.validateHistoricalRequest(request);
    const key = JSON.stringify(request);
    const cached = await this.cache.getHistory(key);
    if (cached) return cached;
    const series = await this.call("history", () => this.provider.getHistoricalPrices(request));
    await this.cache.setHistory(key, series);
    return series;
  }

  async getFxRate(baseCurrency: Currency, quoteCurrency: Currency, asOf: UtcTimestamp) {
    if (!isValidUtcTimestamp(asOf)) {
      throw new MarketDataError("FxUnavailable", "Use a valid UTC timestamp for the FX request.", { baseCurrency, quoteCurrency, asOf });
    }
    const key = `${baseCurrency}:${quoteCurrency}:${asOf}`;
    const cached = await this.cache.getFx(key);
    if (cached) return cached;
    const rate = await this.call("fx", () => this.provider.getFxRate(baseCurrency, quoteCurrency, asOf));
    await this.cache.setFx(key, rate);
    return rate;
  }

  async getCorporateActions(request: CorporateActionsRequest) {
    validateDateRange(request.startDate, request.endDate);
    const key = JSON.stringify(request);
    const cached = await this.cache.getCorporateActions(key);
    if (cached) return cached;
    const actions = await this.call("corporate-actions", () => this.provider.getCorporateActions(request));
    await this.cache.setCorporateActions(key, actions);
    return actions;
  }

  private validateHistoricalRequest(request: HistoricalPriceRequest) {
    validateDateRange(request.startDate, request.endDate);
    if (request.interval !== "daily") {
      throw new MarketDataError("UnsupportedInterval", "Only daily historical prices are supported.", { interval: request.interval });
    }
    if (request.timeZone !== "UTC") {
      throw new MarketDataError("UnsupportedTimeZone", "Only the explicit UTC convention is supported.", { timeZone: request.timeZone });
    }
    validateAdjustment(request.adjustment);
  }

  private validateQuote(quote: ProviderQuote) {
    if (!Number.isFinite(quote.price) || quote.price < 0 || !isValidUtcTimestamp(quote.observedAt) || !isValidUtcTimestamp(quote.retrievedAt)) {
      throw new MarketDataError("ProviderUnavailable", "The provider returned an invalid normalized quote.", { operation: "quote" });
    }
  }

  private evaluateFreshness(observedAt: UtcTimestamp): QuoteFreshness {
    const ageMilliseconds = this.clock().getTime() - Date.parse(observedAt);
    if (!Number.isFinite(ageMilliseconds) || ageMilliseconds < 0) {
      throw new MarketDataError("ProviderUnavailable", "The quote observation time is invalid.", { operation: "freshness" });
    }
    const status = ageMilliseconds <= this.freshFor
      ? "fresh"
      : ageMilliseconds <= this.unavailableAfter ? "stale" : "unavailable";
    return { status, ageMilliseconds };
  }

  private async call<T>(operation: string, execute: () => Promise<T>): Promise<T> {
    try {
      return await execute();
    } catch (error) {
      if (isMarketDataError(error)) throw error;
      throw new MarketDataError(
        "ProviderUnavailable",
        "Market data is temporarily unavailable.",
        { operation, provider: this.provider.providerId },
        { cause: error },
      );
    }
  }
}

import "server-only";

import type {
  CorporateActionSeries,
  FxRate,
  HistoricalSeries,
  Instrument,
  InstrumentSearchResult,
} from "./contracts";
import type { ProviderQuote } from "./provider";

const MINUTE = 60 * 1_000;
const HOUR = 60 * MINUTE;

/** Small process-local defaults chosen for interactive Portfolio Lab traffic. */
export const defaultMarketDataCacheTtls = {
  searchMilliseconds: 5 * MINUTE,
  instrumentMilliseconds: 24 * HOUR,
  quoteMilliseconds: 30 * 1_000,
  historyMilliseconds: 24 * HOUR,
  fxMilliseconds: 5 * MINUTE,
  corporateActionsMilliseconds: HOUR,
} as const;

export interface MarketDataCacheTtls {
  searchMilliseconds: number;
  instrumentMilliseconds: number;
  quoteMilliseconds: number;
  historyMilliseconds: number;
  fxMilliseconds: number;
  corporateActionsMilliseconds: number;
}

export interface InMemoryMarketDataCacheOptions {
  clock?: () => number;
  ttls?: Partial<MarketDataCacheTtls>;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

class TtlStore<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMilliseconds: number,
    private readonly clock: () => number,
  ) {}

  get(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.clock()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    this.entries.set(key, { value, expiresAt: this.clock() + this.ttlMilliseconds });
  }
}

/** Internal extension point. Callers depend on MarketDataService, not a cache implementation. */
export interface MarketDataCache {
  getSearch(key: string): Promise<readonly InstrumentSearchResult[] | undefined>;
  setSearch(key: string, value: readonly InstrumentSearchResult[]): Promise<void>;
  getInstrument(key: string): Promise<Instrument | undefined>;
  setInstrument(key: string, value: Instrument): Promise<void>;
  getQuote(key: string): Promise<ProviderQuote | undefined>;
  setQuote(key: string, value: ProviderQuote): Promise<void>;
  getHistory(key: string): Promise<HistoricalSeries | undefined>;
  setHistory(key: string, value: HistoricalSeries): Promise<void>;
  getFx(key: string): Promise<FxRate | undefined>;
  setFx(key: string, value: FxRate): Promise<void>;
  getCorporateActions(key: string): Promise<CorporateActionSeries | undefined>;
  setCorporateActions(key: string, value: CorporateActionSeries): Promise<void>;
}

export class NoopMarketDataCache implements MarketDataCache {
  async getSearch(key: string) { void key; return undefined; }
  async setSearch(key: string, value: readonly InstrumentSearchResult[]) { void key; void value; }
  async getInstrument(key: string) { void key; return undefined; }
  async setInstrument(key: string, value: Instrument) { void key; void value; }
  async getQuote(key: string) { void key; return undefined; }
  async setQuote(key: string, value: ProviderQuote) { void key; void value; }
  async getHistory(key: string) { void key; return undefined; }
  async setHistory(key: string, value: HistoricalSeries) { void key; void value; }
  async getFx(key: string) { void key; return undefined; }
  async setFx(key: string, value: FxRate) { void key; void value; }
  async getCorporateActions(key: string) { void key; return undefined; }
  async setCorporateActions(key: string, value: CorporateActionSeries) { void key; void value; }
}

/**
 * Process-local normalized-data cache. Entries expire lazily and are intentionally
 * neither distributed nor persistent; MarketDataService coalesces in-flight loads.
 */
export class InMemoryMarketDataCache implements MarketDataCache {
  private readonly search: TtlStore<readonly InstrumentSearchResult[]>;
  private readonly instruments: TtlStore<Instrument>;
  private readonly quotes: TtlStore<ProviderQuote>;
  private readonly history: TtlStore<HistoricalSeries>;
  private readonly fx: TtlStore<FxRate>;
  private readonly corporateActions: TtlStore<CorporateActionSeries>;

  constructor(options: InMemoryMarketDataCacheOptions = {}) {
    const clock = options.clock ?? Date.now;
    const ttls = { ...defaultMarketDataCacheTtls, ...options.ttls };
    for (const [kind, ttl] of Object.entries(ttls)) {
      if (!Number.isFinite(ttl) || ttl <= 0) throw new RangeError(`${kind} must be a positive finite cache TTL.`);
    }
    this.search = new TtlStore(ttls.searchMilliseconds, clock);
    this.instruments = new TtlStore(ttls.instrumentMilliseconds, clock);
    this.quotes = new TtlStore(ttls.quoteMilliseconds, clock);
    this.history = new TtlStore(ttls.historyMilliseconds, clock);
    this.fx = new TtlStore(ttls.fxMilliseconds, clock);
    this.corporateActions = new TtlStore(ttls.corporateActionsMilliseconds, clock);
  }

  async getSearch(key: string) { return this.search.get(key); }
  async setSearch(key: string, value: readonly InstrumentSearchResult[]) { this.search.set(key, value); }
  async getInstrument(key: string) { return this.instruments.get(key); }
  async setInstrument(key: string, value: Instrument) { this.instruments.set(key, value); }
  async getQuote(key: string) { return this.quotes.get(key); }
  async setQuote(key: string, value: ProviderQuote) { this.quotes.set(key, value); }
  async getHistory(key: string) { return this.history.get(key); }
  async setHistory(key: string, value: HistoricalSeries) { this.history.set(key, value); }
  async getFx(key: string) { return this.fx.get(key); }
  async setFx(key: string, value: FxRate) { this.fx.set(key, value); }
  async getCorporateActions(key: string) { return this.corporateActions.get(key); }
  async setCorporateActions(key: string, value: CorporateActionSeries) { this.corporateActions.set(key, value); }
}

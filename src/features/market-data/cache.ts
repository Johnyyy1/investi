import "server-only";

import type {
  CorporateActionSeries,
  FxRate,
  HistoricalSeries,
  Instrument,
  InstrumentSearchResult,
} from "./contracts";
import type { ProviderQuote } from "./provider";

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
  async getSearch() { return undefined; }
  async setSearch() {}
  async getInstrument() { return undefined; }
  async setInstrument() {}
  async getQuote() { return undefined; }
  async setQuote() {}
  async getHistory() { return undefined; }
  async setHistory() {}
  async getFx() { return undefined; }
  async setFx() {}
  async getCorporateActions() { return undefined; }
  async setCorporateActions() {}
}

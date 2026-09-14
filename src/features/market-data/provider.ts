import "server-only";

import type {
  CorporateActionSeries,
  CorporateActionsRequest,
  Currency,
  FxRate,
  HistoricalPriceRequest,
  HistoricalSeries,
  Instrument,
  InstrumentId,
  InstrumentSearchResult,
  MarketDataProvenance,
  UtcTimestamp,
} from "./contracts";

/** A normalized observation; MarketDataService adds policy-based freshness. */
export interface ProviderQuote {
  instrumentId: InstrumentId;
  price: number;
  currency: Currency;
  observedAt: UtcTimestamp;
  retrievedAt: UtcTimestamp;
  provenance: MarketDataProvenance;
}

/** Server-only port implemented by deterministic data now and external adapters later. */
export interface MarketDataProvider {
  readonly providerId: string;
  searchInstruments(query: string): Promise<readonly InstrumentSearchResult[]>;
  getInstrumentMetadata(instrumentId: InstrumentId): Promise<Instrument>;
  getQuote(instrumentId: InstrumentId): Promise<ProviderQuote>;
  getHistoricalPrices(request: HistoricalPriceRequest): Promise<HistoricalSeries>;
  getFxRate(baseCurrency: Currency, quoteCurrency: Currency, asOf: UtcTimestamp): Promise<FxRate>;
  getCorporateActions(request: CorporateActionsRequest): Promise<CorporateActionSeries>;
}

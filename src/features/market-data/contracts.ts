/** Stable Investi identity. Symbols are display/search attributes, never identifiers. */
export type InstrumentId = string;

/** ISO 4217 currencies supported by the initial Investi market-data boundary. */
export const currencies = ["CZK", "USD", "EUR"] as const;
export type Currency = (typeof currencies)[number];

export const assetTypes = ["equity", "etf", "bond", "cash", "index"] as const;
export type AssetType = (typeof assetTypes)[number];

/** YYYY-MM-DD in the request's explicit time-zone convention. */
export type CalendarDate = string;
/** ISO-8601 UTC timestamp. */
export type UtcTimestamp = string;

export interface Instrument {
  instrumentId: InstrumentId;
  symbol: string;
  name: string;
  assetType: AssetType;
  exchangeMic: string | null;
  quoteCurrency: Currency;
}

export interface InstrumentSearchResult {
  instrumentId: InstrumentId;
  symbol: string;
  name: string;
  assetType: AssetType;
  exchangeMic: string | null;
  quoteCurrency: Currency;
}

export type DataKind = "synthetic" | "historical" | "live";
export type DataCompleteness = "complete" | "partial";
export type AdjustmentMode = "raw" | "split-adjusted" | "total-return";

export interface MarketDataProvenance {
  provider: string;
  dataset: string;
  dataKind: DataKind;
  isDeterministic: boolean;
  isDemo: boolean;
  observedAt: UtcTimestamp;
  retrievedAt: UtcTimestamp;
  adjustmentMode: AdjustmentMode | null;
  completeness: DataCompleteness;
}

export type QuoteFreshnessStatus = "fresh" | "stale" | "unavailable";

export interface QuoteFreshness {
  status: QuoteFreshnessStatus;
  ageMilliseconds: number;
}

export interface Quote {
  instrumentId: InstrumentId;
  price: number;
  currency: Currency;
  observedAt: UtcTimestamp;
  retrievedAt: UtcTimestamp;
  provenance: MarketDataProvenance;
  freshness: QuoteFreshness;
}

export const adjustmentPolicies = {
  raw: {
    mode: "raw",
    splitTreatment: "unadjusted",
    dividendTreatment: "excluded",
  },
  "split-adjusted": {
    mode: "split-adjusted",
    splitTreatment: "adjusted",
    dividendTreatment: "excluded",
  },
  "total-return": {
    mode: "total-return",
    splitTreatment: "adjusted",
    dividendTreatment: "reinvested",
  },
} as const;

export type PriceAdjustmentPolicy = (typeof adjustmentPolicies)[AdjustmentMode];
export type HistoricalInterval = "daily";
export type MarketTimeZone = "UTC";

export interface HistoricalPriceRequest {
  instrumentId: InstrumentId;
  startDate: CalendarDate;
  endDate: CalendarDate;
  interval: HistoricalInterval;
  timeZone: MarketTimeZone;
  adjustment: PriceAdjustmentPolicy;
}

export interface HistoricalPricePoint {
  date: CalendarDate;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume?: number;
}

export interface HistoricalSeries {
  instrumentId: InstrumentId;
  currency: Currency;
  interval: HistoricalInterval;
  timeZone: MarketTimeZone;
  adjustment: PriceAdjustmentPolicy;
  points: readonly HistoricalPricePoint[];
  provenance: MarketDataProvenance;
}

export interface FxRate {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  rate: number;
  observedAt: UtcTimestamp;
  retrievedAt: UtcTimestamp;
  provenance: MarketDataProvenance;
}

interface CorporateActionBase {
  actionId: string;
  instrumentId: InstrumentId;
  exDate: CalendarDate;
}

export interface SplitCorporateAction extends CorporateActionBase {
  type: "split";
  ratio: number;
}

export interface DividendCorporateAction extends CorporateActionBase {
  type: "dividend";
  amount: number;
  currency: Currency;
  payDate: CalendarDate;
}

export type CorporateAction = SplitCorporateAction | DividendCorporateAction;

export interface CorporateActionsRequest {
  instrumentId: InstrumentId;
  startDate: CalendarDate;
  endDate: CalendarDate;
}

export interface CorporateActionSeries {
  instrumentId: InstrumentId;
  actions: readonly CorporateAction[];
  provenance: MarketDataProvenance;
}

import type { CalendarDate, Currency, Instrument, InstrumentId, UtcTimestamp } from "./contracts";

export const equityFundamentalsDatasets = ["key-metrics-ttm", "ratios-ttm", "income-statement-fy", "cash-flow-statement-fy"] as const;
export type EquityFundamentalsDataset = (typeof equityFundamentalsDatasets)[number];

export interface EquityFundamentalsSnapshot {
  instrumentId: InstrumentId;
  company: { sector: string | null; industry: string | null; country: string | null };
  valuation: { marketCap: number | null; peTtm: number | null; peTtmStatus: "available" | "unavailable" | "not-meaningful"; psTtm: number | null; pbTtm: number | null; evToEbitdaTtm: number | null; priceToFcfTtm: number | null };
  profitability: { grossMarginTtm: number | null; operatingMarginTtm: number | null; netMarginTtm: number | null; roeTtm: number | null; roicTtm: number | null };
  financialHealth: { debtToEquityTtm: number | null; currentRatioTtm: number | null; netDebtToEbitdaTtm: number | null; netDebtToEbitdaIsNetCash: boolean };
  businessPerformance: { fiscalYearEnd: CalendarDate | null; filingDate: CalendarDate | null; reportingCurrency: Currency | null; revenueFy: number | null; netIncomeFy: number | null; freeCashFlowFy: number | null; dilutedEpsFy: number | null };
  provenance: { provider: string; retrievedAt: UtcTimestamp; isDeterministic: boolean; unavailableDatasets: EquityFundamentalsDataset[] };
}

/** Independent security-data capability; ETFs and other asset types do not implement it. */
export interface EquityFundamentalsProvider {
  readonly providerId: string;
  getEquityFundamentals(instrument: Instrument): Promise<EquityFundamentalsSnapshot>;
}

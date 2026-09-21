import "server-only";

import { currencies, type Currency, type Instrument } from "../contracts";
import { MarketDataError } from "../errors";
import { equityFundamentalsDatasets, type EquityFundamentalsDataset, type EquityFundamentalsProvider, type EquityFundamentalsSnapshot } from "../equity-fundamentals";
import { FmpClient, FMP_PROVIDER_ID } from "./client";

type Row = Record<string, unknown>;
const routes: Record<EquityFundamentalsDataset, string> = {
  "key-metrics-ttm": "key-metrics-ttm",
  "ratios-ttm": "ratios-ttm",
  "income-statement-fy": "income-statement",
  "cash-flow-statement-fy": "cash-flow-statement",
};

function malformed(dataset: EquityFundamentalsDataset) {
  return new MarketDataError("MalformedProviderResponse", "Financial Modeling Prep returned malformed fundamentals.", { provider: FMP_PROVIDER_ID, dataset });
}

function row(payload: unknown, dataset: EquityFundamentalsDataset, symbol: string): Row {
  if (!Array.isArray(payload) || payload.length !== 1 || !payload[0] || typeof payload[0] !== "object" || Array.isArray(payload[0])) throw malformed(dataset);
  const value = payload[0] as Row;
  if (typeof value.symbol !== "string" || value.symbol.toUpperCase() !== symbol.toUpperCase()) throw malformed(dataset);
  return value;
}

function number(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function positive(value: unknown): number | null { const result = number(value); return result !== null && result > 0 ? result : null; }
function nonnegative(value: unknown): number | null { const result = number(value); return result !== null && result >= 0 ? result : null; }
function date(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}
function currency(value: unknown): Currency | null { return typeof value === "string" && currencies.includes(value as Currency) ? value as Currency : null; }

function fiscalRow(value: Row | null): Row | null {
  return value?.period === "FY" && date(value.date) && currency(value.reportedCurrency) ? value : null;
}

export class FmpEquityFundamentalsProvider implements EquityFundamentalsProvider {
  readonly providerId = FMP_PROVIDER_ID;
  constructor(private readonly client: FmpClient, private readonly clock: () => Date = () => new Date()) {}

  async getEquityFundamentals(instrument: Instrument): Promise<EquityFundamentalsSnapshot> {
    if (instrument.assetType !== "equity") throw new MarketDataError("UnsupportedInstrument", "Company fundamentals are available for equities only.", { instrumentId: instrument.instrumentId });
    const results = await Promise.allSettled(equityFundamentalsDatasets.map(async (dataset) => {
      const payload = await this.client.get(routes[dataset], { symbol: instrument.symbol, ...(dataset.endsWith("-fy") ? { limit: "1" } : {}) });
      return row(payload, dataset, instrument.symbol);
    }));
    const unavailableDatasets: EquityFundamentalsDataset[] = [];
    const rows = Object.fromEntries(results.map((result, index) => {
      const dataset = equityFundamentalsDatasets[index];
      if (result.status === "rejected") unavailableDatasets.push(dataset);
      return [dataset, result.status === "fulfilled" ? result.value : null];
    })) as Record<EquityFundamentalsDataset, Row | null>;
    if (unavailableDatasets.length === equityFundamentalsDatasets.length) {
      const first = results.find((result) => result.status === "rejected");
      if (first?.status === "rejected" && first.reason instanceof MarketDataError) throw first.reason;
      throw new MarketDataError("ProviderUnavailable", "Company fundamentals are unavailable.", { instrumentId: instrument.instrumentId });
    }
    const metrics = rows["key-metrics-ttm"];
    const ratios = rows["ratios-ttm"];
    const income = fiscalRow(rows["income-statement-fy"]);
    const cash = fiscalRow(rows["cash-flow-statement-fy"]);
    if (rows["income-statement-fy"] && !income) unavailableDatasets.push("income-statement-fy");
    if (rows["cash-flow-statement-fy"] && !cash) unavailableDatasets.push("cash-flow-statement-fy");
    const sameFiscalPeriod = Boolean(cash && (!income || income.date === cash.date && income.reportedCurrency === cash.reportedCurrency));
    if (cash && income && !sameFiscalPeriod) unavailableDatasets.push("cash-flow-statement-fy");
    const fiscalYearEnd = income ? date(income.date) : cash ? date(cash.date) : null;
    const reportingCurrency = income ? currency(income.reportedCurrency) : cash ? currency(cash.reportedCurrency) : null;
    const rawPe = number(ratios?.priceToEarningsRatioTTM);
    return {
      instrumentId: instrument.instrumentId,
      company: { sector: instrument.equityProfile?.sector ?? null, industry: instrument.equityProfile?.industry ?? null, country: instrument.equityProfile?.country ?? null },
      valuation: {
        marketCap: positive(instrument.equityProfile?.marketCap),
        peTtm: positive(rawPe),
        peTtmStatus: rawPe === null ? "unavailable" : rawPe <= 0 ? "not-meaningful" : "available",
        psTtm: positive(ratios?.priceToSalesRatioTTM),
        pbTtm: positive(ratios?.priceToBookRatioTTM),
        evToEbitdaTtm: positive(metrics?.evToEBITDATTM),
        priceToFcfTtm: positive(ratios?.priceToFreeCashFlowRatioTTM),
      },
      profitability: {
        grossMarginTtm: number(ratios?.grossProfitMarginTTM),
        operatingMarginTtm: number(ratios?.operatingProfitMarginTTM),
        netMarginTtm: number(ratios?.netProfitMarginTTM),
        roeTtm: number(metrics?.returnOnEquityTTM),
        roicTtm: number(metrics?.returnOnInvestedCapitalTTM),
      },
      financialHealth: {
        debtToEquityTtm: number(ratios?.debtToEquityRatioTTM),
        currentRatioTtm: nonnegative(ratios?.currentRatioTTM),
        netDebtToEbitdaTtm: number(metrics?.netDebtToEBITDATTM),
        // A negative ratio alone cannot distinguish net cash from negative EBITDA.
        netDebtToEbitdaIsNetCash: false,
      },
      businessPerformance: {
        fiscalYearEnd,
        filingDate: income ? date(income.filingDate) : cash ? date(cash.filingDate) : null,
        reportingCurrency,
        revenueFy: number(income?.revenue),
        netIncomeFy: number(income?.netIncome),
        freeCashFlowFy: sameFiscalPeriod ? number(cash?.freeCashFlow) : null,
        dilutedEpsFy: number(income?.epsDiluted),
      },
      provenance: { provider: this.providerId, retrievedAt: this.clock().toISOString(), isDeterministic: false, unavailableDatasets },
    };
  }
}

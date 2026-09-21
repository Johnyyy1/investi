import "server-only";

import type { EquityFundamentalsProvider, EquityFundamentalsSnapshot } from "../equity-fundamentals";
import type { Instrument } from "../contracts";
import { MarketDataError } from "../errors";
import { DETERMINISTIC_PROVIDER_ID, FIXTURE_RETRIEVED_AT } from "./fixtures";

type Figures = Pick<EquityFundamentalsSnapshot, "valuation" | "profitability" | "financialHealth" | "businessPerformance">;

// Educational fixtures, deliberately authored values rather than copied live company figures.
const figures: Record<string, Omit<Figures, "valuation"> & { valuation: Omit<Figures["valuation"], "marketCap"> }> = {
  "US-XNAS:AAPL": {
    valuation: { peTtm: 24.6, peTtmStatus: "available", psTtm: 6.8, pbTtm: 29.4, evToEbitdaTtm: 19.2, priceToFcfTtm: 26.1 },
    profitability: { grossMarginTtm: 0.432, operatingMarginTtm: 0.287, netMarginTtm: 0.231, roeTtm: 0.684, roicTtm: 0.348 },
    financialHealth: { debtToEquityTtm: 1.25, currentRatioTtm: 1.12, netDebtToEbitdaTtm: 0.42, netDebtToEbitdaIsNetCash: false },
    businessPerformance: { fiscalYearEnd: "2025-09-27", filingDate: "2025-10-30", reportingCurrency: "USD", revenueFy: 382_400_000_000, netIncomeFy: 88_600_000_000, freeCashFlowFy: 97_200_000_000, dilutedEpsFy: 5.88 },
  },
  "US-XNAS:MSFT": {
    valuation: { peTtm: 31.2, peTtmStatus: "available", psTtm: 10.4, pbTtm: 12.8, evToEbitdaTtm: 21.6, priceToFcfTtm: 34.2 },
    profitability: { grossMarginTtm: 0.688, operatingMarginTtm: 0.412, netMarginTtm: 0.351, roeTtm: 0.362, roicTtm: 0.271 },
    financialHealth: { debtToEquityTtm: 0.35, currentRatioTtm: 1.58, netDebtToEbitdaTtm: -0.24, netDebtToEbitdaIsNetCash: true },
    businessPerformance: { fiscalYearEnd: "2025-06-30", filingDate: "2025-07-30", reportingCurrency: "USD", revenueFy: 251_600_000_000, netIncomeFy: 88_300_000_000, freeCashFlowFy: 67_400_000_000, dilutedEpsFy: 11.82 },
  },
  "US-XNAS:NVDA": {
    valuation: { peTtm: 42.1, peTtmStatus: "available", psTtm: 18.4, pbTtm: 32.7, evToEbitdaTtm: 35.1, priceToFcfTtm: null },
    profitability: { grossMarginTtm: 0.715, operatingMarginTtm: 0.514, netMarginTtm: 0.471, roeTtm: 0.826, roicTtm: null },
    financialHealth: { debtToEquityTtm: 0.22, currentRatioTtm: 2.15, netDebtToEbitdaTtm: null, netDebtToEbitdaIsNetCash: false },
    businessPerformance: { fiscalYearEnd: "2025-01-26", filingDate: "2025-02-25", reportingCurrency: "USD", revenueFy: 116_800_000_000, netIncomeFy: 52_100_000_000, freeCashFlowFy: null, dilutedEpsFy: 2.1 },
  },
};

export class DeterministicEquityFundamentalsProvider implements EquityFundamentalsProvider {
  readonly providerId = DETERMINISTIC_PROVIDER_ID;
  constructor(private readonly clock: () => Date = () => new Date(FIXTURE_RETRIEVED_AT)) {}

  async getEquityFundamentals(instrument: Instrument): Promise<EquityFundamentalsSnapshot> {
    const sample = figures[instrument.instrumentId];
    if (instrument.assetType !== "equity" || !sample) throw new MarketDataError("ProviderUnavailable", "Sample equity fundamentals are unavailable.", { instrumentId: instrument.instrumentId });
    return {
      instrumentId: instrument.instrumentId,
      company: { sector: instrument.equityProfile?.sector ?? null, industry: instrument.equityProfile?.industry ?? null, country: instrument.equityProfile?.country ?? null },
      valuation: { marketCap: instrument.equityProfile?.marketCap ?? null, ...sample.valuation },
      profitability: { ...sample.profitability },
      financialHealth: { ...sample.financialHealth },
      businessPerformance: { ...sample.businessPerformance },
      provenance: { provider: this.providerId, retrievedAt: this.clock().toISOString(), isDeterministic: true, unavailableDatasets: [] },
    };
  }
}

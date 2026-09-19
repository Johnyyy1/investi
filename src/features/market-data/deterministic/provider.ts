import "server-only";

import {
  adjustmentPolicies,
  type CorporateActionsRequest,
  type Currency,
  type HistoricalPricePoint,
  type HistoricalPriceRequest,
  type InstrumentId,
  type MarketDataProvenance,
  type UtcTimestamp,
} from "../contracts";
import { instrumentNotFound, MarketDataError } from "../errors";
import type { MarketDataProvider } from "../provider";
import {
  DETERMINISTIC_DATASET,
  DETERMINISTIC_PROVIDER_ID,
  deterministicCorporateActions,
  deterministicFxRates,
  deterministicHistory,
  deterministicInstruments,
  deterministicPrices,
  FIXTURE_OBSERVED_AT,
  FIXTURE_RETRIEVED_AT,
} from "./fixtures";

export type MarketDataClock = () => Date;

function utcTimestamp(clock: MarketDataClock): UtcTimestamp {
  return clock().toISOString();
}

function provenance(
  retrievedAt: UtcTimestamp,
  observedAt: UtcTimestamp,
  adjustmentMode: MarketDataProvenance["adjustmentMode"],
  completeness: MarketDataProvenance["completeness"] = "complete",
): MarketDataProvenance {
  return {
    provider: DETERMINISTIC_PROVIDER_ID,
    dataset: DETERMINISTIC_DATASET,
    dataKind: "synthetic",
    isDeterministic: true,
    isDemo: true,
    observedAt,
    retrievedAt,
    adjustmentMode,
    completeness,
  };
}

function clonePoint(point: HistoricalPricePoint, splitAdjusted: boolean): HistoricalPricePoint {
  return { ...point, ...(splitAdjusted ? { adjustedClose: point.close } : {}) };
}

export class DeterministicMarketDataProvider implements MarketDataProvider {
  readonly providerId = DETERMINISTIC_PROVIDER_ID;

  constructor(private readonly clock: MarketDataClock = () => new Date(FIXTURE_RETRIEVED_AT)) {}

  async searchInstruments(query: string) {
    const normalized = query.trim().toLocaleLowerCase("en-US");
    if (!normalized) return [];
    return deterministicInstruments
      .map((instrument, fixtureOrder) => {
        const symbol = instrument.symbol.toLocaleLowerCase("en-US");
        const name = instrument.name.toLocaleLowerCase("en-US");
        const rank = symbol === normalized ? 0 : symbol.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3;
        return { instrument, fixtureOrder, rank };
      })
      .filter(({ rank }) => rank < 3)
      .sort((a, b) => a.rank - b.rank || a.fixtureOrder - b.fixtureOrder)
      .map(({ instrument }) => ({
        ...instrument,
        exchangeCode: instrument.exchangeMic,
        provider: this.providerId,
        providerSymbol: instrument.symbol,
      }));
  }

  async getInstrumentMetadata(instrumentId: InstrumentId) {
    const instrument = deterministicInstruments.find((candidate) => candidate.instrumentId === instrumentId);
    if (!instrument) throw instrumentNotFound(instrumentId);
    return { ...instrument };
  }

  async getQuote(instrumentId: InstrumentId) {
    const instrument = await this.getInstrumentMetadata(instrumentId);
    const price = deterministicPrices[instrumentId];
    if (price === undefined) {
      throw new MarketDataError("QuoteUnavailable", "No deterministic quote is available for this instrument.", { instrumentId });
    }
    const retrievedAt = utcTimestamp(this.clock);
    return {
      instrumentId,
      price,
      currency: instrument.quoteCurrency,
      observedAt: FIXTURE_OBSERVED_AT,
      retrievedAt,
      provenance: provenance(retrievedAt, FIXTURE_OBSERVED_AT, null),
    };
  }

  async getHistoricalPrices(request: HistoricalPriceRequest) {
    const instrument = await this.getInstrumentMetadata(request.instrumentId);
    if (request.adjustment.mode === "total-return") {
      throw new MarketDataError("UnsupportedAdjustment", "The deterministic dataset does not provide total-return history.", { instrumentId: request.instrumentId, mode: request.adjustment.mode });
    }
    const fixture = deterministicHistory[request.instrumentId];
    if (!fixture) {
      throw new MarketDataError("HistoricalDataUnavailable", "No deterministic history is available for this instrument.", { instrumentId: request.instrumentId });
    }
    const points = fixture.points
      .filter(({ date }) => date >= request.startDate && date <= request.endDate)
      .map((point) => clonePoint(point, request.adjustment.mode === "split-adjusted"));
    if (points.length === 0) {
      throw new MarketDataError("HistoricalDataUnavailable", "No observations exist in the requested date range.", { instrumentId: request.instrumentId, startDate: request.startDate, endDate: request.endDate });
    }
    const firstAvailable = fixture.points[0].date;
    const lastAvailable = fixture.points.at(-1)!.date;
    const completeness = fixture.completeness === "partial" || request.startDate < firstAvailable || request.endDate > lastAvailable ? "partial" : "complete";
    const retrievedAt = utcTimestamp(this.clock);
    const observedAt = `${points.at(-1)!.date}T00:00:00.000Z`;
    return {
      instrumentId: request.instrumentId,
      currency: instrument.quoteCurrency,
      interval: "daily" as const,
      timeZone: "UTC" as const,
      adjustment: adjustmentPolicies[request.adjustment.mode],
      points,
      provenance: provenance(retrievedAt, observedAt, request.adjustment.mode, completeness),
    };
  }

  async getFxRate(baseCurrency: Currency, quoteCurrency: Currency, asOf: UtcTimestamp) {
    const rate = deterministicFxRates[`${baseCurrency}:${quoteCurrency}`];
    if (rate === undefined || Date.parse(asOf) < Date.parse(FIXTURE_OBSERVED_AT)) {
      throw new MarketDataError("FxUnavailable", "The requested deterministic FX pair is unavailable.", { baseCurrency, quoteCurrency, asOf });
    }
    const retrievedAt = utcTimestamp(this.clock);
    return {
      baseCurrency,
      quoteCurrency,
      rate,
      observedAt: FIXTURE_OBSERVED_AT,
      retrievedAt,
      provenance: provenance(retrievedAt, FIXTURE_OBSERVED_AT, null),
    };
  }

  async getCorporateActions(request: CorporateActionsRequest) {
    await this.getInstrumentMetadata(request.instrumentId);
    const retrievedAt = utcTimestamp(this.clock);
    const actions = deterministicCorporateActions
      .filter((action) => action.instrumentId === request.instrumentId && action.exDate >= request.startDate && action.exDate <= request.endDate)
      .map((action) => ({ ...action }));
    return {
      instrumentId: request.instrumentId,
      actions,
      provenance: provenance(retrievedAt, actions.at(-1)?.exDate ? `${actions.at(-1)!.exDate}T00:00:00.000Z` : FIXTURE_OBSERVED_AT, null),
    };
  }
}

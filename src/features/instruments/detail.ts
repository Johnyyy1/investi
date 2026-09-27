import "server-only";

import { isMarketDataError } from "@/features/market-data/errors";
import type { HistoricalPricePoint, Instrument, Quote } from "@/features/market-data/contracts";
import type { MarketDataService } from "@/features/market-data/service";
import type { EquityFundamentalsSnapshot } from "@/features/market-data/equity-fundamentals";
import type { EtfAnalyticsSnapshot } from "@/features/market-data/etf-analytics";
import { chartPoints, historicalRequest, type ChartRange } from "./history";

export type InstrumentDetail = {
  instrument: Instrument | null;
  quote: Quote | null;
  points: HistoricalPricePoint[];
  quoteMessage: string | null;
  historyMessage: string | null;
  metadataMessage: string | null;
  startDate: string;
  endDate: string;
  historyPartial: boolean;
  fundamentals: EquityFundamentalsSnapshot | null;
  fundamentalsMessage: string | null;
  etfAnalytics: EtfAnalyticsSnapshot | null;
  etfAnalyticsMessage: string | null;
};

function safeMessage(error: unknown, subject: "instrument" | "quote" | "history") {
  if (isMarketDataError(error) && error.code === "RateLimited") return "Tržní data jsou dočasně omezená. Zkus to za chvíli znovu.";
  if (subject === "instrument") return "Tento instrument není z dostupného zdroje tržních dat k dispozici.";
  if (subject === "quote") return "Aktuální tržní cena není dostupná.";
  return "Cenová historie pro toto období není dostupná.";
}

export async function loadInstrumentDetail(service: MarketDataService, instrumentId: string, range: ChartRange, now: Date): Promise<InstrumentDetail> {
  const request = historicalRequest(instrumentId, range, now);
  let instrument: Instrument;
  try { instrument = await service.getInstrumentMetadata(instrumentId); }
  catch (error) { return { instrument: null, quote: null, points: [], metadataMessage: safeMessage(error, "instrument"), quoteMessage: null, historyMessage: null, startDate: request.startDate, endDate: request.endDate, historyPartial: false, fundamentals: null, fundamentalsMessage: null, etfAnalytics: null, etfAnalyticsMessage: null }; }

  const [quoteResult, historyResult, fundamentalsResult, etfResult] = await Promise.allSettled([
    service.getQuote(instrumentId),
    service.getHistoricalPrices(request),
    instrument.assetType === "equity" ? service.getEquityFundamentals(instrumentId) : Promise.resolve(null),
    instrument.assetType === "etf" ? service.getEtfAnalytics(instrumentId) : Promise.resolve(null),
  ]);
  const quote = quoteResult.status === "fulfilled" && quoteResult.value.instrumentId === instrumentId && quoteResult.value.currency === instrument.quoteCurrency ? quoteResult.value : null;
  const series = historyResult.status === "fulfilled" ? historyResult.value : null;
  const points = series && series.instrumentId === instrumentId && series.currency === instrument.quoteCurrency
    ? chartPoints(series, request.startDate, request.endDate) : [];
  return {
    instrument,
    quote,
    points,
    metadataMessage: null,
    quoteMessage: quote ? null : safeMessage(quoteResult.status === "rejected" ? quoteResult.reason : null, "quote"),
    historyMessage: points.length ? null : safeMessage(historyResult.status === "rejected" ? historyResult.reason : null, "history"),
    startDate: request.startDate,
    endDate: request.endDate,
    historyPartial: series?.provenance.completeness === "partial",
    fundamentals: fundamentalsResult.status === "fulfilled" ? fundamentalsResult.value : null,
    fundamentalsMessage: instrument.assetType === "equity" && fundamentalsResult.status === "rejected" ? "Metriky společnosti teď nejsou dostupné. Cenová historie a investování zůstávají k dispozici." : null,
    etfAnalytics: etfResult.status === "fulfilled" ? etfResult.value : null,
    etfAnalyticsMessage: instrument.assetType === "etf" && etfResult.status === "rejected" ? "Složení fondu teď není dostupné. Cenová historie a investování zůstávají k dispozici." : null,
  };
}

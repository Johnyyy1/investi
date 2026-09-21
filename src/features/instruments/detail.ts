import "server-only";

import { isMarketDataError } from "@/features/market-data/errors";
import type { Instrument, Quote } from "@/features/market-data/contracts";
import type { MarketDataService } from "@/features/market-data/service";
import { chartPoints, historicalRequest, type ChartRange } from "./history";

export type InstrumentDetail = {
  instrument: Instrument | null;
  quote: Quote | null;
  points: { date: string; close: number }[];
  quoteMessage: string | null;
  historyMessage: string | null;
  metadataMessage: string | null;
  startDate: string;
  endDate: string;
  historyPartial: boolean;
};

function safeMessage(error: unknown, subject: "instrument" | "quote" | "history") {
  if (isMarketDataError(error) && error.code === "RateLimited") return "Market data is temporarily rate limited. Please try again shortly.";
  if (subject === "instrument") return "This instrument is not available from the configured market-data source.";
  if (subject === "quote") return "The current market price is unavailable.";
  return "Price history is not available for this range.";
}

export async function loadInstrumentDetail(service: MarketDataService, instrumentId: string, range: ChartRange, now: Date): Promise<InstrumentDetail> {
  const request = historicalRequest(instrumentId, range, now);
  let instrument: Instrument;
  try { instrument = await service.getInstrumentMetadata(instrumentId); }
  catch (error) { return { instrument: null, quote: null, points: [], metadataMessage: safeMessage(error, "instrument"), quoteMessage: null, historyMessage: null, startDate: request.startDate, endDate: request.endDate, historyPartial: false }; }

  const [quoteResult, historyResult] = await Promise.allSettled([
    service.getQuote(instrumentId),
    service.getHistoricalPrices(request),
  ]);
  const quote = quoteResult.status === "fulfilled" && quoteResult.value.instrumentId === instrumentId && quoteResult.value.currency === instrument.quoteCurrency ? quoteResult.value : null;
  const series = historyResult.status === "fulfilled" ? historyResult.value : null;
  const points = series && series.instrumentId === instrumentId && series.currency === instrument.quoteCurrency
    ? chartPoints(series, request.startDate, request.endDate).map(({ date, close }) => ({ date, close })) : [];
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
  };
}

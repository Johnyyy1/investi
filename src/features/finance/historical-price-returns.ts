import type { CalendarDate, HistoricalPriceRequest, HistoricalSeries } from "@/features/market-data/contracts";
import { simpleReturn } from "./returns";

export type HistoricalReturnObservation = {
  startDate: CalendarDate;
  endDate: CalendarDate;
  startClose: number;
  endClose: number;
  /** Unrounded decimal simple price return; 0.03 means 3%. */
  returnValue: number;
  elapsedCalendarDays: number;
  /** No calendar dates between endpoints, or an unclassified multi-day gap. Neither asserts session coverage. */
  gapClassification: "none" | "unknown";
};

export type HistoricalReturnMetadata = Omit<HistoricalSeries, "points"> & {
  /** The original canonical request, when available; never inferred from actual endpoints. */
  request: HistoricalPriceRequest | null;
  actualRange: Pick<HistoricalPriceRequest, "startDate" | "endDate"> | null;
  observationCount: number;
  returnCount: number;
};

export type HistoricalReturnError =
  | "unsupported-basis"
  | "incompatible-metadata"
  | "invalid-request-range"
  | "outside-request-range"
  | "invalid-date"
  | "duplicate-date"
  | "unsorted-date"
  | "invalid-close"
  | "non-finite-return";

export type HistoricalPriceReturnsResult =
  | { status: "ok"; observations: readonly HistoricalReturnObservation[]; metadata: HistoricalReturnMetadata }
  | { status: "insufficient-data"; observations: readonly []; metadata: HistoricalReturnMetadata }
  | { status: "invalid-data"; reason: HistoricalReturnError; index?: number; date?: CalendarDate };

/** Strict canonical daily dates, with no normalization of impossible dates or intraday timestamps. */
function calendarMilliseconds(date: CalendarDate): number {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const milliseconds = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString().slice(0, 10) === date ? milliseconds : NaN;
}

/**
 * Pure consumer of normalized history. Only daily UTC split-adjusted price returns
 * are supported. Uses close, never adjustedClose; does not validate unrelated OHLC
 * fields or perform provider normalization. Row-level identity/currency/basis are
 * not representable in HistoricalSeries: every point inherits the enclosing basis.
 *
 * Invalid data wins over insufficiency. No sorting, filling, coercion, mutation or
 * partial success. Source completeness is retained, not interpreted as evidence
 * of exchange sessions (HistoricalSeries carries no historical session calendar).
 */
export function historicalPriceReturns(series: HistoricalSeries, request?: HistoricalPriceRequest): HistoricalPriceReturnsResult {
  const invalid = (reason: HistoricalReturnError, index?: number): HistoricalPriceReturnsResult => ({
    status: "invalid-data", reason,
    ...(index === undefined ? {} : { index, date: series.points[index].date }),
  });
  const { instrumentId, currency, interval, timeZone, adjustment, provenance, points } = series;
  if (interval !== "daily" || timeZone !== "UTC" || adjustment.mode !== "split-adjusted" || adjustment.splitTreatment !== "adjusted" || adjustment.dividendTreatment !== "excluded") {
    return invalid("unsupported-basis");
  }
  if (provenance.adjustmentMode !== adjustment.mode) return invalid("incompatible-metadata");
  if (request) {
    if (request.instrumentId !== instrumentId || request.interval !== interval || request.timeZone !== timeZone || request.adjustment.mode !== adjustment.mode || request.adjustment.splitTreatment !== adjustment.splitTreatment || request.adjustment.dividendTreatment !== adjustment.dividendTreatment) {
      return invalid("incompatible-metadata");
    }
    if (!Number.isFinite(calendarMilliseconds(request.startDate)) || !Number.isFinite(calendarMilliseconds(request.endDate)) || request.startDate > request.endDate) {
      return invalid("invalid-request-range");
    }
  }

  const dates: number[] = [];
  const seenDates = new Set<CalendarDate>();
  for (const [index, point] of points.entries()) {
    const milliseconds = calendarMilliseconds(point.date);
    if (!Number.isFinite(milliseconds)) return invalid("invalid-date", index);
    if (seenDates.has(point.date)) return invalid("duplicate-date", index);
    if (index > 0 && milliseconds < dates[index - 1]) return invalid("unsorted-date", index);
    if (!Number.isFinite(point.close) || point.close <= 0) return invalid("invalid-close", index);
    if (request && (point.date < request.startDate || point.date > request.endDate)) return invalid("outside-request-range", index);
    dates.push(milliseconds);
    seenDates.add(point.date);
  }

  const metadata: HistoricalReturnMetadata = {
    instrumentId, currency, interval, timeZone, adjustment, provenance,
    request: request ?? null,
    actualRange: points.length ? { startDate: points[0].date, endDate: points[points.length - 1].date } : null,
    observationCount: points.length, returnCount: Math.max(0, points.length - 1),
  };
  if (points.length < 2) return { status: "insufficient-data", observations: [], metadata };

  const observations: HistoricalReturnObservation[] = [];
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const returnValue = simpleReturn(start.close, end.close);
    if (!Number.isFinite(returnValue)) return invalid("non-finite-return", index);
    const elapsedCalendarDays = (dates[index] - dates[index - 1]) / 86_400_000;
    observations.push({
      startDate: start.date, endDate: end.date, startClose: start.close, endClose: end.close,
      returnValue, elapsedCalendarDays, gapClassification: elapsedCalendarDays === 1 ? "none" : "unknown",
    });
  }
  return { status: "ok", observations, metadata };
}

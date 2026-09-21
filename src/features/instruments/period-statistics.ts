export type PriceObservation = { date: string; close: number };

export function periodReturnLabel(range: string) { return `${range} price return`; }

export type PeriodStatistics = {
  start: PriceObservation;
  end: PriceObservation;
  change: number | null;
  returnPercent: number | null;
  low: number;
  high: number;
  observationCount: number;
};

/** Statistics describe available split-adjusted closing prices, never total return. */
export function periodStatistics(points: readonly PriceObservation[] | null | undefined): PeriodStatistics | null {
  if (!points?.length) return null;
  let previousDate = "";
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const parsed = new Date(`${point.date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== point.date || point.date <= previousDate || !Number.isFinite(point.close) || point.close <= 0) return null;
    previousDate = point.date;
    low = Math.min(low, point.close);
    high = Math.max(high, point.close);
  }
  const start = points[0];
  const end = points[points.length - 1];
  const change = points.length > 1 ? end.close - start.close : null;
  const returnPercent = points.length > 1 ? (end.close / start.close - 1) * 100 : null;
  return { start, end, change, returnPercent, low, high, observationCount: points.length };
}

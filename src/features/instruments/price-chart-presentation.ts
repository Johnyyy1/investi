import type { HistoricalPricePoint } from "@/features/market-data/contracts";
import type { ChartRange } from "./history";
import type { PriceObservation } from "./period-statistics";

export type ChartTone = "positive" | "negative" | "neutral";
export type CandleInterval = "daily" | "weekly" | "monthly" | "quarterly";
export type Candle = Pick<HistoricalPricePoint, "open" | "high" | "low" | "close"> & {
  date: string;
  periodStart: string;
  periodEnd: string;
  observationCount: number;
};

export function chartTone(returnPercent: number | null | undefined): ChartTone {
  return returnPercent === null || returnPercent === undefined || returnPercent === 0
    ? "neutral" : returnPercent > 0 ? "positive" : "negative";
}

export function hasCandlestickData(points: readonly PriceObservation[]): points is readonly HistoricalPricePoint[] {
  return points.length >= 2 && points.every((point) => {
    const candle = point as Partial<HistoricalPricePoint>;
    const { open, high, low, close } = candle;
    if (typeof open !== "number" || typeof high !== "number" || typeof low !== "number" || typeof close !== "number") return false;
    return [open, high, low, close].every((value) => Number.isFinite(value) && value > 0)
      && low <= Math.min(open, close)
      && high >= Math.max(open, close);
  }) && points.filter((point) => (point as HistoricalPricePoint).high > (point as HistoricalPricePoint).low).length >= 2;
}

/** Use calendar bars across the full selected horizon. Very long Max histories use quarters. */
export function candleInterval(range: ChartRange, points: readonly PriceObservation[]): CandleInterval {
  if (range === "1M") return "daily";
  if (range === "3M") return points.length > 90 ? "weekly" : "daily";
  if (range === "6M" || range === "YTD" || range === "1Y") return "weekly";
  if (range === "5Y") return "monthly";
  if (!points.length) return "monthly";
  const first = points[0].date;
  const last = points[points.length - 1].date;
  const months = (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(last.slice(5, 7)) - Number(first.slice(5, 7)) + 1;
  return months > 180 ? "quarterly" : "monthly";
}

/** Weeks start on Monday in UTC. Empty calendar periods produce no bar. */
function bucket(date: string, interval: CandleInterval): { key: string; start: string; end: string } {
  if (interval === "daily") return { key: date, start: date, end: date };
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (interval === "monthly" || interval === "quarterly") {
    const firstMonth = interval === "monthly" ? month - 1 : Math.floor((month - 1) / 3) * 3;
    const lastMonth = firstMonth + (interval === "monthly" ? 1 : 3);
    return {
      key: `${year}-${String(firstMonth + 1).padStart(2, "0")}`,
      start: new Date(Date.UTC(year, firstMonth, 1)).toISOString().slice(0, 10),
      end: new Date(Date.UTC(year, lastMonth, 0)).toISOString().slice(0, 10),
    };
  }
  const day = new Date(`${date}T00:00:00.000Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  const start = day.toISOString().slice(0, 10);
  day.setUTCDate(day.getUTCDate() + 6);
  return { key: start, start, end: day.toISOString().slice(0, 10) };
}

export function aggregateCandles(points: readonly HistoricalPricePoint[], interval: CandleInterval): Candle[] {
  const bars: Candle[] = [];
  let previousKey = "";
  for (const point of points) {
    const period = bucket(point.date, interval);
    const last = bars[bars.length - 1];
    if (last && previousKey === period.key) {
      last.high = Math.max(last.high, point.high);
      last.low = Math.min(last.low, point.low);
      last.close = point.close;
      last.observationCount++;
    } else {
      bars.push({ date: period.start, periodStart: period.start, periodEnd: period.end, open: point.open, high: point.high, low: point.low, close: point.close, observationCount: 1 });
      previousKey = period.key;
    }
  }
  return bars;
}

/** The viewport is an index interval in the original daily observations. */
export function viewportPoints<T>(points: readonly T[], start: number, end: number): readonly T[] {
  return points.slice(start, end + 1);
}

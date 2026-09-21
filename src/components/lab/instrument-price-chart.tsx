"use client";

import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartRanges, type ChartRange } from "@/features/instruments/history";
import { periodReturnLabel, periodStatistics, type PriceObservation } from "@/features/instruments/period-statistics";
import { instrumentDetailHref } from "@/features/instruments/routes";
import type { Currency } from "@/features/market-data/contracts";

function price(value: number, currency: Currency) {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value)} ${currency}`;
}
function dateLabel(value: string, year = true) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}
function signed(value: number, suffix: string, maximumDigits = 2) {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: maximumDigits }).format(value)}${suffix}`;
}

export function InstrumentPriceChart({ instrumentId, range, points, currency, message, partial }: { instrumentId: string; range: ChartRange; points: PriceObservation[]; currency: Currency; message: string | null; partial: boolean }) {
  const period = periodStatistics(points);
  const padding = period ? Math.max((period.high - period.low) * 0.12, period.high * 0.015) : 0;
  const axisDomain: [number, number] = period ? [Math.max(0, period.low - padding), period.high + padding] : [0, 1];
  return <section aria-labelledby="price-history-heading" className="min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="price-history-heading" className="text-section-title font-bold">Price history</h2><p className="mt-1 text-small text-secondary">Daily split-adjusted closing price · {currency}</p></div>
      <nav aria-label="Price history timeframe" className="flex max-w-full flex-wrap gap-1 text-small">
        {chartRanges.map((option) => <Link key={option} href={`${instrumentDetailHref(instrumentId)}?range=${option}`} aria-current={range === option ? "page" : undefined} className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-control px-2.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${range === option ? "bg-primary-soft text-primary-hover" : "text-secondary hover:bg-surface-muted hover:text-foreground"}`}>{option}</Link>)}
      </nav>
    </div>
    {period ? <>
      <div className="mt-6 grid gap-x-8 gap-y-3 border-y border-border py-4 text-small sm:grid-cols-2">
        <p><span className="text-secondary">Started · {dateLabel(period.start.date)}</span><strong className="ml-2 inline-block font-bold tabular-nums">{price(period.start.close, currency)}</strong></p>
        <p className="sm:text-right"><span className="text-secondary">Ended · {dateLabel(period.end.date)}</span><strong className="ml-2 inline-block font-bold tabular-nums">{price(period.end.close, currency)}</strong></p>
      </div>
      <div role="img" aria-label={`${range} daily split-adjusted closing price chart for ${currency}. ${period.observationCount} observations from ${dateLabel(period.start.date)} to ${dateLabel(period.end.date)}. First ${price(period.start.close, currency)}; last ${price(period.end.close, currency)}. Period low ${price(period.low, currency)}; period high ${price(period.high, currency)}.`} className="mt-5 h-60 min-w-0 max-w-full overflow-hidden sm:h-72 lg:h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={points} accessibilityLayer margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 4" />
          <XAxis dataKey="date" tickFormatter={(value: string) => dateLabel(value, false)} minTickGap={48} interval="preserveStartEnd" tickLine={false} axisLine={false} tick={{ fill: "var(--color-secondary)", fontSize: 11 }} />
          <YAxis domain={axisDomain} width={66} tickCount={5} tickLine={false} axisLine={false} tick={{ fill: "var(--color-secondary)", fontSize: 11 }} tickFormatter={(value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} />
          <Tooltip labelFormatter={(value) => dateLabel(String(value))} formatter={(value) => [price(Number(value), currency), "Close"]} contentStyle={{ border: "1px solid var(--color-border)", borderRadius: "0.75rem", background: "var(--color-surface)", color: "var(--color-foreground)" }} />
          <Area type="linear" dataKey="close" stroke="var(--color-primary-hover)" strokeWidth={2.5} fill="var(--color-primary-soft)" fillOpacity={0.48} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <ReferenceDot x={period.end.date} y={period.end.close} r={4} fill="var(--color-primary-hover)" stroke="var(--color-surface)" strokeWidth={2} ifOverflow="visible" />
        </AreaChart></ResponsiveContainer>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-5 text-small sm:grid-cols-4">
        <div><dt className="text-secondary">{periodReturnLabel(range)}</dt><dd className={`mt-1 font-bold tabular-nums ${period.returnPercent !== null && period.returnPercent > 0 ? "text-success-ink" : period.returnPercent !== null && period.returnPercent < 0 ? "text-danger-ink" : ""}`}>{period.returnPercent === null ? "Unavailable" : signed(period.returnPercent, "%")}</dd></div>
        <div><dt className="text-secondary">Price change</dt><dd className="mt-1 font-bold tabular-nums">{period.change === null ? "Unavailable" : signed(period.change, ` ${currency}`, 4)}</dd></div>
        <div><dt className="text-secondary">Period low</dt><dd className="mt-1 font-bold tabular-nums">{price(period.low, currency)}</dd></div>
        <div><dt className="text-secondary">Period high</dt><dd className="mt-1 font-bold tabular-nums">{price(period.high, currency)}</dd></div>
      </dl>
      {period.observationCount === 1 || partial ? <p className="mt-4 text-microcopy text-secondary">{period.observationCount === 1 ? "Only one closing price is available; a period return cannot be calculated." : "Available observations only; missing days are not filled."}</p> : null}
      <details className="mt-3 text-small"><summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-hover">View price data</summary><div className="max-h-72 overflow-y-auto" tabIndex={0} aria-label="Daily closing price data"><table className="w-full text-left tabular-nums"><caption className="sr-only">Daily split-adjusted closing prices in {currency}</caption><thead><tr><th scope="col" className="py-2">Date</th><th scope="col" className="py-2 text-right">Close</th></tr></thead><tbody>{points.map((point) => <tr key={point.date} className="border-t border-border"><th scope="row" className="py-2 font-normal">{dateLabel(point.date)}</th><td className="py-2 text-right">{price(point.close, currency)}</td></tr>)}</tbody></table></div></details>
    </> : <div role="status" className="flex min-h-52 items-center justify-center px-4 text-center text-small text-secondary">{message ?? "Price history is not available for this range."}</div>}
  </section>;
}

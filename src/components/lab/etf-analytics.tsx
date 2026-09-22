import { CircleHelp } from "lucide-react";
import type { Currency } from "@/features/market-data/contracts";
import type { EtfAllocation, EtfAnalyticsSnapshot, EtfDataset, EtfHolding } from "@/features/market-data/etf-analytics";
import { etfConcentration, formatEtfPercent, sortedHoldings } from "@/features/instruments/etf-presentation";

function magnitude(value: number | null, currency: Currency | null) {
  if (value === null) return "—";
  const scale = value >= 1e12 ? [1e12, "T"] as const : value >= 1e9 ? [1e9, "B"] as const : value >= 1e6 ? [1e6, "M"] as const : [1, ""] as const;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value / scale[0])}${scale[1]} ${currency ?? "· currency not supplied"}`;
}
function money(value: number | null, currency: Currency | null) {
  return value === null || currency === null ? "—" : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}
function metric(label: string, value: string, explanation: string) {
  return <div key={label} className="min-w-0 py-2"><dt className="min-w-0 break-words text-small text-secondary">{label} <details className="inline-block align-middle"><summary aria-label={`About ${label}`} className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm text-primary-hover focus-visible:outline-2 focus-visible:outline-primary"><CircleHelp aria-hidden="true" className="size-4" /></summary><p className="mt-1 max-w-[24rem] break-words text-microcopy leading-relaxed text-secondary">{explanation}</p></details></dt><dd className="mt-1 break-words text-card-title font-bold tabular-nums">{value}</dd></div>;
}
function unavailable() { return <p role="status" className="mt-4 text-small text-secondary">Latest available data is unavailable from this source.</p>; }
function freshness<T>(dataset: EtfDataset<T>) {
  return <p className="mt-3 text-microcopy text-secondary">{dataset.isDeterministic ? "Sample data" : "Latest available data"}{dataset.asOf ? ` · Source updated ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(dataset.asOf))}` : " · Source date not supplied"}{dataset.completeness === "partial" ? " · Some rows could not be used" : ""}</p>;
}
function WeightBar({ weight, max }: { weight: number; max: number }) {
  return <div aria-hidden="true" className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary/75" style={{ width: `${Math.min(100, max > 0 ? weight / max * 100 : 0)}%` }} /></div>;
}
function exposure(title: string, id: string, explanation: string, dataset: EtfDataset<readonly EtfAllocation[]> | null) {
  const rows = dataset ? [...dataset.value].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name)) : [];
  const max = rows[0]?.weight ?? 0;
  return <section aria-labelledby={id} className="min-w-0 border-t border-border pt-6"><h3 id={id} className="text-card-title font-bold">{title}</h3><p className="mt-1 text-small text-secondary">{explanation}</p>{rows.length ? <ul className="mt-4 divide-y divide-border/70">{rows.map((row) => <li key={row.name} className="min-w-0 py-2.5"><div className="flex min-w-0 items-baseline justify-between gap-3 text-small"><span className="min-w-0 break-words font-semibold">{row.name}</span><span className="shrink-0 tabular-nums">{formatEtfPercent(row.weight)}</span></div><WeightBar weight={row.weight} max={max} /></li>)}</ul> : unavailable()}{dataset ? freshness(dataset) : null}</section>;
}
function topHoldings(dataset: EtfAnalyticsSnapshot["holdings"], reportedTotal: number | null) {
  const all = dataset ? sortedHoldings(dataset.value.rows) : [];
  const rows = all.slice(0, 10);
  const max = rows[0]?.weight ?? 0;
  const concentration = dataset ? etfConcentration(dataset.value) : null;
  return <section aria-labelledby="etf-holdings-heading" className="min-w-0 border-t border-border pt-6"><h3 id="etf-holdings-heading" className="text-card-title font-bold">Top holdings</h3><p className="mt-1 text-small text-secondary">Largest reported positions by portfolio weight. Bars are scaled to the largest shown.</p>{rows.length ? <><dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-3 border-y border-border py-4 text-small sm:grid-cols-3"><div><dt className="text-secondary">Largest holding</dt><dd className="mt-1 font-bold tabular-nums">{formatEtfPercent(concentration!.largestWeight)}</dd></div><div><dt className="text-secondary">Top 10 concentration <details className="inline-block align-middle"><summary aria-label="About top 10 concentration" className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm text-primary-hover focus-visible:outline-2 focus-visible:outline-primary"><CircleHelp aria-hidden="true" className="size-4" /></summary><p className="mt-1 break-words text-microcopy font-normal text-secondary">Share of the fund represented by its ten largest reported holdings.</p></details></dt><dd className="mt-1 font-bold tabular-nums">{formatEtfPercent(concentration!.topTenWeight)}</dd></div><div><dt className="text-secondary">Holdings returned</dt><dd className="mt-1 font-bold tabular-nums">{concentration!.returnedCount}{reportedTotal !== null ? ` · ${reportedTotal.toLocaleString("en-US")} reported total` : " · total unknown"}</dd></div></dl><ol className="mt-2 divide-y divide-border/70">{rows.map((row: EtfHolding, index) => <li key={`${row.isin ?? row.symbol ?? row.name}-${index}`} className="min-w-0 py-3"><div className="flex min-w-0 items-start justify-between gap-3 text-small"><div className="min-w-0"><p className="break-words font-semibold">{row.name}</p>{row.symbol ? <p className="mt-0.5 break-all text-microcopy text-secondary">{row.symbol}</p> : null}</div><span className="shrink-0 font-bold tabular-nums">{formatEtfPercent(row.weight)}</span></div><WeightBar weight={row.weight} max={max} /></li>)}</ol></> : unavailable()}{dataset ? freshness(dataset) : null}</section>;
}

export function EtfAnalytics({ snapshot, message }: { snapshot: EtfAnalyticsSnapshot | null; message: string | null }) {
  const info = snapshot?.info;
  const value = info?.value;
  return <div className="mt-8 space-y-8" data-testid="etf-analytics"><section aria-labelledby="etf-overview-heading" className="border-t border-border pt-7"><div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="etf-overview-heading" className="text-section-title font-bold">Fund overview</h2><p className="text-microcopy text-secondary">Portfolio composition · latest available data</p></div>{value ? <><dl className="mt-4 grid grid-cols-1 gap-x-6 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">{metric("Expense ratio", formatEtfPercent(value.expenseRatio, 2), "Annual fund operating costs as a percentage of assets.")}{metric("AUM", magnitude(value.assetsUnderManagement, value.assetsCurrency), "Total assets managed by the fund. The source may omit its currency.")}{metric("NAV", money(value.nav, value.navCurrency), "Per-share value of the fund’s underlying assets. This differs from its market price.")}{metric("Holdings", value.holdingsCount?.toLocaleString("en-US") ?? "—", "Provider-reported total number of holdings, when available.")}{metric("Inception", value.inceptionDate?.slice(0, 4) ?? "—", "The date the fund started, when supplied by the data source.")}</dl>{freshness(info)}</> : <p role="status" className="mt-4 text-small text-secondary">{message ?? "Fund overview is unavailable from this source."}</p>}</section><div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">{topHoldings(snapshot?.holdings ?? null, snapshot?.info?.value.holdingsCount ?? null)}{exposure("Sector exposure", "etf-sectors-heading", "How the fund’s investments are distributed across economic sectors. Bars are scaled to the largest shown.", snapshot?.sectors ?? null)}</div>{exposure("Country exposure", "etf-countries-heading", "Investment exposure by country, as reported by the data source. Bars are scaled to the largest shown.", snapshot?.countries ?? null)}</div>;
}

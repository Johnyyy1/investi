"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { Currency } from "@/features/market-data/contracts";
import type { EquityFundamentalsSnapshot } from "@/features/market-data/equity-fundamentals";
import { formatMagnitude, formatMultiple, formatPercent, formatPerShare } from "@/features/instruments/fundamentals-presentation";
import { equityMetricSignal, type EquityMetricId, type MetricSignal } from "@/features/instruments/fundamentals-signals";

type MetricInput = { id: EquityMetricId; label: string; value: string; explanation: string };
type Metric = MetricInput & { signal: MetricSignal };

function group(title: string, metrics: MetricInput[]) {
  return { title, metrics };
}

function dateLabel(value: string) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`)); }

function metricGroups(snapshot: EquityFundamentalsSnapshot, quoteCurrency: Currency) {
  const { valuation: v, profitability: p, financialHealth: h, businessPerformance: b } = snapshot;
  const rawValues: Record<EquityMetricId, number | null> = {
    "market-cap": v.marketCap, pe: v.peTtm, ps: v.psTtm, pb: v.pbTtm, "ev-ebitda": v.evToEbitdaTtm, "p-fcf": v.priceToFcfTtm,
    "gross-margin": p.grossMarginTtm, "operating-margin": p.operatingMarginTtm, "net-margin": p.netMarginTtm, roe: p.roeTtm, roic: p.roicTtm,
    "debt-equity": h.debtToEquityTtm, "current-ratio": h.currentRatioTtm, "net-debt-ebitda": h.netDebtToEbitdaTtm,
    revenue: b.revenueFy, "net-income": b.netIncomeFy, fcf: b.freeCashFlowFy, eps: b.dilutedEpsFy,
  };
  const groups = [
    group("Valuation", [
      { id: "market-cap", label: "Market cap", value: formatMagnitude(v.marketCap, quoteCurrency), explanation: "The market value of all outstanding shares, based on the provider's company profile." },
      { id: "pe", label: "P/E TTM", value: v.peTtmStatus === "not-meaningful" ? "N/M" : formatMultiple(v.peTtm), explanation: "Share price relative to trailing twelve-month earnings per share. N/M means earnings do not support a meaningful ratio." },
      { id: "ps", label: "P/S TTM", value: formatMultiple(v.psTtm), explanation: "Market value relative to trailing twelve-month sales." },
      { id: "pb", label: "P/B TTM", value: formatMultiple(v.pbTtm), explanation: "Share price relative to book value per share." },
      { id: "ev-ebitda", label: "EV / EBITDA TTM", value: formatMultiple(v.evToEbitdaTtm), explanation: "Enterprise value relative to trailing operating earnings before interest, taxes, depreciation and amortization." },
      { id: "p-fcf", label: "Price / FCF TTM", value: formatMultiple(v.priceToFcfTtm), explanation: "Share price relative to trailing free cash flow per share." },
    ]),
    group("Profitability", [
      { id: "gross-margin", label: "Gross margin TTM", value: formatPercent(p.grossMarginTtm), explanation: "The share of trailing revenue left after direct production costs." },
      { id: "operating-margin", label: "Operating margin TTM", value: formatPercent(p.operatingMarginTtm), explanation: "The share of trailing revenue earned from operations." },
      { id: "net-margin", label: "Net margin TTM", value: formatPercent(p.netMarginTtm), explanation: "The share of trailing revenue retained as net income." },
      { id: "roe", label: "ROE TTM", value: formatPercent(p.roeTtm), explanation: "Trailing profit generated relative to shareholders' equity." },
      { id: "roic", label: "ROIC TTM", value: formatPercent(p.roicTtm), explanation: "Trailing operating return on capital invested in the business." },
    ]),
    group("Financial health", [
      { id: "debt-equity", label: "Debt / equity TTM", value: formatMultiple(h.debtToEquityTtm, 2), explanation: "Debt relative to shareholders' equity in the provider's TTM ratio set." },
      { id: "current-ratio", label: "Current ratio TTM", value: formatMultiple(h.currentRatioTtm, 2), explanation: "Current assets relative to current liabilities." },
      { id: "net-debt-ebitda", label: "Net debt / EBITDA TTM", value: formatMultiple(h.netDebtToEbitdaTtm, 2), explanation: "Net debt relative to trailing EBITDA. A negative value can indicate net cash." },
    ]),
    group("Latest fiscal year", [
      { id: "revenue", label: "Revenue FY", value: formatMagnitude(b.revenueFy, b.reportingCurrency), explanation: "Sales reported for the latest available full fiscal year." },
      { id: "net-income", label: "Net income FY", value: formatMagnitude(b.netIncomeFy, b.reportingCurrency), explanation: "Profit reported for the latest available full fiscal year." },
      { id: "fcf", label: "Free cash flow FY", value: formatMagnitude(b.freeCashFlowFy, b.reportingCurrency), explanation: "Operating cash flow less capital expenditure for the same fiscal year." },
      { id: "eps", label: "Diluted EPS FY", value: formatPerShare(b.dilutedEpsFy, b.reportingCurrency), explanation: "Fiscal-year earnings per share after potential share dilution." },
    ]),
  ];
  return groups.map(({ title, metrics }) => ({ title, metrics: metrics.map((metric): Metric => {
    const presentation = equityMetricSignal(metric.id, rawValues[metric.id], metric.id === "pe" && v.peTtmStatus === "not-meaningful" ? "not-meaningful" : undefined, metric.id === "net-debt-ebitda" && h.netDebtToEbitdaIsNetCash);
    return { ...metric, signal: presentation.signal, explanation: [metric.explanation, presentation.context].filter(Boolean).join(" ") };
  }) }));
}

const signalColor: Record<MetricSignal, string> = {
  neutral: "text-foreground", positive: "font-extrabold text-success-strong", caution: "font-extrabold text-danger-strong", unavailable: "text-secondary", "not-meaningful": "text-secondary",
};

const signalDescription: Record<MetricSignal, string> = {
  neutral: "", positive: "Broad reference: positive.", caution: "Broad reference: caution.", unavailable: "Unavailable.", "not-meaningful": "Not meaningful.",
};

export function EquityKeyMetrics({ snapshot, message, quoteCurrency }: { snapshot: EquityFundamentalsSnapshot | null; message: string | null; quoteCurrency: Currency }) {
  const [openMetric, setOpenMetric] = useState<string | null>(null);
  const company = snapshot?.company;
  const classification = [company?.sector, company?.industry, company?.country].filter(Boolean).join(" · ");
  return <section aria-labelledby="key-metrics-heading" className="mt-8 border-t border-border pt-7">
    <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2"><h2 id="key-metrics-heading" className="text-section-title font-bold">Key metrics</h2>{snapshot ? <p className="text-small text-secondary">TTM ratios · latest available financials</p> : null}</div>
    {classification ? <p className="mt-2 text-small text-secondary">{classification}</p> : null}
    {!snapshot ? <p role="status" className="mt-5 text-small text-secondary">{message ?? "Company metrics are unavailable right now."}</p> : <>
      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-2">
        {metricGroups(snapshot, quoteCurrency).map(({ title, metrics }) => <div key={title} className="min-w-0"><h3 className="border-b border-border pb-2 text-microcopy font-bold uppercase tracking-[0.1em] text-secondary">{title}</h3><dl className="divide-y divide-border/70">{metrics.map((metric) => <div key={metric.id} className="grid min-w-0 grid-cols-1 items-start gap-x-4 py-2.5 text-small min-[375px]:grid-cols-[minmax(0,1fr)_auto]"><dt className="min-w-0"><button type="button" aria-expanded={openMetric === metric.id} aria-controls={`metric-help-${metric.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-left text-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary" onClick={() => setOpenMetric(openMetric === metric.id ? null : metric.id)}><span>{metric.label}</span><CircleHelp aria-hidden="true" className="size-3.5 shrink-0 text-primary-hover" /></button><p id={`metric-help-${metric.id}`} hidden={openMetric !== metric.id} className="mt-1 max-w-[26rem] text-microcopy leading-relaxed text-secondary">{metric.explanation}</p></dt><dd data-metric={metric.id} data-signal={metric.signal} className={`break-words text-left font-bold tabular-nums min-[375px]:max-w-[45vw] min-[375px]:text-right sm:max-w-none ${signalColor[metric.signal]}`}>{metric.value}{signalDescription[metric.signal] ? <span className="sr-only"> {signalDescription[metric.signal]}</span> : null}</dd></div>)}</dl></div>)}
      </div>
      <p className="mt-6 text-microcopy leading-relaxed text-secondary">TTM ratios use the latest available trailing twelve months. Market cap comes from the company profile. Fiscal-year figures are reported amounts{snapshot.businessPerformance.fiscalYearEnd ? ` for the year ended ${dateLabel(snapshot.businessPerformance.fiscalYearEnd)}` : ""}{snapshot.businessPerformance.filingDate ? `, filed ${dateLabel(snapshot.businessPerformance.filingDate)}` : ""}.</p>
      <p className="mt-2 text-microcopy leading-relaxed text-secondary">Colors use broad educational reference ranges. They are not investment ratings and can vary by industry.</p>
      {snapshot.provenance.unavailableDatasets.length ? <p role="status" className="mt-2 text-microcopy text-secondary">Some source datasets are unavailable: {snapshot.provenance.unavailableDatasets.join(", ")}. A dash means a value is unavailable; N/M means the ratio is not meaningful.</p> : <p className="mt-2 text-microcopy text-secondary">A dash means a value is unavailable; N/M means the ratio is not meaningful.</p>}
    </>}
  </section>;
}

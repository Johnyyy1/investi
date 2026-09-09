"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LearningButton } from "@/components/learning/learning-button";
import { FinanceInput } from "@/components/learning/finance-input";
import { AnswerOption } from "@/components/learning/answer-option";
import { parsePrice } from "@/features/finance/returns";
import { portfolioWeightedReturn } from "@/features/finance/foundations";
import { calculateBacktestMetrics, selectMonthlySample } from "@/features/lab/backtest";
import { syntheticMonthlyData } from "@/features/lab/sample-data";
import type { ComparisonPoint } from "./backtest-chart";
const BacktestChart = dynamic(() => import("./backtest-chart").then((module) => module.BacktestChart), { loading: () => <p role="status" className="flex h-64 items-center text-ql-small text-ql-secondary">Loading chart…</p> });
const strategies = [
  { id: "mixed", name: "60 / 30 / 10 mix", weights: [0.6, 0.3, 0.1] },
  { id: "stocks", name: "100% stock-like sample", weights: [1, 0, 0] },
  { id: "bonds", name: "100% bond-like sample", weights: [0, 1, 0] },
];
const years = Array.from({ length: 11 }, (_, index) => 2015 + index);
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;
type Result = { metrics: ReturnType<typeof calculateBacktestMetrics>; benchmark: ReturnType<typeof calculateBacktestMetrics>; points: ComparisonPoint[]; label: string; period: string; amount: number };
const selectClass = "mt-2 min-h-12 w-full rounded-ql-md border border-ql-control bg-ql-surface px-3 text-ql-body";

export function BacktestingLab() {
  const [strategy, setStrategy] = useState("mixed");
  const [start, setStart] = useState(2015), [end, setEnd] = useState(2025);
  const [amount, setAmount] = useState("100000");
  const [result, setResult] = useState<Result>();
  const [dirty, setDirty] = useState(false), [error, setError] = useState<string>();
  const [answer, setAnswer] = useState<string>(), [checked, setChecked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  function run() {
    try {
      const rows = selectMonthlySample(syntheticMonthlyData, start, end);
      const selected = strategies.find((item) => item.id === strategy);
      if (!selected) throw new Error("Choose an available sample.");
      const initial = parsePrice(amount, "Initial amount");
      const metrics = calculateBacktestMetrics(initial, rows.map((row) => portfolioWeightedReturn(selected.weights, [row.stocks, row.bonds, row.cash])));
      const benchmark = calculateBacktestMetrics(initial, rows.map((row) => row.stocks));
      const labels = [`${start - 1}-12`, ...rows.map((row) => row.month)];
      setResult({ metrics, benchmark, points: labels.map((label, index) => ({ label, value: metrics.values[index], benchmark: benchmark.values[index] })), label: selected.name, period: `Jan ${start} – Dec ${end}`, amount: initial });
      setDirty(false); setError(undefined); setAnswer(undefined); setChecked(false);
      requestAnimationFrame(() => heading.current?.focus());
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This sample could not be calculated. Try another period."); }
  }
  return <>
    <form onSubmit={(event) => { event.preventDefault(); run(); }} className="mt-8 grid gap-5 rounded-ql-lg bg-ql-surface p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
      <div><label htmlFor="strategy" className="text-ql-small font-semibold">Asset mix</label><select id="strategy" className={selectClass} value={strategy} onChange={(event) => { setStrategy(event.target.value); setDirty(true); }}>{strategies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="grid grid-cols-1 gap-3 min-[375px]:grid-cols-2"><div><label htmlFor="start-year" className="block text-ql-small font-semibold">From January</label><select id="start-year" className={selectClass} value={start} onChange={(event) => { setStart(Number(event.target.value)); setDirty(true); }}>{years.map((year) => <option key={year}>{year}</option>)}</select></div><div><label htmlFor="end-year" className="block text-ql-small font-semibold">To December</label><select id="end-year" className={selectClass} value={end} onChange={(event) => { setEnd(Number(event.target.value)); setDirty(true); }}>{years.map((year) => <option key={year}>{year}</option>)}</select></div></div>
      <FinanceInput label="Initial amount" suffix="Kč" value={amount} onValueChange={(value) => { setAmount(value); setDirty(true); }} />
      <LearningButton type="submit" className="self-end">Run backtest</LearningButton>
      {error && <p role="alert" className="text-ql-small text-ql-danger-ink sm:col-span-2 lg:col-span-4">{error}</p>}
    </form>
    {result ? <section className="mt-10" aria-label="Backtest result">
      <h2 ref={heading} tabIndex={-1} className="text-ql-section font-semibold">{result.label}</h2><p className="mt-2 text-ql-small text-ql-secondary">{result.period} · Starting with {result.amount.toLocaleString("en-GB")} Kč · Demo data</p>
      {dirty && <p role="status" className="mt-3 text-ql-small text-ql-warning-ink">Inputs changed. Run the backtest to update this result.</p>}
      <dl className="my-8 grid grid-cols-1 gap-x-5 gap-y-7 border-y border-ql-border py-7 min-[375px]:grid-cols-2 lg:grid-cols-4">{[
        ["Final value", `${Math.round(result.metrics.finalValue).toLocaleString("en-GB")} Kč`, "What the starting amount grew into."],
        ["CAGR", percent(result.metrics.cagr), "The steady yearly rate that would reach this ending value."],
        ["Max drawdown", percent(result.metrics.maxDrawdown), "The largest drop from a previous peak, at month ends."],
        ["Volatility", percent(result.metrics.volatility), "Annualized variability of monthly returns; not every kind of risk."],
      ].map(([label, value, explanation]) => <div key={label} className="min-w-0"><dt className="text-ql-small text-ql-secondary">{label}</dt><dd className="mt-2 break-words text-ql-title font-bold sm:text-ql-section" data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`}>{value}</dd><dd className="mt-2 text-ql-small text-ql-secondary">{explanation}</dd></div>)}</dl>
      <BacktestChart data={result.points} />
      <p className="mt-5 text-ql-body text-ql-secondary">The stock-like benchmark finishes at {Math.round(result.benchmark.finalValue).toLocaleString("en-GB")} Kč, with a {percent(result.benchmark.maxDrawdown)} maximum drawdown. A higher ending value does not tell you how difficult the journey was.</p>
      <section className="mt-10 max-w-2xl border-t border-ql-border pt-7" aria-labelledby="lab-question"><h3 id="lab-question" className="text-ql-title font-semibold">Which metric shows the largest fall from a previous peak?</h3><fieldset className="mt-5 space-y-3"><legend className="sr-only">Choose a metric</legend>{["CAGR", "Max drawdown", "Volatility"].map((value) => <AnswerOption key={value} name="backtest-question" value={value} checked={answer === value} disabled={checked} onChange={setAnswer}>{value}</AnswerOption>)}</fieldset><LearningButton variant="secondary" className="mt-4" disabled={!answer || checked} onClick={() => setChecked(true)}>Check answer</LearningButton>{checked && <p role="status" className="mt-4 text-ql-body text-ql-success-ink">{answer === "Max drawdown" ? "That’s right." : "Look at max drawdown."} It tracks the largest peak-to-trough loss. CAGR describes the start and end; volatility describes fluctuations.</p>}</section>
    </section> : <section className="mt-10 max-w-2xl"><h2 className="text-ql-section font-semibold">A rising line can hide a rough journey.</h2><p className="mt-3 text-ql-body text-ql-secondary">Run the sample to compare a mix of stocks, bonds, and cash with the stock-like benchmark. Then try a shorter period.</p></section>}
    <details className="mt-10 border-t border-ql-border pt-4 text-ql-small text-ql-secondary"><summary className="flex min-h-12 cursor-pointer items-center text-ql-link">Data &amp; calculation assumptions</summary><div className="mt-3 max-w-3xl space-y-3"><p>Demo data: all returns are synthetic, authored for investi. The 2015–2025 dates label an invented sequence. These are not live prices or historical market returns.</p><p>Monthly simple total-return assumptions, with reinvestment. The mix resets to its weights each month, without transaction costs. No deposits, withdrawals, fees, tax, inflation, or currency effects. Kč is a display unit, not a currency conversion.</p><p>CAGR uses the number of monthly intervals divided by 12. Volatility is sample standard deviation (n − 1), multiplied by √12. Drawdown includes the initial investment and uses month-end values, so it cannot capture larger intra-month falls. Missing, duplicate, or invalid observations are rejected. These simplified measures do not forecast future outcomes.</p></div></details>
  </>;
}

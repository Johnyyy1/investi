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
import { Select } from "@/components/ui/form-controls";
import { formatPercentage } from "@/lib/formatters";
import type { ComparisonPoint } from "./backtest-chart";
const BacktestChart = dynamic(() => import("./backtest-chart").then((module) => module.BacktestChart), { loading: () => <p role="status" className="flex h-64 items-center text-ql-small text-ql-secondary">Načítám graf…</p> });
const strategies = [
  { id: "mixed", name: "Mix 60 / 30 / 10", weights: [0.6, 0.3, 0.1] },
  { id: "stocks", name: "100 % akciový vzorek", weights: [1, 0, 0] },
  { id: "bonds", name: "100 % dluhopisový vzorek", weights: [0, 1, 0] },
];
const years = Array.from({ length: 11 }, (_, index) => 2015 + index);
const percent = (value: number) => formatPercentage(value);
type Result = { metrics: ReturnType<typeof calculateBacktestMetrics>; benchmark: ReturnType<typeof calculateBacktestMetrics>; points: ComparisonPoint[]; label: string; period: string; amount: number };
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
      if (!selected) throw new Error("Vyber dostupný vzorek.");
      const initial = parsePrice(amount, "Počáteční částka");
      const metrics = calculateBacktestMetrics(initial, rows.map((row) => portfolioWeightedReturn(selected.weights, [row.stocks, row.bonds, row.cash])));
      const benchmark = calculateBacktestMetrics(initial, rows.map((row) => row.stocks));
      const labels = [`${start - 1}-12`, ...rows.map((row) => row.month)];
      setResult({ metrics, benchmark, points: labels.map((label, index) => ({ label, value: metrics.values[index], benchmark: benchmark.values[index] })), label: selected.name, period: `Jan ${start} – Dec ${end}`, amount: initial });
      setDirty(false); setError(undefined); setAnswer(undefined); setChecked(false);
      requestAnimationFrame(() => heading.current?.focus());
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vzorek se nepodařilo spočítat. Zkus jiné období."); }
  }
  return <>
    <form onSubmit={(event) => { event.preventDefault(); run(); }} className="mt-8 grid gap-5 rounded-ql-lg bg-ql-surface p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
      <div><label htmlFor="strategy" className="text-ql-small font-semibold">Strategie</label><Select id="strategy" className="mt-2" value={strategy} onChange={(event) => { setStrategy(event.target.value); setDirty(true); }}>{strategies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
      <div className="grid grid-cols-1 gap-3 min-[375px]:grid-cols-2"><div><label htmlFor="start-year" className="block text-ql-small font-semibold">Od ledna</label><Select id="start-year" className="mt-2" value={start} onChange={(event) => { setStart(Number(event.target.value)); setDirty(true); }}>{years.map((year) => <option key={year}>{year}</option>)}</Select></div><div><label htmlFor="end-year" className="block text-ql-small font-semibold">Do prosince</label><Select id="end-year" className="mt-2" value={end} onChange={(event) => { setEnd(Number(event.target.value)); setDirty(true); }}>{years.map((year) => <option key={year}>{year}</option>)}</Select></div></div>
      <FinanceInput label="Počáteční částka" suffix="Kč" value={amount} onValueChange={(value) => { setAmount(value); setDirty(true); }} />
      <LearningButton type="submit" className="self-end">Spustit backtest</LearningButton>
      {error && <p role="alert" className="text-ql-small text-ql-danger-ink sm:col-span-2 lg:col-span-4">{error}</p>}
    </form>
    {result ? <section className="mt-10" aria-label="Výsledek backtestu">
      <h2 ref={heading} tabIndex={-1} className="text-ql-section font-semibold">{result.label}</h2><p className="mt-2 text-ql-small text-ql-secondary">{result.period} · Počáteční částka {result.amount.toLocaleString("cs-CZ")} Kč · Ukázková data</p>
      {dirty && <p role="status" className="mt-3 text-ql-small text-ql-warning-ink">Vstupy se změnily. Spusť backtest znovu a aktualizuj výsledek.</p>}
      <dl className="my-8 grid grid-cols-1 gap-x-5 gap-y-7 border-y border-ql-border py-7 min-[375px]:grid-cols-2 lg:grid-cols-4">{[
        ["Konečná hodnota", `${Math.round(result.metrics.finalValue).toLocaleString("cs-CZ")} Kč`, "Na jakou hodnotu počáteční částka vyrostla."],
        ["CAGR", percent(result.metrics.cagr), "Stálé roční tempo, které by vedlo ke konečné hodnotě."],
        ["Maximální drawdown", percent(result.metrics.maxDrawdown), "Největší pokles od předchozího maxima na konci měsíce."],
        ["Volatilita", percent(result.metrics.volatility), "Anualizovaná proměnlivost měsíčních výnosů; ne každý typ rizika."],
      ].map(([label, value, explanation]) => <div key={label} className="min-w-0"><dt className="text-ql-small text-ql-secondary">{label}</dt><dd className="mt-2 break-words text-ql-title font-bold sm:text-ql-section" data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`}>{value}</dd><dd className="mt-2 text-ql-small text-ql-secondary">{explanation}</dd></div>)}</dl>
      <BacktestChart data={result.points} />
      <p className="mt-5 text-ql-body text-ql-secondary">Akciový srovnávací index končí na {Math.round(result.benchmark.finalValue).toLocaleString("cs-CZ")} Kč s maximálním drawdownem {percent(result.benchmark.maxDrawdown)}. Vyšší konečná hodnota sama o sobě neříká, jak náročná byla cesta.</p>
      <section className="mt-10 max-w-2xl border-t border-ql-border pt-7" aria-labelledby="lab-question"><h3 id="lab-question" className="text-ql-title font-semibold">Která metrika ukazuje největší pokles od předchozího maxima?</h3><fieldset className="mt-5 space-y-3"><legend className="sr-only">Vyber metriku</legend>{["CAGR", "Maximální drawdown", "Volatilita"].map((value) => <AnswerOption key={value} name="backtest-question" value={value} checked={answer === value} disabled={checked} onChange={setAnswer}>{value}</AnswerOption>)}</fieldset><LearningButton variant="secondary" className="mt-4" disabled={!answer || checked} onClick={() => setChecked(true)}>Zkontrolovat odpověď</LearningButton>{checked && <p role="status" className="mt-4 text-ql-body text-ql-success-ink">{answer === "Maximální drawdown" ? "Správně." : "Zaměř se na maximální drawdown."} Sleduje největší pokles od vrcholu ke dnu. CAGR popisuje začátek a konec; volatilita popisuje kolísání.</p>}</section>
    </section> : <section className="mt-10 max-w-2xl"><h2 className="text-ql-section font-semibold">Rostoucí křivka může skrývat náročnou cestu.</h2><p className="mt-3 text-ql-body text-ql-secondary">Spusť vzorek a porovnej mix akcií, dluhopisů a hotovosti s akciovým benchmarkem. Pak zkus kratší období.</p></section>}
    <details className="mt-10 border-t border-ql-border pt-4 text-ql-small text-ql-secondary"><summary className="flex min-h-12 cursor-pointer items-center text-ql-link">Data a předpoklady výpočtu</summary><div className="mt-3 max-w-3xl space-y-3"><p>Ukázková data: všechny výnosy jsou syntetické a vytvořené pro investi. Data 2015–2025 označují vymyšlenou posloupnost. Nejde o živé ceny ani historické tržní výnosy.</p><p>Výpočty používají měsíční jednoduché předpoklady celkového výnosu s reinvesticí. Mix se každý měsíc vrací k cílovému rozložení bez transakčních nákladů. Nezahrnují se vklady, výběry, poplatky, daně, inflace ani měnové vlivy. Kč je zobrazovací jednotka, nejde o převod měny.</p><p>CAGR používá počet měsíčních intervalů dělený 12. Volatilita je výběrová směrodatná odchylka (n − 1) násobená √12. Drawdown zahrnuje počáteční investici a používá hodnoty na konci měsíce, takže nezachytí větší poklesy uvnitř měsíce. Chybějící, duplicitní nebo neplatná pozorování se odmítají. Tyto zjednodušené metriky nepředpovídají budoucí výsledky.</p></div></details>
  </>;
}

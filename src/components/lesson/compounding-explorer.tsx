"use client";

import { useMemo, useRef, useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { MetricResult } from "@/components/learning/metric-result";
import { LearningChart } from "@/components/learning/learning-chart";
import { LearningButton } from "@/components/learning/learning-button";
import { ConceptCard } from "@/components/learning/concept-card";
import { FinancialInputError, compoundPeriods, compoundValue, cumulativeReturn, parsePrice } from "@/features/finance/returns";

function formatValue(value: number) { return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
function formatPercent(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`; }
function parsePercent(value: string, period: number) {
  if (value.trim() === "") throw new FinancialInputError(`Period ${period} return is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new FinancialInputError(`Period ${period} return must be a number.`);
  if (parsed < -100) throw new FinancialInputError(`Period ${period} return cannot be below -100%.`);
  return parsed / 100;
}

export function CompoundingExplorer() {
  const [startValue, setStartValue] = useState("10000");
  const [returnInputs, setReturnInputs] = useState(["20", "-20"]);
  const addRef = useRef<HTMLButtonElement>(null);
  const result = useMemo(() => {
    try {
      const start = parsePrice(startValue, "Starting value");
      const returns = returnInputs.map((value, index) => parsePercent(value, index + 1));
      const periods = compoundPeriods(start, returns);
      return { start, returns, periods, endingValue: compoundValue(start, returns), cumulative: cumulativeReturn(returns), arithmetic: returns.reduce((sum, value) => sum + value, 0) };
    } catch (error) { return { error: error instanceof FinancialInputError ? error.message : "Enter valid values." }; }
  }, [returnInputs, startValue]);
  function updateReturn(index: number, value: string) { setReturnInputs((current) => current.map((item, itemIndex) => itemIndex === index ? value : item)); }
  return <section aria-labelledby="compounding-explorer-heading" className="space-y-6">
    <div><h3 id="compounding-explorer-heading" className="text-ql-title font-semibold">Compounding explorer</h3><p className="mt-2 text-ql-small text-ql-secondary">Edit two to five returns. Each period applies to the value left by the previous period.</p></div>
    <FinanceInput label="Starting value" mode="currency" value={startValue} onValueChange={setStartValue} hint="Use any consistent currency unit." aria-describedby={"error" in result ? "compounding-error" : undefined} />
    <div className="grid gap-5 sm:grid-cols-2">{returnInputs.map((value, index) => <div key={index}>
      <FinanceInput label={`Period ${index + 1} return`} mode="percentage" value={value} onValueChange={(value) => updateReturn(index, value)} aria-describedby={"error" in result ? "compounding-error" : undefined} />
      {returnInputs.length > 2 ? <LearningButton variant="ghost" className="mt-2" aria-label={`Remove period ${index + 1}`} onClick={() => { setReturnInputs((current) => current.filter((_, itemIndex) => itemIndex !== index)); addRef.current?.focus(); }}>Remove</LearningButton> : null}
    </div>)}</div>
    <LearningButton ref={addRef} variant="secondary" disabled={returnInputs.length >= 5} onClick={() => setReturnInputs((current) => [...current, "0"])}>Add period</LearningButton>
    {"error" in result ? <p id="compounding-error" role="alert" className="text-ql-small text-ql-danger-ink">{result.error}</p> : <>
      <div aria-live="polite" aria-atomic="true" className="grid gap-6 border-y border-ql-border py-6 sm:grid-cols-2">
        <MetricResult label="Initial value" value={formatValue(result.start)} />
        <MetricResult label="Final value" value={formatValue(result.endingValue)} />
        <MetricResult label="Arithmetic sum" value={formatPercent(result.arithmetic)} note="Adds period returns; not the total performance." />
        <MetricResult label="Cumulative return" value={formatPercent(result.cumulative)} sentiment={result.cumulative >= 0 ? "positive" : "negative"} note="Multiplies growth factors; the actual total return." />
      </div>
      <LearningChart title="Value through each period" description="Each point becomes the next period’s starting value." valueLabel="Investment value" data={[{ label: "Start", value: result.start }, ...result.periods.map((period) => ({ label: `Period ${period.period}`, value: period.endValue }))]} formatValue={(value) => value.toLocaleString("en-US", { maximumFractionDigits: 2 })} />
      <details className="text-ql-small"><summary className="cursor-pointer py-3 text-ql-link">Follow the calculation</summary><ol className="space-y-4">{result.periods.map((period) => <li key={period.period} className="border-t border-ql-border pt-4"><p className="font-semibold">Period {period.period} · {formatPercent(period.returnValue)}</p><p className="mt-2 break-words text-ql-secondary">Starting value {formatValue(period.startValue)} → ending value {formatValue(period.endValue)}</p><p className="mt-1 text-ql-secondary">Gain / loss: {formatValue(period.change)}</p></li>)}</ol></details>
      <ConceptCard title="Addition and compounding answer different questions">The arithmetic sum ignores the changing base. With +20% then −20%, the sum is 0%, but 10,000 becomes 9,600: a −4% cumulative return.</ConceptCard>
    </>}
  </section>;
}

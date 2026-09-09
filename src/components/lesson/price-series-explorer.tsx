"use client";

import { useMemo, useState } from "react";
import { LearningChart } from "@/components/learning/learning-chart";
import { LearningButton } from "@/components/learning/learning-button";
import { ConceptCard } from "@/components/learning/concept-card";
import { absoluteChange, consecutiveSimpleReturns } from "@/features/finance/returns";

const prices = [
  { date: "Day 0", price: 100 },
  { date: "Day 1", price: 105 },
  { date: "Day 2", price: 102 },
  { date: "Day 3", price: 108 },
] as const;

function formatPrice(value: number) { return value.toFixed(2); }
function formatChange(value: number) { return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`; }
function formatReturn(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`; }

export function PriceSeriesExplorer() {
  const [activePeriod, setActivePeriod] = useState(0);
  const returns = useMemo(() => consecutiveSimpleReturns(prices.map((point) => point.price)), []);
  const current = prices[activePeriod + 1];
  const previous = prices[activePeriod];
  const currentChange = absoluteChange(previous.price, current.price);
  const currentReturn = returns[activePeriod];
  return <section aria-label="Daily return explorer" className="min-w-0 space-y-6">
    <LearningChart data={prices.map((point) => ({ label: point.date, value: point.price }))} title="Daily prices" description={`Selected interval: ${previous.date} to ${current.date}. Inspect a period below to see its calculation.`} valueLabel="Price" formatValue={formatPrice} yDomain={[95, 110]} />
    <div className="overflow-x-auto rounded-ql-md border border-ql-border" tabIndex={0} role="region" aria-label="Daily returns table; scroll for all columns"><table className="w-full min-w-[30rem] text-left text-ql-small"><caption className="sr-only">Prices, daily changes and simple returns</caption><thead className="bg-ql-subtle"><tr>{["Date", "Price", "Change", "Return", "Period"].map((label) => <th key={label} scope="col" className="p-3 font-semibold">{label}</th>)}</tr></thead><tbody>{prices.map((point, index) => {
      const periodIndex = index - 1;
      const value = index === 0 ? undefined : returns[periodIndex];
      const change = index === 0 ? undefined : absoluteChange(prices[index - 1].price, point.price);
      return <tr key={point.date} className={periodIndex === activePeriod ? "bg-ql-blue-50" : "border-t border-ql-border"}><th scope="row" className="p-3 font-semibold">{point.date}</th><td className="p-3 tabular-nums">{formatPrice(point.price)}</td><td className="p-3 tabular-nums">{change === undefined ? "—" : formatChange(change)}</td><td className="p-3 tabular-nums">{value === undefined ? "—" : formatReturn(value)}</td><td className="p-3">{periodIndex >= 0 ? <LearningButton variant="ghost" className="px-3" aria-label={`Inspect ${point.date}`} aria-pressed={periodIndex === activePeriod} onClick={() => setActivePeriod(periodIndex)}>Inspect</LearningButton> : "—"}</td></tr>;
    })}</tbody></table></div>
    <div aria-live="polite"><ConceptCard title={`${previous.date} → ${current.date}`}><p>{formatPrice(previous.price)} → {formatPrice(current.price)}</p><p className="mt-3">Previous price {formatPrice(previous.price)} is the denominator. The change is {formatChange(currentChange)}, so the return is {formatReturn(currentReturn)}.</p></ConceptCard></div>
  </section>;
}

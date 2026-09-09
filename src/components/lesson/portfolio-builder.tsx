"use client";

import { useId, useState } from "react";
import { ConceptCard } from "@/components/learning/concept-card";
import { FinanceInput } from "@/components/learning/finance-input";
import { MetricResult } from "@/components/learning/metric-result";
import { FinancialInputError, parsePrice } from "@/features/finance/returns";
import { portfolioWeightedReturn, validatePortfolioWeights } from "@/features/finance/foundations";

const assets = [
  { id: "stocks", label: "Stocks", color: "bg-ql-blue-500" },
  { id: "bonds", label: "Bonds", color: "bg-ql-warning" },
  { id: "cash", label: "Cash", color: "bg-ql-success" },
] as const;
type AssetId = typeof assets[number]["id"];
type Inputs = Record<AssetId, string>;

const presets: { label: string; allocation: Inputs }[] = [
  { label: "100% stocks", allocation: { stocks: "100", bonds: "0", cash: "0" } },
  { label: "60 / 30 / 10 example", allocation: { stocks: "60", bonds: "30", cash: "10" } },
];

const formatPercent = (value: number, maximumFractionDigits = 2) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("en-IE", { maximumFractionDigits })}%`;

function parseAllocations(values: Inputs) {
  const errors: Partial<Record<AssetId, string>> = {};
  const percentages = assets.map(({ id, label }) => {
    try {
      const value = parsePrice(values[id], `${label} allocation`);
      if (value < 0 || value > 100) throw new FinancialInputError(`${label} allocation must be from 0% to 100%.`);
      return value;
    } catch (cause) {
      errors[id] = cause instanceof Error ? cause.message : "Enter a valid allocation.";
      return undefined;
    }
  });
  return { errors, percentages };
}

export function PortfolioBuilder() {
  const [allocations, setAllocations] = useState<Inputs>(presets[1].allocation);
  const [returns, setReturns] = useState<Inputs>({ stocks: "8", bonds: "2", cash: "0" });
  const allocationErrorId = useId();
  const returnErrorId = useId();
  const parsed = parseAllocations(allocations);
  const completeAllocations = parsed.percentages.every((value): value is number => value !== undefined);
  const allocationPercentages = completeAllocations ? parsed.percentages as number[] : undefined;
  const total = allocationPercentages ? allocationPercentages.reduce((sum, value) => sum + value, 0) : undefined;
  const remaining = total === undefined ? undefined : 100 - total;
  let allocationMessage = "Enter a valid percentage for each asset.";
  let valid = false;
  if (completeAllocations) {
    try {
      validatePortfolioWeights(allocationPercentages!.map((value) => value / 100));
      valid = true;
      allocationMessage = "Ready · allocation equals 100%.";
    } catch {
      allocationMessage = remaining! > 0 ? `Allocate the remaining ${formatPercent(remaining!, 4).replace("+", "")}.` : `Reduce the allocation by ${formatPercent(Math.abs(remaining!), 4).replace("+", "")}.`;
    }
  }

  const returnErrors: Partial<Record<AssetId, string>> = {};
  const parsedReturns = assets.map(({ id, label }) => {
    try {
      const value = parsePrice(returns[id], `${label} return`);
      if (value < -100) throw new FinancialInputError(`${label} return cannot be below −100%.`);
      return value;
    } catch (cause) {
      returnErrors[id] = cause instanceof Error ? cause.message : "Enter a valid return.";
      return undefined;
    }
  });
  const completeReturns = parsedReturns.every((value): value is number => value !== undefined);
  const portfolioReturn = valid && completeReturns ? portfolioWeightedReturn(allocationPercentages!.map((value) => value / 100), parsedReturns.map((value) => value / 100)) * 100 : undefined;

  function setAllocation(id: AssetId, value: string) {
    setAllocations((current) => ({ ...current, [id]: value }));
  }
  function setReturn(id: AssetId, value: string) {
    setReturns((current) => ({ ...current, [id]: value }));
  }

  return <section aria-label="Portfolio Builder" className="min-w-0 space-y-8">
    <div>
      <h3 className="text-ql-title font-semibold">Portfolio Builder</h3>
      <p className="mt-2 text-ql-body text-ql-secondary">Set how much of this hypothetical portfolio belongs to each asset category. This is an educational sandbox, not a suggested allocation.</p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Load an allocation example">
      {presets.map((preset) => {
        const selected = assets.every(({ id }) => allocations[id] === preset.allocation[id]);
        return <button key={preset.label} type="button" aria-pressed={selected} onClick={() => setAllocations(preset.allocation)} className={`min-h-12 rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${selected ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{preset.label}</button>;
      })}
    </div>

    <div className="space-y-6">
      {assets.map((asset, index) => {
        const sliderValue = parsed.percentages[index] ?? 0;
        return <div key={asset.id} className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start">
          <div className="min-w-0">
            <label htmlFor={`${allocationErrorId}-${asset.id}-slider`} className="mb-2 flex items-center gap-2 text-ql-small font-semibold"><span aria-hidden="true" className={`h-3 w-3 rounded-full ${asset.color}`} />{asset.label}</label>
            <input id={`${allocationErrorId}-${asset.id}-slider`} aria-label={`${asset.label} allocation slider`} type="range" min="0" max="100" step="1" value={sliderValue} onChange={(event) => setAllocation(asset.id, event.target.value)} className="min-h-12 w-full cursor-pointer accent-ql-link" />
          </div>
          <FinanceInput label={`${asset.label} allocation`} mode="percentage" value={allocations[asset.id]} onValueChange={(value) => setAllocation(asset.id, value)} error={parsed.errors[asset.id]} />
        </div>;
      })}
    </div>

    {completeAllocations ? <div role="img" className="h-6 overflow-hidden rounded-ql-full bg-ql-subtle" aria-label={`Portfolio allocation: ${assets.map((asset, index) => `${asset.label} ${parsed.percentages[index]}%`).join(", ")}`}>
      <div className="flex h-full min-w-0">
        {assets.map((asset, index) => <span key={asset.id} title={`${asset.label}: ${parsed.percentages[index]}%`} aria-hidden="true" className={`h-full shrink-0 ${asset.color}`} style={{ width: `${parsed.percentages[index]}%` }} />)}
      </div>
    </div> : null}

    <div aria-live="polite" aria-atomic="true" className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-2">
      <MetricResult label="Total allocation" value={total === undefined ? "—" : `${total.toLocaleString("en-IE", { maximumFractionDigits: 4 })}%`} />
      <MetricResult label="Remaining allocation" value={remaining === undefined ? "—" : `${remaining.toLocaleString("en-IE", { maximumFractionDigits: 4 })}%`} sentiment={remaining === 0 ? "positive" : "negative"} />
      <p id={allocationErrorId} role="status" className={`sm:col-span-2 text-ql-small ${valid ? "text-ql-success-ink" : "text-ql-danger-ink"}`}>{allocationMessage}</p>
    </div>

    <div className="space-y-5">
      <div>
        <h4 className="text-ql-title font-semibold">Test one hypothetical period</h4>
        <p className="mt-2 text-ql-small text-ql-secondary">These inputs are invented for learning. They are not expected returns, market forecasts, or guarantees.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Load hypothetical return inputs">
        <button type="button" onClick={() => setReturns({ stocks: "8", bonds: "2", cash: "0" })} className="min-h-12 rounded-ql-md border border-ql-border px-4 py-3 text-left text-ql-small font-semibold hover:bg-ql-subtle">Stocks +8% example</button>
        <button type="button" onClick={() => setReturns({ stocks: "-10", bonds: "2", cash: "0" })} className="min-h-12 rounded-ql-md border border-ql-border px-4 py-3 text-left text-ql-small font-semibold hover:bg-ql-subtle">Stocks fall −10%</button>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {assets.map((asset) => <FinanceInput key={asset.id} label={`${asset.label} hypothetical return`} mode="percentage" value={returns[asset.id]} onValueChange={(value) => setReturn(asset.id, value)} error={returnErrors[asset.id]} />)}
      </div>
      {Object.keys(returnErrors).length ? <p id={returnErrorId} role="alert" className="text-ql-small text-ql-danger-ink">Use finite returns; a one-period return cannot be below −100%.</p> : portfolioReturn === undefined ? <ConceptCard title="Finish the allocation first">The weighted-return result appears only when every allocation is valid and the total equals exactly 100%.</ConceptCard> : <div aria-live="polite" aria-atomic="true" className="space-y-4 border-y border-ql-border py-6">
        <MetricResult label="Hypothetical one-period portfolio return" value={formatPercent(portfolioReturn, 4)} sentiment={portfolioReturn > 0 ? "positive" : portfolioReturn < 0 ? "negative" : "neutral"} />
        <p className="break-words text-ql-small text-ql-secondary">{assets.map((asset, index) => `${parsed.percentages[index]}% × ${formatPercent(parsedReturns[index]!, 4)}`).join(" + ")} = {formatPercent(portfolioReturn, 4)}</p>
      </div>}
    </div>
  </section>;
}
